// src/pages/TabPrec.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
  collection,
  query,
  orderBy,
  limit,
  getDocs,
  doc,
  setDoc,
  getDoc,
} from "firebase/firestore";
import { db } from "../firebase";

/* -------------------- Constantes e helpers -------------------- */

const NOME_PRODUTO = {
  brw7x7: "BRW 7x7",
  brw6x6: "BRW 6x6",
  pkt5x5: "PKT 5x5",
  pkt6x6: "PKT 6x6",
  esc: "Escondidinho",
};
const ORDEM = ["brw7x7", "brw6x6", "pkt5x5", "pkt6x6", "esc"];

const DEFAULT_PRECOS = {
  brw7x7: { rev1: 6.0, rev2: 6.0, rev3: null },
  brw6x6: { rev1: 5.5, rev2: 5.5, rev3: null },
  pkt5x5: { rev1: 3.9, rev2: 3.9, rev3: null },
  pkt6x6: { rev1: 4.4, rev2: 4.4, rev3: null },
  esc: { rev1: 4.65, rev2: 4.65, rev3: null },
};

const baseFont = 20; // fonte maior, conforme solicitado

function toNumberLoose(v) {
  if (v === "" || v === null || v === undefined) return null;
  const n = Number(String(v).replace(",", ".").trim());
  return Number.isFinite(n) ? n : null;
}

// formata "BR" (6,00)
function fmt2BR(v) {
  const n = toNumberLoose(v);
  if (n === null) return "";
  return n.toFixed(2).replace(".", ",");
}

function hojeISO() {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}

const withTimeout = (p, ms = 20000) =>
  Promise.race([
    p,
    new Promise((_, rej) =>
      setTimeout(() => rej(new Error("Tempo esgotado.")), ms)
    ),
  ]);

// normaliza qualquer documento vindo do Firestore (formato novo ou antigo)
function normalizarPrecosDoFirestore(val) {
  const base = JSON.parse(JSON.stringify(DEFAULT_PRECOS));
  const fonte =
    val && typeof val.precos === "object" ? val.precos : val || {};
  for (const k of ORDEM) {
    base[k] = {
      rev1: toNumberLoose(fonte?.[k]?.rev1 ?? base[k].rev1),
      rev2: toNumberLoose(fonte?.[k]?.rev2 ?? base[k].rev2),
      rev3: toNumberLoose(fonte?.[k]?.rev3 ?? base[k].rev3),
    };
  }
  return base;
}

/* -------------------- Componente -------------------- */

export default function TabPrec({ setTela }) {
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const [ok, setOk] = useState("");

  const [docId, setDocId] = useState("");
  const [vigencia, setVigencia] = useState(hojeISO());
  const [precos, setPrecos] = useState(DEFAULT_PRECOS);
  const [edit, setEdit] = useState({});

  const linhas = useMemo(() => ORDEM, []);

  // Busca: tenta por 'data'. Se vazio/falha, tenta por ID do doc.
  async function carregarUltima() {
    if (salvando) return;
    setCarregando(true);
    setErro("");
    setOk("");
    setEdit({});

    try {
      let docData = null;

      // 1) orderBy('data')
      try {
        const q1 = query(
          collection(db, "tabela_precos_revenda"),
          orderBy("data", "desc"),
          limit(1)
        );
        const s1 = await withTimeout(getDocs(q1));
        if (!s1.empty) {
          const d = s1.docs[0];
          docData = { id: d.id, val: d.data() || {} };
        }
      } catch {
        // ignora e cai no fallback
      }

      // 2) fallback por ID
      if (!docData) {
        const q2 = query(
          collection(db, "tabela_precos_revenda"),
          orderBy("__name__", "desc"),
          limit(1)
        );
        const s2 = await withTimeout(getDocs(q2));
        if (!s2.empty) {
          const d = s2.docs[0];
          docData = { id: d.id, val: d.data() || {} };
        }
      }

      if (!docData) {
        // Sem documentos: mantém defaults e pede para salvar
        setDocId("");
        setVigencia(hojeISO());
        setPrecos({ ...DEFAULT_PRECOS });
        setOk("Sem registros. Preencha e salve uma nova vigência.");
        return;
      }

      const { id, val } = docData;
      setDocId(id);
      setVigencia(val?.data || id || hojeISO());
      setPrecos(normalizarPrecosDoFirestore(val));
      setOk("Última tabela carregada.");
    } catch (e) {
      setErro(e?.message || String(e));
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregarUltima();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // edição local controlada
  const keyOf = (k, campo) => `${k}.${campo}`;
  function onChangeEdit(k, campo, v) {
    setEdit((e) => ({ ...e, [keyOf(k, campo)]: v }));
  }
  function commitOne(k, campo) {
    const key = keyOf(k, campo);
    const raw = edit[key];
    if (raw === undefined) return;
    setPrecos((old) => ({
      ...old,
      [k]: { ...old[k], [campo]: toNumberLoose(raw) },
    }));
    setEdit((e) => {
      const cp = { ...e };
      delete cp[key];
      return cp;
    });
  }
  function commitAll() {
    const entries = Object.entries(edit);
    if (entries.length === 0) return;
    setPrecos((old) => {
      const next = { ...old };
      for (const [key, raw] of entries) {
        const [k, campo] = key.split(".");
        next[k] = { ...next[k], [campo]: toNumberLoose(raw) };
      }
      return next;
    });
    setEdit({});
  }

  async function salvarNovaVigencia() {
    if (carregando || salvando) return;
    setErro("");
    setOk("");
    commitAll();

    const dataStr = (vigencia || "").trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dataStr)) {
      setErro("Informe a vigência no formato YYYY-MM-DD (ex.: 2025-08-12).");
      return;
    }

    // monta payload padronizado
    const payload = { data: dataStr, precos: {} };
    for (const k of ORDEM) {
      const p = precos[k] || {};
      payload.precos[k] = {
        rev1: toNumberLoose(p.rev1),
        rev2: toNumberLoose(p.rev2),
        rev3: toNumberLoose(p.rev3),
      };
    }

    setSalvando(true);
    try {
      const ref = doc(db, "tabela_precos_revenda", dataStr);
      await withTimeout(
        (async () => {
          await setDoc(ref, payload, { merge: false });
          const chk = await getDoc(ref);
          if (!(chk.exists() && (chk.data()?.data === dataStr))) {
            throw new Error("Não foi possível confirmar a gravação.");
          }
        })(),
        20000
      );
      setDocId(dataStr);
      setOk("Salvo com sucesso.");
    } catch (e) {
      setErro(e?.message || String(e));
    } finally {
      setSalvando(false);
    }
  }

  function getValueForInput(k, campo) {
    const key = keyOf(k, campo);
    if (edit[key] !== undefined) return edit[key]; // edição em curso
    return fmt2BR(precos[k]?.[campo]);
  }

  const btn = (extra = {}) => ({
    background: "#e5e7eb",
    border: "1px solid #d1d5db",
    borderRadius: 12,
    padding: "12px 16px",
    cursor: "pointer",
    fontSize: baseFont,
    ...extra,
  });

  /* -------------------- UI -------------------- */
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#FFF3E9",
        padding: 16,
        color: "#5C1D0E",
        fontSize: baseFont,
        lineHeight: 1.35,
      }}
    >
      {/* Ações */}
      <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
        <button onClick={() => setTela("HomeERP")} style={btn()}>
          ← Voltar
        </button>

        <button
          onClick={carregarUltima}
          disabled={carregando || salvando}
          style={btn({
            background: "#8c3b1b",
            color: "#fff",
            border: "none",
            opacity: carregando || salvando ? 0.6 : 1,
            cursor: carregando || salvando ? "not-allowed" : "pointer",
          })}
        >
          {carregando ? "Carregando..." : "Carregar última"}
        </button>

        <button
          onClick={salvarNovaVigencia}
          disabled={carregando || salvando}
          style={btn({
            background: "#14532d",
            color: "#fff",
            border: "none",
            opacity: carregando || salvando ? 0.7 : 1,
            cursor: carregando || salvando ? "not-allowed" : "pointer",
          })}
        >
          {salvando ? "Salvando..." : "Salvar nova vigência"}
        </button>
      </div>

      {/* Título e vigência */}
      <h1 style={{ fontWeight: 800, marginBottom: 8, fontSize: baseFont }}>
        Tabela de Preços (Revenda)
      </h1>

      <div style={{ marginBottom: 16, opacity: 0.95 }}>
        <div style={{ marginBottom: 6 }}>
          <strong>Doc atual:</strong> {docId || "—"}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 4 }}>
          <strong>Vigência (YYYY-MM-DD):</strong>
          <input
            value={vigencia}
            onChange={(e) => setVigencia(e.target.value)}
            placeholder="2025-08-12"
            style={{
              padding: "12px 14px",
              borderRadius: 12,
              border: "1px solid #d1d5db",
              outline: "none",
              fontSize: baseFont,
            }}
          />
        </div>
      </div>

      {/* Mensagens */}
      {erro && (
        <div
          style={{
            marginBottom: 14,
            padding: 14,
            border: "1px solid #fecaca",
            background: "#fee2e2",
            borderRadius: 14,
            color: "#7a1b1b",
            fontSize: baseFont,
          }}
        >
          {erro}
        </div>
      )}

      {ok && (
        <div
          style={{
            marginBottom: 14,
            padding: 14,
            border: "1px solid #bbf7d0",
            background: "#dcfce7",
            borderRadius: 14,
            color: "#166534",
            fontSize: baseFont,
          }}
        >
          {ok}
        </div>
      )}

      {/* Tabela */}
      <div
        style={{
          background: "#fff",
          border: "1px solid #eadfce",
          borderRadius: 16,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "2fr 1fr 1fr 1fr",
            padding: "14px 16px",
            fontWeight: 700,
            background: "#f7efe4",
            borderBottom: "1px solid #eadfce",
            fontSize: baseFont,
          }}
        >
          <div>Produto</div>
          <div style={{ textAlign: "right" }}>rev1</div>
          <div style={{ textAlign: "right" }}>rev2</div>
          <div style={{ textAlign: "right" }}>rev3</div>
        </div>

        {linhas.map((k) => (
          <div
            key={k}
            style={{
              display: "grid",
              gridTemplateColumns: "2fr 1fr 1fr 1fr",
              padding: "14px 16px",
              borderBottom: "1px solid #f2e8da",
              alignItems: "center",
              fontSize: baseFont,
            }}
          >
            <div style={{ fontWeight: 600 }}>{NOME_PRODUTO[k] || k}</div>

            {["rev1", "rev2", "rev3"].map((campo) => (
              <div key={campo} style={{ textAlign: "right" }}>
                <input
                  type="text"
                  inputMode="decimal"
                  value={getValueForInput(k, campo)}
                  onChange={(e) => onChangeEdit(k, campo, e.target.value)}
                  onBlur={() => commitOne(k, campo)}
                  placeholder="0,00"
                  style={{
                    width: "100%",
                    textAlign: "right",
                    padding: "12px 14px",
                    borderRadius: 12,
                    border: "1px solid #e5e7eb",
                    outline: "none",
                    fontSize: baseFont,
                  }}
                />
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Atalhos */}
      <div style={{ marginTop: 20, display: "flex", gap: 12, flexWrap: "wrap" }}>
        <button onClick={() => setTela("CtsReceber")} style={btn()}>
          → Contas a Receber
        </button>
        <button onClick={() => setTela("CtsPagar")} style={btn()}>
          → Contas a Pagar
        </button>
        <button onClick={() => setTela("FluxCx")} style={btn()}>
          → Fluxo de Caixa
        </button>
      </div>
    </div>
  );
        }

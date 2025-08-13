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
  documentId,
} from "firebase/firestore";
import { db } from "../firebase";

// ==== Constantes ============================================================
const NOME_PRODUTO = {
  brw7x7: "BRW 7x7",
  brw6x6: "BRW 6x6",
  pkt5x5: "PKT 5x5",
  pkt6x6: "PKT 6x6",
  esc: "Escondidinho",
};
const ORDEM = ["brw7x7", "brw6x6", "pkt5x5", "pkt6x6", "esc"];

const DEFAULT_PRECOS = {
  brw7x7: { rev1: 6.0, rev2: 6.0, rev3: 0 },
  brw6x6: { rev1: 5.5, rev2: 5.5, rev3: 0 },
  pkt5x5: { rev1: 3.9, rev2: 3.9, rev3: 0 },
  pkt6x6: { rev1: 4.4, rev2: 4.4, rev3: 0 },
  esc: { rev1: 4.65, rev2: 4.65, rev3: 0 },
};

const baseFont = 24; // tamanho de fonte elevado para mobile

// ==== Utilitários ===========================================================
function toNumberLoose(v) {
  if (v === "" || v === null || v === undefined) return 0;
  const s = String(v).replace(/\./g, "").replace(",", ".").trim();
  const n = Number(s);
  return Number.isFinite(n) ? n : 0;
}

function fmt2(v) {
  const n = Number(v);
  if (!Number.isFinite(n)) return "0,00";
  return n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function hojeISO() {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

// ==== Componente ============================================================
export default function TabPrec({ setTela }) {
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const [ok, setOk] = useState("");

  const [docId, setDocId] = useState("");
  const [vigencia, setVigencia] = useState(hojeISO());
  const [precos, setPrecos] = useState({ ...DEFAULT_PRECOS });
  const [edit, setEdit] = useState({}); // edições pendentes por campo

  const linhas = useMemo(() => ORDEM, []);

  // --------- Carga resiliente ----------------------------------------------
  async function carregarUltima() {
    if (salvando) return;
    setCarregando(true);
    setErro("");
    setOk("");
    setEdit({});

    try {
      const col = collection(db, "tabela_precos_revenda");
      let snap = null;

      // 1) tentar por 'data'
      try {
        const q1 = query(col, orderBy("data", "desc"), limit(1));
        const s1 = await getDocs(q1);
        if (!s1.empty) snap = s1;
      } catch (_) {}

      // 2) documentId (caso não exista campo 'data' ou índice)
      if (!snap) {
        try {
          const q2 = query(col, orderBy(documentId(), "desc"), limit(1));
          const s2 = await getDocs(q2);
          if (!s2.empty) snap = s2;
        } catch (_) {}
      }

      // 3) fallback: lê todos e pega o maior ID
      if (!snap) {
        const sAll = await getDocs(col);
        if (!sAll.empty) {
          const docsSorted = sAll.docs.slice().sort((a, b) => (a.id > b.id ? -1 : 1));
          snap = { docs: [docsSorted[0]], empty: false };
        }
      }

      if (!snap || snap.empty) {
        setDocId("");
        setVigencia(hojeISO());
        setPrecos({ ...DEFAULT_PRECOS });
        setOk("Sem registros. Preencha e salve uma nova vigência.");
        return;
      }

      const d = snap.docs[0];
      const val = d.data() || {};
      setDocId(d.id);
      setVigencia(val.data || d.id || hojeISO());

      // aceitar 'precos' (map) OU chaves na raiz
      const merged = { ...DEFAULT_PRECOS };
      if (val.precos && typeof val.precos === "object") {
        for (const k of ORDEM) {
          merged[k] = {
            rev1: toNumberLoose(val.precos[k]?.rev1 ?? merged[k].rev1),
            rev2: toNumberLoose(val.precos[k]?.rev2 ?? merged[k].rev2),
            rev3: toNumberLoose(val.precos[k]?.rev3 ?? merged[k].rev3),
          };
        }
      } else {
        for (const k of ORDEM) {
          merged[k] = {
            rev1: toNumberLoose(val[k]?.rev1 ?? merged[k].rev1),
            rev2: toNumberLoose(val[k]?.rev2 ?? merged[k].rev2),
            rev3: toNumberLoose(val[k]?.rev3 ?? merged[k].rev3),
          };
        }
      }

      setPrecos(merged);
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

  // --------- Edição local ---------------------------------------------------
  const keyOf = (k, campo) => `${k}.${campo}`;
  function onChangeEdit(k, campo, v) {
    setEdit((e) => ({ ...e, [keyOf(k, campo)]: v }));
  }
  function commitOne(k, campo) {
    const key = keyOf(k, campo);
    const raw = edit[key];
    if (raw === undefined) return;
    setPrecos((old) => ({ ...old, [k]: { ...old[k], [campo]: toNumberLoose(raw) } }));
    setEdit((e) => {
      const cp = { ...e };
      delete cp[key];
      return cp;
    });
  }
  function commitAll() {
    if (!Object.keys(edit).length) return;
    setPrecos((old) => {
      const next = { ...old };
      for (const [key, raw] of Object.entries(edit)) {
        const [k, campo] = key.split(".");
        next[k] = { ...next[k], [campo]: toNumberLoose(raw) };
      }
      return next;
    });
    setEdit({});
  }

  // --------- Salvar com confirmação (backoff) -------------------------------
  async function confirmarGravacao(ref, esperadoData, tentativas = 6) {
    // 6 tentativas: ~200ms, 400ms, 800ms, 1200ms, 1800ms, 2500ms  ≈ 7s
    const delays = [200, 400, 800, 1200, 1800, 2500];
    for (let i = 0; i < Math.min(tentativas, delays.length); i++) {
      await sleep(delays[i]);
      try {
        const snap = await getDoc(ref);
        const ok = snap.exists() && (snap.data()?.data === esperadoData || snap.id === esperadoData);
        if (ok) return true;
      } catch (_) {
        // ignora e tenta novamente
      }
    }
    return false;
  }

  async function salvarNovaVigencia() {
    if (carregando || salvando) return;
    setErro("");
    setOk("");
    commitAll();

    const dataStr = (vigencia || "").trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dataStr)) {
      setErro("Informe a vigência no formato YYYY-MM-DD (ex.: 2025-08-13).");
      return;
    }

    // Monta payload em dois formatos (retrocompatível)
    const payloadRaiz = {};
    const payloadPrecos = {};
    for (const k of ORDEM) {
      const item = precos[k] || {};
      const linha = {
        rev1: toNumberLoose(item.rev1),
        rev2: toNumberLoose(item.rev2),
        rev3: toNumberLoose(item.rev3),
      };
      payloadRaiz[k] = linha;
      payloadPrecos[k] = linha;
    }

    setSalvando(true);
    try {
      const ref = doc(db, "tabela_precos_revenda", dataStr);
      await setDoc(
        ref,
        {
          data: dataStr,
          precos: payloadPrecos, // novo
          ...payloadRaiz,        // antigo (na raiz)
        },
        { merge: true }
      );

      // Confirmação real com backoff
      const confirmado = await confirmarGravacao(ref, dataStr);
      if (!confirmado) throw new Error("Tempo esgotado ao confirmar a gravação.");

      setDocId(dataStr);
      setOk("Salvo com sucesso.");
    } catch (e) {
      const msg = e?.message || String(e);
      // dica útil quando regra expira / permissão cai
      if (msg.includes("permission") || msg.includes("PERMISSION")) {
        setErro("Permissão negada no Firestore. Verifique as regras de segurança.");
      } else {
        setErro(msg);
      }
    } finally {
      setSalvando(false);
    }
  }

  // --------- Estilos de botões ---------------------------------------------
  const btn = (extra = {}) => ({
    background: "#e5e7eb",
    border: "1px solid #d1d5db",
    borderRadius: 12,
    padding: "12px 16px",
    cursor: "pointer",
    fontSize: baseFont,
    ...extra,
  });

  // --------- Render ---------------------------------------------------------
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
          {carregando ? "Carregando…" : "Carregar última"}
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
          {salvando ? "Salvando…" : "Salvar nova vigência"}
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
            placeholder="2025-08-13"
            style={{
              padding: "12px 14px",
              borderRadius: 12,
              border: "1px solid #d1d5db",
              outline: "none",
              fontSize: baseFont,
              width: 200,
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
                  value={edit[`${k}.${campo}`] !== undefined ? edit[`${k}.${campo}`] : fmt2(precos[k]?.[campo])}
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

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

function toNumberLoose(v) {
  if (v === "" || v === null || v === undefined) return null;
  const s = String(v).replace(",", ".").trim();
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}
function fmt2(v) {
  if (v === null || v === undefined || v === "") return "";
  const n = Number(v);
  if (!Number.isFinite(n)) return "";
  return n.toFixed(2);
}
function hojeISO() {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}

export default function TabPrec({ setTela }) {
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const [ok, setOk] = useState("");

  const [docId, setDocId] = useState("");
  const [vigencia, setVigencia] = useState(hojeISO());
  const [precos, setPrecos] = useState(DEFAULT_PRECOS);

  // estado de edição livre (string) por campo
  const [edit, setEdit] = useState({});
  const linhas = useMemo(() => ORDEM, []);

  async function carregarUltima() {
    setCarregando(true);
    setErro("");
    setOk("");
    setEdit({});
    try {
      const q = query(
        collection(db, "tabela_precos_revenda"),
        orderBy("data", "desc"),
        limit(1)
      );
      const snap = await getDocs(q);
      if (snap.empty) {
        setDocId("");
        setVigencia(hojeISO());
        setPrecos({ ...DEFAULT_PRECOS });
      } else {
        const d = snap.docs[0];
        const val = d.data() || {};
        setDocId(d.id);
        setVigencia(val.data || d.id || hojeISO());
        const p = val.precos || {};
        const merged = { ...DEFAULT_PRECOS };
        for (const k of Object.keys(merged)) {
          merged[k] = {
            rev1: toNumberLoose(p[k]?.rev1) ?? merged[k].rev1 ?? null,
            rev2: toNumberLoose(p[k]?.rev2) ?? merged[k].rev2 ?? null,
            rev3: toNumberLoose(p[k]?.rev3) ?? merged[k].rev3 ?? null,
          };
        }
        setPrecos(merged);
      }
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

  const keyOf = (k, campo) => `${k}.${campo}`;
  function onChangeEdit(k, campo, v) {
    setEdit((e) => ({ ...e, [keyOf(k, campo)]: v }));
  }
  function commitOne(k, campo) {
    const key = keyOf(k, campo);
    const raw = edit[key];
    if (raw === undefined) return;
    const n = toNumberLoose(raw);
    setPrecos((old) => ({ ...old, [k]: { ...old[k], [campo]: n } }));
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
    setErro("");
    setOk("");
    commitAll();

    const dataStr = (vigencia || "").trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dataStr)) {
      setErro("Informe a vigência no formato YYYY-MM-DD (ex.: 2025-08-13).");
      return;
    }

    const payload = { data: dataStr, precos: {} };
    for (const k of ORDEM) {
      const item = precos[k] || {};
      payload.precos[k] = {
        rev1: toNumberLoose(item.rev1),
        rev2: toNumberLoose(item.rev2),
        rev3: toNumberLoose(item.rev3),
      };
    }

    setSalvando(true);
    try {
      const ref = doc(db, "tabela_precos_revenda", dataStr);
      await setDoc(ref, payload, { merge: false });

      const chk = await getDoc(ref);
      if (chk.exists() && chk.data()?.data === dataStr) {
        setDocId(dataStr);
        setOk("Salvo com sucesso.");
      } else {
        setErro("Não foi possível confirmar a gravação.");
      }
    } catch (e) {
      setErro(e?.message || String(e));
    } finally {
      setSalvando(false);
    }
  }

  function getValueForInput(k, campo) {
    const key = keyOf(k, campo);
    if (edit[key] !== undefined) return edit[key];
    return fmt2(precos[k]?.[campo]);
  }

  const baseFont = 20; // <= TAMANHO 20PX EM TODA A TELA

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
      <div style={{ display: "flex", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
        <button
          onClick={() => setTela("HomeERP")}
          style={{
            background: "#e5e7eb",
            border: "1px solid #d1d5db",
            borderRadius: 10,
            padding: "10px 14px",
            cursor: "pointer",
            fontSize: baseFont,
          }}
        >
          ← Voltar
        </button>
        <button
          onClick={carregarUltima}
          disabled={carregando}
          style={{
            background: "#8c3b1b",
            color: "#fff",
            border: "none",
            borderRadius: 10,
            padding: "10px 14px",
            cursor: carregando ? "not-allowed" : "pointer",
            opacity: carregando ? 0.6 : 1,
            fontSize: baseFont,
          }}
        >
          {carregando ? "Carregando…" : "Carregar última"}
        </button>
        <button
          onClick={salvarNovaVigencia}
          disabled={salvando}
          style={{
            background: "#14532d",
            color: "#fff",
            border: "none",
            borderRadius: 10,
            padding: "10px 14px",
            cursor: salvando ? "not-allowed" : "pointer",
            opacity: salvando ? 0.7 : 1,
            fontSize: baseFont,
          }}
        >
          {salvando ? "Salvando…" : "Salvar nova vigência"}
        </button>
      </div>

      {/* Título e vigência */}
      <h1 style={{ fontWeight: 800, marginBottom: 8, fontSize: baseFont }}>
        Tabela de Preços (Revenda)
      </h1>
      <div style={{ marginBottom: 14, opacity: 0.95 }}>
        <div style={{ marginBottom: 6 }}>
          <strong>Doc atual:</strong> {docId || "—"}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 4 }}>
          <strong>Vigência (YYYY-MM-DD):</strong>
          <input
            value={vigencia}
            onChange={(e) => setVigencia(e.target.value)}
            placeholder="2025-08-13"
            style={{
              padding: "10px 12px",
              borderRadius: 10,
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
            marginBottom: 12,
            padding: 12,
            border: "1px solid #fecaca",
            background: "#fee2e2",
            borderRadius: 12,
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
            marginBottom: 12,
            padding: 12,
            border: "1px solid #bbf7d0",
            background: "#dcfce7",
            borderRadius: 12,
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
          borderRadius: 14,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "2fr 1fr 1fr 1fr",
            padding: "12px 14px",
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
              padding: "12px 14px",
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
                    padding: "10px 12px",
                    borderRadius: 10,
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
      <div style={{ marginTop: 18, display: "flex", gap: 10, flexWrap: "wrap" }}>
        <button onClick={() => setTela("CtsReceber")} style={{ fontSize: baseFont }}>
          → Contas a Receber
        </button>
        <button onClick={() => setTela("CtsPagar")} style={{ fontSize: baseFont }}>
          → Contas a Pagar
        </button>
        <button onClick={() => setTela("FluxCx")} style={{ fontSize: baseFont }}>
          → Fluxo de Caixa
        </button>
      </div>
    </div>
  );
}

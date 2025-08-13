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

// Mapa de rótulos
const NOME_PRODUTO = {
  brw7x7: "BRW 7x7",
  brw6x6: "BRW 6x6",
  pkt5x5: "PKT 5x5",
  pkt6x6: "PKT 6x6",
  esc: "Escondidinho",
};

// Ordem fixa na tela
const ORDEM = ["brw7x7", "brw6x6", "pkt5x5", "pkt6x6", "esc"];

// Defaults (padrões atuais informados)
const DEFAULT_PRECOS = {
  brw7x7: { rev1: 6.0, rev2: 6.0, rev3: null },
  brw6x6: { rev1: 5.5, rev2: 5.5, rev3: null },
  pkt5x5: { rev1: 3.9, rev2: 3.9, rev3: null },
  pkt6x6: { rev1: 4.4, rev2: 4.4, rev3: null },
  esc: { rev1: 4.65, rev2: 4.65, rev3: null },
};

function toNumber(v) {
  if (v === "" || v === null || v === undefined) return null;
  const s = String(v).replace(",", ".").trim();
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}
function fmt(v) {
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

  // documento atual
  const [docId, setDocId] = useState("");
  const [vigencia, setVigencia] = useState(hojeISO());
  const [precos, setPrecos] = useState(DEFAULT_PRECOS);

  // linhas ordenadas conforme ORDEM
  const linhas = useMemo(() => ORDEM, []);

  async function carregarUltima() {
    setCarregando(true);
    setErro("");
    setOk("");
    try {
      const q = query(
        collection(db, "tabela_precos_revenda"),
        orderBy("data", "desc"),
        limit(1)
      );
      const snap = await getDocs(q);
      if (snap.empty) {
        // mantém defaults e data de hoje
        setDocId("");
        setVigencia(hojeISO());
        setPrecos({ ...DEFAULT_PRECOS });
      } else {
        const d = snap.docs[0];
        const val = d.data() || {};
        setDocId(d.id);
        setVigencia(val.data || d.id || hojeISO());
        const p = val.precos || {};
        // garante todas as chaves esperadas
        const merged = { ...DEFAULT_PRECOS };
        for (const k of Object.keys(merged)) {
          merged[k] = {
            rev1: toNumber(p[k]?.rev1) ?? merged[k].rev1 ?? null,
            rev2: toNumber(p[k]?.rev2) ?? merged[k].rev2 ?? null,
            rev3: toNumber(p[k]?.rev3) ?? merged[k].rev3 ?? null,
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

  function setPreco(prodKey, campo, valorStr) {
    setPrecos((old) => {
      const v = toNumber(valorStr);
      return {
        ...old,
        [prodKey]: {
          ...old[prodKey],
          [campo]: v,
        },
      };
    });
  }

  async function salvarNovaVigencia() {
    setErro("");
    setOk("");
    const dataStr = (vigencia || "").trim();

    // valida vigência (YYYY-MM-DD)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dataStr)) {
      setErro("Informe a vigência no formato YYYY-MM-DD (ex.: 2025-08-13).");
      return;
    }

    // prepara payload garantindo números ou null
    const payload = { data: dataStr, precos: {} };
    for (const k of ORDEM) {
      const item = precos[k] || {};
      payload.precos[k] = {
        rev1: toNumber(item.rev1),
        rev2: toNumber(item.rev2),
        rev3: toNumber(item.rev3),
      };
    }

    setSalvando(true);
    try {
      // docId = vigência (histórico por data)
      const ref = doc(db, "tabela_precos_revenda", dataStr);
      await setDoc(ref, payload, { merge: false });

      // validação real: lê de volta
      const chk = await getDoc(ref);
      if (chk.exists()) {
        const lido = chk.data();
        if (lido?.data === dataStr) {
          setDocId(dataStr);
          setOk("Salvo com sucesso.");
          return;
        }
      }
      setErro("Não foi possível confirmar a gravação. Verifique sua conexão e permissões.");
    } catch (e) {
      setErro(e?.message || String(e));
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: "#FFF3E9", padding: 16, color: "#5C1D0E" }}>
      {/* Barra de ações */}
      <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
        <button
          onClick={() => setTela("HomeERP")}
          style={{
            background: "#e5e7eb",
            border: "1px solid #d1d5db",
            borderRadius: 8,
            padding: "8px 12px",
            cursor: "pointer",
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
            borderRadius: 8,
            padding: "8px 12px",
            cursor: carregando ? "not-allowed" : "pointer",
            opacity: carregando ? 0.6 : 1,
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
            borderRadius: 8,
            padding: "8px 12px",
            cursor: salvando ? "not-allowed" : "pointer",
            opacity: salvando ? 0.7 : 1,
          }}
        >
          {salvando ? "Salvando…" : "Salvar nova vigência"}
        </button>
      </div>

      {/* Cabeçalho */}
      <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 6 }}>Tabela de Preços (Revenda)</h1>
      <div style={{ marginBottom: 12, opacity: 0.95 }}>
        <div><strong>Doc atual:</strong> {docId || "—"}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6 }}>
          <strong>Vigência (YYYY-MM-DD):</strong>
          <input
            value={vigencia}
            onChange={(e) => setVigencia(e.target.value)}
            placeholder="2025-08-13"
            style={{
              padding: "6px 10px",
              borderRadius: 8,
              border: "1px solid #d1d5db",
              outline: "none",
            }}
          />
        </div>
      </div>

      {/* Mensagens */}
      {erro && (
        <div
          style={{
            marginBottom: 12,
            padding: 10,
            border: "1px solid #fecaca",
            background: "#fee2e2",
            borderRadius: 10,
            color: "#7a1b1b",
          }}
        >
          {erro}
        </div>
      )}
      {ok && (
        <div
          style={{
            marginBottom: 12,
            padding: 10,
            border: "1px solid #bbf7d0",
            background: "#dcfce7",
            borderRadius: 10,
            color: "#166534",
          }}
        >
          {ok}
        </div>
      )}

      {/* Tabela de edição */}
      <div
        style={{
          background: "#fff",
          border: "1px solid #eadfce",
          borderRadius: 12,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "2fr 1fr 1fr 1fr",
            padding: "10px 12px",
            fontWeight: 700,
            background: "#f7efe4",
            borderBottom: "1px solid #eadfce",
          }}
        >
          <div>Produto</div>
          <div style={{ textAlign: "right" }}>rev1</div>
          <div style={{ textAlign: "right" }}>rev2</div>
          <div style={{ textAlign: "right" }}>rev3</div>
        </div>

        {linhas.map((k) => {
          const item = precos[k] || {};
          return (
            <div
              key={k}
              style={{
                display: "grid",
                gridTemplateColumns: "2fr 1fr 1fr 1fr",
                padding: "10px 12px",
                borderBottom: "1px solid #f2e8da",
              }}
            >
              <div style={{ fontWeight: 600 }}>{NOME_PRODUTO[k] || k}</div>

              {/* rev1 */}
              <div style={{ textAlign: "right" }}>
                <input
                  inputMode="decimal"
                  value={fmt(item.rev1)}
                  onChange={(e) => setPreco(k, "rev1", e.target.value)}
                  style={{
                    width: "100%",
                    textAlign: "right",
                    padding: "6px 8px",
                    borderRadius: 8,
                    border: "1px solid #e5e7eb",
                    outline: "none",
                  }}
                  placeholder="0.00"
                />
              </div>

              {/* rev2 */}
              <div style={{ textAlign: "right" }}>
                <input
                  inputMode="decimal"
                  value={fmt(item.rev2)}
                  onChange={(e) => setPreco(k, "rev2", e.target.value)}
                  style={{
                    width: "100%",
                    textAlign: "right",
                    padding: "6px 8px",
                    borderRadius: 8,
                    border: "1px solid #e5e7eb",
                    outline: "none",
                  }}
                  placeholder="0.00"
                />
              </div>

              {/* rev3 */}
              <div style={{ textAlign: "right" }}>
                <input
                  inputMode="decimal"
                  value={fmt(item.rev3)}
                  onChange={(e) => setPreco(k, "rev3", e.target.value)}
                  style={{
                    width: "100%",
                    textAlign: "right",
                    padding: "6px 8px",
                    borderRadius: 8,
                    border: "1px solid #e5e7eb",
                    outline: "none",
                  }}
                  placeholder="0.00"
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Atalhos */}
      <div style={{ marginTop: 16, display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button onClick={() => setTela("CtsReceber")}>→ Contas a Receber</button>
        <button onClick={() => setTela("CtsPagar")}>→ Contas a Pagar</button>
        <button onClick={() => setTela("FluxCx")}>→ Fluxo de Caixa</button>
      </div>
    </div>
  );
      }

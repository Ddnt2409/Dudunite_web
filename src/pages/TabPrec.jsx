// src/pages/TabPrec.jsx
import React, { useEffect, useState } from "react";
import { collection, query, orderBy, limit, getDocs } from "firebase/firestore";
import { db } from "../firebase";

const NOME_PRODUTO = {
  brw6x6: "BRW 6x6",
  brw7x7: "BRW 7x7",
  pkt5x5: "PKT 5x5",
  pkt6x6: "PKT 6x6",
  esc: "Escondidinho",
  dudu: "Dudu",
};

function fmt(v) {
  if (v === null || v === undefined || v === "") return "-";
  const n = Number(v);
  if (Number.isNaN(n)) return String(v);
  return n.toFixed(2).replace(".", ",");
}

export default function TabPrec({ setTela }) {
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [docId, setDocId] = useState("");
  const [vigencia, setVigencia] = useState("");
  const [precos, setPrecos] = useState({});

  async function carregar() {
    setCarregando(true);
    setErro("");
    try {
      // Pega a última tabela pela data (string ISO ex.: 2025-08-12)
      const q = query(
        collection(db, "tabela_precos_revenda"),
        orderBy("data", "desc"),
        limit(1)
      );
      const snap = await getDocs(q);
      if (snap.empty) {
        setDocId("");
        setVigencia("");
        setPrecos({});
      } else {
        const d = snap.docs[0];
        const val = d.data() || {};
        setDocId(d.id);
        setVigencia(val.data || "");
        setPrecos(val.precos || {});
      }
    } catch (e) {
      setErro(e?.message || String(e));
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregar();
  }, []);

  const linhas = Object.keys(precos || {}).sort();

  return (
    <div style={{ minHeight: "100vh", background: "#FFF3E9", padding: 16, color: "#5C1D0E" }}>
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
          onClick={carregar}
          style={{
            background: "#8c3b1b",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            padding: "8px 12px",
            cursor: "pointer",
          }}
        >
          Recarregar
        </button>
        <button onClick={() => setTela("CtsReceber")}>→ Contas a Receber</button>
        <button onClick={() => setTela("CtsPagar")}>→ Contas a Pagar</button>
        <button onClick={() => setTela("FluxCx")}>→ Fluxo de Caixa</button>
      </div>

      <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>Tabela de Preços (Revenda)</h1>
      <div style={{ marginBottom: 12, opacity: 0.9 }}>
        {carregando ? "Carregando…" : docId ? (
          <>
            <span style={{ fontWeight: 700 }}>Vigência:</span> {vigencia || "-"} &nbsp;•&nbsp;{" "}
            <span style={{ fontWeight: 700 }}>Doc:</span> {docId}
          </>
        ) : (
          "Nenhuma tabela encontrada."
        )}
      </div>

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
          Erro ao carregar: {erro}
        </div>
      )}

      {!carregando && linhas.length > 0 && (
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
                <div style={{ textAlign: "right" }}>{fmt(item.rev1)}</div>
                <div style={{ textAlign: "right" }}>{fmt(item.rev2)}</div>
                <div style={{ textAlign: "right" }}>{fmt(item.rev3)}</div>
              </div>
            );
          })}
        </div>
      )}

      {!carregando && linhas.length === 0 && !erro && (
        <div
          style={{
            background: "#fff",
            border: "1px solid #eadfce",
            borderRadius: 12,
            padding: 14,
          }}
        >
          Nenhum preço encontrado no documento mais recente.
        </div>
      )}
    </div>
  );
                                                    }

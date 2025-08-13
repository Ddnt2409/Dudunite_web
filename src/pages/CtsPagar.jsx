import React from "react";

export default function CtsPagar({ setTela }) {
  return (
    <div style={{ minHeight: "100vh", background: "#FFF3E9", padding: 16, color: "#7a1b1b" }}>
      <button
        onClick={() => setTela("HomeERP")}
        style={{
          marginBottom: 12,
          background: "#e5e7eb",
          border: "1px solid #d1d5db",
          borderRadius: 8,
          padding: "8px 12px",
          cursor: "pointer",
        }}
      >
        ← Voltar
      </button>

      <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>Contas a Pagar</h1>
      <p style={{ marginBottom: 16 }}>
        Em breve… lançamentos Isolado/Semanal/Quinzenal/Mensal (Previsto/Realizado).
      </p>

      <div
        style={{
          background: "#fff",
          border: "1px solid #f4cccc",
          borderRadius: 12,
          padding: 14,
        }}
      >
        Esqueleto pronto. Próximo passo: reflexo no Fluxo de Caixa.
      </div>

      <div style={{ marginTop: 16, display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button onClick={() => setTela("TabPrec")}>← Tabela de Preços</button>
        <button onClick={() => setTela("CtsReceber")}>← Contas a Receber</button>
        <button onClick={() => setTela("FluxCx")}>→ Fluxo de Caixa</button>
      </div>
    </div>
  );
}

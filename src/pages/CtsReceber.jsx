import React from "react";

export default function CtsReceber({ setTela }) {
  return (
    <div style={{ minHeight: "100vh", background: "#FFF3E9", padding: 16, color: "#0f3a65" }}>
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

      <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>Contas a Receber</h1>
      <p style={{ marginBottom: 16 }}>
        Em breve… fila de pedidos do Módulo 1, aprovação e lançamento no fluxo.
      </p>

      <div
        style={{
          background: "#fff",
          border: "1px solid #cfe2ff",
          borderRadius: 12,
          padding: 14,
        }}
      >
        Esqueleto pronto. Próximo passo: formulário e Firestore.
      </div>

      <div style={{ marginTop: 16, display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button onClick={() => setTela("TabPrec")}>← Tabela de Preços</button>
        <button onClick={() => setTela("CtsPagar")}>→ Contas a Pagar</button>
        <button onClick={() => setTela("FluxCx")}>→ Fluxo de Caixa</button>
      </div>
    </div>
  );
}

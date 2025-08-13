import React from "react";

export default function FluxCx({ setTela }) {
  return (
    <div style={{ minHeight: "100vh", background: "#FFF3E9", padding: 16, color: "#1f2937" }}>
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

      <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>Fluxo de Caixa</h1>
      <p style={{ marginBottom: 16 }}>
        Em breve… colunas Previsto/Realizado, cores por tipo (azul CR, vermelho CP) e conciliação.
      </p>

      <div
        style={{
          background: "#fff",
          border: "1px solid #eadfce",
          borderRadius: 12,
          padding: 14,
        }}
      >
        Esqueleto pronto. Próximo passo: leitura dos lançamentos e filtros por período.
      </div>

      <div style={{ marginTop: 16, display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button onClick={() => setTela("TabPrec")}>← Tabela de Preços</button>
        <button onClick={() => setTela("CtsReceber")}>← Contas a Receber</button>
        <button onClick={() => setTela("CtsPagar")}>← Contas a Pagar</button>
      </div>
    </div>
  );
}

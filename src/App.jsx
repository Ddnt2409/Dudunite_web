// src/App.jsx
import React, { useEffect, useState } from "react";

// Páginas
import HomeERP from "./pages/HomeERP";
import HomePCP from "./pages/HomePCP";
import LanPed from "./pages/LanPed";
import AliSab from "./pages/AliSab";
import StaPed from "./pages/StaPed"; // << NOVA TELA

// (opcional) estilos base globais do projeto, se existirem
// import "./pages/fade.css";

export default function App() {
  // Tela inicial — ajuste se quiser abrir direto no PCP:
  const [tela, setTela] = useState("HomeERP");

  // volta pro topo quando troca de tela (melhora UX no mobile)
  useEffect(() => {
    try {
      window.scrollTo({ top: 0, behavior: "instant" });
    } catch {
      window.scrollTo(0, 0);
    }
  }, [tela]);

  // Render simples por estado (sem react-router)
  switch (tela) {
    case "HomeERP":
      return <HomeERP setTela={setTela} />;

    case "HomePCP":
      // tela hub do PCP com os botões (Lançar Pedido, Alimentar Sabores, Status dos Pedidos…)
      return <HomePCP setTela={setTela} />;

    case "LanPed":
      // Lançar Pedido (PCP)
      return <LanPed setTela={setTela} />;

    case "AliSab":
      // Alimentar Sabores (PCP)
      return <AliSab setTela={setTela} />;

    case "StaPed":
      // Status dos Pedidos (PCP) — NOVA
      return <StaPed setTela={setTela} />;

    default:
      // fallback bem simples
      return (
        <div style={{ padding: 24, fontFamily: "system-ui, sans-serif" }}>
          <h1 style={{ marginBottom: 12 }}>Tela não encontrada</h1>
          <p style={{ marginBottom: 24 }}>
            Valor atual de <code>tela</code>: <strong>{String(tela)}</strong>
          </p>
          <button
            onClick={() => setTela("HomeERP")}
            style={{
              background: "#8c3b1b",
              color: "#fff",
              border: "none",
              borderRadius: 10,
              padding: "10px 14px",
              fontWeight: 800,
              cursor: "pointer",
            }}
          >
            Ir para ERP
          </button>
        </div>
      );
  }
}

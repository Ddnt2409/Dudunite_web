// src/App.jsx
import React, { useEffect, useState } from "react";

// Páginas (Módulo 1)
import HomeERP from "./pages/HomeERP";
import HomePCP from "./pages/HomePCP";
import LanPed from "./pages/LanPed";
import AliSab from "./pages/AliSab";
import StaPed from "./pages/StaPed"; // << NOVA TELA

// Páginas (Financeiro – seus arquivos)
import TabPrec from "./pages/TabPrec";
import CtsReceber from "./pages/CtsReceber";
import CtsPagar from "./pages/CtsPagar";
import FluxCx from "./pages/FluxCx";

// (opcional) estilos globais
// import "./pages/fade.css";

export default function App() {
  // >>> Iniciar na Tabela de Preços para testar no celular/Vercel <<<
  const [tela, setTela] = useState("TabPrec");

  // volta pro topo quando troca de tela (UX mobile)
  useEffect(() => {
    try {
      window.scrollTo({ top: 0, behavior: "instant" });
    } catch {
      window.scrollTo(0, 0);
    }
  }, [tela]);

  // Render simples por estado (sem react-router)
  switch (tela) {
    // ====== MÓDULO 1 ========================================================
    case "HomeERP":
      return <HomeERP setTela={setTela} />;
    case "HomePCP":
      return <HomePCP setTela={setTela} />;
    case "LanPed":
      return <LanPed setTela={setTela} />;
    case "AliSab":
      return <AliSab setTela={setTela} />;
    case "StaPed":
      return <StaPed setTela={setTela} />;

    // ====== MÓDULO 2 – FINANCEIRO ===========================================
    case "TabPrec":
      return <TabPrec setTela={setTela} />;
    case "CtsReceber":
      return <CtsReceber setTela={setTela} />;
    case "CtsPagar":
      return <CtsPagar setTela={setTela} />;
    case "FluxCx":
      return <FluxCx setTela={setTela} />;

    // ====== FALLBACK ========================================================
    default:
      return (
        <div style={{ padding: 24, fontFamily: "system-ui, sans-serif" }}>
          <h1 style={{ marginBottom: 12 }}>Tela não encontrada</h1>
          <p style={{ marginBottom: 24 }}>
            Valor atual de <code>tela</code>: <strong>{String(tela)}</strong>
          </p>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
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
            {/* atalhos provisórios do Financeiro */}
            <button onClick={() => setTela("TabPrec")}>Tabela de Preços</button>
            <button onClick={() => setTela("CtsReceber")}>Contas a Receber</button>
            <button onClick={() => setTela("CtsPagar")}>Contas a Pagar</button>
            <button onClick={() => setTela("FluxCx")}>Fluxo de Caixa</button>
          </div>
        </div>
      );
  }
}

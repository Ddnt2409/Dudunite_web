// src/App.jsx
import React, { useEffect, useState } from "react";

// Páginas
import HomeERP from "./pages/HomeERP";
import HomePCP from "./pages/HomePCP";
import LanPed from "./pages/LanPed";
import AliSab from "./pages/AliSab";
import StaPed from "./pages/StaPed";
import Suprimentos from "./pages/Suprimentos";
import CtsReceber from "./pages/CtsReceber";   // <-- novo import
import FluxCx from "./pages/FluxCx";           // <-- novo import

export default function App() {
  const [tela, setTela] = useState("HomeERP");

  useEffect(() => {
    try { window.scrollTo({ top: 0, behavior: "instant" }); }
    catch { window.scrollTo(0, 0); }
  }, [tela]);

  switch (tela) {
    case "HomeERP":     return <HomeERP setTela={setTela} />;
    case "HomePCP":     return <HomePCP setTela={setTela} />;
    case "LanPed":      return <LanPed setTela={setTela} />;
    case "AliSab":      return <AliSab setTela={setTela} />;
    case "StaPed":      return <StaPed setTela={setTela} />;
    case "Suprimentos": return <Suprimentos setTela={setTela} />;
    case "CtsReceber":  return <CtsReceber setTela={setTela} />;  // <-- nova rota
    case "FluxCx":      return <FluxCx setTela={setTela} />;      // <-- nova rota

    default:
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

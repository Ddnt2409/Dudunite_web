// === RT00 – Início ===
// TELA PCP – Planejamento e Controle de Produção (Mobile)

import React, { useState, useEffect } from "react";

// === INÍCIO RT00 – TELA PCP ===
const HomePCP = ({ setPaginaAtual }) => {
  const [pdvs, setPdvs] = useState([]);

  useEffect(() => {
    // Lista fixa de PDVs para o rodapé animado
    setPdvs([
      "Pequeno Príncipe", "Salesianas", "Céu Azul", "Russas", "Bora Gastar",
      "Kaduh", "Society Show", "Degusty", "Tio Valter", "Vera Cruz", "Pinheiros",
      "BMQ", "Dourado", "CFC", "Madre de Deus", "Saber Viver", "Interativo",
      "Exato Sede", "Exato Anexo", "Sesi", "Motivo", "Jesus Salvador",
    ]);
  }, []);

  return (
    <div
      style={{
        backgroundImage: "url('/bg001.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        backgroundRepeat: "no-repeat",
      }}
    >
      {/* Cabeçalho Translúcido */}
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "10px 20px",
          backgroundColor: "rgba(255, 255, 255, 0.4)",
          height: "70px",
        }}
      >
        <img
          src="/LogomarcaDDnt2025Vazado.png"
          alt="Logomarca Dudunitê"
          style={{ height: "55px" }} // 30% maior
        />
        <h2 style={{ color: "#8c3b1b", fontWeight: "bold" }}>ERP DUDUNITÊ</h2>
      </header>

      {/* Conteúdo Central */}
      <div
        style={{
          textAlign: "center",
          padding: "20px",
          marginTop: "-60px", // sobe os botões 50% da altura deles
        }}
      >
        <h1 style={{ fontSize: "36px", color: "#fff", marginBottom: "10px" }}>
          PCP
        </h1>
        <h3 style={{ color: "#8c3b1b", marginBottom: "30px" }}>
          PLANEJAMENTO E CONTROLE DE PRODUÇÃO
        </h3>

        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <button
            onClick={() => setPaginaAtual("pedido")}
            style={{
              backgroundColor: "#8c3b1b",
              color: "#fff",
              border: "none",
              padding: "15px 30px",
              fontSize: "18px",
              borderRadius: "8px",
              cursor: "pointer",
              boxShadow: "4px 4px 0px rgba(0,0,0,0.6)", // 40% mais sombra
              fontWeight: "bold",
            }}
          >
            LANÇAR PEDIDO
          </button>
          <button
            onClick={() => setPaginaAtual("sabores")}
            style={{
              backgroundColor: "#8c3b1b",
              color: "#fff",
              border: "none",
              padding: "15px 30px",
              fontSize: "18px",
              borderRadius: "8px",
              cursor: "pointer",
              boxShadow: "4px 4px 0px rgba(0,0,0,0.6)", // 40% mais sombra
              fontWeight: "bold",
            }}
          >
            ALIMENTAR SABORES
          </button>
        </div>
      </div>

      {/* Rodapé com rolagem */}
      <div
        style={{
          backgroundColor: "#8c3b1b",
          overflow: "hidden",
          height: "30px",
          marginBottom: "30px", // sobe o rodapé 1x sua altura
        }}
      >
        <div
          style={{
            display: "inline-block",
            whiteSpace: "nowrap",
            animation: "scroll 20s linear infinite",
            color: "#fff",
            paddingLeft: "100%",
            fontWeight: "bold",
          }}
        >
          {pdvs.map((pdv, index) => (
            <span key={index} style={{ marginRight: "50px" }}>
              ● {pdv}
            </span>
          ))}
        </div>
      </div>

      {/* Animação CSS */}
      <style>
        {`
          @keyframes scroll {
            0% { transform: translateX(0%); }
            100% { transform: translateX(-100%); }
          }
        `}
      </style>
    </div>
  );
};

export default HomePCP;
// === FIM RT00 ===

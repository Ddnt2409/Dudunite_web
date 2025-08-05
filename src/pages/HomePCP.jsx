import React from "react";

function HomePCP({ setTela }) {
  return (
    <div
      style={{
        backgroundImage: "url('/fundopcp.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        minHeight: "100vh",
        padding: "2rem",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-start",
        gap: "3rem",
      }}
    >
      {/* === INÍCIO RT00 – Tela PCP === */}
      <h1
        style={{
          fontSize: "1.8rem",
          fontWeight: "bold",
          color: "#8c3b1b",
          backgroundColor: "#fff5ec",
          padding: "1rem 2rem",
          borderRadius: "1rem",
          marginTop: "2rem",
        }}
      >
        Planejamento de Produção
      </h1>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "2rem",
          marginTop: "2rem",
        }}
      >
        {/* Botão 1 – Lançar Pedido */}
        <button
          className="botao-principal"
          onClick={() => setTela("LanPed")}
        >
          📝 Lançar Pedido
        </button>

        {/* Botão 2 – Alimentar Sabores */}
        <button
          className="botao-principal"
          onClick={() => alert("Em breve!")}
        >
          🍫 Alimentar Sabores
        </button>
      </div>

      {/* Rodapé com escolas recentes */}
      <div
        style={{
          marginTop: "auto",
          color: "white",
          fontSize: "0.8rem",
        }}
      >
        • Pequeno Príncipe • Salesianas
      </div>
      {/* === FIM RT00 === */}
    </div>
  );
}

export default HomePCP;

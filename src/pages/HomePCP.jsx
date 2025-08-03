import React from "react";
import "./HomeERP.css";

const HomePCP = ({ voltar }) => {
  return (
    <div
      style={{
        backgroundImage: "url('/bg002.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-start",
        alignItems: "center",
      }}
    >
      <header
        style={{
          height: "100px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "0 1rem",
          backgroundColor: "rgba(255,255,255,0.5)",
          backdropFilter: "blur(6px)",
          width: "100%",
        }}
      >
        <img
          src="/LogomarcaDDnt2025Vazado.png"
          alt="Logo"
          style={{ width: "200px", marginTop: "2%" }}
        />
        <h1
          style={{
            fontSize: "2rem",
            fontWeight: "bold",
            color: "#8c3b1b",
            marginRight: "2ch",
          }}
        >
          Planejamento de Produção
        </h1>
      </header>

      <div
        style={{
          display: "flex",
          gap: "2rem",
          marginTop: "5rem",
          flexWrap: "wrap",
          justifyContent: "center",
        }}
      >
        <button className="botao-principal botao-inativo">Lançar Pedido</button>
        <button className="botao-principal botao-ativo">Alimentar Sabores</button>
      </div>

      <button
        style={{
          marginTop: "4rem",
          backgroundColor: "#8c3b1b",
          color: "#fff",
          padding: "0.7rem 2rem",
          borderRadius: "10px",
          border: "none",
          fontSize: "1.1rem",
        }}
        onClick={voltar}
      >
        Voltar
      </button>
    </div>
  );
};

export default HomePCP;

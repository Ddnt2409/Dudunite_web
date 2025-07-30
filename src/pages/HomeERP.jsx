// === FN01 – Importações Gerais ===
import React, { useState } from "react";

// === FN02 – Componente Principal ===
const HomeERP = () => {
  const [indice, setIndice] = useState(0);

  const botoesMacro = [
    { nome: "PRODUÇÃO" },
    { nome: "ADMINISTRAÇÃO" },
    { nome: "FINANCEIRO" },
  ];

  const proximo = () => {
    setIndice((indice + 1) % botoesMacro.length);
  };

  const anterior = () => {
    setIndice((indice - 1 + botoesMacro.length) % botoesMacro.length);
  };

  return (
    <>
      {/* === INÍCIO RT00 – Tela HomeERP === */}
      <div
        style={{
          backgroundImage: "url('/bg002.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
        }}
      >
        {/* === Cabeçalho Fixo === */}
        <header
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            zIndex: 10,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "0.15rem 0.5rem", // 50% menor
            backgroundColor: "rgba(255, 255, 255, 0.5)",
            backdropFilter: "blur(6px)",
            WebkitBackdropFilter: "blur(6px)",
          }}
        >
          <img
            src="/LogomarcaDDnt2025Vazado.png"
            alt="Logo Dudunitê"
            style={{ width: "170px", height: "auto" }}
          />
          <h1 style={{ color: "#8c3b1b", fontSize: "0.85rem" }}>ERP DUDUNITÊ</h1>
        </header>

        {/* === Carrossel Central === */}
        <div
          style={{
            position: "absolute",
            top: "20%",
            width: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "2rem",
          }}
        >
          {/* Botão Principal Ativo */}
          <div
            style={{
              backgroundColor: "#f7d7bc",
              padding: "2rem",
              borderRadius: "2rem",
              boxShadow: "8px 8px 18px rgba(0, 0, 0, 0.6)",
              textAlign: "center",
              width: "80%",
              maxWidth: "360px",
              fontSize: "2rem",
              fontWeight: "bold",
              color: "#5a1e00",
            }}
          >
            {botoesMacro[indice].nome}
          </div>

          {/* Botões de Navegação */}
          <div style={{ display: "flex", gap: "2rem" }}>
            <button
              onClick={anterior}
              style={{
                backgroundColor: "#8c3b1b",
                color: "white",
                padding: "0.8rem 1.5rem",
                border: "none",
                borderRadius: "1rem",
                fontSize: "1rem",
              }}
            >
              ◀
            </button>
            <button
              onClick={proximo}
              style={{
                backgroundColor: "#8c3b1b",
                color: "white",
                padding: "0.8rem 1.5rem",
                border: "none",
                borderRadius: "1rem",
                fontSize: "1rem",
              }}
            >
              ▶
            </button>
          </div>
        </div>

        {/* === Rodapé fixo === */}
        <footer
          style={{
            position: "absolute",
            bottom: "50px",
            width: "100%",
            backgroundColor: "rgba(140, 59, 27, 0.4)",
            color: "white",
            padding: "0.8rem",
            fontSize: "0.9rem",
          }}
        >
          <marquee behavior="scroll" direction="left">
            • Pequeno Príncipe • Salesianas • Céu Azul • Russas • Bora Gastar • Kaduh • Society Show • Degusty • Tio Valter • Vera Cruz • Pinheiros • Dourado • BMQ • CFC • Madre de Deus • Saber Viver • Interativo • Exato Sede • Exato Anexo • Sesi • Motivo • Jesus Salvador
          </marquee>
        </footer>
      </div>
      {/* === FIM RT00 === */}
    </>
  );
};

export default HomeERP;

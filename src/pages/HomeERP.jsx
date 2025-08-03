import React, { useState } from "react";
import HomePCP from "./HomePCP";
import "./fade.css";

const HomeERP = () => {
  const [tela, setTela] = useState("Home");
  const [zoomIndex, setZoomIndex] = useState(null);
  const [fadeState, setFadeState] = useState("fade-in");

  const botoes = [
    {
      label: "📦\nProdução (PCP)",
      action: () => {
        setFadeState("fade-out");
        setTimeout(() => setTela("PCP"), 300);
      },
      dropdown: [
        { nome: "Lançar Pedido", acao: () => setTela("PCP") },
        { nome: "Alimentar Sabores", acao: () => alert("Em breve") },
      ],
    },
    {
      label: "💰\nFinanceiro (FinFlux)",
      action: () => alert("Em breve"),
      dropdown: [
        { nome: "Contas a Receber", acao: () => alert("Em breve") },
        { nome: "Contas a Pagar", acao: () => alert("Em breve") },
      ],
    },
    {
      label: "📊\nAnálise de Custos",
      action: () => alert("Em breve"),
      dropdown: [
        { nome: "Custos por Produto", acao: () => alert("Em breve") },
        { nome: "Custos Fixos", acao: () => alert("Em breve") },
        { nome: "Custos Variáveis", acao: () => alert("Em breve") },
      ],
    },
  ];

  const handleClick = (index, action) => {
    if (zoomIndex === index) {
      action(); // Executa ação ao clicar de novo
    } else {
      setZoomIndex(index); // Ativa o zoom
    }
  };

  if (tela === "PCP") return <HomePCP />;

  return (
    <div
      className={fadeState}
      style={{
        backgroundImage: "url('/bg002.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
      }}
    >
      {/* === INÍCIO HEADER === */}
      <header
        style={{
          height: "140px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "0 1rem",
          backgroundColor: "rgba(255,255,255,0.5)",
          backdropFilter: "blur(6px)",
          WebkitBackdropFilter: "blur(6px)",
        }}
      >
        <img
          src="/LogomarcaDDnt2025Vazado.png"
          alt="Logo"
          style={{ width: "280px", marginTop: "3%" }}
        />
        <h1
          style={{
            fontSize: "2.6rem",
            fontWeight: "bold",
            color: "#8c3b1b",
            marginRight: "2ch",
          }}
        >
          ERP DUDUNITÊ
        </h1>
      </header>
      {/* === FIM HEADER === */}

      {/* === INÍCIO BOTÕES === */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: "4rem",
          flexWrap: "wrap",
          padding: "3rem 2rem",
          alignItems: "flex-start",
        }}
      >
        {botoes.map((btn, idx) => {
          const isZoomed = idx === zoomIndex;
          return (
            <div
              key={idx}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                transition: "all 0.3s ease",
              }}
            >
              <button
                onClick={() => handleClick(idx, btn.action)}
                style={{
                  width: isZoomed ? "286px" : "253px", // 30% vs 15%
                  height: isZoomed ? "286px" : "253px",
                  fontSize: isZoomed ? "2.4rem" : "2rem",
                  whiteSpace: "pre-line",
                  backgroundColor: isZoomed ? "#8c3b1b" : "#e6cfc2",
                  color: isZoomed ? "#fff" : "#8c3b1b",
                  border: "none",
                  borderRadius: "2rem",
                  boxShadow: "6px 6px 12px rgba(0,0,0,0.3)",
                  fontWeight: "bold",
                  transition: "all 0.3s ease",
                }}
              >
                {btn.label}
              </button>

              {isZoomed && (
                <div
                  style={{
                    marginTop: "2rem",
                    display: "flex",
                    flexDirection: "column",
                    gap: "1.5rem",
                    alignItems: "center",
                    transition: "opacity 0.5s ease",
                  }}
                >
                  {btn.dropdown.map((op, i) => (
                    <button
                      key={i}
                      onClick={op.acao}
                      style={{
                        padding: "1.2rem 2rem",
                        fontSize: "1.6rem",
                        borderRadius: "1.2rem",
                        backgroundColor: "#fff",
                        color: "#8c3b1b",
                        border: "2px solid #8c3b1b",
                        boxShadow: "2px 2px 6px rgba(0,0,0,0.2)",
                        fontWeight: "bold",
                        width: "240px",
                      }}
                    >
                      {op.nome}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
      {/* === FIM BOTÕES === */}

      {/* === INÍCIO RODAPÉ === */}
      <footer
        style={{
          backgroundColor: "rgba(140, 59, 27, 0.4)",
          color: "white",
          padding: "1.4rem",
          fontSize: "1.4rem",
          textAlign: "center",
          marginTop: "auto",
        }}
      >
        <marquee behavior="scroll" direction="left">
          • Pequeno Príncipe • Salesianas • Céu Azul • Russas • Bora Gastar •
          Kaduh • Society Show • Degusty • Tio Valter • Vera Cruz • Pinheiros •
          Dourado • BMQ • CFC • Madre de Deus • Saber Viver • Interativo •
          Exato Sede • Exato Anexo • Sesi • Motivo • Jesus Salvador
        </marquee>
      </footer>
      {/* === FIM RODAPÉ === */}
    </div>
  );
};

export default HomeERP;

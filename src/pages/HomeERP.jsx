import React, { useState } from "react";
import HomePCP from "./HomePCP";
import "./fade.css";

const HomeERP = () => {
  const [tela, setTela] = useState("Home");
  const [zoomIndex, setZoomIndex] = useState(1); // começa com o botão central

  const botoes = [
    {
      label: "📦\nProdução (PCP)",
      action: () => setTela("PCP"),
      dropdown: [
        { nome: "Lançar Pedido", acao: () => setTela("PCP") },
        { nome: "Alimentar Sabores", acao: () => alert("Em breve") },
      ],
    },
    {
      label: "💰\nFinanceiro (FinFlux)",
      action: () => {},
      dropdown: [
        { nome: "Contas a Receber", acao: () => alert("Em breve") },
        { nome: "Contas a Pagar", acao: () => alert("Em breve") },
      ],
    },
    {
      label: "📊\nAnálise de Custos",
      action: () => {},
      dropdown: [
        { nome: "Custos por Produto", acao: () => alert("Em breve") },
        { nome: "Custos Fixos", acao: () => alert("Em breve") },
        { nome: "Custos Variáveis", acao: () => alert("Em breve") },
      ],
    },
  ];

  const handleClick = (index, action) => {
    if (zoomIndex === index) {
      action();
    } else {
      setZoomIndex(index);
    }
  };

  if (tela === "PCP") return <HomePCP />;

  return (
    <div
      style={{
        backgroundImage: "url('/bg002.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        minHeight: "100vh",
        maxHeight: "100vh",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
      }}
    >
      {/* === INÍCIO HEADER === */}
      <header
        style={{
          height: "100px",
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
          style={{ width: "200px", marginTop: "1%" }}
        />
        <h1
          style={{
            fontSize: "2rem",
            fontWeight: "bold",
            color: "#8c3b1b",
            marginRight: "2ch",
          }}
        >
          ERP DUDUNITÊ
        </h1>
      </header>
      {/* === FIM HEADER === */}

      {/* === INÍCIO BOTÕES CENTRAIS COM SCROLL SNAP === */}
      <div
        style={{
          display: "flex",
          overflowX: "auto",
          scrollSnapType: "x mandatory",
          padding: "2rem 0",
          justifyContent: "center",
          alignItems: "center",
          gap: "3rem",
          scrollBehavior: "smooth",
        }}
      >
        {botoes.map((btn, idx) => {
          const isActive = idx === zoomIndex;
          return (
            <div
              key={idx}
              onClick={() => handleClick(idx, btn.action)}
              style={{
                scrollSnapAlign: "center",
                flex: "0 0 auto",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                transform: isActive ? "scale(1.3)" : "scale(1)",
                transition: "transform 0.3s ease",
              }}
            >
              <button
                style={{
                  width: "220px",
                  height: "220px",
                  fontSize: "1.8rem",
                  whiteSpace: "pre-line",
                  backgroundColor: isActive ? "#8c3b1b" : "#e6cfc2",
                  color: isActive ? "#fff" : "#8c3b1b",
                  border: "none",
                  borderRadius: "2rem",
                  boxShadow: "6px 6px 12px rgba(0,0,0,0.3)",
                  fontWeight: "bold",
                }}
              >
                {btn.label}
              </button>

              {isActive && (
                <div
                  className="fade"
                  style={{
                    marginTop: "1.5rem",
                    display: "flex",
                    flexDirection: "column",
                    gap: "1rem",
                    alignItems: "center",
                    position: "absolute",
                    zIndex: 5,
                    background: "rgba(255,255,255,0.9)",
                    padding: "1rem",
                    borderRadius: "1rem",
                    boxShadow: "0 0 10px rgba(0,0,0,0.2)",
                    top: "60%",
                  }}
                >
                  {btn.dropdown.map((op, i) => (
                    <button
                      key={i}
                      onClick={op.acao}
                      style={{
                        padding: "1rem 2rem",
                        fontSize: "1.4rem",
                        borderRadius: "1rem",
                        backgroundColor: "#fff",
                        color: "#8c3b1b",
                        border: "2px solid #8c3b1b",
                        boxShadow: "2px 2px 6px rgba(0,0,0,0.2)",
                        fontWeight: "bold",
                        width: "200px",
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
      {/* === FIM BOTÕES CENTRAIS === */}

      {/* === INÍCIO RODAPÉ === */}
      <footer
        style={{
          backgroundColor: "rgba(140, 59, 27, 0.4)",
          color: "white",
          padding: "1rem",
          fontSize: "1.2rem",
          textAlign: "center",
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

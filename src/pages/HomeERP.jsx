import React, { useState, useEffect, useRef } from "react";
import HomePCP from "./HomePCP";

const HomeERP = () => {
  const [tela, setTela] = useState("Home");
  const [focusIndex, setFocusIndex] = useState(1);
  const [aberto, setAberto] = useState(false);
  const carrosselRef = useRef(null);

  const botoes = [
    {
      label: "📦 Produção (PCP)",
      action: () => setTela("PCP"),
      dropdown: [
        { nome: "Lançar Pedido", acao: () => setTela("PCP") },
        { nome: "Alimentar Sabores", acao: () => alert("Em breve") },
      ],
    },
    {
      label: "💰 Financeiro (FinFlux)",
      action: () => {},
      dropdown: [
        { nome: "Contas a Receber", acao: () => alert("Em breve") },
        { nome: "Contas a Pagar", acao: () => alert("Em breve") },
        { nome: "Fluxo de Caixa", acao: () => alert("Em breve") },
      ],
    },
    {
      label: "📊 Análise de Custos",
      action: () => {},
      dropdown: [
        { nome: "Custos por Produto", acao: () => alert("Em breve") },
        { nome: "Custos Fixos", acao: () => alert("Em breve") },
        { nome: "Custos Variáveis", acao: () => alert("Em breve") },
      ],
    },
  ];

  const moverCarrossel = (direcao) => {
    const novoIndex = focusIndex + direcao;
    if (novoIndex >= 0 && novoIndex < botoes.length) {
      setFocusIndex(novoIndex);
      setAberto(false);
    }
  };

  useEffect(() => {
    if (carrosselRef.current) {
      const btns = carrosselRef.current.querySelectorAll(".carousel-button");
      const centralBtn = btns[focusIndex];
      if (centralBtn) {
        const container = carrosselRef.current;
        const scrollLeft =
          centralBtn.offsetLeft -
          container.offsetWidth / 2 +
          centralBtn.offsetWidth / 2;
        container.scrollTo({ left: scrollLeft, behavior: "smooth" });
      }
    }
  }, [focusIndex]);

  if (tela === "PCP") return <HomePCP />;

  return (
    <div
      style={{
        backgroundImage: "url('/bg002.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        minHeight: "100vh",
        position: "relative",
        overflowX: "hidden",
      }}
    >
      {/* Cabeçalho */}
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

      {/* Setas */}
      <button
        onClick={() => moverCarrossel(-1)}
        style={{
          position: "absolute",
          top: "50%",
          left: "2%",
          fontSize: "3rem",
          background: "none",
          border: "none",
          color: "#fff",
          zIndex: 10,
        }}
      >
        ←
      </button>
      <button
        onClick={() => moverCarrossel(1)}
        style={{
          position: "absolute",
          top: "50%",
          right: "2%",
          fontSize: "3rem",
          background: "none",
          border: "none",
          color: "#fff",
          zIndex: 10,
        }}
      >
        →
      </button>

      {/* Carrossel */}
      <div
        ref={carrosselRef}
        style={{
          display: "flex",
          justifyContent: "center",
          overflowX: "auto",
          scrollSnapType: "x mandatory",
          marginTop: "160px",
          padding: "2rem 0",
        }}
      >
        <div style={{ display: "flex", gap: "3rem", minWidth: "max-content" }}>
          {botoes.map((btn, idx) => {
            const isFocused = idx === focusIndex;
            return (
              <div
                key={idx}
                className="carousel-button"
                style={{
                  scrollSnapAlign: "center",
                  textAlign: "center",
                  transform: isFocused ? "scale(1.3)" : "scale(1)",
                  transition: "transform 0.4s ease",
                }}
              >
                <button
                  onClick={() => {
                    btn.action();
                    if (isFocused) setAberto(true);
                  }}
                  style={{
                    width: isFocused ? "390px" : "260px",
                    height: isFocused ? "390px" : "260px",
                    fontSize: isFocused ? "2.2rem" : "1.8rem",
                    backgroundColor: isFocused ? "#8c3b1b" : "#e6cfc2",
                    color: "#fff",
                    border: "none",
                    borderRadius: "1.5rem",
                    boxShadow: "6px 6px 12px rgba(0,0,0,0.3)",
                    fontWeight: "bold",
                    transition: "all 0.4s ease",
                  }}
                >
                  {btn.label}
                </button>

                {/* Submenu visível ao clicar */}
                {isFocused && aberto && (
                  <div
                    style={{
                      marginTop: "2.5rem",
                      display: "flex",
                      flexDirection: "column",
                      gap: "1rem",
                      alignItems: "center",
                    }}
                  >
                    {btn.dropdown.map((op, i) => (
                      <button
                        key={i}
                        onClick={op.acao}
                        style={{
                          padding: "0.9rem 1.5rem",
                          fontSize: "1.4rem",
                          borderRadius: "0.6rem",
                          backgroundColor: "#fff",
                          color: "#8c3b1b",
                          border: "2px solid #8c3b1b",
                          boxShadow: "2px 2px 6px rgba(0,0,0,0.2)",
                          fontWeight: "bold",
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
      </div>

      {/* Rodapé */}
      <footer
        style={{
          position: "relative",
          marginTop: "60px",
          backgroundColor: "rgba(140, 59, 27, 0.4)",
          color: "white",
          padding: "1.4rem",
          fontSize: "1.4rem",
          textAlign: "center",
        }}
      >
        <marquee behavior="scroll" direction="left">
          • Pequeno Príncipe • Salesianas • Céu Azul • Russas • Bora Gastar •
          Kaduh • Society Show • Degusty • Tio Valter • Vera Cruz • Pinheiros •
          Dourado • BMQ • CFC • Madre de Deus • Saber Viver • Interativo • Exato
          Sede • Exato Anexo • Sesi • Motivo • Jesus Salvador
        </marquee>
      </footer>
    </div>
  );
};

export default HomeERP;

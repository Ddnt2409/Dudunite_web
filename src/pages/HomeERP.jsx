// === INÍCIO HomeERP.jsx ===
import React, { useEffect, useRef, useState } from "react";
import HomePCP from "./HomePCP";

const HomeERP = () => {
  const [tela, setTela] = useState("Home");
  const [focusIndex, setFocusIndex] = useState(1);
  const carrosselRef = useRef(null);

  const botoes = [
    {
      label: "Produção (PCP)",
      action: () => setTela("PCP"),
      dropdown: [{ nome: "Ir para Produção", acao: () => setTela("PCP") }],
    },
    {
      label: "Financeiro (FinFlux)",
      action: () => {},
      dropdown: [
        { nome: "Contas a Receber", acao: () => alert("Em breve") },
        { nome: "Contas a Pagar", acao: () => alert("Em breve") },
        { nome: "Fluxo de Caixa", acao: () => alert("Em breve") },
      ],
    },
    {
      label: "Análise de Custos",
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
    }
  };

  useEffect(() => {
    if (tela === "Home" && carrosselRef.current) {
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
  }, [focusIndex, tela]);

  if (tela === "PCP") {
    return (
      <div style={{ animation: "fadein 0.8s ease-in-out" }}>
        <HomePCP />
      </div>
    );
  }

  return (
    <>
      {/* === INÍCIO RT00 – Tela Inicial ERP === */}
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
          position: "relative",
        }}
      >
        {/* Cabeçalho */}
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
            height: "140px",
            padding: "0 1rem",
            backgroundColor: "rgba(255, 255, 255, 0.5)",
            backdropFilter: "blur(6px)",
            WebkitBackdropFilter: "blur(6px)",
          }}
        >
          <img
            src="/LogomarcaDDnt2025Vazado.png"
            alt="Logo Dudunitê"
            style={{ width: "300px", marginTop: "4%" }}
          />
          <h1
            style={{
              color: "#8c3b1b",
              fontSize: "2.6rem",
              fontWeight: "bold",
              marginRight: "2ch",
            }}
          >
            <strong>ERP DUDUNITÊ</strong>
          </h1>
        </header>

        {/* Setas de navegação */}
        <button
          onClick={() => moverCarrossel(-1)}
          style={{
            position: "absolute",
            top: "50%",
            left: "5%",
            fontSize: "3rem",
            background: "none",
            border: "none",
            color: "#fff",
            zIndex: 5,
          }}
        >
          ←
        </button>
        <button
          onClick={() => moverCarrossel(1)}
          style={{
            position: "absolute",
            top: "50%",
            right: "5%",
            fontSize: "3rem",
            background: "none",
            border: "none",
            color: "#fff",
            zIndex: 5,
          }}
        >
          →
        </button>

        {/* Carrossel */}
        <div
          ref={carrosselRef}
          style={{
            marginTop: "180px",
            width: "100%",
            overflowX: "auto",
            padding: "2rem 0",
            display: "flex",
            justifyContent: "center",
            scrollSnapType: "x mandatory",
          }}
        >
          <div
            style={{
              display: "flex",
              gap: "2rem",
              padding: "1rem",
              minWidth: "max-content",
            }}
          >
            {botoes.map((btn, idx) => {
              const isFocused = idx === focusIndex;
              return (
                <div
                  key={idx}
                  className="carousel-button"
                  style={{
                    flexShrink: 0,
                    scrollSnapAlign: "center",
                    textAlign: "center",
                    transition: "transform 0.4s ease",
                    transform: isFocused ? "scale(1.3)" : "scale(0.7)",
                  }}
                >
                  <button
                    onClick={btn.action}
                    style={{
                      backgroundColor: isFocused ? "#8c3b1b" : "#e6cfc2",
                      color: "white",
                      width: isFocused ? "390px" : "200px",
                      height: isFocused ? "390px" : "200px",
                      borderRadius: "1rem",
                      border: "none",
                      fontSize: "1.6rem",
                      fontWeight: "bold",
                      boxShadow: isFocused
                        ? "10px 10px 20px rgba(0,0,0,0.6)"
                        : "4px 4px 8px rgba(0,0,0,0.3)",
                      transition: "all 0.3s ease",
                      zIndex: isFocused ? 2 : 1,
                    }}
                  >
                    {btn.label}
                  </button>

                  {/* Botões internos na vertical */}
                  {isFocused && (
                    <div
                      style={{
                        marginTop: "1rem",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: "0.6rem",
                        transition: "all 0.4s ease-in-out",
                      }}
                    >
                      {btn.dropdown.map((item, i) => (
                        <button
                          key={i}
                          onClick={item.acao}
                          style={{
                            padding: "0.6rem 1.2rem",
                            backgroundColor: "#fff",
                            color: "#8c3b1b",
                            borderRadius: "0.6rem",
                            border: "1px solid #8c3b1b",
                            fontWeight: "bold",
                            cursor: "pointer",
                            fontSize: "1.1rem",
                            boxShadow: "2px 2px 6px rgba(0,0,0,0.2)",
                          }}
                        >
                          {item.nome}
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
            position: "absolute",
            bottom: "70px",
            width: "100%",
            backgroundColor: "rgba(140, 59, 27, 0.4)",
            color: "white",
            padding: "1.4rem",
            fontSize: "1.6rem",
            textAlign: "center",
          }}
        >
          <marquee behavior="scroll" direction="left">
            • Pequeno Príncipe • Salesianas • Céu Azul • Russas • Bora Gastar •
            Kaduh • Society Show • Degusty • Tio Valter • Vera Cruz • Pinheiros
            • Dourado • BMQ • CFC • Madre de Deus • Saber Viver • Interativo •
            Exato Sede • Exato Anexo • Sesi • Motivo • Jesus Salvador
          </marquee>
        </footer>
      </div>
      {/* === FIM RT00 === */}
    </>
  );
};

export default HomeERP;
// === FIM HomeERP.jsx ===

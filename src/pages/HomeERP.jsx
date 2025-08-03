import React, { useState, useRef, useEffect } from "react";
import HomePCP from "./HomePCP";

const HomeERP = () => {
  const [tela, setTela] = useState("Home");
  const [focusIndex, setFocusIndex] = useState(0);
  const [zoomAtivo, setZoomAtivo] = useState(false);
  const carrosselRef = useRef(null);

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

  const handleScroll = () => {
    const container = carrosselRef.current;
    const scrollLeft = container.scrollLeft;
    const width = container.clientWidth;
    const idx = Math.round(scrollLeft / (width * 0.6));
    if (idx !== focusIndex) {
      setFocusIndex(idx);
      setZoomAtivo(false);
    }
  };

  useEffect(() => {
    const container = carrosselRef.current;
    if (!container) return;
    const scrollTo = focusIndex * (container.clientWidth * 0.6);
    container.scrollTo({ left: scrollTo, behavior: "smooth" });
  }, [focusIndex]);

  const handleBotaoMacro = (idx) => {
    if (idx === focusIndex) {
      setZoomAtivo(!zoomAtivo);
    } else {
      setFocusIndex(idx);
      setZoomAtivo(false);
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
        display: "flex",
        flexDirection: "column",
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

      {/* === INÍCIO CARROSSEL === */}
      <div
        ref={carrosselRef}
        onScroll={handleScroll}
        style={{
          display: "flex",
          flexDirection: "row",
          overflowX: "scroll",
          scrollSnapType: "x mandatory",
          padding: "4rem 0",
          scrollBehavior: "smooth",
          gap: "3rem",
          justifyContent: "center",
        }}
      >
        {botoes.map((btn, idx) => {
          const isFocused = idx === focusIndex;
          const isZoom = isFocused && zoomAtivo;

          return (
            <div
              key={idx}
              onClick={() => handleBotaoMacro(idx)}
              style={{
                flex: "0 0 auto",
                scrollSnapAlign: "center",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <button
                style={{
                  width: isFocused ? "300px" : "220px",
                  height: isFocused ? "300px" : "220px",
                  fontSize: isFocused ? "2.4rem" : "1.6rem",
                  whiteSpace: "pre-line",
                  backgroundColor: isFocused ? "#8c3b1b" : "#e6cfc2",
                  color: isFocused ? "white" : "#8c3b1b",
                  border: "none",
                  borderRadius: "2rem",
                  boxShadow: "6px 6px 12px rgba(0,0,0,0.3)",
                  fontWeight: "bold",
                  transition: "all 0.3s ease",
                }}
              >
                {btn.label}
              </button>

              {isZoom && (
                <div
                  style={{
                    marginTop: "2rem",
                    display: "flex",
                    flexDirection: "column",
                    gap: "1.5rem",
                    alignItems: "center",
                  }}
                >
                  {btn.dropdown.map((op, i) => (
                    <button
                      key={i}
                      onClick={op.acao}
                      style={{
                        padding: "1.4rem 2rem",
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
      {/* === FIM CARROSSEL === */}

      {/* === INÍCIO RODAPÉ === */}
      <footer
        style={{
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
          Dourado • BMQ • CFC • Madre de Deus • Saber Viver • Interativo •
          Exato Sede • Exato Anexo • Sesi • Motivo • Jesus Salvador
        </marquee>
      </footer>
      {/* === FIM RODAPÉ === */}
    </div>
  );
};

export default HomeERP;

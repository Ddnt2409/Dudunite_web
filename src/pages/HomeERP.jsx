import React, { useState, useRef, useEffect } from "react";
import HomePCP from "./HomePCP";
import "./fade.css"; // fade restaurado

const HomeERP = () => {
  const [tela, setTela] = useState("Home");
  const [zoomIndex, setZoomIndex] = useState(1);
  const [mostrarDropdown, setMostrarDropdown] = useState(false);
  const touchStartX = useRef(null);

  useEffect(() => {
    const elementos = document.querySelectorAll(".fade-zoom");
    elementos.forEach((el) => {
      el.classList.remove("fade-in");
      void el.offsetWidth;
      el.classList.add("fade-in");
    });
  }, [zoomIndex]);

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
      if (mostrarDropdown) action();
      else setMostrarDropdown(true);
    } else {
      setZoomIndex(index);
      setMostrarDropdown(false);
    }
  };

  const deslizar = (direcao) => {
    setZoomIndex((prev) => {
      const total = botoes.length;
      const novoIndex =
        direcao === "esquerda"
          ? (prev - 1 + total) % total
          : (prev + 1) % total;
      setMostrarDropdown(false);
      return novoIndex;
    });
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
        justifyContent: "space-between",
        overflow: "visible",
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
          ERP DUDUNITÊ
        </h1>
      </header>
      {/* === FIM HEADER === */}

      {/* === INÍCIO BOTÕES === */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          overflowX: "auto",
          scrollSnapType: "x mandatory",
          gap: "3rem",
          padding: "2rem 1rem 5rem",
        }}
        onTouchStart={(e) => (touchStartX.current = e.changedTouches[0].clientX)}
        onTouchEnd={(e) => {
          const diff = e.changedTouches[0].clientX - touchStartX.current;
          if (diff > 50) deslizar("esquerda");
          else if (diff < -50) deslizar("direita");
        }}
      >
        {botoes.map((btn, idx) => {
          const isZoomed = idx === zoomIndex;
          return (
            <div
              key={idx}
              className={`fade-zoom`}
              style={{
                flex: "0 0 auto",
                scrollSnapAlign: "center",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                transform: isZoomed ? "scale(1.35) translateY(10px)" : "scale(1)",
                transition: "transform 0.3s ease",
              }}
            >
              <button
                onClick={() => handleClick(idx, btn.action)}
                style={{
                  width: "220px",
                  height: "220px",
                  fontSize: "1.6rem",
                  whiteSpace: "pre-line",
                  backgroundColor: isZoomed ? "#8c3b1b" : "#e6cfc2",
                  color: isZoomed ? "#fff" : "#8c3b1b",
                  border: "none",
                  borderRadius: "2rem",
                  boxShadow: "6px 6px 12px rgba(0,0,0,0.3)",
                  fontWeight: "bold",
                }}
              >
                {btn.label}
              </button>

              {isZoomed && mostrarDropdown && (
                <div
                  style={{
                    marginTop: "1.5rem",
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
                        padding: "1rem 2rem",
                        fontSize: "1.4rem",
                        borderRadius: "1rem",
                        backgroundColor: "#fff",
                        color: "#8c3b1b",
                        border: "2px solid #8c3b1b",
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
      {/* === FIM BOTÕES === */}

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

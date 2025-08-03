import React, { useState, useRef } from "react";
import "./HomeERP.css"; // Reutiliza o CSS do ERP para manter padrão visual

const HomePCP = ({ navegarPara }) => {
  const [zoomIndex, setZoomIndex] = useState(0);
  const touchStartX = useRef(null);
  const [mostrarDropdown, setMostrarDropdown] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);

  const botoes = [
    {
      label: "📝\nLançar Pedido",
      action: () => alert("Tela de Lançar Pedido (em construção)"),
      dropdown: [],
    },
    {
      label: "🍫\nAlimentar Sabores",
      action: () => alert("Tela de Alimentar Sabores (em breve)"),
      dropdown: [],
    },
    {
      label: "🔙\nVoltar ao ERP",
      action: () => {
        setFadeOut(true);
        setTimeout(() => navegarPara("HomeERP"), 500);
      },
      dropdown: [],
    },
  ];

  const handleClick = (index, action) => {
    if (zoomIndex === index) {
      if (mostrarDropdown) {
        action();
      } else {
        setMostrarDropdown(true);
      }
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

  return (
    <div
      className={fadeOut ? "fade-out" : ""}
      style={{
        backgroundImage: "url('/bg002.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-start",
        overflowY: "auto",
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
          PCP – Produção
        </h1>
      </header>
      {/* === FIM HEADER === */}

      {/* === INÍCIO CONTEÚDO PRINCIPAL === */}
      <main style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <div
          style={{
            flexGrow: 1,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            overflowX: "auto",
            scrollSnapType: "x mandatory",
            gap: "3rem",
            padding: "2rem 1rem 0",
            width: "100%",
          }}
          onTouchStart={(e) =>
            (touchStartX.current = e.changedTouches[0].clientX)
          }
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
                style={{
                  flex: "0 0 auto",
                  scrollSnapAlign: "center",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                }}
              >
                <button
                  onClick={() => handleClick(idx, btn.action)}
                  className={`botao-principal ${
                    isZoomed ? "botao-ativo" : "botao-inativo"
                  }`}
                >
                  {btn.label}
                </button>

                {isZoomed && mostrarDropdown && btn.dropdown.length > 0 && (
                  <div className="dropdown-interno">
                    {btn.dropdown.map((op, i) => (
                      <button key={i} onClick={op.acao}>
                        {op.nome}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </main>
      {/* === FIM CONTEÚDO PRINCIPAL === */}

      {/* === INÍCIO RODAPÉ === */}
      <footer
        style={{
          backgroundColor: "rgba(140, 59, 27, 0.4)",
          color: "#ffffff",
          padding: "1rem",
          fontSize: "1.2rem",
          textAlign: "center",
          marginTop: "2rem",
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

export default HomePCP;

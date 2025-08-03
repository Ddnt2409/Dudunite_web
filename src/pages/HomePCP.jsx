// HomePCP.jsx
import React, { useState, useRef } from "react";
import "./HomeERP.css";

const HomePCP = ({ setTela }) => {
  const [zoomIndex, setZoomIndex] = useState(0);
  const touchStartX = useRef(null);
  const [mostrarDropdown, setMostrarDropdown] = useState(false);

  const botoes = [
    {
      label: "📝\nLançar Pedido",
      action: () => alert("Em breve: Lançar Pedido"),
      dropdown: [],
    },
    {
      label: "🍫\nAlimentar Sabores",
      action: () => alert("Em breve: Alimentar Sabores"),
      dropdown: [],
    },
    {
      label: "🔙\nVoltar",
      action: () => setTela("HomeERP"),
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
    <div className="container-principal">
      {/* === HEADER === */}
      <header className="cabecalho">
        <img src="/LogomarcaDDnt2025Vazado.png" alt="Logo" className="logo" />
        <h1 className="titulo-erp">ERP DUDUNITÊ</h1>
      </header>

      {/* === CONTEÚDO === */}
      <main className="corpo-central"
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
            <div key={idx} className="wrapper-botao">
              <button
                onClick={() => handleClick(idx, btn.action)}
                className={`botao-principal ${
                  isZoomed ? "botao-ativo" : "botao-inativo"
                }`}
              >
                {btn.label}
              </button>
            </div>
          );
        })}
      </main>

      {/* === RODAPÉ === */}
      <footer className="rodape">
        <marquee behavior="scroll" direction="left">
          • Pequeno Príncipe • Salesianas • Céu Azul • Russas • Bora Gastar •
          Kaduh • Society Show • Degusty • Tio Valter • Vera Cruz • Pinheiros •
          Dourado • BMQ • CFC • Madre de Deus • Saber Viver • Interativo •
          Exato Sede • Exato Anexo • Sesi • Motivo • Jesus Salvador
        </marquee>
      </footer>
    </div>
  );
};

export default HomePCP;

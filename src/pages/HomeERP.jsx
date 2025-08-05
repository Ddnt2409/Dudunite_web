import React, { useState, useRef } from "react";
import HomePCP from "./HomePCP";
import "./HomeERP.css";

export default function HomeERP() {
  const [tela, setTela] = useState("Home");
  const touchStartX = useRef(null);
  const [zoomIndex, setZoomIndex] = useState(1);
  const [mostrarDropdown, setMostrarDropdown] = useState(false);

  const botoes = [
    {
      label: "📦\nProdução (PCP)",
      action: () => setTela("PCP"),
      dropdown: [],
    },
    {
      label: "💰\nFinanceiro (FinFlux)",
      action: () => alert("Em construção"),
      dropdown: [],
    },
    {
      label: "📊\nAnálise de Custos",
      action: () => alert("Em construção"),
      dropdown: [],
    },
    {
      label: "👨‍🍳\nCozinha",
      action: () => alert("Em construção"),
      dropdown: [],
    },
  ];

  // Roteamento para PCP
  if (tela === "PCP") {
    return <HomePCP setTela={setTela} />;
  }

  const handleClick = (idx, action) => {
    // se for o botão PCP (idx=0), chama SEM ZOOM
    if (idx === 0) {
      action();
      return;
    }
    // para os outros, primeiro faz zoom, depois dropdown
    if (zoomIndex === idx) {
      setMostrarDropdown((m) => !m);
    } else {
      setZoomIndex(idx);
      setMostrarDropdown(false);
    }
  };

  const deslizar = (direcao) => {
    setZoomIndex((prev) => {
      const total = botoes.length;
      const novo = direcao === "esquerda"
        ? (prev - 1 + total) % total
        : (prev + 1) % total;
      setMostrarDropdown(false);
      return novo;
    });
  };

  return (
    <div className="home-erp">
      <header className="erp-header">
        <img src="/LogomarcaDDnt2025Vazado.png" alt="Logo" className="erp-logo" />
        <h1 className="erp-titulo">ERP DUDUNITÊ</h1>
      </header>

      <main
        className="erp-main"
        onTouchStart={(e) => (touchStartX.current = e.changedTouches[0].clientX)}
        onTouchEnd={(e) => {
          const diff = e.changedTouches[0].clientX - touchStartX.current;
          if (diff > 50) deslizar("esquerda");
          else if (diff < -50) deslizar("direita");
        }}
      >
        {botoes.map((btn, idx) => {
          const isActive = idx === zoomIndex;
          return (
            <div key={idx} className="erp-botao-container">
              <button
                onClick={() => handleClick(idx, btn.action)}
                className={`botao-principal ${isActive ? "botao-ativo" : "botao-inativo"}`}
              >
                {btn.label}
              </button>

              {isActive && mostrarDropdown && btn.dropdown.length > 0 && (
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
      </main>

      <footer className="erp-footer">
        <marquee behavior="scroll" direction="left">
          • Pequeno Príncipe • Salesianas • Céu Azul • Russas • Bora Gastar •
          Kaduh • Society Show • Degusty • Tio Valter • Vera Cruz • Pinheiros •
          Dourado • BMQ • CFC • Madre de Deus • Saber Viver • Interativo •
          Exato Sede • Exato Anexo • Sesi • Motivo • Jesus Salvador
        </marquee>
      </footer>
    </div>
  );
}

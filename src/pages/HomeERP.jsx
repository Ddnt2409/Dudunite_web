import React, { useState, useRef } from "react";
import HomePCP from "./HomePCP";
import "./HomeERP.css";

const HomeERP = () => {
  const [tela, setTela] = useState("Home");
  const [zoomIndex, setZoomIndex] = useState(0);
  const touchStartX = useRef(null);
  const [mostrarDropdown, setMostrarDropdown] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);

  const botoes = [
    {
      label: "📦\nProdução (PCP)",
      action: () => {
        setFadeOut(true);
        setTimeout(() => setTela("PCP"), 300);
      },
      dropdown: [
        { nome: "Lançar Pedido", acao: () => setTela("LanPed") },
        { nome: "Alimentar Sabores", acao: () => alert("Em construção") },
      ],
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

  const handleClick = (index, action) => {
    if (zoomIndex === index) {
      // se já está ativo, abre action ou dropdown
      if (botoes[index].dropdown.length) {
        setMostrarDropdown((m) => !m);
      } else {
        action();
      }
    } else {
      setZoomIndex(index);
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

  // roteamento interno
  if (tela === "PCP") return <HomePCP setTela={setTela} />;
  if (tela === "LanPed") return <HomePCP setTela={setTela} lan />;

  return (
    <div className={`home-erp ${fadeOut ? "fade-out" : ""}`}>
      <header className="erp-header">
        <img
          src="/LogomarcaDDnt2025Vazado.png"
          alt="Logo"
          className="erp-logo"
        />
        <h1 className="erp-titulo">ERP DUDUNITÊ</h1>
      </header>

      <main className="erp-main">
        {botoes.map((btn, idx) => {
          const isZoomed = idx === zoomIndex;
          return (
            <div key={idx} className="erp-botao-container">
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
};

export default HomeERP;

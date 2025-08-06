import React, { useState, useRef } from "react";
import "./HomeERP.css";

export default function HomeERP({ setTela }) {
  const [zoomIndex, setZoomIndex] = useState(0);
  const [mostrarDropdown, setMostrarDropdown] = useState(false);
  const touchStartX = useRef(null);

  const botoes = [
    {
      label: "📦\nProdução (PCP)",
      action: () => setTela("HomePCP"),
      dropdown: [
        { nome: "Lançar Pedido", acao: () => setTela("LanPed") },
        { nome: "Alimentar Sabores", acao: () => setTela("AlimSab") },
      ],
    },
    {
      label: "💰\nFinanceiro",
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
    {
      label: "👨‍🍳\nCozinha",
      action: () => alert("Em breve"),
      dropdown: [],
    },
  ];

  const handleClick = (idx, action) => {
    if (zoomIndex === idx) {
      setMostrarDropdown(d => !d);
      if (mostrarDropdown) action();
    } else {
      setZoomIndex(idx);
      setMostrarDropdown(false);
    }
  };

  const deslizar = dir => {
    setZoomIndex(prev => {
      const total = botoes.length;
      const next = dir === "esquerda"
        ? (prev - 1 + total) % total
        : (prev + 1) % total;
      setMostrarDropdown(false);
      return next;
    });
  };

  return (
    <div className="homeerp-container">
      {/* HEADER */}
      <div className="homeerp-header">
        <img
          src="/LogomarcaDDnt2025Vazado.png"
          alt="Logo Dudunitê"
          className="homeerp-logo"
        />
        <h1 className="homeerp-title">ERP DUDUNITÊ</h1>
      </div>

      {/* BOTÕES PRINCIPAIS */}
      <div
        className="homeerp-buttons"
        onTouchStart={e => (touchStartX.current = e.changedTouches[0].clientX)}
        onTouchEnd={e => {
          const diff = e.changedTouches[0].clientX - touchStartX.current;
          if (diff > 50) deslizar("esquerda");
          else if (diff < -50) deslizar("direita");
        }}
      >
        {botoes.map((btn, idx) => {
          const isActive = idx === zoomIndex;
          return (
            <div key={idx} className="button-wrapper">
              <button
                className={`primary-button ${isActive ? "active" : "inactive"}`}
                onClick={() => handleClick(idx, btn.action)}
              >
                {btn.label}
              </button>
              {isActive && mostrarDropdown && btn.dropdown.length > 0 && (
                <div className="dropdown-inner">
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

      {/* BOTÃO VOLTAR */}
      <button className="volver-button" onClick={() => setTela("HomeERP")}>
        🔙 Voltar ao ERP
      </button>

      {/* RODAPÉ ANIMADO */}
      <div className="marquee-container">
        <span className="marquee-content">
          • Pequeno Príncipe • Salesianas • Céu Azul • Russas • Bora Gastar • Kaduh • Society Show • Degusty • Tio Valter • Vera Cruz • Pinheiros • Dourado • BMQ • CFC • Madre de Deus • Saber Viver • Interativo • Exato Sede • Exato Anexo • Sesi • Motivo • Jesus Salvador
        </span>
      </div>
    </div>
  );
}

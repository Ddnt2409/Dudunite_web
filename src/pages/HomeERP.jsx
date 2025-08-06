// src/pages/HomeERP.jsx
import React, { useState, useRef } from "react";
import HomePCP from "./HomePCP";
import "./HomeERP.css";

export default function HomeERP() {
  const [tela, setTela] = useState("Home");       // "Home" ou "PCP"
  const [zoomIndex, setZoomIndex] = useState(0);  // índice do botão ampliado
  const [mostrarDropdown, setMostrarDropdown] = useState(false);
  const touchStartX = useRef(null);

  // definição dos botões e seus sub-itens
  const botoes = [
    {
      label: "📦\nProdução (PCP)",
      action: () => setTela("PCP"),
      dropdown: [
        { nome: "Lançar Pedido", acao: () => setTela("LanPed") },
        { nome: "Alimentar Sabores", acao: () => alert("Em breve") },
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

  // clique num botão principal
  const handleClick = (idx, action) => {
    if (zoomIndex === idx) {
      // já estava ampliado: alterna dropdown
      setMostrarDropdown(d => !d);
      if (mostrarDropdown) action();
    } else {
      // amplifica este e esconde dropdown
      setZoomIndex(idx);
      setMostrarDropdown(false);
    }
  };

  // swipe horizontal para navegar botões
  const deslizar = dir => {
    setZoomIndex(prev => {
      const total = botoes.length;
      const next =
        dir === "esquerda"
          ? (prev - 1 + total) % total
          : (prev + 1) % total;
      setMostrarDropdown(false);
      return next;
    });
  };

  // Se entrou em PCP, renderiza HomePCP
  if (tela === "PCP") {
    return <HomePCP setTela={setTela} />;
  }

  // ======== RENDERIZAÇÃO DA TELA ERP =========
  return (
    <div className="homepcp-container">
      {/* HEADER */}
      <div className="homepcp-header">
        <img
          src="/LogomarcaDDnt2025Vazado.png"
          alt="Logo Dudunitê"
          className="logo-pcp"
        />
        <h1 className="homepcp-titulo">ERP DUDUNITÊ</h1>
      </div>

      {/* BOTÕES PRINCIPAIS (com swipe) */}
      <div
        className="botoes-pcp"
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
            <div key={idx} className="botao-wrapper">
              <button
                className={`botao-principal ${
                  isActive ? "botao-ativo" : "botao-inativo"
                }`}
                onClick={() => handleClick(idx, btn.action)}
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
      </div>

      {/* BOTÃO VOLTAR AO ERP (fica na Home local) */}
      <button className="botao-voltar" onClick={() => setTela("Home")}>
        🔙 Voltar ao ERP
      </button>

      {/* RODAPÉ ANIMADO */}
      <div className="lista-escolas">
        <span className="marquee-content">
          • Pequeno Príncipe • Salesianas • Céu Azul • Russas • Bora Gastar •
          Kaduh • Society Show • Degusty • Tio Valter • Vera Cruz • Pinheiros •
          Dourado • BMQ • CFC • Madre de Deus • Saber Viver • Interativo • Exato
          Sede • Exato Anexo • Sesi • Motivo • Jesus Salvador
        </span>
      </div>
    </div>
  );
}

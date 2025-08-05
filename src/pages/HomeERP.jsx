// src/pages/HomeERP.jsx
import React, { useState, useRef, useEffect } from "react";
import HomePCP from "./HomePCP";
import LanPed from "./LanPed";
import "./HomeERP.css";

const botoes = [
  {
    label: "📦\nProdução (PCP)",
    id: "PCP",
    dropdown: [
      { nome: "Lançar Pedido", acaoId: "LanPed" },
      { nome: "Alimentar Sabores", acaoId: "AlimSab" },
    ],
  },
  {
    label: "💰\nFinanceiro (FinFlux)",
    id: "FinFlux",
    dropdown: [],
  },
  {
    label: "📊\nAnálise de Custos",
    id: "Analise",
    dropdown: [],
  },
  {
    label: "👨‍🍳\nCozinha",
    id: "Cozinha",
    dropdown: [],
  },
];

export default function HomeERP() {
  const [tela, setTela] = useState("Home");
  const [zoomIndex, setZoomIndex] = useState(0);
  const [mostrarDropdown, setMostrarDropdown] = useState(false);
  const touchStartX = useRef(null);

  // Se a tela mudar para PCP ou LanPed, renderiza o componente específico
  if (tela === "PCP") return <HomePCP setTela={setTela} />;
  if (tela === "LanPed") return <LanPed setTela={setTela} />;

  // resto da tela HomeERP
  const handleClick = (idx, botao) => {
    if (zoomIndex === idx) {
      // se clicar novamente no mesmo botão, abre o dropdown ou chama a ação
      if (botao.dropdown.length) {
        setMostrarDropdown((m) => !m);
      }
    } else {
      setZoomIndex(idx);
      setMostrarDropdown(false);
    }
  };

  const deslizar = (direcao) => {
    setZoomIndex((prev) => {
      const total = botoes.length;
      return direcao === "esquerda"
        ? (prev - 1 + total) % total
        : (prev + 1) % total;
    });
    setMostrarDropdown(false);
  };

  return (
    <div
      className="home-erp"
      onTouchStart={(e) => (touchStartX.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        const diff = e.changedTouches[0].clientX - touchStartX.current;
        if (diff > 50) deslizar("esquerda");
        if (diff < -50) deslizar("direita");
      }}
    >
      <header className="erp-header">
        <img
          src="/LogomarcaDDnt2025Vazado.png"
          alt="Logo Dudunitê"
          className="erp-logo"
        />
        <h1 className="erp-titulo">ERP DUDUNITÊ</h1>
      </header>

      <main className="erp-main">
        {botoes.map((btn, idx) => {
          const ativo = idx === zoomIndex;
          return (
            <div key={btn.id} className="botao-container">
              <button
                className={`botao-principal ${
                  ativo ? "botao-ativo" : "botao-inativo"
                }`}
                onClick={() => handleClick(idx, btn)}
              >
                {btn.label}
              </button>
              {ativo && mostrarDropdown && btn.dropdown.length > 0 && (
                <div className="dropdown-interno">
                  {btn.dropdown.map((op) => (
                    <button
                      key={op.acaoId}
                      onClick={() => setTela(op.acaoId)}
                    >
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
          Exato Sede • Exato Anexo • Sesi • Motivo • Jesus Salvador •
        </marquee>
      </footer>
    </div>
  );
}

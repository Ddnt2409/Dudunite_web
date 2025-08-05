import React, { useState, useRef } from "react";
import HomePCP from "./HomePCP";
import LanPed from "./LanPed";
import "./HomeERP.css";

const botoes = [
  {
    id: "PCP",
    label: "📦\nProdução (PCP)",
    actionId: "PCP",
    dropdown: [
      { nome: "Lançar Pedido", acaoId: "LanPed" },
      { nome: "Alimentar Sabores", acaoId: "AlimSab" },
    ],
  },
  {
    id: "FinFlux",
    label: "💰\nFinanceiro (FinFlux)",
    actionId: null,
    dropdown: [],
  },
  {
    id: "Analise",
    label: "📊\nAnálise de Custos",
    actionId: null,
    dropdown: [],
  },
  {
    id: "Cozinha",
    label: "👨‍🍳\nCozinha",
    actionId: null,
    dropdown: [],
  },
];

export default function HomeERP() {
  const [tela, setTela] = useState("Home");
  const [zoomIndex, setZoomIndex] = useState(0);
  const [mostrarDropdown, setMostrarDropdown] = useState(false);

  // roteamento interno
  if (tela === "PCP") return <HomePCP setTela={setTela} />;
  if (tela === "LanPed") return <LanPed setTela={setTela} />;

  const handleClick = (idx, botao) => {
    if (zoomIndex !== idx) {
      // escolhe botão
      setZoomIndex(idx);
      setMostrarDropdown(false);
    } else {
      // já selecionado: primeiro tenta ação direta
      if (botao.actionId) {
        setTela(botao.actionId);
      } else if (botao.dropdown.length) {
        setMostrarDropdown((m) => !m);
      }
    }
  };

  return (
    <div className="home-erp">
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

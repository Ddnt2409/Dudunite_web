// src/pages/HomePCP.jsx
import React, { useState } from 'react';
import './HomePCP.css';

export default function HomePCP({ setTela }) {
  // Deixe true para aparecer aberto (igual ao comportamento antigo).
  // Se quiser iniciar fechado, troque para false.
  const [showProducao, setShowProducao] = useState(true);

  return (
    <div className="homepcp-container">
      {/* === HEADER === */}
      <div className="homepcp-header">
        <img
          src="/LogomarcaDDnt2025Vazado.png"
          alt="Logo Dudunitê"
          className="logo-pcp"
        />
        <h1 className="homepcp-titulo">PCP – Planejamento de Produção</h1>
      </div>

      {/* === GRUPO: PRODUÇÃO (accordion) === */}
      <section className="grupo-pcp">
        <button
          className="grupo-header"
          onClick={() => setShowProducao(v => !v)}
          aria-expanded={showProducao}
        >
          <span>📦 Produção (PCP)</span>
          <span className={`chevron ${showProducao ? 'aberto' : ''}`}>▾</span>
        </button>

        <div
          className={`grupo-body ${showProducao ? 'open' : ''}`}
          style={{ display: showProducao ? 'block' : 'none' }} // garante visibilidade mesmo sem CSS novo
        >
          {/* === BOTÕES INTERNOS === */}
          <div className="botoes-pcp">
            <div className="botao-wrapper">
              <button
                className="botao-principal"
                onClick={() => setTela('LanPed')}
              >
                📝<br />
                Lançar Pedido
              </button>
            </div>

            <div className="botao-wrapper">
              <button
                className="botao-principal"
                onClick={() => setTela('AliSab')}
              >
                🍫<br />
                Alimentar Sabores
              </button>
            </div>

            <div className="botao-wrapper">
              <button
                className="botao-principal"
                onClick={() => setTela('StaPed')}
              >
                📊<br />
                Status dos Pedidos
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* === VOLTAR === */}
      <button
        className="botao-voltar"
        onClick={() => setTela('HomeERP')}
      >
        🔙 Voltar ao ERP
      </button>

      {/* === RODAPÉ ANIMADO === */}
      <div className="lista-escolas">
        <span className="marquee-content">
          • Cruz • Pinheiros • Dourado • BMQ • CFC • Madre de Deus • Saber Viver •
          Interativo • Exato Sede • Exato Anexo • Society Show • Russas • Kaduh •
          Degusty • Bora Gastar • Salesianas • Céu Azul • Pequeno Príncipe •
          Tio Valter • Vera Cruz
        </span>
      </div>
    </div>
  );
}

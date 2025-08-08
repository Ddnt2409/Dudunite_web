// src/pages/HomePCP.jsx
import React, { useState } from 'react';
import './HomePCP.css';

export default function HomePCP({ setTela }) {
  const [saboresZoomed, setSaboresZoomed] = useState(false);

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

      {/* === BOTÕES PRINCIPAIS === */}
      <div className="botoes-pcp">
        <div className="botao-wrapper">
          <button
            className="botao-principal botao-ativo"
            onClick={() => setTela('LanPed')}
          >
            📝<br />
            Lançar Pedido
          </button>
        </div>

        <div className="botao-wrapper">
          <button
            className={`botao-principal ${saboresZoomed ? 'botao-ativo' : 'botao-inativo'}`}
            onClick={() => setSaboresZoomed(z => !z)}
            onDoubleClick={() => setTela('AliSab')}
          >
            🍫<br />
            Alimentar Sabores
          </button>
        </div>
      </div>

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

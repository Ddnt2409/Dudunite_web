// src/pages/HomeERP.jsx
import React from 'react';
import './HomeERP.css';

export default function HomeERP({ setTela }) {
  return (
    <div className="homeerp-container">
      {/* Cabeçalho */}
      <header className="homeerp-header">
        <img
          src="/LogomarcaDDnt2025Vazado.png"
          alt="Logo Dudunitê"
          className="logo-erp"
        />
        <h1 className="homeerp-titulo">ERP – Sistema Administrativo</h1>
      </header>

      {/* Corpo com botões */}
      <main className="homeerp-main">
        <button
          className="botao-erp"
          onClick={() => setTela('HomePCP')}
        >
          🛠️ PCP – Planejamento e Controle de Produção
        </button>
        <button
          className="botao-erp"
          onClick={() => alert('Módulo Financeiro em desenvolvimento')}
        >
          💰 Financeiro
        </button>
        <button
          className="botao-erp"
          onClick={() => alert('Módulo Relatórios em desenvolvimento')}
        >
          📊 Relatórios
        </button>
      </main>

      {/* Rodapé animado */}
      <footer className="homeerp-footer">
        <div className="lista-escolas">
          <span className="marquee-content">
            • Cruz • Pinheiros • Dourado • BMQ • CFC • Madre de Deus • Saber Viver •
            Interativo • Exato Sede • Exato Anexo • Society Show • Russas • Kaduh •
            Degusty • Bora Gastar • Salesianas • Céu Azul • Pequeno Príncipe •
            Tio Valter • Vera Vera
          </span>
        </div>
      </footer>
    </div>
);
}

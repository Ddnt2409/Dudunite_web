// src/pages/HomePCP.jsx

import React from 'react';
import './HomePCP.css';

export default function HomePCP({ setTela }) {
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
        {/* Botão 1 – Lançar Pedido */}
        <div className="botao-wrapper">
          <button
            className="botao-principal botao-ativo"
            onClick={() => setTela('LanPed')}
          >
            📝<br />
            Lançar Pedido
          </button>
        </div>

        {/* Botão 2 – Alimentar Sabores (inativo até implementação) */}
        <div className="botao-wrapper">
          <button
            className="botao-principal botao-inativo"
            onClick={() => alert('Em breve: Alimentar Sabores')}
          >
            🍫<br />
            Alimentar Sabores
          </button>
        </div>
      </div>

      {/* === BOTÃO VOLTAR === */}
      <button
        className="botao-voltar"
        onClick={() => setTela('HomeERP')}
      >
        🔙 Voltar ao ERP
      </button>

      {/* === RODAPÉ – lista de PDVs animada === */}
      <div className="lista-escolas">
        • Pequeno Príncipe • Salesianas • Céu Azul • Russas • Bora Gastar • Kaduh • Society Show • Degusty • Tio Valter • Vera Cruz • Pinheiros • Dourado • BMQ • CFC • Madre de Deus • Saber Viver • Interativo • Exato Sede • Exato Anexo • Sesi • Motivo • Jesus Salvador
      </div>
    </div>
  );
}

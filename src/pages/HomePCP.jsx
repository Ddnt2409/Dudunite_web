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
        <button
          className="botao-principal botao-ativo"
          onClick={() => setTela('LanPed')}  // ← chama LanPed
        >
          📝<br />
          Lançar Pedido
        </button>

        {/* Botão 2 – Alimentar Sabores */}
        <button
          className="botao-principal botao-inativo"
          onClick={() => setTela('AlimSab')} // se não existir, mantém inativo
        >
          🍫<br />
          Alimentar Sabores
        </button>
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
        Cruz • Pinheiros • Dourado • BMQ • CFC • Madre de Deus • Saber Viver •
        Interativo • Exato Sede • Exato Anexo • Society Show • Russas • Kaduh •
        Degusty • Bora Gastar • Salesianas • Céu Azul • Pequeno Príncipe •
        Tio Valter • Vera Vera • Recife • Caruaru
      </div>
    </div>
  );
}

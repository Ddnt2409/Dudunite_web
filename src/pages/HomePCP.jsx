import React from 'react';
import './HomePCP.css';

export default function HomePCP({ setTela }) {
  return (
    <div className="pcp-container">
      <header className="pcp-header">
        <img
          src="/LogomarcaDDnt2025Vazado.png"
          alt="Logo Dudunitê"
          className="pcp-logo"
        />
        <h1 className="pcp-titulo">PCP – Planejamento de Produção</h1>
      </header>

      <main className="pcp-main">
        <button
          className="botao-principal"
          onClick={() => setTela('LanPed')}
        >
          📝<br/>Lançar Pedido
        </button>
        <button
          className="botao-principal botao-inativo"
          onClick={() => alert('Em construção')}
        >
          🍫<br/>Alimentar Sabores
        </button>
      </main>

      <footer className="pcp-footer">
        <button
          className="botao-voltar"
          onClick={() => setTela('Home')}
        >
          🔙 Voltar ao ERP
        </button>
      </footer>
    </div>
  );
}

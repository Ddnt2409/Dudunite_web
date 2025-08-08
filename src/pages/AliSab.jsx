// src/pages/AliSab.jsx
import React from 'react';
import './AliSab.css';

export default function AliSab({ setTela }) {
  return (
    <div className="alisab-container">
      <header className="alisab-header">
        <h2>🍫 Alimentar Sabores (Teste)</h2>
        <button
          className="botao-voltar-alisab"
          onClick={() => setTela('HomePCP')}
        >
          🔙 Voltar ao PCP
        </button>
      </header>

      <p className="teste-conteudo">
        Se você está vendo este texto, o AliSab carregou corretamente!
      </p>
    </div>
  );
}

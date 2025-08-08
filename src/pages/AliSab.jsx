import React from 'react';
import './AliSab.css'; // Se tiver estilos específicos

export default function AliSab({ setTela }) {
  return (
    <div className="alisab-container">
      <header className="alisab-header">
        <h1>🍫 Alimentar Sabores</h1>
        <button className="botao-voltar" onClick={() => setTela('HomePCP')}>
          🔙
        </button>
      </header>
      {/* Aqui virá sua lista de post-its e lógica */}
    </div>
  );
}

// src/pages/AliSab.jsx
import React, { useEffect } from 'react';
import './AliSab.css';

export default function AliSab({ setTela }) {
  useEffect(() => {
    console.log('AliSab entrou!');
  }, []);

  return (
    <div className="alisab-container">
      <header className="alisab-header">
        <h1>🍫 Alimentar Sabores</h1>
        <button className="botao-voltar" onClick={() => setTela('HomePCP')}>
          🔙 Voltar ao PCP
        </button>
      </header>

      {/* Conteúdo provisório */}
      <main className="alisab-main">
        <p style={{ color: '#000', background: '#fff', padding: '1rem' }}>
          Se você vê isto, a tela está funcionando!
        </p>
      </main>
    </div>
  );
}

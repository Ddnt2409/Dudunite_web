// src/pages/AliSab.jsx
import React from 'react';

export default function AliSab({ setTela }) {
  return (
    <div style={{ padding: 20 }}>
      <h1>🍫 Alimentar Sabores</h1>
      <p>Esta é a tela de Alimentar Sabores.</p>
      <button onClick={() => setTela('HomePCP')}>
        🔙 Voltar ao PCP
      </button>
    </div>
  );
}

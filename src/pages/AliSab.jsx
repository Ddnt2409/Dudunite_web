// src/pages/AliSab.jsx
import React from 'react';

export default function AliSab({ setTela }) {
  return (
    <div
      style={{
        padding: 20,
        backgroundColor: '#ffffff',
        minHeight: '100vh',
        boxSizing: 'border-box'
      }}
    >
      <h1 style={{ marginBottom: 16 }}>🍫 Alimentar Sabores</h1>
      <p style={{ marginBottom: 32 }}>
        Se você está vendo este texto, a tela carregou corretamente!
      </p>
      <button
        style={{
          padding: '0.8rem 1.2rem',
          fontSize: '1rem',
          background: '#8c3b1b',
          color: '#fff',
          border: 'none',
          borderRadius: 4,
          cursor: 'pointer'
        }}
        onClick={() => setTela('HomePCP')}
      >
        🔙 Voltar ao PCP
      </button>
    </div>
  );
}

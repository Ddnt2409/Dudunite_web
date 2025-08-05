import React from 'react';

function LanPed({ setTela }) {
  return (
    <div
      style={{
        backgroundColor: '#fff5ec',
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#8c3b1b',
        fontSize: '2rem',
        fontWeight: 'bold',
      }}
    >
      <p>👍 LanPed OK!</p>

      <button
        style={{
          marginTop: '2rem',
          backgroundColor: '#8c3b1b',
          color: 'white',
          padding: '0.8rem 2rem',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          fontSize: '1.2rem',
        }}
        onClick={() => setTela('HomePCP')}
      >
        Voltar
      </button>
    </div>
  );
}

export default LanPed;

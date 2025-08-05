// ============================================
// QD01 – IMPORTS E CONFIGURAÇÕES INICIAIS
// ============================================

import React from 'react';

// ============================================
// QD02 – COMPONENTE PRINCIPAL
// ============================================

const LanPed = (props) => {
  return (
    <div
      style={{
        backgroundColor: '#fff5ec',
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
      }}
    >
      <h1 style={{ fontSize: '2rem', color: '#8c3b1b' }}>📋 Lançar Pedido</h1>

      <button
        onClick={() => props.setTela("HomePCP")}
        style={{
          marginTop: '2rem',
          padding: '1rem 2rem',
          fontSize: '1.1rem',
          backgroundColor: '#8c3b1b',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
        }}
      >
        ⬅ Voltar ao PCP
      </button>
    </div>
  );
};

// ============================================
// QD99 – EXPORTAÇÃO
// ============================================

export default LanPed;

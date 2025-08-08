// src/pages/HomePCP.jsx
import React from 'react';

export default function HomePCP({ setTela }) {
  return (
    <div style={{ padding: 20 }}>
      <h1>📋 Home PCP</h1>
      <button onClick={() => setTela('LanPed')}>
        Ir para Lançar Pedido
      </button>
      <br/><br/>
      <button onClick={() => setTela('AliSab')}>
        Ir para Alimentar Sabores
      </button>
      <br/><br/>
      <button onClick={() => setTela('HomeERP')}>
        Voltar ao ERP
      </button>
    </div>
  );
}

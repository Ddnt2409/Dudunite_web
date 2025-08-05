import React from 'react';
import './LanPed.css'; // 👈 Só se quiser aplicar o CSS visual separado

function LanPed({ setTela }) {
  return (
    <div className="lanped-container">
      <h1>👍 LanPed OK!</h1>

      <button
        onClick={() => setTela('HomePCP')}
        className="voltar-btn"
      >
        Voltar para HomePCP
      </button>
    </div>
  );
}

export default LanPed;

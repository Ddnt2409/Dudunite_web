import React from 'react';
import './HomePCP.css'; // Garante que o estilo visual correto seja aplicado

function HomePCP({ setTela }) {
  return (
    <div className="home-pcp-container">
      <div className="botoes-container">
        <button className="botao-principal" onClick={() => setTela('LanPed')}>
          📝 Lançar Pedido
        </button>

        <button className="botao-principal" onClick={() => setTela('AliSab')}>
          🍫 Alimentar Sabores
        </button>
      </div>
    </div>
  );
}

export default HomePCP;

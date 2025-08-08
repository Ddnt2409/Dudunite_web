// src/pages/AliSab.jsx
import React, { useState } from 'react';

// A função Alimentar Sabores
export default function AliSab({ setTela }) {
  // Estado para armazenar sabores
  const [sabores, setSabores] = useState({
    "Produto 1": [],
    "Produto 2": [],
    "Produto 3": [],
  });

  // Adiciona um sabor ao produto
  const adicionarSabor = (produto, sabor) => {
    setSabores(prevSabores => ({
      ...prevSabores,
      [produto]: [...prevSabores[produto], sabor],
    }));
  };

  // Volta para a tela de PCP
  const voltarParaPCP = () => {
    setTela('HomePCP');
  };

  return (
    <div className="alisab-container">
      <h1>🍫 Alimentar Sabores</h1>
      <p>Esta é a tela de Alimentar Sabores.</p>

      {/* Mostrar os produtos */}
      {Object.keys(sabores).map((produto) => (
        <div key={produto} className="alisab-item">
          <h2>{produto}</h2>
          <p>Sabores: {sabores[produto].join(', ') || 'Nenhum sabor adicionado'}</p>
          
          {/* Adicionar sabor */}
          <button onClick={() => adicionarSabor(produto, 'Chocolate')}>Adicionar Chocolate</button>
          <button onClick={() => adicionarSabor(produto, 'Morango')}>Adicionar Morango</button>
          <button onClick={() => adicionarSabor(produto, 'Baunilha')}>Adicionar Baunilha</button>
        </div>
      ))}

      <button className="voltar-pcp" onClick={voltarParaPCP}>
        🔙 Voltar ao PCP
      </button>
    </div>
  );
}

// === INÍCIO HomeERP.jsx ===
import React, { useState, useEffect } from 'react';
import './HomeERP.css';

function HomeERP({ navegarPara }) {
  const [posicao, setPosicao] = useState(1); // 0 = esquerda, 1 = centro, 2 = direita
  const [fadeIn, setFadeIn] = useState(false);

  useEffect(() => {
    setFadeIn(true);
  }, []);

  const botoes = [
    {
      id: 0,
      titulo: 'Produção (PCP)',
      aoClicar: () => navegarPara('HomePCP')
    },
    {
      id: 1,
      titulo: 'Financeiro\n(FinFlux)',
      subbotoes: ['Contas a Receber', 'Contas a Pagar', 'Fluxo de Caixa']
    },
    {
      id: 2,
      titulo: 'Análise de\nCustos',
      aoClicar: () => alert('Em breve')
    }
  ];

  const mover = (direcao) => {
    setPosicao((prev) => {
      if (direcao === 'esquerda') return prev === 0 ? 2 : prev - 1;
      if (direcao === 'direita') return prev === 2 ? 0 : prev + 1;
    });
  };

  return (
    <div className={`tela-home ${fadeIn ? 'fade-in' : ''}`}>
      <div className="topo">
        <img src="/logo.png" alt="Logo" className="logo" />
        <h1>ERP DUDUNITÊ</h1>
      </div>

      <div className="carrossel">
        {botoes.map((btn, index) => (
          <div
            key={index}
            className={`botao ${index === posicao ? 'centro' : index === (posicao + 2) % 3 ? 'esquerda' : 'direita'}`}
            onClick={() => {
              if (index !== posicao) {
                mover(index === (posicao + 1) % 3 ? 'direita' : 'esquerda');
              } else if (btn.aoClicar) {
                btn.aoClicar();
              }
            }}
          >
            <span>{btn.titulo}</span>
            {index === posicao && btn.subbotoes && (
              <div className="subbotoes">
                {btn.subbotoes.map((sub, idx) => (
                  <button key={idx} className="btn-sub">{sub}</button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="rodape">
        • Pequeno Príncipe • Salesianas • Céu Azul •
      </div>
    </div>
  );
}

export default HomeERP;
// === FIM HomeERP.jsx ===

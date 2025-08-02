// === HomeERP.jsx ===
import React, { useEffect, useState } from 'react';
import './styles/HomeERP.css';

function HomeERP({ navegarPara }) {
  const [paginaCarregada, setPaginaCarregada] = useState(false);
  const [botaoCentral, setBotaoCentral] = useState('FinFlux');

  useEffect(() => {
    setTimeout(() => setPaginaCarregada(true), 50);
  }, []);

  const botoes = [
    { id: 'PCP', texto: 'Produção (PCP)' },
    { id: 'FinFlux', texto: 'Financeiro\n(FinFlux)' },
    { id: 'Custos', texto: 'Análise de\nCustos' },
  ];

  const rotacionarCarrossel = (direcao) => {
    const ordem = ['PCP', 'FinFlux', 'Custos'];
    const atual = ordem.indexOf(botaoCentral);
    const proximo =
      direcao === 'esquerda'
        ? (atual + 2) % 3
        : (atual + 1) % 3;
    setBotaoCentral(ordem[proximo]);
  };

  const renderConteudoCentral = () => {
    switch (botaoCentral) {
      case 'PCP':
        return (
          <>
            <button className="botao-central" onClick={() => navegarPara('HomePCP')}>
              Produção (PCP)
            </button>
          </>
        );
      case 'FinFlux':
        return (
          <>
            <button className="botao-central">Financeiro<br/>(FinFlux)</button>
            <div className="submenu">
              <button>Contas a Receber</button>
              <button>Contas a Pagar</button>
              <button>Fluxo de Caixa</button>
            </div>
          </>
        );
      case 'Custos':
        return (
          <>
            <button className="botao-central">Análise de<br/>Custos</button>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div className={`home-container ${paginaCarregada ? 'fade-in' : ''}`}>
      <div className="topo">
        <img src="/logo_dudunite.png" alt="Logo" className="logo" />
        <h1 className="titulo">ERP DUDUNITÊ</h1>
      </div>

      <div className="carrossel">
        <button className="seta" onClick={() => rotacionarCarrossel('esquerda')}>◀</button>

        <div className="botoes-carrossel">
          {botoes.map((btn) => (
            <div
              key={btn.id}
              className={`botao-wrapper ${btn.id === botaoCentral ? 'central' : 'lateral'}`}
            >
              {btn.id === botaoCentral ? (
                renderConteudoCentral()
              ) : (
                <button className="botao-lateral" onClick={() => setBotaoCentral(btn.id)}>
                  {btn.texto}
                </button>
              )}
            </div>
          ))}
        </div>

        <button className="seta" onClick={() => rotacionarCarrossel('direita')}>▶</button>
      </div>

      <div className="rodape">
        • Pequeno Príncipe • Salesianas • Céu Azul •
      </div>
    </div>
  );
}

export default HomeERP;

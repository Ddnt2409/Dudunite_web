// src/pages/HomeERP.jsx
import React, { useState } from 'react';
import './HomeERP.css';

const botoesMacro = [
  {
    titulo: "Produção",
    rotas: [
      { label: "Lançar Pedido", rota: "HomePCP" },
      { label: "Alimentar Sabores", rota: "HomeSabores" },
      { label: "Cozinha", rota: "HomeCozinha" },
      { label: "Status dos pedidos", rota: "HomeStatus" }
    ]
  },
  {
    titulo: "Financeiro",
    rotas: [
      { label: "Contas a Pagar", rota: "HomePagar" },
      { label: "Contas a Receber", rota: "HomeReceber" },
      { label: "Fluxo de Caixa", rota: "HomeFluxo" }
    ]
  },
  {
    titulo: "Resultados",
    rotas: [
      { label: "Análise de Custos", rota: "HomeCustos" },
      { label: "Lucro / Prejuízo", rota: "HomeLucro" },
      { label: "Ranking de vendas", rota: "HomeRanking" }
    ]
  }
];

const HomeERP = ({ navegarPara }) => {
  const [indiceAtivo, setIndiceAtivo] = useState(0);
  const [expandido, setExpandido] = useState(false);
  const [touchStartX, setTouchStartX] = useState(0);

  const handleSwipe = (direcao) => {
    if (direcao === 'esquerda' && indiceAtivo < botoesMacro.length - 1) {
      setIndiceAtivo(indiceAtivo + 1);
      setExpandido(false);
    } else if (direcao === 'direita' && indiceAtivo > 0) {
      setIndiceAtivo(indiceAtivo - 1);
      setExpandido(false);
    }
  };

  const handleTouchStart = (e) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchMove = (e) => {
    const deltaX = e.touches[0].clientX - touchStartX;
    if (deltaX > 50) {
      handleSwipe('direita');
    } else if (deltaX < -50) {
      handleSwipe('esquerda');
    }
  };

  return (
    <div
      className="homeerp-container"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
    >
      {/* === CABEÇALHO TRANSLÚCIDO === */}
      <header className="homeerp-header">
        <img src="/LogomarcaDDnt2025Vazado.png" alt="Logomarca" className="logo-homeerp" />
        <h1 className="titulo-erp">ERP DUDUNITÊ</h1>
      </header>

      {/* === BOTÕES DESLIZANTES === */}
      <div className="carousel">
        {botoesMacro.map((botao, index) => (
          <div
            key={index}
            className={`cartao ${index === indiceAtivo ? 'ativo' : ''}`}
            onClick={() => setExpandido(!expandido)}
          >
            <h2>{botao.titulo}</h2>
            {expandido && indiceAtivo === index && (
              <div className="subitens">
                {botao.rotas.map((rota, i) => (
                  <button
                    key={i}
                    onClick={() => navegarPara(rota.rota)}
                    className="botao-subitem"
                  >
                    {rota.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* === RODAPÉ DE STATUS === */}
      <footer className="rodape-status">
        <div className="status-pedido">
          <span className="bolinha lancado" /> Lançado
          <span className="bolinha montando" /> Montando
          <span className="bolinha finalizando" /> Finalizando
          <span className="bolinha entregando" /> Entregando
        </div>
      </footer>
    </div>
  );
};

export default HomeERP;

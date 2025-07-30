// src/pages/HomeERP.jsx
//forçar deploy

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './HomeERP.css';

const botoesMacro = [
  {
    titulo: "Produção",
    rotas: [
      { label: "Lançar Pedido", path: "/pcp" },
      { label: "Alimentar Sabores", path: "/sabores" },
      { label: "Cozinha", path: "/cozinha" },
      { label: "Status dos pedidos", path: "/status" }
    ]
  },
  {
    titulo: "Financeiro",
    rotas: [
      { label: "Contas a Pagar", path: "/pagar" },
      { label: "Contas a Receber", path: "/receber" },
      { label: "Fluxo de Caixa", path: "/fluxo" }
    ]
  },
  {
    titulo: "Resultados",
    rotas: [
      { label: "Análise de Custos", path: "/custos" },
      { label: "Lucro / Prejuízo", path: "/lucro" },
      { label: "Ranking de vendas", path: "/ranking" }
    ]
  }
];

const HomeERP = () => {
  const [indiceAtivo, setIndiceAtivo] = useState(0);
  const [expandido, setExpandido] = useState(false);
  const navigate = useNavigate();

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

  const [touchStartX, setTouchStartX] = useState(0);

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
                    onClick={() => navigate(rota.path)}
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

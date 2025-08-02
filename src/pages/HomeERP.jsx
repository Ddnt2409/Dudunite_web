import React, { useState, useEffect } from 'react';
import './HomeERP.css';
import { useNavigate } from 'react-router-dom';

const botoes = [
  {
    nome: 'Produção\n(PCP)',
    opcoes: [],
    destino: 'HomePCP',
  },
  {
    nome: 'Financeiro\n(FinFlux)',
    opcoes: ['Contas a Pagar', 'Fluxo de Caixa'],
    destino: null,
  },
  {
    nome: 'Análise de\nCustos',
    opcoes: [],
    destino: null,
  },
];

export default function HomeERP() {
  const [indiceCentral, setIndiceCentral] = useState(1);
  const navigate = useNavigate();

  useEffect(() => {
    const handleSwipe = (e) => {
      const touch = e.changedTouches[0];
      const direction = touch.clientX - startXRef.current;
      if (Math.abs(direction) > 50) {
        if (direction < 0 && indiceCentral < botoes.length - 1) {
          setIndiceCentral((prev) => prev + 1);
        } else if (direction > 0 && indiceCentral > 0) {
          setIndiceCentral((prev) => prev - 1);
        }
      }
    };

    const startXRef = { current: 0 };

    const handleTouchStart = (e) => {
      startXRef.current = e.touches[0].clientX;
    };

    const div = document.getElementById('carrossel-externo');
    div.addEventListener('touchstart', handleTouchStart);
    div.addEventListener('touchend', handleSwipe);

    return () => {
      div.removeEventListener('touchstart', handleTouchStart);
      div.removeEventListener('touchend', handleSwipe);
    };
  }, [indiceCentral]);

  const navegarPara = (destino) => {
    if (destino) {
      const elemento = document.getElementById('fade-wrapper');
      if (elemento) {
        elemento.classList.add('fade-out');
        setTimeout(() => navigate(destino), 300);
      } else {
        navigate(destino);
      }
    }
  };

  return (
    <div className="homeerp-container" id="fade-wrapper">
      {/* === INÍCIO RT00 – Cabeçalho ERP === */}
      <header className="homeerp-header">
        <img
          src="/LogomarcaDDnt2025Vazado.png"
          alt="Logo"
          className="homeerp-logo"
        />
        <h1 className="homeerp-titulo">ERP DUDUNITÊ</h1>
      </header>
      {/* === FIM RT00 === */}

      {/* === INÍCIO RT01 – Carrossel de Módulos === */}
      <div className="carrossel-externo" id="carrossel-externo">
        <div className="carrossel-interno">
          {botoes.map((botao, idx) => {
            const isCentral = idx === indiceCentral;
            return (
              <div
                key={idx}
                className={`botao-wrapper ${isCentral ? 'central' : 'lateral'}`}
              >
                <button
                  className={`botao ${isCentral ? 'botao-central' : ''}`}
                  onClick={() => navegarPara(botao.destino)}
                >
                  {botao.nome}
                </button>
                {isCentral && botao.opcoes.length > 0 && (
                  <div className="opcoes-container">
                    {botao.opcoes.map((opcao, i) => (
                      <div key={i} className="opcao-botao">
                        {opcao}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
      {/* === FIM RT01 === */}

      {/* === INÍCIO RT02 – Rodapé de Escolas === */}
      <footer className="homeerp-rodape">
        • Pequeno Príncipe • Salesianas • Céu Azul
      </footer>
      {/* === FIM RT02 === */}
    </div>
  );
}

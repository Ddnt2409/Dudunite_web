import React, { useState, useRef } from 'react';
import HomePCP from './HomePCP';
import './HomeERP.css';

export default function HomeERP() {
  const [tela, setTela] = useState('Home');
  const [zoomIndex, setZoomIndex] = useState(0);
  const [mostrarDropdown, setMostrarDropdown] = useState(false);
  const touchStartX = useRef(null);

  const botoes = [
    {
      label: '📦\nProdução (PCP)',
      action: () => setTela('PCP'),
      dropdown: []
    },
    {
      label: '💰\nFinanceiro (FinFlux)',
      action: () => {},
      dropdown: [
        { nome: 'Contas a Receber', acao: () => alert('Em construção') },
        { nome: 'Contas a Pagar',    acao: () => alert('Em construção') },
      ],
    },
    {
      label: '📊\nAnálise de Custos',
      action: () => {},
      dropdown: [
        { nome: 'Custos por Produto', acao: () => alert('Em construção') },
        { nome: 'Custos Fixos',       acao: () => alert('Em construção') },
        { nome: 'Custos Variáveis',   acao: () => alert('Em construção') },
      ],
    },
    {
      label: '👨‍🍳\nCozinha',
      action: () => alert('Em construção'),
      dropdown: []
    },
  ];

  const handleClick = (idx, action, hasDropdown) => {
    if (hasDropdown) {
      // módulos com dropdown apenas expandem/colapsam
      if (zoomIndex === idx) {
        setMostrarDropdown(v => !v);
      } else {
        setZoomIndex(idx);
        setMostrarDropdown(false);
      }
    } else {
      // módulos sem dropdown disparam a action imediatamente
      setZoomIndex(idx);
      setMostrarDropdown(false);
      action();
    }
  };

  const deslizar = direcao => {
    const total = botoes.length;
    setZoomIndex(prev => {
      const novo = direcao === 'esquerda'
        ? (prev - 1 + total) % total
        : (prev + 1) % total;
      setMostrarDropdown(false);
      return novo;
    });
  };

  // Se a tela for PCP, renderiza o HomePCP
  if (tela === 'PCP') {
    return <HomePCP setTela={setTela} />;
  }

  return (
    <div className="erp-container">
      {/* HEADER */}
      <header className="erp-header">
        <img
          src="/LogomarcaDDnt2025Vazado.png"
          alt="Logo Dudunitê"
          className="erp-logo"
        />
        <h1 className="erp-titulo">ERP DUDUNITÊ</h1>
      </header>

      {/* CONTEÚDO PRINCIPAL */}
      <main
        className="erp-main"
        onTouchStart={e => (touchStartX.current = e.changedTouches[0].clientX)}
        onTouchEnd={e => {
          const diff = e.changedTouches[0].clientX - touchStartX.current;
          if (diff > 50) deslizar('esquerda');
          else if (diff < -50) deslizar('direita');
        }}
      >
        {botoes.map((btn, idx) => {
          const isZoomed = idx === zoomIndex;
          const hasDropdown = btn.dropdown.length > 0;
          return (
            <div key={idx} className="erp-item">
              <button
                onClick={() => handleClick(idx, btn.action, hasDropdown)}
                className={`botao-principal ${
                  isZoomed ? 'botao-ativo' : 'botao-inativo'
                }`}
              >
                {btn.label}
              </button>

              {isZoomed && mostrarDropdown && hasDropdown && (
                <div className="dropdown-interno">
                  {btn.dropdown.map((op, i) => (
                    <button key={i} onClick={op.acao}>
                      {op.nome}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </main>

      {/* FOOTER */}
      <footer className="erp-footer">
        <marquee behavior="scroll" direction="left">
          • Pequeno Príncipe • Salesianas • Céu Azul • Russas • Bora Gastar •
          Kaduh • Society Show • Degusty • Tio Valter • Vera Cruz • Pinheiros •
          Dourado • BMQ • CFC • Madre de Deus • Saber Viver • Interativo •
          Exato Sede • Exato Anexo • Sesi • Motivo • Jesus Salvador
        </marquee>
      </footer>
    </div>
  );
}

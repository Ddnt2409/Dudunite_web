import React, { useState, useRef } from 'react';
import './HomeERP.css';
import HomePCP from './HomePCP';
import LanPed from './LanPed';

export default function HomeERP() {
  const [tela, setTela] = useState('Home');
  const [zoomIndex, setZoomIndex] = useState(0);
  const [mostrarDropdown, setMostrarDropdown] = useState(false);
  const touchStartX = useRef(null);

  const botoes = [
    {
      label: '📦\nProdução (PCP)',
      action: () => setTela('PCP'),
      dropdown: [
        { nome: 'Lançar Pedido', acao: () => setTela('LanPed') },
        { nome: 'Alimentar Sabores', acao: () => alert('Em construção') },
      ],
    },
    {
      label: '💰\nFinanceiro (FinFlux)',
      action: () => alert('Em construção'),
      dropdown: [
        { nome: 'Contas a Receber', acao: () => alert('Em construção') },
        { nome: 'Contas a Pagar', acao: () => alert('Em construção') },
      ],
    },
    {
      label: '📊\nAnálise de Custos',
      action: () => alert('Em construção'),
      dropdown: [
        { nome: 'Custos por Produto', acao: () => alert('Em construção') },
        { nome: 'Custos Fixos', acao: () => alert('Em construção') },
        { nome: 'Custos Variáveis', acao: () => alert('Em construção') },
      ],
    },
    {
      label: '👨‍🍳\nCozinha',
      action: () => alert('Em construção'),
      dropdown: [],
    },
  ];

  function handleClick(idx, action) {
    if (zoomIndex === idx) {
      // se já estava ativo, abre dropdown ou executa ação
      if (botoes[idx].dropdown.length) {
        setMostrarDropdown(!mostrarDropdown);
      } else {
        action();
      }
    } else {
      // aciona zoom e fecha dropdown
      setZoomIndex(idx);
      setMostrarDropdown(false);
    }
  }

  function deslizar(direcao) {
    const total = botoes.length;
    setZoomIndex(prev =>
      direcao === 'esquerda'
        ? (prev - 1 + total) % total
        : (prev + 1) % total
    );
    setMostrarDropdown(false);
  }

  // roteamento interno
  if (tela === 'PCP')   return <HomePCP setTela={setTela} />;
  if (tela === 'LanPed') return <LanPed setTela={setTela} />;

  return (
    <div className="erp-container">
      <header className="erp-header">
        <img src="/LogomarcaDDnt2025Vazado.png" alt="Logo" />
        <h1>ERP DUDUNITÊ</h1>
      </header>

      <main
        className="erp-carousel"
        onTouchStart={e => (touchStartX.current = e.changedTouches[0].clientX)}
        onTouchEnd={e => {
          const diff = e.changedTouches[0].clientX - touchStartX.current;
          if (diff > 50) deslizar('esquerda');
          else if (diff < -50) deslizar('direita');
        }}
      >
        {botoes.map((btn, idx) => {
          const isZoomed = idx === zoomIndex;
          return (
            <div key={idx} className="erp-item">
              <button
                className={`botao-principal ${
                  isZoomed ? 'botao-ativo' : 'botao-inativo'
                }`}
                onClick={() => handleClick(idx, btn.action)}
              >
                {btn.label}
              </button>

              {isZoomed && mostrarDropdown && btn.dropdown.length > 0 && (
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

      <footer className="erp-footer">
        <marquee>
          Pequeno Príncipe • Salesianas • Céu Azul • Russas • Bora Gastar • …
        </marquee>
      </footer>
    </div>
  );
}

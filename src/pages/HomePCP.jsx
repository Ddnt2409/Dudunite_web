import React, { useState, useRef } from 'react';
import HomePCP from './HomePCP';
import './HomeERP.css';

export default function HomeERP({ setTela }) {
  const [tela, setTelaInterna] = useState('Home');
  const [zoomIndex, setZoomIndex] = useState(0);
  const [mostrarDropdown, setMostrarDropdown] = useState(false);
  const touchStartX = useRef(null);

  const botoes = [
    {
      label: '📦\nProdução (PCP)',
      action: () => setTelaInterna('PCP'),
      dropdown: [
        { nome: 'Lançar Pedido', acao: () => setTelaInterna('LanPed') },
        { nome: 'Alimentar Sabores', acao: () => alert('Em construção') },
      ],
    },
    {
      label: '💰\nFinanceiro',
      action: () => {},
      dropdown: [
        { nome: 'Contas a Receber', acao: () => alert('Em construção') },
        { nome: 'Contas a Pagar', acao: () => alert('Em construção') },
      ],
    },
    // ... demais botões
  ];

  const handleClick = (idx, action) => {
    if (zoomIndex === idx) {
      // já está zoomed
      setMostrarDropdown(prev => !prev);
      if (mostrarDropdown) action();
    } else {
      setZoomIndex(idx);
      setMostrarDropdown(false);
    }
  };

  const deslizar = direcao => {
    const total = botoes.length;
    setZoomIndex(prev =>
      direcao === 'esquerda'
        ? (prev - 1 + total) % total
        : (prev + 1) % total
    );
    setMostrarDropdown(false);
  };

  // Se for tela PCP, renderiza o HomePCP
  if (tela === 'PCP') {
    return <HomePCP setTela={setTelaInterna} />;
  }
  // Se for tela de Lançar Pedido
  if (tela === 'LanPed') {
    return null; // seu <LanPed /> aqui
  }

  return (
    <div className="erp-container">
      {/* HEADER */}
      <header className="erp-header">
        <img src="/LogomarcaDDnt2025Vazado.png" alt="Logo" className="erp-logo" />
        <h1 className="erp-title">ERP DUDUNITÊ</h1>
      </header>

      {/* CARROSSEL DE BOTÕES */}
      <main className="erp-main">
        <div
          className="erp-carousel"
          onTouchStart={e => (touchStartX.current = e.changedTouches[0].clientX)}
          onTouchEnd={e => {
            const diff = e.changedTouches[0].clientX - touchStartX.current;
            if (diff > 50) deslizar('direita');
            else if (diff < -50) deslizar('esquerda');
          }}
        >
          {botoes.map((btn, idx) => {
            const ativo = idx === zoomIndex;
            return (
              <div key={idx} className="erp-item">
                <button
                  onClick={() => handleClick(idx, btn.action)}
                  className={`botao-principal ${
                    ativo ? 'botao-ativo' : 'botao-inativo'
                  }`}
                >
                  {btn.label}
                </button>
                {ativo && mostrarDropdown && btn.dropdown.length > 0 && (
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
        </div>
      </main>

      {/* RODAPÉ */}
      <footer className="erp-footer">
        <marquee behavior="scroll" direction="left">
          • Pequeno Príncipe • Salesianas • Céu Azul • Russas • Bora Gastar • Kaduh •
          Society Show • Degusty • Tio Valter • Vera Cruz • Pinheiros • Dourado • BMQ •
          CFC • Madre de Deus • Saber Viver • Interativo • Exato Sede • Exato Anexo •
          Sesi • Motivo • Jesus Salvador
        </marquee>
      </footer>
    </div>
  );
}

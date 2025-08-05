import React, { useState, useRef } from 'react';
import HomePCP from './HomePCP';
import LanPed from './LanPed';
import './HomeERP.css';

export default function HomeERP() {
  const [tela, setTela] = useState('Home');        // Home | PCP | LanPed
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
      label: '💰\nFinanceiro',
      action: () => alert('Em construção'),
      dropdown: [
        { nome: 'Contas a Receber', acao: () => alert('Em construção') },
        { nome: 'Contas a Pagar',    acao: () => alert('Em construção') },
      ],
    },
    {
      label: '📊\nAnálise de Custos',
      action: () => alert('Em construção'),
      dropdown: [
        { nome: 'Custos por Produto', acao: () => alert('Em construção') },
        { nome: 'Custos Fixos',       acao: () => alert('Em construção') },
        { nome: 'Custos Variáveis',   acao: () => alert('Em construção') },
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
      // se clicar de novo, mostra o dropdown ou executa a ação
      if (mostrarDropdown) action();
      setMostrarDropdown(!mostrarDropdown);
    } else {
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
  if (tela === 'LanPed') return <LanPed   setTela={setTela} />;

  // tela Home ERP
  return (
    <div className="erp-container"
         onTouchStart={e => touchStartX.current = e.changedTouches[0].clientX}
         onTouchEnd={e => {
           const delta = e.changedTouches[0].clientX - touchStartX.current;
           if (delta > 50) deslizar('esquerda');
           if (delta < -50) deslizar('direita');
         }}>
      {/* HEADER */}
      <header className="erp-header">
        <img src="/LogomarcaDDnt2025Vazado.png" alt="Logo" className="erp-logo" />
        <h1 className="erp-title">ERP DUDUNITÊ</h1>
      </header>

      {/* CARROSSEL */}
      <main className="erp-main">
        <div className="erp-carousel">
          {botoes.map((btn, idx) => {
            const ativo = idx === zoomIndex;
            return (
              <div key={idx} className="erp-item">
                <button
                  className={`botao-principal ${ativo ? 'botao-ativo' : 'botao-inativo'}`}
                  onClick={() => handleClick(idx, btn.action)}
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
          • Pequeno Príncipe • Salesianas • Céu Azul • Russas • Bora Gastar • Kaduh • Society Show •
          Degusty • Tio Valter • Vera Cruz • Pinheiros • Dourado • BMQ • CFC • Madre de Deus • Saber Viver •
          Interativo • Exato Sede • Exato Anexo • Sesi • Motivo • Jesus Salvador
        </marquee>
      </footer>
    </div>
  );
}

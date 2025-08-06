import React, { useState, useRef } from 'react';
import './HomeERP.css';

export default function HomeERP({ setTela }) {
  const [zoomIndex, setZoomIndex] = useState(0);
  const touchStartX = useRef(null);
  const [mostrarDropdown, setMostrarDropdown] = useState(false);

  const botoes = [
    {
      label: '📦\nProdução (PCP)',
      action: () => setZoomIndex(0), // só faz o zoom, não muda de tela
      dropdown: [
        { nome: 'Lançar Pedido', acao: () => setTela('LanPed') },      // **AQUI**: vai para LanPed
        { nome: 'Alimentar Sabores', acao: () => alert('Em construção') },
      ],
    },
    {
      label: '💰\nFinanceiro',
      action: () => setZoomIndex(1),
      dropdown: [
        { nome: 'Contas a Receber', acao: () => alert('Em construção') },
        { nome: 'Contas a Pagar', acao: () => alert('Em construção') },
      ],
    },
    {
      label: '📊\nAnálise de Custos',
      action: () => setZoomIndex(2),
      dropdown: [
        { nome: 'Custos por Produto', acao: () => alert('Em construção') },
        { nome: 'Custos Fixos',      acao: () => alert('Em construção') },
        { nome: 'Custos Variáveis',  acao: () => alert('Em construção') },
      ],
    },
    {
      label: '👨‍🍳\nCozinha',
      action: () => setZoomIndex(3),
      dropdown: [],
    },
  ];

  function handleClick(idx, action) {
    if (zoomIndex === idx) {
      setMostrarDropdown(d => !d);
      if (mostrarDropdown) action();
    } else {
      setZoomIndex(idx);
      setMostrarDropdown(false);
    }
  }

  function deslizar(dir) {
    setZoomIndex(prev => {
      const total = botoes.length;
      const next = dir === 'esquerda'
        ? (prev - 1 + total) % total
        : (prev + 1) % total;
      setMostrarDropdown(false);
      return next;
    });
  }

  return (
    <div className="homeerp-container">
      {/* HEADER */}
      <header className="homeerp-header">
        <img
          src="/LogomarcaDDnt2025Vazado.png"
          alt="Logo"
          className="homeerp-logo"
        />
        <h1 className="homeerp-titulo">ERP DUDUNITÊ</h1>
      </header>

      {/* BOTÕES */}
      <main
        className="homeerp-main"
        onTouchStart={e => touchStartX.current = e.changedTouches[0].clientX}
        onTouchEnd={e => {
          const diff = e.changedTouches[0].clientX - touchStartX.current;
          if (diff > 50) deslizar('esquerda');
          else if (diff < -50) deslizar('direita');
        }}
      >
        {botoes.map((btn, idx) => {
          const ativo = idx === zoomIndex;
          return (
            <div key={idx} className="botao-wrapper">
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
      </main>

      {/* VOLTAR */}
      <button
        className="botao-voltar"
        onClick={() => setTela('HomeERP')}
      >
        🔙 Voltar
      </button>

      {/* RODAPÉ */}
      <footer className="homeerp-footer">
        • Pequeno Príncipe • Salesianas • Céu Azul • Russas • Bora Gastar • Kaduh •
        Society Show • Degusty • Tio Valter • Vera Cruz • Pinheiros • Dourado •
        BMQ • CFC • Madre de Deus • Saber Viver • Interativo • Exato Sede •
        Exato Anexo • Sesi • Motivo • Jesus Salvador
      </footer>
    </div>
  );
}

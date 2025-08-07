import React, { useState, useRef } from 'react';
import './HomeERP.css';

export default function HomeERP({ setTela }) {
  // --- estados e refs ---
  const [zoomIndex, setZoomIndex]             = useState(0);
  const [mostrarDropdown, setMostrarDropdown] = useState(false);
  const touchStartX                           = useRef(null);

  // --- configuração dos botões ---
  const botoes = [
    {
      label: '📦\nProdução (PCP)',
      // apenas muda zoomIndex, NÃO chama setTela
      action: () => setZoomIndex(0),
      dropdown: [
        {
          nome: 'Lançar Pedido',
          // aqui sim dispara a tela LanPed
          acao: () => setTela('LanPed')
        },
        {
          nome: 'Alimentar Sabores',
          acao: () => alert('Em construção')
        },
      ],
    },
    {
      label: '💰\nFinanceiro',
      action: () => setZoomIndex(1),
      dropdown: [
        { nome: 'Contas a Receber', acao: () => alert('Em construção') },
        { nome: 'Contas a Pagar',    acao: () => alert('Em construção') },
      ],
    },
    {
      label: '📊\nAnálise de Custos',
      action: () => setZoomIndex(2),
      dropdown: [
        { nome: 'Custos por Produto', acao: () => alert('Em construção') },
        { nome: 'Custos Fixos',       acao: () => alert('Em construção') },
        { nome: 'Custos Variáveis',   acao: () => alert('Em construção') },
      ],
    },
    {
      label: '👨‍🍳\nCozinha',
      action: () => setZoomIndex(3),
      dropdown: [],
    },
  ];

  // --- handler de clique no botão principal ---
  function handleClick(idx, action) {
    if (zoomIndex === idx) {
      // segundo clique: mostra dropdown E executa a ação
      setMostrarDropdown(d => !d);
      if (mostrarDropdown) action();
    } else {
      // primeiro clique: só muda o zoom
      setZoomIndex(idx);
      setMostrarDropdown(false);
    }
  }

  // --- swipe para mobile ---
  function deslizar(dir) {
    setZoomIndex(prev => {
      const total = botoes.length;
      const next  = dir === 'esquerda'
        ? (prev - 1 + total) % total
        : (prev + 1) % total;
      setMostrarDropdown(false);
      return next;
    });
  }

  return (
    <div className="homepcp-container">
      {/* === HEADER (volta junto com CSS aprovado) === */}
      <div className="homepcp-header">
        <img
          src="/LogomarcaDDnt2025Vazado.png"
          alt="Logo Dudunitê"
          className="logo-pcp"
        />
        <h1 className="homepcp-titulo">ERP DUDUNITÊ</h1>
      </div>

      {/* === BOTÕES PRINCIPAIS === */}
      <div
        className="botoes-pcp"
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
      </div>

      {/* === BOTÃO VOLTAR === */}
      <button
        className="botao-voltar"
        onClick={() => setTela('HomeERP')}
      >
        🔙 Voltar
      </button>

      {/* === RODAPÉ FIXO COM MARQUEE === */}
      <div className="lista-escolas">
        <span className="marquee-content">
          • Pequeno Príncipe • Salesianas • Céu Azul • Russas • Bora Gastar • Kaduh •
          Society Show • Degusty • Tio Valter • Vera Cruz • Pinheiros • Dourado •
          BMQ • CFC • Madre de Deus • Saber Viver • Interativo • Exato Sede •
          Exato Anexo • Sesi • Motivo • Jesus Salvador
        </span>
      </div>
    </div>
  );
}

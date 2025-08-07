import React, { useRef } from 'react';
import './HomeERP.css'; // usa exatamente o CSS aprovado do HomeERP

export default function HomePCP({ setTela }) {
  const touchStartX = useRef(null);

  return (
    <div className="homepcp-container">
      {/* === HEADER === */}
      <div className="homepcp-header">
        <img
          src="/LogomarcaDDnt2025Vazado.png"
          alt="Logo Dudunitê"
          className="logo-pcp"
        />
        <h1 className="homepcp-titulo">PCP – Planejamento de Produção</h1>
      </div>

      {/* === BOTÕES PRINCIPAIS === */}
      <div
        className="botoes-pcp"
        onTouchStart={e => (touchStartX.current = e.changedTouches[0].clientX)}
        onTouchEnd={e => {
          const diff = e.changedTouches[0].clientX - touchStartX.current;
          if (diff > 50) {
            /* opcional: swipe esquerda */
          } else if (diff < -50) {
            /* opcional: swipe direita */
          }
        }}
      >
        {/* Lançar Pedido */}
        <div className="botao-wrapper">
          <button
            className="botao-principal botao-ativo"
            onClick={() => setTela('LanPed')}
          >
            📝<br />
            Lançar Pedido
          </button>
        </div>

        {/* Alimentar Sabores */}
        <div className="botao-wrapper">
          <button
            className="botao-principal botao-inativo"
            onClick={() => setTela('AlimSab')}
          >
            🍫<br />
            Alimentar Sabores
          </button>
        </div>
      </div>

      {/* === BOTÃO VOLTAR === */}
      <button
        className="botao-voltar"
        onClick={() => setTela('HomeERP')}
      >
        🔙 Voltar ao ERP
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

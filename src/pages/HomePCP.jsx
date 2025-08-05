import React, { useState } from 'react';
import './HomePCP.css';

export default function HomePCP({ setTela }) {
  // Estado local para controlar qual botão está ativo
  const [ativo, setAtivo] = useState('LanPed');

  // Função para trocar o ativo e mudar de tela
  function selecionar(telaSelecionada) {
    setAtivo(telaSelecionada);
    setTela(telaSelecionada);
  }

  return (
    <div className="homepcp-container">
      {/* === CABEÇALHO === */}
      <div className="homepcp-header">
        <img
          src="/LogomarcaDDnt2025Vazado.png"
          alt="Logo Dudunitê"
          className="logo-pcp"
        />
        <h1 className="homepcp-titulo">PCP – Planejamento de Produção</h1>
      </div>

      {/* === BOTÕES PRINCIPAIS === */}
      <div className="botoes-pcp">
        <button
          className={`botao-principal ${ativo === 'LanPed' ? 'botao-ativo' : 'botao-inativo'}`}
          onClick={() => selecionar('LanPed')}
        >
          📝<br />Lançar Pedido
        </button>

        <button
          className={`botao-principal ${ativo === 'AlimSab' ? 'botao-ativo' : 'botao-inativo'}`}
          onClick={() => selecionar('AlimSab')}
        >
          🍫<br />Alimentar Sabores
        </button>
      </div>

      {/* === BOTÃO VOLTAR === */}
      <button
        className="botao-voltar"
        onClick={() => setTela('HomeERP')}
      >
        🔙 Voltar ao ERP
      </button>

      {/* === RODAPÉ COM MARQUEE === */}
      <div className="lista-escolas">
        <marquee behavior="scroll" direction="left">
          Cruz • Pinheiros • Dourado • BMQ • CFC • Madre de Deus • Saber Viver •
          Interativo • Exato Sede • Exato Anexo • Society Show • Russas • Kaduh •
          Degusty • Bora Gastar • Salesianas • Céu Azul • Pequeno Príncipe • Tio Valter • Vera Cruz
        </marquee>
      </div>
    </div>
  );
}

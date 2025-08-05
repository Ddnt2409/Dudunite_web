import React from 'react';
import './HomePCP.css';

const HomePCP = ({ setTela }) => {
  return (
    <div className="homepcp-container">
      {/* === INÍCIO RT00 – Tela Home PCP === */}

      <div className="homepcp-header">
        <img src="/LogomarcaDDnt2025Vazado.png" alt="Logo Dudunitê" className="logo-pcp" />
        <h1 className="homepcp-titulo">PCP – Planejamento de Produção</h1>
      </div>

      <div className="botoes-pcp">
        <button className="botao-principal botao-ativo" onClick={() => setTela("LanPed")}>
          📝<br />Lançar Pedido (Teste)
        </button>

        {/* Temporariamente desativado até criar o componente AlimSab */}
        {/* <button className="botao-principal botao-ativo" onClick={() => setTela("AlimSab")}>
          🍫<br />Alimentar Sabores
        </button> */}
      </div>

      <button className="botao-voltar" onClick={() => setTela("HomeERP")}>
        🔙 Voltar ao ERP
      </button>

      <div className="lista-escolas">
        Cruz • Pinheiros • Dourado • BMQ • CFC • Madre de Deus • Saber Viver • Interativo • Exato Sede • Exato Anexo • Society Show • Russas • Kaduh • Degusty • Bora Gastar • Salesianas • Céu Azul • Pequeno Príncipe • Tio Valter • Vera Cruz
      </div>

      {/* === FIM RT00 === */}
    </div>
  );
};

export default HomePCP;

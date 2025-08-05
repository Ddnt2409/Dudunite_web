import React, { useState } from 'react';
import './HomeERP.css';

export default function HomeERP({ setTela }) {
  const [section, setSection] = useState('');

  const handleMainClick = (sec) => {
    // alterna visibilidade dos inner buttons
    setSection((prev) => (prev === sec ? '' : sec));
  };

  return (
    <div className="home-erp">
      <header className="erp-header">
        <img src="/LogomarcaDDnt2025Vazado.png" alt="Logomarca Dudunitê" />
        <h1>ERP DUDUNITÊ</h1>
      </header>

      <div className="buttons-container">
        <button
          className="button-main"
          onClick={() => handleMainClick('PCP')}
        >
          📦 Produção (PCP)
        </button>
        {section === 'PCP' && (
          <div className="inner-buttons">
            <button onClick={() => setTela('PCP')}>Lançar Pedido</button>
            <button onClick={() => setTela('Sabores')}>Alimentar Sabores</button>
          </div>
        )}

        <button
          className="button-main"
          onClick={() => handleMainClick('Financeiro')}
        >
          💰 Financeiro (FinFlux)
        </button>
        {section === 'Financeiro' && (
          <div className="inner-buttons">
            <button onClick={() => setTela('ContasAPagar')}>Contas a Pagar</button>
            <button onClick={() => setTela('ContasAReceber')}>Contas a Receber</button>
            <button onClick={() => setTela('FluxoCaixa')}>Fluxo de Caixa</button>
          </div>
        )}

        <button
          className="button-main"
          onClick={() => handleMainClick('Analise')}
        >
          📊 Análise de Custos
        </button>
        {section === 'Analise' && (
          <div className="inner-buttons">
            <button onClick={() => setTela('Resultado')}>Resultado</button>
            <button onClick={() => setTela('Dashboard')}>Dashboard</button>
          </div>
        )}

        <button
          className="button-main"
          onClick={() => handleMainClick('Cozinha')}
        >
          👩‍🍳 Cozinha
        </button>
        {/* Cozinha não tem sub-itens por enquanto */}
      </div>

      <footer className="erp-footer">
        • Pequeno Príncipe • Salesianas • Céu Azul • Russas • Bora Gastar • Kaduh • Society Show • Degusty • Tio Valter • Vera Cruz • Pinheiros • Dourado • BMQ • CFC • Madre de Deus • Saber Viver • Interativo • Exato Sede • Exato Anexo • Sesi • Motivo • Jesus Salvador
      </footer>
    </div>
  );
}

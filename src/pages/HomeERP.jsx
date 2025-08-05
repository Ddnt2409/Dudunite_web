import React from 'react'
import './HomeERP.css'

export default function HomeERP({ setTela }) {
  return (
    <div className="erp-container">
      <header className="erp-header">
        <img
          src="/LogomarcaDDnt2025Vazado.png"
          alt="Logomarca Dudunitê"
          className="erp-logo"
        />
        <h1 className="erp-title">ERP DUDUNITÊ</h1>
      </header>

      <main className="erp-main">
        <div className="erp-buttons">
          <button
            className="erp-btn"
            onClick={() => setTela('PCP')}
          >
            📦 Produção (PCP)
          </button>
          <button
            className="erp-btn"
            onClick={() => setTela('FinFlux')}
          >
            💲 Financeiro (FinFlux)
          </button>
          <button
            className="erp-btn"
            onClick={() => setTela('Anacust')}
          >
            📊 Análise de Custos
          </button>
          <button
            className="erp-btn"
            onClick={() => setTela('Cozinha')}
          >
            👨‍🍳 Cozinha
          </button>
        </div>
      </main>

      <footer className="erp-footer">
        • Pequeno Príncipe • Salesianas • Céu Azul • Russas • Bora Gastar • Kaduh • Society Show • Degusty …
      </footer>
    </div>
  )
}

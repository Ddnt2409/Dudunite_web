import React from "react";
import "../util/CtsReceber.css";

// Reaproveita a UI de "acumulados" existente por enquanto
import CtsReceberPedidos from "./CtsReceberPedidos.jsx";

export default function CtsPagar({ setTela }) {
  return (
    <div className="ctsreceber-main">
      <header className="erp-header">
        <div className="erp-header__inner">
          <div className="erp-header__logo">
            <img src="/LogomarcaDDnt2025Vazado.png" alt="Dudunitê" />
          </div>
          <div className="erp-header__title">ERP DUDUNITÊ<br />Contas a Pagar</div>
        </div>
      </header>

      <div className="ctsreceber-card">
        <h2>Pagamentos (base na tela Acumulados)</h2>
        <div style={{ color: "#7b3c21", marginBottom: 8 }}>
          Esta tela utiliza temporariamente a UI de “Acumulados” enquanto finalizamos as regras de Pagar.
        </div>
        <CtsReceberPedidos />
      </div>

      <button className="btn-voltar-foot" onClick={() => setTela?.("CtsReceber")}>🔙 Voltar</button>
      <footer className="erp-footer">
        <div className="erp-footer-track">
          • Planejamento de Pagamentos • Em breve: plano de contas pagar + filtros dedicados •
        </div>
      </footer>
    </div>
  );
}

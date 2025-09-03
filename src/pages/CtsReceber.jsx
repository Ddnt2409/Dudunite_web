import React, { useRef, useState } from "react";
import "../util/CtsReceber.css";

import CtsReceberAvulso from "./CtsReceberAvulso.jsx";
import CtsPagar from "./CtsPagar.jsx";

export default function CtsReceber({ setTela }) {
  // menu | avulsos | pagar
  const [view, setView] = useState("menu");

  // mesmo comportamento do HomeERP: 1º clique foca, 2º navega
  const [zoomIndex, setZoomIndex] = useState(0);
  const [mostrarDropdown, setMostrarDropdown] = useState(false);
  const touchStartX = useRef(null);

  const botoes = [
    { label: "🧾\nRecebimento", zoomAction: () => setZoomIndex(0), navAction: () => setView("avulsos"), dropdown: [] },
    { label: "📤\nPagamentos",  zoomAction: () => setZoomIndex(1), navAction: () => setView("pagar")  , dropdown: [] },
  ];

  function handleClick(idx, btn) {
    if (zoomIndex === idx) {
      if (!mostrarDropdown) setMostrarDropdown(true);
      else { setMostrarDropdown(false); btn.navAction?.(); }
    } else {
      setZoomIndex(idx); setMostrarDropdown(false); btn.zoomAction?.();
    }
  }
  function deslizar(dir) {
    setZoomIndex(prev => {
      const total = botoes.length;
      const next = dir === "esquerda" ? (prev - 1 + total) % total : (prev + 1) % total;
      setMostrarDropdown(false);
      return next;
    });
  }

  // ===== SUBTELAS =====
  if (view === "avulsos" || view === "pagar") {
    const Conteudo = view === "avulsos" ? CtsReceberAvulso : CtsPagar;
    return (
      <div className="ctsreceber-main">
        <header className="erp-header">
          <div className="erp-header__inner">
            <div className="erp-header__logo">
              <img src="/LogomarcaDDnt2025Vazado.png" alt="Dudunitê" />
            </div>
            <div className="erp-header__title">ERP DUDUNITÊ<br/>Financeiro</div>
          </div>
        </header>

        {/* Pagamentos vêm “embutidos” para não duplicar header/footer */}
        <div style={{ maxWidth: 1100, margin: "0 auto" }} className={view === "pagar" ? "cr-embed" : ""}>
          <Conteudo />
        </div>

        <button className="btn-voltar-foot" onClick={() => setView("menu")}>◀ Menu Financeiro</button>
        <footer className="erp-footer">
          <div className="erp-footer-track">
            {view === "avulsos" ? "• Recebimento (Avulsos) •" : "• Pagamentos •"}
          </div>
        </footer>
      </div>
    );
  }

  // ===== MENU =====
  return (
    <div className="ctsreceber-main">
      <header className="erp-header">
        <div className="erp-header__inner">
          <div className="erp-header__logo"><img src="/LogomarcaDDnt2025Vazado.png" alt="Dudunitê" /></div>
          <div className="erp-header__title">ERP DUDUNITÊ<br/>Financeiro</div>
        </div>
      </header>

      <div
        className="cr-menu"
        onTouchStart={e => (touchStartX.current = e.changedTouches[0].clientX)}
        onTouchEnd={e => {
          const diff = e.changedTouches[0].clientX - touchStartX.current;
          if (diff > 50) deslizar("esquerda");
          else if (diff < -50) deslizar("direita");
        }}
      >
        <div className="cr-menu-grid">
          {botoes.map((btn, idx) => {
            const ativo = zoomIndex === idx;
            return (
              <div key={idx} className="cr-menu-item">
                <button
                  className={`cr-menu-btn ${ativo ? "ativo" : "inativo"}`}
                  onClick={() => handleClick(idx, btn)}
                >
                  {btn.label}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      <button className="btn-voltar-foot" onClick={() => setTela?.("HomeERP")}>🔙 Voltar</button>
      <footer className="erp-footer">
        <div className="erp-footer-track">• Financeiro (Recebimento + Pagamentos) •</div>
      </footer>
    </div>
  );
}

// src/pages/CtsReceber.jsx
// Financeiro — 2 botões grandes no centro (Recebimento / Pagamentos)
import React, { useEffect, useState, useRef } from "react";
import "../util/CtsReceber.css";
import "./HomeERP.css"; // reaproveita o estilo dos botões grandes

import { carregarPlanoDeContas } from "../util/cr_dataStub";
import CtsReceberPedidos from "./CtsReceberPedidos.jsx"; // (antes: Acumulados / LanPed)
import CtsReceberAvulso  from "./CtsReceberAvulso.jsx";  // (antes: Avulsos)

export default function CtsReceber({ setTela }) {
  // view: menu (botões), receb (avulsos), pag (acumulados/lanped)
  const [view, setView] = useState("menu");
  const [zoomIndex, setZoomIndex] = useState(0); // mesmo comportamento do HomeERP
  const touchStartX = useRef(null);

  // plano de contas (usado no Recebimento/Avulsos)
  const [planoContas, setPlanoContas] = useState([]);
  const [loadingPC, setLoadingPC] = useState(true);
  useEffect(() => {
    (async () => {
      setLoadingPC(true);
      try { setPlanoContas(await carregarPlanoDeContas()); }
      finally { setLoadingPC(false); }
    })();
  }, []);

  const botoes = [
    {
      label: "🧾\nRecebimento",
      onOpen: () => setView("receb"), // Avulsos
    },
    {
      label: "💸\nPagamentos",
      onOpen: () => setView("pag"),   // Acumulados (LanPed)
    },
  ];

  function handleClick(idx) {
    if (zoomIndex === idx) {
      botoes[idx].onOpen();
    } else {
      setZoomIndex(idx);
    }
  }

  const MenuCentral = (
    <>
      <div
        className="botoes-pcp"
        onTouchStart={(e) => (touchStartX.current = e.changedTouches[0].clientX)}
        onTouchEnd={(e) => {
          const diff = e.changedTouches[0].clientX - touchStartX.current;
          if (diff > 50) setZoomIndex((i) => (i - 1 + botoes.length) % botoes.length);
          else if (diff < -50) setZoomIndex((i) => (i + 1) % botoes.length);
        }}
      >
        {botoes.map((btn, idx) => {
          const ativo = idx === zoomIndex;
          return (
            <div key={idx} className="botao-wrapper">
              <button
                className={`botao-principal ${ativo ? "botao-ativo" : "botao-inativo"}`}
                onClick={() => handleClick(idx)}
              >
                {btn.label}
              </button>
            </div>
          );
        })}
      </div>

      <button className="btn-voltar-foot" onClick={() => setTela?.("HomeERP")}>
        🔙 Voltar
      </button>
    </>
  );

  return (
    <div className="ctsreceber-main">
      {/* Header */}
      <header className="erp-header">
        <div className="erp-header__inner">
          <div className="erp-header__logo">
            <img src="/LogomarcaDDnt2025Vazado.png" alt="Dudunitê" />
          </div>
          <div className="erp-header__title">
            ERP DUDUNITÊ
            <br />
            <span style={{ fontWeight: 800 }}>Financeiro</span>
          </div>
        </div>
      </header>

      {/* Conteúdo conforme view */}
      {view === "menu" && MenuCentral}

      {view === "receb" && (
        <>
          {!loadingPC ? (
            <CtsReceberAvulso planoContas={planoContas} />
          ) : (
            <div style={{ padding: 10 }}>Carregando Plano de Contas…</div>
          )}
          <div style={{ display: "flex", gap: 8, justifyContent: "center", margin: "12px 0" }}>
            <button className="btn-voltar-foot" onClick={() => setView("menu")}>◀ Menu Financeiro</button>
          </div>
        </>
      )}

      {view === "pag" && (
        <>
          <CtsReceberPedidos />
          <div style={{ display: "flex", gap: 8, justifyContent: "center", margin: "12px 0" }}>
            <button className="btn-voltar-foot" onClick={() => setView("menu")}>◀ Menu Financeiro</button>
          </div>
        </>
      )}

      {/* Footer fixo */}
      <footer className="erp-footer">
        <div className="erp-footer-track">
          • Recebimento (Avulsos) • Pagamentos (Previstos de Pedidos) •
        </div>
      </footer>
    </div>
  );
}

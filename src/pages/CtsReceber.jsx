// src/pages/CtsReceber.jsx
// Financeiro — 2 botões (Recebimento / Pagamentos) com mesmo comportamento do HomeERP
import React, { useEffect, useState, useRef } from "react";
import "../util/CtsReceber.css";
import "./HomeERP.css"; // reaproveita estilos dos botões grandes

import { carregarPlanoDeContas } from "../util/cr_dataStub";
import CtsReceberPedidos from "./CtsReceberPedidos.jsx"; // (Pagamentos — antes Acumulados/LanPed)
import CtsReceberAvulso  from "./CtsReceberAvulso.jsx";  // (Recebimento — antes Avulsos)

export default function CtsReceber({ setTela }) {
  const [view, setView] = useState("menu");   // menu | receb | pag
  const [zoomIndex, setZoomIndex] = useState(0);
  const touchStartX = useRef(null);

  // carrega Plano de Contas (usado em Recebimento/Avulsos)
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
    { label: "🧾\nRecebimento", onOpen: () => setView("receb") },
    { label: "💸\nPagamentos",  onOpen: () => setView("pag")   },
  ];

  // mesmo “2 cliques” do HomeERP: 1º foca/zoom, 2º abre
  function handleClick(idx) {
    if (zoomIndex === idx) botoes[idx].onOpen();
    else setZoomIndex(idx);
  }

  return (
    <div className="ctsreceber-main">
      {/* HEADER */}
      <header className="erp-header">
        <div className="erp-header__inner">
          <div className="erp-header__logo">
            <img src="/LogomarcaDDnt2025Vazado.png" alt="Dudunitê" />
          </div>
          <div className="erp-header__title">
            ERP DUDUNITÊ<br/><span style={{fontWeight:800}}>Financeiro</span>
          </div>
        </div>
      </header>

      {/* MENU CENTRAL */}
      {view === "menu" && (
        <>
          <div
            className="botoes-pcp botoes-financeiro" // classe extra p/ overrides no CSS
            onTouchStart={(e)=> (touchStartX.current = e.changedTouches[0].clientX)}
            onTouchEnd={(e)=> {
              const diff = e.changedTouches[0].clientX - touchStartX.current;
              if (diff > 50) setZoomIndex(i => (i - 1 + botoes.length) % botoes.length);
              else if (diff < -50) setZoomIndex(i => (i + 1) % botoes.length);
            }}
          >
            {botoes.map((btn, idx) => {
              const ativo = idx === zoomIndex;
              return (
                <div key={idx} className="botao-wrapper">
                  <button
                    type="button"
                    className={`botao-principal ${ativo ? "botao-ativo" : "botao-inativo"}`}
                    onClick={() => handleClick(idx)}
                    aria-pressed={ativo}
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
      )}

      {/* RECEBIMENTO (Avulsos) */}
      {view === "receb" && (
        <>
          {!loadingPC ? (
            <CtsReceberAvulso planoContas={planoContas} />
          ) : (
            <div style={{ padding: 10 }}>Carregando Plano de Contas…</div>
          )}
          <div style={{ display:"flex", justifyContent:"center", margin:"12px 0" }}>
            <button className="btn-voltar-foot" onClick={() => setView("menu")}>◀ Menu Financeiro</button>
          </div>
        </>
      )}

      {/* PAGAMENTOS (LanPed/Acumulados) */}
      {view === "pag" && (
        <>
          <CtsReceberPedidos />
          <div style={{ display:"flex", justifyContent:"center", margin:"12px 0" }}>
            <button className="btn-voltar-foot" onClick={() => setView("menu")}>◀ Menu Financeiro</button>
          </div>
        </>
      )}

      {/* FOOTER */}
      <footer className="erp-footer">
        <div className="erp-footer-track">
          • Recebimento (Avulsos) • Pagamentos (Previstos de Pedidos) •
        </div>
      </footer>
    </div>
  );
      }

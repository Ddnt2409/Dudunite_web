import React, { useEffect, useRef, useState } from "react";
import ERPHeader from "./ERPHeader";
import ERPFooter from "./ERPFooter";
import "./HomePCP.css";

export default function HomePCP({ setTela }) {
  const [openProd, setOpenProd] = useState(true);   // Produção inicia aberto
  const [openSup, setOpenSup]   = useState(false);  // Suprimentos inicia fechado
  const supCardRef = useRef(null);

  // Quando abrir Suprimentos por dentro de Produção, rola até o card
  useEffect(() => {
    if (openSup && supCardRef.current) {
      try {
        supCardRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
      } catch {}
    }
  }, [openSup]);

  return (
    <>
      <ERPHeader title="PCP – Planejamento" />

      <div className="homepcp-container">
        <div className="pcp-sections">

          {/* === Card: PRODUÇÃO (PCP) === */}
          <section className={`pcp-card ${openProd ? "is-open" : ""}`}>
            <button
              type="button"
              className="pcp-card-head"
              aria-expanded={openProd}
              onClick={() => setOpenProd((v) => !v)}
              title="Produção (PCP)"
            >
              <span className="pcp-card-emoji">📦</span>
              <span className="pcp-card-title">Produção (PCP)</span>
            </button>

            {openProd && (
              <div className="pcp-inner">
                <button
                  type="button"
                  className="pcp-inner-btn"
                  onClick={() => setTela("LanPed")}
                >
                  Lançar Pedido
                </button>

                <button
                  type="button"
                  className="pcp-inner-btn"
                  onClick={() => setTela("AliSab")}
                >
                  Alimentar Sabores
                </button>

                <button
                  type="button"
                  className="pcp-inner-btn"
                  onClick={() => setTela("StaPed")}
                >
                  Status dos Pedidos
                </button>

                {/* Atalho para abrir o card de Suprimentos abaixo */}
                <button
                  type="button"
                  className="pcp-inner-btn"
                  onClick={() => setOpenSup(true)}
                >
                  Suprimentos
                </button>
              </div>
            )}
          </section>

          {/* === Card: SUPRIMENTOS === */}
          <section
            ref={supCardRef}
            className={`pcp-card ${openSup ? "is-open" : ""}`}
            id="pcp-suprimentos"
          >
            <button
              type="button"
              className="pcp-card-head"
              aria-expanded={openSup}
              onClick={() => setOpenSup((v) => !v)}
              title="Suprimentos"
            >
              <span className="pcp-card-emoji">🧺</span>
              <span className="pcp-card-title">Suprimentos</span>
            </button>

            {openSup && (
              <div className="pcp-inner">
                <button
                  type="button"
                  className="pcp-inner-btn"
                  onClick={() => setTela("SuprComprasLista")}
                >
                  🧾 Compras (Lista A–Z)
                </button>

                <button
                  type="button"
                  className="pcp-inner-btn"
                  onClick={() => setTela("SuprEstoque")}
                >
                  📦 Estoque (Inventário)
                </button>
              </div>
            )}
          </section>

        </div>
      </div>

      <ERPFooter onBack={() => setTela("HomeERP")} />
    </>
  );
}

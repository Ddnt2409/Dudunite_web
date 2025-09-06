import React from "react";
import ERPHeader from "./ERPHeader";
import ERPFooter from "./ERPFooter";
import "./HomePCP.css";

export default function HomePCP({ setTela }) {
  return (
    <>
      <ERPHeader title="PCP – Planejamento" />

      <div className="homepcp-container">
        {/* ==== CARD: PRODUÇÃO (PCP) ==== */}
        <section className="painel-card">
          <div className="painel-title">📦 Produção (PCP)</div>
          <div className="acoes-col">
            <button
              type="button"
              className="btn-mini"
              onClick={() => setTela("LanPed")}
            >
              Lançar Pedido
            </button>

            <button
              type="button"
              className="btn-mini"
              onClick={() => setTela("AliSab")}
            >
              Alimentar Sabores
            </button>

            <button
              type="button"
              className="btn-mini"
              onClick={() => setTela("StaPed")}
            >
              Status dos Pedidos
            </button>
          </div>
        </section>

        {/* ==== CARD: SUPRIMENTOS ==== */}
        <section className="painel-card">
          <div className="painel-title">🧺 Suprimentos</div>
          <div className="acoes-col">
            <button
              type="button"
              className="btn-mini"
              onClick={() => setTela("SuprComprasLista")}
            >
              Compras (Lista A–Z)
            </button>

            <button
              type="button"
              className="btn-mini"
              onClick={() => setTela("SuprEstoque")}
            >
              Estoque (Inventário)
            </button>
          </div>
        </section>
      </div>

      <ERPFooter onBack={() => setTela("HomeERP")} />
    </>
  );
}

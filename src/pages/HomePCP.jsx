import React from "react";
import ERPHeader from "./ERPHeader";
import ERPFooter from "./ERPFooter";
import "./HomePCP.css";

export default function HomePCP({ setTela }) {
  return (
    <>
      <ERPHeader title="PCP – Planejamento" />

      <main className="pcp-main">
        <section className="pcp-actions">
          <div className="pcp-actions__grid">
            <button
              type="button"
              className="pcp-btn pcp-btn--dark70"
              onClick={() => setTela("LanPed")}
            >
              📌 Lançar Pedido
            </button>

            <button
              type="button"
              className="pcp-btn pcp-btn--dark70"
              onClick={() => setTela("AliSab")}
            >
              🍫 Alimentar Sabores
            </button>

            <button
              type="button"
              className="pcp-btn pcp-btn--dark70"
              onClick={() => setTela("StaPed")}
            >
              📊 Status dos Pedidos
            </button>

            <button
              type="button"
              className="pcp-btn pcp-btn--dark70"
              onClick={() => setTela("Suprimentos")}
            >
              🧺 Suprimentos
            </button>
          </div>
        </section>
      </main>

      <ERPFooter onBack={() => setTela("HomeERP")} />
    </>
  );
}

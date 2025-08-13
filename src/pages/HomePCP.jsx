// src/pages/HomePCP.jsx
import React from "react";
import ERPHeader from "./ERPHeader";
import ERPFooter from "./ERPFooter";
import "./HomePCP.css"; // se houver

export default function HomePCP({ setTela }) {
  return (
    <>
      <ERPHeader title="PCP – Planejamento" />
      <main style={{ padding: "10px 10px 92px", minHeight: "calc(100vh - 36px)",
                     background: 'url("/bg001.png") center 140px/cover no-repeat, #fcf4e9' }}>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
          gap: "12px",
        }}>
          <button className="pcp-btn staped-btn staped-btn--dark70" onClick={() => setTela("LanPed")}>
            ➕ Lançar Pedido
          </button>
          <button className="pcp-btn staped-btn staped-btn--dark60" onClick={() => setTela("AliSab")}>
            🍫 Alimentar Sabores
          </button>
          <button className="pcp-btn staped-btn staped-btn--dark70" onClick={() => setTela("StaPed")}>
            📊 Status dos Pedidos
          </button>
          <button className="pcp-btn staped-btn staped-btn--dark60" onClick={() => setTela("Suprimentos")}>
            🧺 Suprimentos
          </button>
        </div>
      </main>
      <ERPFooter onBack={() => setTela("HomeERP")} />
    </>
  );
}

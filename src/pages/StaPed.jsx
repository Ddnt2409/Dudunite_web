// src/pages/StaPed.jsx
import React from "react";
import ERPHeader from "./ERPHeader";
import ERPFooter from "./ERPFooter";

export default function StaPed({ setTela }) {
  return (
    <>
      <ERPHeader title="PCP – Status dos Pedidos" />

      <main className="alisab-main">
        <div className="alisab-header">
          <div className="alisab-title">📋 Status dos Pedidos</div>
        </div>

        {/* Placeholder inicial — troque pelo conteúdo real */}
        <div
          style={{
            background: "rgba(255,255,255,.65)",
            borderRadius: 12,
            padding: 16,
            boxShadow: "0 6px 18px rgba(0,0,0,.12)",
          }}
        >
          Em breve: listagem e filtros de pedidos por status.
        </div>
      </main>

      <ERPFooter onBack={() => setTela("HomePCP")} />
    </>
  );
}

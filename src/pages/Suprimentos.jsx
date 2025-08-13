// src/pages/Suprimentos.jsx
import React from "react";
import ERPHeader from "./ERPHeader";
import ERPFooter from "./ERPFooter";

export default function Suprimentos({ setTela }) {
  return (
    <>
      <ERPHeader title="PCP – Suprimentos" />
      <main style={{
        padding: "10px 10px 92px",
        minHeight: "calc(100vh - 36px)",
        background: 'url("/bg001.png") center 140px/cover no-repeat, #fcf4e9'
      }}>
        <h2 style={{ fontWeight: 800, color: "#5C1D0E", margin: "8px 0 12px" }}>
          🧺 Gestão de Suprimentos
        </h2>
        <div style={{
          background: "rgba(255,255,255,.92)", border: "1px solid #efe7e3",
          borderRadius: 16, padding: 16, boxShadow: "0 10px 24px rgba(0,0,0,.12)"
        }}>
          <p style={{ margin: 0, color: "#3f312e" }}>
            Em breve: margarina e farinha para untar tabuleiros, etiquetas/adesivos,
            níveis mínimos e previsão automática baseada no planejamento.
          </p>
        </div>
      </main>
      <ERPFooter onBack={() => setTela("HomePCP")} />
    </>
  );
}

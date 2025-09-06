import React from "react";
import ERPHeader from "./ERPHeader";
import ERPFooter from "./ERPFooter";

export default function SuprEstoque({ setTela }) {
  return (
    <>
      <ERPHeader title="ERP DUDUNITÊ — Estoque (Inventário)" />
      <main style={{ padding: 12 }}>
        <div className="extrato-card" style={{ maxWidth: 980, margin: "10px auto" }}>
          <h2 style={{ marginTop: 0 }}>Inventário — piloto</h2>
          <p>Esta tela receberá a grade <b>Produto | Qtd (entrada)</b> | <b>Estoque Atual</b> | <b>Estoque Final</b> | <b>Remanescente</b> | <b>Valor</b>.</p>
          <button className="btn-acao" onClick={() => setTela("HomePCP")}>Voltar</button>
        </div>
      </main>
      <ERPFooter onBack={() => setTela("HomePCP")} />
    </>
  );
}

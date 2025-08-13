import React from "react";
import ERPHeader from "./ERPHeader";
import ERPFooter from "./ERPFooter";
import "./HomePCP.css";

export default function HomePCP({ setTela }) {
  return (
    <>
      {/* Mantém o cabeçalho padrão do sistema */}
      <ERPHeader title="PCP – Planejamento" />

      {/* Container com o BG e o layout que você já usava */}
      <div className="homepcp-container">
        {/* grade/flex dos botões grandes aprovados */}
        <div className="botoes-pcp">
          <button
            type="button"
            className="botao-principal"
            onClick={() => setTela("LanPed")}
          >
            📌 {"\n"} Lançar Pedido
          </button>

          <button
            type="button"
            className="botao-principal"
            onClick={() => setTela("AliSab")}
          >
            🍫 {"\n"} Alimentar Sabores
          </button>

          <button
            type="button"
            className="botao-principal"
            onClick={() => setTela("StaPed")}
          >
            📊 {"\n"} Status dos Pedidos
          </button>

          <button
            type="button"
            className="botao-principal"
            onClick={() => setTela("Suprimentos")}
          >
            🧺 {"\n"} Suprimentos
          </button>
        </div>
      </div>

      {/* Rodapé padrão com marquee já existente no ERP */}
      <ERPFooter onBack={() => setTela("HomeERP")} />
    </>
  );
}

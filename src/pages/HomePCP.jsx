import React, { useState } from "react";
import ERPHeader from "./ERPHeader";
import ERPFooter from "./ERPFooter";
import "./HomePCP.css";

export default function HomePCP({ setTela }) {
  const [abrirSup, setAbrirSup] = useState(false);

  return (
    <>
      <ERPHeader title="PCP – Planejamento" />

      <div className="homepcp-container">
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
            onClick={() => setAbrirSup(true)}
          >
            🧺 {"\n"} Suprimentos
          </button>
        </div>
      </div>

      {/* MODAL – opções de Suprimentos */}
      {abrirSup && (
        <div
          className="sup-modal-backdrop"
          onClick={() => setAbrirSup(false)}
          role="presentation"
        >
          <div className="sup-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="sup-modal-title">Suprimentos</div>
            <div className="sup-modal-actions">
              <button
                className="botao-principal"
                onClick={() => setTela("SuprComprasLista")}
              >
                🧾 {"\n"} Compras (Lista A–Z)
              </button>
              <button
                className="botao-principal"
                onClick={() => setTela("SuprEstoque")}
              >
                📦 {"\n"} Estoque (Inventário)
              </button>
              <button className="btn-fechar-modal" onClick={() => setAbrirSup(false)}>
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      <ERPFooter onBack={() => setTela("HomeERP")} />
    </>
  );
}

// src/pages/HomePCP.jsx
import React, { useEffect, useState } from "react";
import ERPHeader from "./ERPHeader";
import ERPFooter from "./ERPFooter";
import "./HomePCP.css";

export default function HomePCP({ setTela }) {
  const [abrirSup, setAbrirSup] = useState(false);

  // fecha com ESC e bloqueia scroll do body quando modal aberto
  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") setAbrirSup(false);
    }
    if (abrirSup) {
      document.addEventListener("keydown", onKey);
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.removeEventListener("keydown", onKey);
        document.body.style.overflow = prev;
      };
    }
  }, [abrirSup]);

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
                className="sup-modal-btn"
                autoFocus
                onClick={() => setTela("SuprComprasLista")}
                title="Registrar compras por lista (A–Z)"
              >
                🧾 Compras (Lista A–Z)
              </button>

              <button
                className="sup-modal-btn"
                onClick={() => setTela("SuprEstoque")}
                title="Inventário: entrada/baixa e custo médio"
              >
                📦 Estoque (Inventário)
              </button>

              <button
                className="btn-fechar-modal"
                onClick={() => setAbrirSup(false)}
                title="Fechar"
              >
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

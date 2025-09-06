import React, { useEffect, useRef, useState } from "react";
import ERPHeader from "./ERPHeader";
import ERPFooter from "./ERPFooter";
import "./HomePCP.css";

export default function HomePCP({ setTela }) {
  const [mostrarSup, setMostrarSup] = useState(false);
  const supRef = useRef(null);

  // Se veio da HomeERP pelo atalho "Suprimentos", abrir já expandido e rolar até ele
  useEffect(() => {
    try {
      if (sessionStorage.getItem("pcpOpenSup") === "1") {
        sessionStorage.removeItem("pcpOpenSup");
        setMostrarSup(true);
        setTimeout(
          () =>
            supRef.current?.scrollIntoView({
              behavior: "smooth",
              block: "center",
            }),
          0
        );
      }
    } catch {}
  }, []);

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

          {/* Wrapper RELATIVO do botão Suprimentos + dropdown “descendo” */}
          <div className="sup-drop" ref={supRef}>
            <button
              type="button"
              className="botao-principal"
              onClick={() => setMostrarSup((v) => !v)}
            >
              🧺 {"\n"} Suprimentos
            </button>

            {mostrarSup && (
              <div className="sup-dropdown">
                <button
                  className="sup-btn"
                  onClick={() => setTela("SuprComprasLista")}
                >
                  🧾 Compras (Lista A–Z)
                </button>
                <button
                  className="sup-btn"
                  onClick={() => setTela("SuprEstoque")}
                >
                  📦 Estoque (Inventário)
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <ERPFooter onBack={() => setTela("HomeERP")} />
    </>
  );
}

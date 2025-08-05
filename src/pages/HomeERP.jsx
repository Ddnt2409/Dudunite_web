import React from "react";
import HomePCP from "./HomePCP";
import "./HomeERP.css";

export default function HomeERP({ setAppTela }) {
  const [tela, setTela] = React.useState("ERP");

  // Se navegou pra PCP, renderiza o componente
  if (tela === "PCP") {
    return <HomePCP setTela={setTela} />;
  }

  return (
    <div className="erp-container">
      <header className="erp-header">
        <img src="/LogomarcaDDnt2025Vazado.png" alt="Logo Dudunitê" />
        <h1>ERP&nbsp;DUDUNITÊ</h1>
      </header>

      <main className="erp-main">
        <button
          className="erp-btn"
          onClick={() => setTela("PCP")}
        >
          📦<br />Produção&nbsp;(PCP)
        </button>

        <button
          className="erp-btn"
          onClick={() => alert("FinFlux em construção")}
        >
          💰<br />Financeiro&nbsp;(FinFlux)
        </button>

        <button
          className="erp-btn"
          onClick={() => alert("Análise de Custos em construção")}
        >
          📊<br />Análise&nbsp;de&nbsp;Custos
        </button>

        <button
          className="erp-btn"
          onClick={() => alert("Cozinha em construção")}
        >
          👨‍🍳<br />Cozinha
        </button>
      </main>

      <footer className="erp-footer">
        <marquee behavior="scroll" direction="left">
          • Pequeno Príncipe • Salesianas • Céu Azul • Russas • Bora Gastar •
          Kaduh • Society Show • Degusty • Tio Valter • Vera Cruz • Pinheiros •
          Dourado • BMQ • CFC • Madre de Deus • Saber Viver • Interativo •
          Exato Sede • Exato Anexo • Sesi • Motivo • Jesus Salvador
        </marquee>
      </footer>
    </div>
);
}

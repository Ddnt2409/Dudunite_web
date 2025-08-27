import React, { useEffect, useState } from "react";
import "../util/CtsReceber.css"; // <- usa o CSS dedicado

import { carregarPlanoDeContas } from "../util/cr_dataStub";
import CtsReceberPedidos from "./CtsReceberPedidos.jsx";
import CtsReceberAvulso from "./CtsReceberAvulso.jsx";

export default function CtsReceber({ setTela }) {
  const [aba, setAba] = useState("acumulados"); // "acumulados" | "avulsos"
  const [planoContas, setPlanoContas] = useState([]);
  const [loadingPC, setLoadingPC] = useState(true);

  useEffect(() => {
    (async () => {
      setLoadingPC(true);
      try { setPlanoContas(await carregarPlanoDeContas()); }
      finally { setLoadingPC(false); }
    })();
  }, []);

  return (
    <div className="ctsreceber-main">
      {/* Cabeçalho (usa suas classes globais) */}
      <header className="erp-header">
        <div className="erp-header__inner">
          <div className="erp-header__logo">
            <img src="/LogomarcaDDnt2025Vazado.png" alt="Dudunitê" />
          </div>
          <div className="erp-header__title">ERP DUDUNITÊ<br/>Contas a Receber</div>
        </div>
      </header>

      {/* Título + abas */}
      <div className="alisab-header">
        <h2 className="alisab-title">
          {aba === "acumulados"
            ? "Pedidos Acumulados (LanPed • Previsto • CAIXA FLUTUANTE)"
            : "Pedidos Avulsos (Realizado • CAIXA DIARIO)"}
        </h2>
        <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
          <button
            onClick={() => setAba("acumulados")}
            style={{ padding: "10px 12px", borderRadius: 10, border: 0, fontWeight: 800, color: "#fff",
                     background: aba==="acumulados" ? "#8c3b1b" : "#c46a42" }}>
            Acumulados
          </button>
          <button
            onClick={() => setAba("avulsos")}
            style={{ padding: "10px 12px", borderRadius: 10, border: 0, fontWeight: 800, color: "#fff",
                     background: aba==="avulsos" ? "#8c3b1b" : "#c46a42" }}>
            Avulsos
          </button>
        </div>
      </div>

      {loadingPC ? (
        <div style={{ padding: 10 }}>Carregando Plano de Contas…</div>
      ) : aba === "acumulados" ? (
        <CtsReceberPedidos />
      ) : (
        <CtsReceberAvulso planoContas={planoContas} />
      )}

      {/* Rodapé + voltar */}
      <button className="btn-voltar-foot" onClick={() => setTela?.("HomeERP")}>🔙 Voltar</button>
      <footer className="erp-footer">
        <div className="erp-footer-track">
          • Previstos (LanPed) + Realizados Avulsos (Varejo) • Extrato Geral no FinFlux •
        </div>
      </footer>
    </div>
  );
}

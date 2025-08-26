import React, { useEffect, useState } from "react";
import "./AliSab.css"; // usa BG, header e footer APROVADOS

import { carregarPlanoDeContas } from "../util/cr_dataStub";
import CtsReceberPedidos from "./CtsReceberPedidos.jsx";
import CtsReceberAvulso from "./CtsReceberAvulso.jsx";

export default function CtsReceber() {
  // abas: "acumulados" (LanPed → Previsto / CAIXA FLUTUANTE) | "avulsos" (Realizado / CAIXA DIARIO)
  const [aba, setAba] = useState("acumulados");
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
    <div className="alisab-main">
      {/* Cabeçalho local (não altera o ERPHeader global) */}
      <div className="alisab-header">
        <h2 className="alisab-title">
          {aba === "acumulados"
            ? "Contas a Receber • Pedidos Acumulados"
            : "Contas a Receber • Pedidos Avulsos"}
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
    </div>
  );
}

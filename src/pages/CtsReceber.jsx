import React, { useEffect, useState } from "react";
import { corFundo, corTerracota } from "../util/cr_helpers";
import { carregarPlanoDeContas } from "../util/cr_dataStub"; // <-- aqui!
import CtsReceberAvulso from "./CtsReceberAvulso.jsx";
import CtsReceberPedidos from "./CtsReceberPedidos.jsx";

export default function CtsReceber() {
  const [aba, setAba] = useState("pedidos"); // "pedidos" | "avulso"
  const [planoContas, setPlanoContas] = useState([]);
  const [loadingPC, setLoadingPC] = useState(true);

  useEffect(() => {
    (async () => {
      setLoadingPC(true);
      try {
        const pcs = await carregarPlanoDeContas(); // STUB por enquanto
        setPlanoContas(pcs);
      } finally {
        setLoadingPC(false);
      }
    })();
  }, []);

  if (loadingPC) return <div style={{ padding: 16 }}>Carregando Plano de Contas...</div>;

  return (
    <div style={{ minHeight: "100vh", background: corFundo }}>
      <div style={{ padding: 16 }}>
        <h1 style={{ color: corTerracota, fontWeight: 900, fontSize: 22, marginBottom: 10 }}>
          Contas a Receber – FinFlux
        </h1>
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <button
            onClick={() => setAba("pedidos")}
            style={{ padding: 10, borderRadius: 10, border: 0, background: aba === "pedidos" ? corTerracota : "#c46a42", color: "#fff", fontWeight: 700 }}
          >
            Pedidos Acumulados
          </button>
          <button
            onClick={() => setAba("avulso")}
            style={{ padding: 10, borderRadius: 10, border: 0, background: aba === "avulso" ? corTerracota : "#c46a42", color: "#fff", fontWeight: 700 }}
          >
            Lançamento Avulso
          </button>
        </div>
      </div>

      {aba === "pedidos" ? (
        <CtsReceberPedidos onVoltar={() => setAba("pedidos")} planoContas={planoContas} />
      ) : (
        <CtsReceberAvulso onVoltar={() => setAba("pedidos")} planoContas={planoContas} />
      )}
    </div>
  );
}

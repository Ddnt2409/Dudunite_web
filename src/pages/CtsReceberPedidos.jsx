// src/pages/CtsReceberPedidos.jsx
import React, { useEffect, useState } from "react";
import { corFundo, corTerracota } from "../util/cr_helpers";
import { carregarPedidosAcumulados } from "../util/cr_datastub";

export default function CtsReceberPedidos({ onVoltar, planoContas }) {
  const [carregando, setCarregando] = useState(true);
  const [lista, setLista] = useState([]);

  useEffect(() => {
    (async () => {
      setCarregando(true);
      try {
        const dados = await carregarPedidosAcumulados(); // do STUB por enquanto
        setLista(dados);
      } finally {
        setCarregando(false);
      }
    })();
  }, []);

  return (
    <div style={{ minHeight: "100vh", background: corFundo, padding: 16 }}>
      <h2 style={{ color: corTerracota, fontWeight: 800, marginBottom: 8 }}>Pedidos Acumulados</h2>
      <button onClick={onVoltar} style={{ marginBottom: 8 }}>Voltar</button>

      {carregando ? <div>Carregando...</div> : (
        <div style={{ display: "grid", gap: 8 }}>
          {lista.length === 0 && <div>Nenhum pedido encontrado (stub).</div>}
        </div>
      )}
    </div>
  );
}

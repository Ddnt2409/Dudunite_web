// Pedidos do LanPed (ACUMULADOS) => Previsto em CAIXA FLUTUANTE
import React, { useEffect, useState } from "react";
import { carregarPedidosAcumulados } from "../util/cr_dataStub";

export default function CtsReceberPedidos() {
  const [carregando, setCarregando] = useState(true);
  const [lista, setLista] = useState([]);

  useEffect(() => {
    (async () => {
      setCarregando(true);
      try {
        const dados = await carregarPedidosAcumulados(); // LanPed via stub
        // EXCLUIR apenas status "pendente" (case-insensitive)
        const filtrados = (dados || []).filter(p => {
          const s = String(p.statusEtapa || p.status || "").toLowerCase();
          return s !== "pendente";
        });
        setLista(filtrados);
      } finally {
        setCarregando(false);
      }
    })();
  }, []);

  if (carregando) return <div>Carregando pedidos…</div>;

  return (
    <div style={{ display: "grid", gap: 10 }}>
      {lista.length === 0 && (
        <div style={{ background:"#fff", border:"1px solid #e6d2c2", borderRadius:12, padding:12 }}>
          Nenhum pedido acumulado (todos pendentes).
        </div>
      )}

      {lista.map(p => (
        <div key={p.id} style={{
          background:"#fff",
          border:"1px solid #e6d2c2",
          borderRadius:12,
          padding:12
        }}>
          <div style={{ display:"flex", justifyContent:"space-between", gap:8, flexWrap:"wrap" }}>
            <div><b>{p.pdv}</b> • {p.cidade || "-"}</div>
            <div style={{ fontWeight:800, color:"#5C1D0E" }}>CAIXA FLUTUANTE • PREVISTO</div>
          </div>
          <div style={{ marginTop:6, display:"grid", gap:4 }}>
            <div>Forma PG: <b>{p.forma || p.formaPagamento || "-"}</b></div>
            <div>Produto: {p.produto || "-"} • Qtd: {p.quantidade ?? "-"}</div>
            <div>Valor: <b>{p.valor != null ? Number(p.valor).toLocaleString("pt-BR",{style:"currency",currency:"BRL"}) : "-"}</b></div>
            <div>Vencimento: <b>{p.vencimento || p.dataPrevista || "-"}</b></div>
            <div style={{ color:"#8b6a4a" }}>Status LanPed: {p.statusEtapa || p.status || "-"}</div>
          </div>

          <div style={{ display:"flex", gap:8, marginTop:10 }}>
            <button
              onClick={() => alert("Stub: marcar como Realizado (transferência p/ EXTRATO BANCARIO é feita no fluxo definido)")}
              style={{ background:"#8c3b1b", color:"#fff", border:0, borderRadius:10, padding:"10px 12px", fontWeight:800 }}
            >
              Marcar como Realizado
            </button>
            <button
              onClick={() => alert("Stub: ver detalhes do pedido")}
              style={{ background:"#eee", color:"#333", border:0, borderRadius:10, padding:"10px 12px", fontWeight:800 }}
            >
              Detalhes
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

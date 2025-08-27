import React, { useCallback, useEffect, useMemo, useState } from "react";
import "../util/FluxCx.css";
import { carregarAvulsos, carregarPedidosAcumulados } from "../util/cr_dataStub";

const fmtBRL = (v) =>
  (Number(v || 0)).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const ymd = (d) => {
  if (!d) return "-";
  if (typeof d === "string") {
    // aceita "YYYY-MM-DD" ou ISO
    return d.length >= 10 ? d.slice(0, 10) : new Date(d).toISOString().slice(0, 10);
  }
  try { return new Date(d).toISOString().slice(0, 10); } catch { return "-"; }
};
const ym = (d) => {
  if (!d) return "";
  if (typeof d === "string") return d.slice(0, 7);
  try { return new Date(d).toISOString().slice(0, 7); } catch { return ""; }
};

export default function FluxCx({ setTela }) {
  const [linhas, setLinhas] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [mostrarTodos, setMostrarTodos] = useState(false);

  const [mesRef, setMesRef] = useState(() => new Date().toISOString().slice(0, 7)); // YYYY-MM

  const carregarTudo = useCallback(async () => {
    setCarregando(true);
    try {
      const avulsos = carregarAvulsos();                    // Realizados (CAIXA DIARIO)
      const acumulados = await carregarPedidosAcumulados(); // Previstos (CAIXA FLUTUANTE)

      const A = avulsos.map((a) => {
        const vCalc = a.valor != null
          ? Number(a.valor)
          : Number(a.valorUnit || 0) * Number(a.quantidade || 0);
        const dataBase = a.dataLancamento || a.dataPrevista;
        return {
          id: a.id,
          data: ymd(dataBase),
          ym: ym(dataBase),
          conta: "CAIXA DIARIO",
          tipo: "Realizado",
          forma: a.formaPagamento,
          desc: `${a.pdv || "VAREJO"} • ${a.produto} x${a.quantidade}`,
          valor: Number(vCalc || 0),
        };
      });

      const B = (acumulados || [])
        .filter((p) => String(p.statusEtapa || p.status || "").toLowerCase() !== "pendente")
        .map((p) => {
          const dataBase = p.vencimento || p.dataPrevista;
          return {
            id: "prev_" + (p.id || Math.random()),
            data: ymd(dataBase),
            ym: ym(dataBase),
            conta: "CAIXA FLUTUANTE",
            tipo: "Previsto",
            forma: p.forma || p.formaPagamento,
            desc: `${p.pdv || "-"} • ${p.produto || "-"} x${p.quantidade ?? "-"}`,
            valor: Number(p.valor != null ? p.valor : 0),
          };
        });

      const merged = [...A, ...B].sort((x, y) => x.data.localeCompare(y.data));
      setLinhas(merged);
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => { carregarTudo(); }, [carregarTudo]);

  const linhasFiltradas = useMemo(() => {
    if (mostrarTodos) return linhas;
    if (!mesRef) return linhas;
    return linhas.filter((l) => l.ym === mesRef);
  }, [linhas, mesRef, mostrarTodos]);

  const totalPrev = linhasFiltradas.filter(l => l.tipo === "Previsto").reduce((s,l)=>s+l.valor,0);
  const totalReal = linhasFiltradas.filter(l => l.tipo === "Realizado").reduce((s,l)=>s+l.valor,0);
  const saldo = totalReal - totalPrev;

  return (
    <div className="fluxcx-main">
      {/* Header */}
      <header className="erp-header">
        <div className="erp-header__inner">
          <div className="erp-header__logo">
            <img src="/LogomarcaDDnt2025Vazado.png" alt="Dudunitê" />
          </div>
          <div className="erp-header__title">
            ERP DUDUNITÊ<br />Fluxo de Caixa
          </div>
        </div>
      </header>

      <div className="fluxcx-header">
        <h2 className="fluxcx-title">Extrato Geral (Previstos + Realizados)</h2>
        <div style={{ marginLeft: "auto" }} />
      </div>

      <div className="extrato-card">
        <div className="extrato-actions">
          <label>
            Mês:
            <input
              type="month"
              value={mesRef}
              onChange={(e)=>setMesRef(e.target.value)}
              style={{ marginLeft: 6 }}
            />
          </label>
          <button
            onClick={carregarTudo}
            style={{ marginLeft: 8, height: 44, borderRadius: 10, border: 0, background: "#8c3b1b", color:"#fff", fontWeight: 800, padding: "0 12px" }}
          >
            Atualizar
          </button>
          <label style={{ marginLeft: 8, display: "flex", alignItems: "center", gap: 6 }}>
            <input
              type="checkbox"
              checked={mostrarTodos}
              onChange={(e)=>setMostrarTodos(e.target.checked)}
            />
            Mostrar todos
          </label>
          <div style={{ marginLeft: "auto", fontWeight: 800 }}>
            {linhasFiltradas.length} de {linhas.length} lanç.
          </div>
        </div>

        {carregando ? (
          <div>Carregando lançamentos…</div>
        ) : (
          <div style={{ overflow: "auto", maxHeight: "60vh" }}>
            <table className="extrato">
              <thead>
                <tr>
                  <th style={{minWidth:100}}>Data</th>
                  <th style={{minWidth:140}}>Conta</th>
                  <th style={{minWidth:110}}>Tipo</th>
                  <th>Descrição</th>
                  <th style={{minWidth:120}}>Forma</th>
                  <th style={{minWidth:130, textAlign:"right"}}>Valor</th>
                </tr>
              </thead>
              <tbody>
                {linhasFiltradas.map(l => (
                  <tr key={l.id}>
                    <td>{l.data}</td>
                    <td>{l.conta}</td>
                    <td>
                      <span className={`chip ${l.tipo === "Realizado" ? "chip-real" : "chip-prev"}`}>{l.tipo}</span>
                    </td>
                    <td>{l.desc}</td>
                    <td>{l.forma || "-"}</td>
                    <td style={{ textAlign:"right", fontWeight:800 }}>{fmtBRL(l.valor)}</td>
                  </tr>
                ))}
                {linhasFiltradas.length === 0 && (
                  <tr><td colSpan={6} style={{ padding: 12, color: "#7b3c21" }}>
                    Nenhum lançamento para {mostrarTodos ? "todas as datas" : mesRef}.
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        <div className="saldos">
          <div className="box">Previstos: {fmtBRL(totalPrev)}</div>
          <div className="box">Realizados: {fmtBRL(totalReal)}</div>
          <div className="box">Saldo (Real - Prev): {fmtBRL(saldo)}</div>
        </div>
      </div>

      <button className="btn-voltar-foot" onClick={() => setTela?.("HomeERP")}>🔙 Voltar</button>
      <footer className="erp-footer">
        <div className="erp-footer-track">
          • Previstos (LanPed) + Realizados Avulsos (Varejo) • Extrato Geral (FinFlux) •
        </div>
      </footer>
    </div>
  );
}

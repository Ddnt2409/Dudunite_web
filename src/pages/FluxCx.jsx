import React, { useEffect, useMemo, useState } from "react";
import "../util/FluxCx.css";
import { carregarAvulsos, carregarPedidosAcumulados } from "../util/cr_dataStub";

const fmtBRL = (v) =>
  (Number(v || 0)).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const fmtData = (d) => {
  const dt = d ? new Date(d) : null;
  return dt ? dt.toLocaleDateString("pt-BR") : "-";
};

export default function FluxCx({ setTela }) {
  const [linhas, setLinhas] = useState([]);
  const [carregando, setCarregando] = useState(true);

  const [mesRef, setMesRef] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });

  useEffect(() => {
    (async () => {
      setCarregando(true);
      try {
        const avulsos = carregarAvulsos();                     // Realizados (CAIXA DIARIO)
        const acumulados = await carregarPedidosAcumulados();  // Previstos (CAIXA FLUTUANTE)

        const A = avulsos.map((a) => {
          const vCalc =
            a.valor != null
              ? a.valor
              : Number(a.valorUnit || 0) * Number(a.quantidade || 0);

          return {
            id: a.id,
            data: a.dataLancamento || a.dataPrevista,
            conta: "CAIXA DIARIO",
            tipo: "Realizado",
            forma: a.formaPagamento,
            desc: `${a.pdv || "VAREJO"} • ${a.produto} x${a.quantidade}`,
            valor: Number(vCalc || 0),
          };
        });

        const B = (acumulados || [])
          .filter(
            (p) =>
              String(p.statusEtapa || p.status || "").toLowerCase() !== "pendente"
          )
          .map((p) => ({
            id: "prev_" + (p.id || Math.random()),
            data: p.vencimento || p.dataPrevista,
            conta: "CAIXA FLUTUANTE",
            tipo: "Previsto",
            forma: p.forma || p.formaPagamento,
            desc: `${p.pdv || "-"} • ${p.produto || "-"} x${
              p.quantidade ?? "-"
            }`,
            valor: Number(p.valor != null ? p.valor : 0),
          }));

        const merged = [...A, ...B].sort(
          (x, y) => new Date(x.data) - new Date(y.data)
        );

        setLinhas(merged);
      } finally {
        setCarregando(false);
      }
    })();
  }, []);

  const linhasFiltradas = useMemo(() => {
    if (!mesRef) return linhas;
    const [y, m] = mesRef.split("-").map(Number);
    return linhas.filter((l) => {
      const d = new Date(l.data);
      return d.getFullYear() === y && d.getMonth() + 1 === m;
    });
  }, [linhas, mesRef]);

  const totalPrev = linhasFiltradas
    .filter((l) => l.tipo === "Previsto")
    .reduce((s, l) => s + l.valor, 0);
  const totalReal = linhasFiltradas
    .filter((l) => l.tipo === "Realizado")
    .reduce((s, l) => s + l.valor, 0);
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
            ERP DUDUNITÊ
            <br />
            Fluxo de Caixa
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
              onChange={(e) => setMesRef(e.target.value)}
              style={{ marginLeft: 6 }}
            />
          </label>
        </div>

        {carregando ? (
          <div>Carregando lançamentos…</div>
        ) : (
          <div style={{ overflow: "auto", maxHeight: "60vh" }}>
            <table className="extrato">
              <thead>
                <tr>
                  <th style={{ minWidth: 100 }}>Data</th>
                  <th style={{ minWidth: 140 }}>Conta</th>
                  <th style={{ minWidth: 110 }}>Tipo</th>
                  <th>Descrição</th>
                  <th style={{ minWidth: 120 }}>Forma</th>
                  <th style={{ minWidth: 130, textAlign: "right" }}>Valor</th>
                </tr>
              </thead>
              <tbody>
                {linhasFiltradas.map((l) => (
                  <tr key={l.id}>
                    <td>{fmtData(l.data)}</td>
                    <td>{l.conta}</td>
                    <td>
                      <span
                        className={`chip ${
                          l.tipo === "Realizado" ? "chip-real" : "chip-prev"
                        }`}
                      >
                        {l.tipo}
                      </span>
                    </td>
                    <td>{l.desc}</td>
                    <td>{l.forma || "-"}</td>
                    <td style={{ textAlign: "right", fontWeight: 800 }}>
                      {fmtBRL(l.valor)}
                    </td>
                  </tr>
                ))}
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

      <button className="btn-voltar-foot" onClick={() => setTela?.("HomeERP")}>
        🔙 Voltar
      </button>
      <footer className="erp-footer">
        <div className="erp-footer-track">
          • Previstos (LanPed) + Realizados Avulsos (Varejo) • Extrato Geral
          (FinFlux) •
        </div>
      </footer>
    </div>
  );
}

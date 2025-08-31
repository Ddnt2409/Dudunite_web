// src/pages/FluxCx.jsx
import React, { useEffect, useMemo, useState } from "react";
import ERPHeader from "./ERPHeader";
import ERPFooter from "./ERPFooter";
import "../util/FluxCx.css"; // ✅ mantém o visual aprovado

import {
  listenCaixaDiario,
  listenExtratoBancario,
  fecharCaixaDiario,
  backfillPrevistosDoMes,
} from "../util/financeiro_store";

function money(n) {
  return `R$ ${Number(n || 0).toFixed(2).replace(".", ",")}`;
}
function dtBR(d) {
  const s = typeof d === "string" ? d : (d?.toDate?.() || d || new Date()).toISOString();
  const [y, m, dd] = s.slice(0, 10).split("-");
  return `${dd}/${m}`;
}

export default function FluxCx({ setTela }) {
  const hoje = new Date();
  const [ano, setAno] = useState(hoje.getFullYear());
  const [mes, setMes] = useState(hoje.getMonth() + 1);
  const meses = ["janeiro","fevereiro","março","abril","maio","junho","julho","agosto","setembro","outubro","novembro","dezembro"];

  // CAIXA DIARIO
  const [cxLinhas, setCxLinhas] = useState([]);
  const [cxTotal, setCxTotal] = useState(0);
  const [cxSaldoAnt, setCxSaldoAnt] = useState(0);
  const [cxSaldoFin, setCxSaldoFin] = useState(0);

  // EXTRATO BANCÁRIO
  const [bkLinhas, setBkLinhas] = useState([]);
  const [totPrev, setTotPrev] = useState(0);
  const [totBan, setTotBan] = useState(0);
  const [bkSaldoAnt, setBkSaldoAnt] = useState(0);
  const [bkSaldoFin, setBkSaldoFin] = useState(0);

  const [diaFechamento, setDiaFechamento] = useState(hoje.toISOString().slice(0, 10));
  const [dataBanco, setDataBanco] = useState(hoje.toISOString().slice(0, 10));

  useEffect(() => {
    // ✅ garante que TODOS os pedidos do mês apareçam como PREVISTOS
    backfillPrevistosDoMes(ano, mes).catch(() => {});

    const u1 = listenCaixaDiario(
      ano,
      mes,
      ({ linhas, total, saldoAnterior, saldoFinal }) => {
        setCxLinhas(linhas);
        setCxTotal(total);
        setCxSaldoAnt(saldoAnterior);
        setCxSaldoFin(saldoFinal);
      },
      (e) => console.error("Caixa:", e)
    );

    const u2 = listenExtratoBancario(
      ano,
      mes,
      ({ linhas, totPrev, totBan, saldoAnterior, saldoFinal }) => {
        setBkLinhas(linhas);
        setTotPrev(totPrev);
        setTotBan(totBan);
        setBkSaldoAnt(saldoAnterior);
        setBkSaldoFin(saldoFinal);
      },
      (e) => console.error("Banco:", e)
    );

    return () => {
      u1 && u1();
      u2 && u2();
    };
  }, [ano, mes]);

  async function onFecharCaixa() {
    try {
      const res = await fecharCaixaDiario({
        diaOrigem: new Date(diaFechamento),
        dataBanco: new Date(dataBanco),
      });
      if (!res.criado) {
        alert("Não há itens do CAIXA DIÁRIO abertos nesse dia.");
        return;
      }
      alert(`Fechamento criado no BANCO: ${money(res.total)} (${res.itens} itens).`);
    } catch (e) {
      alert("Erro ao fechar caixa: " + (e?.message || e));
    }
  }

  return (
    <div className="fluxcx-main">
      <ERPHeader title="ERP DUDUNITÊ — Fluxo de Caixa" />

      <div className="fluxcx-header">
        <h2 className="fluxcx-title">Extrato Geral (Previstos + Realizados)</h2>
        <div className="extrato-actions">
          <label>
            Mês:&nbsp;
            <select value={mes} onChange={(e) => setMes(Number(e.target.value))}>
              {meses.map((m, i) => (
                <option key={m} value={i + 1}>
                  {m} de {ano}
                </option>
              ))}
            </select>
          </label>
          <label style={{ marginLeft: 10 }}>
            Ano:&nbsp;
            <input type="number" value={ano} onChange={(e) => setAno(Number(e.target.value))} style={{ width: 100 }} />
          </label>
        </div>
      </div>

      {/* ====== TOPO: CAIXA DIÁRIO ====== */}
      <div className="extrato-card">
        <div className="extrato-actions" style={{ gap: 8 }}>
          <h3 style={{ margin: 0 }}>Caixa Diário (Avulsos)</h3>
          <div style={{ marginLeft: "auto", display: "flex", gap: 16 }}>
            <span>Saldo anterior: <b>{money(cxSaldoAnt)}</b></span>
            <span>Total mês: <b>{money(cxTotal)}</b></span>
            <span>Saldo final: <b>{money(cxSaldoFin)}</b></span>
          </div>
        </div>

        <div className="extrato-actions" style={{ gap: 8 }}>
          <label>Dia a fechar: <input type="date" value={diaFechamento} onChange={(e) => setDiaFechamento(e.target.value)} /></label>
          <label>Data no banco: <input type="date" value={dataBanco} onChange={(e) => setDataBanco(e.target.value)} /></label>
          <button onClick={onFecharCaixa}>Fechar caixa do dia → Banco</button>
        </div>

        <div style={{ overflow: "auto", maxHeight: "40vh" }}>
          <table className="extrato">
            <thead>
              <tr>
                <th style={{ minWidth: 100 }}>Data</th>
                <th>Descrição</th>
                <th style={{ minWidth: 120 }}>Forma</th>
                <th style={{ minWidth: 110 }}>Status</th>
                <th style={{ minWidth: 130, textAlign: "right" }}>Valor</th>
              </tr>
            </thead>
            <tbody>
              {cxLinhas.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ padding: 12, color: "#7b3c21" }}>
                    Nenhum lançamento no período.
                  </td>
                </tr>
              )}
              {cxLinhas.map((l) => (
                <tr key={l.id}>
                  <td>{dtBR(l.data)}</td>
                  <td>{l.descricao || ""}</td>
                  <td>{l.forma || ""}</td>
                  <td>
                    <span className={`chip ${l.fechado ? "chip-real" : "chip-prev"}`}>{l.fechado ? "Fechado" : "Aberto"}</span>
                  </td>
                  <td style={{ textAlign: "right", fontWeight: 800 }}>{money(l.valor)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ====== BAIXO: EXTRATO BANCÁRIO ====== */}
      <div className="extrato-card">
        <div className="extrato-actions">
          <h3 style={{ margin: 0 }}>Extrato Bancário</h3>
          <div style={{ marginLeft: "auto", display: "flex", gap: 16 }}>
            <span>Saldo anterior: <b>{money(bkSaldoAnt)}</b></span>
            <span>Previstos: <b>{money(totPrev)}</b></span>
            <span>Realizados (Banco): <b>{money(totBan)}</b></span>
            <span>Saldo final: <b>{money(bkSaldoFin)}</b></span>
          </div>
        </div>

        <div style={{ overflow: "auto", maxHeight: "40vh" }}>
          <table className="extrato">
            <thead>
              <tr>
                <th style={{ minWidth: 100 }}>Data</th>
                <th style={{ minWidth: 110 }}>Tipo</th>
                <th>Descrição</th>
                <th style={{ minWidth: 120 }}>Forma</th>
                <th style={{ minWidth: 130, textAlign: "right" }}>Valor</th>
              </tr>
            </thead>
            <tbody>
              {bkLinhas.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ padding: 12, color: "#7b3c21" }}>
                    Sem lançamentos para estas datas.
                  </td>
                </tr>
              )}
              {bkLinhas.map((l) => (
                <tr key={`${l.origem}-${l.id}`}>
                  <td>{dtBR(l.data)}</td>
                  <td>
                    <span className={`chip ${l.origem === "Realizado" ? "chip-real" : "chip-prev"}`}>{l.origem}</span>
                  </td>
                  <td>{l.descricao || ""}</td>
                  <td>{l.forma || ""}</td>
                  <td style={{ textAlign: "right", fontWeight: 800 }}>{money(l.valor)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <button className="btn-voltar-foot" onClick={() => setTela?.("HomeERP")}>🔙 Voltar</button>
      <ERPFooter onBack={() => setTela("HomeERP")} />
    </div>
  );
}

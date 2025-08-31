import React, { useEffect, useMemo, useState } from "react";
import ERPHeader from "./ERPHeader";
import ERPFooter from "./ERPFooter";
import "../util/FluxCx.css";

import {
  listenCaixaDiario,
  listenExtratoBancario,
  fecharCaixaDiario,
  backfillPrevistosDoMes,
} from "../util/financeiro_store";

const money = (n) => `R$ ${Number(n || 0).toFixed(2).replace(".", ",")}`;
const dtBR = (d) => {
  const s = typeof d === "string" ? d : (d?.toDate?.() || d || new Date()).toISOString();
  const [y, m, dd] = s.slice(0, 10).split("-");
  return `${dd}/${m}`;
};
const ymd = (d) => (typeof d === "string" ? d.slice(0, 10) : new Date(d).toISOString().slice(0, 10));

export default function FluxCx({ setTela }) {
  const hoje = new Date();

  const [ano, setAno] = useState(hoje.getFullYear());
  const [mes, setMes] = useState(hoje.getMonth() + 1);
  const [diaView, setDiaView] = useState(hoje.toISOString().slice(0, 10)); // ⬅️ dia exibido nos DOIS extratos

  const meses = [
    "janeiro","fevereiro","março","abril","maio","junho",
    "julho","agosto","setembro","outubro","novembro","dezembro"
  ];

  // CAIXA DIÁRIO (linhas do mês)
  const [cxLinhas, setCxLinhas] = useState([]);
  const [cxTotalMes, setCxTotalMes] = useState(0);
  const [cxSaldoAntMes, setCxSaldoAntMes] = useState(0);

  // EXTRATO BANCÁRIO (linhas do mês)
  const [bkLinhas, setBkLinhas] = useState([]);
  const [totPrevMes, setTotPrevMes] = useState(0);
  const [totBanMes, setTotBanMes] = useState(0);
  const [bkSaldoAntMes, setBkSaldoAntMes] = useState(0);

  // Fechamento (usa o dia exibido por padrão)
  const [diaFechamento, setDiaFechamento] = useState(ymd(hoje));
  const [dataBanco, setDataBanco] = useState(ymd(hoje));

  // carrega + assina mês
  useEffect(() => {
    backfillPrevistosDoMes(ano, mes).catch(() => {});

    const u1 = listenCaixaDiario(
      ano,
      mes,
      ({ linhas, total, saldoAnterior, saldoFinal }) => {
        setCxLinhas(linhas);
        setCxTotalMes(total);
        setCxSaldoAntMes(saldoAnterior);
      },
      (e) => console.error("Caixa:", e)
    );

    const u2 = listenExtratoBancario(
      ano,
      mes,
      ({ linhas, totPrev, totBan, saldoAnterior, saldoFinal }) => {
        setBkLinhas(linhas);
        setTotPrevMes(totPrev);
        setTotBanMes(totBan);
        setBkSaldoAntMes(saldoAnterior);
      },
      (e) => console.error("Banco:", e)
    );

    return () => {
      u1 && u1();
      u2 && u2();
    };
  }, [ano, mes]);

  /* ====== derivação DIÁRIA ====== */
  const cxDia = useMemo(() => cxLinhas.filter((l) => ymd(l.data) === diaView), [cxLinhas, diaView]);
  const cxAntesDia = useMemo(
    () => cxLinhas.filter((l) => ymd(l.data) < diaView),
    [cxLinhas, diaView]
  );
  const soma = (arr) => arr.reduce((s, l) => s + Number(l.valor || 0), 0);

  const cxSaldoInicialDia = useMemo(
    () => cxSaldoAntMes + soma(cxAntesDia),
    [cxSaldoAntMes, cxAntesDia]
  );
  const cxTotalDia = useMemo(() => soma(cxDia), [cxDia]);
  const cxSaldoFinalDia = useMemo(
    () => cxSaldoInicialDia + cxTotalDia,
    [cxSaldoInicialDia, cxTotalDia]
  );

  // Banco: separar previstos x realizados
  const bkDia = useMemo(() => bkLinhas.filter((l) => ymd(l.data) === diaView), [bkLinhas, diaView]);
  const bkAntesDia = useMemo(() => bkLinhas.filter((l) => ymd(l.data) < diaView), [bkLinhas, diaView]);

  const prevAntes = useMemo(
    () => soma(bkAntesDia.filter((l) => l.origem === "Previsto")),
    [bkAntesDia]
  );
  const realAntes = useMemo(
    () => soma(bkAntesDia.filter((l) => l.origem === "Realizado")),
    [bkAntesDia]
  );
  const prevDia = useMemo(
    () => soma(bkDia.filter((l) => l.origem === "Previsto")),
    [bkDia]
  );
  const realDia = useMemo(
    () => soma(bkDia.filter((l) => l.origem === "Realizado")),
    [bkDia]
  );

  // saldo inicial do dia = saldoAnteriorDoMês + (realAntes - prevAntes)
  const bkSaldoInicialDia = useMemo(
    () => bkSaldoAntMes + (realAntes - prevAntes),
    [bkSaldoAntMes, realAntes, prevAntes]
  );
  // movimento do dia = Realizados - Previstos
  const bkMovDia = useMemo(() => realDia - prevDia, [realDia, prevDia]);
  const bkSaldoFinalDia = useMemo(
    () => bkSaldoInicialDia + bkMovDia,
    [bkSaldoInicialDia, bkMovDia]
  );

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
        <h2 className="fluxcx-title">Extratos do dia</h2>
        <div className="extrato-actions">
          <label>
            Mês:&nbsp;
            <select value={mes} onChange={(e) => setMes(Number(e.target.value))}>
              {meses.map((m, i) => (
                <option key={m} value={i + 1}>{m} de {ano}</option>
              ))}
            </select>
          </label>
          <label style={{ marginLeft: 10 }}>
            Ano:&nbsp;
            <input type="number" value={ano} onChange={(e) => setAno(Number(e.target.value))} style={{ width: 100 }} />
          </label>
          <label style={{ marginLeft: 10 }}>
            Dia (visualização):&nbsp;
            <input type="date" value={diaView} onChange={(e) => setDiaView(e.target.value)} />
          </label>
        </div>
      </div>

      {/* ===== TOPO: CAIXA DIÁRIO (do dia) ===== */}
      <div className="extrato-card">
        <div className="extrato-actions" style={{ gap: 12 }}>
          <h3 style={{ margin: 0 }}>Caixa Diário — {dtBR(diaView)}</h3>
          <div style={{ marginLeft: "auto", display: "flex", gap: 16 }}>
            <span>Saldo inicial: <b>{money(cxSaldoInicialDia)}</b></span>
            <span>Total do dia: <b>{money(cxTotalDia)}</b></span>
            <span>Saldo final: <b>{money(cxSaldoFinalDia)}</b></span>
          </div>
        </div>

        <div className="extrato-actions" style={{ gap: 8 }}>
          <label>Dia a fechar: <input type="date" value={diaFechamento} onChange={(e) => setDiaFechamento(e.target.value)} /></label>
          <label>Data no banco: <input type="date" value={dataBanco} onChange={(e) => setDataBanco(e.target.value)} /></label>
          <button onClick={onFecharCaixa}>Fechar caixa do dia → Banco</button>
        </div>

        <div style={{ overflow: "auto", maxHeight: "36vh" }}>
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
              {cxDia.length === 0 && (
                <tr><td colSpan={5} style={{ padding: 12, color: "#7b3c21" }}>
                  Nenhum lançamento neste dia.
                </td></tr>
              )}
              {cxDia.map((l) => (
                <tr key={l.id}>
                  <td>{dtBR(l.data)}</td>
                  <td>{l.descricao || ""}</td>
                  <td>{l.forma || ""}</td>
                  <td>
                    <span className={`chip ${l.fechado ? "chip-real" : "chip-prev"}`}>
                      {l.fechado ? "Fechado" : "Aberto"}
                    </span>
                  </td>
                  <td style={{ textAlign: "right", fontWeight: 800 }}>{money(l.valor)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ===== BAIXO: EXTRATO BANCÁRIO (do dia) ===== */}
      <div className="extrato-card">
        <div className="extrato-actions" style={{ gap: 12 }}>
          <h3 style={{ margin: 0 }}>Extrato Bancário — {dtBR(diaView)}</h3>
          <div style={{ marginLeft: "auto", display: "flex", gap: 16 }}>
            <span>Saldo inicial: <b>{money(bkSaldoInicialDia)}</b></span>
            <span>Previstos do dia: <b>{money(prevDia)}</b></span>
            <span>Realizados do dia: <b>{money(realDia)}</b></span>
            <span>Saldo final: <b>{money(bkSaldoFinalDia)}</b></span>
          </div>
        </div>

        <div style={{ overflow: "auto", maxHeight: "36vh" }}>
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
              {bkDia.length === 0 && (
                <tr><td colSpan={5} style={{ padding: 12, color: "#7b3c21" }}>
                  Sem lançamentos neste dia.
                </td></tr>
              )}
              {bkDia.map((l) => (
                <tr key={`${l.origem}-${l.id}`}>
                  <td>{dtBR(l.data)}</td>
                  <td>
                    <span className={`chip ${l.origem === "Realizado" ? "chip-real" : "chip-prev"}`}>
                      {l.origem}
                    </span>
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

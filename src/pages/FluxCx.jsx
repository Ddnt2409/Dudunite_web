import React, { useEffect, useMemo, useRef, useState } from "react";
import ERPHeader from "./ERPHeader";
import ERPFooter from "./ERPFooter";
import "../util/FluxCx.css";

import {
  listenCaixaDiario,
  listenExtratoBancario,
  listenSaldosIniciais,
  salvarSaldosIniciais,
  backfillPrevistosDoMes,
} from "../util/financeiro_store";

/* ==== helpers ==== */
const money = (n) => `R$ ${Number(n || 0).toFixed(2).replace(".", ",")}`;
const ymd = (d) =>
  typeof d === "string" ? d.slice(0, 10) : new Date(d).toISOString().slice(0, 10);
const br = (s) => {
  const [y, m, d] = ymd(s).split("-");
  return `${d}/${m}`;
};
const diasNoMes = (ano, mes1a12) => new Date(ano, mes1a12, 0).getDate();
const firstDay = (ano, mes1a12) => `${ano}-${String(mes1a12).padStart(2, "0")}-01`;
const lastDay = (ano, mes1a12) =>
  `${ano}-${String(mes1a12).padStart(2, "0")}-${String(diasNoMes(ano, mes1a12)).padStart(2, "0")}`;
const mesesNomes = [
  "janeiro","fevereiro","março","abril","maio","junho",
  "julho","agosto","setembro","outubro","novembro","dezembro",
];

function monthsBetween(iniStr, fimStr) {
  const [yi, mi] = iniStr.split("-").map(Number);
  const [yf, mf] = fimStr.split("-").map(Number);
  const out = [];
  let y = yi, m = mi;
  while (y < yf || (y === yf && m <= mf)) {
    out.push({ ano: y, mes: m });
    m++; if (m > 12) { m = 1; y++; }
  }
  return out;
}

/* ==== componente ==== */
export default function FluxCx({ setTela }) {
  const hoje = new Date();

  // MODO: "mes" ou "periodo"
  const [modo, setModo] = useState("mes");

  // Mês inteiro
  const [ano, setAno] = useState(hoje.getFullYear());
  const [mes, setMes] = useState(hoje.getMonth() + 1);

  // Período
  const [deStr, setDeStr] = useState(() => firstDay(hoje.getFullYear(), hoje.getMonth() + 1));
  const [ateStr, setAteStr] = useState(() => lastDay(hoje.getFullYear(), hoje.getMonth() + 1));

  // Saldos iniciais (persistem quando em "mes")
  const [caixaInicial, setCaixaInicial] = useState("0.00");
  const [bancoInicial, setBancoInicial] = useState("0.00");

  // Saldos iniciais LOCAIS para "periodo"
  const [caixaInicialPeriodo, setCaixaInicialPeriodo] = useState("0.00");
  const [bancoInicialPeriodo, setBancoInicialPeriodo] = useState("0.00");

  // Linhas cruas assinadas (podem vir de vários meses)
  const [cxAll, setCxAll] = useState([]); // {id,data,descricao,forma,valor,fechado}
  const [bkAll, setBkAll] = useState([]); // {id,origem("Previsto"/"Realizado"),data,descricao,forma,valor}

  // unsubs ativos (quando modo/período muda)
  const unsubListRef = useRef([]);

  // ===== cálculo do range efetivo =====
  const range = useMemo(() => {
    if (modo === "mes") {
      const ini = firstDay(ano, mes);
      const fim = lastDay(ano, mes);
      return { ini, fim, months: [{ ano, mes }] };
    } else {
      const ini = deStr <= ateStr ? deStr : ateStr;
      const fim = ateStr >= deStr ? ateStr : deStr;
      return { ini, fim, months: monthsBetween(ini, fim) };
    }
  }, [modo, ano, mes, deStr, ateStr]);

  // ===== assina dados conforme o range (1..N meses) =====
  useEffect(() => {
    // limpa assinaturas anteriores
    unsubListRef.current.forEach((u) => u && u());
    unsubListRef.current = [];

    // garante previstos do(s) mês(es) (idempotente)
    range.months.forEach(({ ano, mes }) => backfillPrevistosDoMes(ano, mes).catch(() => {}));

    // coletores (mesclam meses diferentes)
    let caixaTemp = [];
    let bancoTemp = [];

    range.months.forEach(({ ano, mes }) => {
      const u1 = listenCaixaDiario(
        ano,
        mes,
        ({ linhas }) => {
          // mescla preservando o mês selecionado
          caixaTemp = [
            ...caixaTemp.filter((l) => l._ym !== `${ano}-${mes}`),
            ...(linhas || []).map((l) => ({ ...l, _ym: `${ano}-${mes}` })),
          ];
          setCxAll(caixaTemp);
        },
        (e) => console.error("Caixa:", e)
      );
      const u2 = listenExtratoBancario(
        ano,
        mes,
        ({ linhas }) => {
          bancoTemp = [
            ...bancoTemp.filter((l) => l._ym !== `${ano}-${mes}`),
            ...(linhas || []).map((l) => ({ ...l, _ym: `${ano}-${mes}` })),
          ];
          setBkAll(bancoTemp);
        },
        (e) => console.error("Banco:", e)
      );
      unsubListRef.current.push(u1, u2);
    });

    // saldos iniciais do mês (apenas no modo "mes")
    let u3 = null;
    if (modo === "mes") {
      u3 = listenSaldosIniciais(ano, mes, ({ caixaInicial, bancoInicial }) => {
        setCaixaInicial(Number(caixaInicial || 0).toFixed(2));
        setBancoInicial(Number(bancoInicial || 0).toFixed(2));
      });
      unsubListRef.current.push(u3);
    }

    return () => {
      unsubListRef.current.forEach((u) => u && u());
      unsubListRef.current = [];
    };
  }, [range.months.map((m) => `${m.ano}-${m.mes}`).join("|")]); // eslint-disable-line

  // ===== salva saldos iniciais (modo "mes") =====
  async function salvarSaldos() {
    await salvarSaldosIniciais(ano, mes, {
      caixaInicial: Number(caixaInicial || 0),
      bancoInicial: Number(bancoInicial || 0),
    });
    alert("Saldo(s) inicial(is) salvo(s).");
  }

  // ===== filtra pelo range efetivo =====
  const cxFiltrado = useMemo(() => {
    return (cxAll || []).filter((l) => {
      const k = ymd(l.data);
      return k >= range.ini && k <= range.fim;
    });
  }, [cxAll, range]);

  const bkFiltrado = useMemo(() => {
    return (bkAll || []).filter((l) => {
      const k = ymd(l.data);
      return k >= range.ini && k <= range.fim;
    });
  }, [bkAll, range]);

  // ===== agrupamentos por dia + saldos correntes =====
  function agruparCaixa(linhas, saldoInicialBase) {
    const base = Number(saldoInicialBase || 0);
    const sorted = [...linhas].sort((a, b) => ymd(a.data).localeCompare(ymd(b.data)));

    const map = new Map(); // yyyy-mm-dd -> itens
    for (const l of sorted) {
      const k = ymd(l.data);
      if (!map.has(k)) map.set(k, []);
      map.get(k).push(l);
    }

    let running = base;
    const dias = [];
    for (const [k, itens] of Array.from(map.entries())) {
      const totalDia = itens.reduce((s, it) => s + Number(it.valor || 0), 0);
      const saldoInicial = running;
      const saldoFinal = saldoInicial + totalDia;
      dias.push({ data: k, itens, totalDia, saldoInicial, saldoFinal });
      running = saldoFinal;
    }
    return {
      dias,
      total: dias.reduce((s, d) => s + d.totalDia, 0),
      saldoInicial: base,
      saldoFinal: running,
    };
  }

  function agruparBanco(linhas, saldoInicialBase) {
    const base = Number(saldoInicialBase || 0);
    const sorted = [...linhas].sort((a, b) => ymd(a.data).localeCompare(ymd(b.data)));

    const map = new Map(); // yyyy-mm-dd -> {prev:[],real:[]}
    for (const l of sorted) {
      const k = ymd(l.data);
      if (!map.has(k)) map.set(k, { prev: [], real: [] });
      if (String(l.origem) === "Previsto") map.get(k).prev.push(l);
      else map.get(k).real.push(l);
    }

    let running = base;
    const dias = [];
    let totPrev = 0, totReal = 0;

    for (const [k, grupo] of Array.from(map.entries())) {
      const somaPrev = grupo.prev.reduce((s, it) => s + Number(it.valor || 0), 0);
      const somaReal = grupo.real.reduce((s, it) => s + Number(it.valor || 0), 0);
      totPrev += somaPrev;
      totReal += somaReal;

      const movDia = somaReal - somaPrev; // regra do banco
      const saldoInicial = running;
      const saldoFinal = saldoInicial + movDia;

      const itens = [...grupo.prev, ...grupo.real];
      dias.push({ data: k, itens, somaPrev, somaReal, saldoInicial, saldoFinal });
      running = saldoFinal;
    }

    return {
      dias,
      totPrev,
      totReal,
      saldoInicial: base,
      saldoFinal: running,
    };
  }

  const caixa = useMemo(() => {
    const base = modo === "mes" ? caixaInicial : caixaInicialPeriodo;
    return agruparCaixa(cxFiltrado, base);
  }, [cxFiltrado, caixaInicial, caixaInicialPeriodo, modo]);

  const banco = useMemo(() => {
    const base = modo === "mes" ? bancoInicial : bancoInicialPeriodo;
    return agruparBanco(bkFiltrado, base);
  }, [bkFiltrado, bancoInicial, bancoInicialPeriodo, modo]);

  /* ===== UI ===== */
  return (
    <div className="fluxcx-main">
      <ERPHeader title="ERP DUDUNITÊ — Fluxo de Caixa" />

      {/* seleção do range */}
      <div className="extrato-card" style={{ marginBottom: 10 }}>
        <div className="extrato-actions" style={{ gap: 10, flexWrap: "wrap" }}>
          <h3 style={{ margin: 0 }}>Seleção</h3>

          <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <input
              type="radio"
              name="modo"
              value="mes"
              checked={modo === "mes"}
              onChange={() => setModo("mes")}
            />
            Mês inteiro
          </label>
          {modo === "mes" && (
            <>
              <select value={mes} onChange={(e) => setMes(Number(e.target.value))}>
                {mesesNomes.map((m, i) => (
                  <option key={m} value={i + 1}>{m}</option>
                ))}
              </select>
              <input
                type="number"
                value={ano}
                onChange={(e) => setAno(Number(e.target.value))}
                style={{ width: 100 }}
              />
              <div style={{ marginLeft: "auto", display: "flex", gap: 10 }}>
                <label>
                  Saldo inicial Caixa:
                  <input
                    type="number" step="0.01"
                    value={caixaInicial}
                    onChange={(e) => setCaixaInicial(e.target.value)}
                    style={{ width: 120, marginLeft: 6 }}
                  />
                </label>
                <label>
                  Saldo inicial Banco:
                  <input
                    type="number" step="0.01"
                    value={bancoInicial}
                    onChange={(e) => setBancoInicial(e.target.value)}
                    style={{ width: 120, marginLeft: 6 }}
                  />
                </label>
                <button onClick={salvarSaldos}>Salvar</button>
              </div>
            </>
          )}

          <label style={{ display: "flex", alignItems: "center", gap: 6, marginLeft: 16 }}>
            <input
              type="radio"
              name="modo"
              value="periodo"
              checked={modo === "periodo"}
              onChange={() => setModo("periodo")}
            />
            Período (De/Até)
          </label>
          {modo === "periodo" && (
            <>
              <label>
                De: <input type="date" value={deStr} onChange={(e) => setDeStr(e.target.value)} />
              </label>
              <label>
                Até: <input type="date" value={ateStr} onChange={(e) => setAteStr(e.target.value)} />
              </label>
              <div style={{ marginLeft: "auto", display: "flex", gap: 10 }}>
                <label>
                  Saldo inicial Caixa (período):
                  <input
                    type="number" step="0.01"
                    value={caixaInicialPeriodo}
                    onChange={(e) => setCaixaInicialPeriodo(e.target.value)}
                    style={{ width: 140, marginLeft: 6 }}
                  />
                </label>
                <label>
                  Saldo inicial Banco (período):
                  <input
                    type="number" step="0.01"
                    value={bancoInicialPeriodo}
                    onChange={(e) => setBancoInicialPeriodo(e.target.value)}
                    style={{ width: 140, marginLeft: 6 }}
                  />
                </label>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ===== CAIXA DIÁRIO ===== */}
      <div className="extrato-card">
        <div className="extrato-actions" style={{ gap: 12 }}>
          <h3 style={{ margin: 0 }}>
            Caixa Diário —{" "}
            {modo === "mes"
              ? `${mesesNomes[mes - 1]} de ${ano}`
              : `${br(range.ini)} a ${br(range.fim)}`}
          </h3>
          <div style={{ marginLeft: "auto", display: "flex", gap: 16, flexWrap: "wrap" }}>
            <span>Saldo inicial do período: <b>{money(caixa.saldoInicial)}</b></span>
            <span>Total do período: <b>{money(caixa.total)}</b></span>
            <span>Saldo final do período: <b>{money(caixa.saldoFinal)}</b></span>
          </div>
        </div>

        {caixa.dias.length === 0 ? (
          <div style={{ padding: 12, color: "#7b3c21" }}>Nenhum lançamento no período.</div>
        ) : (
          caixa.dias.map((d) => (
            <div key={d.data} style={{ marginBottom: 14 }}>
              <div style={{ fontWeight: 800, marginBottom: 6 }}>
                {br(d.data)} — Saldo inicial: {money(d.saldoInicial)} •
                &nbsp;Total do dia: {money(d.totalDia)} • Saldo final: {money(d.saldoFinal)}
              </div>
              <div style={{ overflow: "auto" }}>
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
                    {d.itens.map((l) => (
                      <tr key={l.id}>
                        <td>{br(l.data)}</td>
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
          ))
        )}
      </div>

      {/* ===== EXTRATO BANCÁRIO ===== */}
      <div className="extrato-card">
        <div className="extrato-actions" style={{ gap: 12 }}>
          <h3 style={{ margin: 0 }}>
            Extrato Bancário —{" "}
            {modo === "mes"
              ? `${mesesNomes[mes - 1]} de ${ano}`
              : `${br(range.ini)} a ${br(range.fim)}`}
          </h3>
          <div style={{ marginLeft: "auto", display: "flex", gap: 16, flexWrap: "wrap" }}>
            <span>Saldo inicial do período: <b>{money(banco.saldoInicial)}</b></span>
            <span>Previstos: <b>{money(banco.totPrev)}</b></span>
            <span>Realizados (Banco): <b>{money(banco.totReal)}</b></span>
            <span>Saldo final do período: <b>{money(banco.saldoFinal)}</b></span>
          </div>
        </div>

        {banco.dias.length === 0 ? (
          <div style={{ padding: 12, color: "#7b3c21" }}>Sem lançamentos no período.</div>
        ) : (
          banco.dias.map((d) => (
            <div key={d.data} style={{ marginBottom: 14 }}>
              <div style={{ fontWeight: 800, marginBottom: 6 }}>
                {br(d.data)} — Saldo inicial: {money(d.saldoInicial)} •
                &nbsp;Previstos: {money(d.somaPrev)} • Realizados: {money(d.somaReal)} •
                &nbsp;Saldo final: {money(d.saldoFinal)}
              </div>
              <div style={{ overflow: "auto" }}>
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
                    {d.itens.map((l) => (
                      <tr key={`${l.origem}-${l.id}`}>
                        <td>{br(l.data)}</td>
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
          ))
        )}
      </div>

      <button className="btn-voltar-foot" onClick={() => setTela?.("HomeERP")}>🔙 Voltar</button>
      <ERPFooter onBack={() => setTela("HomeERP")} />
    </div>
  );
      }

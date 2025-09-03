// src/pages/CtsPagar.jsx
// CONTAS A PAGAR — lança PREVISTOS (saída) com periodicidade e múltiplos vencimentos
import React, { useEffect, useMemo, useState } from "react";
import "./CtsPagar.css";

import db from "../firebase";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";

/* ==== Helpers de data/format ==== */
const toYMD = (d) => {
  const x = d instanceof Date ? d : new Date(d);
  const mm = String(x.getMonth() + 1).padStart(2, "0");
  const dd = String(x.getDate()).padStart(2, "0");
  return `${x.getFullYear()}-${mm}-${dd}`;
};
const fmtBRL = (v) =>
  (Number(v || 0)).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function lastDayOfMonth(y, m0) { return new Date(y, m0 + 1, 0).getDate(); }
function addMonthsKeepDOM(baseYMD, monthsToAdd) {
  const [y, m, d] = baseYMD.split("-").map(Number);
  const base = new Date(y, m - 1, d);
  const tgtM0 = base.getMonth() + monthsToAdd;
  const tgtY  = base.getFullYear() + Math.floor(tgtM0 / 12);
  const nm0   = ((tgtM0 % 12) + 12) % 12;
  const dom   = Math.min(d, lastDayOfMonth(tgtY, nm0));
  return new Date(tgtY, nm0, dom);
}
function addDays(baseYMD, days) {
  const dt = new Date(baseYMD);
  dt.setDate(dt.getDate() + days);
  return dt;
}

/* ==== Constantes ==== */
const FORMAS = ["PIX", "Boleto", "Espécie", "Cartão", "Transferência"];

const PC_PAGAR = [
  ["1.01.01.001", "água casa"],["1.01.01.002", "celpe casa"],["1.01.01.003", "aluguel casa"],
  ["1.01.01.004", "Internet casa"],["1.01.01.005", "cuidados casa"],
  ["1.01.02.001", "feira"],["1.01.02.002", "lanches"],["1.01.02.003", "eventos casa"],["1.01.02.004", "suplementos"],
  ["1.01.03.001", "escolas"],["1.01.03.002", "academia"],["1.01.03.003", "personal"],
  ["1.01.03.004", "futuro 1"],["1.01.03.005", "futuro 2"],["1.01.03.006", "futuro 3"],
  ["1.01.04.001", "Internet casa (assinatura)"],["1.01.04.002", "TV box"],["1.01.04.003", "celular"],
  ["1.01.04.004", "futuro 1 (assinaturas)"],["1.01.04.005", "futuro 2 (assinaturas)"],
  ["1.01.05.001", "pintura casa"],["1.01.05.002", "elétrica casa"],["1.01.05.003", "hidráulica casa"],
  ["1.01.05.004", "decoração casa"],["1.01.05.005", "gás casa"],
  ["1.01.06.001", "cabelo"],["1.01.06.004", "unha"],["1.01.06.005", "sobrancelha"],["1.01.06.006", "maquiagem"],
  ["1.01.06.007", "buço"],["1.01.06.008", "massagem"],["1.01.06.009", "futuro 1 (pessoais)"],["1.01.06.010", "futuro 2 (pessoais)"],
  ["1.01.07.001", "locação"],["1.01.07.002", "alimentação"],["1.01.07.003", "deslocamento"],
  ["2.01.01.001", "água emp"],["2.01.01.002", "celpe emp"],["2.01.01.003", "aluguel emp"],
  ["2.01.01.004", "Internet emp"],["2.01.01.005", "ferramentas"],["2.01.01.006", "manutenção serviço emp"],
  ["2.01.02.001", "gás emp"],["2.01.02.002", "manutenção emp"],["2.01.02.003", "pintura emp"],
  ["2.01.02.004", "hidráulica emp"],["2.01.02.005", "FUTURO"],
  ["2.01.03.001", "produção emp"],["2.01.03.002", "embalagem emp"],["2.01.03.003", "recheio emp"],
  ["2.01.03.004", "terceiros emp"],["2.01.03.005", "papelaria emp"],["2.01.03.006", "equipamentos"],
];

export default function CtsPagar({ setTela }) {
  /* ===== Ordem pedida =====
     1) Periodicidade → 2) Ocorrências → (linhas) Vencimento + Valor
     3) Forma de pagamento
     4) Plano de contas + Descrição
  */

  // 1) Periodicidade
  const [periodicidade, setPeriodicidade] = useState("UNICO"); // UNICO|SEMANAL|QUINZENAL|MENSAL|BIMESTRAL|TRIMESTRAL|SEMESTRAL|ANUAL
  const [ocorrencias, setOcorrencias] = useState(1);

  // Linhas de vencimento/valor (sempre existe pelo menos 1)
  const [rows, setRows] = useState([{ data: toYMD(new Date()), valor: "" }]);

  // 3) Forma
  const [forma, setForma] = useState("PIX");

  // 4) Plano + descrição
  const [plano, setPlano] = useState("");
  const [descricao, setDescricao] = useState("");

  // Totais + OK
  const total = useMemo(
    () => rows.reduce((s, r) => s + Number(r.valor || 0), 0),
    [rows]
  );
  const [okMsg, setOkMsg] = useState("");

  // Ajusta quantidade de linhas conforme ocorrências
  useEffect(() => {
    const n = Math.max(1, Number(ocorrencias || 1));
    setRows((prev) => {
      const base = prev[0] ?? { data: toYMD(new Date()), valor: "" };
      const arr = [...prev];
      if (arr.length < n) {
        while (arr.length < n) arr.push({ data: base.data, valor: "" });
      } else if (arr.length > n) {
        arr.length = n;
      }
      return arr;
    });
  }, [ocorrencias]);

  // Preenche datas automaticamente a partir da 1ª linha
  function autopreencherDatas() {
    setRows((prev) => {
      const arr = [...prev];
      const base = arr[0]?.data || toYMD(new Date());
      for (let i = 0; i < arr.length; i++) {
        let dt;
        switch (periodicidade) {
          case "SEMANAL":     dt = addDays(base, 7 * i); break;
          case "QUINZENAL":   dt = addDays(base, 15 * i); break;
          case "MENSAL":      dt = addMonthsKeepDOM(base, 1 * i); break;
          case "BIMESTRAL":   dt = addMonthsKeepDOM(base, 2 * i); break;
          case "TRIMESTRAL":  dt = addMonthsKeepDOM(base, 3 * i); break;
          case "SEMESTRAL":   dt = addMonthsKeepDOM(base, 6 * i); break;
          case "ANUAL":       dt = addMonthsKeepDOM(base, 12 * i); break;
          case "UNICO":
          default:            dt = addDays(base, 0);
        }
        arr[i] = { ...arr[i], data: toYMD(dt) };
      }
      return arr;
    });
  }

  function setRowData(i, key, val) {
    setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, [key]: val } : r)));
  }

  async function salvar() {
    setOkMsg("");
    // Validações
    const [cod, nome] = plano ? plano.split(" | ") : [];
    if (!cod) { alert("Selecione o Plano de Contas."); return; }
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      if (!r.data) { alert(`Informe a data do vencimento ${i + 1}.`); return; }
      if (!(Number(r.valor) > 0)) { alert(`Informe o valor (>0) do vencimento ${i + 1}.`); return; }
    }

    const col = collection(db, "financeiro_fluxo");
    try {
      for (let i = 0; i < rows.length; i++) {
        const r = rows[i];
        const parc = rows.length > 1 ? ` (${i + 1}/${rows.length})` : "";
        const desc = `PAGAR — ${nome}${descricao ? " — " + descricao : ""}${parc}`;

        await addDoc(col, {
          // chaves amplas para compatibilidade com o Extrato
          origem: "PAGAR",
          tipo: "Previsto",
          status: "Previsto",
          statusFinanceiro: "Previsto",

          planoContas: cod,
          planoNome: nome,

          descricao: desc,
          titulo: desc,
          memo: desc,
          historico: desc,

          formaPagamento: forma,

          dataPrevista: r.data,
          dataLancamento: r.data, // alguns relatórios usam esta

          valorPrevisto: -Math.abs(Number(r.valor)),
          valorRealizado: 0,

          conta: "EXTRATO BANCARIO",

          criadoEm: serverTimestamp(),
          atualizadoEm: serverTimestamp(),
        });
      }

      setOkMsg(
        `Lançados ${rows.length} pagamento(s) PREVISTO(s) • 1º venc.: ${rows[0].data} • ` +
        `Periodicidade: ${periodicidade} • Total do lote: -${fmtBRL(total)}`
      );

      // Reseta só valores/descrição; mantém a 1ª data como base
      setDescricao("");
      setRows([{ data: rows[0].data, valor: "" }]);
      setOcorrencias(1);
      setPeriodicidade("UNICO");
    } catch (e) {
      alert("Erro ao salvar: " + (e?.message || e));
    }
  }

  return (
    <div className="ctspagar-main">
      {/* HEADER padrão */}
      <header className="erp-header">
        <div className="erp-header__inner">
          <div className="erp-header__logo">
            <img src="/LogomarcaDDnt2025Vazado.png" alt="Dudunitê" />
          </div>
          <div className="erp-header__title">ERP DUDUNITÊ<br/>Financeiro</div>
        </div>
      </header>

      <div className="ctspagar-card">
        <h2>Contas a Pagar — lançar PREVISTO (saída)</h2>

        {/* 1) Periodicidade + Ocorrências */}
        <div className="cp-top">
          <label className="lbl">
            <span>Periodicidade</span>
            <select
              value={periodicidade}
              onChange={(e)=>setPeriodicidade(e.target.value)}
            >
              <option value="UNICO">Único</option>
              <option value="SEMANAL">Semanal</option>
              <option value="QUINZENAL">Quinzenal</option>
              <option value="MENSAL">Mensal</option>
              <option value="BIMESTRAL">Bimestral</option>
              <option value="TRIMESTRAL">Trimestral</option>
              <option value="SEMESTRAL">Semestral</option>
              <option value="ANUAL">Anual</option>
            </select>
          </label>

          <label className="lbl">
            <span>Ocorrências</span>
            <input
              type="number" min={1} step={1}
              value={ocorrencias}
              onChange={(e)=>setOcorrencias(e.target.value)}
            />
          </label>

          <button type="button" className="btn-auto" onClick={autopreencherDatas}>
            Preencher datas automaticamente
          </button>
        </div>

        {/* 2) Linhas de vencimento/valor */}
        <div className="cp-rows">
          {rows.map((r, i) => (
            <div key={i} className="cp-row">
              <div className="cp-row-n">#{i + 1}</div>
              <input
                className="cp-row-date"
                type="date"
                value={r.data}
                onChange={(e)=>setRowData(i,"data",e.target.value)}
                title="Data de vencimento"
              />
              <input
                className="cp-row-val"
                type="number" step="0.01"
                placeholder="Valor"
                value={r.valor}
                onChange={(e)=>setRowData(i,"valor",e.target.value)}
              />
            </div>
          ))}
        </div>

        {/* 3) Forma de pagamento */}
        <div className="cp-mid">
          <label className="lbl">
            <span>Forma de pagamento</span>
            <select value={forma} onChange={(e)=>setForma(e.target.value)}>
              {FORMAS.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
          </label>
        </div>

        {/* 4) Plano + descrição */}
        <div className="cp-end">
          <label className="lbl">
            <span>Plano de Contas (pagar)</span>
            <select value={plano} onChange={(e)=>setPlano(e.target.value)}>
              <option value="">Selecione…</option>
              {PC_PAGAR.map(([cod, nome]) => (
                <option key={cod} value={`${cod} | ${nome}`}>
                  {cod} — {nome}
                </option>
              ))}
            </select>
          </label>

          <label className="lbl">
            <span>Descrição (opcional)</span>
            <input
              type="text"
              placeholder="Ex.: referência, observação…"
              value={descricao}
              onChange={(e)=>setDescricao(e.target.value)}
            />
          </label>
        </div>

        {/* Totais + ações */}
        <div className="cp-totais">
          Total do lote: <b>-{fmtBRL(total)}</b>
          {rows.length > 1 ? <> • {rows.length} ocorrência(s)</> : null}
        </div>

        <div className="cp-acoes">
          <button className="btn-salvar" onClick={salvar}>Salvar PREVISTO</button>
          <button
            className="btn-cancelar"
            onClick={()=>{
              setOkMsg("");
              setDescricao("");
              setRows([{ data: rows[0].data, valor: "" }]);
              setOcorrencias(1);
              setPeriodicidade("UNICO");
            }}
          >
            Limpar
          </button>
        </div>

        {okMsg && <div className="ok-msg">{okMsg}</div>}

        <div className="cp-rodape-note">
          Conta: EXTRATO BANCARIO • Status: PREVISTO • Valores gravados como SAÍDA (negativos).
        </div>
      </div>

      {/* Voltar + footer fixo padrão */}
      <button className="btn-voltar-foot" onClick={() => setTela?.("CtsReceber")}>◀ Menu Financeiro</button>
      <footer className="erp-footer">
        <div className="erp-footer-track">• Pagamentos •</div>
      </footer>
    </div>
  );
        }

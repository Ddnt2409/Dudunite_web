// src/pages/CtsPagar.jsx
// CONTAS A PAGAR → Lança PREVISTOS (saídas) no financeiro_fluxo
import React, { useMemo, useState } from "react";
import "./CtsPagar.css";

import db from "../firebase";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";

/* ============= Helpers ============= */
const toYMD = (d) => {
  const x = d instanceof Date ? d : new Date(d);
  const mm = String(x.getMonth() + 1).padStart(2, "0");
  const dd = String(x.getDate()).padStart(2, "0");
  return `${x.getFullYear()}-${mm}-${dd}`;
};
const fmtBRL = (v) =>
  (Number(v || 0)).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function lastDayOfMonth(y, m /* 0..11 */) {
  return new Date(y, m + 1, 0).getDate();
}
function addMonthsKeepDOM(baseYMD, monthsToAdd) {
  const [y, m, d] = baseYMD.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  const targetM = dt.getMonth() + monthsToAdd;
  const targetY = dt.getFullYear() + Math.floor(targetM / 12);
  const normalizedM = ((targetM % 12) + 12) % 12;
  const dom = Math.min(d, lastDayOfMonth(targetY, normalizedM));
  return new Date(targetY, normalizedM, dom);
}
function addDays(baseYMD, days) {
  const dt = new Date(baseYMD);
  dt.setDate(dt.getDate() + days);
  return dt;
}

/* ============= Constantes ============= */
const FORMAS = ["PIX", "Boleto", "Espécie", "Cartão", "Transferência"];

const PC_PAGAR = [
  ["1.01.01.001", "água casa"],
  ["1.01.01.002", "celpe casa"],
  ["1.01.01.003", "aluguel casa"],
  ["1.01.01.004", "Internet casa"],
  ["1.01.01.005", "cuidados casa"],
  ["1.01.02.001", "feira"],
  ["1.01.02.002", "lanches"],
  ["1.01.02.003", "eventos casa"],
  ["1.01.02.004", "suplementos"],
  ["1.01.03.001", "escolas"],
  ["1.01.03.002", "academia"],
  ["1.01.03.003", "personal"],
  ["1.01.03.004", "futuro 1"],
  ["1.01.03.005", "futuro 2"],
  ["1.01.03.006", "futuro 3"],
  ["1.01.04.001", "Internet casa (assinatura)"],
  ["1.01.04.002", "TV box"],
  ["1.01.04.003", "celular"],
  ["1.01.04.004", "futuro 1 (assinaturas)"],
  ["1.01.04.005", "futuro 2 (assinaturas)"],
  ["1.01.05.001", "pintura casa"],
  ["1.01.05.002", "elétrica casa"],
  ["1.01.05.003", "hidráulica casa"],
  ["1.01.05.004", "decoração casa"],
  ["1.01.05.005", "gás casa"],
  ["1.01.06.001", "cabelo"],
  // (manicure não foi incluído porque veio com numeração conflitante no plano)
  ["1.01.06.004", "unha"],
  ["1.01.06.005", "sobrancelha"],
  ["1.01.06.006", "maquiagem"],
  ["1.01.06.007", "buço"],
  ["1.01.06.008", "massagem"],
  ["1.01.06.009", "futuro 1 (pessoais)"],
  ["1.01.06.010", "futuro 2 (pessoais)"],
  ["1.01.07.001", "locação"],
  ["1.01.07.002", "alimentação"],
  ["1.01.07.003", "deslocamento"],
  ["2.01.01.001", "água emp"],
  ["2.01.01.002", "celpe emp"],
  ["2.01.01.003", "aluguel emp"],
  ["2.01.01.004", "Internet emp"],
  ["2.01.01.005", "ferramentas"],
  ["2.01.01.006", "manutenção serviço emp"],
  ["2.01.02.001", "gás emp"],
  ["2.01.02.002", "manutenção emp"],
  ["2.01.02.003", "pintura emp"],
  ["2.01.02.004", "hidráulica emp"],
  ["2.01.02.005", "FUTURO"],
  ["2.01.03.001", "produção emp"],
  ["2.01.03.002", "embalagem emp"],
  ["2.01.03.003", "recheio emp"],
  ["2.01.03.004", "terceiros emp"],
  ["2.01.03.005", "papelaria emp"],
  ["2.01.03.006", "equipamentos"],
];

/* ============= Componente ============= */
export default function CtsPagar({ setTela }) {
  // Cabeçalho
  const [forma, setForma] = useState("PIX");
  const [data, setData]   = useState(() => toYMD(new Date()));

  // Periodicidade (aplica para todos os itens deste lote)
  const [periodicidade, setPeriodicidade] = useState("UNICO"); // UNICO|SEMANAL|QUINZENAL|MENSAL|BIMESTRAL|TRIMESTRAL|SEMESTRAL|ANUAL
  const [ocorrencias, setOcorrencias]     = useState(1);

  // Item corrente
  const [plano, setPlano] = useState("");
  const [descricao, setDescricao] = useState("");
  const [valor, setValor] = useState("");

  // Lista pendente
  const [linhas, setLinhas] = useState([]);
  const total = useMemo(
    () => linhas.reduce((s, l) => s + Number(l.valor || 0), 0),
    [linhas]
  );

  const [salvando, setSalvando] = useState(false);
  const [okMsg, setOkMsg] = useState("");

  function addLinha() {
    setOkMsg("");
    const [cod, nome] = plano ? plano.split(" | ") : [];
    const v = Number(valor);
    if (!cod || !v || v <= 0) {
      alert("Escolha o Plano de Contas e informe um valor (> 0).");
      return;
    }
    setLinhas(prev => [
      ...prev,
      { cod, nome, descricao: descricao?.trim() || "", valor: v }
    ]);
    setPlano(""); setDescricao(""); setValor("");
  }

  function removerLinha(idx) {
    setLinhas(prev => prev.filter((_, i) => i !== idx));
  }

  function calcData(baseYMD, i) {
    switch (periodicidade) {
      case "SEMANAL":     return addDays(baseYMD, 7 * i);
      case "QUINZENAL":   return addDays(baseYMD, 15 * i);
      case "MENSAL":      return addMonthsKeepDOM(baseYMD, 1 * i);
      case "BIMESTRAL":   return addMonthsKeepDOM(baseYMD, 2 * i);
      case "TRIMESTRAL":  return addMonthsKeepDOM(baseYMD, 3 * i);
      case "SEMESTRAL":   return addMonthsKeepDOM(baseYMD, 6 * i);
      case "ANUAL":       return addMonthsKeepDOM(baseYMD, 12 * i);
      case "UNICO":
      default:            return addDays(baseYMD, 0);
    }
  }

  async function salvarTudo() {
    if (!linhas.length) { alert("Adicione pelo menos 1 item."); return; }
    const reps = Math.max(1, Number(ocorrencias || 1));

    setSalvando(true); setOkMsg("");
    try {
      const col = collection(db, "financeiro_fluxo");
      let totalDocs = 0;

      for (const l of linhas) {
        for (let i = 0; i < reps; i++) {
          const dt = calcData(data, i);
          const ymd = toYMD(dt);
          const parc = reps > 1 ? ` (${i + 1}/${reps})` : "";

          await addDoc(col, {
            origem: "PAGAR",
            conta: "EXTRATO BANCARIO",
            statusFinanceiro: "Previsto",
            planoContas: l.cod,
            planoNome: l.nome,
            descricao: `PAGAR • ${l.nome}${l.descricao ? " — " + l.descricao : ""}${parc}`,
            formaPagamento: forma,
            dataPrevista: ymd,             // YYYY-MM-DD
            valorPrevisto: -Math.abs(Number(l.valor)), // SAÍDA
            valorRealizado: 0,
            criadoEm: serverTimestamp(),
            atualizadoEm: serverTimestamp(),
          });
          totalDocs++;
        }
      }

      setOkMsg(
        `Pagamentos previstos gerados: ${totalDocs} lançamento(s) • Periodicidade: ${periodicidade}` +
        (reps > 1 ? ` • Ocorrências: ${reps}` : "") +
        ` • Total base: -${fmtBRL(total)}`
      );
      setLinhas([]);
    } catch (e) {
      alert("Erro ao salvar: " + (e?.message || e));
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="ctspagar-main">
      {/* HEADER padrão */}
      <header className="erp-header">
        <div className="erp-header__inner">
          <div className="erp-header__logo"><img src="/LogomarcaDDnt2025Vazado.png" alt="Dudunitê" /></div>
          <div className="erp-header__title">ERP DUDUNITÊ<br/>Financeiro</div>
        </div>
      </header>

      {/* CARD */}
      <div className="ctspagar-card">
        <h2>Contas a Pagar — lançar PREVISTO (saída)</h2>

        {/* Cabeçalho (forma, 1º vencimento, periodicidade, ocorrências) */}
        <div className="cp-meta">
          <select value={forma} onChange={e=>setForma(e.target.value)}>
            {FORMAS.map(f => <option key={f} value={f}>{f}</option>)}
          </select>

          <input type="date" value={data} onChange={e=>setData(e.target.value)} />

          <select value={periodicidade} onChange={e=>setPeriodicidade(e.target.value)}>
            <option value="UNICO">Único</option>
            <option value="SEMANAL">Semanal</option>
            <option value="QUINZENAL">Quinzenal</option>
            <option value="MENSAL">Mensal</option>
            <option value="BIMESTRAL">Bimestral</option>
            <option value="TRIMESTRAL">Trimestral</option>
            <option value="SEMESTRAL">Semestral</option>
            <option value="ANUAL">Anual</option>
          </select>

          <input
            type="number"
            min={1}
            step={1}
            value={ocorrencias}
            onChange={e=>setOcorrencias(e.target.value)}
            placeholder="Ocorrências"
            title="Número de parcelas/ocorrências a gerar"
          />
        </div>

        {/* Item (plano, descrição, valor, adicionar) */}
        <div className="cp-item">
          <select value={plano} onChange={e=>setPlano(e.target.value)}>
            <option value="">Plano de Contas (pagar)</option>
            {PC_PAGAR.map(([cod, nome]) => (
              <option key={cod} value={`${cod} | ${nome}`}>
                {cod} — {nome}
              </option>
            ))}
          </select>

          <input
            type="text"
            placeholder="Descrição (opcional)"
            value={descricao}
            onChange={e=>setDescricao(e.target.value)}
          />

          <input
            type="number"
            step="0.01"
            placeholder="Valor"
            value={valor}
            onChange={e=>setValor(e.target.value)}
          />

          <button className="btn-add" onClick={addLinha}>Adicionar</button>
        </div>

        {/* Lista de itens do lote */}
        <ul className="cp-lista">
          {linhas.map((l, i) => (
            <li key={i}>
              <div className="cp-linha">
                <div className="cp-l-txt">
                  <b>{l.cod}</b> — {l.nome}
                  {l.descricao ? <> • {l.descricao}</> : null}
                </div>
                <div className="cp-l-val">-{fmtBRL(l.valor)}</div>
              </div>
              <button className="btn-x" onClick={()=>removerLinha(i)}>✕</button>
            </li>
          ))}
        </ul>

        <div className="cp-totais">
          Total base do lote: <b>-{fmtBRL(total)}</b>
          {periodicidade !== "UNICO" && Number(ocorrencias) > 1
            ? <> • Será replicado por <b>{ocorrencias}</b> ocorrência(s)</>
            : null}
        </div>

        <div className="cp-acoes">
          <button className="btn-salvar" onClick={salvarTudo} disabled={salvando}>
            {salvando ? "Salvando..." : "Salvar PREVISTO"}
          </button>
          <button className="btn-cancelar" onClick={()=>{
            setPlano(""); setDescricao(""); setValor(""); setLinhas([]); setOkMsg("");
          }}>
            Limpar
          </button>
        </div>

        {okMsg && <div className="okmsg">{okMsg}</div>}

        <div className="cp-rodape-note">
          Conta: EXTRATO BANCARIO • Status: PREVISTO • Valores gravados como SAÍDA (negativos).
          1º vencimento: {toYMD(data)} • Periodicidade: {periodicidade}
          {periodicidade !== "UNICO" ? <> • Ocorrências: {ocorrencias}</> : null}
        </div>
      </div>

      {/* VOLTAR + FOOTER */}
      <button className="btn-voltar-foot" onClick={() => setTela?.("CtsReceber")}>◀ Menu Financeiro</button>
      <footer className="erp-footer">
        <div className="erp-footer-track">• Pagamentos •</div>
      </footer>
    </div>
  );
        }

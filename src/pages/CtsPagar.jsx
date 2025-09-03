// src/pages/CtsPagar.jsx
// CONTAS A PAGAR → Lança PREVISTOS (saídas) no financeiro_fluxo
import React, { useMemo, useState } from "react";
import "./CtsPagar.css";

import db from "../firebase";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";

// ===== Helpers locais =====
const toYMD = (d) => {
  const x = d instanceof Date ? d : new Date(d);
  const mm = String(x.getMonth() + 1).padStart(2, "0");
  const dd = String(x.getDate()).padStart(2, "0");
  return `${x.getFullYear()}-${mm}-${dd}`;
};
const fmtBRL = (v) =>
  (Number(v || 0)).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

// ===== Formas de pagamento (pagar) =====
const FORMAS = ["PIX", "Boleto", "Espécie", "Cartão", "Transferência"];

// ===== Plano de Contas APROVADO (Pagamentos) – folhas =====
const PC_PAGAR = [
  // — Pessoal / Casa — Fixas
  ["1.01.01.001", "água casa"],
  ["1.01.01.002", "celpe casa"],
  ["1.01.01.003", "aluguel casa"],
  ["1.01.01.004", "Internet casa"],
  ["1.01.01.005", "cuidados casa"],
  // — Pessoal / Variáveis
  ["1.01.02.001", "feira"],
  ["1.01.02.002", "lanches"],
  ["1.01.02.003", "eventos casa"],
  ["1.01.02.004", "suplementos"],
  // — Pessoal / Fixas pessoais
  ["1.01.03.001", "escolas"],
  ["1.01.03.002", "academia"],
  ["1.01.03.003", "personal"],
  ["1.01.03.004", "futuro 1"],
  ["1.01.03.005", "futuro 2"],
  ["1.01.03.006", "futuro 3"],
  // — Assinaturas
  ["1.01.04.001", "Internet casa (assinatura)"],
  ["1.01.04.002", "TV box"],
  ["1.01.04.003", "celular"],
  ["1.01.04.004", "futuro 1 (assinaturas)"],
  ["1.01.04.005", "futuro 2 (assinaturas)"],
  // — Cuidados casa
  ["1.01.05.001", "pintura casa"],
  ["1.01.05.002", "elétrica casa"],
  ["1.01.05.003", "hidráulica casa"],
  ["1.01.05.004", "decoração casa"],
  ["1.01.05.005", "gás casa"],
  // — Pessoais
  ["1.01.06.001", "cabelo"],
  // (observação: manter como está — numeração enviada tem um 1.01.05.003 'manicure' duplicado;
  // por isso não incluí para evitar conflito de código)
  ["1.01.06.004", "unha"],
  ["1.01.06.005", "sobrancelha"],
  ["1.01.06.006", "maquiagem"],
  ["1.01.06.007", "buço"],
  ["1.01.06.008", "massagem"],
  ["1.01.06.009", "futuro 1 (pessoais)"],
  ["1.01.06.010", "futuro 2 (pessoais)"],
  // — Diversão
  ["1.01.07.001", "locação"],
  ["1.01.07.002", "alimentação"],
  ["1.01.07.003", "deslocamento"],

  // ===== Dudunitê / Empresa =====
  // Fixas
  ["2.01.01.001", "água emp"],
  ["2.01.01.002", "celpe emp"],
  ["2.01.01.003", "aluguel emp"],
  ["2.01.01.004", "Internet emp"],
  ["2.01.01.005", "ferramentas"],
  ["2.01.01.006", "manutenção serviço emp"],
  // Variáveis
  ["2.01.02.001", "gás emp"],
  ["2.01.02.002", "manutenção emp"],
  ["2.01.02.003", "pintura emp"],
  ["2.01.02.004", "hidráulica emp"],
  ["2.01.02.005", "FUTURO"],            // << conforme instrução “002 pode ser FUTURO”
  // Insumos
  ["2.01.03.001", "produção emp"],
  ["2.01.03.002", "embalagem emp"],
  ["2.01.03.003", "recheio emp"],
  ["2.01.03.004", "terceiros emp"],
  ["2.01.03.005", "papelaria emp"],
  ["2.01.03.006", "equipamentos"],
];

export default function CtsPagar({ setTela }) {
  // Cabeçalho
  const [forma, setForma] = useState("PIX");
  const [data, setData]   = useState(() => toYMD(new Date()));

  // Item corrente
  const [plano, setPlano] = useState("");
  const [descricao, setDescricao] = useState("");
  const [valor, setValor] = useState("");

  // Lista pendente de salvar
  const [linhas, setLinhas] = useState([]);
  const total = useMemo(
    () => linhas.reduce((s, l) => s + Number(l.valor || 0), 0),
    [linhas]
  );

  const [salvando, setSalvando] = useState(false);
  const [okMsg, setOkMsg] = useState("");

  function addLinha(){
    setOkMsg("");
    const [cod, nome] = plano ? plano.split(" | ") : [];
    const v = Number(valor);
    if (!cod || !v || v <= 0) {
      alert("Escolha o Plano de Contas e informe um valor (> 0).");
      return;
    }
    setLinhas(prev => [
      ...prev,
      {
        cod,
        nome,
        descricao: descricao?.trim() || "",
        valor: v, // positivo na UI; gravaremos negativo no banco
      }
    ]);
    setPlano(""); setDescricao(""); setValor("");
  }

  function removerLinha(idx){
    setLinhas(prev => prev.filter((_, i) => i !== idx));
  }

  async function salvarTudo(){
    if (!linhas.length) { alert("Adicione pelo menos 1 item."); return; }
    setSalvando(true); setOkMsg("");
    try{
      const col = collection(db, "financeiro_fluxo");
      for (const l of linhas){
        await addDoc(col, {
          origem: "PAGAR",
          conta: "EXTRATO BANCARIO",
          statusFinanceiro: "Previsto",
          planoContas: l.cod,
          planoNome: l.nome,
          descricao: `PAGAR • ${l.nome}${l.descricao ? " — " + l.descricao : ""}`,
          formaPagamento: forma,
          dataPrevista: data,             // YYYY-MM-DD
          valorPrevisto: -Math.abs(Number(l.valor)), // SAÍDA → negativo
          valorRealizado: 0,
          criadoEm: serverTimestamp(),
          atualizadoEm: serverTimestamp(),
        });
      }
      setOkMsg(`Pagamentos previstos lançados: ${linhas.length} • Total: ${fmtBRL(total)}.`);
      setLinhas([]);
    }catch(e){
      alert("Erro ao salvar: " + (e?.message || e));
    }finally{
      setSalvando(false);
    }
  }

  return (
    <div className="ctspagar-main">
      {/* HEADER padrão (será oculto quando embutido pelo Financeiro via .cr-embed) */}
      <header className="erp-header">
        <div className="erp-header__inner">
          <div className="erp-header__logo"><img src="/LogomarcaDDnt2025Vazado.png" alt="Dudunitê" /></div>
          <div className="erp-header__title">ERP DUDUNITÊ<br/>Contas a Pagar</div>
        </div>
      </header>

      {/* CARD */}
      <div className="ctspagar-card">
        <h2>Contas a Pagar — lançar PREVISTO (saída)</h2>

        {/* Cabeçalho lançamento */}
        <div className="cp-meta">
          <select value={forma} onChange={e=>setForma(e.target.value)}>
            {FORMAS.map(f => <option key={f} value={f}>{f}</option>)}
          </select>
          <input type="date" value={data} onChange={e=>setData(e.target.value)} />
        </div>

        {/* Item */}
        <div className="cp-item">
          <select
            value={plano}
            onChange={e=>setPlano(e.target.value)}
          >
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

        {/* Lista */}
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
          Total previsto: <b>-{fmtBRL(total)}</b>
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
          Conta: EXTRATO BANCARIO • Status: PREVISTO • Valor gravado como SAÍDA (negativo)
        </div>
      </div>

      {/* VOLTAR + FOOTER (somem quando embutido) */}
      <button className="btn-voltar-foot" onClick={() => setTela?.("CtsReceber")}>◀ Menu Financeiro</button>
      <footer className="erp-footer">
        <div className="erp-footer-track">• Pagamentos •</div>
      </footer>
    </div>
  );
                     }

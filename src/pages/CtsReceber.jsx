// src/pages/CtsReceberAvulso.jsx
// AVULSOS => nascem REALIZADOS em CAIXA DIARIO
import React, { useMemo, useState } from "react";
import "../util/CtsReceber.css";
import { gravarAvulsoCaixa } from "../util/financeiro_store";

const fmtBRL = (v) =>
  (Number(v || 0)).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const CIDADE_FIXA = "Gravatá";
const PLANO_FIXO  = "0202001 – Receita de Varejo – Venda Direta";
const FORMAS = ["PIX", "Especie", "Cartao", "Link", "PDVDireto"];
const PRODUTOS_VAREJO = [
  "Brw 7x7","Brw 6x6","Escondidinho","Pizza brownie","Kit especialidades","Kit romance",
  "Copo gourmet tradicional","Copo gourmet premium","Bombom de morangos","Bombrownie",
  "Naked","Mini naked","Mega naked","Café especial","Festa na bandeja",
  "Café kids especial","Café linha especial adulto","Café linha especial kids",
  "Brw pocket 5x5","Brw pocket 6x6",
];

export default function CtsReceberAvulso({ setTela }) {
  const [pdv] = useState("VAREJO");
  const [forma, setForma] = useState("PIX");
  const [data, setData] = useState(() => new Date().toISOString().slice(0, 10));

  const [produto, setProduto] = useState("");
  const [quantidade, setQuantidade] = useState(1);
  const [valorUnit, setValorUnit] = useState("");

  const [linhas, setLinhas] = useState([]);
  const totalQtd = useMemo(() => linhas.reduce((s, l) => s + l.qtd, 0), [linhas]);
  const totalVlr = useMemo(() => linhas.reduce((s, l) => s + l.total, 0), [linhas]);

  const [salvando, setSalvando] = useState(false);
  const [okMsg, setOkMsg] = useState("");

  function addLinha() {
    setOkMsg("");
    const qtd = Number(quantidade || 0);
    const vlu = Number(valorUnit || 0);
    if (!produto || qtd <= 0 || vlu <= 0) {
      alert("Selecione Produto e informe Quantidade (>0) e Valor unitário (>0).");
      return;
    }
    setLinhas(prev => [...prev, { produto, qtd, vlu, total: qtd * vlu }]);
    setProduto(""); setQuantidade(1); setValorUnit("");
  }
  function removerLinha(idx) { setLinhas(prev => prev.filter((_, i) => i !== idx)); }

  async function salvarTudo() {
    setOkMsg("");
    if (!linhas.length) { alert("Adicione pelo menos 1 item."); return; }

    setSalvando(true);
    try {
      for (const l of linhas) {
        await gravarAvulsoCaixa({
          cidade: CIDADE_FIXA,
          pdv,
          produto: l.produto,
          quantidade: l.qtd,
          canal: "varejo",
          planoContas: PLANO_FIXO,
          formaPagamento: forma,
          situacao: "Realizado",
          dataLancamento: new Date(data),
          dataPrevista: new Date(data),
          valorUnit: l.vlu,
        });
      }
      setOkMsg(`Salvo ${linhas.length} item(ns) • Qtd: ${totalQtd} • Total: ${fmtBRL(totalVlr)} (CAIXA DIARIO).`);
      setLinhas([]);
    } catch (e) {
      alert("Erro ao salvar: " + (e?.message || e));
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="ctsreceber-main">
      {/* HEADER padrão aprovado */}
      <header className="erp-header">
        <div className="erp-header__inner">
          <div className="erp-header__logo">
            <img src="/LogomarcaDDnt2025Vazado.png" alt="Dudunitê" />
          </div>
          <div className="erp-header__title">ERP DUDUNITÊ<br/>Financeiro</div>
        </div>
      </header>

      {/* Título local */}
      <div className="alisab-header">
        <h2 className="alisab-title">Pedidos Avulsos (Realizado • CAIXA DIARIO)</h2>
      </div>

      {/* CARD central (segue o padrão visual de CtsReceber/CtsPagar) */}
      <div className="ctsreceber-card">
        <h2>Pedidos Avulsos (Realizado • CAIXA DIARIO)</h2>

        <div className="linha-meta">
          <input className="input-ro" readOnly value={`${pdv} — ${CIDADE_FIXA}`} onChange={()=>{}} />
          <select value={forma} onChange={e=>setForma(e.target.value)}>
            {FORMAS.map(f => <option key={f} value={f}>{f}</option>)}
          </select>
          <input type="date" value={data} onChange={e=>setData(e.target.value)} />
        </div>

        <div className="linha-itens">
          <select value={produto} onChange={e=>setProduto(e.target.value)}>
            <option value="">Produto</option>
            {PRODUTOS_VAREJO.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
          <input type="number" min={1} placeholder="Qtd" value={quantidade} onChange={e=>setQuantidade(e.target.value)} />
          <input type="number" step="0.01" placeholder="Vlr unitário" value={valorUnit} onChange={e=>setValorUnit(e.target.value)} />
          <button className="btn-add" onClick={addLinha}>Adicionar</button>
        </div>

        <ul className="linhas-list">
          {linhas.map((l, i) => (
            <li key={i}>
              <div><b>{l.produto}</b> — {l.qtd} × {fmtBRL(l.vlu)} = <b>{fmtBRL(l.total)}</b></div>
              <button className="btn-x" onClick={()=>removerLinha(i)}>✕</button>
            </li>
          ))}
        </ul>

        <div className="cts-totais">Total do dia: {fmtBRL(totalVlr)} • Qtd: {totalQtd}</div>

        <div className="acoes">
          <button className="btn-salvar" onClick={salvarTudo} disabled={salvando}>
            {salvando ? "Salvando..." : "Salvar"}
          </button>
          <button className="btn-cancelar" onClick={()=>{
            setProduto(""); setQuantidade(1); setValorUnit(""); setLinhas([]); setOkMsg("");
          }}>
            Limpar
          </button>
        </div>

        {okMsg && <div style={{ marginTop: 8, color: "green", fontWeight: 800 }}>{okMsg}</div>}

        <div style={{ marginTop: 8, color: "#7b3c21", fontWeight: 700 }}>
          Conta: CAIXA DIARIO • Status: REALIZADO
        </div>
      </div>

      {/* VOLTAR + FOOTER no padrão */}
      <button className="btn-voltar-foot" onClick={() => setTela?.("CtsReceber")}>◀ Menu Financeiro</button>
      <footer className="erp-footer">
        <div className="erp-footer-track">
          • Recebimento (Avulsos) •
        </div>
      </footer>
    </div>
  );
            }

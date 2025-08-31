// AVULSOS => nascem REALIZADOS em CAIXA DIARIO
import React, { useMemo, useState } from "react";
import "../util/CtsReceber.css";
// ⬇️ troquei o import: sai cr_dataStub, entra financeiro_store
import { gravarAvulsoCaixa } from "../util/financeiro_store";

const fmtBRL = (v) =>
  (Number(v || 0)).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

// Cidade fixa e Plano de Contas fixo (sem select)
const CIDADE_FIXA = "Gravatá";
const PLANO_FIXO  = "0202001 – Receita de Varejo – Venda Direta";

// Formas de pagamento (igual LanPed)
const FORMAS = ["PIX", "Especie", "Cartao", "Link", "PDVDireto"];

// Produtos de varejo (lista fornecida)
const PRODUTOS_VAREJO = [
  "Brw 7x7","Brw 6x6","Escondidinho","Pizza brownie","Kit especialidades","Kit romance",
  "Copo gourmet tradicional","Copo gourmet premium","Bombom de morangos","Bombrownie",
  "Naked","Mini naked","Mega naked","Café especial","Festa na bandeja","Café kids especial",
  "Café linha especial adulto","Café linha especial kids","Brw pocket 5x5","Brw pocket 6x6",
];

export default function CtsReceberAvulso() {
  // Meta do lançamento
  const [pdv, setPdv] = useState("VAREJO");
  const [forma, setForma] = useState("PIX");
  const [data, setData] = useState(() => new Date().toISOString().slice(0, 10));

  // Linha de itens
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
    const vlu = Number(String(valorUnit || 0).replace(",", "."));
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
      // grava CADA ITEM como uma linha do CAIXA DIARIO
      for (const l of linhas) {
        await gravarAvulsoCaixa({
          data,                                              // YYYY-MM-DD
          descricao: `${pdv} • ${CIDADE_FIXA} • ${l.produto} x${l.qtd}`,
          forma,                                             // PIX / Espécie / etc
          valor: Number(l.total || l.qtd * l.vlu || 0),
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
    <div className="ctsreceber-card">
      <h2>Pedidos Avulsos (Realizado • CAIXA DIARIO)</h2>

      {/* Meta do dia: PDV, Forma e Data (cidade é fixa) */}
      <div className="linha-meta">
        <input className="input-ro" readOnly value={`${pdv} — ${CIDADE_FIXA}`} onChange={()=>{}} />
        <select value={forma} onChange={e=>setForma(e.target.value)}>
          {FORMAS.map(f => <option key={f} value={f}>{f}</option>)}
        </select>
        <input type="date" value={data} onChange={e=>setData(e.target.value)} />
      </div>

      {/* Itens do dia: Produto, Qtd, Valor Unit, Adicionar */}
      <div className="linha-itens">
        <select value={produto} onChange={e=>setProduto(e.target.value)}>
          <option value="">Produto</option>
          {PRODUTOS_VAREJO.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        <input type="number" min={1} placeholder="Qtd" value={quantidade} onChange={e=>setQuantidade(e.target.value)} />
        <input type="number" step="0.01" placeholder="Vlr unitário" value={valorUnit} onChange={e=>setValorUnit(e.target.value)} />
        <button className="btn-add" onClick={addLinha}>Adicionar</button>
      </div>

      {/* Lista + totais */}
      <ul className="linhas-list">
        {linhas.map((l, i) => (
          <li key={i}>
            <div><b>{l.produto}</b> — {l.qtd} × {fmtBRL(l.vlu)} = <b>{fmtBRL(l.total)}</b></div>
            <button className="btn-x" onClick={()=>removerLinha(i)}>✕</button>
          </li>
        ))}
      </ul>

      <div className="cts-totais">Total do dia: {fmtBRL(totalVlr)} • Qtd: {totalQtd}</div>

      {/* Ações */}
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
  );
}

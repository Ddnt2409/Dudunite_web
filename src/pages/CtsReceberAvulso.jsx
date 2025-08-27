import React, { useEffect, useMemo, useState } from "react";
import "../util/CtsReceber.css";
import { lancamentoAvulso } from "../util/cr_dataStub";

const fmtBRL = (v) =>
  (Number(v || 0)).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default function CtsReceberAvulso({ planoContas = [] }) {
  const [cidade, setCidade] = useState("Gravatá");
  const [pdv, setPdv] = useState("VAREJO");
  const [data, setData] = useState(() => new Date().toISOString().slice(0, 10));

  const firstPlano = useMemo(
    () => (planoContas?.[0] ? (planoContas[0].codigo || planoContas[0].id) : ""),
    [planoContas]
  );
  const [plano, setPlano] = useState(firstPlano);
  useEffect(() => { if (!plano && firstPlano) setPlano(firstPlano); }, [firstPlano]);

  const [produto, setProduto] = useState("");
  const [quantidade, setQuantidade] = useState(1);
  const [valorUnit, setValorUnit] = useState("");

  const [linhas, setLinhas] = useState([]);
  const totalQtd = linhas.reduce((s, l) => s + l.qtd, 0);
  const totalVlr = linhas.reduce((s, l) => s + l.total, 0);

  const [salvando, setSalvando] = useState(false);
  const [okMsg, setOkMsg] = useState("");

  function addLinha() {
    setOkMsg("");
    const qtd = Number(quantidade || 0);
    const vlu = Number(valorUnit || 0);
    if (!produto || qtd <= 0 || vlu <= 0) {
      alert("Preencha Produto, Quantidade (>0) e Valor unitário (>0).");
      return;
    }
    setLinhas((prev) => [...prev, { produto, qtd, vlu, total: qtd * vlu }]);
    setProduto(""); setQuantidade(1); setValorUnit("");
  }
  function removerLinha(idx) { setLinhas(prev => prev.filter((_, i) => i !== idx)); }

  async function salvarTudo() {
    setOkMsg("");
    if (!plano) { alert("Selecione o Plano de Contas."); return; }
    if (!linhas.length) { alert("Adicione pelo menos 1 item."); return; }
    setSalvando(true);
    try {
      for (const l of linhas) {
        await lancamentoAvulso({
          cidade, pdv,
          produto: l.produto,
          quantidade: l.qtd,
          canal: "varejo",
          planoContas: plano,
          formaPagamento: "PIX",
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
    } finally { setSalvando(false); }
  }

  return (
    <div className="ctsreceber-card">
      <h2>Pedidos Avulsos (Realizado • CAIXA DIARIO)</h2>

      {/* Cidade / Cliente / Data */}
      <div className="linha-add" style={{ marginBottom: 10 }}>
        <input placeholder="Cidade" value={cidade} onChange={e=>setCidade(e.target.value)} />
        <input className="qtd" placeholder="Cliente/PDV" value={pdv} onChange={e=>setPdv(e.target.value)} />
        <input className="qtd" type="date" value={data} onChange={e=>setData(e.target.value)} />
      </div>

      {/* Plano de Contas */}
      <div className="linha-add" style={{ marginBottom: 10 }}>
        <select value={plano} onChange={e=>setPlano(e.target.value)}>
          {planoContas.length === 0 && <option value="">-- selecione plano de contas --</option>}
          {planoContas.map(pc => (
            <option key={pc.id} value={pc.codigo || pc.id}>
              {(pc.codigo || pc.id) + " – " + (pc.descricao || "")}
            </option>
          ))}
        </select>
        <div className="qtd" />
        <div />
      </div>

      {/* Itens do dia */}
      <div className="linha-add">
        <input placeholder="Produto" value={produto} onChange={e=>setProduto(e.target.value)} />
        <input className="qtd" type="number" min={1} placeholder="Qtd" value={quantidade} onChange={e=>setQuantidade(e.target.value)} />
        <div style={{ display: "flex", gap: 8 }}>
          <input className="qtd" type="number" step="0.01" placeholder="Vlr unitário" value={valorUnit} onChange={e=>setValorUnit(e.target.value)} style={{ marginRight: 8 }} />
          <button className="btn-add" onClick={addLinha}>Adicionar</button>
        </div>
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
  );
}

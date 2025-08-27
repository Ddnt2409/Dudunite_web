// Lançamento AVULSO => nasce REALIZADO em CAIXA DIARIO
import React, { useEffect, useMemo, useState } from "react";
import { lancamentoAvulso } from "../util/cr_dataStub";

const fmtBRL = (v) =>
  (Number(v || 0)).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default function CtsReceberAvulso({ planoContas = [] }) {
  // Defaults solicitados
  const [cidade, setCidade] = useState("Gravatá");
  const [pdv, setPdv] = useState("VAREJO");
  const [data, setData] = useState(() => new Date().toISOString().slice(0, 10));

  // Plano de contas: já vem selecionado com o 1º item do select
  const firstPlano = useMemo(
    () => (planoContas?.[0] ? (planoContas[0].codigo || planoContas[0].id) : ""),
    [planoContas]
  );
  const [plano, setPlano] = useState(firstPlano);
  useEffect(() => { if (!plano && firstPlano) setPlano(firstPlano); }, [firstPlano]);

  // Linha de edição (para adicionar)
  const [produto, setProduto] = useState("");
  const [quantidade, setQuantidade] = useState(1);
  const [valorUnit, setValorUnit] = useState("");

  // Linhas acumuladas do dia
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
      alert("Preencha Produto, Quantidade (>0) e Valor unitário (>0).");
      return;
    }
    setLinhas((prev) => [...prev, { produto, qtd, vlu, total: qtd * vlu }]);
    // limpa campos de linha, mantém plano/cidade/pdv
    setProduto("");
    setQuantidade(1);
    setValorUnit("");
  }

  function removerLinha(idx) {
    setLinhas((prev) => prev.filter((_, i) => i !== idx));
  }

  async function salvarTudo() {
    setOkMsg("");
    if (!plano) { alert("Selecione o Plano de Contas."); return; }
    if (!linhas.length) { alert("Adicione pelo menos 1 item."); return; }

    setSalvando(true);
    try {
      for (const l of linhas) {
        // Cada item vira um lançamento REALIZADO em CAIXA DIARIO na data informada
        await lancamentoAvulso({
          cidade,
          pdv,                         // "VAREJO"
          produto: l.produto,
          quantidade: l.qtd,
          canal: "varejo",
          planoContas: plano,
          formaPagamento: "PIX",       // default (pode trocar depois)
          situacao: "Realizado",
          dataLancamento: new Date(data),
          dataPrevista: new Date(data), // aparece no extrato geral
          valorUnit: l.vlu
        });
      }
      setOkMsg(
        `Salvo ${linhas.length} item(ns) • Qtd: ${totalQtd} • Total: ${fmtBRL(totalVlr)} (CAIXA DIARIO).`
      );
      setLinhas([]);
    } catch (e) {
      alert("Erro ao salvar: " + (e?.message || e));
    } finally {
      setSalvando(false);
    }
  }

  return (
    // Caixa flutuante central no padrão AliSab.css
    <div className="postit ativo">
      <div className="pin" />
      <div className="postit-header">
        <div className="pdv">Pedidos Avulsos (Realizado • CAIXA DIARIO)</div>
        <div className="resumo">
          <span>Data: <b>{data}</b></span>
          <span>Cliente: <b>{pdv}</b> • Cidade: <b>{cidade}</b></span>
          <span>Plano de Contas: <b>{plano || "—"}</b></span>
          <span>Total do dia: <b>{fmtBRL(totalVlr)}</b> • Qtd: <b>{totalQtd}</b></span>
        </div>
      </div>

      <div className="postit-body">
        {/* Linha 0: meta do lançamento */}
        <div className="linha-add" style={{ marginBottom: 10 }}>
          <input placeholder="Cidade" value={cidade} onChange={e=>setCidade(e.target.value)} />
          <input className="qtd" placeholder="Cliente/PDV" value={pdv} onChange={e=>setPdv(e.target.value)} />
          <input className="qtd" type="date" value={data} onChange={e=>setData(e.target.value)} />
        </div>

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

        {/* Linha 1: adicionar itens (mesma lógica do LanPed) */}
        <div className="linha-add">
          <input
            placeholder="Produto"
            value={produto}
            onChange={e=>setProduto(e.target.value)}
          />
          <input
            className="qtd"
            type="number"
            min={1}
            placeholder="Qtd"
            value={quantidade}
            onChange={e=>setQuantidade(e.target.value)}
          />
          <div style={{ display: "flex", gap: 8 }}>
            <input
              className="qtd"
              type="number"
              step="0.01"
              placeholder="Vlr unitário"
              value={valorUnit}
              onChange={e=>setValorUnit(e.target.value)}
              style={{ marginRight: 8 }}
            />
            <button className="btn-add" onClick={addLinha}>Adicionar</button>
          </div>
        </div>

        {/* Lista das linhas adicionadas */}
        <ul className="linhas-list">
          {linhas.map((l, i) => (
            <li key={i}>
              <div>
                <b>{l.produto}</b> — {l.qtd} × {fmtBRL(l.vlu)} = <b>{fmtBRL(l.total)}</b>
              </div>
              <button className="btn-x" onClick={()=>removerLinha(i)}>✕</button>
            </li>
          ))}
        </ul>

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

        {okMsg && (
          <div style={{ marginTop: 8, color: "green", fontWeight: 800 }}>{okMsg}</div>
        )}

        <div style={{ marginTop: 8, color: "#7b3c21", fontWeight: 700 }}>
          Conta: CAIXA DIARIO • Status: REALIZADO
        </div>
      </div>
    </div>
  );
}

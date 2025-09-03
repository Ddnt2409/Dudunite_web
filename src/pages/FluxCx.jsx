// src/pages/FluxCx.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import ERPHeader from "./ERPHeader";
import ERPFooter from "./ERPFooter";
import "../util/FluxCx.css";

import {
  // Saldos
  listenSaldosIniciais, salvarSaldosIniciais,
  // Caixa Diário
  listenCaixaDiario, listenCaixaDiarioRange, fecharCaixaParcial,
  // Banco
  listenExtratoBancario, listenExtratoBancarioRange,
  // Backfill de PEDIDOS -> financeiro_fluxo
  backfillPrevistosDoMes,
  // Edições
  updateFluxoLancamento, deleteFluxoLancamento,   // <— usar estes
} from "../util/financeiro_store";

// helpers visuais
const money = (n)=>`R$ ${Number(n||0).toFixed(2).replace(".", ",")}`;
const dtBR   = (v)=> (v && typeof v === "string")
  ? v.split("-").reverse().join("/")
  : new Date(v || Date.now()).toLocaleDateString("pt-BR");

export default function FluxCx({ setTela }) {
  // ===== Seleção =====
  const hoje = new Date();
  const [modo, setModo] = useState("mes");          // "mes" | "periodo"
  const [ano, setAno]   = useState(hoje.getFullYear());
  const [mes, setMes]   = useState(hoje.getMonth()+1);
  const meses = ["janeiro","fevereiro","março","abril","maio","junho","julho","agosto","setembro","outubro","novembro","dezembro"];

  // período livre
  const [de,  setDe ]   = useState(new Date(ano, mes-1, 1).toISOString().slice(0,10));
  const [ate, setAte]   = useState(new Date(ano, mes,   1).toISOString().slice(0,10));

  // ===== Saldos iniciais =====
  const [saldoIniCx, setSaldoIniCx] = useState(0);
  const [saldoIniBk, setSaldoIniBk] = useState(0);

  // ===== Caixa Diário (topo) =====
  const [cxLinhas, setCxLinhas] = useState([]);
  const cxTotal = useMemo(()=> cxLinhas.reduce((s,l)=>s+Number(l.valor||0),0), [cxLinhas]);
  const cxSaldoFinal = useMemo(()=> Number(saldoIniCx||0) + Number(cxTotal||0), [saldoIniCx, cxTotal]);

  // Saldo acumulado por linha (estilo extrato)
  const cxComSaldo = useMemo(()=>{
    let acc = Number(saldoIniCx || 0);
    return cxLinhas.map(l => {
      acc += Number(l.valor || 0);
      return { ...l, saldo: acc };
    });
  }, [cxLinhas, saldoIniCx]);

  // ===== Banco (baixo) =====
  const [bkLinhas, setBkLinhas] = useState([]);

  // Agrupamento por dia + saldos diários
  const bancoAgrupado = useMemo(()=>{
    // ordena por data asc
    const sorted = [...bkLinhas].sort((a,b)=> new Date(a.data) - new Date(b.data));
    const grupos = new Map(); // key: yyyy-mm-dd => { data, itens:[], saldoInicial, saldoFinal }
    let saldoAcumulado = Number(saldoIniBk || 0);

    // para cada dia, cria grupo e atualiza saldos
    sorted.forEach((l) => {
      const key = (typeof l.data === "string") ? l.data : new Date(l.data).toISOString().slice(0,10);
      if (!grupos.has(key)) grupos.set(key, { data:key, itens:[], saldoInicial: saldoAcumulado, saldoFinal: saldoAcumulado });

      const g = grupos.get(key);
      g.itens.push(l);

      // ajuste do saldo acumulado: Realizado entra somando, Previsto entra subtraindo do comparativo
      // mas para o “saldo do período” a regra é: realizados afetam o saldo; previstos são visão separada.
      // Aqui, por simplicidade, o saldo do dia considera ORIGEM:
      //   - Realizado: afeta saldo (entrada(+) / saída(-) já está no valor)
      //   - Previsto : NÃO mexe no saldo do dia (apenas aparece na lista)
      const isReal = String(l.origem || "").toLowerCase() === "realizado";
      if (isReal) {
        saldoAcumulado += Number(l.valor || 0);
        g.saldoFinal = saldoAcumulado;
      }
    });

    // garante “saldoFinal” mesmo quando só houver previstos
    grupos.forEach((g) => {
      if (g.itens.every(it => String(it.origem||"").toLowerCase() !== "realizado")) {
        g.saldoFinal = g.saldoInicial; // nada realizado naquele dia
      }
    });

    // métricas globais
    const totPrev = sorted.filter(l=>String(l.origem||"").toLowerCase()==="previsto")
      .reduce((s,l)=>s+Number(l.valor||0),0);
    const totBan  = sorted.filter(l=>String(l.origem||"").toLowerCase()==="realizado")
      .reduce((s,l)=>s+Number(l.valor||0),0);

    return {
      dias: Array.from(grupos.values()),
      totPrev,
      totBan,
      saldoBancoVsPrev: Number(totBan||0) - Number(totPrev||0),
      saldoFinalPeriodo: saldoAcumulado,
    };
  }, [bkLinhas, saldoIniBk]);

  // ===== Fechamento =====
  const [diaFechar, setDiaFechar] = useState(new Date().toISOString().slice(0,10));
  const [dataBanco, setDataBanco] = useState(new Date().toISOString().slice(0,10));
  const [valorFechar, setValorFechar] = useState("");

  // unsub refs
  const unsubCx = useRef(null);
  const unsubBk = useRef(null);
  const unsubSd = useRef(null);

  // ouvir saldos iniciais do mês selecionado
  useEffect(()=>{
    unsubSd.current && unsubSd.current();
    unsubSd.current = listenSaldosIniciais(ano, mes, ({caixa,banco})=>{
      setSaldoIniCx(Number(caixa||0));
      setSaldoIniBk(Number(banco||0));
    });
    return ()=> { unsubSd.current && unsubSd.current(); }
  },[ano, mes]);

  // (re)assinar extratos conforme seleção
  useEffect(()=>{
    assinarListas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[modo, ano, mes, de, ate]);

  function assinarListas(){
    unsubCx.current && unsubCx.current();
    unsubBk.current && unsubBk.current();

    if (modo === "mes") {
      unsubCx.current = listenCaixaDiario(ano, mes, ({linhas})=>setCxLinhas(linhas));
      unsubBk.current = listenExtratoBancario(ano, mes, ({linhas})=>{
        setBkLinhas(linhas.map(l=>({ ...l })));
      });
    } else {
      const ini = new Date(de);
      const fim = new Date(ate);
      unsubCx.current = listenCaixaDiarioRange(ini, fim, ({linhas})=>setCxLinhas(linhas));
      unsubBk.current = listenExtratoBancarioRange(ini, fim, ({linhas})=>{
        setBkLinhas(linhas.map(l=>({ ...l })));
      });
    }
  }

  async function onSalvarSaldos(){
    await salvarSaldosIniciais(ano, mes, { caixa: Number(saldoIniCx||0), banco: Number(saldoIniBk||0) });
    alert("Saldos iniciais salvos.");
  }
  async function onAtualizar(){
    if (modo==="mes") {
      try { await backfillPrevistosDoMes(ano, mes); } catch {}
    }
    assinarListas();
  }

  async function onFecharCaixa(){
    const v = valorFechar === "" ? null : Number(valorFechar);
    try {
      const res = await fecharCaixaParcial({
        diaOrigem: new Date(diaFechar),
        dataBanco: new Date(dataBanco),
        valorParcial: v,
      });
      if (!res?.criado) { alert("Nenhum lançamento aberto nesse dia ou valor a fechar é 0."); return; }
      alert(`Fechamento enviado ao banco: ${money(res.total)}.`);
      setValorFechar("");
    } catch(e){ alert("Erro ao fechar caixa: "+(e?.message||e)); }
  }

  // ===== Ações por linha do EXTRATO =====
  const handleToggleRealizado = async (l, checked) => {
    try {
      // Troca origem Previsto/Realizado. Ajuste se seu store usar outro campo!
      await updateFluxoLancamento(l.id, { origem: checked ? "Realizado" : "Previsto" });
    } catch (e) {
      alert("Falha ao atualizar: " + (e?.message || e));
    }
  };

  const handleExcluir = async (l) => {
    const ok = window.confirm("Confirma a exclusão deste lançamento?");
    if (!ok) return;
    try {
      await deleteFluxoLancamento(l.id);     // <- ajuste o nome se necessário
    } catch (e) {
      alert("Falha ao excluir: " + (e?.message || e));
    }
  };

  const handleAlterar = (l) => {
    // Abre a tela correta conforme o tipo
    // Para simplificar: se vier de PEDIDO (campo tipo) é “Receber”, senão “Pagar”.
    // Ajuste este roteamento conforme seu app:
    if (l.tipo === "PEDIDO") {
      setTela?.({ name: "CtsReceber", editar: l }); // sua Home/Router deve suportar objeto
    } else {
      setTela?.({ name: "CtsPagar", editar: l });
    }
  };

  return (
    <>
      <ERPHeader title="ERP DUDUNITÊ — Fluxo de Caixa" />

      {/* Scroll vertical garantido */}
      <main className="fluxcx-main" style={{ padding: 12, maxHeight: "calc(100vh - 140px)", overflowY: "auto" }}>
        {/* Seleção */}
        <div className="extrato-card" style={{ marginBottom: 10 }}>
          <div className="extrato-actions" style={{ gap: 8, flexWrap:"wrap" }}>
            <label><input type="radio" checked={modo==="mes"} onChange={()=>setModo("mes")} /> Mês inteiro</label>
            <select disabled={modo!=="mes"} value={mes} onChange={e=>setMes(Number(e.target.value))}>
              {meses.map((m,i)=><option key={m} value={i+1}>{m}</option>)}
            </select>
            <input disabled={modo!=="mes"} type="number" value={ano} onChange={e=>setAno(Number(e.target.value))} style={{ width:80 }} />

            <label style={{ marginLeft:12 }}>
              <input type="radio" checked={modo==="periodo"} onChange={()=>setModo("periodo")} /> Período (De/Até)
            </label>
            <input type="date" disabled={modo!=="periodo"} value={de}  onChange={e=>setDe(e.target.value)} />
            <input type="date" disabled={modo!=="periodo"} value={ate} onChange={e=>setAte(e.target.value)} />

            <span style={{marginLeft:12}}>Saldo inicial Caixa: </span>
            <input type="number" value={saldoIniCx} onChange={e=>setSaldoIniCx(e.target.value)} style={{ width:90 }} />
            <span style={{marginLeft:8}}>Saldo inicial Banco: </span>
            <input type="number" value={saldoIniBk} onChange={e=>setSaldoIniBk(e.target.value)} style={{ width:90 }} />

            <button onClick={onSalvarSaldos}>Salvar</button>
            <button onClick={onAtualizar}>Atualizar</button>
          </div>
        </div>

        {/* ===== TOPO: CAIXA DIÁRIO ===== */}
        <section className="extrato-card">
          <div className="fluxcx-header" style={{ marginBottom:6 }}>
            <h2 className="fluxcx-title" style={{ margin:0 }}>
              Caixa Diário — {modo==="mes" ? `${meses[mes-1]} de ${ano}` : `${dtBR(de)} → ${dtBR(ate)}`}
            </h2>
            <div style={{ marginLeft:"auto", display:"flex", gap:12 }}>
              <b>Saldo inicial do período:</b> {money(saldoIniCx)}
              <b>Total do período:</b> {money(cxTotal)}
              <b>Saldo final:</b> {money(cxSaldoFinal)}
            </div>
          </div>

          {/* Fechamento */}
          <div style={{ display:"flex", gap:8, flexWrap:"wrap", alignItems:"center", marginBottom:8 }}>
            <label>Dia a fechar: <input type="date" value={diaFechar} onChange={e=>setDiaFechar(e.target.value)} /></label>
            <label>Data no banco: <input type="date" value={dataBanco} onChange={e=>setDataBanco(e.target.value)} /></label>
            <label>Valor a fechar: <input type="number" step="0.01" value={valorFechar} onChange={e=>setValorFechar(e.target.value)} style={{ width:120 }} /></label>
            <button onClick={onFecharCaixa}>Fechar caixa do dia → Banco</button>
          </div>

          <div style={{ overflowX:"auto" }}>
            <table className="extrato">
              <thead>
                <tr>
                  <th style={{minWidth:90}}>Data</th>
                  <th>Descrição</th>
                  <th style={{minWidth:110}}>Forma</th>
                  <th style={{minWidth:100}}>Status</th>
                  <th style={{minWidth:120, textAlign:"right"}}>Valor</th>
                  <th style={{minWidth:120, textAlign:"right"}}>Saldo</th>
                </tr>
              </thead>
              <tbody>
                {cxComSaldo.length===0 && (
                  <tr><td colSpan={6} style={{ padding:10, color:"#7a5a2a" }}>Nenhum lançamento no período.</td></tr>
                )}
                {cxComSaldo.map(l=>(
                  <tr key={l.id}>
                    <td>{dtBR(l.data)}</td>
                    <td>{l.descricao}</td>
                    <td>{l.forma || "-"}</td>
                    <td>
                      {l.fechado
                        ? <span className="chip chip-real">Fechado</span>
                        : <span className="chip chip-prev">Aberto</span>}
                    </td>
                    <td style={{ textAlign:"right", fontWeight:800 }}>{money(l.valor)}</td>
                    <td style={{ textAlign:"right", fontWeight:800 }}>{money(l.saldo)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* ===== BAIXO: EXTRATO BANCÁRIO AGRUPADO ===== */}
        <section className="extrato-card">
          <div className="fluxcx-header" style={{ marginBottom:6 }}>
            <h2 className="fluxcx-title" style={{ margin:0 }}>
              Extrato Bancário — {modo==="mes" ? `${meses[mes-1]} de ${ano}` : `${dtBR(de)} → ${dtBR(ate)}`}
            </h2>
            <div style={{ marginLeft:"auto", display:"flex", gap:14, alignItems:"center" }}>
              <span>Previstos: <b>{money(bancoAgrupado.totPrev)}</b></span>
              <span>Realizados (Banco): <b>{money(bancoAgrupado.totBan)}</b></span>
              <span>Saldo (Real − Prev): <b>{money(bancoAgrupado.saldoBancoVsPrev)}</b></span>
              <span>Saldo final do período: <b>{money(bancoAgrupado.saldoFinalPeriodo)}</b></span>
            </div>
          </div>

          {/* Por dia */}
          {bancoAgrupado.dias.length === 0 && (
            <div style={{ padding:10, color:"#7a5a2a" }}>Sem lançamentos para estas datas.</div>
          )}

          {bancoAgrupado.dias.map((dia) => (
            <div key={dia.data} style={{ marginBottom:14 }}>
              <div style={{ fontWeight:700, margin:"6px 0" }}>
                {dtBR(dia.data)} — Saldo inicial do dia: {money(dia.saldoInicial)}
              </div>
              <div style={{ overflowX:"auto" }}>
                <table className="extrato">
                  <thead>
                    <tr>
                      <th style={{minWidth:110}}>Tipo</th>
                      <th>Descrição</th>
                      <th style={{minWidth:160}}>Forma / Realizado</th>
                      <th style={{minWidth:120, textAlign:"right"}}>Valor</th>
                      <th style={{minWidth:160}}>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dia.itens.map((l,i)=>(
                      <tr key={l.id || `${dia.data}-${i}`}>
                        <td>
                          <span className={`chip ${String(l.origem||"").toLowerCase()==="realizado" ? "chip-real" : "chip-prev"}`}>
                            {l.origem || "-"}
                          </span>
                        </td>
                        <td>{l.descricao || "-"}</td>
                        <td>
                          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                            <span>{l.forma || "-"}</span>
                            <label style={{ display:"inline-flex", alignItems:"center", gap:6 }}>
                              <input
                                type="checkbox"
                                checked={String(l.origem||"").toLowerCase()==="realizado"}
                                onChange={(e)=>handleToggleRealizado(l, e.target.checked)}
                              />
                              Realizado
                            </label>
                          </div>
                        </td>
                        <td style={{ textAlign:"right", fontWeight:800 }}>{money(l.valor)}</td>
                        <td>
                          <div style={{ display:"flex", gap:8, justifyContent:"flex-end" }}>
                            <button className="btn-warning" onClick={()=>handleAlterar(l)}>Alterar</button>
                            <button className="btn-danger" onClick={()=>handleExcluir(l)}>Excluir</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    <tr>
                      <td colSpan={5} style={{ textAlign:"right", fontWeight:800 }}>
                        Saldo final do dia: {money(dia.saldoFinal)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </section>

        <button className="btn-voltar" onClick={()=>setTela?.("HomeERP")}>Voltar</button>
      </main>

      <ERPFooter onBack={()=>setTela?.("HomeERP")} />
    </>
  );
              }

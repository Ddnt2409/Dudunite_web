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
  // Edições / marcações
  marcarRealizado,
  atualizarFluxo,
  excluirFluxo,
} from "../util/financeiro_store";

const money = (n)=>`R$ ${Number(n||0).toFixed(2).replace(".", ",")}`;
const dtBR   = (v)=> (v && typeof v === "string")
  ? v.split("-").reverse().join("/")
  : new Date(v || Date.now()).toLocaleDateString("pt-BR");

function groupByDia(linhas) {
  const map = new Map();
  for (const l of linhas) {
    const arr = map.get(l.data) || [];
    arr.push(l);
    map.set(l.data, arr);
  }
  return Array.from(map.entries()).sort((a,b)=>a[0].localeCompare(b[0]));
}

export default function FluxCx({ setTela }) {
  const hoje = new Date();
  const [modo, setModo] = useState("mes");
  const [ano, setAno]   = useState(hoje.getFullYear());
  const [mes, setMes]   = useState(hoje.getMonth()+1);
  const [de,  setDe ]   = useState(new Date(ano, mes-1, 1).toISOString().slice(0,10));
  const [ate, setAte]   = useState(new Date(ano, mes,   1).toISOString().slice(0,10));
  const meses = ["janeiro","fevereiro","março","abril","maio","junho","julho","agosto","setembro","outubro","novembro","dezembro"];

  const [saldoIniCx, setSaldoIniCx] = useState(0);
  const [saldoIniBk, setSaldoIniBk] = useState(0);

  const [cxLinhas, setCxLinhas] = useState([]);
  const cxTotal = useMemo(()=> cxLinhas.reduce((s,l)=>s+Number(l.valor||0),0), [cxLinhas]);
  const cxSaldoFinal = useMemo(()=> Number(saldoIniCx||0) + Number(cxTotal||0), [saldoIniCx, cxTotal]);

  const cxComSaldo = useMemo(()=>{
    let acc = Number(saldoIniCx || 0);
    return cxLinhas.map(l => {
      acc += Number(l.valor || 0);
      return { ...l, saldo: acc };
    });
  }, [cxLinhas, saldoIniCx]);

  const [bkLinhas, setBkLinhas] = useState([]);
  const totPrev = useMemo(()=> bkLinhas.filter(l=>l.origem==="Previsto").reduce((s,l)=>s+Number(l.valor||0),0), [bkLinhas]);
  const totBan  = useMemo(()=> bkLinhas.filter(l=>l.origem==="Realizado").reduce((s,l)=>s+Number(l.valor||0),0), [bkLinhas]);
  const saldoBancoVsPrev = useMemo(()=> Number(totBan||0) - Number(totPrev||0), [totBan, totPrev]);
  const bkSaldoFinal = useMemo(()=> Number(saldoIniBk||0) + Number(totBan||0) - Number(totPrev||0), [saldoIniBk, totBan, totPrev]);

  const [diaFechar, setDiaFechar] = useState(new Date().toISOString().slice(0,10));
  const [dataBanco, setDataBanco] = useState(new Date().toISOString().slice(0,10));
  const [valorFechar, setValorFechar] = useState("");

  const [workingId, setWorkingId] = useState(null);

  const unsubCx = useRef(null);
  const unsubBk = useRef(null);
  const unsubSd = useRef(null);

  useEffect(()=>{
    unsubSd.current && unsubSd.current();
    unsubSd.current = listenSaldosIniciais(ano, mes, ({caixa,banco})=>{
      setSaldoIniCx(Number(caixa||0));
      setSaldoIniBk(Number(banco||0));
    });
    return ()=> { unsubSd.current && unsubSd.current(); }
  },[ano, mes]);

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

  // === Ações (Banco)
  async function handleToggleRealizado(linha, checked) {
    if (!linha?.id) return;
    try {
      setWorkingId(linha.id);
      if (checked) {
        // >>> NÃO altera o dia: usa a própria data exibida (que é a prevista)
        await marcarRealizado(linha.id, { dataRealizado: linha.data, valor: linha.valor });
      } else {
        // volta para Previsto
        await atualizarFluxo(linha.id, {
          statusFinanceiro: "Previsto",
          dataRealizado: "",
          valorRealizado: 0,
        });
      }
    } catch (e) {
      alert("Não foi possível atualizar o status: " + (e?.message || e));
    } finally {
      setWorkingId(null);
    }
  }

  async function handleExcluir(linha) {
    if (!linha?.id) return;
    const ok = confirm("Confirma a exclusão deste lançamento?");
    if (!ok) return;
    try {
      setWorkingId(linha.id);
      await excluirFluxo(linha.id);
    } catch (e) {
      alert("Erro ao excluir: " + (e?.message || e));
    } finally {
      setWorkingId(null);
    }
  }

  // ===== Render =====
  return (
    <>
      <ERPHeader title="ERP DUDUNITÊ — Fluxo de Caixa" />

      <main className="fluxcx-main" style={{ padding: 12 }}>
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

        {/* ===== BAIXO: EXTRATO BANCÁRIO (agrupado por dia) ===== */}
        <section className="extrato-card">
          <div className="fluxcx-header" style={{ marginBottom:6 }}>
            <h2 className="fluxcx-title" style={{ margin:0 }}>
              Extrato Bancário — {modo==="mes" ? `${meses[mes-1]} de ${ano}` : `${dtBR(de)} → ${dtBR(ate)}`}
            </h2>
            <div style={{ marginLeft:"auto", display:"flex", gap:14, alignItems:"center" }}>
              <span>Previstos: <b>{money(totPrev)}</b></span>
              <span>Realizados (Banco): <b>{money(totBan)}</b></span>
              <span>Saldo (Real − Prev): <b>{money(saldoBancoVsPrev)}</b></span>
              <span>Saldo final do período: <b>{money(bkSaldoFinal)}</b></span>
            </div>
          </div>

          {/* agrupamento com saldo acumulado por dia */}
          {(() => {
            const grupos = groupByDia(bkLinhas);
            let acumulado = Number(saldoIniBk || 0);

            return grupos.map(([dia, itens], gi) => {
              const realizadosDoDia = itens
                .filter(x => x.origem === "Realizado")
                .reduce((s, l) => s + Number(l.valor || 0), 0);

              const saldoInicialDia = acumulado;
              acumulado += realizadosDoDia; // só entradas/saídas reais afetam o saldo
              const saldoFinalDia = acumulado;

              return (
                <div key={dia} style={{ marginBottom: 12 }}>
                  <div style={{ fontWeight:700, padding:"6px 8px", background:"#efe6d6", borderRadius:6, border:"1px solid #e1d3bf" }}>
                    {dtBR(dia)} — <span>Saldo inicial do dia: {money(saldoInicialDia)}</span>
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
                        {itens.map((l) => (
                          <tr key={l.id}>
                            <td>
                              <span className={`chip ${l.origem==="Realizado" ? "chip-real" : "chip-prev"}`}>
                                {l.origem}
                              </span>
                            </td>
                            <td>{l.descricao || "-"}</td>
                            <td>
                              {l.forma || "-"}
                              <label style={{ marginLeft:8, userSelect:"none", cursor:"pointer" }}>
                                <input
                                  type="checkbox"
                                  checked={l.origem === "Realizado"}
                                  disabled={workingId === l.id}
                                  onChange={(e)=>handleToggleRealizado(l, e.target.checked)}
                                  style={{ marginRight:4 }}
                                />
                                Realizado
                              </label>
                            </td>
                            <td style={{ textAlign:"right", fontWeight:800 }}>{money(l.valor)}</td>
                            <td>
                              <button className="btn-acao" disabled>Alterar</button>
                              <button className="btn-acao btn-danger" disabled={workingId===l.id} onClick={()=>handleExcluir(l)}>Excluir</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div style={{ textAlign:"right", fontWeight:700, padding:"6px 8px", background:"#f5efe6", borderRadius:6, border:"1px solid #e1d3bf" }}>
                    Saldo final do dia: {money(saldoFinalDia)}
                  </div>
                </div>
              );
            });
          })()}
        </section>

        <button className="btn-voltar" onClick={()=>setTela?.("HomeERP")}>Voltar</button>
      </main>

      <ERPFooter onBack={()=>setTela?.("HomeERP")} />
    </>
  );
      }

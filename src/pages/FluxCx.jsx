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
} from "../util/financeiro_store";

const money = (n)=>`R$ ${Number(n||0).toFixed(2).replace(".", ",")}`;
const dtBR   = (v)=> (v && typeof v === "string")
  ? v.split("-").reverse().join("/")
  : new Date(v || Date.now()).toLocaleDateString("pt-BR");

function ymToRange(ano, mes){
  const ini = new Date(ano, mes-1, 1);
  const fim = new Date(ano, mes,   1);
  return { ini, fim };
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

  const [bkLinhas, setBkLinhas] = useState([]);
  const totPrev = useMemo(()=> bkLinhas.filter(l=>l.origem==="Previsto").reduce((s,l)=>s+Number(l.valor||0),0), [bkLinhas]);
  const totBan  = useMemo(()=> bkLinhas.filter(l=>l.origem==="Realizado").reduce((s,l)=>s+Number(l.valor||0),0), [bkLinhas]);

  const [diaFechar, setDiaFechar]   = useState(new Date().toISOString().slice(0,10));
  const [dataBanco, setDataBanco]   = useState(new Date().toISOString().slice(0,10));
  const [valorFechar, setValorFechar] = useState(0);

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

  // sugere o valor do fechamento = saldo final (>=0)
  useEffect(()=>{
    const saldoFinal = Number(saldoIniCx||0) + Number(cxTotal||0);
    setValorFechar(Math.max(0, Number(saldoFinal.toFixed(2))));
  }, [saldoIniCx, cxTotal]);

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
    try {
      const v = Number(valorFechar || 0);
      if (v <= 0) { alert("Informe um valor > 0 para fechar."); return; }
      const res = await fecharCaixaParcial({
        diaOrigem: new Date(diaFechar),
        dataBanco: new Date(dataBanco),
        valor: v,
      });
      alert(`Fechamento enviado: ${money(res.total)}.`);
    } catch(e){ alert("Erro ao fechar caixa: "+(e?.message||e)); }
  }

  const cxSaldoFinal = Number(saldoIniCx||0) + Number(cxTotal||0);
  const saldoBancoVsPrev = Number(totBan||0) - Number(totPrev||0);
  const bkSaldoFinal = Number(saldoIniBk||0) + Number(totBan||0) - Number(totPrev||0);

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
              Caixa Diário — {meses[mes-1]} de {ano}
            </h2>
            <div style={{ marginLeft:"auto", display:"flex", gap:12 }}>
              <b>Saldo inicial do período:</b> {money(saldoIniCx)}
              <b>Total do período:</b> {money(cxTotal)}
              <b>Saldo final:</b> {money(cxSaldoFinal)}
            </div>
          </div>

          {/* Fechamento (PARCIAL) */}
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
                </tr>
              </thead>
              <tbody>
                {cxLinhas.length===0 && (
                  <tr><td colSpan={5} style={{ padding:10, color:"#7a5a2a" }}>Nenhum lançamento no período.</td></tr>
                )}
                {cxLinhas.map(l=>(
                  <tr key={l.id}>
                    <td>{dtBR(l.data)}</td>
                    <td>{l.descricao}</td>
                    <td>{l.forma || "-"}</td>
                    <td>
                      {Number(l.valor) < 0
                        ? <span className="chip chip-real">Saída</span>
                        : (l.fechado ? <span className="chip chip-real">Fechado</span> : <span className="chip chip-prev">Aberto</span>)
                      }
                    </td>
                    <td style={{ textAlign:"right", fontWeight:800 }}>{money(l.valor)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* ===== BAIXO: EXTRATO BANCÁRIO ===== */}
        <section className="extrato-card">
          <div className="fluxcx-header" style={{ marginBottom:6 }}>
            <h2 className="fluxcx-title" style={{ margin:0 }}>Extrato Bancário — {meses[mes-1]} de {ano}</h2>
            <div style={{ marginLeft:"auto", display:"flex", gap:14, alignItems:"center" }}>
              <span>Previstos: <b>{money(totPrev)}</b></span>
              <span>Realizados (Banco): <b>{money(totBan)}</b></span>
              <span>Saldo (Real − Prev): <b>{money(saldoBancoVsPrev)}</b></span>
              <span>Saldo final do período: <b>{money(bkSaldoFinal)}</b></span>
            </div>
          </div>

          <div style={{ overflowX:"auto" }}>
            <table className="extrato">
              <thead>
                <tr>
                  <th style={{minWidth:90}}>Data</th>
                  <th style={{minWidth:110}}>Tipo</th>
                  <th>Descrição</th>
                  <th style={{minWidth:110}}>Forma</th>
                  <th style={{minWidth:120, textAlign:"right"}}>Valor</th>
                </tr>
              </thead>
              <tbody>
                {bkLinhas.length===0 && (
                  <tr><td colSpan={5} style={{ padding:10, color:"#7a5a2a" }}>Sem lançamentos para estas datas.</td></tr>
                )}
                {bkLinhas.map((l,i)=>(
                  <tr key={l.id || i}>
                    <td>{dtBR(l.data)}</td>
                    <td>
                      <span className={`chip ${l.origem==="Realizado" ? "chip-real" : "chip-prev"}`}>
                        {l.origem}
                      </span>
                    </td>
                    <td>{l.descricao || "-"}</td>
                    <td>{l.forma || "-"}</td>
                    <td style={{ textAlign:"right", fontWeight:800 }}>{money(l.valor)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <button className="btn-voltar" onClick={()=>setTela?.("HomeERP")}>Voltar</button>
      </main>

      <ERPFooter onBack={()=>setTela?.("HomeERP")} />
    </>
  );
}

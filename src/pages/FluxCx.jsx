import React, { useEffect, useMemo, useState } from "react";
import ERPHeader from "./ERPHeader";
import ERPFooter from "./ERPFooter";
import {
  listenCaixaDiario, listenExtratoBancario,
  listenSaldosIniciais, salvarSaldosIniciais,
  backfillPrevistosDoMes, migrarAvulsosAntigos, fecharCaixaDiario
} from "../util/financeiro_store";

function money(n){ return `R$ ${Number(n||0).toFixed(2).replace(".", ",")}`; }
function dtBR(d){ try{ return (typeof d==="string"? d : (d?.toDate?.()||d||new Date())).toLocaleDateString("pt-BR"); }catch{ return ""; } }

export default function FluxCx({ setTela }) {
  const hoje = new Date();
  const [ano, setAno] = useState(hoje.getFullYear());
  const [mes, setMes] = useState(hoje.getMonth()+1);
  const meses = ["janeiro","fevereiro","março","abril","maio","junho","julho","agosto","setembro","outubro","novembro","dezembro"];

  // saldos iniciais (por mês)
  const [saldoIniCx, setSaldoIniCx] = useState(0);
  const [saldoIniBk, setSaldoIniBk] = useState(0);

  // CAIXA DIARIO
  const [cxLinhas, setCxLinhas] = useState([]);
  const [cxTotal, setCxTotal] = useState(0);

  // EXTRATO BANCARIO
  const [bkLinhas, setBkLinhas] = useState([]);
  const [totPrev, setTotPrev] = useState(0);
  const [totBan, setTotBan] = useState(0);

  // datas fechamento
  const [diaFechamento, setDiaFechamento] = useState(hoje.toISOString().slice(0,10));
  const [dataBanco, setDataBanco] = useState(hoje.toISOString().slice(0,10));

  useEffect(()=>{
    const u0 = listenSaldosIniciais(ano, mes, ({caixaInicial,bancoInicial})=>{
      setSaldoIniCx(caixaInicial||0); setSaldoIniBk(bancoInicial||0);
    });
    const u1 = listenCaixaDiario(ano, mes,
      ({linhas, total})=>{ setCxLinhas(linhas); setCxTotal(total); },
      (e)=>console.error("Caixa:", e)
    );
    const u2 = listenExtratoBancario(ano, mes,
      ({linhas, totPrev, totBan})=>{ setBkLinhas(linhas); setTotPrev(totPrev); setTotBan(totBan); },
      (e)=>console.error("Banco:", e)
    );
    return ()=>{ u0&&u0(); u1&&u1(); u2&&u2(); };
  },[ano, mes]);

  const saldoFinalCx = useMemo(()=> saldoIniCx + cxTotal, [saldoIniCx, cxTotal]);
  const saldoFinalBk = useMemo(()=> saldoIniBk + (totBan - totPrev), [saldoIniBk, totBan, totPrev]);

  async function onAtualizarMes() {
    await backfillPrevistosDoMes(ano, mes);
    await migrarAvulsosAntigos(ano, mes);
    alert("Atualizado: previstos por vencimento e avulsos antigos migrados.");
  }
  async function onSalvarSaldos() {
    await salvarSaldosIniciais(ano, mes, { caixaInicial: Number(saldoIniCx||0), bancoInicial: Number(saldoIniBk||0) });
    alert("Saldos iniciais salvos.");
  }
  async function onFecharCaixa() {
    try{
      const res = await fecharCaixaDiario({ diaOrigem: new Date(diaFechamento), dataBanco: new Date(dataBanco) });
      if(!res.criado){ alert("Nenhum item aberto nesse dia."); return; }
      alert(`Fechamento gerado no banco: ${money(res.total)} (${res.itens} itens).`);
    }catch(e){ alert("Erro ao fechar caixa: " + (e?.message||e)); }
  }

  return (
    <>
      <ERPHeader title="ERP DUDUNITÊ — Fluxo de Caixa" />
      <main style={{ padding: 12, display:"grid", gap:12 }}>
        {/* Seleção */}
        <div style={{ display:"flex", gap:10, alignItems:"center", flexWrap:"wrap" }}>
          <label>Seleção&nbsp;
            <select value={mes} onChange={e=>setMes(Number(e.target.value))}>
              {meses.map((m,i)=><option key={m} value={i+1}>{m}</option>)}
            </select>
          </label>
          <label>Ano&nbsp;
            <input type="number" value={ano} onChange={e=>setAno(Number(e.target.value))} style={{ width:100 }} />
          </label>

          <div style={{ marginLeft:"auto", display:"flex", gap:8, alignItems:"center", flexWrap:"wrap" }}>
            <label>Saldo inicial Caixa:&nbsp;
              <input type="number" step="0.01" value={saldoIniCx} onChange={e=>setSaldoIniCx(e.target.value)} style={{ width:110 }} />
            </label>
            <label>Saldo inicial Banco:&nbsp;
              <input type="number" step="0.01" value={saldoIniBk} onChange={e=>setSaldoIniBk(e.target.value)} style={{ width:110 }} />
            </label>
            <button onClick={onSalvarSaldos}>Salvar</button>
            <button onClick={onAtualizarMes}>Atualizar</button>
          </div>
        </div>

        {/* CAIXA DIÁRIO */}
        <section style={{ background:"#fff7ee", border:"1px solid #e6d2c2", borderRadius:10, padding:10 }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:6 }}>
            <h2 style={{ margin:0 }}>Caixa Diário — {meses[mes-1]} de {ano}</h2>
            <div><b>Saldo inicial:</b> {money(saldoIniCx)} &nbsp; <b>Total do período:</b> {money(cxTotal)} &nbsp; <b>Saldo final:</b> {money(saldoFinalCx)}</div>
          </div>

          {/* fechamento */}
          <div style={{ display:"flex", gap:8, flexWrap:"wrap", alignItems:"center", marginBottom:8 }}>
            <label>Dia a fechar: <input type="date" value={diaFechamento} onChange={e=>setDiaFechamento(e.target.value)} /></label>
            <label>Data no banco: <input type="date" value={dataBanco} onChange={e=>setDataBanco(e.target.value)} /></label>
            <button onClick={onFecharCaixa}>Fechar caixa do dia → Banco</button>
          </div>

          <div style={{ overflowX:"auto" }}>
            <table style={{ width:"100%", borderCollapse:"collapse" }}>
              <thead>
                <tr style={{ background:"#f7efe9" }}>
                  <th style={{textAlign:"left", padding:8}}>Data</th>
                  <th style={{textAlign:"left", padding:8}}>Descrição</th>
                  <th style={{textAlign:"left", padding:8}}>Forma</th>
                  <th style={{textAlign:"left", padding:8}}>Status</th>
                  <th style={{textAlign:"right", padding:8}}>Valor</th>
                </tr>
              </thead>
              <tbody>
                {cxLinhas.length === 0 && (
                  <tr><td colSpan={5} style={{ padding:10, color:"#7a5a2a" }}>
                    Nenhum lançamento no período.
                  </td></tr>
                )}
                {cxLinhas.map(l => (
                  <tr key={l.id}>
                    <td style={{ padding:8 }}>{dtBR(l.data)}</td>
                    <td style={{ padding:8 }}>{l.descricao || ""}</td>
                    <td style={{ padding:8 }}>{l.forma || ""}</td>
                    <td style={{ padding:8 }}>
                      {l.fechado
                        ? <span style={{ background:"#d1f7d6", border:"1px solid #9ed2a5", borderRadius:8, padding:"2px 6px" }}>Fechado</span>
                        : <span style={{ background:"#fff3c4", border:"1px solid #d7c7a8", borderRadius:8, padding:"2px 6px" }}>Aberto</span>}
                    </td>
                    <td style={{ padding:8, textAlign:"right" }}>{money(l.valor)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* EXTRATO BANCÁRIO */}
        <section style={{ background:"#fff7ee", border:"1px solid #e6d2c2", borderRadius:10, padding:10 }}>
          <div style={{ display:"flex", alignItems:"baseline", justifyContent:"space-between", marginBottom:6 }}>
            <h2 style={{ margin:0 }}>Extrato Bancário — {meses[mes-1]} de {ano}</h2>
            <div style={{ display:"flex", gap:14, alignItems:"center" }}>
              <span>Previstos: <b>{money(totPrev)}</b></span>
              <span>Realizados (Banco): <b>{money(totBan)}</b></span>
              <span>Saldo (Real − Prev): <b>{money(totBan - totPrev)}</b></span>
              <span>Saldo final: <b>{money(saldoFinalBk)}</b></span>
            </div>
          </div>

          <div style={{ overflowX:"auto" }}>
            <table style={{ width:"100%", borderCollapse:"collapse" }}>
              <thead>
                <tr style={{ background:"#f7efe9" }}>
                  <th style={{textAlign:"left", padding:8}}>Data</th>
                  <th style={{textAlign:"left", padding:8}}>Tipo</th>
                  <th style={{textAlign:"left", padding:8}}>Descrição</th>
                  <th style={{textAlign:"left", padding:8}}>Forma</th>
                  <th style={{textAlign:"right", padding:8}}>Valor</th>
                </tr>
              </thead>
              <tbody>
                {bkLinhas.length === 0 && (
                  <tr><td colSpan={5} style={{ padding:10, color:"#7a5a2a" }}>
                    Sem lançamentos para estas datas.
                  </td></tr>
                )}
                {bkLinhas.map((l)=>(
                  <tr key={`${l.origem}-${l.id}`}>
                    <td style={{ padding:8 }}>{dtBR(l.data)}</td>
                    <td style={{ padding:8 }}>
                      <span style={{
                        background: l.origem==="Realizado" ? "#d1f7d6" : "#fff3c4",
                        border:"1px solid #d7c7a8", borderRadius:8, padding:"2px 6px"
                      }}>{l.origem}</span>
                    </td>
                    <td style={{ padding:8 }}>{l.descricao || ""}</td>
                    <td style={{ padding:8 }}>{l.forma || ""}</td>
                    <td style={{ padding:8, textAlign:"right" }}>{money(l.valor)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <button className="btn-voltar" onClick={()=>setTela("HomePCP")}>Voltar</button>
      </main>
      <ERPFooter onBack={()=>setTela("HomePCP")} />
    </>
  );
}

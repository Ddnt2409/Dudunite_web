// src/pages/FluxCx.jsx
import React, { useEffect, useMemo, useState } from "react";
import "../util/FluxCx.css";
import {
  listenCaixaDiario, listenCaixaDiarioRange,
  listenExtratoBancario, listenExtratoBancarioRange,
  listenSaldosIniciais, salvarSaldosIniciais,
  backfillPrevistosDoMes, fecharCaixaDiario
} from "../util/financeiro_store";

const money = (n)=> (Number(n||0)).toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
const ymd = (d)=> {
  if(!d) return "";
  if (typeof d === "string") return d.slice(0,10);
  try { return new Date(d).toISOString().slice(0,10); } catch { return ""; }
};
const br = (d)=> {
  const dt = (d?.toDate?.() || d || new Date());
  try { return new Date(dt).toLocaleDateString("pt-BR"); } catch { return ""; }
};

export default function FluxCx({ setTela }) {
  const hoje = new Date();
  const [modo, setModo] = useState("mes"); // 'mes' | 'periodo'
  const [mes, setMes] = useState(hoje.getMonth()+1);
  const [ano, setAno] = useState(hoje.getFullYear());
  const [de, setDe]   = useState(ymd(new Date(hoje.getFullYear(),hoje.getMonth(),1)));
  const [ate, setAte] = useState(ymd(new Date(hoje.getFullYear(),hoje.getMonth()+1,1)));

  // saldos iniciais
  const [siCx, setSiCx] = useState(0);
  const [siBk, setSiBk] = useState(0);

  // caixa diário
  const [cx, setCx] = useState({ linhas: [], total: 0 });

  // extrato banco
  const [bk, setBk] = useState({ linhas: [], totPrev: 0, totBan: 0 });

  const meses = ["janeiro","fevereiro","março","abril","maio","junho","julho","agosto","setembro","outubro","novembro","dezembro"];

  // saldos iniciais (mensal)
  useEffect(()=>{
    if (modo !== "mes") return;
    const u = listenSaldosIniciais(ano, mes,
      ({caixa,banco}) => { setSiCx(caixa||0); setSiBk(banco||0); },
      (e)=>console.error(e)
    );
    return ()=>u && u();
  },[ano,mes,modo]);

  // listeners principais (caixa + banco)
  useEffect(()=>{
    let un1 = null, un2 = null;
    if (modo === "mes") {
      // roda o backfill sempre que muda o mês
      backfillPrevistosDoMes(ano, mes).catch(()=>{});
      un1 = listenCaixaDiario(ano, mes, setCx, (e)=>console.error(e));
      un2 = listenExtratoBancario(ano, mes, setBk, (e)=>console.error(e));
    } else {
      un1 = listenCaixaDiarioRange(de, ate, setCx, (e)=>console.error(e));
      un2 = listenExtratoBancarioRange(de, ate, setBk, (e)=>console.error(e));
    }
    return ()=>{ un1 && un1(); un2 && un2(); };
  },[modo, ano, mes, de, ate]);

  const saldoBanco = useMemo(()=> (siBk + bk.totBan - bk.totPrev), [siBk, bk]);

  async function onSalvarSaldos(){
    await salvarSaldosIniciais(ano, mes, { caixa: siCx, banco: siBk });
    alert("Saldos iniciais salvos para o mês.");
  }

  async function onFecharCaixaDia(){
    const dia = prompt("Fechar qual dia? (AAAA-MM-DD)", ymd(new Date()));
    if(!dia) return;
    const dataBanco = prompt("Data no banco (AAAA-MM-DD)", ymd(new Date()));
    const res = await fecharCaixaDiario({ diaOrigem: new Date(dia), dataBanco: new Date(dataBanco) });
    if (res?.criado) alert(`Fechamento gerado: ${money(res.total)} (${res.itens} itens).`);
    else alert("Não havia itens abertos nesse dia.");
  }

  return (
    <div className="fluxcx-main">
      <header className="erp-header">
        <div className="erp-header__inner">
          <div className="erp-header__logo">
            <img src="/LogomarcaDDnt2025Vazado.png" alt="Dudunitê" />
          </div>
          <div className="erp-header__title">
            ERP DUDUNITÊ<br/>Fluxo de Caixa
          </div>
        </div>
      </header>

      {/* Seleção de período */}
      <div className="extrato-card" style={{marginTop:8}}>
        <div className="extrato-actions" style={{gap:12, flexWrap:"wrap"}}>
          <label style={{display:"flex",alignItems:"center",gap:6}}>
            <input type="radio" checked={modo==="mes"} onChange={()=>setModo("mes")} /> Mês inteiro
          </label>
          <select disabled={modo!=="mes"} value={mes} onChange={e=>setMes(Number(e.target.value))}>
            {meses.map((m,i)=><option key={m} value={i+1}>{m}</option>)}
          </select>
          <input disabled={modo!=="mes"} type="number" value={ano} onChange={e=>setAno(Number(e.target.value))} style={{width:100}} />

          <label style={{display:"flex",alignItems:"center",gap:6, marginLeft:16}}>
            <input type="radio" checked={modo==="periodo"} onChange={()=>setModo("periodo")} /> Período (De/Até)
          </label>
          <input type="date" disabled={modo!=="periodo"} value={de} onChange={e=>setDe(e.target.value)} />
          <input type="date" disabled={modo!=="periodo"} value={ate} onChange={e=>setAte(e.target.value)} />

          <div style={{marginLeft:"auto", display:"flex", gap:8}}>
            <label>Saldo inicial Caixa: <input type="number" step="0.01" value={siCx} onChange={e=>setSiCx(e.target.value)} style={{width:110}}/></label>
            <label>Saldo inicial Banco: <input type="number" step="0.01" value={siBk} onChange={e=>setSiBk(e.target.value)} style={{width:110}}/></label>
            <button onClick={onSalvarSaldos}>Salvar</button>
            <button onClick={onFecharCaixaDia}>Fechar caixa do dia → Banco</button>
          </div>
        </div>
      </div>

      {/* ===== CAIXA DIÁRIO ===== */}
      <div className="extrato-card">
        <div className="fluxcx-header">
          <h2 className="fluxcx-title">Caixa Diário — {modo==="mes" ? `${meses[mes-1]} de ${ano}` : `${br(de)} → ${br(ate)}`}</h2>
          <div style={{marginLeft:"auto", fontWeight:800}}>
            Saldo inicial do período: {money(siCx)} • Total do período: {money(cx.total)} • Saldo final: {money(siCx + cx.total)}
          </div>
        </div>

        <div style={{ overflow:"auto", maxHeight:"40vh" }}>
          <table className="extrato">
            <thead>
              <tr>
                <th style={{minWidth:100}}>Data</th>
                <th>Descrição</th>
                <th style={{minWidth:120}}>Forma</th>
                <th style={{minWidth:110, textAlign:"center"}}>Status</th>
                <th style={{minWidth:130, textAlign:"right"}}>Valor</th>
              </tr>
            </thead>
            <tbody>
              {cx.linhas.length === 0 && (
                <tr><td colSpan={5} style={{ padding: 12, color: "#7b3c21" }}>
                  Nenhum lançamento no período.
                </td></tr>
              )}
              {cx.linhas.map(l => (
                <tr key={l.id}>
                  <td>{l.data}</td>
                  <td>{l.descricao}</td>
                  <td>{l.forma || "-"}</td>
                  <td>
                    <span className={`chip ${l.fechado ? "chip-real" : "chip-prev"}`}>
                      {l.fechado ? "Fechado" : "Aberto"}
                    </span>
                  </td>
                  <td style={{ textAlign:"right", fontWeight:800 }}>{money(l.valor)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ===== EXTRATO BANCÁRIO ===== */}
      <div className="extrato-card">
        <div className="fluxcx-header">
          <h2 className="fluxcx-title">Extrato Bancário — {modo==="mes" ? `${meses[mes-1]} de ${ano}` : `${br(de)} → ${br(ate)}`}</h2>
          <div style={{marginLeft:"auto", display:"flex", gap:14, fontWeight:800}}>
            <span>Previstos: {money(bk.totPrev)}</span>
            <span>Realizados (Banco): {money(bk.totBan)}</span>
            <span>Saldo (Real − Prev): {money(saldoBanco - siBk)}</span>
          </div>
        </div>

        <div style={{ overflow:"auto", maxHeight:"50vh" }}>
          <table className="extrato">
            <thead>
              <tr>
                <th style={{minWidth:100}}>Data</th>
                <th style={{minWidth:110}}>Tipo</th>
                <th>Descrição</th>
                <th style={{minWidth:120}}>Forma</th>
                <th style={{minWidth:130, textAlign:"right"}}>Valor</th>
              </tr>
            </thead>
            <tbody>
              {bk.linhas.length === 0 && (
                <tr><td colSpan={5} style={{ padding: 12, color: "#7b3c21" }}>
                  Sem lançamentos para estas datas.
                </td></tr>
              )}
              {bk.linhas.map(l => (
                <tr key={`${l.origem}-${l.id}`}>
                  <td>{l.data}</td>
                  <td>
                    <span className={`chip ${l.origem === "Realizado" ? "chip-real" : "chip-prev"}`}>
                      {l.origem}
                    </span>
                  </td>
                  <td>{l.descricao || ""}</td>
                  <td>{l.forma || "-"}</td>
                  <td style={{ textAlign:"right", fontWeight:800 }}>{money(l.valor)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <button className="btn-voltar-foot" onClick={() => setTela?.("HomeERP")}>🔙 Voltar</button>
      <footer className="erp-footer">
        <div className="erp-footer-track">
          • Previstos (LanPed) + Realizados Avulsos (Varejo) • Extrato Geral •
        </div>
      </footer>
    </div>
  );
            }

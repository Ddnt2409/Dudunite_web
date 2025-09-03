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
  // Backfill
  backfillPrevistosDoMes,
  // Edição/remoção no fluxo
  atualizarFluxo, excluirFluxo,
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
  const HOJE_YMD = useMemo(()=> new Date().toISOString().slice(0,10), []);
  const [modo, setModo] = useState("mes");
  const [ano, setAno]   = useState(hoje.getFullYear());
  const [mes, setMes]   = useState(hoje.getMonth()+1);
  const [de,  setDe ]   = useState(new Date(ano, mes-1, 1).toISOString().slice(0,10));
  const [ate, setAte]   = useState(new Date(ano, mes,   1).toISOString().slice(0,10));
  const meses = ["janeiro","fevereiro","março","abril","maio","junho","julho","agosto","setembro","outubro","novembro","dezembro"];

  // saldos
  const [saldoIniCx, setSaldoIniCx] = useState(0);
  const [saldoIniBk, setSaldoIniBk] = useState(0);

  // caixa diário
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

  // mostrar/ocultar caixa quando tudo estiver fechado
  const [cxVisivel, setCxVisivel] = useState(true);
  useEffect(()=>{
    const temAberto = cxLinhas.some(l=>!l.fechado);
    if (!temAberto) setCxVisivel(false);
  }, [cxLinhas]);

  // banco
  const [bkLinhas, setBkLinhas] = useState([]);
  const totPrev = useMemo(()=> bkLinhas.filter(l=>l.origem==="Previsto").reduce((s,l)=>s+Number(l.valor||0),0), [bkLinhas]);
  const totBan  = useMemo(()=> bkLinhas.filter(l=>l.origem==="Realizado").reduce((s,l)=>s+Number(l.valor||0),0), [bkLinhas]);
  const saldoBancoVsPrev = useMemo(()=> Number(totBan||0) - Number(totPrev||0), [totBan, totPrev]);
  const bkSaldoFinal = useMemo(()=> Number(saldoIniBk||0) + Number(totBan||0) - Number(totPrev||0), [saldoIniBk, totBan, totPrev]);

  // fechamento caixa
  const [diaFechar, setDiaFechar] = useState(new Date().toISOString().slice(0,10));
  const [dataBanco, setDataBanco] = useState(new Date().toISOString().slice(0,10));
  const [valorFechar, setValorFechar] = useState("");

  // edição inline (modal)
  const [edit, setEdit] = useState(null); // { id, descricao, planoContas, forma, data, valor, realizado, tipo }
  const [workingId, setWorkingId] = useState(null);

  // unsubs
  const unsubCx = useRef(null);
  const unsubBk = useRef(null);
  const unsubSd = useRef(null);

  // saldos iniciais
  useEffect(()=>{
    unsubSd.current && unsubSd.current();
    unsubSd.current = listenSaldosIniciais(ano, mes, ({caixa,banco})=>{
      setSaldoIniCx(Number(caixa||0));
      setSaldoIniBk(Number(banco||0));
    });
    return ()=> { unsubSd.current && unsubSd.current(); }
  },[ano, mes]);

  // assina listas
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

  // ===== Banco: ações =====
  async function handleToggleRealizado(linha, checked) {
    if (!linha?.id) return;
    try {
      setWorkingId(linha.id);
      if (checked) {
        await atualizarFluxo(linha.id, {
          statusFinanceiro: "Realizado",
          conta: "EXTRATO BANCARIO",
          dataRealizado: linha.data,       // mantém o mesmo dia
          valorRealizado: linha.valor,     // mantém o mesmo valor
          descricao: linha.descricao || linha.planoContas || "",
          formaPagamento: linha.forma || "",
        });
      } else {
        await atualizarFluxo(linha.id, {
          statusFinanceiro: "Previsto",
          dataPrevista: linha.data,
          valorPrevisto: linha.valor,
          descricao: linha.descricao || linha.planoContas || "",
          formaPagamento: linha.forma || "",
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

  function abrirEdicao(l) {
    setEdit({
      id: l.id,
      descricao: l.descricao || l.planoContas || "",
      planoContas: l.planoContas || "",
      forma: l.forma || "",
      data: l.data,
      valor: Number(l.valor || 0),
      realizado: l.origem === "Realizado",
      tipo: Number(l.valor||0) < 0 ? "Pagamento" : "Recebimento",
    });
  }

  async function salvarEdicao() {
    if (!edit?.id) return;
    const y = edit.data;
    const v = Number(edit.valor||0);
    const patchBase = {
      descricao: (edit.descricao||"").trim(),
      planoContas: (edit.planoContas||"").trim(),
      formaPagamento: (edit.forma||"").trim(),
    };
    try {
      setWorkingId(edit.id);
      if (edit.realizado) {
        await atualizarFluxo(edit.id, {
          ...patchBase,
          statusFinanceiro: "Realizado",
          dataRealizado: y,
          valorRealizado: v,
        });
      } else {
        await atualizarFluxo(edit.id, {
          ...patchBase,
          statusFinanceiro: "Previsto",
          dataPrevista: y,
          valorPrevisto: v,
        });
      }
      setEdit(null);
    } catch (e) {
      alert("Erro ao salvar alteração: " + (e?.message||e));
    } finally {
      setWorkingId(null);
    }
  }

  function statusLancamento(l) {
    if (l.origem === "Realizado") return { label: "EM DIA", cls: "badge-ok" };
    const ehPagamento = Number(l.valor || 0) < 0;
    const passou = (l.data || "") < HOJE_YMD;
    if (ehPagamento) {
      return passou ? { label: "ATRASADO", cls: "badge-bad" } : { label: "EM DIA", cls: "badge-ok" };
    } else {
      return passou ? { label: "INADIMPLENTE", cls: "badge-bad" } : { label: "EM DIA", cls: "badge-ok" };
    }
  }

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

        {/* ===== CAIXA DIÁRIO ===== */}
        {!cxVisivel && (
          <div className="extrato-card" style={{ marginBottom: 8 }}>
            <div className="cx-oculto">
              <span>Caixa Diário fechado (sem saldo aberto).</span>
              <button className="btn-acao" onClick={()=>setCxVisivel(true)}>Mostrar</button>
            </div>
          </div>
        )}
        {cxVisivel && (
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

            <div style={{ display:"flex", gap:8, flexWrap:"wrap", alignItems:"center", marginBottom:8 }}>
              <label>Dia a fechar: <input type="date" value={diaFechar} onChange={e=>setDiaFechar(e.target.value)} /></label>
              <label>Data no banco: <input type="date" value={dataBanco} onChange={e=>setDataBanco(e.target.value)} /></label>
              <label>Valor a fechar: <input type="number" step="0.01" value={valorFechar} onChange={e=>setValorFechar(e.target.value)} style={{ width:120 }} /></label>
              <button onClick={onFecharCaixa}>Fechar caixa do dia → Banco</button>
              <button className="btn-acao" onClick={()=>setCxVisivel(false)}>Ocultar</button>
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
        )}

        {/* ===== EXTRATO BANCÁRIO ===== */}
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

          {(() => {
            const grupos = groupByDia(bkLinhas);
            let acumulado = Number(saldoIniBk || 0);

            return grupos.map(([dia, itens]) => {
              // saldo do dia considera TODOS (prev+real)
              const somaDoDia = itens.reduce((s, l) => s + Number(l.valor || 0), 0);
              const saldoInicialDia = acumulado;
              const saldoFinalDia   = saldoInicialDia + somaDoDia;
              acumulado = saldoFinalDia;

              return (
                <div key={dia} style={{ marginBottom: 12 }}>
                  <div className="dia-header">
                    {dtBR(dia)} — <span>Saldo inicial do dia: {money(saldoInicialDia)}</span>
                  </div>

                  <div style={{ overflowX:"auto" }}>
                    <table className="extrato">
                      <thead>
                        <tr>
                          <th>Descrição</th>
                          <th style={{minWidth:180}}>Forma / Realizado</th>
                          <th style={{minWidth:130}}>Status</th>
                          <th style={{minWidth:120, textAlign:"right"}}>Valor</th>
                          <th style={{minWidth:200}}>Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {itens.map((l) => {
                          const st = statusLancamento(l);
                          return (
                            <tr key={l.id}>
                              <td>{l.descricao || l.planoContas || "-"}</td>
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
                              <td><span className={st.cls}>{st.label}</span></td>
                              <td style={{ textAlign:"right", fontWeight:800 }}>{money(l.valor)}</td>
                              <td>
                                <button className="btn-acao" onClick={()=>abrirEdicao(l)}>Alterar</button>
                                <button className="btn-acao btn-danger" disabled={workingId===l.id} onClick={()=>handleExcluir(l)}>Excluir</button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  <div className="dia-footer">
                    Saldo final do dia: {money(saldoFinalDia)}
                  </div>
                </div>
              );
            });
          })()}
        </section>

        <button className="btn-voltar" onClick={()=>setTela?.("HomeERP")}>Voltar</button>
      </main>

      {/* ===== MODAL EDIÇÃO ===== */}
      {edit && (
        <div className="modal-backdrop" onClick={()=>setEdit(null)}>
          <div className="modal-card" onClick={(e)=>e.stopPropagation()}>
            <h3>Edição — {edit.tipo}</h3>

            <div className="form-row">
              <label>Descrição / Plano de Contas</label>
              <input
                type="text"
                value={edit.descricao}
                onChange={(e)=>setEdit(v=>({ ...v, descricao: e.target.value }))}
                placeholder="Ex.: Energia elétrica (Adm)"
              />
              <small className="hint">Se a descrição ficar vazia, uso o plano de contas automaticamente.</small>
            </div>

            <div className="form-row">
              <label>Plano de Contas (opcional)</label>
              <input
                type="text"
                value={edit.planoContas}
                onChange={(e)=>setEdit(v=>({ ...v, planoContas: e.target.value }))}
              />
            </div>

            <div className="form-row">
              <label>Forma de pagamento</label>
              <input
                type="text"
                value={edit.forma}
                onChange={(e)=>setEdit(v=>({ ...v, forma: e.target.value }))}
                placeholder="PIX, Débito, Crédito…"
              />
            </div>

            <div className="form-row grid-2">
              <div>
                <label>Data</label>
                <input type="date" value={edit.data} onChange={(e)=>setEdit(v=>({ ...v, data: e.target.value }))} />
              </div>
              <div>
                <label>Valor</label>
                <input type="number" step="0.01" value={edit.valor} onChange={(e)=>setEdit(v=>({ ...v, valor: e.target.value }))} />
              </div>
            </div>

            <div className="form-row">
              <label style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer"}}>
                <input
                  type="checkbox"
                  checked={!!edit.realizado}
                  onChange={(e)=>setEdit(v=>({ ...v, realizado: e.target.checked }))}
                />
                Marcar como realizado
              </label>
            </div>

            <div className="modal-actions">
              <button className="btn-acao" onClick={salvarEdicao} disabled={workingId===edit.id}>Salvar</button>
              <button className="btn-acao btn-danger" onClick={()=>setEdit(null)}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

      <ERPFooter onBack={()=>setTela?.("HomeERP")} />
    </>
  );
          }

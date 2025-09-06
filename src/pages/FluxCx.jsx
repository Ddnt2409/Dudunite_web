// src/pages/FluxCx.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import ERPHeader from "./ERPHeader";
import ERPFooter from "./ERPFooter";
import "../util/FluxCx.css";

import {
  // Saldos
  listenSaldosIniciais,
  salvarSaldosIniciais,
  // Caixa Diário
  listenCaixaDiario,
  listenCaixaDiarioRange,
  fecharCaixaParcial,
  // Banco
  listenExtratoBancario,
  listenExtratoBancarioRange,
  // Backfill de PEDIDOS -> financeiro_fluxo
  backfillPrevistosDoMes,
  // Edição
  atualizarFluxo,
  excluirFluxo,
} from "../util/financeiro_store";

/* ================== helpers visuais ================== */
const money = (n) => `R$ ${Number(n || 0).toFixed(2).replace(".", ",")}`;
const dtBR = (v) =>
  v && typeof v === "string"
    ? v.split("-").reverse().join("/")
    : new Date(v || Date.now()).toLocaleDateString("pt-BR");

/* ===================================================== */

export default function FluxCx({ setTela }) {
  /* ===== Seleção ===== */
  const hoje = new Date();
  const [modo, setModo] = useState("mes"); // "mes" | "periodo"
  const [ano, setAno] = useState(hoje.getFullYear());
  const [mes, setMes] = useState(hoje.getMonth() + 1);
  const [de, setDe] = useState(new Date(ano, mes - 1, 1).toISOString().slice(0, 10));
  const [ate, setAte] = useState(new Date(ano, mes, 1).toISOString().slice(0, 10));
  const meses = [
    "janeiro", "fevereiro", "março", "abril", "maio", "junho",
    "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
  ];

  /* ===== Saldos iniciais ===== */
  const [saldoIniCx, setSaldoIniCx] = useState(0);
  const [saldoIniBk, setSaldoIniBk] = useState(0);

  /* ===== Caixa Diário (topo) ===== */
  const [cxLinhas, setCxLinhas] = useState([]);
  const cxTotal = useMemo(
    () => cxLinhas.reduce((s, l) => s + Number(l.valor || 0), 0),
    [cxLinhas]
  );
  const cxSaldoFinal = useMemo(
    () => Number(saldoIniCx || 0) + Number(cxTotal || 0),
    [saldoIniCx, cxTotal]
  );
  // Saldo acumulado por linha (estilo extrato)
  const cxComSaldo = useMemo(() => {
    let acc = Number(saldoIniCx || 0);
    return cxLinhas.map((l) => {
      acc += Number(l.valor || 0);
      return { ...l, saldo: acc };
    });
  }, [cxLinhas, saldoIniCx]);

  // visibilidade do bloco de CAIXA (oculta só quando saldo zero; pode forçar mostrar)
  const [forcarMostrarCx, setForcarMostrarCx] = useState(false);
  const cxSemSaldo = Math.abs(Number(cxSaldoFinal)) < 0.0001;
  const mostrarCaixa = forcarMostrarCx || !cxSemSaldo;

  /* ===== Banco (baixo) ===== */
  const [bkLinhas, setBkLinhas] = useState([]);
  const totPrev = useMemo(
    () => bkLinhas.filter((l) => l.origem === "Previsto")
                  .reduce((s, l) => s + Number(l.valor || 0), 0),
    [bkLinhas]
  );
  const totBan = useMemo(
    () => bkLinhas.filter((l) => l.origem === "Realizado")
                  .reduce((s, l) => s + Number(l.valor || 0), 0),
    [bkLinhas]
  );
  const saldoBancoVsPrev = useMemo(
    () => Number(totBan || 0) - Number(totPrev || 0),
    [totBan, totPrev]
  );

  /* ===== Fechamento Caixa ===== */
  const [diaFechar, setDiaFechar] = useState(new Date().toISOString().slice(0, 10));
  const [dataBanco, setDataBanco] = useState(new Date().toISOString().slice(0, 10));
  const [valorFechar, setValorFechar] = useState("");

  /* ===== Assinaturas ===== */
  const unsubCx = useRef(null);
  const unsubBk = useRef(null);
  const unsubSd = useRef(null);

  // ouvir saldos iniciais do mês selecionado
  useEffect(() => {
    unsubSd.current && unsubSd.current();
    unsubSd.current = listenSaldosIniciais(ano, mes, ({ caixa, banco }) => {
      setSaldoIniCx(Number(caixa || 0));
      setSaldoIniBk(Number(banco || 0));
    });
    return () => unsubSd.current && unsubSd.current();
  }, [ano, mes]);

  // (re)assinar listas conforme seleção
  useEffect(() => {
    assinarListas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modo, ano, mes, de, ate]);

  function assinarListas() {
    unsubCx.current && unsubCx.current();
    unsubBk.current && unsubBk.current();

    if (modo === "mes") {
      unsubCx.current = listenCaixaDiario(ano, mes, ({ linhas }) => setCxLinhas(linhas));
      unsubBk.current = listenExtratoBancario(ano, mes, ({ linhas }) =>
        setBkLinhas(linhas.map((l) => ({ ...l })))
      );
    } else {
      const ini = new Date(de);
      const fim = new Date(ate);
      unsubCx.current = listenCaixaDiarioRange(ini, fim, ({ linhas }) => setCxLinhas(linhas));
      unsubBk.current = listenExtratoBancarioRange(ini, fim, ({ linhas }) =>
        setBkLinhas(linhas.map((l) => ({ ...l })))
      );
    }
  }

  async function onSalvarSaldos() {
    await salvarSaldosIniciais(ano, mes, {
      caixa: Number(saldoIniCx || 0),
      banco: Number(saldoIniBk || 0),
    });
    alert("Saldos iniciais salvos.");
  }
  async function onAtualizar() {
    if (modo === "mes") {
      try { await backfillPrevistosDoMes(ano, mes); } catch {}
    }
    assinarListas();
  }

  async function onFecharCaixa() {
    const v = valorFechar === "" ? null : Number(valorFechar);
    try {
      const res = await fecharCaixaParcial({
        diaOrigem: new Date(diaFechar),
        dataBanco: new Date(dataBanco),
        valorParcial: v,
      });
      if (!res?.criado) {
        alert("Nenhum lançamento aberto nesse dia ou valor a fechar é 0.");
        return;
      }
      alert(`Fechamento enviado ao banco: ${money(res.total)}.`);
      setValorFechar("");
    } catch (e) {
      alert("Erro ao fechar caixa: " + (e?.message || e));
    }
  }

  /* ===== Banco agrupado por dia ===== */
  const gruposBanco = useMemo(() => {
    const porDia = new Map();
    [...bkLinhas]
      .sort((a, b) => a.data.localeCompare(b.data))
      .forEach((l) => {
        if (!porDia.has(l.data)) porDia.set(l.data, []);
        porDia.get(l.data).push(l);
      });

    let acumulado = Number(saldoIniBk || 0);
    const arr = [];
    for (const [dia, linhas] of porDia.entries()) {
      const saldoInicial = acumulado;
      const totalDia = linhas.reduce((s, l) => s + Number(l.valor || 0), 0);
      acumulado += totalDia;
      arr.push({
        dia,
        linhas,
        saldoInicial,
        saldoFinal: saldoInicial + totalDia,
      });
    }
    return arr.sort((a, b) => a.dia.localeCompare(b.dia));
  }, [bkLinhas, saldoIniBk]);

  /* ===== Toggle Realizado (NÃO some nem muda de dia) ===== */
  async function onToggleRealizado(linha, checked) {
    try {
      if (linha.origem === "Previsto" && checked) {
        // Vira REALIZADO no MESMO DIA do grupo
        await atualizarFluxo(linha.id, {
          conta: "EXTRATO BANCARIO",
          statusFinanceiro: "Realizado",
          dataRealizado: linha.data,                 // mantém no mesmo dia
          valorRealizado: Number(linha.valor ?? 0),
          dataPrevista: null,
          valorPrevisto: null,
        });
      } else if (linha.origem === "Realizado" && !checked) {
        // Volta para PREVISTO no MESMO DIA do grupo
        await atualizarFluxo(linha.id, {
          conta: "EXTRATO BANCARIO",
          statusFinanceiro: "Previsto",
          dataPrevista: linha.data,                  // mantém no mesmo dia
          valorPrevisto: Number(linha.valor ?? 0),
          dataRealizado: null,
          valorRealizado: null,
        });
      }
    } catch (e) {
      alert("Falha ao atualizar lançamento: " + (e?.message || e));
    }
  }

  /* ===== Status badge (tabela banco) ===== */
  function badgeStatus(l) {
    // Realizado => PAGO/RECEBIDO
    if (l.origem === "Realizado") {
      if (Number(l.valor) < 0) return <span className="badge-paid">PAGO</span>;
      return <span className="badge-received">RECEBIDO</span>;
    }
    // Previsto => EM DIA / ATRASADO / INADIMPLENTE
    const hojeZ = new Date(); hojeZ.setHours(0, 0, 0, 0);
    const d = new Date(`${l.data}T00:00:00`);
    const atrasado = d < hojeZ;
    if (!atrasado) return <span className="badge-ok">EM DIA</span>;
    if (Number(l.valor) < 0) return <span className="badge-bad">ATRASADO</span>;
    return <span className="badge-bad">INADIMPLENTE</span>;
  }

  /* ===== Modal de edição inline ===== */
  const [edit, setEdit] = useState(null);
  const [editForm, setEditForm] = useState({
    descricao: "", forma: "", data: "", valor: "", origem: "Previsto",
  });
  function openEdit(l) {
    setEdit(l);
    setEditForm({
      descricao: (l.descricao || "").replace(/^PEDIDO\s*•\s*/i, ""), // sem "PEDIDO •"
      forma: l.forma || "",
      data: l.data || "",
      valor: String(l.valor ?? 0).replace(",", "."),
      origem: l.origem,
    });
  }
  async function saveEdit() {
    try {
      const v = Number(editForm.valor || 0);
      const patch = {
        conta: "EXTRATO BANCARIO",
        descricao: editForm.descricao || null,
        formaPagamento: editForm.forma || null,
      };
      if (editForm.origem === "Realizado") {
        patch.statusFinanceiro = "Realizado";
        patch.dataRealizado = editForm.data;
        patch.valorRealizado = v;
        patch.dataPrevista = null;
        patch.valorPrevisto = null;
      } else {
        patch.statusFinanceiro = "Previsto";
        patch.dataPrevista = editForm.data;
        patch.valorPrevisto = v;
        patch.dataRealizado = null;
        patch.valorRealizado = null;
      }
      await atualizarFluxo(edit.id, patch);
      setEdit(null);
    } catch (e) {
      alert("Erro ao salvar: " + (e?.message || e));
    }
  }

  /* ====================== UI ====================== */
  return (
    <>
      <ERPHeader title="ERP DUDUNITÊ — Fluxo de Caixa" />

      <main className="fluxcx-main" style={{ padding: 10 }}>
        {/* Seleção / Saldos iniciais */}
        <div className="extrato-card" style={{ marginBottom: 10 }}>
          <div className="extrato-actions" style={{ gap: 8, flexWrap: "wrap" }}>
            <label>
              <input type="radio" checked={modo === "mes"} onChange={() => setModo("mes")} /> Mês inteiro
            </label>
            <select disabled={modo !== "mes"} value={mes} onChange={(e) => setMes(Number(e.target.value))}>
              {meses.map((m, i) => (<option key={m} value={i + 1}>{m}</option>))}
            </select>
            <input disabled={modo !== "mes"} type="number" value={ano} onChange={(e) => setAno(Number(e.target.value))} style={{ width: 80 }} />

            <label style={{ marginLeft: 12 }}>
              <input type="radio" checked={modo === "periodo"} onChange={() => setModo("periodo")} /> Período (De/Até)
            </label>
            <input type="date" disabled={modo !== "periodo"} value={de}  onChange={(e) => setDe(e.target.value)} />
            <input type="date" disabled={modo !== "periodo"} value={ate} onChange={(e) => setAte(e.target.value)} />

            <span style={{ marginLeft: 12 }}>Saldo inicial Caixa: </span>
            <input type="number" value={saldoIniCx} onChange={(e) => setSaldoIniCx(e.target.value)} style={{ width: 90 }} />
            <span style={{ marginLeft: 8 }}>Saldo inicial Banco: </span>
            <input type="number" value={saldoIniBk} onChange={(e) => setSaldoIniBk(e.target.value)} style={{ width: 90 }} />

            <button onClick={onSalvarSaldos}>Salvar</button>
            <button onClick={onAtualizar}>Atualizar</button>
          </div>
        </div>

        {/* ===== TOPO: CAIXA DIÁRIO ===== */}
        <section className="extrato-card">
          <div className="fluxcx-header" style={{ marginBottom: 6 }}>
            <h2 className="fluxcx-title" style={{ margin: 0 }}>
              Caixa Diário — {modo === "mes" ? `${meses[mes - 1]} de ${ano}` : `${dtBR(de)} → ${dtBR(ate)}`}
            </h2>
            <div style={{ marginLeft: "auto", display: "flex", gap: 12, alignItems: "center" }}>
              <b>Saldo inicial do período:</b> {money(saldoIniCx)}
              <b>Total do período:</b> {money(cxTotal)}
              <b>Saldo final:</b> {money(cxSaldoFinal)}
              {cxSemSaldo && !forcarMostrarCx && (
                <button className="btn-acao" onClick={() => setForcarMostrarCx(true)}>Mostrar</button>
              )}
              {cxSemSaldo && forcarMostrarCx && (
                <button className="btn-acao" onClick={() => setForcarMostrarCx(false)}>Ocultar</button>
              )}
            </div>
          </div>

          {!mostrarCaixa ? (
            <div className="cx-oculto">
              <div className="saldo-big">
                Saldo atual do caixa: <span style={{ fontWeight: 900 }}>{money(cxSaldoFinal)}</span>
              </div>
              <button className="btn-acao" onClick={() => setForcarMostrarCx(true)}>Mostrar</button>
            </div>
          ) : (
            <>
              {/* Fechamento */}
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", marginBottom: 8 }}>
                <label>Dia a fechar: <input type="date" value={diaFechar} onChange={(e) => setDiaFechar(e.target.value)} /></label>
                <label>Data no banco: <input type="date" value={dataBanco} onChange={(e) => setDataBanco(e.target.value)} /></label>
                <label>Valor a fechar: <input type="number" step="0.01" value={valorFechar} onChange={(e) => setValorFechar(e.target.value)} style={{ width: 120 }} /></label>
                <button onClick={onFecharCaixa}>Fechar caixa do dia → Banco</button>
                {cxSemSaldo && <button className="btn-acao" onClick={() => setForcarMostrarCx(false)}>Ocultar</button>}
              </div>

              <div style={{ overflowX: "auto" }}>
                <table className="extrato">
                  <thead>
                    <tr>
                      <th style={{ minWidth: 90 }}>Data</th>
                      <th>Descrição</th>
                      <th style={{ minWidth: 110 }}>Forma</th>
                      <th style={{ minWidth: 100 }}>Status</th>
                      <th className="th-right" style={{ minWidth: 120 }}>Valor</th>
                      <th className="th-right" style={{ minWidth: 120 }}>Saldo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cxComSaldo.length === 0 && (
                      <tr><td colSpan={6} style={{ padding: 10, color: "#7a5a2a" }}>Nenhum lançamento no período.</td></tr>
                    )}
                    {cxComSaldo.map((l) => (
                      <tr key={l.id}>
                        <td>{dtBR(l.data)}</td>
                        <td>{l.descricao}</td>
                        <td>{l.forma || "-"}</td>
                        <td>{l.fechado ? <span className="chip chip-real">Fechado</span> : <span className="chip chip-prev">Aberto</span>}</td>
                        <td className={`valor-cell ${Number(l.valor) < 0 ? "valor-pag" : "valor-rec"}`}>
                          {money(l.valor)}
                        </td>
                        <td className="valor-cell">{money(l.saldo)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </section>

        {/* ===== BAIXO: EXTRATO BANCÁRIO ===== */}
        <section className="extrato-card">
          <div className="fluxcx-header" style={{ marginBottom: 6 }}>
            <h2 className="fluxcx-title" style={{ margin: 0 }}>
              Extrato Bancário — {modo === "mes" ? `${meses[mes - 1]} de ${ano}` : `${dtBR(de)} → ${dtBR(ate)}`}
            </h2>
            <div style={{ marginLeft: "auto", display: "flex", gap: 14, alignItems: "center" }}>
              <span>Previstos: <b>{money(totPrev)}</b></span>
              <span>Realizados (Banco): <b>{money(totBan)}</b></span>
              <span>Saldo (Real − Prev): <b>{money(saldoBancoVsPrev)}</b></span>
            </div>
          </div>

          {gruposBanco.map((g) => (
            <div key={g.dia} style={{ marginBottom: 10 }}>
              <div className="dia-header">
                {dtBR(g.dia)} — Saldo inicial do dia: {money(g.saldoInicial)}
              </div>

              <div style={{ overflowX: "auto" }}>
                <table className="extrato">
                  <thead>
                    <tr>
                      <th>Descrição</th>
                      <th style={{ minWidth: 140 }}>Forma / Realizado</th>
                      <th style={{ minWidth: 110 }}>Status</th>
                      <th className="th-right" style={{ minWidth: 110 }}>Valor</th>
                      <th style={{ minWidth: 140 }}>Ações</th>
                      <th style={{ minWidth: 70, textAlign: "center" }}>Tipo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {g.linhas.map((l, i) => {
                      const desc = (l.descricao || "").replace(/^PEDIDO\s*•\s*/i, "") || "-";
                      const isPag = Number(l.valor) < 0; // pagamento (negativo) vs recebimento (positivo)
                      return (
                        <tr key={l.id || i}>
                          <td>{desc}</td>
                          <td>
                            {l.forma || "-"}{" "}
                            <input
                              type="checkbox"
                              checked={l.origem === "Realizado"}
                              onChange={(e) => onToggleRealizado(l, e.target.checked)}
                              style={{ marginLeft: 8 }}
                            />{" "}
                            Realizado
                          </td>
                          <td>{badgeStatus(l)}</td>
                          <td className={`valor-cell ${isPag ? "valor-pag" : "valor-rec"}`}>
                            {money(l.valor)}
                          </td>
                          <td>
                            <button className="btn-acao" onClick={() => openEdit(l)}>Alterar</button>
                            <button
                              className="btn-acao btn-danger"
                              onClick={async () => {
                                if (confirm("Confirma a exclusão deste lançamento?")) {
                                  try { await excluirFluxo(l.id); } 
                                  catch (e) { alert("Erro ao excluir: " + (e?.message || e)); }
                                }
                              }}
                            >
                              Excluir
                            </button>
                          </td>
                          {/* Coluna TIPO */}
                          <td style={{ textAlign: "center" }}>
                            <span className={`tipo-chip ${isPag ? "tipo-pag" : "tipo-rec"}`}>
                              {isPag ? "PAG" : "REC"}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="dia-footer">
                Saldo final do dia: <b>{money(g.saldoFinal)}</b>
              </div>
            </div>
          ))}
        </section>

        <button className="btn-voltar" onClick={() => setTela?.("HomeERP")}>Voltar</button>
      </main>

      {/* ===== Modal ===== */}
      {edit && (
        <div className="modal-backdrop" onClick={() => setEdit(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h3>Editar lançamento</h3>

            <div className="form-row">
              <label>Descrição</label>
              <input
                value={editForm.descricao}
                onChange={(e) => setEditForm({ ...editForm, descricao: e.target.value })}
              />
            </div>

            <div className="form-row grid-2">
              <div>
                <label>Forma de pagamento</label>
                <input
                  value={editForm.forma}
                  onChange={(e) => setEditForm({ ...editForm, forma: e.target.value })}
                />
              </div>
              <div>
                <label>Data</label>
                <input
                  type="date"
                  value={editForm.data}
                  onChange={(e) => setEditForm({ ...editForm, data: e.target.value })}
                />
              </div>
            </div>

            <div className="form-row">
              <label>Valor</label>
              <input
                type="number"
                step="0.01"
                value={editForm.valor}
                onChange={(e) => setEditForm({ ...editForm, valor: e.target.value })}
              />
            </div>

            <div className="modal-actions">
              <button className="btn-acao" onClick={() => setEdit(null)}>Cancelar</button>
              <button className="btn-acao" onClick={saveEdit}>Salvar</button>
            </div>
          </div>
        </div>
      )}

      <ERPFooter onBack={() => setTela?.("HomeERP")} />
    </>
  );
}

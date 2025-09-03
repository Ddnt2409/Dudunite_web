import db from "../firebase";
import {
  collection, doc, addDoc, setDoc, updateDoc, getDoc, getDocs,
  onSnapshot, query, where, serverTimestamp, Timestamp, writeBatch
} from "firebase/firestore";

/* ======================= CONSTANTES ======================= */

const COL_FLUXO   = "financeiro_fluxo";   // extrato (Previstos + Realizados no Banco)
const COL_SALDOS  = "financeiro_saldos";  // doc mensal com saldos iniciais
const COL_PEDIDOS = "PEDIDOS";            // origem dos Previstos (LanPed)
const COL_AVULSOS = "cts_avulsos";        // origem do Caixa Diário

/* ========================= HELPERS ======================== */

function toYMD(d) {
  const x = d instanceof Date ? d : new Date(d);
  if (Number.isNaN(x.getTime())) return "";
  const mm = String(x.getMonth() + 1).padStart(2, "0");
  const dd = String(x.getDate()).padStart(2, "0");
  return `${x.getFullYear()}-${mm}-${dd}`;
}
function anyToYMD(v) {
  if (!v) return "";
  if (typeof v === "string") {
    if (/^\d{4}-\d{2}-\d{2}/.test(v)) return v.slice(0, 10);              // ISO
    if (/^\d{2}\/\d{2}\/\d{4}/.test(v)) {                                  // BR
      const [dd, mm, yyyy] = v.slice(0,10).split("/");
      return `${yyyy}-${mm}-${dd}`;
    }
    return toYMD(new Date(v));
  }
  if (v && typeof v.toDate === "function") return toYMD(v.toDate());
  return toYMD(v);
}
function brDate(v) {
  const d = (v && typeof v.toDate === "function") ? v.toDate() : v;
  try { return new Date(d || new Date()).toLocaleDateString("pt-BR"); } catch { return ""; }
}
function somaValorPedido(pedido = {}) {
  const itens = Array.isArray(pedido.itens) ? pedido.itens : [];
  let total = 0;
  for (const it of itens) {
    const q = Number(it.qtd ?? it.quantidade ?? it.qtde ?? 0);
    const vuRaw = it.preco ?? it.preço ?? it.valor ?? it.valorUnitario ?? it.vl ?? 0;
    const vu = Number(vuRaw);
    total += q * (Number.isFinite(vu) ? vu : 0);
  }
  return total;
}
function monthRange(ano, mes1a12) {
  const ini = new Date(ano, mes1a12 - 1, 1, 0, 0, 0, 0);
  const fim = new Date(ano, mes1a12, 1, 0, 0, 0, 0);
  return { ini, fim };
}
function dayRange(d) {
  const dd = d instanceof Date ? new Date(d) : new Date(d);
  dd.setHours(0, 0, 0, 0);
  const ini = new Date(dd);
  const fim = new Date(dd);
  fim.setDate(fim.getDate() + 1);
  return { ini, fim };
}
function rangeFromInputs(inicio, fimInc) {
  const ini = new Date(inicio instanceof Date ? inicio : new Date(inicio));
  const fim = new Date(fimInc instanceof Date ? fimInc : new Date(fimInc));
  ini.setHours(0,0,0,0);
  fim.setHours(0,0,0,0);
  const fimExc = new Date(fim);
  fimExc.setDate(fimExc.getDate()+1);
  return { ini, fim: fimExc };
}
function inRangeYMD(ymd, ini, fimExc) {
  if (!ymd) return false;
  const d = new Date(`${ymd}T00:00:00`);
  return d >= ini && d < fimExc;
}
function safeNumber(n, fallback = 0) {
  const v = Number(n);
  return Number.isFinite(v) ? v : fallback;
}
function toDateLoose(v){
  if (!v) return null;
  if (typeof v?.toDate === "function") return v.toDate();
  if (typeof v === "string") {
    if (/^\d{4}-\d{2}-\d{2}/.test(v)) return new Date(v);
    if (/^\d{2}\/\d{2}\/\d{4}/.test(v)) {
      const [dd, mm, yyyy] = v.slice(0,10).split("/");
      return new Date(`${yyyy}-${mm}-${dd}`);
    }
  }
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}
function tsMs(x){
  if (x && typeof x.toDate === "function") return x.toDate().getTime();
  if (x instanceof Date) return x.getTime();
  if (typeof x === "number") return x;
  return 0;
}

/* ===================== SALDOS INICIAIS ==================== */

export function listenSaldosIniciais(ano, mes, onChange, onError) {
  try {
    const id = `${ano}-${String(mes).padStart(2, "0")}`;
    const ref = doc(db, COL_SALDOS, id);
    return onSnapshot(
      ref,
      (snap) => {
        const d = snap.data() || {};
        onChange && onChange({
          caixa: safeNumber(d.saldoInicialCaixa),
          banco: safeNumber(d.saldoInicialBanco),
        });
      },
      (e) => onError && onError(e)
    );
  } catch (e) {
    onError && onError(e);
    return () => {};
  }
}

export async function salvarSaldosIniciais(ano, mes, { caixa = 0, banco = 0 } = {}) {
  const id = `${ano}-${String(mes).padStart(2, "0")}`;
  await setDoc(
    doc(db, COL_SALDOS, id),
    {
      saldoInicialCaixa: safeNumber(caixa),
      saldoInicialBanco: safeNumber(banco),
      atualizadoEm: serverTimestamp(),
    },
    { merge: true }
  );
}

/* ===================== CAIXA DIÁRIO (AVULSOS) ===================== */

export async function gravarAvulsoCaixa({
  cidade = "Gravatá",
  pdv = "VAREJO",
  produto = "",
  quantidade = 0,
  canal = "varejo",
  planoContas = "",
  formaPagamento = "",
  situacao = "Realizado",
  dataLancamento = new Date(),
  dataPrevista = null,
  valorUnit = null,
  valor = null,
} = {}) {
  let valorCalc = valor;
  if (valorCalc == null) {
    const vu = safeNumber(valorUnit);
    const qt = safeNumber(quantidade);
    valorCalc = vu * qt;
  }
  const dLanc = toDateLoose(dataLancamento) || new Date();
  const payload = {
    cidade,
    pdv,
    produto,
    quantidade: safeNumber(quantidade),
    canal,
    planoContas,
    formaPagamento,
    situacao: situacao || "Realizado",
    conta: "CAIXA DIARIO",
    valorUnit: safeNumber(valorUnit),
    valor: safeNumber(valorCalc),
    // datas
    data: toYMD(dLanc),
    dataLancamento: Timestamp.fromDate(dLanc),
    dataPrevista: dataPrevista ? Timestamp.fromDate(toDateLoose(dataPrevista)) : null,
    fechado: false,
    criadoEm: serverTimestamp(),
    atualizadoEm: serverTimestamp(),
  };
  const ref = await addDoc(collection(db, COL_AVULSOS), payload);
  return { id: ref.id };
}

/** Mês → range */
export function listenCaixaDiario(ano, mes, onChange, onError) {
  const { ini, fim } = monthRange(ano, mes);
  return listenCaixaDiarioRange(ini, fim, onChange, onError);
}

/** Listener do Caixa com ordenação por data + criação/ordem. */
export function listenCaixaDiarioRange(inicio, fimInc, onChange, onError) {
  const { ini, fim } = rangeFromInputs(inicio, fimInc);
  try {
    const col = collection(db, COL_AVULSOS);
    return onSnapshot(
      col,
      (snap) => {
        const linhas = [];
        let total = 0;

        snap.docs.forEach((ds) => {
          const d = ds.data() || {};
          if (String(d.conta || "").toUpperCase() !== "CAIXA DIARIO") return;

          const dt =
            toDateLoose(d.dataLancamento) ||
            toDateLoose(d.dataPrevista)   ||
            toDateLoose(d.data)           ||
            toDateLoose(d.criadoEm)       ||
            toDateLoose(d.createdEm);

          const ymd = dt ? toYMD(dt) : "";
          if (!inRangeYMD(ymd, ini, fim)) return;

          let valorCalc = d.valor;
          if (valorCalc == null) {
            const vu = safeNumber(d.valorUnit || d.vlrUnit);
            const qtd = safeNumber(d.quantidade || d.qtd);
            valorCalc = vu * qtd;
          }
          const valor = safeNumber(valorCalc);

          const ord =
            Number(d.ordemFechamentoMs ?? 0) ||
            tsMs(d.criadoEm) ||
            tsMs(d.atualizadoEm) ||
            (dt ? dt.getTime() : 0);

          linhas.push({
            id: ds.id,
            data: ymd,
            descricao: d.fechamento
              ? (d.descricao || `Fechamento Caixa • ${brDate(d.dataLancamento || d.data)}`)
              : `${d.pdv || "VAREJO"} • ${d.produto || ""}${d.quantidade ? ` x${d.quantidade}` : ""}`,
            forma: d.formaPagamento || (d.fechamento ? "Fechamento" : ""),
            valor,
            fechado: !!d.fechado || !!d.fechamento,
            ord,
          });
          total += valor;
        });

        linhas.sort((a, b) => {
          if (a.data === b.data) return (a.ord || 0) - (b.ord || 0);
          return a.data.localeCompare(b.data);
        });

        onChange && onChange({ linhas, total });
      },
      (e) => onError && onError(e)
    );
  } catch (e) {
    onError && onError(e);
    return () => {};
  }
}

/**
 * Fechamento (total/parcial):
 * - Banco: crédito Realizado em financeiro_fluxo
 * - Caixa: saída negativa em cts_avulsos
 * Mantém ordem: usa ordemFechamentoMs = Date.now()
 */
export async function fecharCaixaDiario({ diaOrigem, dataBanco, valorParcial = null } = {}) {
  const base = diaOrigem || new Date();
  const bancoD = dataBanco || base;
  const { ini, fim } = dayRange(base);

  const snap = await getDocs(collection(db, COL_AVULSOS));
  let totalDoDia = 0;
  snap.forEach((d) => {
    const x = d.data() || {};
    if (String(x.conta || "").toUpperCase() !== "CAIXA DIARIO") return;

    const raw =
      (x.dataLancamento && typeof x.dataLancamento.toDate === "function" ? x.dataLancamento.toDate() : x.dataLancamento) ||
      (x.dataPrevista   && typeof x.dataPrevista.toDate   === "function" ? x.dataPrevista.toDate()   : x.dataPrevista)   ||
      x.data;

    if (!raw) return;
    const t = toDateLoose(raw);
    if (!t) return;
    if (t >= ini && t < fim) {
      const v = safeNumber(x.valor ?? (safeNumber(x.valorUnit) * safeNumber(x.quantidade)));
      totalDoDia += v;
    }
  });

  let valorFechar = valorParcial == null ? totalDoDia : safeNumber(valorParcial);
  if (valorFechar <= 0) return { criado: false, motivo: "valor_zero" };
  if (valorFechar > totalDoDia && totalDoDia > 0) valorFechar = totalDoDia;

  const ymdBanco = toYMD(bancoD);
  const ymdOrig  = toYMD(base);
  const ordemFechamentoMs = Date.now();            // <<<<< garante sequência
  const idFech   = `FECH_${ymdOrig}_${ordemFechamentoMs}`;

  // Banco
  await setDoc(
    doc(db, COL_FLUXO, idFech),
    {
      origem: "FECHAMENTO_CAIXA",
      conta: "EXTRATO BANCARIO",
      statusFinanceiro: "Realizado",
      dataRealizado: ymdBanco,
      dataOrigem: ymdOrig,
      descricao: `Fechamento Caixa • ${brDate(base)}`,
      formaPagamento: "Fechamento",
      valorRealizado: safeNumber(valorFechar),
      ordemFechamentoMs,                         // <<<<<
      criadoEm: serverTimestamp(),
      atualizadoEm: serverTimestamp(),
    },
    { merge: true }
  );

  // Caixa: saída (negativa)
  await addDoc(collection(db, COL_AVULSOS), {
    fechamento: true,
    conta: "CAIXA DIARIO",
    situacao: "Realizado",
    pdv: "VAREJO",
    produto: "FECHAMENTO",
    quantidade: 1,
    valorUnit: -safeNumber(valorFechar),
    valor: -safeNumber(valorFechar),
    formaPagamento: "Fechamento",
    descricao: `Fechamento Caixa • ${brDate(base)}`,
    data: toYMD(base),
    dataLancamento: Timestamp.fromDate(new Date(base)),
    dataPrevista: null,
    fechado: true,
    bancoRef: idFech,
    bancoData: ymdBanco,
    ordemFechamentoMs,                         // <<<<<
    criadoEm: serverTimestamp(),
    atualizadoEm: serverTimestamp(),
  });

  return { criado: true, total: safeNumber(valorFechar) };
}

// alias
export function fecharCaixaParcial(args) { return fecharCaixaDiario(args); }

/* ================== EXTRATO BANCÁRIO (PREV + REAL) ================= */

function montarLinhaPrevisto(id, d) {
  const valor = safeNumber(d.valorPrevisto != null ? d.valorPrevisto : d.valor);
  const data =
    d.dataPrevista ||
    anyToYMD(d.vencimento) ||
    anyToYMD(d.criadoEm) ||
    anyToYMD(d.createdEm);

  const ord =
    tsMs(d.criadoEm) ||
    tsMs(d.atualizadoEm) ||
    0;

  return {
    id,
    origem: "Previsto",
    data,
    descricao: `PEDIDO • ${d.pdv || d.escola || "-"}`,
    forma: d.formaPagamento || "",
    valor,
    ord,
  };
}
function montarLinhaRealizado(id, d) {
  const valor = safeNumber(d.valorRealizado != null ? d.valorRealizado : d.valor);
  const data = d.dataRealizado || anyToYMD(d.data);
  const ord =
    Number(d.ordemFechamentoMs ?? 0) ||
    tsMs(d.criadoEm) ||
    // fallback: tenta extrair do id FECH_YYYY-MM-DD_<ms>
    (() => { const p = String(id).split("_").pop(); const n = Number(p); return Number.isFinite(n) ? n : 0; })();

  return {
    id,
    origem: "Realizado",
    data,
    descricao: d.descricao || "Crédito em conta",
    forma: d.formaPagamento || "",
    valor,
    ord,
  };
}

export function listenExtratoBancario(ano, mes, onChange, onError) {
  const { ini, fim } = monthRange(ano, mes);
  return listenExtratoBancarioRange(ini, fim, onChange, onError);
}
export function listenExtratoBancarioRange(inicio, fimInc, onChange, onError) {
  const { ini, fim } = rangeFromInputs(inicio, fimInc);
  const iniY = toYMD(ini);
  const fimY = toYMD(new Date(fim.getTime() - 86400000));
  try {
    const col = collection(db, COL_FLUXO);
    return onSnapshot(
      col,
      (snap) => {
        const prev = [];
        const real = [];
        snap.forEach((ds) => {
          const d = ds.data() || {};
          if (String(d.statusFinanceiro || "").toLowerCase() === "previsto") {
            const ymd = d.dataPrevista || anyToYMD(d.vencimento);
            if (ymd && inRangeYMD(ymd, ini, fim)) prev.push(montarLinhaPrevisto(ds.id, d));
            return;
          }
          if (String(d.conta || "").toUpperCase().includes("EXTRATO")) {
            const ymd = d.dataRealizado || anyToYMD(d.data);
            if (ymd && inRangeYMD(ymd, ini, fim)) real.push(montarLinhaRealizado(ds.id, d));
          }
        });

        const linhas = [...prev, ...real];
        linhas.sort((a, b) => {
          if (a.data === b.data) return (a.ord || 0) - (b.ord || 0);
          return a.data.localeCompare(b.data);
        });

        const totPrev = prev.reduce((s, l) => s + safeNumber(l.valor), 0);
        const totBan  = real.reduce((s, l) => s + safeNumber(l.valor), 0);
        onChange && onChange({ linhas, totPrev, totBan, periodo: { de: iniY, ate: fimY } });
      },
      (e) => onError && onError(e)
    );
  } catch (e) {
    onError && onError(e);
    return () => {};
  }
}

/* ============== PREVISTOS (LanPed → financeiro_fluxo) ============== */

export async function upsertPrevistoFromLanPed(pedidoId, dados) {
  const agora = serverTimestamp();
  let valor = dados && dados.valorTotal != null ? dados.valorTotal : somaValorPedido(dados || {});
  valor = safeNumber(valor);
  let dataPrevista = "";
  if (typeof dados?.dataVencimento === "string") dataPrevista = dados.dataVencimento;
  else if (dados && dados.vencimento) dataPrevista = anyToYMD(dados.vencimento);
  await setDoc(
    doc(db, COL_FLUXO, pedidoId),
    {
      origem: "PEDIDO",
      pedidoId,
      conta: "EXTRATO BANCARIO",
      statusFinanceiro: "Previsto",
      cidade: dados?.cidade || "",
      pdv: dados?.pdv || dados?.escola || "",
      formaPagamento: dados?.formaPagamento || "",
      dataPrevista,
      valorPrevisto: valor,
      valorRealizado: 0,
      criadoEm: dados?.criadoEm || dados?.createdEm || agora,
      atualizadoEm: agora,
    },
    { merge: true }
  );
}
export async function marcarRealizado(pedidoId, { dataRealizado = new Date(), valor = null } = {}) {
  await setDoc(
    doc(db, COL_FLUXO, pedidoId),
    {
      statusFinanceiro: "Realizado",
      conta: "EXTRATO BANCARIO",
      dataRealizado: toYMD(dataRealizado),
      valorRealizado: valor == null ? undefined : safeNumber(valor),
      atualizadoEm: serverTimestamp(),
    },
    { merge: true }
  );
}

/** Backfill de PREVISTOS do mês a partir de PEDIDOS. */
export async function backfillPrevistosDoMes(ano, mes) {
  const { ini, fim } = monthRange(ano, mes);
  const ref = collection(db, COL_PEDIDOS);
  let docs = [];
  try {
    const qA = query(
      ref,
      where("createdEm", ">=", Timestamp.fromDate(ini)),
      where("createdEm", "<", Timestamp.fromDate(fim))
    );
    const qB = query(
      ref,
      where("criadoEm", ">=", Timestamp.fromDate(ini)),
      where("criadoEm", "<", Timestamp.fromDate(fim))
    );
    const [sA, sB] = await Promise.all([getDocs(qA), getDocs(qB)]);
    const map = new Map();
    sA.docs?.forEach((d) => map.set(d.id, d));
    sB.docs?.forEach((d) => map.set(d.id, d));
    docs = Array.from(map.values());
  } catch {
    const sAll = await getDocs(ref);
    sAll.forEach((d) => {
      const x = d.data() || {};
      const carimbo =
        (x.createdEm && typeof x.createdEm.toDate === "function" ? x.createdEm.toDate() : x.createdEm) ||
        (x.criadoEm && typeof x.criadoEm.toDate === "function" ? x.criadoEm.toDate() : x.criadoEm) ||
        (x.atualizadoEm && typeof x.atualizadoEm.toDate === "function" ? x.atualizadoEm.toDate() : x.atualizadoEm);
      if (!carimbo) return;
      if (carimbo >= ini && carimbo < fim) docs.push(d);
    });
  }
  let gerados = 0;
  for (const ds of docs) {
    const x = ds.data() || {};
    const itens = Array.isArray(x.itens) ? x.itens : [];
    let valor = x.total != null ? Number(x.total) : somaValorPedido({ itens });
    valor = safeNumber(valor);
    let venc = "";
    if (typeof x.dataVencimento === "string" && x.dataVencimento) {
      venc = x.dataVencimento.slice(0, 10);
    } else if (x.dataVencimento && typeof x.dataVencimento.toDate === "function") {
      venc = toYMD(x.dataVencimento.toDate());
    } else if (x.vencimento) {
      venc = anyToYMD(x.vencimento);
    } else if (x.dataPrevista) {
      venc = anyToYMD(x.dataPrevista);
    }
    try {
      await setDoc(
        doc(db, COL_FLUXO, ds.id),
        {
          origem: "PEDIDO",
          pedidoId: ds.id,
          conta: "EXTRATO BANCARIO",
          statusFinanceiro: "Previsto",
          cidade: x.cidade || "",
          pdv: x.escola || x.pdv || "",
          formaPagamento: x.formaPagamento || "",
          dataPrevista: venc || anyToYMD(x.criadoEm || x.createdEm || ini),
          valorPrevisto: valor,
          atualizadoEm: serverTimestamp(),
        },
        { merge: true }
      );
      gerados++;
    } catch { /* segue */ }
  }
  return { processados: docs.length, previstosGerados: gerados };
}

/** Migra avulsos antigos para o fluxo (conta CAIXA DIARIO; opcional). */
export async function migrarAvulsosAntigos(ano, mes) {
  const { ini } = monthRange(ano, mes);
  const ym = `${ini.getFullYear()}-${String(ini.getMonth() + 1).padStart(2, "0")}`;
  const snap = await getDocs(collection(db, COL_AVULSOS));
  let criados = 0;
  for (const ds of snap.docs) {
    const x = ds.data() || {};
    const ymd = anyToYMD(x.dataLancamento || x.dataPrevista || x.data);
    if (!ymd) continue;
    if (ymd.slice(0, 7) !== ym) continue;
    let valorCalc = x.valor;
    if (valorCalc == null) {
      const vUnit = safeNumber(x.valorUnit);
      const qtd   = safeNumber(x.quantidade);
      valorCalc   = vUnit * qtd;
    }
    const valor = safeNumber(valorCalc);
    try {
      await setDoc(
        doc(db, COL_FLUXO, `AV_${ds.id}`),
        {
          origem: "AVULSO",
          conta: "CAIXA DIARIO",
          statusFinanceiro: "Realizado",
          dataRealizado: ymd,
          descricao: `${x.pdv || "VAREJO"} • ${x.produto || ""} x${x.quantidade ?? ""}`,
          formaPagamento: x.formaPagamento || "",
          valorRealizado: valor,
          criadoEm: x.criadoEm || serverTimestamp(),
          atualizadoEm: serverTimestamp(),
        },
        { merge: true }
      );
      criados++;
    } catch { /* ignora */ }
  }
  return { migrados: criados };
                                               }
// === Atualizações/remoções para o fluxo financeiro ===
import { doc, getDoc, updateDoc, deleteDoc, serverTimestamp } from "firebase/firestore";
import db from "../firebase";

/**
 * Marca um lançamento como Realizado (ou volta para Previsto).
 * - Atualiza campos redundantes usados pelo Extrato.
 * - Copia o valor previsto para valorRealizado quando realizar.
 */
export async function marcarRealizado(lancId, realizado = true) {
  const ref = doc(db, "financeiro_fluxo", lancId);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error("Lançamento não encontrado.");

  const d = snap.data();
  const base = Number(d?.valorPrevisto ?? d?.valor ?? 0);
  const saida = base < 0; // manter sinal
  const valorReal = realizado ? base : 0;

  const upd = {
    atualizadoEm: serverTimestamp(),
    status: realizado ? "Realizado" : "Previsto",
    statusFinanceiro: realizado ? "Realizado" : "Previsto",
    tipo: realizado ? "Realizado" : "Previsto",
    valorRealizado: valorReal,
  };

  // carimbo de data de realização (só na ida para Realizado)
  if (realizado && !d?.dataRealizado) upd.dataRealizado = new Date();

  await updateDoc(ref, upd);
}

/** Remove definitivamente um lançamento */
export async function excluirLancamento(lancId) {
  const ref = doc(db, "financeiro_fluxo", lancId);
  await deleteDoc(ref);
}

/**
 * Prepara dados de edição: salva no localStorage e informa qual tela abrir.
 * NÃO altera nenhuma tela existente; a tela de destino (se desejar)
 * pode ler "editar_financeiro" do localStorage.
 */
export function prepararEdicaoLancamento(lanc) {
  const payload = {
    id: lanc.id,
    origem: lanc.origem || (Number(lanc?.valorPrevisto ?? lanc?.valor ?? 0) < 0 ? "PAGAR" : "RECEBER"),
    data: lanc.dataPrevista || lanc.dataLancamento || lanc.data,
    formaPagamento: lanc.formaPagamento || "",
    planoContas: lanc.planoContas || "",
    planoNome: lanc.planoNome || "",
    descricao: lanc.descricao || lanc.titulo || lanc.memo || "",
    valor: Number(lanc?.valorPrevisto ?? lanc?.valor ?? 0),
  };
  localStorage.setItem("editar_financeiro", JSON.stringify(payload));
  // retorna sugestão de tela
  return payload.origem === "PAGAR" ? "CtsPagar" : "CtsReceberAvulso";
}

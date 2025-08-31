// src/util/financeiro_store.js
import db from "../firebase";
import {
  addDoc, collection, doc, getDoc, getDocs, onSnapshot, query,
  setDoc, updateDoc, where, orderBy, serverTimestamp, Timestamp
} from "firebase/firestore";
import { semanaRefFromDate } from "./Ciclo";

/* =================================================================== */
/* Helpers                                                              */
/* =================================================================== */

const COL_FLUXO   = "financeiro_fluxo"; // previsão/realização consolidadas
const COL_AVULSOS = "CR_AVULSOS";       // origem dos avulsos (varejo)
const COL_SALDOS  = "financeiro_saldos";// saldos iniciais (por mês)

/** Soma itens do pedido (qtd × preço). */
function somaValorPedido(pedido = {}) {
  const itens = Array.isArray(pedido.itens) ? pedido.itens : [];
  return itens.reduce((acc, it) => {
    const q = Number(it.qtd ?? it.quantidade ?? it.qtde ?? 0);
    const preco = Number(
      it.preco ?? it.preço ?? it.valor ?? it.valorUnitario ?? it.vl ?? 0
    );
    return acc + q * (isFinite(preco) ? preco : 0);
  }, 0);
}

/** YYYY-MM-DD (string). */
function toYMD(d) {
  const x = d instanceof Date ? d : new Date(d);
  const mm = String(x.getMonth() + 1).padStart(2, "0");
  const dd = String(x.getDate()).padStart(2, "0");
  return `${x.getFullYear()}-${mm}-${dd}`;
}

/** Converte qualquer coisa plausível em "YYYY-MM-DD". */
function anyToYMD(v) {
  if (!v) return "";
  if (typeof v === "string") return v.slice(0, 10);
  if (v instanceof Date) return toYMD(v);
  if (typeof v?.toDate === "function") return toYMD(v.toDate());
  try { return toYMD(new Date(v)); } catch { return ""; }
}

/** Range do mês (Date ini, Date fim-exclusive). */
function monthRange(ano, mes) {
  const ini = new Date(ano, mes - 1, 1, 0, 0, 0, 0);
  const fim = new Date(ano, mes, 1, 0, 0, 0, 0); // exclusivo
  return { ini, fim };
}

/** Dentro do mês? (compara por Date) */
function inMonth(dateLike, ano, mes) {
  if (!dateLike) return false;
  const d = dateLike instanceof Date ? dateLike : new Date(dateLike);
  return d.getFullYear() === ano && (d.getMonth() + 1) === mes;
}

/** Agrupa linhas (com campo ymd) por dia, computando saldos. */
function groupByDayWithBalances(linhas, saldoInicial = 0) {
  const map = new Map(); // ymd -> {linhas:[], totalDia:number}
  linhas.forEach(l => {
    const ymd = l.ymd;
    if (!map.has(ymd)) map.set(ymd, { ymd, linhas: [], totalDia: 0 });
    map.get(ymd).linhas.push(l);
    map.get(ymd).totalDia += Number(l.valor || 0);
  });

  // ordena por data e calcula saldo inicial/final do dia (acumulando)
  const dias = Array.from(map.values()).sort((a, b) => a.ymd.localeCompare(b.ymd));
  let running = Number(saldoInicial || 0);
  dias.forEach(dia => {
    dia.saldoInicial = running;
    dia.saldoFinal   = running + dia.totalDia;
    running          = dia.saldoFinal;
  });

  return { dias, saldoFinal: running };
}

/* =================================================================== */
/* 1) PREVISTOS (LanPed) → FLUXO                                        */
/* =================================================================== */

/**
 * Chamado no SALVAR do LanPed (logo após gravar PEDIDOS/{id}).
 * Cria/atualiza o RECEBÍVEL como PREVISTO (conta: CAIXA FLUTUANTE).
 */
export async function upsertPrevistoFromLanPed(pedidoId, dados) {
  const agora = serverTimestamp();

  let criadoBase = new Date();
  if (dados?.criadoEm instanceof Date) criadoBase = dados.criadoEm;
  else if (dados?.createdEm instanceof Date) criadoBase = dados.createdEm;

  const { path: competenciaPath } = semanaRefFromDate(criadoBase);
  const valor = Number(dados?.valorTotal ?? 0) || somaValorPedido(dados || {});

  let dataPrevista = "";
  if (typeof dados?.vencimento === "string") dataPrevista = dados.vencimento;
  else if (dados?.vencimento) dataPrevista = toYMD(dados.vencimento);

  await setDoc(
    doc(db, COL_FLUXO, pedidoId),
    {
      origem: "PEDIDO",
      pedidoId,
      conta: "CAIXA FLUTUANTE",
      statusFinanceiro: "Previsto",

      cidade: dados?.cidade || "",
      pdv: dados?.pdv || dados?.escola || "",
      formaPagamento: dados?.formaPagamento || "",

      dataPrevista,                // vencimento do LanPed (YYYY-MM-DD)
      valorPrevisto: Number(valor) || 0,
      valorRealizado: 0,

      competenciaPath,
      criadoEm: dados?.criadoEm || dados?.createdEm || agora,
      atualizadoEm: agora,
    },
    { merge: true }
  );
}

/** Confirma crédito (quando de fato cair no banco). */
export async function marcarRealizado(pedidoId, { dataRealizado = new Date(), valor = null } = {}) {
  await setDoc(
    doc(db, COL_FLUXO, pedidoId),
    {
      statusFinanceiro: "Realizado",
      conta: "EXTRATO BANCARIO",
      dataRealizado: toYMD(dataRealizado),
      valorRealizado: valor ?? undefined,
      atualizadoEm: serverTimestamp(),
    },
    { merge: true }
  );
}

/* =================================================================== */
/* 2) LISTEN — CAIXA DIÁRIO e EXTRATO BANCÁRIO (por MÊS)                */
/* =================================================================== */

/**
 * Ouve o CAIXA DIÁRIO do mês (avulsos já migrados para financeiro_fluxo).
 * onChange recebe: { linhas, total, porDia, saldoFinal }
 */
export function listenCaixaDiarioMes(ano, mes, onChange, onError) {
  try {
    const col = collection(db, COL_FLUXO);
    // pegamos tudo com conta=CAIXA DIARIO e filtramos mês no cliente
    const q = query(col, where("conta", "==", "CAIXA DIARIO"));
    return onSnapshot(q, (snap) => {
      const linhas = [];
      snap.forEach((d) => {
        const x = d.data() || {};
        if (String(x.statusFinanceiro) !== "Realizado") return;
        const ymd = anyToYMD(x.dataRealizado || x.dataPrevista);
        const dObj = ymd ? new Date(ymd + "T00:00:00") : null;
        if (!inMonth(dObj, ano, mes)) return;

        const valor = Number(x.valorRealizado ?? x.valor ?? 0);
        linhas.push({
          id: d.id,
          ymd,
          data: dObj,
          descricao: x.descricao || `${x.pdv || "VAREJO"} • ${x.produto || ""}`,
          forma: x.formaPagamento || x.forma || "",
          valor,
          fechado: !!x.fechado,
        });
      });

      linhas.sort((a, b) => a.ymd.localeCompare(b.ymd));
      const total = linhas.reduce((s, l) => s + Number(l.valor || 0), 0);

      // saldo inicial do período (puxado do doc de saldos; caso não exista, 0)
      // Mas aqui só computamos estrutura; quem sabe o valor é o listener de saldos
      const porDia = groupByDayWithBalances(linhas, 0);

      onChange && onChange({
        linhas, total,
        porDia: porDia.dias,
        saldoFinal: porDia.saldoFinal
      });
    }, (e) => onError && onError(e));
  } catch (e) {
    onError && onError(e);
    return () => {};
  }
}

/**
 * Ouve o EXTRATO BANCÁRIO do mês (Previstos do LanPed + Realizados do Banco).
 * onChange recebe: { linhas, totPrev, totBan, porDiaPrev, porDiaBan }
 */
export function listenExtratoBancarioMes(ano, mes, onChange, onError) {
  try {
    const col = collection(db, COL_FLUXO);
    // dois listeners em um snapshot: pegamos tudo e filtramos no cliente
    const q = query(col, orderBy("atualizadoEm", "desc")); // não exige índice custom

    return onSnapshot(q, (snap) => {
      const prevs = [];
      const reals = [];

      snap.forEach((d) => {
        const x = d.data() || {};
        const status = String(x.statusFinanceiro || "");
        if (status !== "Previsto" && status !== "Realizado") return;

        if (status === "Previsto") {
          const ymd = anyToYMD(x.dataPrevista);
          const dObj = ymd ? new Date(ymd + "T00:00:00") : null;
          if (!inMonth(dObj, ano, mes)) return;

          prevs.push({
            id: d.id,
            ymd,
            data: dObj,
            origem: "Previsto",
            descricao: `PEDIDO • ${x.pdv || "-"}`,
            forma: x.formaPagamento || x.forma || "",
            valor: Number(x.valorPrevisto ?? x.valor ?? 0),
          });
        } else {
          const ymd = anyToYMD(x.dataRealizado);
          const dObj = ymd ? new Date(ymd + "T00:00:00") : null;
          if (!inMonth(dObj, ano, mes)) return;
          reals.push({
            id: d.id,
            ymd,
            data: dObj,
            origem: "Realizado",
            descricao: x.descricao || `BANCO • ${x.pdv || ""}`,
            forma: x.formaPagamento || x.forma || "",
            valor: Number(x.valorRealizado ?? x.valor ?? 0),
          });
        }
      });

      prevs.sort((a, b) => a.ymd.localeCompare(b.ymd));
      reals.sort((a, b) => a.ymd.localeCompare(b.ymd));

      const totPrev = prevs.reduce((s, l) => s + Number(l.valor || 0), 0);
      const totBan  = reals.reduce((s, l) => s + Number(l.valor || 0), 0);

      const porDiaPrev = groupByDayWithBalances(prevs, 0);
      const porDiaBan  = groupByDayWithBalances(reals, 0);

      onChange && onChange({
        linhas: [...prevs, ...reals].sort((a, b)=> a.ymd.localeCompare(b.ymd)),
        totPrev, totBan,
        porDiaPrev: porDiaPrev.dias,
        porDiaBan: porDiaBan.dias,
      });
    }, (e) => onError && onError(e));
  } catch (e) {
    onError && onError(e);
    return () => {};
  }
}

/* Aliases para compatibilidade com versões antigas do FluxCx.jsx */
export const listenCaixaDiario     = listenCaixaDiarioMes;
export const listenExtratoBancario = listenExtratoBancarioMes;

/* =================================================================== */
/* 3) SALDOS INICIAIS (por mês)                                         */
/* =================================================================== */

function saldosDocRef(ano, mes) {
  const mm = String(mes).padStart(2, "0");
  return doc(db, COL_SALDOS, `${ano}-${mm}`);
}

export function listenSaldosIniciais(ano, mes, onChange, onError) {
  try {
    const ref = saldosDocRef(ano, mes);
    return onSnapshot(ref, (snap) => {
      const d = snap.data() || {};
      onChange && onChange({
        caixaInicial: Number(d.caixaInicial || 0),
        bancoInicial: Number(d.bancoInicial || 0),
      });
    }, (e) => onError && onError(e));
  } catch (e) {
    onError && onError(e);
    return () => {};
  }
}

export async function salvarSaldosIniciais(ano, mes, { caixaInicial = 0, bancoInicial = 0 }) {
  const ref = saldosDocRef(ano, mes);
  await setDoc(ref, {
    caixaInicial: Number(caixaInicial || 0),
    bancoInicial: Number(bancoInicial || 0),
    atualizadoEm: serverTimestamp(),
  }, { merge: true });
}

/* =================================================================== */
/* 4) FECHAMENTO DO CAIXA (consolida no EXTRATO BANCÁRIO)               */
/* =================================================================== */

/**
 * Soma os lançamentos do CAIXA DIÁRIO do dia (não fechados) e cria
 * um único lançamento REALIZADO no EXTRATO BANCÁRIO na data informada.
 * Também marca os lançamentos do dia como `fechado: true`.
 */
export async function fecharCaixaDiario({ diaOrigem, dataBanco }) {
  const ymdOrig = anyToYMD(diaOrigem || new Date());
  const ymdBank = anyToYMD(dataBanco || new Date());

  // carrega todos CAIXA DIARIO e filtra por data do dia + não-fechado
  const ref = collection(db, COL_FLUXO);
  const q = query(ref, where("conta", "==", "CAIXA DIARIO"));
  const snap = await getDocs(q);

  const doDia = [];
  snap.forEach((d) => {
    const x = d.data() || {};
    if (String(x.statusFinanceiro) !== "Realizado") return;
    if (x.fechado) return;
    const y = anyToYMD(x.dataRealizado || x.dataPrevista);
    if (y === ymdOrig) doDia.push({ id: d.id, ...x });
  });

  if (doDia.length === 0) return { criado: false, itens: 0, total: 0 };

  // soma total do dia
  let total = 0;
  for (const it of doDia) {
    const valor = Number(it.valorRealizado ?? it.valor ?? 0);
    total += valor;
  }

  // cria lançamento consolidado no BANCO
  const novo = {
    origem: "FECHAMENTO_CAIXA",
    conta: "EXTRATO BANCARIO",
    statusFinanceiro: "Realizado",
    dataRealizado: ymdBank,
    valorRealizado: Number(total || 0),
    descricao: `Fechamento caixa ${ymdOrig}`,
    criadoEm: serverTimestamp(),
    atualizadoEm: serverTimestamp(),
  };
  await addDoc(collection(db, COL_FLUXO), novo);

  // marca itens do dia como fechados
  for (const it of doDia) {
    await updateDoc(doc(db, COL_FLUXO, it.id), {
      fechado: true,
      fechadoEm: serverTimestamp(),
      atualizadoEm: serverTimestamp(),
    });
  }

  return { criado: true, itens: doDia.length, total };
}

/* =================================================================== */
/* 5) BACKFILL / MIGRAÇÃO                                               */
/* =================================================================== */

/** Backfill dos PREVISTOS (LanPed) para um mês específico (vencimento no mês). */
export async function backfillPrevistosDoMes(ano, mes) {
  // coleta PEDIDOS com dataVencimento no mês escolhido
  const { ini, fim } = monthRange(ano, mes);
  const ref = collection(db, "PEDIDOS");
  let docs = [];
  try {
    // se existir índice por dataVencimento (string YYYY-MM-DD) dá pra filtrar;
    // como não garantimos, buscamos tudo e filtramos no cliente.
    const all = await getDocs(ref);
    all.forEach((d) => {
      const x = d.data() || {};
      const ymd = anyToYMD(x.dataVencimento);
      if (!ymd) return;
      const dObj = new Date(ymd + "T00:00:00");
      if (dObj >= ini && dObj < fim) docs.push({ id: d.id, data: x });
    });
  } catch {
    // fallback já é pegar tudo e filtrar (acima)
  }

  let ok = 0;
  for (const { id, data } of docs) {
    try {
      const itens = Array.isArray(data.itens) ? data.itens : [];
      const valor = Number(data.total || 0) || somaValorPedido({ itens });

      await setDoc(
        doc(db, COL_FLUXO, id),
        {
          origem: "PEDIDO",
          pedidoId: id,
          conta: "CAIXA FLUTUANTE",
          statusFinanceiro: "Previsto",
          cidade: data.cidade || "",
          pdv: data.escola || data.pdv || "",
          formaPagamento: data.formaPagamento || "",
          dataPrevista: anyToYMD(data.dataVencimento),
          valorPrevisto: Number(valor || 0),
          valorRealizado: Number(0),
          criadoEm: data.criadoEm || data.createdEm || serverTimestamp(),
          atualizadoEm: serverTimestamp(),
        },
        { merge: true }
      );
      ok++;
    } catch {
      // segue
    }
  }
  return { totalProcessados: docs.length, previstosGerados: ok };
}

/** Migra AVULSOS do mês (coleção CR_AVULSOS) para o FLUXO (CAIXA DIARIO). */
export async function migrarAvulsosAntigos(ano, mes) {
  const { ini, fim } = monthRange(ano, mes);
  const ref = collection(db, COL_AVULSOS);
  const snap = await getDocs(ref);

  let criados = 0;
  snap.forEach(async (d) => {
    const x = d.data() || {};
    const ymd = anyToYMD(x.dataLancamento || x.dataPrevista);
    if (!ymd) return;
    const dObj = new Date(ymd + "T00:00:00");
    if (!(dObj >= ini && dObj < fim)) return;

    // doc idempotente (prefixo AV_)
    const idFluxo = "AV_" + d.id;

    const valor = Number(x.valor ?? (Number(x.valorUnit || 0) * Number(x.quantidade || 0)) || 0);

    try {
      await setDoc(
        doc(db, COL_FLUXO, idFluxo),
        {
          origem: "AVULSO",
          conta: "CAIXA DIARIO",
          statusFinanceiro: "Realizado",
          pdv: x.pdv || "VAREJO",
          cidade: x.cidade || "",
          formaPagamento: x.formaPagamento || "",
          descricao: `${x.pdv || "VAREJO"} • ${x.produto || ""} x${x.quantidade ?? ""}`,
          dataRealizado: ymd,
          valorRealizado: Number(valor || 0),
          criadoEm: x.criadoEm || serverTimestamp(),
          atualizadoEm: serverTimestamp(),
        },
        { merge: true }
      );
      criados++;
    } catch {
      // ignora e segue
    }
  });

  return { migrados: criados };
}

/* =================================================================== */
/* 6) Backfill semanal legado (compat)                                   */
/* =================================================================== */

/** Versão semanal (legada) — mantida para compatibilidade. */
export async function backfillPrevistosSemanaAtual() {
  // usa janela base de semana (segunda 11h → próxima segunda 11h)
  const d = new Date();
  const dow = (d.getDay() + 6) % 7;
  d.setHours(11, 0, 0, 0);
  d.setDate(d.getDate() - dow);
  const ini = new Date(d);
  const fim = new Date(d); fim.setDate(fim.getDate() + 7);

  const ref = collection(db, "PEDIDOS");
  const snap = await getDocs(ref);

  const docs = [];
  snap.forEach((s) => {
    const x = s.data() || {};
    const carimbo =
      x.createdEm?.toDate?.() ||
      x.criadoEm?.toDate?.() ||
      x.atualizadoEm?.toDate?.() ||
      null;
    if (carimbo && carimbo >= ini && carimbo < fim) docs.push({ id: s.id, data: x });
  });

  let ok = 0;
  for (const { id, data } of docs) {
    try {
      await upsertPrevistoFromLanPed(id, {
        cidade: data.cidade,
        pdv: data.escola || data.pdv,
        itens: Array.isArray(data.itens) ? data.itens : [],
        formaPagamento: data.formaPagamento || "",
        vencimento: anyToYMD(data.dataVencimento),
        valorTotal: Number(data.total || 0) || somaValorPedido(data),
        criadoEm: carimboDate(data),
      });
      ok++;
    } catch {}
  }
  return { totalProcessados: docs.length, previstosGerados: ok };

  function carimboDate(d) {
    return d.criadoEm?.toDate?.() || d.createdEm?.toDate?.() || new Date();
  }
               }

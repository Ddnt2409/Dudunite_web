// src/util/financeiro_store.js
import db from "../firebase";
import {
  collection,
  doc,
  addDoc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  serverTimestamp,
  Timestamp,
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

/** Listener do Caixa */
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

          linhas.push({
            id: ds.id,
            data: ymd,
            descricao: d.fechamento
              ? (d.descricao || `Fechamento Caixa • ${brDate(d.dataLancamento || d.data)}`)
              : `${d.pdv || "VAREJO"} • ${d.produto || ""}${d.quantidade ? ` x${d.quantidade}` : ""}`,
            forma: d.formaPagamento || (d.fechamento ? "Fechamento" : ""),
            valor,
            fechado: !!d.fechado || !!d.fechamento,
          });
          total += valor;
        });

        linhas.sort((a, b) => a.data.localeCompare(b.data));
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
 * Fechamento (total/parcial)
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
  const idFech   = `FECH_${ymdOrig}_${Date.now()}`;

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
      criadoEm: serverTimestamp(),
      atualizadoEm: serverTimestamp(),
    },
    { merge: true }
  );

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
    criadoEm: serverTimestamp(),
    atualizadoEm: serverTimestamp(),
  });

  return { criado: true, total: safeNumber(valorFechar) };
}

export function fecharCaixaParcial(args) { return fecharCaixaDiario(args); }

/* ================== EXTRATO BANCÁRIO (PREV + REAL) ================= */

function montarLinhaPrevisto(id, d) {
  const valor = safeNumber(d.valorPrevisto != null ? d.valorPrevisto : d.valor);
  const data =
    d.dataPrevista ||
    anyToYMD(d.vencimento) ||
    anyToYMD(d.criadoEm) ||
    anyToYMD(d.createdEm);

  // sem prefixo "PEDIDO •"
  const desc =
    (d.descricao && String(d.descricao).trim()) ||
    (d.planoContas && String(d.planoContas).trim()) ||
    (d.pdv || d.escola || "");

  return {
    id,
    origem: "Previsto",
    data,
    descricao: desc,
    planoContas: d.planoContas || "",
    forma: d.formaPagamento || "",
    valor,
  };
}

function montarLinhaRealizado(id, d) {
  const valor = safeNumber(d.valorRealizado != null ? d.valorRealizado : d.valor);
  const data = d.dataRealizado || anyToYMD(d.data);

  // sem prefixo "PEDIDO •"
  const desc =
    (d.descricao && String(d.descricao).trim()) ||
    (d.planoContas && String(d.planoContas).trim()) ||
    (d.pdv || d.escola || "Crédito em conta");

  return {
    id,
    origem: "Realizado",
    data,
    descricao: desc,
    planoContas: d.planoContas || "",
    forma: d.formaPagamento || "",
    valor,
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
        const linhas = [...prev, ...real].sort((x, y) => x.data.localeCompare(y.data));
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

/* ============== PREVISTOS (CtsPagar → financeiro_fluxo) ============== */
/** Cria lançamentos PREVISTOS de pagar no EXTRATO BANCARIO.
 *  `lancs`: [{ dataPrevista, valor, forma, planoContas, descricao, meta? }, ...]
 *  Retorna: { ids: string[], count: number }
 */
export async function criarPrevistosPagar(lancs = []) {
  const batchIds = [];
  for (let i = 0; i < lancs.length; i++) {
    const it = lancs[i] || {};
    const id = `PAGAR_${Date.now().toString(36)}_${i}_${Math.random().toString(36).slice(2,6)}`;
    await setDoc(
      doc(db, COL_FLUXO, id),
      {
        origem: "PAGAR",
        conta: "EXTRATO BANCARIO",
        statusFinanceiro: "Previsto",
        lado: "SAIDA",
        tipo: "PAGAR",

        dataPrevista: anyToYMD(it.dataPrevista) || toYMD(new Date()),
        valorPrevisto: -Math.abs(Number(it.valor || 0)), // saída negativa
        valorRealizado: null,

        formaPagamento: it.forma || "",
        planoContas: it.planoContas || "",
        descricao: it.descricao || "PAGAMENTO",

        meta: it.meta || null,
        criadoEm: serverTimestamp(),
        atualizadoEm: serverTimestamp(),
      },
      { merge: true }
    );
    batchIds.push(id);
  }
  return { ids: batchIds, count: batchIds.length };
}

/* ============== UTIL/MANUTENÇÃO (opcionais) ============== */

/** Recria/garante previstos de PEDIDOS do mês informado. */
export async function backfillPrevistosDoMes(ano, mes) {
  const { ini, fim } = monthRange(ano, mes);
  const snap = await getDocs(collection(db, COL_PEDIDOS));
  let count = 0;
  for (const ds of snap.docs) {
    const d = ds.data() || {};
    // tenta usar data de vencimento; se não houver, usa criadoEm
    const ven = anyToYMD(d.dataVencimento || d.vencimento);
    const created = d.criadoEm && typeof d.criadoEm.toDate === "function" ? d.criadoEm.toDate() : d.criadoEm;
    const dRef = ven ? new Date(`${ven}T00:00:00`) : toDateLoose(created) || null;
    if (!dRef) continue;
    if (dRef >= ini && dRef < fim) {
      await upsertPrevistoFromLanPed(ds.id, d);
      count++;
    }
  }
  return { count };
}

export async function migrarAvulsosAntigos(/* ano, mes */) {
  // no-op simples para compatibilidade; ajuste se precisar migrar dados legados
  return { migrados: 0 };
}

/* ============== CRUD básicos (fluxo/avulso) ============== */

export async function atualizarFluxo(id, patch = {}) {
  if (!id) throw new Error("ID obrigatório");
  await updateDoc(doc(db, COL_FLUXO, id), { ...patch, atualizadoEm: serverTimestamp() });
}

export async function excluirFluxo(id) {
  if (!id) throw new Error("ID obrigatório");
  await deleteDoc(doc(db, COL_FLUXO, id));
}

export async function atualizarAvulso(id, patch = {}) {
  if (!id) throw new Error("ID obrigatório");
  await updateDoc(doc(db, COL_AVULSOS, id), { ...patch, atualizadoEm: serverTimestamp() });
}

export async function excluirAvulso(id) {
  if (!id) throw new Error("ID obrigatório");
  await deleteDoc(doc(db, COL_AVULSOS, id));
        }

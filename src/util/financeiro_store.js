// src/util/financeiro_store.js
import db from "../firebase";
import {
  collection, doc, addDoc, setDoc, updateDoc, getDoc, getDocs,
  onSnapshot, query, where, serverTimestamp, Timestamp, writeBatch
} from "firebase/firestore";

/* ======================= CONSTANTES ======================= */

const COL_FLUXO   = "financeiro_fluxo";   // extrato (Previstos + Realizados no Banco)
const COL_SALDOS  = "financeiro_saldos";  // doc mensal com saldos iniciais
const COL_PEDIDOS = "PEDIDOS";            // origem dos Previstos
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
    return v.length >= 10 ? v.slice(0, 10) : toYMD(new Date(v));
  }
  if (v?.toDate) return toYMD(v.toDate());
  return toYMD(v);
}
function brDate(v) {
  const d = v?.toDate?.() || v || new Date();
  try { return new Date(d).toLocaleDateString("pt-BR"); } catch { return ""; }
}
function somaValorPedido(pedido = {}) {
  const itens = Array.isArray(pedido.itens) ? pedido.itens : [];
  let total = 0;
  for (const it of itens) {
    const q = Number(it.qtd ?? it.quantidade ?? it.qtde ?? 0);
    const vu = Number(it.preco ?? it.preço ?? it.valor ?? it.valorUnitario ?? it.vl ?? 0);
    total += q * (isFinite(vu) ? vu : 0);
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
function safeNumber(n, fallback = 0) {
  const v = Number(n);
  return Number.isFinite(v) ? v : fallback;
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
        onChange &&
          onChange({
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

/** Grava um lançamento avulso (nascem REALIZADOS no CAIXA DIÁRIO). */
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
  // calcula valor se não vier pronto
  let valorCalc = valor;
  if (valorCalc == null) {
    const vu = safeNumber(valorUnit);
    const qt = safeNumber(quantidade);
    valorCalc = vu * qt;
  }
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
    dataLancamento: dataLancamento ? Timestamp.fromDate(new Date(dataLancamento)) : serverTimestamp(),
    dataPrevista: dataPrevista ? Timestamp.fromDate(new Date(dataPrevista)) : null,
    fechado: false,
    criadoEm: serverTimestamp(),
    atualizadoEm: serverTimestamp(),
  };
  const ref = await addDoc(collection(db, COL_AVULSOS), payload);
  return { id: ref.id };
}

/** Ouve os avulsos do mês (CAIXA DIÁRIO). */
export function listenCaixaDiario(ano, mes, onChange, onError) {
  const { ini, fim } = monthRange(ano, mes);
  return listenCaixaDiarioRange(ini, fim, onChange, onError);
}

/** Ouve avulsos por período arbitrário (inclusive para “dia X”). */
export function listenCaixaDiarioRange(inicio, fimExclusivo, onChange, onError) {
  try {
    const col = collection(db, COL_AVULSOS);
    const q = query(
      col,
      where("dataLancamento", ">=", Timestamp.fromDate(new Date(inicio))),
      where("dataLancamento", "<",  Timestamp.fromDate(new Date(fimExclusivo)))
    );
    return onSnapshot(
      q,
      (snap) => {
        const linhas = [];
        let total = 0;
        snap.docs.forEach((ds) => {
          const d = ds.data() || {};
          const ymd = anyToYMD(d.dataLancamento || d.dataPrevista);

          let valorCalc = d.valor;
          if (valorCalc == null) {
            const vu = safeNumber(d.valorUnit);
            const qtd = safeNumber(d.quantidade);
            valorCalc = vu * qtd;
          }
          const valor = safeNumber(valorCalc);

          linhas.push({
            id: ds.id,
            data: ymd,
            descricao: `${d.pdv || "VAREJO"} • ${d.produto || ""} x${d.quantidade ?? "-"}`,
            forma: d.formaPagamento || "",
            valor,
            fechado: !!d.fechado,
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

/** Fecha o CAIXA DIÁRIO de um dia (gera 1 crédito Realizado no Banco). */
export async function fecharCaixaDiario({ diaOrigem, dataBanco } = {}) {
  const base = diaOrigem || new Date();
  const bancoD = dataBanco || base;
  const { ini, fim } = dayRange(base);

  const snap = await getDocs(collection(db, COL_AVULSOS));
  const doDia = [];
  snap.forEach((d) => {
    const x = d.data() || {};
    const dt =
      (x.dataLancamento && (x.dataLancamento.toDate?.() || x.dataLancamento)) ||
      (x.dataPrevista   && (x.dataPrevista.toDate?.()   || x.dataPrevista));
    if (!dt) return;
    const t = new Date(dt);
    if (t >= ini && t < fim && !x.fechado) doDia.push({ id: d.id, ...x });
  });

  if (doDia.length === 0) return { criado: false };

  let total = 0;
  for (const it of doDia) {
    let v = it.valor;
    if (v == null) {
      const vu = safeNumber(it.valorUnit);
      const qt = safeNumber(it.quantidade);
      v = vu * qt;
    }
    total += safeNumber(v);
  }
  if (total <= 0) return { criado: false };

  const ymdBanco = toYMD(bancoD);
  const ymdOrig  = toYMD(base);
  const idFech   = `FECH_${ymdOrig}`;

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
      valorRealizado: safeNumber(total),
      criadoEm: serverTimestamp(),
      atualizadoEm: serverTimestamp(),
    },
    { merge: true }
  );

  const batch = writeBatch(db);
  doDia.forEach((x) => {
    batch.update(doc(db, COL_AVULSOS, x.id), {
      fechado: true,
      bancoRef: idFech,
      bancoData: ymdBanco,
      atualizadoEm: serverTimestamp(),
    });
  });
  await batch.commit();

  return { criado: true, itens: doDia.length, total };
}

/* ================== EXTRATO BANCÁRIO (PREV + REAL) ================= */

function montarLinhaPrevisto(id, d) {
  let valor = d.valorPrevisto;
  if (valor == null) valor = (d.valor != null ? d.valor : 0);
  const data = d.dataPrevista || anyToYMD(d.vencimento) || anyToYMD(d.criadoEm);
  return {
    id,
    origem: "Previsto",
    data,
    descricao: `PEDIDO • ${d.pdv || d.escola || "-"}`,
    forma: d.formaPagamento || "",
    valor: safeNumber(valor),
  };
}
function montarLinhaRealizado(id, d) {
  let valor = d.valorRealizado;
  if (valor == null) valor = (d.valor != null ? d.valor : 0);
  const data = d.dataRealizado || anyToYMD(d.data) || anyToYMD(d.criadoEm);
  return {
    id,
    origem: "Realizado",
    data,
    descricao: d.descricao || "Crédito em conta",
    forma: d.formaPagamento || "",
    valor: safeNumber(valor),
  };
}

/** Extrato bancário por mês. */
export function listenExtratoBancario(ano, mes, onChange, onError) {
  const { ini, fim } = monthRange(ano, mes);
  return listenExtratoBancarioRange(ini, fim, onChange, onError);
}

/** Extrato bancário por período arbitrário. */
export function listenExtratoBancarioRange(inicio, fimExclusivo, onChange, onError) {
  try {
    const col = collection(db, COL_FLUXO);
    return onSnapshot(
      col,
      (snap) => {
        const ymIni = anyToYMD(inicio).slice(0,10);
        const ymFim = anyToYMD(fimExclusivo).slice(0,10);

        const prev = [];
        const real = [];

        snap.forEach((ds) => {
          const d = ds.data() || {};

          if (String(d.statusFinanceiro || "").toLowerCase() === "previsto") {
            const ymd = d.dataPrevista || anyToYMD(d.vencimento);
            if (!ymd) return;
            if (ymd >= ymIni && ymd < ymFim) prev.push(montarLinhaPrevisto(ds.id, d));
            return;
          }

          if (String(d.conta || "").toUpperCase().includes("EXTRATO")) {
            const ymd = d.dataRealizado || anyToYMD(d.data);
            if (!ymd) return;
            if (ymd >= ymIni && ymd < ymFim) real.push(montarLinhaRealizado(ds.id, d));
          }
        });

        const linhas = [...prev, ...real].sort((x, y) => x.data.localeCompare(y.data));
        const totPrev = prev.reduce((s, l) => s + safeNumber(l.valor), 0);
        const totBan  = real.reduce((s, l) => s + safeNumber(l.valor), 0);

        onChange && onChange({ linhas, totPrev, totBan });
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

  let valor = dados?.valorTotal;
  if (!valor) {
    valor = somaValorPedido(dados || {});
  }
  valor = safeNumber(valor);

  let dataPrevista = anyToYMD(
    dados?.dataVencimento ?? dados?.vencimento ?? dados?.dataPrevista ?? dados?.criadoEm
  );
  if (!dataPrevista) dataPrevista = toYMD(new Date());

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
      valorRealizado: (valor == null ? undefined : safeNumber(valor)),
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
      where("createdEm", "<",  Timestamp.fromDate(fim))
    );
    const qB = query(
      ref,
      where("criadoEm",  ">=", Timestamp.fromDate(ini)),
      where("criadoEm",  "<",  Timestamp.fromDate(fim))
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
        (x.createdEm && x.createdEm.toDate?.()) ||
        (x.criadoEm  && x.criadoEm.toDate?.())  ||
        (x.atualizadoEm && x.atualizadoEm.toDate?.());
      if (!carimbo) return;
      if (carimbo >= ini && carimbo < fim) docs.push(d);
    });
  }

  let gerados = 0;
  for (const ds of docs) {
    const d = ds.data() || {};
    const itens = Array.isArray(d.itens) ? d.itens : [];

    let valor = safeNumber(d.total);
    if (!valor) {
      valor = safeNumber(d.valorTotal);
      if (!valor) valor = somaValorPedido({ itens });
    }

    let venc = anyToYMD(
      d.dataVencimento ?? d.vencimento ?? d.dataPrevista ?? d.criadoEm ?? d.createdEm
    );
    if (!venc) venc = anyToYMD(ini);

    try {
      await setDoc(
        doc(db, COL_FLUXO, ds.id),
        {
          origem: "PEDIDO",
          pedidoId: ds.id,
          conta: "EXTRATO BANCARIO",
          statusFinanceiro: "Previsto",
          cidade: d.cidade || "",
          pdv: d.escola || d.pdv || "",
          formaPagamento: d.formaPagamento || "",
          dataPrevista: venc,
          valorPrevisto: safeNumber(valor),
          criadoEm: d.criadoEm || d.createdEm || serverTimestamp(),
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
  const { ini, fim } = monthRange(ano, mes);
  const snap = await getDocs(collection(db, COL_AVULSOS));

  let criados = 0;
  for (const ds of snap.docs) {
    const x = ds.data() || {};
    const ymd = anyToYMD(x.dataLancamento || x.dataPrevista);
    if (!ymd) continue;
    if (ymd < anyToYMD(ini) || ymd >= anyToYMD(fim)) continue;

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

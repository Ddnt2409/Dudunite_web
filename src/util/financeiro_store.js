// src/util/financeiro_store.js
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
    return v.length >= 10 ? v.slice(0, 10) : toYMD(new Date(v));
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
  ini.setHours(0, 0, 0, 0);
  fim.setHours(0, 0, 0, 0);
  // tornar exclusivo (+1 dia)
  const fimExc = new Date(fim);
  fimExc.setDate(fimExc.getDate() + 1);
  return { ini, fim: fimExc };
}

function inRangeYMD(ymd, ini, fimExc) {
  if (!ymd) return false;
  const d = new Date(ymd + "T00:00:00");
  return d >= ini && d < fimExc;
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

/** Ouve os avulsos em um RANGE de datas (inclusive fim). */
export function listenCaixaDiarioRange(inicio, fimInc, onChange, onError) {
  const { ini, fim } = rangeFromInputs(inicio, fimInc);
  try {
    const col = collection(db, COL_AVULSOS);
    const qy = query(
      col,
      where("dataLancamento", ">=", Timestamp.fromDate(ini)),
      where("dataLancamento", "<", Timestamp.fromDate(fim))
    );

    return onSnapshot(
      qy,
      (snap) => {
        const linhas = [];
        let total = 0;

        snap.docs.forEach((ds) => {
          const d = ds.data() || {};
          const ymd = anyToYMD(d.dataLancamento || d.dataPrevista);

          // valor pode ser negativo (fechamento parcial)
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
            descricao:
              d.fechamento
                ? (d.descricao || `Fechamento Caixa • ${brDate(d.dataLancamento)}`)
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
 * Fecha o CAIXA DIÁRIO (total ou parcialmente).
 * - Cria um lançamento NEGATIVO em cts_avulsos (saída do caixa).
 * - Cria um CRÉDITO "Realizado" em financeiro_fluxo (entrada no banco).
 *
 * Parâmetros:
 *   diaOrigem  : Date do movimento no CAIXA
 *   dataBanco  : Date do crédito no BANCO
 *   valorParcial: número > 0 (se ausente, fecha o total disponível do dia)
 */
export async function fecharCaixaDiario({
  diaOrigem,
  dataBanco,
  valorParcial = null,
} = {}) {
  const base = diaOrigem || new Date();
  const bancoD = dataBanco || base;
  const { ini, fim } = dayRange(base);

  // Soma o total "disponível" DO DIA (apenas entradas desse dia)
  const snap = await getDocs(collection(db, COL_AVULSOS));
  let totalDoDia = 0;
  snap.forEach((d) => {
    const x = d.data() || {};
    const raw =
      (x.dataLancamento && typeof x.dataLancamento.toDate === "function" ? x.dataLancamento.toDate() : x.dataLancamento) ||
      (x.dataPrevista && typeof x.dataPrevista.toDate === "function" ? x.dataPrevista.toDate() : x.dataPrevista);
    if (!raw) return;
    const t = new Date(raw);
    if (t >= ini && t < fim) {
      // somar entradas normais (podem existir fechamentos negativos anteriores)
      const v = safeNumber(x.valor ?? (safeNumber(x.valorUnit) * safeNumber(x.quantidade)));
      totalDoDia += v;
    }
  });

  // Valor a fechar
  let valorFechar = valorParcial == null ? totalDoDia : safeNumber(valorParcial);
  if (valorFechar <= 0) return { criado: false, motivo: "valor_zero" };
  if (valorFechar > totalDoDia && totalDoDia > 0) valorFechar = totalDoDia;

  // ---------- Banco: crédito realizado ----------
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

  // ---------- Caixa: saída (negativa) ----------
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

// Alias para compatibilidade com o FluxCx.jsx
export function fecharCaixaParcial(args) {
  return fecharCaixaDiario(args);
}

/* ================== EXTRATO BANCÁRIO (PREV + REAL) ================= */

function montarLinhaPrevisto(id, d) {
  const valor = safeNumber(
    d.valorPrevisto != null ? d.valorPrevisto : d.valor
  );
  const data =
    d.dataPrevista ||
    anyToYMD(d.vencimento) ||
    anyToYMD(d.criadoEm) ||
    anyToYMD(d.createdEm);

  return {
    id,
    origem: "Previsto",
    data,
    descricao: `PEDIDO • ${d.pdv || d.escola || "-"}`,
    forma: d.formaPagamento || "",
    valor,
  };
}

function montarLinhaRealizado(id, d) {
  const valor = safeNumber(
    d.valorRealizado != null ? d.valorRealizado : d.valor
  );
  const data = d.dataRealizado || anyToYMD(d.data);
  return {
    id,
    origem: "Realizado",
    data,
    descricao: d.descricao || "Crédito em conta",
    forma: d.formaPagamento || "",
    valor,
  };
}

/** Ouve o extrato por mês (atalho). */
export function listenExtratoBancario(ano, mes, onChange, onError) {
  const { ini, fim } = monthRange(ano, mes);
  return listenExtratoBancarioRange(ini, fim, onChange, onError);
}

/** Ouve o extrato (Previstos + Realizados no Banco) por RANGE de datas. */
export function listenExtratoBancarioRange(inicio, fimInc, onChange, onError) {
  const { ini, fim } = rangeFromInputs(inicio, fimInc);
  const iniY = toYMD(ini);
  const fimY = toYMD(new Date(fim.getTime() - 86400000)); // exibição

  try {
    const col = collection(db, COL_FLUXO);
    return onSnapshot(
      col,
      (snap) => {
        const prev = [];
        const real = [];

        snap.forEach((ds) => {
          const d = ds.data() || {};

          // PREVISTO
          if (String(d.statusFinanceiro || "").toLowerCase() === "previsto") {
            const ymd = d.dataPrevista || anyToYMD(d.vencimento);
            if (!ymd) return;
            if (inRangeYMD(ymd, ini, fim)) prev.push(montarLinhaPrevisto(ds.id, d));
            return;
          }

          // REALIZADO NO BANCO (inclui fechamento do caixa)
          if (String(d.conta || "").toUpperCase().includes("EXTRATO")) {
            const ymd = d.dataRealizado || anyToYMD(d.data);
            if (!ymd) return;
            if (inRangeYMD(ymd, ini, fim)) real.push(montarLinhaRealizado(ds.id, d));
          }
        });

        const linhas = [...prev, ...real].sort((x, y) => x.data.localeCompare(y.data));
        const totPrev = prev.reduce((s, l) => s + safeNumber(l.valor), 0);
        const totBan  = real.reduce((s, l) => s + safeNumber(l.valor), 0);

        onChange && onChange({
          linhas,
          totPrev,
          totBan,
          periodo: { de: iniY, ate: fimY }
        });
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

    // valor
    const itens = Array.isArray(x.itens) ? x.itens : [];
    let valor = x.total != null ? Number(x.total) : somaValorPedido({ itens });
    valor = safeNumber(valor);

    // vencimento
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
    } catch {
      // segue mesmo que algum falhe
    }
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
    const ymd = anyToYMD(x.dataLancamento || x.dataPrevista);
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
    } catch {
      // ignora e segue
    }
  }
  return { migrados: criados };
  }

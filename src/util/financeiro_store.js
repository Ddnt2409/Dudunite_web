// src/util/financeiro_store.js
import db from "../firebase";
import {
  collection, onSnapshot, getDocs, query, where,
  doc, setDoc, serverTimestamp, Timestamp,
} from "firebase/firestore";
import { semanaRefFromDate } from "./Ciclo";

/* ====================== Helpers ====================== */

const COL_FLUXO = "financeiro_fluxo";

function somaValorPedido(pedido = {}) {
  const itens = Array.isArray(pedido.itens) ? pedido.itens : [];
  return itens.reduce((acc, it) => {
    const q = Number(it.qtd ?? it.quantidade ?? it.qtde ?? 0);
    const precoRaw = it.preco ?? it.preço ?? it.valor ?? it.valorUnitario ?? it.vl;
    const preco = Number(precoRaw ?? 0);
    return acc + q * (isFinite(preco) ? preco : 0);
  }, 0);
}

function toYMD(d) {
  const x = d instanceof Date ? d : new Date(d);
  const mm = String(x.getMonth() + 1).padStart(2, "0");
  const dd = String(x.getDate()).padStart(2, "0");
  return `${x.getFullYear()}-${mm}-${dd}`;
}
function monthKey(d) {
  const x = d instanceof Date ? d : new Date(d);
  const mm = String(x.getMonth() + 1).padStart(2, "0");
  return `${x.getFullYear()}-${mm}`;
}
function intervaloMes(ano, mes) {
  const ini = new Date(ano, mes - 1, 1, 0, 0, 0, 0);
  const fim = new Date(ano, mes, 1, 0, 0, 0, 0); // exclusivo
  return { ini, fim };
}
function intervaloSemanaBase(ref = new Date()) {
  const d = new Date(ref);
  const dow = (d.getDay() + 6) % 7; // seg=0
  d.setHours(11, 0, 0, 0);
  d.setDate(d.getDate() - dow);
  const ini = new Date(d);
  const fim = new Date(d);
  fim.setDate(fim.getDate() + 7);
  return { ini, fim };
}
function asNumber(n, fallback = 0) {
  const v = Number(n);
  return Number.isFinite(v) ? v : fallback;
}

// data “útil” guardada nos docs do fluxo
function dataFromFluxDoc(d = {}) {
  return (
    d.dataLancamento ||
    d.dataRealizado ||
    d.dataPrevista ||
    d.vencimento ||
    d.criadoEm?.toDate?.()?.toISOString?.()?.slice(0, 10) ||
    null
  );
}

/* ====================== Escritas (Pedidos → Fluxo) ====================== */

export async function upsertPrevistoFromLanPed(pedidoId, dados) {
  const agora = serverTimestamp();

  const criadoBase =
    (dados?.criadoEm instanceof Date && dados.criadoEm) ||
    (dados?.createdEm instanceof Date && dados.createdEm) ||
    new Date();

  const { path: competenciaPath } = semanaRefFromDate(criadoBase);
  const valor = asNumber(dados?.valorTotal, somaValorPedido(dados || {}));

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

      dataPrevista,
      valorPrevisto: valor,
      valorRealizado: 0,

      competenciaPath,
      ym: monthKey(criadoBase),
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
      valorRealizado: valor ?? undefined,
      atualizadoEm: serverTimestamp(),
    },
    { merge: true }
  );
}

/* ====================== Backfill ====================== */

// coleta de PEDIDOS por semana (mantido p/ compat.)
async function coletarPedidosSemana(ini, fim) {
  const ref = collection(db, "PEDIDOS");
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

  const docs = new Map();
  try {
    const [sA, sB] = await Promise.all([getDocs(qA), getDocs(qB)]);
    sA.docs?.forEach((d) => docs.set(d.id, d));
    sB.docs?.forEach((d) => docs.set(d.id, d));
  } catch {
    const sAll = await getDocs(ref);
    sAll.forEach((d) => {
      const data = d.data() || {};
      const carimbo =
        data.createdEm?.toDate?.() ||
        data.criadoEm?.toDate?.() ||
        data.atualizadoEm?.toDate?.() ||
        data.dataAlimentado?.toDate?.() ||
        null;
      if (carimbo && carimbo >= ini && carimbo < fim) docs.set(d.id, d);
    });
  }
  return Array.from(docs.values());
}

// coleta de PEDIDOS por mês, aceitando created/criado/vencimento
async function coletarPedidosDoMes(ano, mes) {
  const { ini, fim } = intervaloMes(ano, mes);
  const ref = collection(db, "PEDIDOS");

  // sem exigir índices: lê tudo e filtra no cliente
  const snap = await getDocs(ref);
  const out = [];
  snap.forEach((docu) => {
    const d = docu.data() || {};
    const criado =
      d.createdEm?.toDate?.() ||
      d.criadoEm?.toDate?.() ||
      d.atualizadoEm?.toDate?.() ||
      null;

    let venc = null;
    if (typeof d.dataVencimento === "string") {
      venc = new Date(d.dataVencimento + "T00:00:00");
    } else if (d.dataVencimento?.toDate) {
      venc = d.dataVencimento.toDate();
    }

    const dentroPorCriacao = criado && criado >= ini && criado < fim;
    const dentroPorVenc = venc && venc >= ini && venc < fim;

    if (dentroPorCriacao || dentroPorVenc) out.push({ id: docu.id, data: d });
  });
  return out;
}

function pedidoToFluxoPayload(d) {
  const itens = Array.isArray(d.itens) ? d.itens : [];
  const valor = asNumber(d.total, somaValorPedido({ itens }));

  let venc = "";
  if (typeof d.dataVencimento === "string") venc = d.dataVencimento;
  else if (d.dataVencimento?.toDate) venc = toYMD(d.dataVencimento.toDate());

  const criadoBase =
    d.criadoEm?.toDate?.() ||
    d.createdEm?.toDate?.() ||
    new Date();

  return {
    cidade: d.cidade || "",
    pdv: d.escola || d.pdv || "",
    itens,
    formaPagamento: d.formaPagamento || "",
    vencimento: venc,
    valorTotal: valor,
    criadoEm: criadoBase,
  };
}

export async function backfillPrevistosSemanaAtual() {
  const { ini, fim } = intervaloSemanaBase(new Date());
  const docs = await coletarPedidosSemana(ini, fim);
  let ok = 0;
  for (const ds of docs) {
    try {
      await upsertPrevistoFromLanPed(ds.id, pedidoToFluxoPayload(ds.data()));
      ok++;
    } catch {}
  }
  return { totalProcessados: docs.length, previstosGerados: ok };
}

// ✅ novo: trás todos os pedidos do MÊS selecionado
export async function backfillPrevistosDoMes(ano, mes) {
  const docs = await coletarPedidosDoMes(ano, mes);
  let ok = 0;
  for (const { id, data } of docs) {
    try {
      await upsertPrevistoFromLanPed(id, pedidoToFluxoPayload(data));
      ok++;
    } catch {}
  }
  return { totalProcessados: docs.length, previstosGerados: ok };
}

/* ====================== Leitura em tempo real ====================== */

// CAIXA DIÁRIO (avulsos)
export function listenCaixaDiario(ano, mes, onChange, onError) {
  try {
    const col = collection(db, COL_FLUXO);
    return onSnapshot(
      col,
      (snap) => {
        const alvoYM = `${ano}-${String(mes).padStart(2, "0")}`;
        const { ini } = intervaloMes(ano, mes);
        const ymInicio = toYMD(ini).slice(0, 7);

        const linhas = [];
        let totalMes = 0;
        let saldoAnterior = 0;

        snap.docs.forEach((docu) => {
          const d = docu.data() || {};
          if (String(d.conta || "").toUpperCase() !== "CAIXA DIARIO") return;

          const data = dataFromFluxDoc(d);
          if (!data) return;

          const valor = asNumber(d.valor ?? d.valorRealizado ?? d.valorPrevisto, 0);

          if (data.slice(0, 7) === alvoYM) {
            linhas.push({
              id: docu.id,
              data,
              descricao: d.descricao || d.obs || d.pdv || "",
              forma: d.forma || d.formaPagamento || "",
              valor,
              fechado: Boolean(d.fechado),
            });
            totalMes += valor;
          } else if (data.slice(0, 7) < ymInicio) {
            saldoAnterior += valor;
          }
        });

        linhas.sort((a, b) => a.data.localeCompare(b.data));
        const saldoFinal = saldoAnterior + totalMes;
        onChange && onChange({ linhas, total: totalMes, saldoAnterior, saldoFinal });
      },
      (e) => onError && onError(e)
    );
  } catch (e) {
    onError && onError(e);
    return () => {};
  }
}

// EXTRATO BANCÁRIO (Previstos + Banco)
export function listenExtratoBancario(ano, mes, onChange, onError) {
  try {
    const col = collection(db, COL_FLUXO);
    return onSnapshot(
      col,
      (snap) => {
        const alvoYM = `${ano}-${String(mes).padStart(2, "0")}`;
        const { ini } = intervaloMes(ano, mes);
        const ymInicio = toYMD(ini).slice(0, 7);

        const linhas = [];
        let totPrev = 0;
        let totBan = 0;
        let prevAntes = 0;
        let banAntes = 0;

        snap.docs.forEach((docu) => {
          const d = docu.data() || {};
          const conta = String(d.conta || "").toUpperCase();

          // data relevante
          const data =
            conta === "EXTRATO BANCARIO"
              ? d.dataRealizado || d.dataLancamento || d.dataPrevista || null
              : d.dataPrevista || d.vencimento || d.dataRealizado || null;

          if (!data) return;

          if (conta === "CAIXA FLUTUANTE") {
            const v = asNumber(d.valorPrevisto, 0);
            if (String(data).slice(0, 7) === alvoYM) {
              totPrev += v;
              linhas.push({
                origem: "Previsto",
                id: docu.id,
                data,
                descricao: d.pdv ? `PEDIDO • ${d.pdv}` : "PEDIDO",
                forma: d.formaPagamento || d.forma || "",
                valor: v,
              });
            } else if (String(data).slice(0, 7) < ymInicio) {
              prevAntes += v;
            }
          } else if (conta === "EXTRATO BANCARIO") {
            const v = asNumber(d.valorRealizado ?? d.valor, 0);
            if (String(data).slice(0, 7) === alvoYM) {
              totBan += v;
              linhas.push({
                origem: "Realizado",
                id: docu.id,
                data,
                descricao: d.descricao || d.obs || "Depósito / Fechamento",
                forma: d.forma || d.formaPagamento || "",
                valor: v,
              });
            } else if (String(data).slice(0, 7) < ymInicio) {
              banAntes += v;
            }
          }
        });

        linhas.sort((a, b) => a.data.localeCompare(b.data));
        const saldoAnterior = banAntes - prevAntes;
        const saldoMes = totBan - totPrev;
        const saldoFinal = saldoAnterior + saldoMes;

        onChange &&
          onChange({
            linhas,
            totPrev,
            totBan,
            saldoAnterior,
            saldoFinal,
          });
      },
      (e) => onError && onError(e)
    );
  } catch (e) {
    onError && onError(e);
    return () => {};
  }
}

/* ====================== Fechamento do caixa diário ====================== */
export async function fecharCaixaDiario({ diaOrigem, dataBanco }) {
  const dia = toYMD(diaOrigem || new Date());
  const dataDep = toYMD(dataBanco || new Date());

  const snap = await getDocs(collection(db, COL_FLUXO));
  const doDia = [];
  snap.forEach((d) => {
    const x = d.data() || {};
    if (String(x.conta || "").toUpperCase() !== "CAIXA DIARIO") return;
    if (x.fechado) return;
    const data = dataFromFluxDoc(x);
    if (data === dia) doDia.push({ id: d.id, ...x });
  });

  if (doDia.length === 0) {
    return { criado: false, itens: 0, total: 0 };
  }

  let total = 0;
  for (const it of doDia) {
    // evita misturar ?? e || (problema do build)
    const b1 = it.valor != null ? it.valor : undefined;
    const b2 = b1 == null ? it.valorRealizado : b1;
    const b3 = b2 == null ? it.valorPrevisto : b2;
    const valor = asNumber(b3, 0);

    total += valor;

    await setDoc(
      doc(db, COL_FLUXO, it.id),
      {
        fechado: true,
        loteFechamentoId: `fech_${dia}`,
        atualizadoEm: serverTimestamp(),
      },
      { merge: true }
    );
  }

  const bankId = `bank_${dataDep}_${Date.now()}`;
  await setDoc(doc(db, COL_FLUXO, bankId), {
    origem: "Fechamento Caixa",
    conta: "EXTRATO BANCARIO",
    statusFinanceiro: "Realizado",
    dataRealizado: dataDep,
    valorRealizado: total,
    descricao: `Fechamento do caixa de ${dia}`,
    criadoEm: serverTimestamp(),
    atualizadoEm: serverTimestamp(),
    ym: dataDep.slice(0, 7),
  });

  return { criado: true, itens: doDia.length, total };
}

// src/util/financeiro_store.js
import db from "../firebase";
import {
  doc, setDoc, serverTimestamp,
  collection, query, where, Timestamp, getDocs
} from "firebase/firestore";
import { semanaRefFromDate } from "./Ciclo";

const COL_FLUXO = "financeiro_fluxo";

/** Soma o valor do pedido a partir dos itens (qtd × valorUnitario). */
function somaValorPedido(pedido = {}) {
  const itens = Array.isArray(pedido.itens) ? pedido.itens : [];
  return itens.reduce((acc, it) => {
    const q = Number(it.qtd ?? it.quantidade ?? it.qtde ?? 0);
    const preco = Number(it.preco ?? it.preço ?? it.valor ?? it.valorUnitario ?? it.vl ?? 0);
    return acc + q * (isFinite(preco) ? preco : 0);
  }, 0);
}

/** Date → "YYYY-MM-DD". */
function toYMD(d) {
  const x = d instanceof Date ? d : new Date(d);
  const mm = String(x.getMonth() + 1).padStart(2, "0");
  const dd = String(x.getDate()).padStart(2, "0");
  return `${x.getFullYear()}-${mm}-${dd}`;
}

/** janela semanal (segunda 11:00 → próxima segunda 11:00) */
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

/**
 * 💰 Chamar no SALVAR do LanPed (logo após gravar PEDIDOS/{id})
 * Cria/atualiza o RECEBÍVEL como PREVISTO na conta CAIXA FLUTUANTE.
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

      dataPrevista,            // vencimento do LanPed
      valorPrevisto: valor,
      valorRealizado: 0,

      competenciaPath,
      criadoEm: dados?.criadoEm || dados?.createdEm || agora,
      atualizadoEm: agora,
    },
    { merge: true }
  );
}

/** Confirmar crédito (quando chegar) → Realizado/EXTRATO BANCARIO. */
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

/* ============ BACKFILL: traz os pedidos antigos para o fluxo ============ */

/** Coleta PEDIDOS da semana (createdEm/criadoEm) com fallback. */
async function coletarPedidosSemana(ini, fim) {
  const ref = collection(db, "PEDIDOS");
  const qA = query(ref,
    where("createdEm", ">=", Timestamp.fromDate(ini)),
    where("createdEm", "<",  Timestamp.fromDate(fim)),
  );
  const qB = query(ref,
    where("criadoEm", ">=", Timestamp.fromDate(ini)),
    where("criadoEm", "<",  Timestamp.fromDate(fim)),
  );

  let docs = new Map();

  try {
    const [sA, sB] = await Promise.all([getDocs(qA), getDocs(qB)]);
    sA.forEach?.((d) => d); // no-op para TypeScript silencioso
    sA.docs?.forEach((d) => docs.set(d.id, d));
    sB.docs?.forEach((d) => docs.set(d.id, d));
  } catch {
    // fallback: pega tudo e filtra no cliente
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

/** Converte um doc de PEDIDOS → payload do fluxo. */
function pedidoToFluxoPayload(d) {
  const itens = Array.isArray(d.itens) ? d.itens : [];
  const valor = Number(d.total || 0) || somaValorPedido({ itens });

  // data de vencimento pode ser string ou Timestamp
  let venc = "";
  if (typeof d.dataVencimento === "string") venc = d.dataVencimento;
  else if (d.dataVencimento?.toDate) venc = toYMD(d.dataVencimento.toDate());

  // criado base (competência)
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

/** Backfill da semana atual: cria/atualiza PREVISTOS em `financeiro_fluxo`. */
export async function backfillPrevistosSemanaAtual() {
  const { ini, fim } = intervaloSemanaBase(new Date());
  const docs = await coletarPedidosSemana(ini, fim);

  let ok = 0;
  for (const ds of docs) {
    const d = ds.data() || {};
    try {
      await upsertPrevistoFromLanPed(ds.id, pedidoToFluxoPayload(d));
      ok++;
    } catch {
      // segue o baile — usamos merge e idempotência
    }
  }
  return { totalProcessados: docs.length, previstosGerados: ok };
}

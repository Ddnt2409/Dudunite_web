// src/util/financeiro_store.js
import db from "../firebase";
import {
  doc, setDoc, serverTimestamp, getDoc,
  collection, query, where, Timestamp, getDocs, onSnapshot, writeBatch
} from "firebase/firestore";
import { semanaRefFromDate } from "./Ciclo";

const COL_FLUXO = "financeiro_fluxo";

/* -------------------- helpers -------------------- */

// soma valor do pedido (qtd × valorUnitario)
function somaValorPedido(pedido = {}) {
  const itens = Array.isArray(pedido.itens) ? pedido.itens : [];
  return itens.reduce((acc, it) => {
    const q = Number(it.qtd ?? it.quantidade ?? it.qtde ?? 0);
    const preco = Number(it.preco ?? it.preço ?? it.valor ?? it.valorUnitario ?? it.vl ?? 0);
    return acc + q * (isFinite(preco) ? preco : 0);
  }, 0);
}

// Date/string -> "YYYY-MM-DD"
function toYMD(d) {
  const x = d instanceof Date ? d : new Date(d);
  const mm = String(x.getMonth() + 1).padStart(2, "0");
  const dd = String(x.getDate()).padStart(2, "0");
  return `${x.getFullYear()}-${mm}-${dd}`;
}

// "YYYY-MM" -> {iniYMD, fimYMD}
export function monthBounds(ym = null) {
  const base = ym ? new Date(ym + "-01T00:00:00") : new Date();
  const ini = new Date(base.getFullYear(), base.getMonth(), 1);
  const fim = new Date(base.getFullYear(), base.getMonth() + 1, 1);
  return { iniYMD: toYMD(ini), fimYMD: toYMD(fim) };
}

// dd/mm/aaaa
export function brDate(ymd) {
  if (!ymd) return "";
  const [y, m, d] = String(ymd).split("-");
  return `${d}/${m}/${y}`;
}

// janela semanal (segunda 11:00 → próxima segunda 11:00)
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

/* -------------------- PREVISTOS (LanPed) -------------------- */

/** Chamar no SALVAR do LanPed (logo após gravar PEDIDOS/{id}) */
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
      conta: "CAIXA FLUTUANTE",     // ← previsões ficam aqui
      statusFinanceiro: "Previsto",

      cidade: dados?.cidade || "",
      pdv: dados?.pdv || dados?.escola || "",
      formaPagamento: dados?.formaPagamento || "",

      dataPrevista,                 // vencimento do LanPed
      valorPrevisto: valor,
      valorRealizado: 0,

      competenciaPath,
      criadoEm: dados?.criadoEm || dados?.createdEm || agora,
      atualizadoEm: agora,
    },
    { merge: true }
  );
}

/** Quando cair no banco (confirmação) */
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

/* -------------------- AVULSOS (Caixa Diário) -------------------- */

/** Lançamento avulso (varejo) → vai para CAIXA DIARIO (realizado). */
export async function addLancamentoAvulso({ data = new Date(), descricao = "", forma = "", valor = 0 }) {
  const id = `avulso_${Date.now()}`;
  await setDoc(
    doc(db, COL_FLUXO, id),
    {
      origem: "AVULSO",
      conta: "CAIXA DIARIO",
      statusFinanceiro: "Realizado",
      dataRealizado: toYMD(data),
      descricao,
      formaPagamento: forma || "",
      valorRealizado: Number(valor) || 0,
      criadoEm: serverTimestamp(),
      atualizadoEm: serverTimestamp(),
    },
    { merge: true }
  );
  return id;
}

/** Fecha o caixa diário: soma avulsos abertos do dia e gera 1 lançamento no extrato bancário. */
export async function fecharCaixaDiario({ data = new Date(), descricaoBanco = "Fechamento Caixa Diário" } = {}) {
  const dia = toYMD(data);

  // pega todos os avulsos do dia
  const q = query(
    collection(db, COL_FLUXO),
    where("conta", "==", "CAIXA DIARIO"),
    where("dataRealizado", "==", dia)
  );
  const snap = await getDocs(q);
  const docs = snap.docs.filter(d => !d.data()?.fechado); // evita refazer

  const total = docs.reduce((acc, d) => acc + Number(d.data()?.valorRealizado || 0), 0);

  if (total <= 0) return { total: 0, createdId: null };

  // cria lançamento no extrato bancário
  const loteId = `fech_${dia}_${Date.now()}`;
  await setDoc(
    doc(db, COL_FLUXO, loteId),
    {
      origem: "FECHAMENTO_CAIXA",
      conta: "EXTRATO BANCARIO",
      statusFinanceiro: "Realizado",
      dataRealizado: dia,
      descricao: `${descricaoBanco} ${brDate(dia)}`,
      valorRealizado: total,
      criadoEm: serverTimestamp(),
      atualizadoEm: serverTimestamp(),
    }
  );

  // marca itens do caixa como fechados (lote)
  const batch = writeBatch(db);
  docs.forEach(d => {
    batch.set(
      doc(db, COL_FLUXO, d.id),
      { fechado: true, loteFechamento: loteId, atualizadoEm: serverTimestamp() },
      { merge: true }
    );
  });
  await batch.commit();

  return { total, createdId: loteId };
}

/* -------------------- LISTENERS p/ a tela -------------------- */

/** Escuta o CAIXA DIARIO do mês (somente realizados da conta CAIXA DIARIO). */
export function listenCaixaDiario(mesYYYYMM, cb, onErr) {
  const { iniYMD, fimYMD } = monthBounds(mesYYYYMM);
  try {
    const q = query(
      collection(db, COL_FLUXO),
      where("conta", "==", "CAIXA DIARIO"),
      where("dataRealizado", ">=", iniYMD),
      where("dataRealizado", "<",  fimYMD)
    );
    return onSnapshot(q, (snap) => {
      const itens = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .sort((a, b) => String(a.dataRealizado).localeCompare(String(b.dataRealizado)));
      cb?.(itens);
    }, onErr);
  } catch (e) {
    onErr?.(e);
    return () => {};
  }
}

/** Escuta o EXTRATO BANCÁRIO do mês:
 *  - PREVISTOS (conta CAIXA FLUTUANTE por dataPrevista)
 *  - REALIZADOS (conta EXTRATO BANCARIO por dataRealizado)
 */
export function listenExtratoBancario(mesYYYYMM, cb, onErr) {
  const { iniYMD, fimYMD } = monthBounds(mesYYYYMM);

  const unsub = [];
  const acumulado = { previstos: [], realizados: [] };

  function flush() {
    const todos = [
      ...acumulado.previstos.map(x => ({ ...x, _tipo: "Previsto" })),
      ...acumulado.realizados.map(x => ({ ...x, _tipo: "Realizado" })),
    ].sort((a, b) => {
      const da = a._tipo === "Previsto" ? a.dataPrevista : a.dataRealizado;
      const db = b._tipo === "Previsto" ? b.dataPrevista : b.dataRealizado;
      return String(da).localeCompare(String(db));
    });
    cb?.(todos);
  }

  try {
    const qPrev = query(
      collection(db, COL_FLUXO),
      where("conta", "==", "CAIXA FLUTUANTE"),
      where("dataPrevista", ">=", iniYMD),
      where("dataPrevista", "<",  fimYMD)
    );
    unsub.push(onSnapshot(qPrev, (snap) => {
      acumulado.previstos = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      flush();
    }, onErr));

    const qReal = query(
      collection(db, COL_FLUXO),
      where("conta", "==", "EXTRATO BANCARIO"),
      where("dataRealizado", ">=", iniYMD),
      where("dataRealizado", "<",  fimYMD)
    );
    unsub.push(onSnapshot(qReal, (snap) => {
      acumulado.realizados = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      flush();
    }, onErr));
  } catch (e) {
    onErr?.(e);
  }

  return () => unsub.forEach(u => u && u());
}

/* -------------------- BACKFILL (pedidos antigos) -------------------- */

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

function pedidoToFluxoPayload(d) {
  const itens = Array.isArray(d.itens) ? d.itens : [];
  const valor = Number(d.total || 0) || somaValorPedido({ itens });

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
    const d = ds.data() || {};
    try {
      await upsertPrevistoFromLanPed(ds.id, pedidoToFluxoPayload(d));
      ok++;
    } catch {}
  }
  return { totalProcessados: docs.length, previstosGerados: ok };
}

// src/util/financeiro_store.js
import db from "../firebase";
import {
  collection, onSnapshot, getDocs, query, where,
  doc, setDoc, updateDoc,
  serverTimestamp, Timestamp,
} from "firebase/firestore";
import { semanaRefFromDate } from "./Ciclo";

/* ====================== Helpers ====================== */

const COL_FLUXO = "financeiro_fluxo";

// soma itens (qtd × preço) quando não vier o total já calculado
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

// pega a "data útil" do doc para filtros/ordenação
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
function asNumber(n, fallback = 0) {
  const v = Number(n);
  return Number.isFinite(v) ? v : fallback;
}

/* ====================== Escritas (Pedidos → Fluxo) ====================== */

/**
 * Chame no SALVAR do LanPed.
 * Grava/atualiza o PREVISTO numa conta "CAIXA FLUTUANTE".
 * Usa o mesmo id do PEDIDO como id do doc no fluxo (idempotente).
 */
export async function upsertPrevistoFromLanPed(pedidoId, dados) {
  const agora = serverTimestamp();

  const criadoBase =
    (dados?.criadoEm instanceof Date && dados.criadoEm) ||
    (dados?.createdEm instanceof Date && dados.createdEm) ||
    new Date();

  const { path: competenciaPath } = semanaRefFromDate(criadoBase);
  const valor = asNumber(dados?.valorTotal, somaValorPedido(dados || {}));

  // vencimento pode vir string ou Date
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

/** Quando o crédito realmente cair no banco (se quiser marcar individualmente). */
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

/* ====================== Backfill (pedidos já existentes) ====================== */

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
    // fallback: sem índices → lê tudo e filtra no cliente
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

/** Traz todos os pedidos da semana atual como PREVISTOS no fluxo. */
export async function backfillPrevistosSemanaAtual() {
  const { ini, fim } = intervaloSemanaBase(new Date());
  const docs = await coletarPedidosSemana(ini, fim);

  let ok = 0;
  for (const ds of docs) {
    try {
      const d = ds.data() || {};
      await upsertPrevistoFromLanPed(ds.id, pedidoToFluxoPayload(d));
      ok++;
    } catch {
      // segue — idempotente com merge
    }
  }
  return { totalProcessados: docs.length, previstosGerados: ok };
}

/* ====================== Leitura em tempo real (tela Fluxo) ====================== */

/**
 * Topo da tela: CAIXA DIÁRIO (avulsos)
 * Mostra lançamentos com conta "CAIXA DIARIO"
 */
export function listenCaixaDiario(ano, mes, onChange, onError) {
  try {
    const col = collection(db, COL_FLUXO);
    return onSnapshot(
      col,
      (snap) => {
        const alvoYM = `${ano}-${String(mes).padStart(2, "0")}`;
        const linhas = [];
        let total = 0;

        snap.docs.forEach((docu) => {
          const d = docu.data() || {};
          if (String(d.conta || "").toUpperCase() !== "CAIXA DIARIO") return;

          const data = dataFromFluxDoc(d);
          if (!data) return;
          if (data.slice(0, 7) !== alvoYM) return;

          const valor = d.valor ?? d.valorRealizado ?? 0;
          const v = asNumber(valor, 0);
          total += v;

          linhas.push({
            id: docu.id,
            data,
            descricao: d.descricao || d.obs || d.pdv || "",
            forma: d.forma || d.formaPagamento || "",
            valor: v,
            fechado: Boolean(d.fechado),
          });
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
 * Parte de baixo: EXTRATO BANCÁRIO + PREVISTOS (pedidos)
 * - Previsto: conta "CAIXA FLUTUANTE"
 * - Realizado (Banco): conta "EXTRATO BANCARIO" (inclui fechamentos do caixa)
 */
export function listenExtratoBancario(ano, mes, onChange, onError) {
  try {
    const col = collection(db, COL_FLUXO);
    return onSnapshot(
      col,
      (snap) => {
        const alvoYM = `${ano}-${String(mes).padStart(2, "0")}`;
        const linhas = [];
        let totPrev = 0;
        let totBan = 0;

        snap.docs.forEach((docu) => {
          const d = docu.data() || {};
          const conta = String(d.conta || "").toUpperCase();

          // data relevante para cada tipo
          const data =
            conta === "EXTRATO BANCARIO"
              ? d.dataRealizado || d.dataLancamento || d.dataPrevista || null
              : d.dataPrevista || d.vencimento || d.dataRealizado || null;

          if (!data) return;
          if (String(data).slice(0, 7) !== alvoYM) return;

          if (conta === "CAIXA FLUTUANTE") {
            const v = asNumber(d.valorPrevisto, 0);
            totPrev += v;
            linhas.push({
              origem: "Previsto",
              id: docu.id,
              data,
              descricao: d.pdv ? `PEDIDO • ${d.pdv}` : "PEDIDO",
              forma: d.formaPagamento || d.forma || "",
              valor: v,
            });
          } else if (conta === "EXTRATO BANCARIO") {
            const v = asNumber(d.valorRealizado ?? d.valor, 0);
            totBan += v;
            linhas.push({
              origem: "Realizado",
              id: docu.id,
              data,
              descricao: d.descricao || d.obs || "Depósito / Fechamento",
              forma: d.forma || d.formaPagamento || "",
              valor: v,
            });
          }
        });

        // ordena por data
        linhas.sort((a, b) => a.data.localeCompare(b.data));
        onChange && onChange({ linhas, totPrev, totBan });
      },
      (e) => onError && onError(e)
    );
  } catch (e) {
    onError && onError(e);
    return () => {};
  }
}

/* ====================== Fechamento do caixa diário ====================== */

/**
 * Soma todos os docs do CAIXA DIARIO de um dia (abertos) e lança 1 crédito no EXTRATO BANCARIO.
 * Também marca os avulsos do dia como "fechado".
 */
export async function fecharCaixaDiario({ diaOrigem, dataBanco }) {
  const dia = toYMD(diaOrigem || new Date());
  const dataDep = toYMD(dataBanco || new Date());

  // carrega TODOS e filtra no cliente (evita índice composto)
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
    // importante: sem misturar ?? com || (build do Vite reclama)
    const base1 = it.valor != null ? it.valor : undefined;
    const base2 = base1 == null ? it.valorRealizado : base1;
    const base3 = base2 == null ? it.valorPrevisto : base2;
    const valor = asNumber(base3, 0);

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

  // lança 1 crédito no banco
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

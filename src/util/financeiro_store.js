// src/util/financeiro_store.js
import db from "../firebase";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  setDoc,
  where,
  serverTimestamp,
  Timestamp,
  updateDoc,
} from "firebase/firestore";
import { semanaRefFromDate } from "./Ciclo";

/* ======================== Constantes ======================== */
const COL_CAIXA = "financeiro_caixa";   // avulsos (vendas do dia, varejo)
const COL_FLUXO = "financeiro_fluxo";   // previsto/realizado (banco)
const COL_SALDOS = "financeiro_saldos"; // doc {YYYY-MM}

/* ======================== Helpers =========================== */
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

function toYMD(d) {
  const x = d instanceof Date ? d : new Date(d);
  const mm = String(x.getMonth() + 1).padStart(2, "0");
  const dd = String(x.getDate()).padStart(2, "0");
  return `${x.getFullYear()}-${mm}-${dd}`;
}

function ymKey(ano, mes1a12) {
  return `${ano}-${String(mes1a12).padStart(2, "0")}`;
}

function mesRange(ano, mes1a12) {
  const ini = new Date(ano, mes1a12 - 1, 1, 0, 0, 0, 0);
  const fim = new Date(ano, mes1a12, 1, 0, 0, 0, 0); // exclusivo
  return { ini, fim, iniStr: toYMD(ini), fimStr: toYMD(new Date(fim - 1)) };
}

function isBetweenYmd(ymdStr, iniStr, fimStr) {
  return ymdStr >= iniStr && ymdStr <= fimStr;
}

/* ======================== Previsto (LanPed) ================== */
/**
 * Chamar no SALVAR do LanPed (logo após gravar PEDIDOS/{id})
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
  const dataRealStr = toYMD(dataRealizado);
  await setDoc(
    doc(db, COL_FLUXO, pedidoId),
    {
      statusFinanceiro: "Realizado",
      conta: "EXTRATO BANCARIO",
      dataRealizado: dataRealStr,
      valorRealizado: valor ?? undefined,
      atualizadoEm: serverTimestamp(),
    },
    { merge: true }
  );
}

/* ===== Backfill de PREVISTOS a partir dos PEDIDOS do mês ===== */

async function coletarPedidosMes(ano, mes1a12) {
  const { ini, fim } = mesRange(ano, mes1a12);
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

function pedidoToFluxoPayload(d) {
  const itens = Array.isArray(d.itens) ? d.itens : [];
  const valor = Number(d.total || 0) || somaValorPedido({ itens });

  // vencimento pode ser string ou Timestamp
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

export async function backfillPrevistosDoMes(ano, mes1a12) {
  const docs = await coletarPedidosMes(ano, mes1a12);
  for (const ds of docs) {
    const d = ds.data() || {};
    try {
      await upsertPrevistoFromLanPed(ds.id, pedidoToFluxoPayload(d));
    } catch {
      // segue (idempotente)
    }
  }
}

/* ======================== Saldos iniciais (por mês) ========= */

export function listenSaldosIniciais(ano, mes1a12, onChange) {
  const id = ymKey(ano, mes1a12);
  const ref = doc(db, COL_SALDOS, id);
  return onSnapshot(ref, (snap) => {
    const d = snap.data() || {};
    onChange &&
      onChange({
        caixaInicial: Number(d.caixaInicial || 0),
        bancoInicial: Number(d.bancoInicial || 0),
      });
  });
}

export async function salvarSaldosIniciais(ano, mes1a12, { caixaInicial = 0, bancoInicial = 0 } = {}) {
  const id = ymKey(ano, mes1a12);
  await setDoc(
    doc(db, COL_SALDOS, id),
    {
      caixaInicial: Number(caixaInicial || 0),
      bancoInicial: Number(bancoInicial || 0),
      atualizadoEm: serverTimestamp(),
    },
    { merge: true }
  );
}

/* ======================== Listeners p/ tela ================== */
/**
 * CAIXA DIÁRIO (avulsos). Retorna linhas do mês:
 * { id, data(YYYY-MM-DD), descricao, forma, valor, fechado }
 */
export function listenCaixaDiario(ano, mes1a12, onChange, onError) {
  const { iniStr, fimStr } = mesRange(ano, mes1a12);
  const col = collection(db, COL_CAIXA);

  // Tenta filtrar por data string (YYYY-MM-DD). Se exigir índice, cai no fallback.
  try {
    const qy = query(col, where("data", ">=", iniStr), where("data", "<=", fimStr));
    return onSnapshot(
      qy,
      (snap) => {
        const linhas = snap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .filter((l) => typeof l.data === "string" && isBetweenYmd(l.data, iniStr, fimStr))
          .map((l) => ({
            id: l.id,
            data: l.data,
            descricao: l.descricao || l.desc || "",
            forma: l.forma || l.formaPagamento || "",
            valor: Number(l.valor || 0),
            fechado: Boolean(l.fechado),
          }))
          .sort((a, b) => a.data.localeCompare(b.data));
        const total = linhas.reduce((s, i) => s + Number(i.valor || 0), 0);
        onChange && onChange({ linhas, total });
      },
      (e) => onError && onError(e)
    );
  } catch (e) {
    // Fallback: assina tudo e filtra no cliente
    return onSnapshot(
      col,
      (snap) => {
        const linhas = snap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .filter((l) => typeof l.data === "string" && isBetweenYmd(l.data, iniStr, fimStr))
          .map((l) => ({
            id: l.id,
            data: l.data,
            descricao: l.descricao || l.desc || "",
            forma: l.forma || l.formaPagamento || "",
            valor: Number(l.valor || 0),
            fechado: Boolean(l.fechado),
          }))
          .sort((a, b) => a.data.localeCompare(b.data));
        const total = linhas.reduce((s, i) => s + Number(i.valor || 0), 0);
        onChange && onChange({ linhas, total });
      },
      (err) => onError && onError(err)
    );
  }
}

/**
 * EXTRATO BANCÁRIO (previstos + realizados do mês).
 * Retorna linhas do mês:
 * { id, origem("Previsto"/"Realizado"), data(YYYY-MM-DD), descricao, forma, valor }
 */
export function listenExtratoBancario(ano, mes1a12, onChange, onError) {
  const { iniStr, fimStr } = mesRange(ano, mes1a12);
  const col = collection(db, COL_FLUXO);

  // Para simplificar e evitar múltiplos índices, assina tudo e filtra no cliente
  return onSnapshot(
    col,
    (snap) => {
      const rows = [];
      let totPrev = 0;
      let totBan = 0;

      snap.forEach((d) => {
        const x = d.data() || {};

        // PREVISTO
        if ((x.statusFinanceiro || "").toLowerCase() === "previsto") {
          const data = typeof x.dataPrevista === "string" ? x.dataPrevista : "";
          if (data && isBetweenYmd(data, iniStr, fimStr)) {
            const v = Number(x.valorPrevisto ?? 0);
            rows.push({
              id: d.id,
              origem: "Previsto",
              data,
              descricao: `PEDIDO • ${x.pdv || "-"}`,
              forma: x.formaPagamento || "",
              valor: v,
            });
            totPrev += v;
          }
        }

        // REALIZADO
        if ((x.statusFinanceiro || "").toLowerCase() === "realizado") {
          const data =
            (typeof x.dataRealizado === "string" && x.dataRealizado) ||
            (x.dataRealizadoTS?.toDate ? toYMD(x.dataRealizadoTS.toDate()) : "");
          if (data && isBetweenYmd(data, iniStr, fimStr)) {
            const v = Number((x.valorRealizado ?? x.valorPrevisto ?? x.valor) ?? 0);
            const desc =
              x.descricao ||
              (x.origem === "FECHAMENTO_CAIXA"
                ? `FECHAMENTO CAIXA • ${x.referenciaDia || ""}`
                : `PEDIDO • ${x.pdv || "-"}`);
            rows.push({
              id: d.id,
              origem: "Realizado",
              data,
              descricao: desc,
              forma: x.formaPagamento || x.forma || "",
              valor: v,
            });
            totBan += v;
          }
        }
      });

      rows.sort((a, b) => a.data.localeCompare(b.data));
      onChange && onChange({ linhas: rows, totPrev, totBan });
    },
    (err) => onError && onError(err)
  );
}

/* ======================== Fechamento de caixa ================= */
/**
 * Consolida TODOS os lançamentos abertos do dia (COL_CAIXA, campo data=YYYY-MM-DD, fechado=false)
 * e cria/atualiza um crédito REALIZADO no banco em COL_FLUXO.
 */
export async function fecharCaixaDiario({ diaOrigem, dataBanco }) {
  const diaStr = toYMD(diaOrigem || new Date());
  const dataBancoStr = toYMD(dataBanco || new Date());

  // 1) coleta lançamentos do dia no CAIXA (abertos)
  const ref = collection(db, COL_CAIXA);
  let docsDia = [];
  try {
    const qy = query(ref, where("data", "==", diaStr), where("fechado", "==", false));
    const s = await getDocs(qy);
    docsDia = s.docs || [];
  } catch {
    const s = await getDocs(ref);
    docsDia = (s.docs || []).filter(
      (d) => (d.data()?.data === diaStr) && !Boolean(d.data()?.fechado)
    );
  }

  if (docsDia.length === 0) return { criado: false, itens: 0, total: 0 };

  // 2) soma e marca como fechado
  let total = 0;
  for (const it of docsDia) {
    const data = it.data() || {};
    const v = Number((data.valor ?? 0));
    total += v;
    try {
      await updateDoc(doc(db, COL_CAIXA, it.id), { fechado: true, atualizadoEm: serverTimestamp() });
    } catch {
      await setDoc(doc(db, COL_CAIXA, it.id), { fechado: true, atualizadoEm: serverTimestamp() }, { merge: true });
    }
  }

  // 3) cria/atualiza crédito REALIZADO no banco
  const idFluxo = `CX_${diaStr}`; // id determinístico por dia
  await setDoc(
    doc(db, COL_FLUXO, idFluxo),
    {
      origem: "FECHAMENTO_CAIXA",
      conta: "EXTRATO BANCARIO",
      statusFinanceiro: "Realizado",
      referenciaDia: diaStr,
      dataRealizado: dataBancoStr,
      forma: "DEPÓSITO",
      valorRealizado: total,
      atualizadoEm: serverTimestamp(),
    },
    { merge: true }
  );

  return { criado: true, itens: docsDia.length, total };
}

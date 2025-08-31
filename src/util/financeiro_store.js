// src/util/financeiro_store.js
import db from "../firebase";
import {
  doc, setDoc, addDoc, getDoc,
  serverTimestamp,
  collection, onSnapshot, getDocs,
  query, where, Timestamp,
} from "firebase/firestore";
import { semanaRefFromDate } from "./Ciclo";

const COL_FLUXO = "financeiro_fluxo";

/* ===================== helpers ===================== */

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

function fromAnyDateField(d) {
  if (!d) return "";
  if (typeof d === "string") return d.slice(0, 10);
  if (d?.toDate) return toYMD(d.toDate());
  try { return toYMD(d); } catch { return ""; }
}

function monthKey(d) {
  const s = fromAnyDateField(d);
  return s ? s.slice(0, 7) : "";
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

/* ===================== PREVISTO (LanPed) ===================== */

/**
 * Chamar no SALVAR do LanPed (logo após gravar PEDIDOS/{id}).
 * Gera/atualiza um PREVISTO na conta "CAIXA FLUTUANTE".
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

      dataPrevista,            // vencimento escolhido no LanPed
      valorPrevisto: valor,
      valorRealizado: 0,

      competenciaPath,
      criadoEm: dados?.criadoEm || dados?.createdEm || agora,
      atualizadoEm: agora,
    },
    { merge: true }
  );
}

/** Confirmar crédito (entrada no banco) para um pedido previsto. */
export async function marcarRealizado(
  pedidoId,
  { dataRealizado = new Date(), valor = null } = {}
) {
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

/* ===================== LISTENERS p/ tela dividida ===================== */

/**
 * Topo: CAIXA DIÁRIO (avulsos). Escuta tudo no mês informado.
 * Espera docs com: conta="CAIXA DIARIO"
 * Campos tolerados: dataLancamento | data | criadoEm; valor | valorRealizado | valorPrevisto;
 */
export function listenCaixaDiario(ano, mes, onChange, onError) {
  try {
    const col = collection(db, COL_FLUXO);
    return onSnapshot(
      col,
      (snap) => {
        const prefix = `${ano}-${String(mes).padStart(2, "0")}`;
        const linhas = [];
        let total = 0;

        snap.forEach((d) => {
          const x = d.data() || {};
          if ((x.conta || "").toUpperCase() !== "CAIXA DIARIO") return;

          // data do lançamento
          const data =
            fromAnyDateField(x.dataLancamento) ||
            fromAnyDateField(x.data) ||
            fromAnyDateField(x.criadoEm);

          if (!data.startsWith(prefix)) return;

          const valor = Number(
            x.valor ?? x.valorRealizado ?? x.valorPrevisto ?? 0
          );

          linhas.push({
            id: d.id,
            data,
            descricao:
              x.descricao ||
              `${x.pdv || "VAREJO"} • ${x.produto || ""}`.trim(),
            forma: x.forma || x.formaPagamento || "",
            valor,
            fechado: Boolean(x.fechado),
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
 * Baixo: EXTRATO BANCÁRIO (previstos + realizados do banco) do mês.
 * Previstos: conta="CAIXA FLUTUANTE", usa dataPrevista
 * Realizados: conta="EXTRATO BANCARIO", usa dataRealizado
 */
export function listenExtratoBancario(ano, mes, onChange, onError) {
  try {
    const col = collection(db, COL_FLUXO);
    return onSnapshot(
      col,
      (snap) => {
        const prefix = `${ano}-${String(mes).padStart(2, "0")}`;
        const linhas = [];
        let totPrev = 0;
        let totBan = 0;

        snap.forEach((d) => {
          const x = d.data() || {};
          const conta = (x.conta || "").toUpperCase();

          if (conta === "CAIXA FLUTUANTE") {
            const data = fromAnyDateField(x.dataPrevista);
            if (!data || !data.startsWith(prefix)) return;
            const valor = Number(x.valorPrevisto || 0);
            linhas.push({
              origem: "Previsto",
              id: d.id,
              data,
              descricao:
                x.descricao ||
                `${x.pdv || "-"} • ${x.formaPagamento || x.forma || ""}`.trim(),
              forma: x.formaPagamento || x.forma || "",
              valor,
            });
            totPrev += valor;
          } else if (conta === "EXTRATO BANCARIO") {
            const data =
              fromAnyDateField(x.dataRealizado) || fromAnyDateField(x.data);
            if (!data || !data.startsWith(prefix)) return;
            const valor = Number(
              x.valorRealizado ?? x.valor ?? x.valorPrevisto ?? 0
            );
            linhas.push({
              origem: "Realizado",
              id: d.id,
              data,
              descricao: x.descricao || "Lançamento no Banco",
              forma: x.forma || x.formaPagamento || "",
              valor,
            });
            totBan += valor;
          }
        });

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

/* ===================== Fechamento do Caixa Diário ===================== */

/**
 * Marca todos os lançamentos de conta="CAIXA DIARIO" do dia informado como fechados
 * e cria/atualiza UM lançamento em conta="EXTRATO BANCARIO" com a soma.
 *
 * @param {{diaOrigem: Date, dataBanco: Date}} params
 * @returns {Promise<{criado:boolean, itens:number, total:number, idBanco?:string}>}
 */
export async function fecharCaixaDiario({ diaOrigem, dataBanco }) {
  const diaStr = toYMD(diaOrigem);
  const snap = await getDocs(collection(db, COL_FLUXO));

  const doDia = [];
  snap.forEach((d) => {
    const x = d.data() || {};
    if ((x.conta || "").toUpperCase() !== "CAIXA DIARIO") return;

    const data =
      fromAnyDateField(x.dataLancamento) ||
      fromAnyDateField(x.data) ||
      fromAnyDateField(x.criadoEm);

    if (data === diaStr && !x.fechado) {
      doDia.push({ id: d.id, ...x });
    }
  });

  if (doDia.length === 0) {
    return { criado: false, itens: 0, total: 0 };
  }

  // marca como fechado
  let total = 0;
  for (const it of doDia) {
    const valor = Number(it.valor ?? it.valorRealizado ?? it.valorPrevisto || 0);
    total += valor;
    await setDoc(
      doc(db, COL_FLUXO, it.id),
      { fechado: true, fechadoEm: serverTimestamp(), atualizadoEm: serverTimestamp() },
      { merge: true }
    );
  }

  // cria/atualiza o lançamento único no banco (idempotente por dia)
  const idBanco = `fech-${diaStr}`;
  await setDoc(
    doc(db, COL_FLUXO, idBanco),
    {
      origem: "Fechamento Caixa",
      conta: "EXTRATO BANCARIO",
      statusFinanceiro: "Realizado",
      descricao: `Fechamento do Caixa Diário de ${diaStr}`,
      dataRealizado: toYMD(dataBanco),
      valorRealizado: total,
      atualizadoEm: serverTimestamp(),
      criadoEm: serverTimestamp(),
    },
    { merge: true }
  );

  return { criado: true, itens: doDia.length, total, idBanco };
}

/* ===================== Backfill de Previstos (semana atual) ===================== */

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
    // fallback: tudo + filtro no cliente
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
    d.criadoEm?.toDate?.() || d.createdEm?.toDate?.() || new Date();

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
    } catch {
      // segue — idempotente
    }
  }
  return { totalProcessados: docs.length, previstosGerados: ok };
              }

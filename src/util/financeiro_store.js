import db from "../firebase";
import {
  collection, doc, getDoc, getDocs, onSnapshot, query,
  setDoc, where, serverTimestamp, Timestamp, updateDoc
} from "firebase/firestore";
import { semanaRefFromDate } from "./Ciclo";

const COL_CAIXA  = "financeiro_caixa";   // avulsos (vendas do dia)
const COL_FLUXO  = "financeiro_fluxo";   // previsto/realizado (banco)
const COL_SALDOS = "financeiro_saldos";  // saldos iniciais por mês (doc YYYY-MM)

/* ----------------- helpers ----------------- */
function somaValorPedido(pedido = {}) {
  const itens = Array.isArray(pedido.itens) ? pedido.itens : [];
  return itens.reduce((acc, it) => {
    const q = Number(it.qtd ?? it.quantidade ?? it.qtde ?? 0);
    const preco = Number(
      it.preco ?? it.preço ?? it.valor ?? it.valorUnitario ?? it.valorUnit ?? it.vl ?? 0
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
function ymKey(ano, mes) { return `${ano}-${String(mes).padStart(2, "0")}`; }
function mesRange(ano, mes) {
  const ini = new Date(ano, mes - 1, 1);
  const fim = new Date(ano, mes, 1); // exclusivo
  return { ini, fim, iniStr: toYMD(ini), fimStr: toYMD(new Date(fim - 1)) };
}
function isBetweenYmd(s, a, b) { return typeof s === "string" && s >= a && s <= b; }

/* ----------------- PREVISTO (LanPed) ----------------- */
export async function upsertPrevistoFromLanPed(pedidoId, dados) {
  const agora = serverTimestamp();
  const criadoBase =
    (dados?.criadoEm instanceof Date && dados.criadoEm) ||
    (dados?.createdEm instanceof Date && dados.createdEm) ||
    new Date();

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
      dataPrevista,
      valorPrevisto: valor,
      valorRealizado: 0,
      competenciaPath,
      criadoEm: dados?.criadoEm || dados?.createdEm || agora,
      atualizadoEm: agora,
    },
    { merge: true }
  );
}

/* Confirmar crédito (quando entra no banco). Normalmente usado no FECHAMENTO. */
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

/* -------- backfill de PREVISTOS pelo VENCIMENTO do mês -------- */
async function coletarPedidosPorVencimento(ano, mes) {
  const { iniStr, fimStr } = mesRange(ano, mes);
  const ref = collection(db, "PEDIDOS");

  try {
    const qV = query(
      ref,
      where("dataVencimento", ">=", iniStr),
      where("dataVencimento", "<=", fimStr)
    );
    const s = await getDocs(qV);
    return s.docs;
  } catch {
    const sAll = await getDocs(ref);
    return (sAll.docs || []).filter((d) => {
      const v = d.data()?.dataVencimento;
      return typeof v === "string" && isBetweenYmd(v, iniStr, fimStr);
    });
  }
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

export async function backfillPrevistosDoMes(ano, mes) {
  const docs = await coletarPedidosPorVencimento(ano, mes);
  for (const ds of docs) {
    const d = ds.data() || {};
    try {
      await upsertPrevistoFromLanPed(ds.id, pedidoToFluxoPayload(d));
    } catch {}
  }
}

/* ----------------- SALDOS INICIAIS (por mês) ----------------- */
export function listenSaldosIniciais(ano, mes, onChange) {
  return onSnapshot(doc(db, COL_SALDOS, ymKey(ano, mes)), (snap) => {
    const d = snap.data() || {};
    onChange &&
      onChange({
        caixaInicial: Number(d.caixaInicial || 0),
        bancoInicial: Number(d.bancoInicial || 0),
      });
  });
}
export async function salvarSaldosIniciais(
  ano,
  mes,
  { caixaInicial = 0, bancoInicial = 0 } = {}
) {
  await setDoc(
    doc(db, COL_SALDOS, ymKey(ano, mes)),
    {
      caixaInicial: Number(caixaInicial || 0),
      bancoInicial: Number(bancoInicial || 0),
      atualizadoEm: serverTimestamp(),
    },
    { merge: true }
  );
}

/* ----------------- AVULSOS (sempre no CAIXA DIÁRIO) ----------------- */
/* Use isto na tela de “venda avulsa”: grava no financeiro_caixa. */
export async function gravarAvulsoCaixa({ data, descricao, forma, valor }) {
  await setDoc(
    doc(collection(db, COL_CAIXA)),
    {
      data: typeof data === "string" ? data : toYMD(data || new Date()),
      descricao: descricao || "VAREJO",
      forma: forma || "",
      valor: Number(valor || 0),
      fechado: false,
      criadoEm: serverTimestamp(),
      atualizadoEm: serverTimestamp(),
    }
  );
}

/* ----------------- LISTENERS PARA A TELA ----------------- */
/* CAIXA DIÁRIO: **apenas** financeiro_caixa */
export function listenCaixaDiario(ano, mes, onChange, onError) {
  const { iniStr, fimStr } = mesRange(ano, mes);
  const colCX = collection(db, COL_CAIXA);

  let unsub;
  try {
    const qy = query(
      colCX,
      where("data", ">=", iniStr),
      where("data", "<=", fimStr)
    );
    unsub = onSnapshot(
      qy,
      (snap) => emitCaixa(snap),
      onError
    );
  } catch {
    unsub = onSnapshot(
      colCX,
      (snap) => emitCaixa(snap),
      onError
    );
  }

  function emitCaixa(snap) {
    const linhas = (snap.docs || [])
      .map((d) => ({ id: d.id, ...d.data() }))
      .filter((l) => isBetweenYmd(l.data, iniStr, fimStr))
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
  }

  return () => unsub && unsub();
}

/* EXTRATO BANCÁRIO: previstos (dataPrevista) + realizados (dataRealizado)
   ── IGNORA quaisquer docs de origem AVULSA/CAIXA_DIARIO. */
export function listenExtratoBancario(ano, mes, onChange, onError) {
  const { iniStr, fimStr } = mesRange(ano, mes);
  return onSnapshot(
    collection(db, COL_FLUXO),
    (snap) => {
      const rows = [];
      let totPrev = 0,
        totBan = 0;

      snap.forEach((d) => {
        const x = d.data() || {};
        const origem = String(x.origem || "").toUpperCase();

        // avulsos não aparecem aqui; só o fechamento do dia
        if (x.conta === "CAIXA DIARIO") return;
        if (["VAREJO", "AVULSO", "CAIXA_DIARIO"].includes(origem)) return;

        const status = String(x.statusFinanceiro || "").toLowerCase();

        if (status === "previsto") {
          const data =
            typeof x.dataPrevista === "string" ? x.dataPrevista : "";
          if (isBetweenYmd(data, iniStr, fimStr)) {
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

        if (status === "realizado") {
          const data =
            (typeof x.dataRealizado === "string" && x.dataRealizado) ||
            (x.dataRealizadoTS?.toDate
              ? toYMD(x.dataRealizadoTS.toDate())
              : "");
          if (isBetweenYmd(data, iniStr, fimStr)) {
            const v = Number((x.valorRealizado ?? x.valorPrevisto) ?? 0);
            const desc =
              x.descricao ||
              (origem === "FECHAMENTO_CAIXA"
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
    onError
  );
}

/* ----------------- FECHAMENTO DO CAIXA → BANCO ----------------- */
export async function fecharCaixaDiario({ diaOrigem, dataBanco }) {
  const diaStr = toYMD(diaOrigem || new Date());
  const dataBancoStr = toYMD(dataBanco || new Date());

  // itens do dia ainda abertos
  let docsDia = [];
  try {
    const qy = query(
      collection(db, COL_CAIXA),
      where("data", "==", diaStr),
      where("fechado", "==", false)
    );
    const s = await getDocs(qy);
    docsDia = s.docs || [];
  } catch {
    const s = await getDocs(collection(db, COL_CAIXA));
    docsDia = (s.docs || []).filter(
      (d) => (d.data()?.data === diaStr) && !Boolean(d.data()?.fechado)
    );
  }
  if (docsDia.length === 0) return { criado: false, itens: 0, total: 0 };

  let total = 0;
  for (const it of docsDia) {
    const data = it.data() || {};
    const v = Number(data.valor || 0);
    total += v;
    try {
      await updateDoc(doc(db, COL_CAIXA, it.id), {
        fechado: true,
        atualizadoEm: serverTimestamp(),
      });
    } catch {
      await setDoc(
        doc(db, COL_CAIXA, it.id),
        { fechado: true, atualizadoEm: serverTimestamp() },
        { merge: true }
      );
    }
  }

  // 1 lançamento no BANCO
  await setDoc(
    doc(db, COL_FLUXO, `CX_${diaStr}`),
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

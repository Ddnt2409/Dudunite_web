// src/util/financeiro_store.js
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
    const preco = Number(it.preco ?? it.preço ?? it.valor ?? it.valorUnitario ?? it.valorUnit ?? it.vl ?? 0);
    return acc + q * (isFinite(preco) ? preco : 0);
  }, 0);
}
function toYMD(d) {
  const x = d instanceof Date ? d : new Date(d);
  const mm = String(x.getMonth()+1).padStart(2,"0");
  const dd = String(x.getDate()).padStart(2,"0");
  return `${x.getFullYear()}-${mm}-${dd}`;
}
function ymKey(ano, mes){ return `${ano}-${String(mes).padStart(2,"0")}`; }
function mesRange(ano, mes){
  const ini = new Date(ano, mes-1, 1);
  const fim = new Date(ano, mes, 1); // exclusivo
  return { ini, fim, iniStr: toYMD(ini), fimStr: toYMD(new Date(fim-1)) };
}
function isBetweenYmd(s, a, b){ return typeof s==="string" && s>=a && s<=b; }

/* ----------------- previsto (LanPed) ----------------- */
export async function upsertPrevistoFromLanPed(pedidoId, dados){
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

export async function marcarRealizado(pedidoId, { dataRealizado=new Date(), valor=null } = {}){
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

/* -------- backfill de previstos pelo VENCIMENTO do mês -------- */
async function coletarPedidosPorVencimento(ano, mes){
  const { iniStr, fimStr } = mesRange(ano, mes);
  const ref = collection(db, "PEDIDOS");

  // tenta por índice (dataVencimento string YYYY-MM-DD)
  try {
    const qV = query(ref, where("dataVencimento", ">=", iniStr), where("dataVencimento", "<=", fimStr));
    const s = await getDocs(qV);
    return s.docs;
  } catch {
    const sAll = await getDocs(ref);
    return (sAll.docs || []).filter(d => {
      const v = d.data()?.dataVencimento;
      return typeof v === "string" && isBetweenYmd(v, iniStr, fimStr);
    });
  }
}

function pedidoToFluxoPayload(d){
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

export async function backfillPrevistosDoMes(ano, mes){
  const docs = await coletarPedidosPorVencimento(ano, mes);
  for (const ds of docs) {
    const d = ds.data() || {};
    try { await upsertPrevistoFromLanPed(ds.id, pedidoToFluxoPayload(d)); } catch {}
  }
}

/* ----------------- saldos iniciais (por mês) ----------------- */
export function listenSaldosIniciais(ano, mes, onChange){
  return onSnapshot(doc(db, COL_SALDOS, ymKey(ano, mes)), (snap)=>{
    const d = snap.data() || {};
    onChange && onChange({
      caixaInicial: Number(d.caixaInicial || 0),
      bancoInicial: Number(d.bancoInicial || 0),
    });
  });
}
export async function salvarSaldosIniciais(ano, mes, { caixaInicial=0, bancoInicial=0 } = {}){
  await setDoc(
    doc(db, COL_SALDOS, ymKey(ano, mes)),
    { caixaInicial: Number(caixaInicial||0), bancoInicial: Number(bancoInicial||0), atualizadoEm: serverTimestamp() },
    { merge: true }
  );
}

/* ----------------- listeners para a tela ----------------- */
// CAIXA DIÁRIO: junta `financeiro_caixa` + (compat) avulsos já salvos no `financeiro_fluxo`.
export function listenCaixaDiario(ano, mes, onChange, onError){
  const { iniStr, fimStr } = mesRange(ano, mes);
  const acc = { caixa: [], fluxoAvulsos: [] };

  const emit = () => {
    const linhas = [...acc.caixa, ...acc.fluxoAvulsos]
      .sort((a,b)=>a.data.localeCompare(b.data));
    const total = linhas.reduce((s,i)=>s+Number(i.valor||0),0);
    onChange && onChange({ linhas, total });
  };

  // 1) financeiro_caixa (modelo definitivo)
  const colCX = collection(db, COL_CAIXA);
  let unsub1;
  try {
    const qy = query(colCX, where("data", ">=", iniStr), where("data", "<=", fimStr));
    unsub1 = onSnapshot(qy, snap => {
      acc.caixa = snap.docs.map(d => {
        const l = d.data() || {};
        return {
          id: d.id,
          data: l.data,
          descricao: l.descricao || l.desc || "",
          forma: l.forma || l.formaPagamento || "",
          valor: Number(l.valor || 0),
          fechado: Boolean(l.fechado),
        };
      });
      emit();
    }, onError);
  } catch {
    unsub1 = onSnapshot(colCX, snap => {
      acc.caixa = snap.docs
        .map(d => ({ id:d.id, ...d.data() }))
        .filter(l => isBetweenYmd(l.data, iniStr, fimStr))
        .map(l => ({
          id:l.id, data:l.data, descricao:l.descricao||l.desc||"",
          forma:l.forma||l.formaPagamento||"", valor:Number(l.valor||0),
          fechado:Boolean(l.fechado),
        }));
      emit();
    }, onError);
  }

  // 2) compat: “avulsos” que foram direto pro fluxo
  const colFX = collection(db, COL_FLUXO);
  const unsub2 = onSnapshot(colFX, snap => {
    acc.fluxoAvulsos = [];
    snap.forEach(d => {
      const x = d.data() || {};
      const ehAvulso =
        x.conta === "CAIXA DIARIO" ||
        ["VAREJO","AVULSO","CAIXA_DIARIO"].includes(String(x.origem||"").toUpperCase());
      if (!ehAvulso) return;

      // data do lançamento avulso
      const data =
        (typeof x.data === "string" && x.data) ||
        (typeof x.dataPrevista === "string" && x.dataPrevista) ||
        (typeof x.dataRealizado === "string" && x.dataRealizado) || "";

      if (!isBetweenYmd(data, iniStr, fimStr)) return;

      acc.fluxoAvulsos.push({
        id: `fx_${d.id}`,
        data,
        descricao: x.descricao || "VAREJO",
        forma: x.forma || x.formaPagamento || "",
        valor: Number((x.valor ?? x.valorRealizado ?? x.valorPrevisto) || 0),
        fechado: true, // já está no fluxo/banco
      });
    });
    emit();
  }, onError);

  return () => { unsub1 && unsub1(); unsub2 && unsub2(); };
}

// EXTRATO BANCÁRIO: previstos (dataPrevista) + realizados (dataRealizado)
export function listenExtratoBancario(ano, mes, onChange, onError){
  const { iniStr, fimStr } = mesRange(ano, mes);
  return onSnapshot(collection(db, COL_FLUXO), snap => {
    const rows = [];
    let totPrev = 0, totBan = 0;

    snap.forEach(d => {
      const x = d.data() || {};
      const status = String(x.statusFinanceiro||"").toLowerCase();

      if (status === "previsto") {
        const data = typeof x.dataPrevista === "string" ? x.dataPrevista : "";
        if (isBetweenYmd(data, iniStr, fimStr)) {
          const v = Number(x.valorPrevisto ?? 0);
          rows.push({ id:d.id, origem:"Previsto", data, descricao:`PEDIDO • ${x.pdv||"-"}`, forma:x.formaPagamento||"", valor:v });
          totPrev += v;
        }
      }

      if (status === "realizado") {
        const data =
          (typeof x.dataRealizado === "string" && x.dataRealizado) ||
          (x.dataRealizadoTS?.toDate ? toYMD(x.dataRealizadoTS.toDate()) : "");
        if (isBetweenYmd(data, iniStr, fimStr)) {
          const v = Number((x.valorRealizado ?? x.valorPrevisto ?? x.valor) || 0);
          const desc =
            x.descricao ||
            (x.origem === "FECHAMENTO_CAIXA" ? `FECHAMENTO CAIXA • ${x.referenciaDia||""}` : `PEDIDO • ${x.pdv||"-"}`);
          rows.push({ id:d.id, origem:"Realizado", data, descricao:desc, forma:x.formaPagamento||x.forma||"", valor:v });
          totBan += v;
        }
      }
    });

    rows.sort((a,b)=>a.data.localeCompare(b.data));
    onChange && onChange({ linhas: rows, totPrev, totBan });
  }, onError);
}

/* ----------------- fechamento do caixa ----------------- */
export async function fecharCaixaDiario({ diaOrigem, dataBanco }){
  const diaStr = toYMD(diaOrigem || new Date());
  const dataBancoStr = toYMD(dataBanco || new Date());

  // pega itens abertos do dia
  let docsDia = [];
  try {
    const qy = query(collection(db, COL_CAIXA), where("data","==",diaStr), where("fechado","==",false));
    const s = await getDocs(qy);
    docsDia = s.docs || [];
  } catch {
    const s = await getDocs(collection(db, COL_CAIXA));
    docsDia = (s.docs||[]).filter(d => (d.data()?.data===diaStr) && !Boolean(d.data()?.fechado));
  }
  if (docsDia.length===0) return { criado:false, itens:0, total:0 };

  let total = 0;
  for (const it of docsDia){
    const v = Number((it.data()?.valor) || 0);
    total += v;
    try { await updateDoc(doc(db,COL_CAIXA,it.id), { fechado:true, atualizadoEm: serverTimestamp() }); }
    catch { await setDoc(doc(db,COL_CAIXA,it.id), { fechado:true, atualizadoEm: serverTimestamp() }, { merge:true }); }
  }

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

  return { criado:true, itens:docsDia.length, total };
    }

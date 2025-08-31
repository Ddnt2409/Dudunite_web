import db from "../firebase";
import {
  addDoc, collection, doc, getDocs, onSnapshot, query, where,
  setDoc, updateDoc, serverTimestamp, Timestamp
} from "firebase/firestore";
import { semanaRefFromDate } from "./Ciclo";

/* ====================== Constantes ====================== */
const COL_FLUXO = "financeiro_fluxo";   // Previsto (PEDIDOS) + Realizado (Banco)
const COL_CAIXA = "financeiro_caixa";   // Avulsos do dia (Realizado • Caixa diário)
const COL_CFG   = "financeiro_cfg";     // Saldos iniciais por mês (doc: saldos-YYYY-MM)

/* ====================== Helpers ====================== */
function toYMD(d) {
  const x = d instanceof Date ? d : new Date(d);
  if (Number.isNaN(x.getTime())) return "";
  const mm = String(x.getMonth() + 1).padStart(2, "0");
  const dd = String(x.getDate()).padStart(2, "0");
  return `${x.getFullYear()}-${mm}-${dd}`;
}
function fromYMD(s) {
  if (!s) return null;
  try { return new Date(`${s}T00:00:00`); } catch { return null; }
}
function intervaloMes(ano, mes) {
  const ini = new Date(ano, mes - 1, 1, 0, 0, 0, 0);
  const fim = new Date(ano, mes, 1, 0, 0, 0, 0); // exclusivo
  return { ini, fim, yIni: toYMD(ini), yFim: toYMD(new Date(fim - 1)) };
}
function somaValorPedido(pedido = {}) {
  const itens = Array.isArray(pedido.itens) ? pedido.itens : [];
  return itens.reduce((acc, it) => {
    const q = Number(it.qtd ?? it.quantidade ?? it.qtde ?? 0);
    const pu = Number(
      it.preco ?? it.preço ?? it.valor ?? it.valorUnitario ?? it.vl ?? 0
    );
    return acc + q * (isFinite(pu) ? pu : 0);
  }, 0);
}

/* =================== PREVISTOS (LanPed) =================== */
/** Chamar logo após salvar PEDIDOS/{id}. */
export async function upsertPrevistoFromLanPed(pedidoId, dados) {
  const agora = serverTimestamp();

  // competência (mesma lógica do ciclo semanal)
  let criadoBase = new Date();
  if (dados?.criadoEm instanceof Date) criadoBase = dados.criadoEm;
  else if (dados?.createdEm instanceof Date) criadoBase = dados.createdEm;

  const { path: competenciaPath } = semanaRefFromDate(criadoBase);

  // valor: usa total quando houver, senão soma itens
  const valor = Number(dados?.valorTotal ?? 0) || somaValorPedido(dados || {});

  // vencimento: sempre do LanPed
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

      dataPrevista,          // vencimento do LanPed (YYYY-MM-DD)
      valorPrevisto: valor,
      valorRealizado: 0,

      competenciaPath,
      criadoEm: dados?.criadoEm || dados?.createdEm || agora,
      atualizadoEm: agora,
    },
    { merge: true }
  );
}

/* =========== BACKFILL de PREVISTOS do mês (PEDIDOS) =========== */
async function coletarPedidosDoMes(ano, mes) {
  const { ini, fim } = intervaloMes(ano, mes);
  const ref = collection(db, "PEDIDOS");

  const qA = query(
    ref,
    where("createdEm", ">=", Timestamp.fromDate(ini)),
    where("createdEm", "<",  Timestamp.fromDate(fim))
  );
  const qB = query(
    ref,
    where("criadoEm", ">=", Timestamp.fromDate(ini)),
    where("criadoEm", "<",  Timestamp.fromDate(fim))
  );

  const mapa = new Map();
  try {
    const [sA, sB] = await Promise.all([getDocs(qA), getDocs(qB)]);
    sA.docs?.forEach((d) => mapa.set(d.id, d));
    sB.docs?.forEach((d) => mapa.set(d.id, d));
  } catch {
    const sAll = await getDocs(ref);
    sAll.forEach((d) => {
      const data = d.data() || {};
      const carimbo =
        data.createdEm?.toDate?.() ||
        data.criadoEm?.toDate?.() ||
        data.atualizadoEm?.toDate?.() ||
        data.dataAlimentado?.toDate?.() || null;
      if (carimbo && carimbo >= ini && carimbo < fim) mapa.set(d.id, d);
    });
  }
  return Array.from(mapa.values());
}
function pedidoToFluxoPayload(d) {
  const itens = Array.isArray(d.itens) ? d.itens : [];
  const valor = Number(d.total ?? 0) || somaValorPedido({ itens });

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
    vencimento: venc,          // usa *vencimento* (não created)
    valorTotal: valor,
    criadoEm: criadoBase,
  };
}
export async function backfillPrevistosDoMes(ano, mes) {
  const docs = await coletarPedidosDoMes(ano, mes);
  let ok = 0;
  for (const ds of docs) {
    const d = ds.data() || {};
    try {
      await upsertPrevistoFromLanPed(ds.id, pedidoToFluxoPayload(d));
      ok++;
    } catch { /* segue */ }
  }
  return { totalProcessados: docs.length, previstosGerados: ok };
}

/* ===================== CAIXA DIÁRIO ===================== */
/** Avulso → grava no CAIXA DIÁRIO (aparece na parte de cima). */
export async function gravarAvulsoCaixa({ data, descricao, forma, valor }) {
  const y = typeof data === "string" ? data.slice(0,10) : toYMD(data);
  await addDoc(collection(db, COL_CAIXA), {
    data: y, descricao: descricao || "", forma: forma || "",
    valor: Number(valor || 0),
    fechado: false,
    criadoEm: serverTimestamp(),
  });
}

/** Listener do mês inteiro do CAIXA DIÁRIO. */
export function listenCaixaDiarioMes(ano, mes, onChange, onError) {
  const { yIni, yFim } = intervaloMes(ano, mes);
  try {
    const ref = collection(db, COL_CAIXA);
    const q = query(ref, where("data", ">=", yIni), where("data", "<=", yFim));
    return onSnapshot(q, (snap) => {
      const linhas = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .sort((a,b) => String(a.data).localeCompare(String(b.data)));
      const total = linhas.reduce((s,l)=> s + Number(l.valor ?? 0), 0);
      onChange && onChange({ linhas, total });
    }, (e)=> onError && onError(e));
  } catch (e) { onError && onError(e); return () => {}; }
}

/** Fechar um dia do CAIXA → gera 1 realizado no BANCO e marca os itens como fechados. */
export async function fecharCaixaDiario({ diaOrigem, dataBanco }) {
  const yDia  = typeof diaOrigem === "string" ? diaOrigem.slice(0,10) : toYMD(diaOrigem);
  const yBank = typeof dataBanco === "string" ? dataBanco.slice(0,10) : toYMD(dataBanco);

  // pega tudo do dia (evita índice composto)
  const ref = collection(db, COL_CAIXA);
  const q = query(ref, where("data", "==", yDia));
  const snap = await getDocs(q);

  const doDia = snap.docs
    .map((d)=>({ id:d.id, ...d.data() }))
    .filter((l)=> !l.fechado);

  if (doDia.length === 0) return { criado:false, total:0, itens:0 };

  let total = 0;
  for (const it of doDia) {
    const valor = Number(it.valor ?? it.valorRealizado ?? it.valorPrevisto ?? 0);
    total += valor;
    await updateDoc(doc(db, COL_CAIXA, it.id), {
      fechado: true, fechadoEm: serverTimestamp()
    });
  }

  await addDoc(collection(db, COL_FLUXO), {
    origem: "FECH_CAIXA",
    conta: "EXTRATO BANCARIO",
    statusFinanceiro: "Realizado",
    dataRealizado: yBank,
    valorRealizado: total,
    descricao: `Fechamento do caixa de ${yDia}`,
    atualizadoEm: serverTimestamp(),
  });

  return { criado:true, total, itens: doDia.length };
}

/** Migra avulsos antigos salvos no fluxo (caso existam). */
export async function migrarAvulsosAntigos(ano, mes) {
  const { yIni, yFim } = intervaloMes(ano, mes);
  const ref = collection(db, COL_FLUXO);
  const snap = await getDocs(ref); // filtra no cliente
  let criados = 0;
  for (const d of snap.docs) {
    const x = d.data() || {};
    // heurística: conta "CAIXA DIARIO" ou origem "AVULSO/VAREJO"
    const ehAvulso =
      /CAIXA\s*DI(Á|A)RIO/i.test(String(x.conta || "")) ||
      /AVULSO|VAREJO/i.test(String(x.origem || ""));

    const yData = x.dataRealizado || x.dataPrevista || "";
    if (!ehAvulso || !yData) continue;
    if (yData < yIni || yData > yFim) continue;

    await addDoc(collection(db, COL_CAIXA), {
      data: yData,
      descricao: x.descricao || "Avulso (migrado)",
      forma: x.formaPagamento || x.forma || "",
      valor: Number(x.valorRealizado ?? x.valorPrevisto ?? 0),
      fechado: false,
      criadoEm: serverTimestamp(),
    });
    criados++;
  }
  return { criados };
}

/* ================== EXTRATO BANCÁRIO (mês) ================== */
export function listenExtratoBancarioMes(ano, mes, onChange, onError) {
  const { yIni, yFim } = intervaloMes(ano, mes);
  try {
    const ref = collection(db, COL_FLUXO);
    // sem where (evita OR entre campos); filtramos no cliente
    return onSnapshot(ref, (snap) => {
      const linhas = [];
      let totPrev = 0, totBan = 0;

      snap.docs.forEach((d) => {
        const x = d.data() || {};

        // Previsto (PEDIDO)
        if (String(x.statusFinanceiro).toLowerCase() === "previsto") {
          const dt = x.dataPrevista || "";
          if (dt >= yIni && dt <= yFim) {
            const val = Number(x.valorPrevisto ?? 0);
            totPrev += val;
            linhas.push({
              id: d.id,
              origem: "Previsto",
              data: dt,
              descricao: `PEDIDO • ${x.pdv || ""}`,
              forma: x.formaPagamento || "",
              valor: val,
            });
          }
        }

        // Realizado (Banco)
        if (String(x.statusFinanceiro).toLowerCase() === "realizado" &&
            /EXTRATO\s*BANCARIO/i.test(String(x.conta || ""))) {
          const dt = x.dataRealizado || "";
          if (dt >= yIni && dt <= yFim) {
            const val = Number(x.valorRealizado ?? 0);
            totBan += val;
            linhas.push({
              id: d.id,
              origem: "Realizado",
              data: dt,
              descricao: x.descricao || "Crédito em conta",
              forma: x.formaPagamento || x.forma || "",
              valor: val,
            });
          }
        }
      });

      linhas.sort((a,b)=> String(a.data).localeCompare(String(b.data)));
      onChange && onChange({ linhas, totPrev, totBan });
    }, (e)=> onError && onError(e));
  } catch (e) { onError && onError(e); return () => {}; }
}

/* ================== SALDOS INICIAIS (mês) ================== */
function saldosDocId(ano, mes) {
  return `saldos-${ano}-${String(mes).padStart(2,"0")}`;
}
export function listenSaldosIniciais(ano, mes, onChange, onError) {
  try {
    return onSnapshot(
      doc(db, COL_CFG, saldosDocId(ano, mes)),
      (snap) => onChange && onChange(snap.exists() ? (snap.data() || {}) : {}),
      (e) => onError && onError(e)
    );
  } catch (e) { onError && onError(e); return () => {}; }
}
export async function salvarSaldosIniciais(ano, mes, { caixa = 0, banco = 0 }) {
  await setDoc(
    doc(db, COL_CFG, saldosDocId(ano, mes)),
    { caixaInicial: Number(caixa || 0), bancoInicial: Number(banco || 0), atualizadoEm: serverTimestamp() },
    { merge: true }
  );
}

// src/util/financeiro_store.js
import db from "../firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { semanaRefFromDate } from "./Ciclo";

const COL_FLUXO = "financeiro_fluxo";

/** Soma o valor do pedido a partir dos itens (qtd × valorUnitario). */
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

/** Converte Date → "YYYY-MM-DD". */
function toYMD(d) {
  const x = d instanceof Date ? d : new Date(d);
  const mm = String(x.getMonth() + 1).padStart(2, "0");
  const dd = String(x.getDate()).padStart(2, "0");
  return `${x.getFullYear()}-${mm}-${dd}`;
}

/**
 * 💰 Chamar no SALVAR do LanPed (logo após gravar PEDIDOS/{id})
 * Cria/atualiza o RECEBÍVEL como PREVISTO na conta CAIXA FLUTUANTE.
 */
export async function upsertPrevistoFromLanPed(pedidoId, dados) {
  const agora = serverTimestamp();

  // base para competência (segunda 11h) — usa criadoEm/createdEm se vier como Date; senão now
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

      dataPrevista,      // vencimento do LanPed
      valorPrevisto: valor,
      valorRealizado: 0,

      competenciaPath,
      criadoEm: dados?.criadoEm || dados?.createdEm || agora,
      atualizadoEm: agora,
    },
    { merge: true }
  );
}

/** (Para o futuro) Confirmar crédito → Realizado/Extrato Bancário. */
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

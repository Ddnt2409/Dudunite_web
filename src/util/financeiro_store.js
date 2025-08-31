// src/util/financeiro_store.js
import { db } from "../firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { semanaRefFromDate } from "./Ciclo";

// 👉 troque se sua coleção do fluxo tiver outro nome
const COL_FLUXO = "financeiro_fluxo";

/** Soma o valor do pedido a partir dos itens. Ajuste nomes de campos se precisar. */
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

/**
 * 💰 Chamar no SALVAR do LanPed (logo após gravar PEDIDOS/{id}):
 * Cria/atualiza o RECEBÍVEL como PREVISTO na conta CAIXA FLUTUANTE.
 */
export async function upsertPrevistoFromLanPed(pedidoId, dados) {
  // dados esperados: {cidade, pdv|escola, itens[], formaPagamento, vencimento, valorTotal?}
  const agora = serverTimestamp();

  const criadoBase =
    dados?.criadoEm?.toDate?.?.() ||
    dados?.createdEm?.toDate?.?.() ||
    new Date();

  const { path: competenciaPath } = semanaRefFromDate(criadoBase);

  const valor =
    Number(dados?.valorTotal ?? 0) || somaValorPedido(dados || {});

  const dataPrevista =
    typeof dados?.vencimento === "string"
      ? dados.vencimento
      : (() => {
          const d = dados?.vencimento instanceof Date ? dados.vencimento : new Date();
          const mm = String(d.getMonth() + 1).padStart(2, "0");
          const dd = String(d.getDate()).padStart(2, "0");
          return `${d.getFullYear()}-${mm}-${dd}`;
        })();

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
      dataPrevista,                       // vencimento do LanPed
      valorPrevisto: valor,
      valorRealizado: 0,
      competenciaPath,
      criadoEm: dados?.criadoEm || dados?.createdEm || agora,
      atualizadoEm: agora,
    },
    { merge: true }
  );
}

/**
 * Opcional (será usado depois, no FinFlux, quando confirmar o crédito).
 * Não é chamada pela Cozinha.
 */
export async function marcarRealizado(pedidoId, { dataRealizado = new Date(), valor = null } = {}) {
  const d = dataRealizado instanceof Date ? dataRealizado : new Date(dataRealizado);
  const yyyy = d.getFullYear();
  const mm   = String(d.getMonth() + 1).padStart(2, "0");
  const dd   = String(d.getDate()).padStart(2, "0");

  await setDoc(
    doc(db, COL_FLUXO, pedidoId),
    {
      statusFinanceiro: "Realizado",
      conta: "EXTRATO BANCARIO",
      dataRealizado: `${yyyy}-${mm}-${dd}`,
      valorRealizado: valor ?? undefined,
      atualizadoEm: serverTimestamp(),
    },
    { merge: true }
  );
      }

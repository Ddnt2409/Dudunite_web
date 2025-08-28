// src/util/cozinha_store.js
import { db } from "../firebase";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  setDoc,
  getDoc,
  runTransaction,
  serverTimestamp,
} from "firebase/firestore";

import { upsertPedidoInCiclo, semanaRefFromDate } from "./Ciclo";

// coleção usada pela Cozinha
const COL = "pcp_pedidos";

/**
 * Assinatura em tempo real dos pedidos da Cozinha.
 * Retorna ALIMENTADO e PRODUZIDO (ordenamos no cliente p/ evitar índice).
 *
 * Uso:
 *   const unsub = subscribePedidosAlimentados(
 *     (docs) => setPedidos(docs),
 *     (err) => setErro(err?.message || String(err))
 *   );
 */
export function subscribePedidosAlimentados(onChange, onError) {
  try {
    const col = collection(db, COL);
    // sem orderBy p/ não exigir índice
    const q = query(col, where("statusEtapa", "in", ["Alimentado", "Produzido"]));

    return onSnapshot(
      q,
      (snap) => {
        const pedidos = snap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .sort((a, b) => {
            // dataPrevista no formato YYYY-MM-DD; ordena string com fallback
            const da = String(a.dataPrevista || "");
            const dbb = String(b.dataPrevista || "");
            if (da < dbb) return -1;
            if (da > dbb) return 1;
            return (a.pdv || a.escola || "").localeCompare(b.pdv || b.escola || "");
          });
        onChange && onChange(pedidos);
      },
      (err) => onError && onError(err)
    );
  } catch (e) {
    onError && onError(e);
    return () => {};
  }
}

/**
 * Incrementa/decrementa a produção parcial de um produto.
 * `delta` pode ser positivo (marcar) ou negativo (desmarcar).
 */
export async function atualizarParcial(pedidoId, produto, delta) {
  const ref = doc(db, COL, pedidoId);
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists()) throw new Error("Pedido não existe.");
    const data = snap.data() || {};
    const parciais = { ...(data.parciais || {}) };

    const atual = Number(parciais[produto] || 0);
    const novo = Math.max(0, atual + Number(delta || 0));
    parciais[produto] = novo;

    tx.set(
      ref,
      { parciais, atualizadoEm: serverTimestamp() },
      { merge: true }
    );
  });
}

/**
 * Marca o pedido como PRODUZIDO em:
 *  - coleção da Cozinha (pcp_pedidos)
 *  - raiz PEDIDOS
 *  - coleção do CICLO semanal (usada pelo StaPed)
 */
export async function marcarProduzido(pedidoId) {
  const ts = serverTimestamp();

  // 1) Cozinha
  await setDoc(
    doc(db, COL, pedidoId),
    { statusEtapa: "Produzido", produzidoEm: ts, atualizadoEm: ts },
    { merge: true }
  );

  // 2) Raiz PEDIDOS
  const refRoot = doc(db, "PEDIDOS", pedidoId);
  await setDoc(
    refRoot,
    { statusEtapa: "Produzido", produzidoEm: ts, atualizadoEm: ts },
    { merge: true }
  );

  // 3) CICLO semanal (StaPed lê daqui)
  try {
    const rootSnap = await getDoc(refRoot);
    if (rootSnap.exists()) {
      const d = rootSnap.data() || {};
      const criado =
        d?.criadoEm?.toDate?.() ||
        d?.createdEm?.toDate?.() ||
        new Date();

      const weeklyPath = semanaRefFromDate(criado).path;

      await setDoc(
        doc(db, weeklyPath, pedidoId),
        { statusEtapa: "Produzido", produzidoEm: ts, atualizadoEm: ts },
        { merge: true }
      );

      // reforça consistência também via helper
      await upsertPedidoInCiclo(
        pedidoId,
        { ...d, statusEtapa: "Produzido", produzidoEm: new Date() },
        criado
      );
    }
  } catch (_) {
    // se falhar aqui, ao menos Cozinha e PEDIDOS ficaram corretos
  }
}

/**
 * Usado pelo AliSab ao salvar sabores para espelhar o pedido na coleção da Cozinha.
 * Cria/atualiza o doc em `pcp_pedidos`.
 */
export async function upsertAlimentadoCozinha(pedidoId, data) {
  await setDoc(
    doc(db, COL, pedidoId),
    {
      // campos mínimos p/ Cozinha
      statusEtapa: "Alimentado",
      cidade: data.cidade || "",
      pdv: data.pdv || data.escola || "",
      itens: Array.isArray(data.itens) ? data.itens : [],
      sabores: data.sabores || {},
      parciais: data.parciais || {},

      // datas/auxiliares
      dataPrevista: data.dataPrevista || "",
      atualizadoEm: serverTimestamp(),
    },
    { merge: true }
  );
}

/**
 * Resumo para exibição na UI.
 * total   → somatório das quantidades pedidas
 * produzido → soma dos parciais limitados ao pedido
 * parcial/completo/restam → flags e saldo
 */
export function resumoPedido(p) {
  const itens = Array.isArray(p.itens) ? p.itens : [];
  const parciais = p.parciais || {};
  let total = 0,
    produzido = 0,
    parcial = false;

  itens.forEach((it) => {
    const pedida = Number(it.qtd || it.quantidade || 0);
    const prod = Number(parciais[it.produto] || 0);
    total += pedida;
    produzido += Math.min(prod, pedida);
    if (prod > 0 && prod < pedida) parcial = true;
  });

  const completo = total > 0 && produzido >= total;
  const restam = Math.max(0, total - produzido);
  return { total, produzido, parcial, completo, restam };
}

// src/util/cozinha_store.js
import { db } from '../firebase';
import {
  collection, query, where, orderBy, onSnapshot,
  doc, runTransaction, serverTimestamp
} from 'firebase/firestore';

// 👉 Se o nome da coleção for outro, só troque aqui:
const COL = 'pcp_pedidos';

/**
 * Assina, em tempo real, os pedidos com statusEtapa = "Alimentado".
 * Filtros por cidade e pdv são opcionais (aplicados no servidor).
 * O filtro por "tipo" (quando precisar) fazemos no cliente.
 */
export function subscribePedidosAlimentados({ cidade = null, pdv = null }, onChange) {
  const col = collection(db, COL);
  const clauses = [where('statusEtapa', '==', 'Alimentado')];
  if (cidade && cidade !== 'Todos') clauses.push(where('cidade', '==', cidade));
  if (pdv && pdv !== 'Todos')       clauses.push(where('pdv',    '==', pdv));

  // Obs.: se aparecer erro pedindo índice composto, crie-o (ver nota ao final).
  const q = query(col, ...clauses, orderBy('dataPrevista', 'asc'));
  return onSnapshot(q, (snap) => {
    const pedidos = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    onChange(pedidos);
  });
}

/** Acumula produção parcial de um item. */
export async function salvarParcial(pedidoId, produto, qtd) {
  const ref = doc(db, COL, pedidoId);
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists()) throw new Error('Pedido não existe.');
    const data = snap.data();
    const parciais = { ...(data.parciais || {}) };
    parciais[produto] = Number(parciais[produto] || 0) + Number(qtd || 0);
    tx.update(ref, { parciais, atualizadoEm: serverTimestamp() });
  });
}

/** Conclui o pedido na Cozinha. */
export async function marcarProduzido(pedidoId) {
  const ref = doc(db, COL, pedidoId);
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists()) throw new Error('Pedido não existe.');
    tx.update(ref, { statusEtapa: 'Produzido', produzidoEm: serverTimestamp() });
  });
}

/** Resumo para UI (total, produzido, se está parcial/completo). */
export function resumoPedido(p) {
  const itens = Array.isArray(p.itens) ? p.itens : [];
  const parciais = p.parciais || {};
  let total = 0, produzido = 0, parcial = false;

  itens.forEach(it => {
    const pedida = Number(it.qtd || 0);
    const prod   = Number(parciais[it.produto] || 0);
    total     += pedida;
    produzido += Math.min(prod, pedida);
    if (prod > 0 && prod < pedida) parcial = true;
  });

  const completo = total > 0 && produzido >= total;
  return { total, produzido, parcial, completo };
}

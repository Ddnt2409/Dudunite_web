// src/util/cozinha_store.js
import db from '../firebase';
import {
  collection, query, where, orderBy, onSnapshot,
  doc, runTransaction, serverTimestamp, setDoc, getDoc
} from 'firebase/firestore';

// Coleção usada pela tela Cozinha
const COL = 'pcp_pedidos';

/**
 * Assina em tempo real os pedidos ALIMENTADO.
 * Filtros por cidade/pdv são opcionais (aplicados no servidor).
 */
export function subscribePedidosAlimentados({ cidade = null, pdv = null }, onChange) {
  const col = collection(db, COL);
  const clauses = [where('statusEtapa', '==', 'Alimentado')];
  if (cidade && cidade !== 'Todos') clauses.push(where('cidade', '==', cidade));
  if (pdv && pdv !== 'Todos')       clauses.push(where('pdv',    '==', pdv));

  // Se o Firestore pedir índice composto, crie-o pelo link que aparece no console.
  const q = query(col, ...clauses, orderBy('dataPrevista', 'asc'));
  return onSnapshot(q, (snap) => {
    const pedidos = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    onChange(pedidos);
  });
}

/** Upsert chamado pelo AliSab ao salvar sabores. */
export async function upsertAlimentadoCozinha(
  id,
  { cidade, pdv, itens = [], sabores = {}, dataPrevista }
) {
  const ref = doc(db, COL, id);
  const snap = await getDoc(ref);

  const base = {
    cidade,
    pdv,
    itens,                 // [{ produto, qtd }]
    sabores,               // { PRODUTO: [{ sabor, qtd }, ...] }
    parciais: snap.exists() ? (snap.data().parciais || {}) : {},
    statusEtapa: 'Alimentado',
    dataPrevista,          // 'YYYY-MM-DD' (string ordenável)
    atualizadoEm: serverTimestamp(),
  };
  if (!snap.exists()) base.criadoEm = serverTimestamp();

  await setDoc(ref, base, { merge: true });
}

/** Incrementa a quantidade produzida de um produto (modo "somar"). */
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

/** Define exatamente a quantidade produzida de um produto (modo "set"). */
export async function atualizarParcial(pedidoId, produto, novoValor) {
  const ref = doc(db, COL, pedidoId);
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists()) throw new Error('Pedido não existe.');
    const data = snap.data();
    const parciais = { ...(data.parciais || {}) };
    parciais[produto] = Number(novoValor || 0);
    tx.update(ref, { parciais, atualizadoEm: serverTimestamp() });
  });
}

/** Carimba como PRODUZIDO. */
export async function marcarProduzido(pedidoId) {
  const ref = doc(db, COL, pedidoId);
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists()) throw new Error('Pedido não existe.');
    tx.update(ref, {
      statusEtapa: 'Produzido',
      produzidoEm: serverTimestamp(),
      atualizadoEm: serverTimestamp(),
    });
  });
}

/** Resumo para UI (total pedido, produzido, parcial/completo). */
export function resumoPedido(p) {
  const itens = Array.isArray(p.itens) ? p.itens : [];
  const parciais = p.parciais || {};
  let total = 0, produzido = 0, parcial = false;

  itens.forEach(it => {
    const pedida = Number(it.qtd || it.quantidade || 0);
    const prod   = Number(parciais[it.produto] || 0);
    total     += pedida;
    produzido += Math.min(prod, pedida);
    if (prod > 0 && prod < pedida) parcial = true;
  });

  const completo = total > 0 && produzido >= total;
  return { total, produzido, parcial, completo };
}

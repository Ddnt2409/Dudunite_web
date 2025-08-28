// src/util/cozinha_store.js
import { db } from '../firebase';
import {
  collection, query, where, orderBy, onSnapshot,
  doc, runTransaction, serverTimestamp, setDoc, getDoc, updateDoc
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

  // Obs.: se aparecer erro pedindo índice composto, crie-o no console do Firestore.
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

/**
 * 👇 NOVO: Upsert para a coleção da Cozinha.
 * Chame isso ao ALIMENTAR no AliSab para o pedido passar a aparecer na tela Cozinha.
 * - pedidoId: mesmo ID do doc em "PEDIDOS"
 * - dados: { cidade, pdv, itens:[{produto, qtd}], sabores?, dataPrevista? (YYYY-MM-DD) }
 */
export async function upsertAlimentadoCozinha(pedidoId, dados = {}) {
  if (!pedidoId) throw new Error('pedidoId ausente em upsertAlimentadoCozinha()');
  const ref = doc(db, COL, String(pedidoId));

  // Garante shape que a Cozinha espera:
  const itens = Array.isArray(dados.itens)
    ? dados.itens.map(it => ({ produto: it.produto, qtd: Number(it.qtd ?? it.quantidade ?? 0) }))
    : [];

  const base = {
    id: String(pedidoId),
    statusEtapa: 'Alimentado',
    cidade: dados.cidade || 'Gravatá',
    pdv: dados.pdv || dados.escola || '—',
    itens,
    sabores: dados.sabores || {},                // opcional
    dataPrevista: dados.dataPrevista || yyyymmdd(new Date()), // string "YYYY-MM-DD" (ordena e exibe bem)
    atualizadoEm: serverTimestamp(),
    dataAlimentado: serverTimestamp(),
  };

  const snap = await getDoc(ref);
  if (snap.exists()) {
    await updateDoc(ref, base);
  } else {
    await setDoc(ref, { criadoEm: serverTimestamp(), ...base });
  }
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

/* util local */
function yyyymmdd(d) {
  const x = new Date(d);
  const m = String(x.getMonth()+1).padStart(2,'0');
  const day = String(x.getDate()).padStart(2,'0');
  return `${x.getFullYear()}-${m}-${day}`;
}

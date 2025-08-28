// src/util/cozinha_store.js
import { db } from '../firebase';
import {
  collection, query, where, onSnapshot,
  doc, runTransaction, serverTimestamp, getDoc, updateDoc
} from 'firebase/firestore';

// 🔴 Fonte única de verdade agora:
const COL = 'PEDIDOS';

/**
 * Assina, em tempo real, pedidos com statusEtapa = "Alimentado".
 * - cidade: filtramos no servidor (se ≠ "Todos")
 * - pdv: em PEDIDOS o campo é "escola" → filtramos no CLIENTE
 */
export function subscribePedidosAlimentados({ cidade = null, pdv = null }, onChange) {
  const col = collection(db, COL);
  const clauses = [ where('statusEtapa', '==', 'Alimentado') ];
  if (cidade && cidade !== 'Todos') clauses.push(where('cidade', '==', cidade));

  // sem orderBy para não exigir índice composto; pode ordenar no cliente
  const q = query(col, ...clauses);

  return onSnapshot(q, (snap) => {
    let pedidos = snap.docs.map(d => {
      const data = d.data() || {};
      const itensSrc = Array.isArray(data.itens) ? data.itens : [];

      // normaliza para a UI da Cozinha
      const itens = itensSrc.map(it => ({
        produto: it.produto,
        qtd: Number(it.qtd ?? it.quantidade ?? 0),
        tipo: it.tipo || null,
      }));

      return {
        id: d.id,
        pdv: data.escola || '—',            // PDV vem como "escola" em PEDIDOS
        cidade: data.cidade || '',
        statusEtapa: data.statusEtapa || 'Lançado',
        itens,
        parciais: data.parciais || {},
        dataPrevista: data.dataPrevista || null,
        dataAlimentado: data.dataAlimentado || null,
      };
    });

    // filtro de PDV no cliente (campo real = "escola")
    if (pdv && pdv !== 'Todos') {
      pedidos = pedidos.filter(p => (p.pdv || '').toLowerCase() === String(pdv).toLowerCase());
    }

    onChange(pedidos);
  });
}

/** Acumula produção parcial de um item (atualiza PEDIDOS.parciais.{produto}). */
export async function salvarParcial(pedidoId, produto, qtd) {
  const ref = doc(db, COL, String(pedidoId));
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists()) throw new Error('Pedido não existe.');
    const data = snap.data() || {};
    const parciais = { ...(data.parciais || {}) };
    parciais[produto] = Number(parciais[produto] || 0) + Number(qtd || 0);
    tx.update(ref, { parciais, atualizadoEm: serverTimestamp() });
  });
}

/** Conclui o pedido na Cozinha (muda para Produzido em PEDIDOS). */
export async function marcarProduzido(pedidoId) {
  const ref = doc(db, COL, String(pedidoId));
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error('Pedido não existe.');
  await updateDoc(ref, { statusEtapa: 'Produzido', produzidoEm: serverTimestamp() });
}

/** Resumo para UI. Aceita itens com {qtd} ou {quantidade}. */
export function resumoPedido(p) {
  const itens = Array.isArray(p.itens) ? p.itens : [];
  const parciais = p.parciais || {};
  let total = 0, produzido = 0, parcial = false;

  itens.forEach(it => {
    const pedida = Number(it.qtd ?? it.quantidade ?? 0);
    const prod   = Number(parciais[it.produto] || 0);
    total     += pedida;
    produzido += Math.min(prod, pedida);
    if (prod > 0 && prod < pedida) parcial = true;
  });

  const completo = total > 0 && produzido >= total;
  return { total, produzido, parcial, completo };
}

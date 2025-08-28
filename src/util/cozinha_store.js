// src/util/cozinha_store.js
import { db } from '../firebase';
import {
  collection, query, where, orderBy, onSnapshot,
  doc, runTransaction, serverTimestamp
} from 'firebase/firestore';

// Coleção lida pela Cozinha (recebe espelho do AliSab)
const COL = 'pcp_pedidos';

/** Assinatura em tempo real dos pedidos ALIMENTADOS (filtros opcionais no servidor). */
export function subscribePedidosAlimentados({ cidade = null, pdv = null }, onChange) {
  const col = collection(db, COL);
  const clauses = [ where('statusEtapa', '==', 'Alimentado') ];
  if (cidade && cidade !== 'Todos') clauses.push(where('cidade', '==', cidade));
  if (pdv && pdv !== 'Todos')       clauses.push(where('pdv', '==', pdv));

  const q = query(col, ...clauses, orderBy('dataPrevista', 'asc'));
  return onSnapshot(q, (snap) => {
    const pedidos = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    onChange(pedidos);
  });
}

/**
 * Marca/Desmarca uma linha da checklist (flavor) como produzida.
 * Se todas as linhas de TODOS os produtos estiverem marcadas, vira "Produzido".
 */
export async function toggleChecklistLine({ pedidoId, produto, index, checked }) {
  const ref = doc(db, COL, pedidoId);
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists()) throw new Error('Pedido não existe.');
    const data = snap.data();

    const sabores = data.sabores || {};              // { [produto]: [{sabor,qtd}, ...] }
    const ticks   = { ...(data.producedChecklist || {}) }; // { [produto]: { [index]: true } }

    const prodMap = { ...(ticks[produto] || {}) };
    if (checked) prodMap[index] = true;
    else         delete prodMap[index];
    ticks[produto] = prodMap;

    // Verifica se TUDO está marcado
    let allProduced = true;
    for (const [prod, linhas] of Object.entries(sabores)) {
      const mp = ticks[prod] || {};
      for (let i = 0; i < linhas.length; i++) {
        if (!mp[i]) { allProduced = false; break; }
      }
      if (!allProduced) break;
    }

    const payload = {
      producedChecklist: ticks,
      atualizadoEm: serverTimestamp(),
      ...(allProduced
        ? { statusEtapa: 'Produzido', produzidoEm: serverTimestamp() }
        : { statusEtapa: 'Alimentado', produzidoEm: null })
    };

    tx.update(ref, payload);
  });
}

/** Resumo total do pedido (somando todos os produtos/sabores). */
export function resumoDoPedido(p) {
  // total pedido = soma das quantidades das linhas de sabores
  const sabores = p.sabores || {};
  const ticks   = p.producedChecklist || {};
  let pedida = 0, produzida = 0;

  for (const [prod, linhas] of Object.entries(sabores)) {
    const mp = ticks[prod] || {};
    linhas.forEach((ln, i) => {
      const q = Number(ln.qtd || 0);
      pedida += q;
      if (mp[i]) produzida += q;
    });
  }
  const restam = Math.max(0, pedida - produzida);
  const completo = pedida > 0 && restam === 0;
  return { pedida, produzida, restam, completo };
}

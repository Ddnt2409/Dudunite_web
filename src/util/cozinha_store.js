// src/util/cozinha_store.js
import { db } from '../firebase';
import {
  collection, query, where, orderBy, onSnapshot,
  doc, runTransaction, serverTimestamp, setDoc, getDoc
} from 'firebase/firestore';

// Coleção que a Cozinha lê (espelho criado pelo AliSab)
const COL = 'pcp_pedidos';

/** Cria/atualiza o espelho que a Cozinha consome. */
export async function upsertAlimentadoCozinha(id, payload) {
  // shape mínimo que a Cozinha usa:
  // { cidade, pdv, itens:[{produto,qtd}], sabores:{[produto]:[{sabor,qtd}]}, dataPrevista: 'YYYY-MM-DD', statusEtapa }
  const ref = doc(db, COL, id);
  const snap = await getDoc(ref);
  const base = snap.exists() ? snap.data() : {};
  await setDoc(
    ref,
    {
      ...base,
      ...payload,
      statusEtapa: 'Alimentado',
      atualizadoEm: serverTimestamp(),
    },
    { merge: true }
  );
}

/** Assina os pedidos ALIMENTADOS (filtros server-side por cidade/pdv). */
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

/** Marca/Desmarca uma linha da checklist (Qtd|Sabor). Carimba PRODUZIDO quando tudo marcado. */
export async function toggleChecklistLine({ pedidoId, produto, index, checked }) {
  const ref = doc(db, COL, pedidoId);
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists()) throw new Error('Pedido não existe.');
    const data = snap.data();

    const sabores = data.sabores || {};                    // { [produto]: [{sabor,qtd}] }
    const ticks   = { ...(data.producedChecklist || {}) }; // { [produto]: { [index]: true } }

    const prodMap = { ...(ticks[produto] || {}) };
    if (checked) prodMap[index] = true;
    else         delete prodMap[index];
    ticks[produto] = prodMap;

    // Verifica se todas as linhas de todos os produtos estão marcadas
    let allProduced = true;
    for (const [prod, linhas] of Object.entries(sabores)) {
      const mp = ticks[prod] || {};
      for (let i = 0; i < linhas.length; i++) {
        if (!mp[i]) { allProduced = false; break; }
      }
      if (!allProduced) break;
    }

    tx.update(ref, {
      producedChecklist: ticks,
      atualizadoEm: serverTimestamp(),
      ...(allProduced
        ? { statusEtapa: 'Produzido', produzidoEm: serverTimestamp() }
        : { statusEtapa: 'Alimentado', produzidoEm: null })
    });
  });
}

/** Resumo para o rodapé do post-it. */
export function resumoDoPedido(p) {
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

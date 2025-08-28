// src/util/cozinha_store.js
import db from '../firebase';
import {
  collection, query, where, onSnapshot,
  doc, runTransaction, serverTimestamp,
  getDocs, getDoc, setDoc
} from 'firebase/firestore';
import { upsertPedidoInCiclo } from './Ciclo';

const COL = 'pcp_pedidos';

/** Assina pedidos da cozinha (Alimentado e Produzido). */
export function subscribePedidosAlimentados(onChange, onError) {
  const col = collection(db, COL);
  const q = query(col, where('statusEtapa', 'in', ['Alimentado', 'Produzido']));
  return onSnapshot(
    q,
    (snap) => onChange(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
    onError
  );
}

/** Atualiza produção parcial de um produto e espelha em PEDIDOS. */
export async function atualizarParcial(pedidoId, produto, deltaQtd) {
  const delta = Number(deltaQtd || 0);

  // — cozinha (pcp_pedidos)
  const refCoz = doc(db, COL, pedidoId);
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(refCoz);
    if (!snap.exists()) throw new Error('Pedido não existe na Cozinha.');
    const data = snap.data();
    const par = { ...(data.parciais || {}) };
    const atual = Number(par[produto] || 0);
    let novo = atual + delta;
    if (novo < 0) novo = 0;
    par[produto] = novo;
    tx.update(refCoz, { parciais: par, atualizadoEm: serverTimestamp() });
  });

  // — raiz (PEDIDOS) — espelho opcional, mas recomendado
  const refRoot = doc(db, 'PEDIDOS', pedidoId);
  try {
    await runTransaction(db, async (tx) => {
      const snap = await tx.get(refRoot);
      if (!snap.exists()) return;
      const data = snap.data() || {};
      const par = { ...(data.parciais || {}) };
      const atual = Number(par[produto] || 0);
      let novo = atual + delta;
      if (novo < 0) novo = 0;
      par[produto] = novo;
      tx.update(refRoot, { parciais: par, atualizadoEm: serverTimestamp() });
    });
  } catch (_) { /* mantém silencioso */ }
}

/** Marca o pedido como PRODUZIDO nos 3 lugares (cozinha, PEDIDOS e ciclo). */
export async function marcarProduzido(pedidoId) {
  const agora = serverTimestamp();

  // 1) Cozinha
  const refCoz = doc(db, COL, pedidoId);
  await runTransaction(db, async (tx) => {
    const s = await tx.get(refCoz);
    if (!s.exists()) throw new Error('Pedido não existe na Cozinha.');
    tx.update(refCoz, { statusEtapa: 'Produzido', produzidoEm: agora, atualizadoEm: agora });
  });

  // 2) Raiz PEDIDOS (é o que o StaPed escuta)
  const refRoot = doc(db, 'PEDIDOS', pedidoId);
  await runTransaction(db, async (tx) => {
    const s = await tx.get(refRoot);
    if (!s.exists()) return;
    tx.update(refRoot, { statusEtapa: 'Produzido', produzidoEm: agora, atualizadoEm: agora });
  });

  // 3) Ciclo semanal (espelho)
  try {
    const s = await getDoc(refRoot);
    if (s.exists()) {
      const d = s.data() || {};
      const created =
        d?.criadoEm?.toDate?.() ||
        d?.createdEm?.toDate?.() ||
        new Date();
      await upsertPedidoInCiclo(
        pedidoId,
        { ...d, statusEtapa: 'Produzido', produzidoEm: new Date() },
        created
      );
    }
  } catch (_) { /* se falhar, não impede o fluxo */ }
}

/** Backfill: copia PEDIDOS (Alimentado/Produzido) para pcp_pedidos na primeira carga. */
export async function backfillCozinhaSemana() {
  const q = query(collection(db, 'PEDIDOS'), where('statusEtapa', 'in', ['Alimentado', 'Produzido']));
  const snap = await getDocs(q);
  const ops = snap.docs.map(async (d) => {
    const data = d.data() || {};
    const itensSrc = Array.isArray(data.itens) ? data.itens : [];
    const itens = itensSrc.map(it => ({
      produto: it.produto,
      qtd: Number(it.quantidade || it.qtd || 0),
    }));
    const payload = {
      cidade: data.cidade || '',
      pdv: data.pdv || data.escola || '',
      itens,
      sabores: data.sabores || {},
      parciais: data.parciais || {},
      statusEtapa: data.statusEtapa || 'Alimentado',
      atualizadoEm: serverTimestamp(),
    };
    await setDoc(doc(db, COL, d.id), payload, { merge: true });
  });
  await Promise.all(ops);
}

/** Resumo para UI. */
export function resumoPedido(p) {
  const itens = Array.isArray(p.itens) ? p.itens : [];
  const par   = p.parciais || {};
  let total = 0, produzido = 0;
  itens.forEach((it) => {
    const ped = Number(it.qtd || it.quantidade || 0);
    const fez = Number(par[it.produto] || 0);
    total += ped;
    produzido += Math.min(fez, ped);
  });
  const restam = Math.max(total - produzido, 0);
  const completo = total > 0 && restam === 0;
  return { total, produzido, restam, completo };
}

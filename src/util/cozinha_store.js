// src/util/cozinha_store.js
import db from '../firebase';
import {
  collection, query, where, orderBy, onSnapshot,
  doc, runTransaction, serverTimestamp,
  getDocs, getDoc, setDoc, updateDoc
} from 'firebase/firestore';
import { upsertPedidoInCiclo } from './Ciclo';

const COL = 'pcp_pedidos';

/** Assina pedidos da Cozinha (Alimentado/Produzido). */
export function subscribePedidosAlimentados(onChange, onError) {
  const col = collection(db, COL);
  const q = query(col, where('statusEtapa', 'in', ['Alimentado', 'Produzido']), orderBy('pdv'));
  return onSnapshot(
    q,
    (snap) => onChange(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
    (e) => onError?.(e)
  );
}

/** Usado pelo AliSab: garante o doc na coleção da Cozinha preservando parciais. */
export async function upsertAlimentadoCozinha(pedidoId, payload) {
  const ref = doc(db, COL, pedidoId);
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    const prev = snap.exists() ? snap.data() : {};
    const parciais = prev.parciais || {};
    tx.set(
      ref,
      {
        ...prev,
        ...payload,
        parciais,
        statusEtapa: 'Alimentado',
        atualizadoEm: serverTimestamp(),
      },
      { merge: true }
    );
  });
}

/** Atualiza produção parcial (checkbox das linhas). Espelha em PEDIDOS. */
export async function atualizarParcial(pedidoId, produto, deltaQtd) {
  const delta = Number(deltaQtd || 0);

  // Cozinha
  const refC = doc(db, COL, pedidoId);
  await runTransaction(db, async (tx) => {
    const s = await tx.get(refC);
    if (!s.exists()) throw new Error('Pedido não existe na Cozinha.');
    const data = s.data() || {};
    const par = { ...(data.parciais || {}) };
    const cur = Number(par[produto] || 0);
    par[produto] = Math.max(0, cur + delta);
    tx.update(refC, { parciais: par, atualizadoEm: serverTimestamp() });
  });

  // Raiz
  const refR = doc(db, 'PEDIDOS', pedidoId);
  try {
    await runTransaction(db, async (tx) => {
      const s = await tx.get(refR);
      if (!s.exists()) return;
      const d = s.data() || {};
      const par = { ...(d.parciais || {}) };
      const cur = Number(par[produto] || 0);
      par[produto] = Math.max(0, cur + delta);
      tx.update(refR, { parciais: par, atualizadoEm: serverTimestamp() });
    });
  } catch { /* silencioso */ }
}

/** Marca PRODUZIDO em Cozinha + PEDIDOS + ciclo semanal (StaPed enxerga). */
export async function marcarProduzido(pedidoId) {
  const ts = serverTimestamp();

  // 1) Cozinha
  const refC = doc(db, COL, pedidoId);
  await setDoc(
    refC,
    { statusEtapa: 'Produzido', produzidoEm: ts, atualizadoEm: ts },
    { merge: true }
  );

  // 2) PEDIDOS (StaPed lê daqui)
  const refR = doc(db, 'PEDIDOS', pedidoId);
  await setDoc(
    refR,
    { statusEtapa: 'Produzido', produzidoEm: ts, atualizadoEm: ts },
    { merge: true }
  );

  // 3) Ciclo semanal (espelho do StaPed quando não usa raiz)
  try {
    const rootSnap = await getDoc(refR);
    if (rootSnap.exists()) {
      const d = rootSnap.data() || {};
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
  } catch { /* ok ignorar falha do espelho */ }
}

/** Backfill opcional: copia Alimentado/Produzido de PEDIDOS para Cozinha. */
export async function backfillCozinhaSemana() {
  const q = query(collection(db, 'PEDIDOS'), where('statusEtapa', 'in', ['Alimentado', 'Produzido']));
  const snap = await getDocs(q);
  await Promise.all(
    snap.docs.map(async (d) => {
      const data = d.data() || {};
      const itensSrc = Array.isArray(data.itens) ? data.itens : [];
      const itens = itensSrc.map((it) => ({
        produto: it.produto,
        qtd: Number(it.quantidade || it.qtd || 0),
      }));
      await setDoc(
        doc(db, COL, d.id),
        {
          cidade: data.cidade || '',
          pdv: data.pdv || data.escola || '',
          itens,
          sabores: data.sabores || {},
          parciais: data.parciais || {},
          statusEtapa: data.statusEtapa || 'Alimentado',
          atualizadoEm: serverTimestamp(),
        },
        { merge: true }
      );
    })
  );
}

/** Resumo para a UI da Cozinha. */
export function resumoPedido(p) {
  const itens = Array.isArray(p.itens) ? p.itens : [];
  const par = p.parciais || {};
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

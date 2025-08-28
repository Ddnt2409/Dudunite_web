// src/util/cozinha_store.js
import { db } from '../firebase';
import {
  collection, query, where, onSnapshot,
  doc, runTransaction, serverTimestamp,
  getDocs, getDoc, setDoc
} from 'firebase/firestore';
import { upsertPedidoInCiclo } from './Ciclo';

const COL = 'pcp_pedidos';

/**
 * Assina, em tempo real, pedidos da cozinha (Alimentado + Produzido)
 * sem exigir índice composto. Faz duas assinaturas (==) e une no cliente.
 */
export function subscribePedidosAlimentados(onChange, onError) {
  const col = collection(db, COL);
  const qAli  = query(col, where('statusEtapa', '==', 'Alimentado'));
  const qProd = query(col, where('statusEtapa', '==', 'Produzido'));

  let lastAli = [], lastProd = [];

  const mergeAndEmit = () => {
    const map = new Map();
    [...lastAli, ...lastProd].forEach(d => map.set(d.id, { id: d.id, ...d.data() }));
    const arr = Array.from(map.values());
    // ordenação simples no cliente
    arr.sort((a,b) => (a.cidade||'').localeCompare(b.cidade||'') || (a.pdv||'').localeCompare(b.pdv||''));
    onChange(arr);
  };

  const unsubA = onSnapshot(
    qAli,
    snap => { lastAli = snap.docs; mergeAndEmit(); },
    e => onError?.(e)
  );
  const unsubB = onSnapshot(
    qProd,
    snap => { lastProd = snap.docs; mergeAndEmit(); },
    e => onError?.(e)
  );

  return () => { unsubA(); unsubB(); };
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

/** Atualiza produção parcial de um produto (checkbox de uma linha). */
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

  // Raiz PEDIDOS (best-effort)
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
  } catch {}
}

/** Marca PRODUZIDO em Cozinha + PEDIDOS + ciclo (StaPed passa a contar). */
export async function marcarProduzido(pedidoId) {
  const ts = serverTimestamp();

  // Cozinha
  await setDoc(
    doc(db, COL, pedidoId),
    { statusEtapa: 'Produzido', produzidoEm: ts, atualizadoEm: ts },
    { merge: true }
  );

  // Raiz PEDIDOS
  const refR = doc(db, 'PEDIDOS', pedidoId);
  await setDoc(
    refR,
    { statusEtapa: 'Produzido', produzidoEm: ts, atualizadoEm: ts },
    { merge: true }
  );

  // Ciclo (espelho do StaPed)
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
  } catch {}
}

/** (Opcional) Backfill de PEDIDOS → Cozinha para a semana. */
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

/** Resumo para UI. */
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

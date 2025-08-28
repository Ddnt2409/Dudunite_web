// src/util/cozinha_store.js
import { db } from "../firebase";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  runTransaction,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";

// Coleção usada pela Cozinha
const COL = "pcp_pedidos";

/** Cria/atualiza (merge) um pedido Alimentado para a coleção da Cozinha. */
export async function upsertAlimentadoCozinha(id, payload) {
  const ref = doc(db, COL, id);
  await setDoc(
    ref,
    {
      statusEtapa: "Alimentado",
      atualizadoEm: serverTimestamp(),
      ...payload, // {cidade, pdv, itens:[{produto,qtd}], sabores:{produto:[{sabor,qtd}...]}, dataPrevista: 'YYYY-MM-DD'}
    },
    { merge: true }
  );
}

/** Assina em tempo real TODOS os pedidos Alimentados (filtro será no cliente). */
export function subscribePedidosAlimentados(onChange, onError) {
  const col = collection(db, COL);
  const q = query(col, where("statusEtapa", "==", "Alimentado"));
  return onSnapshot(
    q,
    (snap) => {
      const pedidos = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      // ordenação estável no cliente
      pedidos.sort((a, b) => {
        const da = String(a.dataPrevista || "");
        const dbb = String(b.dataPrevista || "");
        if (da !== dbb) return da.localeCompare(dbb);
        return String(a.pdv || a.escola || "").localeCompare(
          String(b.pdv || b.escola || "")
        );
      });
      onChange(pedidos);
    },
    (err) => onError && onError(err)
  );
}

/** Ajusta (±delta) a produção parcial de um produto, com clamp ao limite. */
export async function atualizarParcial(pedidoId, produto, delta) {
  const ref = doc(db, COL, pedidoId);
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists()) throw new Error("Pedido não existe.");
    const data = snap.data();

    // limite = soma das linhas do produto (sabores) ou qtd do item no array itens
    let limite = 0;
    if (data?.sabores && data.sabores[produto]) {
      limite = data.sabores[produto].reduce(
        (s, ln) => s + Number(ln.qtd || ln.quantidade || 0),
        0
      );
    } else if (Array.isArray(data?.itens)) {
      const it = data.itens.find(
        (i) => String(i.produto).toUpperCase() === String(produto).toUpperCase()
      );
      limite = Number(it?.qtd ?? it?.quantidade ?? 0);
    }

    const parciais = { ...(data.parciais || {}) };
    const atual = Number(parciais[produto] || 0);
    let novo = atual + Number(delta || 0);
    if (!Number.isFinite(novo)) novo = atual;
    if (limite > 0) {
      novo = Math.max(0, Math.min(limite, novo));
    } else {
      novo = Math.max(0, novo);
    }
    parciais[produto] = novo;

    tx.update(ref, { parciais, atualizadoEm: serverTimestamp() });
  });
}

/** Atalho para somar (incremento positivo). */
export async function salvarParcial(pedidoId, produto, qtd) {
  return atualizarParcial(pedidoId, produto, +Number(qtd || 0));
}

/** Marca o pedido como Produzido. */
export async function marcarProduzido(pedidoId) {
  const ref = doc(db, COL, pedidoId);
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists()) throw new Error("Pedido não existe.");
    tx.update(ref, {
      statusEtapa: "Produzido",
      produzidoEm: serverTimestamp(),
      atualizadoEm: serverTimestamp(),
    });
  });
}

/** Resumo para a UI (total solicitado, produzido e se está completo). */
export function resumoPedido(p) {
  const itens = Array.isArray(p?.itens) ? p.itens : [];
  const parciais = p?.parciais || {};
  let total = 0;
  let produzido = 0;

  itens.forEach((it) => {
    const pedida = Number(it.qtd ?? it.quantidade ?? 0);
    const prod = Number(parciais[it.produto] || 0);
    total += pedida;
    produzido += Math.min(pedida, prod);
  });

  const completo = total > 0 && produzido >= total;
  const restam = Math.max(0, total - produzido);
  return { total, produzido, restam, completo };
}

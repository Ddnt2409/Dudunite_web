// src/util/cozinha_store.js
import { db } from "../firebase";
import {
  collection,
  onSnapshot,
  doc,
  runTransaction,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";

const COL = "pcp_pedidos";

/** Upsert para a coleção lida pela Cozinha. */
export async function upsertAlimentadoCozinha(id, payload) {
  const ref = doc(db, COL, id);
  await setDoc(
    ref,
    {
      statusEtapa: "Alimentado",
      atualizadoEm: serverTimestamp(),
      ...payload, // {cidade, pdv, itens:[{produto,qtd}], sabores:{...}, dataPrevista:'YYYY-MM-DD'}
    },
    { merge: true }
  );
}

/**
 * Assina a coleção inteira e filtra no cliente por “Alimentado”
 * (case-insensitive e com fallback para campo `status`).
 * Isso evita sumir tudo quando o valor/field diverge.
 */
export function subscribePedidosAlimentados(onChange, onError) {
  const col = collection(db, COL);
  return onSnapshot(
    col,
    (snap) => {
      const arr = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      const pedidos = arr.filter((p) => {
        const st = String(p.statusEtapa ?? p.status ?? "").toLowerCase();
        return st.includes("aliment"); // pega "Alimentado", "ALIMENTADO", etc.
      });

      // ordenação simples: dataPrevista e PDV
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

/** Ajusta produção parcial de um produto (delta pode ser +/-). */
export async function atualizarParcial(pedidoId, produto, delta) {
  const ref = doc(db, COL, pedidoId);
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists()) throw new Error("Pedido não existe.");
    const data = snap.data();

    // limite: soma das linhas de sabores (se houver) ou qtd do item em `itens`
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
    if (limite > 0) novo = Math.max(0, Math.min(limite, novo));
    else novo = Math.max(0, novo);

    parciais[produto] = novo;
    tx.update(ref, { parciais, atualizadoEm: serverTimestamp() });
  });
}

export async function salvarParcial(pedidoId, produto, qtd) {
  return atualizarParcial(pedidoId, produto, +Number(qtd || 0));
}

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

export function resumoPedido(p) {
  const itens = Array.isArray(p?.itens) ? p.itens : [];
  const parciais = p?.parciais || {};
  let total = 0,
    produzido = 0;
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

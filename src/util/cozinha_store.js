// src/util/cozinha_store.js
import { db } from "../firebase";
import {
  collection, query, where, orderBy, onSnapshot,
  doc, runTransaction, serverTimestamp, getDocs
} from "firebase/firestore";

const COL = "pcp_pedidos";

/** Assina pedidos ALIMENTADO. Aceita (onChange, onError) ou ({cidade,pdv}, onChange, onError). */
export function subscribePedidosAlimentados(a, b, c) {
  let onChange, onError, filters;
  if (typeof a === "function") {
    onChange = a; onError = b; filters = {};
  } else {
    filters = a || {}; onChange = b; onError = c;
  }
  const clauses = [where("statusEtapa", "==", "Alimentado")];
  if (filters.cidade && filters.cidade !== "Todos") clauses.push(where("cidade", "==", filters.cidade));
  if (filters.pdv    && filters.pdv    !== "Todos") clauses.push(where("pdv",    "==", filters.pdv));
  const q = query(collection(db, COL), ...clauses, orderBy("pdv"));
  return onSnapshot(q, snap => {
    onChange(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  }, onError);
}

/** Upsert no espelho lido pela Cozinha (mantém `parciais`). */
export async function upsertAlimentadoCozinha(id, payload) {
  const ref = doc(db, COL, id);
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    const prev = snap.exists() ? snap.data() : {};
    tx.set(ref, {
      cidade:       payload.cidade       ?? prev.cidade ?? "Gravatá",
      pdv:          payload.pdv          ?? prev.pdv    ?? "",
      itens:        payload.itens        ?? prev.itens  ?? [],
      sabores:      payload.sabores      ?? prev.sabores ?? {},
      dataPrevista: payload.dataPrevista ?? prev.dataPrevista ?? null,
      parciais:     prev.parciais || {},             // << aqui é por produto
      statusEtapa:  "Alimentado",
      produzidoEm:  prev.produzidoEm ?? null,
      atualizadoEm: serverTimestamp(),
    }, { merge: true });
  });
}

/** Soma/abate produção parcial de um produto. */
export async function atualizarParcial(pedidoId, produto, delta) {
  const ref = doc(db, COL, pedidoId);
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists()) throw new Error("Pedido não existe.");
    const data = snap.data();
    const par = { ...(data.parciais || {}) };
    const atual = Number(par[produto] || 0);
    par[produto] = Math.max(0, atual + Number(delta || 0));
    tx.update(ref, { parciais: par, atualizadoEm: serverTimestamp() });
  });
}

/** Finaliza o pedido. */
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

/** Totais para a UI (compatível com seu `resumo.restam`). */
export function resumoPedido(p) {
  const sabores = p?.sabores || {};
  const par = p?.parciais || {};
  let total = 0, produzido = 0;

  Object.entries(sabores).forEach(([prod, linhas]) => {
    const totalProd = (linhas || []).reduce(
      (s, ln) => s + Number(ln.qtd || ln.quantidade || 0), 0
    );
    total += totalProd;
    produzido += Math.min(Number(par[prod] || 0), totalProd);
  });

  const restam = Math.max(0, total - produzido);
  const completo = total > 0 && restam === 0;
  return { total, produzido, restam, completo };
}

/** Opcional: copia PEDIDOS já 'Alimentado' para `pcp_pedidos` (rodar 1x se precisar). */
export async function backfillCozinhaSemana() {
  const q = query(collection(db, "PEDIDOS"), where("statusEtapa", "==", "Alimentado"));
  const snap = await getDocs(q);
  for (const d of snap.docs) {
    const data = d.data();
    const itens = (data.itens || []).map(it => ({
      produto: it.produto || it.nome || "",
      quantidade: Number(it.quantidade || it.qtd || 0),
    }));
    await upsertAlimentadoCozinha(d.id, {
      cidade: data.cidade || "Gravatá",
      pdv: data.escola || data.pdv || "",
      itens,
      sabores: data.sabores || {},
      dataPrevista: data.dataPrevista || null,
    });
  }
}

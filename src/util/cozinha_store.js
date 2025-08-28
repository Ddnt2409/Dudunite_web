import { db } from "../firebase";
import {
  collection, query, where, onSnapshot,
  doc, runTransaction, serverTimestamp, getDocs
} from "firebase/firestore";

const COL = "pcp_pedidos";

/** Assina pedidos com statusEtapa = 'Alimentado'.
 *  Pode ser chamado de 2 jeitos:
 *   - subscribePedidosAlimentados(onChange, onError)
 *   - subscribePedidosAlimentados({cidade, pdv}, onChange, onError)
 */
export function subscribePedidosAlimentados(a, b, c) {
  let filters = {}, onChange, onError;
  if (typeof a === "function") {
    onChange = a; onError = b;
  } else {
    filters = a || {}; onChange = b; onError = c;
  }

  const clauses = [ where("statusEtapa", "==", "Alimentado") ];
  if (filters.cidade && filters.cidade !== "Todos") clauses.push(where("cidade", "==", filters.cidade));
  if (filters.pdv    && filters.pdv    !== "Todos") clauses.push(where("pdv",    "==", filters.pdv));

  // Sem orderBy -> evita exigir índice composto. Ordenamos no cliente.
  const q = query(collection(db, COL), ...clauses);

  return onSnapshot(q,
    (snap) => {
      const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      onChange && onChange(docs);
    },
    (err) => onError && onError(err)
  );
}

/** Upsert no espelho que a Cozinha lê. Mantém `parciais` por produto. */
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
      parciais:     prev.parciais || {},
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
    par[produto] = Math.max(0, Number(par[produto] || 0) + Number(delta || 0));
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

/** Resumo para UI. */
export function resumoPedido(p) {
  const sabores = p?.sabores || {};
  const par     = p?.parciais || {};
  let total = 0, produzido = 0;

  Object.entries(sabores).forEach(([prod, linhas]) => {
    const totalProd = (linhas || []).reduce((s, ln) => s + Number(ln.qtd || ln.quantidade || 0), 0);
    total += totalProd;
    produzido += Math.min(Number(par[prod] || 0), totalProd);
  });

  const restam   = Math.max(0, total - produzido);
  const completo = total > 0 && restam === 0;
  return { total, produzido, restam, completo };
}

/** (Opcional) Backfill para copiar pedidos 'Alimentado' já existentes. */
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

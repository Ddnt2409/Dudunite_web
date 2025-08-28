// src/util/cozinha_store.js
import { db } from "../firebase";
import {
  collection, query, where, orderBy, onSnapshot,
  doc, runTransaction, serverTimestamp, getDocs
} from "firebase/firestore";

const COL = "pcp_pedidos"; // coleção lida pela Cozinha

/** Assina, em tempo real, pedidos ALIMENTADO, com filtros opcionais. */
export function subscribePedidosAlimentados({ cidade = null, pdv = null } = {}, onChange) {
  const col = collection(db, COL);
  const clauses = [where("statusEtapa", "==", "Alimentado")];
  if (cidade && cidade !== "Todos") clauses.push(where("cidade", "==", cidade));
  if (pdv && pdv !== "Todos")       clauses.push(where("pdv",    "==", pdv));

  // orderBy simples para evitar exigência de índice composto
  const q = query(col, ...clauses, orderBy("pdv"));
  return onSnapshot(q, snap => {
    const pedidos = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    onChange(pedidos);
  });
}

/** Upsert no espelho da Cozinha (chamado pelo AliSab ao salvar). */
export async function upsertAlimentadoCozinha(id, payload) {
  const ref = doc(db, COL, id);
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    const prev = snap.exists() ? snap.data() : {};
    const data = {
      cidade:      payload.cidade      ?? prev.cidade ?? "Gravatá",
      pdv:         payload.pdv         ?? prev.pdv    ?? "",
      itens:       payload.itens       ?? prev.itens  ?? [],
      sabores:     payload.sabores     ?? prev.sabores ?? {},
      dataPrevista:payload.dataPrevista?? prev.dataPrevista ?? null, // string YYYY-MM-DD ou null
      statusEtapa: "Alimentado",
      producao:    prev.producao || {},      // mapa de linhas concluídas
      produzidoEm: prev.produzidoEm || null, // só quando finalizar
      atualizadoEm: serverTimestamp(),
    };
    tx.set(ref, data, { merge: true });
  });
}

/** Marca/desmarca uma linha (sabor) como produzida. */
export async function toggleLinha(pedidoId, key, checked) {
  const ref = doc(db, COL, pedidoId);
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists()) throw new Error("Pedido não existe.");
    const data = snap.data();
    const producao = { ...(data.producao || {}) };

    if (checked) producao[key] = true;
    else delete producao[key];

    // calcula progresso
    let total = 0, feito = 0;
    const sabores = data.sabores || {};
    Object.entries(sabores).forEach(([prod, linhas]) => {
      linhas.forEach((ln, idx) => {
        const k = `${prod}::${ln.sabor}::${idx}`;
        total += Number(ln.qtd || 0);
        if (producao[k]) feito += Number(ln.qtd || 0);
      });
    });
    const completo = total > 0 && feito >= total;

    const patch = {
      producao,
      atualizadoEm: serverTimestamp(),
      statusEtapa: completo ? "Produzido" : "Alimentado",
      produzidoEm: completo ? serverTimestamp() : null,
    };
    tx.update(ref, patch);
  });
}

/** Força finalizar um pedido. */
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
  const sabores = p.sabores || {};
  const producao = p.producao || {};
  let total = 0, produzido = 0;

  Object.entries(sabores).forEach(([prod, linhas]) => {
    linhas.forEach((ln, idx) => {
      const key = `${prod}::${ln.sabor}::${idx}`;
      total += Number(ln.qtd || 0);
      if (producao[key]) produzido += Number(ln.qtd || 0);
    });
  });

  const restante = Math.max(0, total - produzido);
  const completo = total > 0 && restante === 0;
  return { total, produzido, restante, completo };
}

/** Backfill: copia PEDIDOS já 'Alimentado' para a coleção da Cozinha (use 1x). */
export async function backfillCozinhaSemana() {
  const src = collection(db, "PEDIDOS");
  const q = query(src, where("statusEtapa", "==", "Alimentado"));
  const snap = await getDocs(q);
  for (const d of snap.docs) {
    const data = d.data();
    const itens = (data.itens || []).map(it => ({
      produto: it.produto || it.nome || "",
      qtd: Number(it.quantidade || it.qtd || 0),
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

// src/util/cozinha_store.js
import { db } from "../firebase";
import {
  collection, query, where, onSnapshot,
  doc, setDoc, getDoc, runTransaction, serverTimestamp,
} from "firebase/firestore";
import { upsertPedidoInCiclo, semanaRefFromDate } from "./Ciclo";

const COL = "pcp_pedidos";

/** Assina pedidos ALIMENTADO/PRODUZIDO para a Cozinha (tempo real). */
export function subscribePedidosAlimentados(onChange, onError) {
  try {
    const col = collection(db, COL);
    const q = query(col, where("statusEtapa", "in", ["Alimentado", "Produzido"]));
    return onSnapshot(
      q,
      (snap) => {
        const pedidos = snap.docs.map(d => ({ id: d.id, ...d.data() }))
          .sort((a, b) => {
            const da = String(a.dataPrevista || "");
            const dbb = String(b.dataPrevista || "");
            if (da < dbb) return -1;
            if (da > dbb) return 1;
            return (a.pdv || a.escola || "").localeCompare(b.pdv || b.escola || "");
          });
        onChange?.(pedidos);
      },
      (err) => onError?.(err)
    );
  } catch (e) {
    onError?.(e);
    return () => {};
  }
}

/** Incrementa/decrementa produção parcial. */
export async function atualizarParcial(pedidoId, produto, delta) {
  const ref = doc(db, COL, pedidoId);
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists()) throw new Error("Pedido não existe.");
    const data = snap.data() || {};
    const parciais = { ...(data.parciais || {}) };
    const atual = Number(parciais[produto] || 0);
    const novo  = Math.max(0, atual + Number(delta || 0));
    parciais[produto] = novo;
    tx.set(ref, { parciais, atualizadoEm: serverTimestamp() }, { merge: true });
  });
}

/** Marca como PRODUZIDO (apenas informativo; sem alterar financeiro). */
export async function marcarProduzido(pedidoId) {
  const ts = serverTimestamp();

  // 1) Cozinha
  await setDoc(doc(db, COL, pedidoId),
    { statusEtapa: "Produzido", produzidoEm: ts, atualizadoEm: ts },
    { merge: true }
  );

  // 2) Raiz PEDIDOS
  const refRoot = doc(db, "PEDIDOS", pedidoId);
  await setDoc(refRoot,
    { statusEtapa: "Produzido", produzidoEm: ts, atualizadoEm: ts },
    { merge: true }
  );

  // 3) CICLO (StaPed)
  try {
    const rootSnap = await getDoc(refRoot);
    if (rootSnap.exists()) {
      const d = rootSnap.data() || {};
      const criado =
        d?.criadoEm?.toDate?.() ||
        d?.createdEm?.toDate?.() ||
        new Date();
      const weeklyPath = semanaRefFromDate(criado).path;

      await setDoc(
        doc(db, weeklyPath, pedidoId),
        { statusEtapa: "Produzido", produzidoEm: ts, atualizadoEm: ts },
        { merge: true }
      );

      await upsertPedidoInCiclo(
        pedidoId,
        { ...d, statusEtapa: "Produzido", produzidoEm: new Date() },
        criado
      );
    }
  } catch {
    // ignore
  }
}

/** Espelho usado quando o AliSab salva sabores. (sem tocar no financeiro) */
export async function upsertAlimentadoCozinha(pedidoId, data) {
  await setDoc(
    doc(db, COL, pedidoId),
    {
      statusEtapa: "Alimentado",
      cidade: data.cidade || "",
      pdv: data.pdv || data.escola || "",
      itens: Array.isArray(data.itens) ? data.itens : [],
      sabores: data.sabores || {},
      parciais: data.parciais || {},
      dataPrevista: data.dataPrevista || "",   // string YYYY-MM-DD (vencimento do pedido)
      atualizadoEm: serverTimestamp(),
    },
    { merge: true }
  );
}

/** Resumo para UI. */
export function resumoPedido(p) {
  const itens = Array.isArray(p.itens) ? p.itens : [];
  const parciais = p.parciais || {};
  let total = 0, produzido = 0, parcial = false;

  itens.forEach(it => {
    const pedida = Number(it.qtd || it.quantidade || 0);
    const prod   = Number(parciais[it.produto] || 0);
    total     += pedida;
    produzido += Math.min(prod, pedida);
    if (prod > 0 && prod < pedida) parcial = true;
  });

  const completo = total > 0 && produzido >= total;
  const restam = Math.max(0, total - produzido);
  return { total, produzido, parcial, completo, restam };
}

// src/util/Ciclo.js
import { doc, setDoc, deleteDoc } from "firebase/firestore";

/** Segunda-feira 11:00 da semana de referência (local time) */
function segunda11(ref = new Date()) {
  const d = new Date(ref);
  // transforma domingo(0)→6, segunda(1)→0...
  const dow = (d.getDay() + 6) % 7;
  d.setHours(11, 0, 0, 0);
  d.setDate(d.getDate() - dow);
  return d;
}

export function semanaRefFromDate(ref = new Date()) {
  const b = segunda11(ref);
  const yyyy = b.getFullYear();
  const mm = String(b.getMonth() + 1).padStart(2, "0");
  const dd = String(b.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export function caminhoCicloFromDate(ref = new Date(), prefix = "CICLOS") {
  return `${prefix}/${semanaRefFromDate(ref)}/PEDIDOS`;
}

/** Upsert do pedido na coleção semanal (espelho da raiz PEDIDOS) */
export async function upsertPedidoInCiclo(db, pedidoId, data, baseDate = new Date()) {
  const path = caminhoCicloFromDate(baseDate);
  const ref = doc(db, path, pedidoId);
  await setDoc(ref, data, { merge: true });
}

/** Delete do pedido na coleção semanal */
export async function deletePedidoInCiclo(db, pedidoId, baseDate = new Date()) {
  const path = caminhoCicloFromDate(baseDate);
  const ref = doc(db, path, pedidoId);
  await deleteDoc(ref);
}

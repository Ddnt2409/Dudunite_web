// src/util/Ciclo.js
import { doc, setDoc, deleteDoc } from "firebase/firestore";

// 2ª às 11h (local)
function segunda11Base(ref = new Date()) {
  const d = new Date(ref);
  const dow = (d.getDay() + 6) % 7; // 0=Seg
  d.setHours(11,0,0,0);
  d.setDate(d.getDate() - dow);
  return d;
}
export function semanaRefFromDate(ref = new Date()) {
  const b = segunda11Base(ref);
  const yyyy = b.getFullYear();
  const mm = String(b.getMonth()+1).padStart(2,"0");
  const dd = String(b.getDate()).padStart(2,"0");
  return `${yyyy}-${mm}-${dd}`;
}
export function caminhoCicloFromDate(ref = new Date(), prefix = "CICLOS") {
  return `${prefix}/${semanaRefFromDate(ref)}/PEDIDOS`;
}

// Upsert do pedido na coleção semanal (merge)
export async function upsertPedidoInCiclo(db, pedidoId, data, baseDate = new Date()) {
  const path = caminhoCicloFromDate(baseDate);
  const ref = doc(db, path, pedidoId);
  await setDoc(ref, data, { merge: true });
}

// Delete do pedido na coleção semanal
export async function deletePedidoInCiclo(db, pedidoId, baseDate = new Date()) {
  const path = caminhoCicloFromDate(baseDate);
  const ref = doc(db, path, pedidoId);
  await deleteDoc(ref);
}

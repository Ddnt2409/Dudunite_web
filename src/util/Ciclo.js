// src/util/Ciclo.js
import { collection, doc, setDoc, deleteDoc } from "firebase/firestore";
import db from "../firebase";

/**
 * Compat: por enquanto todo ciclo aponta para a mesma coleção "PEDIDOS".
 * Se amanhã quisermos particionar por semana, basta alterar estas funções
 * sem tocar nas telas.
 */

// Caminho da coleção do ciclo ATUAL (compat)
export function caminhoCicloAtual() {
  return "PEDIDOS";
}

// Caminho da coleção do ciclo referente a uma data (compat)
export function caminhoCicloFromDate(_date) {
  return "PEDIDOS";
}

// Referência de coleção para a “semana/ciclo” de uma data
export function semanaRefFromDate(date = new Date()) {
  return collection(db, caminhoCicloFromDate(date));
}

// Upsert de um pedido dentro do ciclo (merge = true)
export async function upsertPedidoInCiclo(id, data, date = new Date()) {
  const colRef = semanaRefFromDate(date);
  const ref = doc(colRef, id);
  await setDoc(ref, data, { merge: true });
  return ref;
}

// Remoção de um pedido do ciclo
export async function deletePedidoInCiclo(id, date = new Date()) {
  const colRef = semanaRefFromDate(date);
  const ref = doc(colRef, id);
  await deleteDoc(ref);
  return true;
}

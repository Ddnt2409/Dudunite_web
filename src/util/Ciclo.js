// src/util/Ciclo.js
import { doc, setDoc, deleteDoc } from "firebase/firestore";
import db from "../firebase";

/**
 * Início do ciclo semanal (segunda 11:00, horário local).
 * Se a data/hora atual for antes de seg 11:00, volta uma semana.
 */
export function inicioDoCiclo(date = new Date()) {
  const d = new Date(date);
  const dow = d.getDay(); // 0=Dom ... 1=Seg ... 6=Sáb

  // Chega na segunda desta semana às 11:00
  const segunda = new Date(d);
  segunda.setHours(11, 0, 0, 0);

  // recua até segunda
  const diffToMonday = (dow + 6) % 7; // seg=0
  segunda.setDate(segunda.getDate() - diffToMonday);

  // Se a "date" ainda era antes dessa segunda 11:00, usamos a segunda anterior
  if (date < segunda) {
    segunda.setDate(segunda.getDate() - 7);
  }
  return segunda; // Date da segunda às 11:00 que abre o ciclo
}

/** ID legível do ciclo, ex.: 2025-08-11-11h */
export function idDoCiclo(date = new Date()) {
  const base = inicioDoCiclo(date);
  const y = base.getFullYear();
  const m = String(base.getMonth() + 1).padStart(2, "0");
  const d = String(base.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}-11h`;
}

/**
 * Caminho da subcoleção de pedidos do ciclo de 'date'.
 * Ex.: CICLOS/2025-08-11-11h/PEDIDOS
 */
export function semanaRefFromDate(date = new Date()) {
  return `CICLOS/${idDoCiclo(date)}/PEDIDOS`;
}

/**
 * Alias semântico usado pela StaPed: mesmo caminho do ciclo.
 * Mantido para compatibilidade com imports existentes.
 */
export function caminhoCicloFromDate(date = new Date()) {
  return semanaRefFromDate(date);
}

/** Atalho para o caminho do ciclo ATUAL */
export function caminhoCicloAtual() {
  return semanaRefFromDate(new Date());
}

/**
 * Upsert de um pedido no bucket do ciclo (espelho semanal).
 * - id: id do documento do pedido
 * - dados: objeto a gravar (merge)
 * - date?: opcional para forçar outro ciclo
 */
export async function upsertPedidoInCiclo(id, dados, date = new Date()) {
  const path = semanaRefFromDate(date);
  const ref = doc(db, path, id);
  await setDoc(ref, dados || {}, { merge: true });
}

/** Remove um pedido do bucket do ciclo (ex.: desfazer alimentação) */
export async function deletePedidoInCiclo(id, date = new Date()) {
  const path = semanaRefFromDate(date);
  const ref = doc(db, path, id);
  await deleteDoc(ref);
}

export default {
  inicioDoCiclo,
  idDoCiclo,
  semanaRefFromDate,
  caminhoCicloFromDate,
  caminhoCicloAtual,
  upsertPedidoInCiclo,
  deletePedidoInCiclo,
};

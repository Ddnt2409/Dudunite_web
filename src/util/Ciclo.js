// src/util/Ciclo.js
import { doc, setDoc, deleteDoc } from "firebase/firestore";
import db from "../firebase";

/** Retorna o Date do INÍCIO DO CICLO da semana da data informada:
 *  segunda-feira às 11:00 (hora local). */
export function inicioDoCiclo(date = new Date()) {
  const d = new Date(date);
  // zera minutos/segundos/ms e mantém data local
  d.setSeconds(0, 0);
  d.setMinutes(0);
  d.setHours(11); // 11:00

  // volta até a segunda desta semana
  const today = new Date(d);
  const dow = today.getDay(); // 0 dom, 1 seg, ..., 6 sáb
  const diffToMonday = (dow + 6) % 7; // quantos dias voltar para chegar em seg
  today.setDate(today.getDate() - diffToMonday);

  // se a data original (date) ainda era ANTES das 11:00 da segunda,
  // então o ciclo válido é a segunda anterior
  const base = new Date(today); // segunda às 11
  base.setHours(11, 0, 0, 0);
  if (date < base) {
    base.setDate(base.getDate() - 7); // volta 1 semana
  }
  return base;
}

/** ID legível do ciclo, ex: 2025-08-11-11h */
export function idDoCiclo(date = new Date()) {
  const base = inicioDoCiclo(date);
  const y = base.getFullYear();
  const m = String(base.getMonth() + 1).padStart(2, "0");
  const d = String(base.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}-11h`;
}

/** Caminho completo da subcoleção PEDIDOS do ciclo de 'date' */
export function semanaRefFromDate(date = new Date()) {
  return `CICLOS/${idDoCiclo(date)}/PEDIDOS`;
}

/** Atalho para o caminho da semana/ciclo ATUAL */
export function caminhoCicloAtual() {
  return semanaRefFromDate(new Date());
}

/** Upsert de um pedido dentro do ciclo (espelha no bucket da semana).
 *  - id: ID do pedido
 *  - dados: objeto do pedido (será feito merge)
 *  - date?: opcional, para forçar outro ciclo
 */
export async function upsertPedidoInCiclo(id, dados, date = new Date()) {
  const path = semanaRefFromDate(date);
  const ref = doc(db, path, id);
  await setDoc(ref, dados || {}, { merge: true });
}

/** Remove um pedido do bucket da semana (ex.: ao desfazer alimentação) */
export async function deletePedidoInCiclo(id, date = new Date()) {
  const path = semanaRefFromDate(date);
  const ref = doc(db, path, id);
  await deleteDoc(ref);
}

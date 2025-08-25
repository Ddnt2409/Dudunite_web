// src/util/CrHelpers.js
// === Helpers & Constantes (esqueleto) ===
export const corTerracota = "#8c3b1b";
export const corFundo = "#fff5ec";

export const CANAIS   = { REVENDA: "revenda", VAREJO: "varejo" };
export const SITUACAO = { PREVISTO: "Previsto", REALIZADO: "Realizado" };
export const RECUR    = { ISOLADO: "Isolado", SEMANAL: "Semanal", QUINZENAL: "Quinzenal", MENSAL: "Mensal" };

export function toNumber(n) {
  return Number.isFinite(n) ? n : Number(n || 0);
}

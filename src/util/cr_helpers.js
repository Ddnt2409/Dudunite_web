// src/util/cr_helpers.js
// === Helpers & Constantes ===
export const corTerracota = "#8c3b1b";
export const corFundo = "#fff5ec";

export const CANAIS   = { REVENDA: "revenda", VAREJO: "varejo" };
export const SITUACAO = { PREVISTO: "Previsto", REALIZADO: "Realizado" };
export const RECUR    = { ISOLADO: "Isolado", SEMANAL: "Semanal", QUINZENAL: "Quinzenal", MENSAL: "Mensal" };

export function toNumber(n) {
  return Number.isFinite(n) ? n : Number(n || 0);
}

// (opcional, já deixo pronto para a próxima etapa)
export function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}
export function gerarOcorrenciasRecorrencia({ recorrencia, dataInicial, repeticoes = 1 }) {
  const out = [];
  let atual = new Date(dataInicial);
  for (let i = 0; i < Math.max(1, toNumber(repeticoes)); i++) {
    out.push(new Date(atual));
    switch (recorrencia) {
      case RECUR.SEMANAL:   atual = addDays(atual, 7);  break;
      case RECUR.QUINZENAL: atual = addDays(atual, 15); break;
      case RECUR.MENSAL:    atual = addDays(atual, 30); break; // regra do projeto
      default: i = repeticoes; break; // Isolado
    }
  }
  return out;
}
export function descricaoExtrato({ origem, pdv, produto }) {
  const base = origem === "pedido" ? `Recebimento de pedido – ${pdv}` : `Recebimento avulso`;
  return produto ? `${base} (${produto})` : base;
}

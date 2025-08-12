// src/util/PDVsValidos.js
// === Lista mestre de PDVs por cidade ===
// (Ajuste aqui se precisar incluir/remover PDVs)

export const PDVs_VALIDOS = [
  {
    cidade: "GRAVATÁ",
    pdvs: [
      "Pequeno Príncipe",
      "Salesianas",
      "Céu Azul",
      "Russas",
      "Bora Gastar",
      "Kaduh",
      "Society Show",
      "Degusty",
    ],
  },
  {
    cidade: "RECIFE",
    pdvs: [
      "Tio Valter",
      "Vera Cruz",
      "Pinheiros",
      "Dourado",
      "BMQ",
      "CFC",
      "Madre de Deus",
      "Saber Viver",
    ],
  },
  {
    cidade: "CARUARU",
    pdvs: [
      "Interativo",
      "Exato Sede",
      "Exato Anexo",
      "Sesi",
      "Motivo",
      "Jesus Salvador",
    ],
  },
];

// Normaliza chave única de PDV por cidade
export function chavePDV(cidade, pdv) {
  const c = String(cidade || "").trim().toUpperCase();
  const p = String(pdv || "").trim().toUpperCase();
  return `${c}|${p}`;
}

// Total de PDVs na lista mestre
export function totalPDVsValidos() {
  return PDVs_VALIDOS.reduce((acc, c) => acc + (c.pdvs?.length || 0), 0);
}

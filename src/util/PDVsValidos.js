// src/util/PDVsValidos.js
// === INÍCIO FNDM01 – Lista Mestre de PDVs por Cidade (carga estática) ===
export const PDVS_VALIDOS = [
  {
    cidade: "GRAVATÁ",
    pdvs: [
      "Pequeno Príncipe","Salesianas","Céu Azul","Russas",
      "Bora Gastar","Kaduh","Society Show","Degusty",
    ],
  },
  {
    cidade: "RECIFE",
    pdvs: [
      "Tio Valter","Vera Cruz","Pinheiros","Dourado",
      "BMQ","CFC","Madre de Deus","Saber Viver",
    ],
  },
  {
    cidade: "CARUARU",
    pdvs: [
      "Interativo","Exato Sede","Exato Anexo",
      "Sesi","Motivo","Jesus Salvador",
    ],
  },
];

export function chavePDV(cidade, pdv) {
  const c = String(cidade || "").trim().toUpperCase();
  const p = String(pdv || "").trim().toUpperCase();
  return `${c}|${p}`;
}

export function totalPDVsValidos() {
  return PDVS_VALIDOS.reduce((acc, c) => acc + c.pdvs.length, 0);
}
// === FIM FNDM01 ===

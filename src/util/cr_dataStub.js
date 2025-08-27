// src/util/cr_dataStub.js  (trecho novo ou para substituir)

const AVULSOS_KEY = "cr_avulsos";

export function carregarAvulsos() {
  try { return JSON.parse(localStorage.getItem(AVULSOS_KEY) || "[]"); }
  catch { return []; }
}

export async function lancamentoAvulso(payload) {
  const arr = carregarAvulsos();

  const id = "avl_" + Date.now() + "_" + Math.floor(Math.random() * 1e6);
  const valorUnit = Number(payload.valorUnit || 0);
  const quantidade = Number(payload.quantidade || 1);

  const registro = {
    id,
    cidade: payload.cidade,
    pdv: payload.pdv,                 // ex.: "VAREJO"
    produto: payload.produto,
    quantidade,
    planoContas: payload.planoContas, // fixo
    formaPagamento: payload.formaPagamento,
    situacao: payload.situacao || "Realizado",
    conta: "CAIXA DIARIO",
    canal: payload.canal || "varejo",
    dataLancamento:
      payload.dataLancamento?.toISOString?.() || payload.dataLancamento,
    dataPrevista:
      payload.dataPrevista?.toISOString?.() || payload.dataPrevista,
    valorUnit,
    valor: valorUnit * quantidade,
  };

  arr.push(registro);
  localStorage.setItem(AVULSOS_KEY, JSON.stringify(arr));
  return registro;
}

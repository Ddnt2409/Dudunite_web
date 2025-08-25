// src/util/cr_datastub.js
// === STUB (sem Firestore) — só para a página compilar e navegar ===

export async function carregarPlanoDeContas() {
  // item fake para preencher o select; trocaremos por Firestore depois
  return [{ id: "PC-STUB", codigo: "0202001", descricao: "Receita de Varejo – Venda Direta" }];
}

export async function carregarPedidosAcumulados() {
  // vazio por enquanto
  return [];
}

export async function getUltimoPreco() {
  // sem preço no stub
  return null;
}

// ações reais virão na etapa Firestore (aqui só garantimos que a UI não quebre)
export async function aprovarPedidoParaCR() { return; }
export async function lancamentoAvulso() { return; }

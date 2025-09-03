// src/util/financeiro_actions.js
// Ações pontuais para o Fluxo de Caixa, persistindo em localStorage
// (sem mexer no seu financeiro_store.js já aprovado).

const LS_KEY = "financeiro_fluxo";

/** Carrega tudo e filtra por intervalo [de, ate) */
export function listarFluxo({ de, ate }) {
  const arr = JSON.parse(localStorage.getItem(LS_KEY) || "[]");
  const deT = de ? new Date(de).getTime() : -Infinity;
  const ateT = ate ? new Date(ate).getTime() : Infinity;
  return arr.filter((m) => {
    const d =
      new Date(m.dataPrevista || m.dataLancamento || m.data || m.dataRealizado || Date.now())
        .getTime();
    return d >= deT && d < ateT;
  });
}

/** Atualiza um item pelo id */
function _updateById(id, mutFn) {
  const arr = JSON.parse(localStorage.getItem(LS_KEY) || "[]");
  const idx = arr.findIndex((x) => x.id === id);
  if (idx < 0) throw new Error("Lançamento não encontrado.");
  arr[idx] = mutFn({ ...arr[idx] });
  localStorage.setItem(LS_KEY, JSON.stringify(arr));
  return arr[idx];
}

/** Marca como realizado (true) ou previsto (false) */
export async function marcarRealizado(id, realizado = true) {
  _updateById(id, (d) => {
    const base = Number(d?.valorPrevisto ?? d?.valor ?? 0);
    d.status = realizado ? "Realizado" : "Previsto";
    d.tipo = d.status;
    d.statusFinanceiro = d.status;
    d.valorRealizado = realizado ? base : 0;
    if (realizado && !d.dataRealizado) d.dataRealizado = new Date().toISOString();
    return d;
  });
}

/** Remove um lançamento */
export async function excluirLancamento(id) {
  const arr = JSON.parse(localStorage.getItem(LS_KEY) || "[]");
  const novo = arr.filter((x) => x.id !== id);
  localStorage.setItem(LS_KEY, JSON.stringify(novo));
}

/**
 * Prepara dados de edição e retorna a tela de destino.
 * A tela alvo (CtsPagar / CtsReceberAvulso) pode ler localStorage("editar_financeiro").
 */
export function prepararEdicaoLancamento(lanc) {
  const payload = {
    id: lanc.id,
    origem:
      Number(lanc?.valorPrevisto ?? lanc?.valor ?? 0) < 0 ? "PAGAR" : "RECEBER",
    data: lanc.dataPrevista || lanc.dataLancamento || lanc.data,
    formaPagamento: lanc.formaPagamento || "",
    planoContas: lanc.planoContas || "",
    planoNome: lanc.planoNome || "",
    descricao: lanc.descricao || lanc.titulo || lanc.memo || "",
    valor: Number(lanc?.valorPrevisto ?? lanc?.valor ?? 0),
  };
  localStorage.setItem("editar_financeiro", JSON.stringify(payload));
  return payload.origem === "PAGAR" ? "CtsPagar" : "CtsReceberAvulso";
}

// src/util/cr_dataStub.js
// ------------------------------------------------------------
// STUB de dados p/ Contas a Receber e FinFlux (navegador)
// ------------------------------------------------------------

const AVULSOS_KEY    = "cr_avulsos";       // Avulsos (Realizados • CAIXA DIARIO)
const ACUMULADOS_KEY = "lanped_pedidos";   // Pedidos do LanPed (Previstos • CAIXA FLUTUANTE)

const PLANO_FIXO = {
  id: "0202001",
  codigo: "0202001",
  descricao: "Receita de Varejo – Venda Direta",
};

// Helpers de LocalStorage
function readLS(key, fallback = []) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const val = JSON.parse(raw);
    return Array.isArray(val) ? val : fallback;
  } catch {
    return fallback;
  }
}
function writeLS(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
}

// ---------- Plano de Contas (único) -----------------------------------------
export function carregarPlanoDeContas() {
  // Mantemos array para compatibilidade com selects existentes
  return Promise.resolve([PLANO_FIXO]);
}

// ---------- AVULSOS (Realizados • CAIXA DIARIO) -----------------------------
export function carregarAvulsos() {
  return readLS(AVULSOS_KEY, []);
}

export async function lancamentoAvulso(payload) {
  const arr = readLS(AVULSOS_KEY, []);

  const id          = `avl_${Date.now()}_${Math.floor(Math.random() * 1e6)}`;
  const quantidade  = Number(payload.quantidade || 0);
  const valorUnit   = Number(payload.valorUnit || 0);

  const registro = {
    id,
    cidade: payload.cidade,               // "Gravatá"
    pdv: payload.pdv,                     // "VAREJO"
    produto: payload.produto,
    quantidade,
    planoContas: payload.planoContas || `${PLANO_FIXO.codigo} – ${PLANO_FIXO.descricao}`,
    formaPagamento: payload.formaPagamento,
    situacao: payload.situacao || "Realizado",
    conta: "CAIXA DIARIO",
    canal: payload.canal || "varejo",
    dataLancamento: payload.dataLancamento?.toISOString?.() || payload.dataLancamento,
    dataPrevista:   payload.dataPrevista?.toISOString?.()   || payload.dataPrevista,
    valorUnit,
    valor: quantidade * valorUnit,
  };

  arr.push(registro);
  writeLS(AVULSOS_KEY, arr);
  return registro;
}

// ---------- ACUMULADOS (LanPed • Previsto • CAIXA FLUTUANTE) ----------------
export async function carregarPedidosAcumulados() {
  // Espera que o LanPed grave objetos do tipo:
  // { id, cidade, pdv, produto, quantidade, forma/formaPagamento, valor, dataPrevista/vencimento, statusEtapa/status }
  return readLS(ACUMULADOS_KEY, []);
}

// ---------- Helpers opcionais p/ testes -------------------------------------
export function limparAvulsos() { writeLS(AVULSOS_KEY, []); }

export function seedAcumuladosExemplo() {
  const hoje = new Date().toISOString().slice(0, 10);
  const seed = [
    { id: "lp_1", cidade: "Gravatá", pdv: "Pequeno Príncipe", produto: "Brw 7x7", quantidade: 10, forma: "PIX",    valor: 150, dataPrevista: hoje, statusEtapa: "Aguardando Confirmação" },
    { id: "lp_2", cidade: "Gravatá", pdv: "Salesianas",        produto: "Escondidinho", quantidade: 5, forma: "Cartao", valor: 200, dataPrevista: hoje, statusEtapa: "Faturado" },
  ];
  writeLS(ACUMULADOS_KEY, seed);
  return seed;
}

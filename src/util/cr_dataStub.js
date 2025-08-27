// src/util/cr_dataStub.js
// ------------------------------------------------------------
// STUB de dados p/ Contas a Receber e FinFlux (navegador)
// ------------------------------------------------------------

const AVULSOS_KEY    = "cr_avulsos";       // Avulsos (Realizados • CAIXA DIARIO)
const ACUMULADOS_KEY = "lanped_pedidos";   // Pedidos do LanPed (Previstos • CAIXA FLUTUANTE)

// possíveis chaves antigas (legado)
const AVULSOS_LEGACY_KEYS = ["avulsos", "cr_avulso", "cts_avulsos", "CtsReceber_avulsos"];

const PLANO_FIXO = {
  id: "0202001",
  codigo: "0202001",
  descricao: "Receita de Varejo – Venda Direta",
};

// ---- LocalStorage helpers ----
function getLS(key) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
function writeLS(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
}
function ensureArray(x) { return Array.isArray(x) ? x : []; }
function dedupById(arr) {
  const seen = new Set();
  const out = [];
  for (const it of ensureArray(arr)) {
    const id = it?.id || JSON.stringify(it);
    if (!seen.has(id)) { seen.add(id); out.push(it); }
  }
  return out;
}

// ---------- Plano de Contas (único) -----------------------------------------
export function carregarPlanoDeContas() {
  return Promise.resolve([PLANO_FIXO]); // array por compatibilidade
}

// ---------- AVULSOS (Realizados • CAIXA DIARIO) -----------------------------
export function carregarAvulsos() {
  // 1) lê principal
  let base = ensureArray(getLS(AVULSOS_KEY));

  // 2) coleta legados, se existirem
  let legacy = [];
  for (const k of AVULSOS_LEGACY_KEYS) {
    const v = getLS(k);
    if (v && Array.isArray(v) && v.length) legacy = legacy.concat(v);
  }

  // 3) migra para a chave oficial
  if (legacy.length) {
    const merged = dedupById([...base, ...legacy]);
    writeLS(AVULSOS_KEY, merged);
    base = merged;
  }

  return base;
}

export async function lancamentoAvulso(payload) {
  const arr = carregarAvulsos(); // já migra legados

  const id          = `avl_${Date.now()}_${Math.floor(Math.random() * 1e6)}`;
  const quantidade  = Number(payload.quantidade || 0);
  const valorUnit   = Number(payload.valorUnit || 0);

  const toIso = (d) => {
    if (!d) return null;
    if (typeof d === "string") return new Date(d).toISOString();
    if (d?.toISOString) return d.toISOString();
    try { return new Date(d).toISOString(); } catch { return null; }
  };

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
    dataLancamento: toIso(payload.dataLancamento),
    dataPrevista:   toIso(payload.dataPrevista),
    valorUnit,
    valor: quantidade * valorUnit,
  };

  arr.push(registro);
  writeLS(AVULSOS_KEY, arr);
  return registro;
}

// ---------- ACUMULADOS (LanPed • Previsto • CAIXA FLUTUANTE) ----------------
export async function carregarPedidosAcumulados() {
  return ensureArray(getLS(ACUMULADOS_KEY));
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

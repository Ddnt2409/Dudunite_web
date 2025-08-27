// src/util/cr_dataStub.js
// ------------------------------------------------------------
// STUB de dados p/ Contas a Receber (Avulsos + Acumulados) e FinFlux
// Usa localStorage no navegador.
// ------------------------------------------------------------

const AVULSOS_KEY    = "cr_avulsos";       // Avulsos (Realizado • CAIXA DIARIO)
const ACUMULADOS_KEY = "lanped_pedidos";   // Acumulados do LanPed (Previsto • CAIXA FLUTUANTE)

// chaves legadas que podem ter sido usadas antes
const AVULSOS_LEGACY_KEYS    = ["avulsos", "cr_avulso", "cts_avulsos", "CtsReceber_avulsos"];
const ACUMULADOS_LEGACY_KEYS = ["LanPed_pedidos", "LanPedPedidos", "lanpedPedidos", "lan_pedidos"];

const PLANO_FIXO = {
  id: "0202001",
  codigo: "0202001",
  descricao: "Receita de Varejo – Venda Direta",
};

// ----------------- helpers localStorage -----------------
function getLS(key) {
  try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : null; }
  catch { return null; }
}
function writeLS(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
}
function ensureArray(x){ return Array.isArray(x) ? x : []; }
function dedupById(arr){
  const seen = new Set(); const out = [];
  for (const it of ensureArray(arr)) {
    const id = it?.id || JSON.stringify(it);
    if (!seen.has(id)) { seen.add(id); out.push(it); }
  }
  return out;
}
const toISO = (d) => {
  if (!d) return null;
  if (typeof d === "string") {
    // aceita "YYYY-MM-DD" já ok
    if (/^\d{4}-\d{2}-\d{2}$/.test(d)) return new Date(d + "T00:00:00").toISOString();
    try { return new Date(d).toISOString(); } catch { return null; }
  }
  if (d?.toISOString) return d.toISOString();
  try { return new Date(d).toISOString(); } catch { return null; }
};

// ----------------- Plano de contas (único) --------------
export function carregarPlanoDeContas() {
  return Promise.resolve([PLANO_FIXO]); // mantém array por compatibilidade
}

// ----------------- AVULSOS (CAIXA DIARIO) ---------------
export function carregarAvulsos() {
  let base = ensureArray(getLS(AVULSOS_KEY));
  // migra legados se houver
  let legacy = [];
  for (const k of AVULSOS_LEGACY_KEYS) {
    const v = getLS(k); if (Array.isArray(v) && v.length) legacy = legacy.concat(v);
  }
  if (legacy.length) {
    const merged = dedupById([...base, ...legacy]);
    writeLS(AVULSOS_KEY, merged);
    base = merged;
  }
  return base;
}

export async function lancamentoAvulso(payload) {
  const arr = carregarAvulsos(); // já migra
  const id         = `avl_${Date.now()}_${Math.floor(Math.random()*1e6)}`;
  const quantidade = Number(payload.quantidade || 0);
  const valorUnit  = Number(payload.valorUnit  || 0);

  const registro = {
    id,
    cidade: payload.cidade,          // "Gravatá"
    pdv: payload.pdv,                // "VAREJO"
    produto: payload.produto,
    quantidade,
    planoContas: payload.planoContas || `${PLANO_FIXO.codigo} – ${PLANO_FIXO.descricao}`,
    formaPagamento: payload.formaPagamento,
    situacao: payload.situacao || "Realizado",
    conta: "CAIXA DIARIO",
    canal: payload.canal || "varejo",
    dataLancamento: toISO(payload.dataLancamento),
    dataPrevista:   toISO(payload.dataPrevista),
    valorUnit,
    valor: quantidade * valorUnit,
  };

  arr.push(registro);
  writeLS(AVULSOS_KEY, arr);
  return registro;
}

// ------------- ACUMULADOS (LanPed • CAIXA FLUTUANTE) ----
// API oficial para o LanPed salvar um pedido:
export async function registrarPedidoLanPed(p) {
  // Campos esperados:
  // cidade, pdv, produto, quantidade, valor, formaPagamento, dataPrevista (ou vencimento), statusEtapa/status
  const arr = carregarPedidosAcumulados(); // já migra legados
  const id  = p.id || `lp_${Date.now()}_${Math.floor(Math.random()*1e6)}`;

  const registro = {
    id,
    cidade: p.cidade,
    pdv: p.pdv,
    produto: p.produto,
    quantidade: Number(p.quantidade || 0),
    valor: Number(p.valor != null ? p.valor : 0),
    forma: p.forma || p.formaPagamento,
    formaPagamento: p.formaPagamento || p.forma,
    dataPrevista: toISO(p.dataPrevista || p.vencimento),
    vencimento: toISO(p.vencimento || p.dataPrevista),
    statusEtapa: p.statusEtapa || p.status || "Aguardando Confirmação", // != "pendente"
    conta: "CAIXA FLUTUANTE",
    tipo: "Previsto",
  };

  arr.push(registro);
  writeLS(ACUMULADOS_KEY, arr);
  return registro;
}

export function carregarPedidosAcumulados() {
  // base
  let base = ensureArray(getLS(ACUMULADOS_KEY));
  // migra legados
  let legacy = [];
  for (const k of ACUMULADOS_LEGACY_KEYS) {
    const v = getLS(k); if (Array.isArray(v) && v.length) legacy = legacy.concat(v);
  }
  if (legacy.length) {
    const merged = dedupById([...base, ...legacy]);
    writeLS(ACUMULADOS_KEY, merged);
    base = merged;
  }
  return base;
}

// ----------------- helpers p/ teste ---------------------
export function limparAvulsos() { writeLS(AVULSOS_KEY, []); }
export function seedAcumuladosExemplo() {
  const hoje = new Date().toISOString().slice(0,10);
  const seed = [
    { id:"lp_1", cidade:"Gravatá", pdv:"Pequeno Príncipe", produto:"Brw 7x7", quantidade:10, forma:"PIX",    valor:150, dataPrevista:hoje, statusEtapa:"Aguardando Confirmação" },
    { id:"lp_2", cidade:"Gravatá", pdv:"Salesianas",        produto:"Escondidinho", quantidade:5, forma:"Cartão", valor:200, dataPrevista:hoje, statusEtapa:"Faturado" }
  ];
  writeLS(ACUMULADOS_KEY, seed);
  return seed;
     }

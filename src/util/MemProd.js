// src/util/MemProd.js

/* ============================
 *  REGRAS / RENDIMENTOS
 * ============================ */

// Unidades por tabuleiro
const REND_TB = {
  BRW_7x7: 12,
  BRW_6x6: 17,
  PKT_5x5: 20,
  PKT_6x6: 15,
  ESC: 26,
  // DUDU não usa tabuleiro (deixar fora)
};

// Unidades por bacia de recheio (por produto)
const REND_BACIA = {
  BRW_7x7: 25,
  BRW_6x6: 35,
  ESC: 26,
  PKT_5x5: 65,
  PKT_6x6: 43,
  // DUDU não usa "bacia" nesta lógica
};

// Insumos por tabuleiro (massa FINNA sabor brownie)
const MARGARINA_MASSA_G_POR_TB = 76;     // g
const OVOS_G_POR_TB = 190;               // g
const FARINHA_MASSA_G_POR_TB = 900;      // g  (= 2 pacotes de 450g)

// Untar
const MARGARINA_UNTAR_G_POR_TB = 40 / 3; // 40g untam 3 assadeiras
const FARINHA_UNTAR_G_POR_TB = 150 / 12; // 150g untam 12 tabuleiros

// Ovos – exibir em UNIDADES (média 52g/un)
const PESO_MEDIO_OVO_G = 52;

// Recheios (por bacia)
const LATA_LEITE_POR_BACIA = 4;           // un
const CREME_LEITE_G_POR_BACIA = 650;      // g
const ACHOCOLATADO_G_PRETO = 360;         // g por bacia PRETA

// Glucose: 500g a cada 6 bacias — mínimo 1 frasco se houver qualquer bacia
const G_FRASCO_GLUCOSE = 500;
const BACIAS_POR_FRASCO_GLUCOSE = 6;

/* ============================
 *  HELPERS
 * ============================ */

const ceil = (x) => Math.ceil(Number(x) || 0);
const toInt = (x) => (Number.isFinite(+x) ? Math.trunc(+x) : 0);
const sum = (arr) => arr.reduce((a, b) => a + (Number(b) || 0), 0);

function clampNonNeg(n) {
  const v = Number(n) || 0;
  return v < 0 ? 0 : v;
}

function normProdName(raw = "") {
  const s = String(raw).toUpperCase();
  if (s.includes("7X7")) return "BRW_7x7";
  if (s.includes("6X6") && (s.includes("BRW") || s.includes("BROWNIE"))) return "BRW_6x6";
  if (s.includes("PKT") || s.includes("POCKET")) {
    if (s.includes("5X5")) return "PKT_5x5";
    if (s.includes("6X6")) return "PKT_6x6";
  }
  if (s.includes("ESC")) return "ESC";
  return null;
}

// tenta ler quantidade do item (quantidade | qtd | qtde)
function getQtd(it) {
  return Number(
    it?.quantidade ?? it?.qtd ?? it?.qtde ?? it?.qty ?? it?.qte ?? 0
  ) || 0;
}

// tenta localizar array de sabores já alimentados
function getSaboresArray(it) {
  // formatos possíveis: sabores, saboresAlimentados, flavors, etc
  const arr =
    it?.sabores ??
    it?.saboresAlimentados ??
    it?.flavors ??
    it?.itensSabores ??
    it?.sabor ??
    [];
  return Array.isArray(arr) ? arr : [];
}

// mapeia nome do sabor -> cor (branco/preto) ou "bem_casado"
function saborCor(nomeRaw = "") {
  const s = String(nomeRaw).toLowerCase();

  // bem casado (50/50)
  if (s.includes("bem casado")) return "bem_casado";

  // branco
  const brancoKeys = [
    "ninho", "brigadeiro branco", "beijinho", "oreo",
    "ovomaltine", "kitkat", "paçoca", "pacoca",
    "ninho com nutella", "brigadeiro branco com confete"
  ];

  // preto
  const pretoKeys = [
    "brigadeiro preto", "palha italiana", "brigadeiro preto com confete"
  ];

  if (brancoKeys.some(k => s.includes(k))) return "branco";
  if (pretoKeys.some(k => s.includes(k))) return "preto";

  // fallback: desconhecido
  return null;
}

/* ============================
 *  AGREGAÇÃO DE PEDIDOS
 * ============================ */

function agregaGeral(pedidos = []) {
  // soma UNIDADES por produto (sem olhar sabores)
  const unidadesPorProduto = {};
  (pedidos || []).forEach((p) => {
    const itens = Array.isArray(p?.items) ? p.items :
                  Array.isArray(p?.itens) ? p.itens : [];
    itens.forEach((it) => {
      const cod = normProdName(it?.produto ?? it?.item ?? it?.nome ?? "");
      if (!cod) return;
      const q = getQtd(it);
      unidadesPorProduto[cod] = (unidadesPorProduto[cod] || 0) + q;
    });
  });
  return { unidadesPorProduto };
}

function agregaTempoReal(pedidos = []) {
  // considera somente pedidos "alimentados"
  const isAlimentado = (p) => !!(p?.dataAlimentado || p?.alimentadoEm);

  const unidadesPorProduto = {};
  const unidadesPorProdutoPorCor = {}; // { BRW_7x7: { branco, preto, neutro } }

  (pedidos || [])
    .filter(isAlimentado)
    .forEach((p) => {
      const itens = Array.isArray(p?.items) ? p.items :
                    Array.isArray(p?.itens) ? p.itens : [];
      itens.forEach((it) => {
        const cod = normProdName(it?.produto ?? it?.item ?? it?.nome ?? "");
        if (!cod) return;

        const sabores = getSaboresArray(it);
        if (!sabores.length) {
          // sem sabores: cai como "neutro"
          const q = getQtd(it);
          unidadesPorProduto[cod] = (unidadesPorProduto[cod] || 0) + q;
          const bucket = (unidadesPorProdutoPorCor[cod] ||= { branco: 0, preto: 0, neutro: 0 });
          bucket.neutro += q;
          return;
        }

        const bucket = (unidadesPorProdutoPorCor[cod] ||= { branco: 0, preto: 0, neutro: 0 });

        sabores.forEach((sv) => {
          const nome = sv?.nome ?? sv?.sabor ?? sv?.label ?? sv?.title ?? "";
          const q = Number(sv?.qtd ?? sv?.quantidade ?? sv?.qtde ?? 0) || 0;
          const cor = saborCor(nome);

          if (cor === "bem_casado") {
            // 50/50
            bucket.branco += q / 2;
            bucket.preto  += q / 2;
            unidadesPorProduto[cod] = (unidadesPorProduto[cod] || 0) + q;
          } else if (cor === "branco" || cor === "preto") {
            bucket[cor] += q;
            unidadesPorProduto[cod] = (unidadesPorProduto[cod] || 0) + q;
          } else {
            bucket.neutro += q;
            unidadesPorProduto[cod] = (unidadesPorProduto[cod] || 0) + q;
          }
        });
      });
    });

  return { unidadesPorProduto, unidadesPorProdutoPorCor };
}

/* ============================
 *  CÁLCULO DE TABULEIROS / BACIAS
 * ============================ */

function tabuleirosPorProduto(unidadesPorProduto) {
  const tb = {};
  Object.entries(unidadesPorProduto).forEach(([cod, un]) => {
    const rend = REND_TB[cod] || 0;
    tb[cod] = rend > 0 ? ceil(un / rend) : 0;
  });
  return tb;
}

function baciasGERAL(unidadesPorProduto) {
  // bacias neutras (sem cor)
  let total = 0;
  Object.entries(unidadesPorProduto).forEach(([cod, un]) => {
    const rend = REND_BACIA[cod] || 0;
    if (rend > 0) total += ceil(un / rend);
  });
  return { branco: 0, preto: 0, total: clampNonNeg(total) };
}

function baciasTempoReal(unidadesPorProduto, unidadesPorProdutoPorCor) {
  let branco = 0, preto = 0, total = 0;

  // 1) por cor quando houver
  Object.entries(unidadesPorProdutoPorCor || {}).forEach(([cod, buckets]) => {
    const rend = REND_BACIA[cod] || 0;
    if (!rend) return;

    const b = ceil(clampNonNeg(buckets.branco) / rend);
    const p = ceil(clampNonNeg(buckets.preto) / rend);
    const n = ceil(clampNonNeg(buckets.neutro) / rend); // neutro existe quando sabores não foram detalhados

    branco += b;
    preto  += p;
    total  += (b + p + n);
  });

  // 2) fallback pelo total (se por algum motivo porCor não trouxe nada)
  if (total === 0) {
    Object.entries(unidadesPorProduto || {}).forEach(([cod, un]) => {
      const rend = REND_BACIA[cod] || 0;
      if (!rend) return;
      total += ceil(un / rend);
    });
  }

  return {
    branco: clampNonNeg(branco),
    preto:  clampNonNeg(preto),
    total:  clampNonNeg(total),
  };
}

/* ============================
 *  LISTA DE COMPRAS
 * ============================ */

function comprasMassaUntar(totalTabuleiros) {
  const tb = clampNonNeg(totalTabuleiros);

  // margarina total (massa + untar)
  const margTotalG = Math.round(tb * (MARGARINA_MASSA_G_POR_TB + MARGARINA_UNTAR_G_POR_TB));

  // ovos em UNIDADES
  const ovosUn = ceil((tb * OVOS_G_POR_TB) / PESO_MEDIO_OVO_G);

  // farinha MASSA em pacotes de 450g (2 por tabuleiro)
  const pacotes450 = tb * 2;
  const caixas12 = Math.floor(pacotes450 / 12);
  const avulsos = pacotes450 % 12;

  // farinha para UNTAR (g)
  const farinhaUntarG = Math.round(tb * FARINHA_UNTAR_G_POR_TB);

  return {
    margarina_total_g: margTotalG,
    ovos_un: ovosUn,
    farinha_massa_caixas12: caixas12,
    farinha_massa_pacotes_avulsos: avulsos,
    farinha_massa_pacotes_450: pacotes450,
    farinha_untar_g: farinhaUntarG,
  };
}

function comprasRecheiosGERAL(bacias) {
  const bTotal = clampNonNeg(bacias?.total || 0);
  if (bTotal === 0) {
    return {
      totals: { leite_cond_395g_un: 0, creme_de_leite_g: 0, achocolatado_g: 0 },
      glucose: { frascos: 0, g: 0 },
    };
  }

  // como não há cor, achocolatado = 0 (só PRETO usa)
  const leite = bTotal * LATA_LEITE_POR_BACIA;
  const creme = bTotal * CREME_LEITE_G_POR_BACIA;

  const frascos = Math.max(1, ceil(bTotal / BACIAS_POR_FRASCO_GLUCOSE));
  const g = frascos * G_FRASCO_GLUCOSE;

  return {
    totals: {
      leite_cond_395g_un: leite,
      creme_de_leite_g: creme,
      achocolatado_g: 0,
    },
    glucose: { frascos, g },
  };
}

function comprasRecheiosTempoReal(bacias) {
  const bBranco = clampNonNeg(bacias?.branco || 0);
  const bPreto  = clampNonNeg(bacias?.preto  || 0);
  // se não houver divisão por cor, usa o total reportado
  const bTotal  = Math.max(Number(bacias?.total || 0), bBranco + bPreto);

  const branco = {
    leite_cond_395g_un: bBranco * LATA_LEITE_POR_BACIA,
    creme_de_leite_g:   bBranco * CREME_LEITE_G_POR_BACIA,
  };
  const preto = {
    leite_cond_395g_un: bPreto * LATA_LEITE_POR_BACIA,
    creme_de_leite_g:   bPreto * CREME_LEITE_G_POR_BACIA,
    achocolatado_g:     bPreto * ACHOCOLATADO_G_PRETO,
  };

  // somas
  let leite  = branco.leite_cond_395g_un + preto.leite_cond_395g_un;
  let creme  = branco.creme_de_leite_g   + preto.creme_de_leite_g;
  let achoc  = preto.achocolatado_g;

  // fallback pelos totais quando cor veio zerada mas existe recheio
  if (leite === 0 && bTotal > 0) leite = bTotal * LATA_LEITE_POR_BACIA;
  if (creme === 0 && bTotal > 0) creme = bTotal * CREME_LEITE_G_POR_BACIA;
  // achocolatado continua 0 se não houver bacias pretas

  const frascos = bTotal > 0 ? Math.max(1, ceil(bTotal / BACIAS_POR_FRASCO_GLUCOSE)) : 0;
  const g = frascos * G_FRASCO_GLUCOSE;

  return {
    porCor: { branco, preto },
    totals: { leite_cond_395g_un: leite, creme_de_leite_g: creme, achocolatado_g: achoc },
    glucose: { frascos, g },
  };
}

/* ============================
 *  API PRINCIPAL
 * ============================ */

export function calculaPlanejamento(pedidos = [], opts = {}) {
  const modo = (opts.modo || "GERAL").toUpperCase();
  const isTempoReal = modo === "TEMPO_REAL";

  // AGREGAÇÃO
  let unidadesPorProduto = {};
  let unidadesPorProdutoPorCor = {};

  if (isTempoReal) {
    const ag = agregaTempoReal(pedidos);
    unidadesPorProduto = ag.unidadesPorProduto;
    unidadesPorProdutoPorCor = ag.unidadesPorProdutoPorCor;
  } else {
    const ag = agregaGeral(pedidos);
    unidadesPorProduto = ag.unidadesPorProduto;
  }

  // TABULEIROS
  const tbPorProduto = tabuleirosPorProduto(unidadesPorProduto);
  const totalTabuleiros = sum(Object.values(tbPorProduto));

  // BACIAS
  const bacias = isTempoReal
    ? baciasTempoReal(unidadesPorProduto, unidadesPorProdutoPorCor)
    : baciasGERAL(unidadesPorProduto);

  // RELATÓRIO BASE
  const rel = {
    plan: {
      modo,
      tabuleiros: tbPorProduto,
      totalTabuleiros,
    },
    bacias: { ...bacias },
  };

  // LISTA DE COMPRAS
  if (opts.compras) {
    const massaUntar = comprasMassaUntar(totalTabuleiros);
    const recheios = isTempoReal
      ? comprasRecheiosTempoReal(bacias)
      : comprasRecheiosGERAL(bacias);

    rel.compras = {
      massa_e_untar: massaUntar,
      recheios,
    };
  }

  return rel;
}

/* ============================
 *  (opcional) export para testes
 * ============================ */
export default calculaPlanejamento;

// src/util/MemProd.js
// ===== Memória de cálculo oficial (centralizada em um arquivo) =====

/* =========================
 * CHAVES / NORMALIZAÇÃO
 * ========================= */
const PROD_KEYS = {
  BRW7x7: "BROWNIE 7X7",
  BRW6x6: "BROWNIE 6X6",
  ESC:    "ESCONDIDINHO",
  PKT5x5: "POCKET 5X5",
  PKT6x6: "POCKET 6X6",
};

function normalizaProduto(p) {
  if (!p) return p;
  const s = String(p).trim().toUpperCase();
  if (s.includes("BRW") && s.includes("7X7")) return PROD_KEYS.BRW7x7;
  if (s.includes("BRW") && s.includes("6X6")) return PROD_KEYS.BRW6x6;
  if ((s.includes("PKT") || s.includes("POCKET")) && s.includes("5X5")) return PROD_KEYS.PKT5x5;
  if ((s.includes("PKT") || s.includes("POCKET")) && s.includes("6X6")) return PROD_KEYS.PKT6x6;
  if (s.startsWith("ESC")) return PROD_KEYS.ESC;
  if (Object.values(PROD_KEYS).includes(s)) return s;
  return s;
}

/* =========================
 * RENDIMENTOS (README)
 * ========================= */

// Unidades por TABULEIRO
const REND_TAB = {
  [PROD_KEYS.BRW7x7]: 12,
  [PROD_KEYS.BRW6x6]: 17,
  [PROD_KEYS.PKT5x5]: 20,
  [PROD_KEYS.PKT6x6]: 15,
  [PROD_KEYS.ESC]:    26,
};

// Unidades por BACIA de recheio
const REND_BACIA_UN = {
  [PROD_KEYS.BRW7x7]: 25,
  [PROD_KEYS.BRW6x6]: 35,
  [PROD_KEYS.ESC]:    26,
  [PROD_KEYS.PKT5x5]: 65, // ≅20 g/un
  [PROD_KEYS.PKT6x6]: 43, // ≅30 g/un
};

// Base da BACIA (para compras)
const BACIA_BASE = {
  leiteCondensado_por_bacia_latas: 4,     // 4 × 395 g
  leiteCondensado_lata_g: 395,
  cremeDeLeite_por_bacia_g: 650,
  glucose_extra_g_a_cada_6_bacias: 500,   // +500 g a cada 6 bacias
};

// Base da MASSA por TABULEIRO (Finna sabor brownie)
const MASSA_POR_TAB_G = {
  margarina: 76,
  ovos: 190,
  farinhaMassa: 900, // = 2 massas (450 g cada)
};

// UNTAR por TABULEIRO
const UNTAR_POR_TAB_G = {
  // 40 g untam 3 assadeiras  -> 13.333... g/tab
  margarina: 40 / 3,
  // 150 g untam 12 tabuleiros -> 12.5 g/tab
  farinha: 150 / 12,
};

// Nutella (apenas onde o sabor pede)
const NUTELLA_POTE_G = 650;
const NUTELLA_G_UN = {
  [PROD_KEYS.BRW7x7]: NUTELLA_POTE_G / 60, // ≈10.833 g/un
  [PROD_KEYS.BRW6x6]: NUTELLA_POTE_G / 85, // ≈7.647 g/un
  [PROD_KEYS.ESC]:    0,
  [PROD_KEYS.PKT5x5]: 0,
  [PROD_KEYS.PKT6x6]: 0,
};

const SABORES_BRANCOS = [
  "ninho", "ninho com nutella", "oreo", "ovomaltine", "beijinho",
  "brigadeiro branco", "brigadeiro branco com confete",
  "paçoca", "pacoca", "kitkat"
];
const SABORES_PRETOS  = [
  "brigadeiro preto", "brigadeiro preto com confete", "palha italiana"
];

function corDoSabor(nome) {
  const s = String(nome || "").toLowerCase();
  if (s.includes("bem casado")) return "bem_casado"; // 50/50
  if (SABORES_BRANCOS.some(k => s.includes(k))) return "branco";
  if (SABORES_PRETOS.some(k  => s.includes(k))) return "preto";
  // default seguro
  return "branco";
}
const saborUsaNutella = (s) => /nutella/i.test(String(s || ""));

/* =========================
 * HELPERS
 * ========================= */
function ceilDiv(a, b) { return b ? Math.ceil(a / b) : 0; }

function somaItensPorProduto(pedidos) {
  const acc = {};
  (pedidos || []).forEach((p) => {
    const itens = Array.isArray(p?.itens) ? p.itens
               : Array.isArray(p?.items) ? p.items : [];
    itens.forEach((it) => {
      const prod = normalizaProduto(it?.produto || it?.item || it?.nome);
      const q = Number(it?.quantidade ?? it?.qtd ?? it?.qtde ?? 0);
      if (!prod || !q) return;
      acc[prod] = (acc[prod] || 0) + q;
    });
  });
  return acc;
}

function somaSaboresPorProduto(pedidos) {
  const acc = {};
  (pedidos || []).forEach((p) => {
    const sabores = p?.sabores && typeof p.sabores === "object" ? p.sabores : null;
    if (!sabores) return;
    Object.entries(sabores).forEach(([prodRaw, linhas]) => {
      const prod = normalizaProduto(prodRaw);
      if (!acc[prod]) acc[prod] = [];
      (linhas || []).forEach((ln) => {
        const qtd = Number(ln?.qtd || 0);
        if (!ln?.sabor || !qtd) return;
        acc[prod].push({ sabor: ln.sabor, qtd });
      });
    });
  });
  return acc;
}

/* =========================
 * CÁLCULO PRINCIPAL
 * ========================= */
export function calculaPlanejamento(pedidos, { modo = "GERAL", compras = false } = {}) {
  const MODO_GERAL = String(modo).toUpperCase() === "GERAL";

  // Filtro por status:
  // - GERAL: tudo >= Lançado
  // - TEMPO_REAL: somente Alimentado (exclui Produzido)
  const selecionados = (pedidos || []).filter((p) => {
    const s = String(p?.statusEtapa || "").toLowerCase();
    if (MODO_GERAL) return s.includes("lanç") || s.includes("lanc") || s.includes("aliment") || s.includes("produz");
    if (s.includes("produz")) return false;
    return s.includes("aliment");
  });

  // TABULEIROS
  const unPorProd = somaItensPorProduto(selecionados);
  const tabuleiros = {};
  let totalTab = 0;
  Object.entries(unPorProd).forEach(([prod, un]) => {
    const tabs = ceilDiv(un, REND_TAB[prod] || 0);
    tabuleiros[prod] = tabs;
    totalTab += tabs;
  });
  tabuleiros.total = totalTab;

  // MASSA por tabuleiro (para compras)
  const massaBase = {
    tabuleiros: totalTab,
    margarina_g: totalTab * MASSA_POR_TAB_G.margarina,
    ovos_g:      totalTab * MASSA_POR_TAB_G.ovos,
    farinhaMassa_g: totalTab * MASSA_POR_TAB_G.farinhaMassa,
  };

  // UNTAR por tabuleiro
  const untar = {
    margarina_g: totalTab * UNTAR_POR_TAB_G.margarina,
    farinha_g:   totalTab * UNTAR_POR_TAB_G.farinha,
  };

  // RECHEIO / BACIAS
  let bacias = { total: 0 };
  let recheioUnidades = { branco: 0, preto: 0, total: 0 };
  let avisosCompras = []; // confete, coco, etc. (tempo real)
  let nutellaResumo = { g: 0, potes: 0, porProduto: {} };

  if (MODO_GERAL) {
    // Não considera sabor/cor — usa unidades/bacia por produto
    let totalBacias = 0;
    Object.entries(unPorProd).forEach(([prod, un]) => {
      const porBacia = REND_BACIA_UN[prod] || 0;
      totalBacias += ceilDiv(un, porBacia);
    });
    bacias = { total: totalBacias };
    recheioUnidades = { branco: 0, preto: 0, total: Object.values(unPorProd).reduce((a,b)=>a+b,0) };
  } else {
    // TEMPO_REAL: separa por cor a partir de sabores
    const sabPorProd = somaSaboresPorProduto(selecionados);
    const corUn = { branco: 0, preto: 0 };

    Object.entries(sabPorProd).forEach(([prod, linhas]) => {
      let brancoProd = 0, pretoProd = 0, nutellaUn = 0;
      (linhas || []).forEach(({ sabor, qtd }) => {
        const cor = corDoSabor(sabor);
        if (cor === "bem_casado") { brancoProd += qtd * 0.5; pretoProd += qtd * 0.5; }
        else if (cor === "branco") { brancoProd += qtd; }
        else if (cor === "preto")  { pretoProd  += qtd; }

        if (saborUsaNutella(sabor)) nutellaUn += qtd;

        // avisos compras (regras fornecidas)
        const s = String(sabor).toLowerCase();
        if (s.includes("confete"))         avisosCompras.push("Confete");
        if (s.includes("prestigio") || s.includes("prestígio")) avisosCompras.push("Coco ralado");
        if (s.includes("palha italiana"))  avisosCompras.push("Biscoito maizena");
        if (s.includes("paçoca") || s.includes("pacoca")) avisosCompras.push("Paçoca");
        if (s.includes("brigadeiro preto")) avisosCompras.push("Granulado");
      });

      // Bacias por produto/cor
      const porBacia = REND_BACIA_UN[prod] || 0;
      bacias[`${prod}#branco`] = ceilDiv(brancoProd, porBacia);
      bacias[`${prod}#preto`]  = ceilDiv(pretoProd , porBacia);
      bacias.total            += bacias[`${prod}#branco`] + bacias[`${prod}#preto`];

      // Acumula unidades por cor
      corUn.branco += brancoProd;
      corUn.preto  += pretoProd;

      // Nutella (g/potes) por produto
      const gUn = NUTELLA_G_UN[prod] || 0;
      const gTotalProd = nutellaUn * gUn;
      nutellaResumo.porProduto[prod] = {
        unidadesNutella: nutellaUn,
        g: gTotalProd,
        potes: Math.ceil(gTotalProd / NUTELLA_POTE_G),
      };
      nutellaResumo.g += gTotalProd;
      nutellaResumo.potes = Math.ceil(nutellaResumo.g / NUTELLA_POTE_G);
    });

    recheioUnidades = { ...corUn, total: corUn.branco + corUn.preto };
    avisosCompras = Array.from(new Set(avisosCompras));
  }

  // GLICOSE extra por bacias (compras)
  const lotes6 = Math.floor((bacias.total || 0) / 6);
  const glucose_g_total = lotes6 * (BACIA_BASE.glucose_extra_g_a_cada_6_bacias || 0);

  // Ingredientes base das bacias (compras)
  const compraBaseBacia = {
    bacias: bacias.total || 0,
    leiteCondensado_latas: (bacias.total || 0) * (BACIA_BASE.leiteCondensado_por_bacia_latas || 0),
    cremeDeLeite_g: (bacias.total || 0) * (BACIA_BASE.cremeDeLeite_por_bacia_g || 0),
    glucose_g_total,
  };

  return {
    modo: MODO_GERAL ? "GERAL" : "TEMPO_REAL",

    tabuleiros, // por produto + total

    recheio: {
      unidades: recheioUnidades, // GERAL: total; TEMPO_REAL: {branco,preto,total}
      bacias,                    // GERAL: total; TEMPO_REAL: detalhado por produto/cor
    },

    compras: {
      massa: massaBase,          // por tabuleiro (margarina/ovos/farinha)
      untar,                     // margarina/farinha por tabuleiro
      baseBacia: compraBaseBacia,// l.condensado/creme/glucose
      avisosEspeciais: avisosCompras, // confete, coco, etc. (apenas TEMPO_REAL)
      nutella: MODO_GERAL ? { g: 0, potes: 0, porProduto: {} } : nutellaResumo,
    },
  };
}

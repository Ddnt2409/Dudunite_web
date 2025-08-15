// src/util/MemProd.js
// ---------------------------------------------------------
// Planejamento + Lista de Compras (GERAL e TEMPO_REAL)
// Baseado no README (rendimentos) e regras definidas no chat
// ---------------------------------------------------------

// ===== RENDIMENTOS (README) =====
const REND_TAB = {
  "BRW 7x7": 12,
  "BRW 6x6": 17,
  "PKT 5x5": 20,
  "PKT 6x6": 15,
  "ESC": 26,
};

// Unidades por bacia de recheio
const UNID_POR_BACIA = {
  "BRW 7x7": 25,
  "BRW 6x6": 35,
  "ESC": 26,
  "PKT 5x5": 65, // 20 g/un (≈ 65 un/bacia)
  "PKT 6x6": 43, // 30 g/un (≈ 43 un/bacia)
};

// ===== INSUMOS — MASSA & UNTAR =====
const MARG_MASSA_G_POR_TAB = 76;        // g
const OVOS_MASSA_G_POR_TAB = 190;       // g
const OVO_PESO_MEDIO_G     = 52;        // g/un → converter p/ unidades
const FARINHA_MASSA_PACOTES_450_POR_TAB = 2; // 900 g = 2×450 g

const FARINHA_UNTAR_G_POR_TAB = 150 / 12; // 12,5 g/tabuleiro
const MARG_UNTAR_G_POR_TAB    = 40 / 3;   // 13,333... g/tabuleiro

// ===== INSUMOS — RECHEIOS =====
const LATA_LEITE_POR_BACIA        = 4;   // un
const CREME_LEITE_G_POR_BACIA     = 650; // g
const GLUCOSE_G_CADA_6_BACIAS     = 500; // g a cada 6 bacias
const GLUCOSE_FRASCO_G            = 500; // g (frasco)
const ACHOCOLATADO_G_PRETO        = 360; // g/bacia (apenas preto)

// ===== NORMALIZAÇÕES =====
const PROD_ALIASES = [
  [/^brownie\s*7x7$/i, "BRW 7x7"],
  [/^brw\s*7x7$/i,     "BRW 7x7"],
  [/^brownie\s*6x6$/i, "BRW 6x6"],
  [/^brw\s*6x6$/i,     "BRW 6x6"],
  [/^pkt\s*5x5$/i,     "PKT 5x5"],
  [/^pocket\s*5x5$/i,  "PKT 5x5"],
  [/^pkt\s*6x6$/i,     "PKT 6x6"],
  [/^pocket\s*6x6$/i,  "PKT 6x6"],
  [/^esc/i,            "ESC"],
  [/^escondid/i,       "ESC"],
];

function normProduto(s) {
  const t = String(s || "").trim();
  for (const [re, key] of PROD_ALIASES) if (re.test(t)) return key;
  return t.toUpperCase(); // último recurso (ex.: "BRW 7X7")
}

function itensDoPedido(p) {
  if (!p) return [];
  if (Array.isArray(p.items)) return p.items;
  if (Array.isArray(p.itens)) return p.itens;
  if (Array.isArray(p.produtos)) return p.produtos;
  return [];
}

function qtdDoItem(it) {
  return Number(it?.quantidade ?? it?.qtd ?? it?.qtde ?? 0) || 0;
}

function saboresDoItem(it) {
  // Esperado: array de { nome/sabor, quantidade/qtd }
  const arr = it?.sabores ?? it?.flavors ?? [];
  if (Array.isArray(arr)) {
    return arr
      .map(s => ({
        nome: (s?.nome ?? s?.sabor ?? s?.label ?? s)?.toString() ?? "",
        qtd: Number(s?.quantidade ?? s?.qtd ?? s?.qtde ?? s?.q ?? 0) || 0,
      }))
      .filter(s => s.nome && s.qtd > 0);
  }
  return [];
}

// ===== SABOR → COR =====
const TOKENS_PRETO = [
  "brigadeiro preto",
  "brigadeirao preto",
  "com confete (preto)",
  "preto com confete",
  "palha italiana",
];
const TOKENS_BRANCO = [
  "ninho",
  "oreo",
  "ovomaltine",
  "beijinho",
  "brigadeiro branco",
  "branco com confete",
  "kitkat",
  "ninho com nutella",
  "paçoca",
];
function classificaSaborCor(sNome) {
  const s = (sNome || "").toString().toLowerCase();

  if (s.includes("bem casado")) return { branco: 0.5, preto: 0.5 };

  for (const t of TOKENS_PRETO)  if (s.includes(t)) return { branco: 0, preto: 1 };
  for (const t of TOKENS_BRANCO) if (s.includes(t)) return { branco: 1, preto: 0 };

  // Se não reconhecer, não atribui cor (0/0)
  return { branco: 0, preto: 0 };
}

// ===== FILTRO TEMPO REAL =====
function isAlimentadoPedido(p) {
  if (p?.alimentado === true) return true;
  if (p?.dataAlimentado || p?.alimentadoEm) return true;

  const sx = (p?.status ?? p?.etapa ?? "").toString()
    .toUpperCase()
    .normalize("NFD");
  if (sx.includes("ALIMENT")) return true;

  // inferência: existe algum item com sabores lançados?
  const its = itensDoPedido(p);
  return its.some(it => saboresDoItem(it).length > 0);
}

function filtraPedidos(pedidos, modo) {
  if (!Array.isArray(pedidos)) return [];
  if (modo === "TEMPO_REAL") return pedidos.filter(isAlimentadoPedido);
  // GERAL: tudo que tem itens
  return pedidos.filter(p => itensDoPedido(p).length > 0);
}

// ===== TABULEIROS =====
function tabuleirosPorProduto(pedidos, modo) {
  const porProduto = new Map();

  for (const p of pedidos) {
    const its = itensDoPedido(p);
    for (const it of its) {
      const produto = normProduto(it?.produto ?? it?.item ?? it?.nome ?? "");
      if (!REND_TAB[produto]) continue;

      if (modo === "TEMPO_REAL") {
        const sabores = saboresDoItem(it);
        let unidades = 0;
        if (sabores.length) {
          unidades = sabores.reduce((acc, s) => acc + s.qtd, 0);
        } else {
          unidades = qtdDoItem(it); // fallback
        }
        porProduto.set(produto, (porProduto.get(produto) || 0) + unidades);
      } else {
        // GERAL: usa a quantidade do item
        porProduto.set(produto, (porProduto.get(produto) || 0) + qtdDoItem(it));
      }
    }
  }

  const tabs = {};
  for (const [produto, unidades] of porProduto.entries()) {
    const rend = REND_TAB[produto];
    tabs[produto] = Math.ceil(unidades / rend);
  }
  const totalTabuleiros = Object.values(tabs).reduce((a, b) => a + b, 0);
  return { tabs, totalTabuleiros, unidadesPorProduto: Object.fromEntries(porProduto) };
}

// ===== BACIAS =====
function baciasNeutras(pedidos) {
  // sem cor/sabor
  let total = 0;

  for (const p of pedidos) {
    const its = itensDoPedido(p);
    for (const it of its) {
      const produto = normProduto(it?.produto ?? it?.item ?? it?.nome ?? "");
      const unid = qtdDoItem(it) || saboresDoItem(it).reduce((a, s) => a + s.qtd, 0);
      const rendB = UNID_POR_BACIA[produto];
      if (!rendB || !unid) continue;
      total += Math.ceil(unid / rendB);
    }
  }
  return Math.max(0, total | 0);
}

function baciasPorCorTempoReal(pedidos) {
  let branco = 0;
  let preto  = 0;

  for (const p of pedidos) {
    const its = itensDoPedido(p);
    for (const it of its) {
      const produto = normProduto(it?.produto ?? it?.item ?? it?.nome ?? "");
      const rendB = UNID_POR_BACIA[produto];
      if (!rendB) continue;

      const sabores = saboresDoItem(it);
      if (!sabores.length) continue; // no tempo real, sem sabor não soma

      for (const s of sabores) {
        const fator = classificaSaborCor(s.nome);
        if (!fator.branco && !fator.preto) continue;

        const baciasFracionadas = (s.qtd / rendB);
        branco += baciasFracionadas * fator.branco;
        preto  += baciasFracionadas * fator.preto;
      }
    }
  }

  const out = {
    branco: Math.ceil(branco),
    preto:  Math.ceil(preto),
  };
  out.total = out.branco + out.preto;
  return out;
}

// ===== COMPRAS — MASSA & UNTAR =====
function comprasMassaUntar(totalTabuleiros) {
  const marg_massa_g = totalTabuleiros * MARG_MASSA_G_POR_TAB;
  const marg_untar_g = totalTabuleiros * MARG_UNTAR_G_POR_TAB;
  const marg_total_g = Math.round(marg_massa_g + marg_untar_g);

  const ovos_g  = totalTabuleiros * OVOS_MASSA_G_POR_TAB;
  const ovos_un = Math.ceil(ovos_g / OVO_PESO_MEDIO_G);

  const far_pacotes_total = totalTabuleiros * FARINHA_MASSA_PACOTES_450_POR_TAB;
  const far_caixas12      = Math.floor(far_pacotes_total / 12);
  const far_avulsos       = far_pacotes_total % 12;

  return {
    margarina_total_g: marg_total_g,
    ovos_un,
    // Farinha de massa apenas em pacotes + caixas/avulsos (número exato)
    farinha_massa_caixas12: far_caixas12,
    farinha_massa_pacotes_avulsos: far_avulsos,
    farinha_massa_pacotes_450: far_pacotes_total,

    // Para referência, se quiser mostrar também os grams (opcional):
    farinha_untar_g: Math.round(totalTabuleiros * FARINHA_UNTAR_G_POR_TAB),
  };
}

// ===== COMPRAS — RECHEIOS =====
function comprasRecheiosGeral(baciasTotal) {
  const leite = baciasTotal * LATA_LEITE_POR_BACIA;
  const creme = baciasTotal * CREME_LEITE_G_POR_BACIA;

  const glucose_g  = (baciasTotal / 6) * GLUCOSE_G_CADA_6_BACIAS;
  const glucose_fr = glucose_g > 0 ? Math.max(1, Math.ceil(glucose_g / GLUCOSE_FRASCO_G)) : 0;

  return {
    totais: {
      leite_cond_395g_un: leite,
      creme_de_leite_g: Math.round(creme),
      achocolatado_g: 0, // sem cor no GERAL
    },
    glucose: { frascos: glucose_fr, gramas: Math.round(glucose_g) },
  };
}

function comprasRecheiosTempoReal(baciasPorCor) {
  const bBranco = Math.max(0, baciasPorCor?.branco || 0);
  const bPreto  = Math.max(0, baciasPorCor?.preto  || 0);
  const bTotal  = bBranco + bPreto;

  const branco = {
    leite_cond_395g_un: bBranco * LATA_LEITE_POR_BACIA,
    creme_de_leite_g:   bBranco * CREME_LEITE_G_POR_BACIA,
  };
  const preto = {
    leite_cond_395g_un: bPreto * LATA_LEITE_POR_BACIA,
    creme_de_leite_g:   bPreto * CREME_LEITE_G_POR_BACIA,
    achocolatado_g:     bPreto * ACHOCOLATADO_G_PRETO,
  };

  const totais = {
    leite_cond_395g_un: (branco.leite_cond_395g_un + preto.leite_cond_395g_un),
    creme_de_leite_g:   (branco.creme_de_leite_g   + preto.creme_de_leite_g),
    achocolatado_g:     (preto.achocolatado_g || 0),
    bacias_total:       bTotal,
  };

  const glucose_g  = (bTotal / 6) * GLUCOSE_G_CADA_6_BACIAS;
  const glucose_fr = glucose_g > 0 ? Math.max(1, Math.ceil(glucose_g / GLUCOSE_FRASCO_G)) : 0;

  return {
    por_cor: { branco, preto },
    totais,
    glucose: { frascos: glucose_fr, gramas: Math.round(glucose_g) },
  };
}

// ====== API PRINCIPAL ======
export function calculaPlanejamento(pedidos, opts = {}) {
  const { modo = "GERAL", compras = false } = opts;

  const base = filtraPedidos(pedidos, modo);
  const { tabs, totalTabuleiros } = tabuleirosPorProduto(base, modo);

  let baciasOut;
  if (modo === "TEMPO_REAL") {
    const porCor = baciasPorCorTempoReal(base);
    baciasOut = { branco: porCor.branco, preto: porCor.preto, total: porCor.total };
  } else {
    const total = baciasNeutras(base);
    baciasOut = { total };
  }

  const out = {
    plan: {
      modo,
      tabuleiros: tabs,
      totalTabuleiros,
      bacias: baciasOut,
      baciasPorCor: modo === "TEMPO_REAL" ? { branco: baciasOut.branco, preto: baciasOut.preto } : undefined,
      totalBacias: baciasOut.total,
    },
  };

  if (compras) {
    const massa_untar = comprasMassaUntar(totalTabuleiros);
    const recheios =
      modo === "TEMPO_REAL"
        ? comprasRecheiosTempoReal(baciasOut)
        : comprasRecheiosGeral(baciasOut.total);

    out.compras = {
      massa_untar,
      recheios,
    };
  }

  return out;
}

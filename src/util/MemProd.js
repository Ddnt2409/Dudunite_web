// ---------------------------------------------------------
// Planejamento + Compras (GERAL e TEMPO_REAL) — ERP Dudunitê
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
  "PKT 5x5": 65, // ≈ 20 g/un
  "PKT 6x6": 43, // ≈ 30 g/un
};

// ===== MASSA & UNTAR =====
const MARG_MASSA_G_POR_TAB = 76;        // g
const OVOS_MASSA_G_POR_TAB = 190;       // g
const OVO_PESO_MEDIO_G     = 52;        // g/un
const FARINHA_MASSA_PACOTES_450_POR_TAB = 2; // 900 g = 2×450 g

const FARINHA_UNTAR_G_POR_TAB = 150 / 12; // 12,5 g/tab
const MARG_UNTAR_G_POR_TAB    = 40 / 3;   // 13,33 g/tab

// ===== RECHEIOS =====
const LATA_LEITE_POR_BACIA        = 4;   // un
const CREME_LEITE_G_POR_BACIA     = 650; // g
const GLUCOSE_G_CADA_6_BACIAS     = 500; // g a cada 6 bacias
const GLUCOSE_FRASCO_G            = 500; // g (frasco)
const ACHOCOLATADO_G_PRETO        = 360; // g/bacia (preto)

// ===== normalização de produto =====
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
  return t.toUpperCase();
}

// ===== acesso seguro aos itens =====
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

// ===== sabores em QUALQUER formato comum =====
function parseListaStringsComoSabores(list) {
  // aceita ["15x Brigadeiro preto", "10x Bem casado", ...]
  const out = [];
  for (const raw of list) {
    const s = String(raw || "").trim();
    if (!s) continue;
    const m = s.match(/^(\d+)\s*x?\s*(.+)$/i);
    if (m) out.push({ nome: m[2].trim(), qtd: Number(m[1]) || 0 });
  }
  return out;
}
function saboresDoItem(it, p) {
  // 1) arrays de objetos
  let arr =
    it?.sabores ?? it?.flavors ?? it?.alimentadoSabores ?? it?.saboresAlimentados;
  if (Array.isArray(arr)) {
    return arr
      .map(s => ({
        nome: (s?.nome ?? s?.sabor ?? s?.label ?? s)?.toString(),
        qtd: Number(s?.quantidade ?? s?.qtd ?? s?.qtde ?? s?.q ?? 0) || 0,
      }))
      .filter(s => s.nome && s.qtd > 0);
  }

  // 2) lista de strings
  const listStr =
    it?.saboresLista ?? it?.saboresStrs ?? it?.saboresTxt ?? it?.saboresTexto;
  if (Array.isArray(listStr)) return parseListaStringsComoSabores(listStr);
  if (typeof listStr === "string")
    return parseListaStringsComoSabores(
      listStr.split(/\r?\n|,/).map(s => s.trim()).filter(Boolean)
    );

  // 3) fallback: sabores no pedido por produto
  const produto = normProduto(it?.produto ?? it?.item ?? it?.nome ?? "");
  const porProd = p?.saboresPorProduto || p?.flavorsByProduct;
  if (porProd && porProd[produto]) {
    const v = porProd[produto];
    if (Array.isArray(v)) return saboresDoItem({ sabores: v }, p);
    if (typeof v === "string") return parseListaStringsComoSabores(v.split(/\r?\n|,/));
  }

  return [];
}

// ===== Sabor → cor =====
const TOKENS_PRETO = [
  "brigadeiro preto",
  "palha italiana",
  "preto com confete",
  "brigadeiro preto com confete",
];
const TOKENS_BRANCO = [
  "ninho", "oreo", "ovomaltine", "beijinho",
  "brigadeiro branco", "branco com confete",
  "kitkat", "ninho com nutella", "paçoca"
];
function classificaSaborCor(nome) {
  const s = String(nome || "").toLowerCase();
  if (s.includes("bem casado")) return { branco: 0.5, preto: 0.5 };
  if (TOKENS_PRETO.some(t => s.includes(t)))  return { branco: 0,   preto: 1 };
  if (TOKENS_BRANCO.some(t => s.includes(t))) return { branco: 1,   preto: 0 };
  return { branco: 0, preto: 0 }; // desconhecido
}

// ===== é alimentado? (bem permissivo) =====
function hasSaboresNoPedido(p) {
  return itensDoPedido(p).some(it => saboresDoItem(it, p).length > 0);
}
function isAlimentadoPedido(p) {
  if (p?.alimentado === true) return true;
  if (p?.dataAlimentado || p?.alimentadoEm) return true;

  const s = (p?.status ?? p?.etapa ?? p?.situacao ?? p?.fase ?? "")
    .toString().toUpperCase();
  if (s.includes("ALIMENT")) return true;

  return hasSaboresNoPedido(p);
}

// ===== Filtra base =====
function filtraPedidos(pedidos, modo) {
  if (!Array.isArray(pedidos)) return [];
  if (modo === "TEMPO_REAL") {
    // inclui se marcados como alimentados OU se eu identificar sabores
    return pedidos.filter(p => isAlimentadoPedido(p));
  }
  // GERAL = tem itens
  return pedidos.filter(p => itensDoPedido(p).length > 0);
}

// ===== Tabuleiros =====
function tabuleirosPorProduto(pedidos, modo) {
  const porProdutoUn = new Map();

  for (const p of pedidos) {
    for (const it of itensDoPedido(p)) {
      const produto = normProduto(it?.produto ?? it?.item ?? it?.nome ?? "");
      const rend = REND_TAB[produto];
      if (!rend) continue;

      if (modo === "TEMPO_REAL") {
        // só contam unidades com sabor
        const sab = saboresDoItem(it, p);
        const unid = sab.reduce((a, s) => a + s.qtd, 0);
        porProdutoUn.set(produto, (porProdutoUn.get(produto) || 0) + unid);
      } else {
        porProdutoUn.set(produto, (porProdutoUn.get(produto) || 0) + qtdDoItem(it));
      }
    }
  }

  const tabs = {};
  for (const [produto, un] of porProdutoUn.entries()) {
    tabs[produto] = Math.ceil((un || 0) / REND_TAB[produto]);
  }
  const totalTabuleiros = Object.values(tabs).reduce((a, b) => a + b, 0);
  return { tabs, totalTabuleiros, unidadesPorProduto: Object.fromEntries(porProdutoUn) };
}

// ===== Bacias =====
function baciasNeutras(pedidos) {
  let total = 0;
  for (const p of pedidos) {
    for (const it of itensDoPedido(p)) {
      const prod = normProduto(it?.produto ?? it?.item ?? it?.nome ?? "");
      const rendB = UNID_POR_BACIA[prod];
      if (!rendB) continue;
      const unid = qtdDoItem(it) || saboresDoItem(it, p).reduce((a, s) => a + s.qtd, 0);
      total += Math.ceil((unid || 0) / rendB);
    }
  }
  return total | 0;
}
function baciasPorCorTempoReal(pedidos) {
  let branco = 0, preto = 0;
  for (const p of pedidos) {
    for (const it of itensDoPedido(p)) {
      const prod  = normProduto(it?.produto ?? it?.item ?? it?.nome ?? "");
      const rendB = UNID_POR_BACIA[prod];
      if (!rendB) continue;

      const sab = saboresDoItem(it, p);
      for (const s of sab) {
        const f = classificaSaborCor(s.nome);
        if (!f.branco && !f.preto) continue;
        const b = (s.qtd / rendB);
        branco += b * f.branco;
        preto  += b * f.preto;
      }
    }
  }
  const out = { branco: Math.ceil(branco), preto: Math.ceil(preto) };
  out.total = out.branco + out.preto;
  return out;
}

// ===== Compras — Massa & Untar =====
function comprasMassaUntar(totalTabuleiros) {
  const marg_massa_g = totalTabuleiros * MARG_MASSA_G_POR_TAB;
  const marg_untar_g = totalTabuleiros * MARG_UNTAR_G_POR_TAB;
  const marg_total_g = Math.round(marg_massa_g + marg_untar_g);

  const ovos_un = Math.ceil((totalTabuleiros * OVOS_MASSA_G_POR_TAB) / OVO_PESO_MEDIO_G);

  const pacotes = totalTabuleiros * FARINHA_MASSA_PACOTES_450_POR_TAB; // exato
  const caixas12 = Math.floor(pacotes / 12);
  const avulsos  = pacotes % 12;

  return {
    margarina_total_g: marg_total_g,
    ovos_un,
    farinha_massa_caixas12: caixas12,
    farinha_massa_pacotes_avulsos: avulsos,
    farinha_massa_pacotes_450: pacotes,
    farinha_untar_g: Math.round(totalTabuleiros * FARINHA_UNTAR_G_POR_TAB),
  };
}

// ===== Compras — Recheios =====
function comprasRecheiosGeral(baciasTotal) {
  const leite = baciasTotal * LATA_LEITE_POR_BACIA;
  const creme = baciasTotal * CREME_LEITE_G_POR_BACIA;

  const glucose_g  = (baciasTotal / 6) * GLUCOSE_G_CADA_6_BACIAS;
  const glucose_fr = glucose_g > 0 ? Math.max(1, Math.ceil(glucose_g / GLUCOSE_FRASCO_G)) : 0;

  return {
    totais: {
      leite_cond_395g_un: leite,
      creme_de_leite_g: Math.round(creme),
      achocolatado_g: 0, // GERAL não separa por cor
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
    leite_cond_395g_un: branco.leite_cond_395g_un + preto.leite_cond_395g_un,
    creme_de_leite_g:   branco.creme_de_leite_g   + preto.creme_de_leite_g,
    achocolatado_g:     preto.achocolatado_g || 0,
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

// ===== util p/ “linhas prontas” (evita NaN na UI) =====
function montarComprasFlat({ modo, massa_untar, recheios }) {
  const lines = [];

  // MASSA & UNTAR
  lines.push(
    { grupo: "Massa e Untar", item: "margarina total (g)", unidade: "g",  qtd: massa_untar.margarina_total_g },
    { grupo: "Massa e Untar", item: "ovos (un)",            unidade: "un", qtd: massa_untar.ovos_un },
    { grupo: "Massa e Untar", item: "farinha massa caixas12", unidade: "cx", qtd: massa_untar.farinha_massa_caixas12 },
    { grupo: "Massa e Untar", item: "farinha massa pacotes avulsos", unidade: "pct", qtd: massa_untar.farinha_massa_pacotes_avulsos },
    { grupo: "Massa e Untar", item: "farinha massa pacotes 450", unidade: "pct", qtd: massa_untar.farinha_massa_pacotes_450 },
    { grupo: "Massa e Untar", item: "farinha untar (g)",    unidade: "g",  qtd: massa_untar.farinha_untar_g },
  );

  // RECHEIOS
  if (modo === "TEMPO_REAL") {
    const b = recheios.por_cor.branco, p = recheios.por_cor.preto;
    lines.push(
      { grupo: "Recheios — Branco", item: "leite cond 395g", unidade: "un", qtd: b.leite_cond_395g_un },
      { grupo: "Recheios — Branco", item: "creme de leite",  unidade: "g",  qtd: b.creme_de_leite_g },

      { grupo: "Recheios — Preto",  item: "leite cond 395g", unidade: "un", qtd: p.leite_cond_395g_un },
      { grupo: "Recheios — Preto",  item: "creme de leite",  unidade: "g",  qtd: p.creme_de_leite_g },
      { grupo: "Recheios — Preto",  item: "achocolatado",    unidade: "g",  qtd: p.achocolatado_g },

      { grupo: "Recheios — Totais", item: "leite cond 395g", unidade: "un", qtd: recheios.totais.leite_cond_395g_un },
      { grupo: "Recheios — Totais", item: "creme de leite",  unidade: "g",  qtd: recheios.totais.creme_de_leite_g },
      { grupo: "Recheios — Totais", item: "achocolatado",    unidade: "g",  qtd: recheios.totais.achocolatado_g },
      { grupo: "Recheios — Totais", item: "glucose",         unidade: "fr", qtd: recheios.glucose.frascos },
      { grupo: "Recheios — Totais", item: "glucose",         unidade: "g",  qtd: recheios.glucose.gramas },
    );
  } else {
    lines.push(
      { grupo: "Recheios — Totais", item: "leite cond 395g", unidade: "un", qtd: recheios.totais.leite_cond_395g_un },
      { grupo: "Recheios — Totais", item: "creme de leite",  unidade: "g",  qtd: recheios.totais.creme_de_leite_g },
      { grupo: "Recheios — Totais", item: "achocolatado",    unidade: "g",  qtd: 0 },
      { grupo: "Recheios — Totais", item: "glucose",         unidade: "fr", qtd: recheios.glucose.frascos },
      { grupo: "Recheios — Totais", item: "glucose",         unidade: "g",  qtd: recheios.glucose.gramas },
    );
  }

  return lines;
}

// ===== API =====
export function calculaPlanejamento(pedidos, opts = {}) {
  const { modo = "GERAL", compras = false } = opts;

  const base = filtraPedidos(pedidos, modo);
  const { tabs, totalTabuleiros } = tabuleirosPorProduto(base, modo);

  let bacias;
  if (modo === "TEMPO_REAL") {
    const porCor = baciasPorCorTempoReal(base);
    bacias = { ...porCor };
  } else {
    const total = baciasNeutras(base);
    bacias = { total };
  }

  const out = {
    plan: {
      modo,
      tabuleiros: tabs,
      totalTabuleiros,
      bacias: bacias,
      baciasPorCor: modo === "TEMPO_REAL" ? { branco: bacias.branco, preto: bacias.preto } : undefined,
      totalBacias: bacias.total ?? (bacias.branco + bacias.preto),
    },
  };

  if (compras) {
    const massa_untar = comprasMassaUntar(totalTabuleiros);
    const recheios =
      modo === "TEMPO_REAL"
        ? comprasRecheiosTempoReal(bacias)
        : comprasRecheiosGeral(bacias.total);

    out.compras = {
      massa_untar,
      recheios,
      comprasFlat: montarComprasFlat({ modo, massa_untar, recheios }),
    };
  }

  return out;
  }

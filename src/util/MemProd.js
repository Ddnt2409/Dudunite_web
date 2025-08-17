// ---------------------------------------------------------
// Planejamento + Compras (GERAL e TEMPO_REAL) — ERP Dudunitê
// + Totais por Sabor (painel direito)
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
  "PKT 5x5": 65, // ≅20 g/un
  "PKT 6x6": 43, // ≅30 g/un
};

// ===== MASSA & UNTAR =====
const MARG_MASSA_G_POR_TAB  = 76;       // g
const OVOS_MASSA_G_POR_TAB  = 190;      // g
const OVO_PESO_MEDIO_G      = 52;       // g/un
const FARINHA_MASSA_PCT450_POR_TAB = 2; // 900 g = 2×450 g

const FARINHA_UNTAR_G_POR_TAB = 150 / 12; // 12,5 g/tab
const MARG_UNTAR_G_POR_TAB    = 40 / 3;   // ~13,33 g/tab

// ===== RECHEIOS =====
const LATA_LEITE_POR_BACIA    = 4;    // un
const CREME_LEITE_G_POR_BACIA = 650;  // g
const GLUCOSE_G_CADA_6_BACIAS = 500;  // g a cada 6 bacias
const GLUCOSE_FRASCO_G        = 500;  // 1 frasco = 500 g (mínimo 1 se houver bacia)
const ACHOCOLATADO_G_PRETO    = 360;  // g/bacia preta

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

// ===== utils de itens/pedido =====
function itensDoPedido(p) {
  if (!p) return [];
  if (Array.isArray(p.items))    return p.items;
  if (Array.isArray(p.itens))    return p.itens;
  if (Array.isArray(p.produtos)) return p.produtos;
  return [];
}
function qtdDoItem(it) {
  return Number(it?.quantidade ?? it?.qtd ?? it?.qtde ?? 0) || 0;
}
function countProdutosNoPedido(p) {
  return itensDoPedido(p)
    .map(it => normProduto(it?.produto ?? it?.item ?? it?.nome ?? ""))
    .filter(Boolean).length;
}

// ===== parser de sabores =====
function parseListaStrings(list) {
  const out = [];
  for (const raw of list) {
    const s = String(raw || "").trim();
    if (!s) continue;
    const m = s.match(/^(\d+)\s*x?\s*(.+)$/i);
    if (m) out.push({ nome: m[2].trim(), qtd: Number(m[1]) || 0 });
  }
  return out;
}
function saboresFromAny(v) {
  if (!v) return [];
  if (Array.isArray(v)) {
    if (!v.length) return [];
    if (typeof v[0] === "string") return parseListaStrings(v);
    return v.map(s => ({
      nome: (s?.nome ?? s?.sabor ?? s?.label ?? s)?.toString(),
      qtd: Number(s?.quantidade ?? s?.qtd ?? s?.qtde ?? s?.q ?? 0) || 0,
    })).filter(x => x.nome && x.qtd > 0);
  }
  if (typeof v === "string") {
    return parseListaStrings(v.split(/\r?\n|,/).map(s => s.trim()).filter(Boolean));
  }
  if (typeof v === "object") {
    const out = [];
    for (const [k, val] of Object.entries(v)) {
      const qtd = Number(val?.qtd ?? val?.qtde ?? val ?? 0);
      if (qtd > 0) out.push({ nome: k, qtd });
    }
    return out;
  }
  return [];
}
function deepFindSabores(obj, depth = 0) {
  if (!obj || typeof obj !== "object" || depth > 4) return [];
  for (const k of Object.keys(obj)) {
    if (/sabor|flavor/i.test(k)) {
      const arr = saboresFromAny(obj[k]);
      if (arr.length) return arr;
    }
  }
  for (const k of Object.keys(obj)) {
    const v = obj[k];
    if (v && typeof v === "object") {
      const got = deepFindSabores(v, depth + 1);
      if (got.length) return got;
    }
  }
  return [];
}
function saboresNivelPedido(p) {
  const cand = [
    p?.alimentadoSabores, p?.alimentado_sabores,
    p?.saboresAlimentados, p?.saboresSelecionados,
    p?.sabores, p?.saboresLista, p?.saboresTxt, p?.saboresStrs,
  ];
  for (const v of cand) {
    const arr = saboresFromAny(v);
    if (arr.length) return arr;
  }
  const scanned = deepFindSabores(p);
  if (scanned.length) return scanned;
  return [];
}
function saboresDoItem(it, p) {
  const cand = [
    it?.sabores, it?.flavors, it?.alimentadoSabores, it?.saboresAlimentados,
    it?.saboresSelecionados, it?.saboresLista, it?.saboresTxt, it?.saboresStrs,
  ];
  for (const v of cand) {
    const arr = saboresFromAny(v);
    if (arr.length) return arr;
  }
  const scanned = deepFindSabores(it);
  if (scanned.length) return scanned;

  if (countProdutosNoPedido(p) === 1) {
    const arr = saboresNivelPedido(p);
    if (arr.length) return arr;
  }
  return [];
}

// ===== Sabor → cor (para bacias) =====
const TOKENS_PRETO = [
  "brigadeiro preto", "palha italiana",
  "preto com confete", "brigadeiro preto com confete",
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
  return { branco: 0, preto: 0 }; // neutro (não conta em cor)
}

// ===== é alimentado? =====
function hasSaboresQualquerLugar(p) {
  if (saboresNivelPedido(p).length) return true;
  return itensDoPedido(p).some(it => saboresDoItem(it, p).length > 0);
}
function isAlimentadoPedido(p) {
  if (p?.alimentado === true || p?.dataAlimentado || p?.alimentadoEm) return true;
  const s = [p?.status, p?.etapa, p?.situacao, p?.fase, p?.etiqueta, p?.flag]
    .map(x => String(x || "")).join(" ").toUpperCase();
  if (s.includes("ALIMENT")) return true;
  if (Number(p?.restantes) === 0) return true;
  if (itensDoPedido(p).some(it => Number(it?.restantes) === 0)) return true;
  return hasSaboresQualquerLugar(p);
}

// ===== Filtra base =====
function filtraPedidos(pedidos, modo) {
  if (!Array.isArray(pedidos)) return [];
  if (modo === "TEMPO_REAL") {
    const flt = pedidos.filter(p => isAlimentadoPedido(p));
    return flt.length ? flt : pedidos.filter(p => itensDoPedido(p).length > 0);
  }
  return pedidos.filter(p => itensDoPedido(p).length > 0);
}

// ===== Tabuleiros =====
function tabuleirosPorProduto(pedidos, modo) {
  const units = new Map(); // unidades por produto

  for (const p of pedidos) {
    for (const it of itensDoPedido(p)) {
      const produto = normProduto(it?.produto ?? it?.item ?? it?.nome ?? "");
      const rend = REND_TAB[produto];
      if (!rend) continue;

      let unid = 0;
      if (modo === "TEMPO_REAL") {
        const sab = saboresDoItem(it, p);
        unid = sab.reduce((a, s) => a + s.qtd, 0);
        if (!unid) unid = qtdDoItem(it); // fallback
      } else {
        unid = qtdDoItem(it);
      }
      units.set(produto, (units.get(produto) || 0) + (unid || 0));
    }
  }

  const tabs = {};
  for (const [produto, un] of units.entries()) {
    tabs[produto] = Math.ceil((un || 0) / REND_TAB[produto]);
  }
  const totalTabuleiros = Object.values(tabs).reduce((a, b) => a + b, 0);
  return { tabs, totalTabuleiros, unidadesPorProduto: Object.fromEntries(units) };
}

// ===== Bacias =====
function baciasNeutrasFromUnits(unitsByProduct) {
  let total = 0;
  for (const [prod, un] of Object.entries(unitsByProduct || {})) {
    const rendB = UNID_POR_BACIA[prod];
    if (!rendB) continue;
    total += Math.ceil((un || 0) / rendB);
  }
  return total | 0;
}
function baciasPorCorTempoReal(pedidos, unitsByProductFallback) {
  let branco = 0, preto = 0, usouSabores = false;

  for (const p of pedidos) {
    for (const it of itensDoPedido(p)) {
      const prod  = normProduto(it?.produto ?? it?.item ?? it?.nome ?? "");
      const rendB = UNID_POR_BACIA[prod];
      if (!rendB) continue;

      const sab = saboresDoItem(it, p);
      if (sab.length) usouSabores = true;
      for (const s of sab) {
        const f = classificaSaborCor(s.nome);
        if (!f.branco && !f.preto) continue;
        const b = (s.qtd / rendB);
        branco += b * f.branco;
        preto  += b * f.preto;
      }
    }
  }

  if (!usouSabores) {
    const total = baciasNeutrasFromUnits(unitsByProductFallback || {});
    return { branco: 0, preto: 0, total };
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

  const pacotes = totalTabuleiros * FARINHA_MASSA_PCT450_POR_TAB; // exato
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
function flatRecheios(leite_un, creme_g, achoc_g, baciasTotal) {
  const glucose_g  = (baciasTotal / 6) * GLUCOSE_G_CADA_6_BACIAS;
  const glucose_fr = baciasTotal > 0 ? Math.max(1, Math.ceil(glucose_g / GLUCOSE_FRASCO_G)) : 0;
  return {
    leite_cond_395g_un: Math.round(leite_un),
    creme_de_leite_g:   Math.round(creme_g),
    achocolatado_g:     Math.round(achoc_g || 0),
    glucose_frascos:    glucose_fr,
    glucose_g:          Math.round(glucose_g),
  };
}
function comprasRecheiosGeral(baciasTotal) {
  const leite = baciasTotal * LATA_LEITE_POR_BACIA;
  const creme = baciasTotal * CREME_LEITE_G_POR_BACIA;
  return { flat: flatRecheios(leite, creme, 0, baciasTotal) };
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

  const flat = flatRecheios(
    branco.leite_cond_395g_un + preto.leite_cond_395g_un,
    branco.creme_de_leite_g   + preto.creme_de_leite_g,
    preto.achocolatado_g,
    bTotal
  );

  return { porCor: { branco, preto }, flat };
}

// ===== Totais por Sabor (NOVO) =====
function normalizaSaborLabel(name) {
  const label = String(name || "").trim().replace(/\s+/g, " ");
  const key   = label.toLowerCase();
  return { key, label };
}
function agregaTotaisPorSabor(basePedidos) {
  const map = new Map(); // key -> { label, qtd }

  for (const p of basePedidos) {
    for (const it of itensDoPedido(p)) {
      const sabores = saboresDoItem(it, p);
      for (const s of sabores) {
        const { key, label } = normalizaSaborLabel(s.nome);
        const prev = map.get(key)?.qtd || 0;
        map.set(key, { label, qtd: prev + (Number(s.qtd) || 0) });
      }
    }
  }

  const obj = {};
  for (const [, v] of map) obj[v.label] = v.qtd;

  const list = Array.from(map.values())
    .sort((a, b) => b.qtd - a.qtd); // desc

  return { map: obj, list };
}

// ===== util p/ linhas prontas =====
function montarComprasFlat({ modo, massa_untar, recheiosFlat, porCor }) {
  const lines = [];

  lines.push(
    { grupo: "Massa e Untar", item: "margarina total (g)", unidade: "g",  qtd: massa_untar.margarina_total_g },
    { grupo: "Massa e Untar", item: "ovos (un)",            unidade: "un", qtd: massa_untar.ovos_un },
    { grupo: "Massa e Untar", item: "farinha massa caixas12", unidade: "cx",  qtd: massa_untar.farinha_massa_caixas12 },
    { grupo: "Massa e Untar", item: "farinha massa pacotes avulsos", unidade: "pct", qtd: massa_untar.farinha_massa_pacotes_avulsos },
    { grupo: "Massa e Untar", item: "farinha massa pacotes 450", unidade: "pct", qtd: massa_untar.farinha_massa_pacotes_450 },
    { grupo: "Massa e Untar", item: "farinha untar (g)",    unidade: "g",  qtd: massa_untar.farinha_untar_g },
  );

  if (modo === "TEMPO_REAL" && porCor) {
    const b = porCor.branco, p = porCor.preto;
    lines.push(
      { grupo: "Recheios — Branco", item: "leite cond 395g", unidade: "un", qtd: b.leite_cond_395g_un },
      { grupo: "Recheios — Branco", item: "creme de leite",  unidade: "g",  qtd: b.creme_de_leite_g },

      { grupo: "Recheios — Preto",  item: "leite cond 395g", unidade: "un", qtd: p.leite_cond_395g_un },
      { grupo: "Recheios — Preto",  item: "creme de leite",  unidade: "g",  qtd: p.creme_de_leite_g },
      { grupo: "Recheios — Preto",  item: "achocolatado",    unidade: "g",  qtd: p.achocolatado_g },
    );
  }

  lines.push(
    { grupo: "Recheios — Totais", item: "leite cond 395g", unidade: "un", qtd: recheiosFlat.leite_cond_395g_un },
    { grupo: "Recheios — Totais", item: "creme de leite",  unidade: "g",  qtd: recheiosFlat.creme_de_leite_g },
    { grupo: "Recheios — Totais", item: "achocolatado",    unidade: "g",  qtd: recheiosFlat.achocolatado_g },
    { grupo: "Recheios — Totais", item: "glucose",         unidade: "fr", qtd: recheiosFlat.glucose_frascos },
    { grupo: "Recheios — Totais", item: "glucose",         unidade: "g",  qtd: recheiosFlat.glucose_g },
  );

  return lines;
}

// ===== API =====
export function calculaPlanejamento(pedidos, opts = {}) {
  const { modo = "GERAL", compras = false } = opts;

  const base = filtraPedidos(pedidos, modo);
  const { tabs, totalTabuleiros, unidadesPorProduto } = tabuleirosPorProduto(base, modo);

  // Bacias
  let bacias;
  if (modo === "TEMPO_REAL") {
    bacias = baciasPorCorTempoReal(base, unidadesPorProduto);
  } else {
    const total = baciasNeutrasFromUnits(unidadesPorProduto);
    bacias = { total };
  }

  // Totais por Sabor (NOVO)
  const totaisPorSabor = agregaTotaisPorSabor(base);

  const plan = {
    modo,
    tabuleiros: tabs,
    totalTabuleiros,
    bacias,
    baciasPorCor: (modo === "TEMPO_REAL") ? { branco: bacias.branco || 0, preto: bacias.preto || 0 } : undefined,
    totalBacias: bacias.total ?? ((bacias.branco || 0) + (bacias.preto || 0)),
  };

  const out = {
    plan,
    unidadesPorProduto, // já usado no "Totais por Produto"
    totaisPorSabor,      // <-- usar no painel direito
  };

  if (compras) {
    const massa_untar = comprasMassaUntar(totalTabuleiros);

    if (modo === "TEMPO_REAL") {
      const { porCor, flat } = comprasRecheiosTempoReal(bacias);
      out.compras = {
        massa_untar,
        recheios: { ...flat },
        recheiosPorCor: porCor,
        comprasFlat: montarComprasFlat({ modo, massa_untar, recheiosFlat: flat, porCor }),
      };
    } else {
      const { flat } = comprasRecheiosGeral(plan.totalBacias || 0);
      out.compras = {
        massa_untar,
        recheios: { ...flat },
        comprasFlat: montarComprasFlat({ modo, massa_untar, recheiosFlat: flat }),
      };
    }
  }

  return out;
                            }

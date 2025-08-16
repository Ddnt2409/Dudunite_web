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
  "PKT 5x5": 65, // ≈20 g/un
  "PKT 6x6": 43, // ≈30 g/un
};

// ===== MASSA & UNTAR =====
const MARG_MASSA_G_POR_TAB  = 76;       // g
const OVOS_MASSA_G_POR_TAB  = 190;      // g
const OVO_PESO_MEDIO_G      = 52;       // g/un
const FARINHA_MASSA_PCT450_POR_TAB = 2; // 900 g = 2×450 g (Finna)

const FARINHA_UNTAR_G_POR_TAB = 150 / 12; // 12,5 g/tab
const MARG_UNTAR_G_POR_TAB    = 40 / 3;   // ~13,33 g/tab

// ===== REGRAS DE RECHEIOS =====
const LATA_LEITE_POR_BACIA    = 4;    // un
const CREME_LEITE_G_POR_BACIA = 650;  // g
const GLUCOSE_G_CADA_6_BACIAS = 500;  // g a cada 6 bacias
const GLUCOSE_FRASCO_G        = 500;  // 1 frasco = 500 g (mínimo 1 se houver bacia)
const ACHOCOLATADO_G_PRETO    = 360;  // g/bacia preta

// ===== util =====
const deaccent = (s) =>
  String(s || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

function normProduto(s) {
  const t = String(s || "")
    .trim()
    .replace(/[_\-]+/g, " ")
    .replace(/\s+/g, " ")
    .toUpperCase();

  if (/^(BROWNIE|BRW)\s*7X7$/.test(t)) return "BRW 7x7";
  if (/^(BROWNIE|BRW)\s*6X6$/.test(t)) return "BRW 6x6";
  if (/^(PKT|POCKET)\s*5X5$/.test(t)) return "PKT 5x5";
  if (/^(PKT|POCKET)\s*6X6$/.test(t)) return "PKT 6x6";
  if (/^ESC(ONDIDINHO)?$/.test(t)) return "ESC";
  return t;
}

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
function produtosValidosNoPedido(p) {
  return itensDoPedido(p)
    .map(it => normProduto(it?.produto ?? it?.item ?? it?.nome ?? ""))
    .filter(prod => REND_TAB[prod]);
}
function produtoUnicoDoPedido(p) {
  const set = Array.from(new Set(produtosValidosNoPedido(p)));
  return set.length === 1 ? set[0] : null;
}

// ===== sabores — APENAS CAMPOS CONHECIDOS (sem varrer tudo) =====
const TOKENS_PRETO = [
  "brigadeiro preto",
  "palha italiana",
  "preto com confete",
  "brigadeiro preto com confete",
].map(deaccent);

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
].map(deaccent);

const ALL_FLAVOR_TOKENS = [...TOKENS_PRETO, ...TOKENS_BRANCO, "bem casado"];

function isFlavorNome(nome) {
  const s = deaccent(nome);
  return ALL_FLAVOR_TOKENS.some(t => s.includes(t));
}

function classificaSaborCor(nome) {
  const s = deaccent(nome);
  if (s.includes("bem casado")) return { branco: 0.5, preto: 0.5 };
  if (TOKENS_PRETO.some(t => s.includes(t)))  return { branco: 0,   preto: 1 };
  if (TOKENS_BRANCO.some(t => s.includes(t))) return { branco: 1,   preto: 0 };
  return { branco: 0, preto: 0 };
}

function parseListaStrings(list) {
  const out = [];
  for (const raw of list) {
    const s = String(raw || "").trim();
    if (!s) continue;

    let m = s.match(/^(\d+)\s*[x×]\s*(.+)$/i);
    if (m) { out.push({ nome: m[2].trim(), qtd: Number(m[1]) || 0 }); continue; }

    m = s.match(/^(.+?)\s*[:\-–]\s*(\d+)$/);
    if (m) { out.push({ nome: m[1].trim(), qtd: Number(m[2]) || 0 }); continue; }

    m = s.match(/^(.+?)\s+(\d+)$/);
    if (m) { out.push({ nome: m[1].trim(), qtd: Number(m[2]) || 0 }); continue; }
  }
  return out.filter(x => isFlavorNome(x.nome) && x.qtd > 0);
}

function saboresFromAny(v) {
  if (!v) return [];
  if (Array.isArray(v)) {
    if (!v.length) return [];
    if (typeof v[0] === "string") return parseListaStrings(v);
    return v.map(s => ({
      nome: (s?.nome ?? s?.sabor ?? s?.label ?? s?.title ?? s)?.toString(),
      qtd: Number(s?.quantidade ?? s?.qtd ?? s?.qtde ?? s?.qty ?? s?.q ?? s?.value ?? 0) || 0,
    })).filter(x => isFlavorNome(x.nome) && x.qtd > 0);
  }
  if (typeof v === "string") {
    const parts = v.split(/\r?\n|,/).map(s => s.trim()).filter(Boolean);
    return parseListaStrings(parts);
  }
  if (typeof v === "object") {
    const out = [];
    for (const [k, val] of Object.entries(v)) {
      const qtd = Number(val?.qtd ?? val?.qtde ?? val?.qty ?? val ?? 0);
      if (isFlavorNome(k) && qtd > 0) out.push({ nome: k, qtd });
    }
    return out;
  }
  return [];
}

// Somente campos conhecidos do PEDIDO
function saboresNivelPedido(p) {
  const cand = [
    p?.alimentadoSabores, p?.alimentado_sabores,
    p?.saboresAlimentados, p?.saboresSelecionados,
    p?.sabores, p?.saboresLista, p?.saboresTxt, p?.saboresStrs,
    p?.observacao, p?.observacoes, p?.descricao, p?.description, p?.notes,
  ];
  for (const v of cand) {
    const arr = saboresFromAny(v);
    if (arr.length) return arr;
  }
  return [];
}

// Somente campos conhecidos do ITEM
function saboresDoItem(it) {
  const cand = [
    it?.sabores, it?.flavors, it?.alimentadoSabores, it?.saboresAlimentados,
    it?.saboresSelecionados, it?.saboresLista, it?.saboresTxt, it?.saboresStrs,
    it?.observacao, it?.observacoes, it?.descricao, it?.description, it?.notes,
  ];
  for (const v of cand) {
    const arr = saboresFromAny(v);
    if (arr.length) return arr;
  }
  return [];
}

// pedido “alimentado”?
function hasSaboresQualquerLugar(p) {
  if (saboresNivelPedido(p).length) return true;
  return itensDoPedido(p).some(it => saboresDoItem(it).length > 0);
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
  const units = new Map();

  for (const p of pedidos) {
    const prodUnico = produtoUnicoDoPedido(p);
    const sabNivelPedido = saboresNivelPedido(p);
    const sabNivelPedidoValidos = sabNivelPedido.filter(x => isFlavorNome(x.nome));
    const sumSabPedido = sabNivelPedidoValidos.reduce((a,s)=>a+s.qtd,0);

    // TEMPO_REAL: se há 1 produto e sabores válidos no nível do pedido, usa-os
    let handledByPedido = false;
    if (modo === "TEMPO_REAL" && prodUnico && sumSabPedido > 0) {
      units.set(prodUnico, (units.get(prodUnico) || 0) + sumSabPedido);
      handledByPedido = true;
    }

    for (const it of itensDoPedido(p)) {
      const produto = normProduto(it?.produto ?? it?.item ?? it?.nome ?? "");
      const rend = REND_TAB[produto];
      if (!rend) continue;

      if (handledByPedido && produto === prodUnico) continue; // evita duplicar

      let unid;
      if (modo === "TEMPO_REAL") {
        // usa sabores do item; se não houver, tenta sabores do pedido (apenas se 1 produto)
        let sab = saboresDoItem(it).filter(x => isFlavorNome(x.nome));
        if ((!sab || sab.length === 0) && prodUnico && produto === prodUnico && sumSabPedido > 0) {
          sab = sabNivelPedidoValidos;
        }
        const sumSab = (sab || []).reduce((a,s)=>a+s.qtd,0);
        unid = sumSab > 0 ? sumSab : qtdDoItem(it);
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
  let branco = 0, preto = 0;
  let somouAlgo = false;

  for (const p of pedidos) {
    const prodUnico = produtoUnicoDoPedido(p);
    const rendUnico = prodUnico ? UNID_POR_BACIA[prodUnico] : null;

    // 1) por item (somente sabores válidos)
    for (const it of itensDoPedido(p)) {
      const prod  = normProduto(it?.produto ?? it?.item ?? it?.nome ?? "");
      const rendB = UNID_POR_BACIA[prod];
      if (!rendB) continue;

      const sab = saboresDoItem(it).filter(x => isFlavorNome(x.nome));
      for (const s of sab) {
        const f = classificaSaborCor(s.nome);
        if (!f.branco && !f.preto) continue;
        const b = (s.qtd / rendB);
        branco += b * f.branco;
        preto  += b * f.preto;
        somouAlgo = true;
      }
    }

    // 2) se nada somado por item: tenta sabores do nível do pedido (produto único)
    if (!somouAlgo && rendUnico) {
      const sabP = saboresNivelPedido(p).filter(x => isFlavorNome(x.nome));
      for (const s of sabP) {
        const f = classificaSaborCor(s.nome);
        if (!f.branco && !f.preto) continue;
        const b = (s.qtd / rendUnico);
        branco += b * f.branco;
        preto  += b * f.preto;
        somouAlgo = true;
      }
    }
  }

  if (!somouAlgo) {
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
  const bTotal  = Math.max(0, baciasPorCor?.total  || (bBranco + bPreto));

  const branco = {
    leite_cond_395g_un: bBranco * LATA_LEITE_POR_BACIA,
    creme_de_leite_g:   bBranco * CREME_LEITE_G_POR_BACIA,
  };
  const preto = {
    leite_cond_395g_un: bPreto * LATA_LEITE_POR_BACIA,
    creme_de_leite_g:   bPreto * CREME_LEITE_G_POR_BACIA,
    achocolatado_g:     bPreto * ACHOCOLATADO_G_PRETO,
  };

  let totLeite = branco.leite_cond_395g_un + preto.leite_cond_395g_un;
  let totCreme = branco.creme_de_leite_g   + preto.creme_de_leite_g;
  let totAchoc = preto.achocolatado_g;

  if (bTotal > 0 && (bBranco + bPreto === 0)) {
    totLeite = bTotal * LATA_LEITE_POR_BACIA;
    totCreme = bTotal * CREME_LEITE_G_POR_BACIA;
    totAchoc = 0; // achocolatado só quando há bacias pretas
  }

  const flat = flatRecheios(totLeite, totCreme, totAchoc, bTotal);
  return { porCor: { branco, preto }, flat };
}

function montarComprasFlat({ modo, massa_untar, recheiosFlat, porCor }) {
  const lines = [];

  lines.push(
    { grupo: "Massa e Untar", item: "margarina total (g)", unidade: "g",  qtd: massa_untar.margarina_total_g },
    { grupo: "Massa e Untar", item: "ovos (un)",            unidade: "un", qtd: massa_untar.ovos_un },
    { grupo: "Massa e Untar", item: "farinha massa caixas12",      unidade: "cx",  qtd: massa_untar.farinha_massa_caixas12 },
    { grupo: "Massa e Untar", item: "farinha massa pacotes avulsos", unidade: "pct", qtd: massa_untar.farinha_massa_pacotes_avulsos },
    { grupo: "Massa e Untar", item: "farinha massa pacotes 450",    unidade: "pct", qtd: massa_untar.farinha_massa_pacotes_450 },
    { grupo: "Massa e Untar", item: "farinha untar (g)",            unidade: "g",  qtd: massa_untar.farinha_untar_g },
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

  let bacias;
  if (modo === "TEMPO_REAL") {
    bacias = baciasPorCorTempoReal(base, unidadesPorProduto);
  } else {
    const total = baciasNeutrasFromUnits(unidadesPorProduto);
    bacias = { total };
  }

  const plan = {
    modo,
    tabuleiros: tabs,
    totalTabuleiros,
    bacias,
    baciasPorCor: (modo === "TEMPO_REAL") ? { branco: bacias.branco || 0, preto: bacias.preto || 0 } : undefined,
    totalBacias: bacias.total ?? ((bacias.branco || 0) + (bacias.preto || 0)),
  };

  const out = { plan };

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

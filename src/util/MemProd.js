// src/util/MemProd.js

/* =========================================================
 *  ERP Dudunitê — Planejamento e Compras
 *  (Regras consolidadas a partir do README e ajustes)
 * ========================================================= */

/* ========= Normalização ========= */
function norm(x) {
  return String(x ?? "")
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/* ========= Canonização de produto =========
   Aceita variações como "brownie 7x7", "brw 7x7", "BRW 6x6", "pkt 5x5", etc. */
function canonicalProduto(raw) {
  const s = norm(raw);
  if (s.includes("7x7") && (s.includes("brw") || s.includes("brownie"))) return "BRW 7X7";
  if (s.includes("6x6") && (s.includes("brw") || s.includes("brownie"))) return "BRW 6X6";
  if ((s.includes("pkt") || s.includes("pocket")) && s.includes("5x5")) return "PKT 5X5";
  if ((s.includes("pkt") || s.includes("pocket")) && s.includes("6x6")) return "PKT 6X6";
  if (s.startsWith("esc") || s.includes("escond")) return "ESC";
  if (s.startsWith("dudu") || s === "dd" || s.startsWith("ddu")) return "DDU";
  return (raw ?? "").toString().toUpperCase();
}

/* ========= Rendimento por tabuleiro ========= */
const REND_TAB = {
  "BRW 7X7": 12,
  "BRW 6X6": 17,
  "PKT 5X5": 20,
  "PKT 6X6": 15,
  "ESC": 26,
  // "DDU": — não usa tabuleiro
};

/* ========= Unidades por bacia de recheio ========= */
const UNID_POR_BACIA = {
  "BRW 7X7": 25,
  "BRW 6X6": 35,
  "ESC": 26,
  "PKT 5X5": 65, // 20 g/un
  "PKT 6X6": 43, // 30 g/un
  // "DDU": — não usa bacia daqui
};

/* ========= Sabor -> cor (recheio) ========= */
const SABOR_COR = {
  // branco
  "ninho": "branco",
  "ninho com nutella": "branco",
  "oreo": "branco",
  "ovomaltine": "branco",
  "beijinho": "branco",
  "brigadeiro branco": "branco",
  "brigadeiro branco com confete": "branco",
  "paçoca": "branco",
  "pacoca": "branco",
  "kitkat": "branco",

  // preto
  "brigadeiro preto": "preto",
  "brigadeiro preto com confete": "preto",
  "palha italiana": "preto",

  // mix 50/50
  "bem casado": "mix",
};
function corDoSabor(s) { return SABOR_COR[norm(s)] || null; }

/* ========= Insumos — massa e untar =========
   (valores do README) */
const GR_MARGARINA_MASSA_POR_TAB = 76;     // g
const GR_MARGARINA_UNTAR_3TAB     = 40;     // 40 g untam 3 assadeiras
const GR_OVO_POR_TAB              = 190;    // g por tabuleiro
const PESO_MEDIO_OVO              = 52;     // g/un

// Farinha de massa (Finna 450 g): 900 g por tabuleiro = 2 pacotes de 450 g
const PACOTES_FARINHA_MASSA_POR_TAB = 2;

// Farinha para untar: 150 g untam 12 tabuleiros
const GR_FARINHA_UNTAR_12TAB = 150;

/* ========= Insumos — recheios ========= */
const LATA_LEITE_POR_BACIA     = 4;    // un
const CREME_LEITE_G_POR_BACIA  = 650;  // g
const ACHOCOLATADO_G_PRETO     = 360;  // g por bacia PRETA
const GLUCOSE_G_CADA_6_BACIAS  = 500;  // g a cada 6 bacias
const GLUCOSE_FRASCO_G         = 500;  // 1 frasco = 500 g

/* -------------------------------------------------------
 * Utilidades para ler pedidos
 * ----------------------------------------------------- */
function itensDoPedido(p) {
  // aceita p.items ou p.itens
  const base = Array.isArray(p?.items) ? p.items : (Array.isArray(p?.itens) ? p.itens : []);
  return base.filter(Boolean);
}

function qtdNum(x) {
  const n = Number(x);
  return Number.isFinite(n) ? n : 0;
}

// Tenta extrair { sabor, qtd } de várias formas
function saboresDoItem(it) {
  // padrões aceitos:
  // - it.sabores: [{sabor, qtd}] ou {nome, qtd}
  // - it.saboresMap: { "brigadeiro preto": 15, ... }
  // - it.sabor unico + it.quantidade
  const out = [];

  if (Array.isArray(it?.sabores)) {
    it.sabores.forEach((s) => {
      const nome = s?.sabor ?? s?.nome ?? s?.label ?? s?.descricao;
      const q    = qtdNum(s?.qtd ?? s?.quantidade ?? s?.qtde);
      if (nome && q > 0) out.push({ sabor: String(nome), qtd: q });
    });
  } else if (it?.saboresMap && typeof it.saboresMap === "object") {
    for (const k of Object.keys(it.saboresMap)) {
      const q = qtdNum(it.saboresMap[k]);
      if (q > 0) out.push({ sabor: String(k), qtd: q });
    }
  } else if (it?.sabor) {
    const q = qtdNum(it?.quantidade ?? it?.qtd ?? it?.qtde);
    if (q > 0) out.push({ sabor: String(it.sabor), qtd: q });
  }

  return out;
}

/* -------------------------------------------------------
 * Agregadores
 * ----------------------------------------------------- */
function agregaUnidades(pedidosFiltrados) {
  // Retorna:
  // - unidadesPorProduto: { [produto]: unidades }
  // - unidadesPorProdutoESabor: { [produto]: { [sabor]: unidades } }
  const unidadesPorProduto = {};
  const unidadesPorProdutoESabor = {};

  for (const p of pedidosFiltrados) {
    const its = itensDoPedido(p);
    for (const it of its) {
      const produtoCanon = canonicalProduto(it?.produto ?? it?.item ?? it?.nome ?? "");
      const qtd = qtdNum(it?.quantidade ?? it?.qtd ?? it?.qtde);
      if (!produtoCanon || qtd <= 0) continue;

      // total por produto
      unidadesPorProduto[produtoCanon] = (unidadesPorProduto[produtoCanon] || 0) + qtd;

      // distribuição por sabor (se houver)
      const sabs = saboresDoItem(it);
      if (sabs.length) {
        unidadesPorProdutoESabor[produtoCanon] ||= {};
        for (const s of sabs) {
          unidadesPorProdutoESabor[produtoCanon][s.sabor] =
            (unidadesPorProdutoESabor[produtoCanon][s.sabor] || 0) + s.qtd;
        }
      }
    }
  }

  return { unidadesPorProduto, unidadesPorProdutoESabor };
}

function calcTabuleiros(unidadesPorProduto) {
  const tabs = {};
  let total = 0;
  for (const produto of Object.keys(unidadesPorProduto)) {
    const un = unidadesPorProduto[produto] || 0;
    const rend = REND_TAB[produto];
    if (!rend) continue;
    const t = Math.ceil(un / rend);
    if (t > 0) {
      tabs[produto] = t;
      total += t;
    }
  }
  return { tabs, total };
}

function calcBaciasNeutras(unidadesPorProduto) {
  let total = 0;
  for (const produto of Object.keys(unidadesPorProduto)) {
    const un = unidadesPorProduto[produto] || 0;
    const rendBacia = UNID_POR_BACIA[produto];
    if (!rendBacia) continue;
    total += Math.ceil(un / rendBacia);
  }
  return { total };
}

function calcBaciasPorCor(unidadesPorProdutoESabor) {
  let brancoUn = 0, pretoUn = 0;

  for (const produto of Object.keys(unidadesPorProdutoESabor || {})) {
    const rendBacia = UNID_POR_BACIA[produto];
    if (!rendBacia) continue;

    const porSabor = unidadesPorProdutoESabor[produto] || {};
    let unBr = 0, unPr = 0;

    for (const sabor of Object.keys(porSabor)) {
      const un = porSabor[sabor] || 0;
      const cor = corDoSabor(sabor);
      if (cor === "branco") unBr += un;
      else if (cor === "preto") unPr += un;
      else if (cor === "mix") { unBr += un * 0.5; unPr += un * 0.5; }
      // sabores desconhecidos não entram por cor
    }

    brancoUn += unBr;
    pretoUn  += unPr;
  }

  const bBranco = Math.ceil(brancoUn / (brancoUn ? UNID_POR_BACIA["BRW 7X7"] : 1)); // default divisor será ajustado por produto abaixo
  const bPreto  = Math.ceil(pretoUn  / (pretoUn  ? UNID_POR_BACIA["BRW 7X7"] : 1));

  // Ajuste fino: distribuir por produto (considera rendimentos próprios)
  let brBacias = 0, prBacias = 0;
  for (const produto of Object.keys(unidadesPorProdutoESabor || {})) {
    const rend = UNID_POR_BACIA[produto];
    if (!rend) continue;
    let unBr = 0, unPr = 0;
    for (const sabor of Object.keys(unidadesPorProdutoESabor[produto] || {})) {
      const un = unidadesPorProdutoESabor[produto][sabor] || 0;
      const cor = corDoSabor(sabor);
      if (cor === "branco") unBr += un;
      else if (cor === "preto") unPr += un;
      else if (cor === "mix") { unBr += un * 0.5; unPr += un * 0.5; }
    }
    brBacias += Math.ceil(unBr / rend);
    prBacias += Math.ceil(unPr / rend);
  }

  return { branco: brBacias, preto: prBacias, total: brBacias + prBacias };
}

/* -------------------------------------------------------
 * Compras
 * ----------------------------------------------------- */
function comprasMassaUntar(totalTabuleiros) {
  // Farinha de massa: pacotes 450 g exatos (2 por tabuleiro) + conversão caixas (12)
  const farinhaPacotes450 = totalTabuleiros * PACOTES_FARINHA_MASSA_POR_TAB;
  const farinhaCaixas12   = Math.floor(farinhaPacotes450 / 12);
  const farinhaAvulsos    = farinhaPacotes450 % 12;

  // Margarina total (massa + untar)
  const margarinaTotal_g =
    totalTabuleiros * GR_MARGARINA_MASSA_POR_TAB +
    (totalTabuleiros * GR_MARGARINA_UNTAR_3TAB) / 3;

  // Farinha para untar (g)
  const farinhaUntar_g = (totalTabuleiros * GR_FARINHA_UNTAR_12TAB) / 12;

  // Ovos em unidades (média 52 g)
  const ovos_un = Math.ceil((totalTabuleiros * GR_OVO_POR_TAB) / PESO_MEDIO_OVO);

  return {
    farinha_massa_caixas12: farinhaCaixas12,
    farinha_massa_pacotes_avulsos: farinhaAvulsos,
    farinha_massa_pacotes_450: farinhaPacotes450, // para conferência
    margarina_total_g: Math.round(margarinaTotal_g),
    farinha_untar_g: Math.round(farinhaUntar_g),
    ovos_un,
  };
}

// GERAL: bacias neutras (sem cor/sabor)
function comprasRecheiosGeral(baciasTotal) {
  const leite_un  = baciasTotal * LATA_LEITE_POR_BACIA;
  const creme_g   = baciasTotal * CREME_LEITE_G_POR_BACIA;
  const glucose_g = (baciasTotal / 6) * GLUCOSE_G_CADA_6_BACIAS;
  const glucose_frascos = glucose_g > 0 ? Math.max(1, Math.ceil(glucose_g / GLUCOSE_FRASCO_G)) : 0;

  return {
    bacias_totais: baciasTotal,
    itens: {
      leite_cond_395g_un: leite_un,
      creme_de_leite_g: Math.round(creme_g),
    },
    glucose: {
      frascos: glucose_frascos,
      gramas: Math.round(glucose_g),
    },
  };
}

// TEMPO_REAL: por cor (branco/preto) + glucose total
function comprasRecheiosTempoReal(baciasPorCor) {
  const bBranco = baciasPorCor?.branco || 0;
  const bPreto  = baciasPorCor?.preto  || 0;
  const bTotal  = (bBranco + bPreto);

  const branco = {
    leite_cond_395g_un: bBranco * LATA_LEITE_POR_BACIA,
    creme_de_leite_g:   Math.round(bBranco * CREME_LEITE_G_POR_BACIA),
  };
  const preto = {
    leite_cond_395g_un: bPreto * LATA_LEITE_POR_BACIA,
    creme_de_leite_g:   Math.round(bPreto * CREME_LEITE_G_POR_BACIA),
    achocolatado_g:     Math.round(bPreto * ACHOCOLATADO_G_PRETO),
  };

  const glucose_g = (bTotal / 6) * GLUCOSE_G_CADA_6_BACIAS;
  const glucose_frascos = glucose_g > 0 ? Math.max(1, Math.ceil(glucose_g / GLUCOSE_FRASCO_G)) : 0;

  return {
    por_cor: { branco, preto },
    glucose: {
      frascos: glucose_frascos,
      gramas: Math.round(glucose_g),
    },
  };
}

/* -------------------------------------------------------
 * Filtro por modo
 * ----------------------------------------------------- */
function filtraPedidos(pedidos, modo) {
  if (!Array.isArray(pedidos)) return [];
  if (modo === "TEMPO_REAL") {
    // Somente os que estão ALIMENTADO
    return pedidos.filter(p => !!(p?.dataAlimentado || p?.alimentadoEm || p?.status === "ALIMENTADO"));
  }
  // GERAL: tudo que já tem itens lançados (inclui alimentados)
  return pedidos.filter(p => {
    const its = itensDoPedido(p);
    return its.length > 0;
  });
}

/* -------------------------------------------------------
 * API pública
 * ----------------------------------------------------- */
export function calculaPlanejamento(pedidos, opts = {}) {
  const modo = (opts?.modo || "GERAL").toUpperCase(); // "GERAL" | "TEMPO_REAL"
  const incluirCompras = !!opts?.compras;

  const base = filtraPedidos(pedidos || [], modo);
  const { unidadesPorProduto, unidadesPorProdutoESabor } = agregaUnidades(base);

  // Tabuleiros
  const { tabs: tabuleiros, total: totalTabuleiros } = calcTabuleiros(unidadesPorProduto);

  // Bacias
  let bacias = null;
  let baciasPorCor = null;

  if (modo === "GERAL") {
    const neutras = calcBaciasNeutras(unidadesPorProduto);
    bacias = { total: neutras.total };
  } else {
    baciasPorCor = calcBaciasPorCor(unidadesPorProdutoESabor);
  }

  // Compras
  let compras = null;
  if (incluirCompras) {
    const massa_untar = comprasMassaUntar(totalTabuleiros);

    if (modo === "GERAL") {
      const recheios = comprasRecheiosGeral(bacias?.total || 0);
      compras = { massa_untar, recheios };
    } else {
      const recheios = comprasRecheiosTempoReal(baciasPorCor || { branco: 0, preto: 0 });
      compras = { massa_untar, recheios };
    }
  }

  return {
    plan: {
      modo,
      tabuleiros,
      totalTabuleiros,
      ...(bacias ? { bacias } : {}),
      ...(baciasPorCor ? { baciasPorCor } : {}),
    },
    ...(compras ? { compras } : {}),
    // opcional para debug:
    // _unidades: unidadesPorProduto,
    // _unidadesPorSabor: unidadesPorProdutoESabor,
  };
}

export default calculaPlanejamento;

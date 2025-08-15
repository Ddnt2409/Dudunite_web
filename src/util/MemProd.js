// src/util/MemProd.js
// Núcleo de cálculo dos 4 relatórios (GERAL / TEMPO_REAL) + Lista de Compras
// ✅ Inclui: DUDU na lista de compras, embalagens e adesivos (com DUDU = 2 embalagens/un).

// ====== parâmetros oficiais (do README + ajustes) ======
const REND_TAB = {            // unidades por tabuleiro
  "BRW 7X7": 12,
  "BRW 6X6": 17,
  "PKT 5X5": 20,
  "PKT 6X6": 15,
  "ESC": 26,
  // DUDU não usa tabuleiro
};

const UN_POR_BACIA = {        // unidades por bacia de recheio
  "BRW 7X7": 25,
  "BRW 6X6": 35,
  "PKT 5X5": 65, // 20 g por un ≅ 65 un/bacia
  "PKT 6X6": 43, // 30 g por un ≅ 43 un/bacia
  "ESC": 26,
  // DUDU não usa “bacia” desta regra
};

// Massa por tabuleiro
const MARG_MASSA_G_POR_TAB   = 76;
const OVOS_MASSA_G_POR_TAB   = 190;
const FARINHA_MASSA_G_POR_TAB= 900; // = 2 pacotes de 450 g

// Untar tabuleiros (proporção por tabuleiro)
const MARG_UNTAR_G_PARA_3    = 40;   // ≈ 13,33 g/tabuleiro
const FARINHA_UNTAR_G_PARA_12= 150;  // = 12,5 g/tabuleiro

// Conversões / regras auxiliares
const PESO_MEDIO_OVO_G = 52; // ovos em unidades = ceil(gramas / 52)

// Nutella (apenas em Tempo Real, pois depende de sabor)
const NUTELLA_BRW_7X7_POR_POTE = 60; // 1 pote → 60 BRW 7x7
const NUTELLA_BRW_6X6_POR_POTE = 85; // 1 pote → 85 BRW 6x6
const NUTELLA_DUDU_POR_POTE    = 100; // 1 pote → 100 DUDUs

// Glucose: mínimo 1 pote (500 g) quando houver bacias; +1 a cada 6 bacias
const GLUCOSE_G_POR_6_BACIAS = 500;

// Achocolatado por bacia PRETA (Tempo Real)
const ACHOCOLATADO_G_POR_BACIA_PRETO = 360;

// DUDU — rendimentos por insumo (para compras)
const DUDU_LEITE_L_PARA_10        = 1; // 1 L para 10 dudus
const DUDU_MISTURA_395G_PARA_10   = 1; // 1 lata 395 g para 10 dudus
const DUDU_LEITE_EM_PO_200G_PARA_20 = 1; // 1 pacote 200 g para 20 dudus

// Embalagens e Adesivos (por unidade de produto)
const EMBE_ADES = {
  "BRW 7X7": { embalagens: { G650: 1 },       adesivos: { EtiqBrw: 1 } },
  "BRW 6X6": { embalagens: { G640: 1 },       adesivos: { EtiqBrw: 1 } },
  "PKT 5X5": { embalagens: { SQ5x5: 1 },      adesivos: { SQ5x5: 1 } },
  "PKT 6X6": { embalagens: { SQ6x6: 1 },      adesivos: { SQ6x6: 1 } },
  "ESC":     { embalagens: { D135_Pet: 1 },   adesivos: { EtiqEsc: 1 } },
  // Pedido do cliente: DUDU com 2 embalagens por unidade: 1×SQ5x5 + 1×SQ6x6
  "DUDU":    { embalagens: { SQ5x5: 1, SQ6x6: 1 }, adesivos: { EtiqDD: 1 } },
};

// ====== normalização / util ======
const norm = (t="") => String(t).trim().toUpperCase();

function normalizeProduto(raw) {
  const t = norm(raw);
  if (t.includes("DUDU") || t === "DD") return "DUDU";
  if (t.includes("PKT") && t.includes("5X5")) return "PKT 5X5";
  if (t.includes("PKT") && t.includes("6X6")) return "PKT 6X6";
  if (t.includes("ESC") || t.includes("ESCOND")) return "ESC";
  if (t.includes("7X7")) return "BRW 7X7";
  if (t.includes("6X6") && (t.includes("BRW") || t.includes("BROWNIE"))) return "BRW 6X6";
  if (t.includes("BROWNIE") && t.includes("7X7")) return "BRW 7X7";
  if (t.includes("BROWNIE") && t.includes("6X6")) return "BRW 6X6";
  return "";
}

function corDeSabor(saborRaw = "") {
  const s = String(saborRaw).toLowerCase();
  if (s.includes("bem casado")) return "MISTO";
  if (
    s.includes("ninho") ||
    s.includes("oreo") ||
    s.includes("ovomaltine") ||
    s.includes("beijinho") ||
    s.includes("kitkat") ||
    s.includes("paçoca") || s.includes("pacoca")
  ) return "BRANCO";
  if (
    s.includes("brigadeiro preto") ||
    s.includes("palha italiana") ||
    s.includes("confete")
  ) return "PRETO";
  return "BRANCO"; // fallback
}

function hasSaboresObject(p) {
  const s = p?.sabores;
  if (!s || typeof s !== "object") return false;
  return Object.keys(s).length > 0;
}

function isAlimentado(p) {
  return !!(p?.dataAlimentado || p?.alimentadoEm || hasSaboresObject(p));
}

// Helpers de contagem simples
function addTo(obj, key, inc) {
  obj[key] = (obj[key] || 0) + inc;
}

// ====== cálculo principal ======
export function calculaPlanejamento(pedidos = [], { modo = "GERAL", compras = false } = {}) {
  // 1) coletar itens
  const itens = [];
  for (const p of (Array.isArray(pedidos) ? pedidos : [])) {
    const considerar = (modo === "TEMPO_REAL") ? isAlimentado(p) : true;
    if (!considerar) continue;

    const arr = Array.isArray(p?.items) ? p.items : (Array.isArray(p?.itens) ? p.itens : []);
    for (const it of arr) {
      const produto = normalizeProduto(it?.produto ?? it?.item ?? it?.nome);
      const qtd = Number(it?.quantidade ?? it?.qtd ?? it?.qtde ?? 0);
      if (!produto || !qtd) continue;

      if (modo === "TEMPO_REAL") {
        // tenta detalhar por sabor; se houver p.sabores[produto], fatia proporcional
        let sabor = it?.sabor ?? it?.flavor ?? "";
        if (!sabor && hasSaboresObject(p) && Array.isArray(p.sabores[produto])) {
          const linhas = p.sabores[produto];
          const soma = linhas.reduce((acc, l) => acc + Number(l.qtd||0), 0) || qtd;
          for (const ln of linhas) {
            const parc = Math.round(qtd * (Number(ln.qtd||0) / soma));
            if (parc > 0) itens.push({ produto, qtd: parc, sabor: String(ln.sabor||"") });
          }
          continue;
        }
        itens.push({ produto, qtd, sabor: String(sabor) });
      } else {
        itens.push({ produto, qtd }); // GERAL ignora sabor
      }
    }
  }

  // 2) unidades por produto
  const unidades = {};
  for (const { produto, qtd } of itens) addTo(unidades, produto, qtd);

  // 3) tabuleiros (somente produtos que usam tabuleiro)
  const tabuleiros = {};
  let totalTabuleiros = 0;
  for (const prod of Object.keys(unidades)) {
    const r = REND_TAB[prod];
    if (!r) continue;
    const tabs = Math.ceil(unidades[prod] / r);
    tabuleiros[prod] = tabs;
    totalTabuleiros += tabs;
  }

  // 4) bacias (não contempla DUDU)
  const bacias = { total: 0 };
  let baciasPorCor = null;

  if (modo === "TEMPO_REAL") {
    const colorMap = {}; // { [prod]: { branco, preto } }
    for (const { produto, qtd, sabor } of itens) {
      if (!UN_POR_BACIA[produto]) continue;
      const cor = corDeSabor(sabor);
      const dst = (colorMap[produto] ||= { branco: 0, preto: 0 });
      if (cor === "MISTO") { dst.branco += qtd/2; dst.preto += qtd/2; }
      else if (cor === "BRANCO") { dst.branco += qtd; }
      else { dst.preto += qtd; }
    }
    let bBranco = 0, bPreto = 0;
    for (const prod of Object.keys(colorMap)) {
      const cap = UN_POR_BACIA[prod];
      bBranco += Math.ceil((colorMap[prod].branco || 0) / cap);
      bPreto  += Math.ceil((colorMap[prod].preto  || 0) / cap);
    }
    baciasPorCor = { branco: bBranco, preto: bPreto };
    bacias.total = bBranco + bPreto;
  } else {
    // GERAL: neutro (sem cor)
    let total = 0;
    for (const prod of Object.keys(unidades)) {
      const cap = UN_POR_BACIA[prod];
      if (!cap) continue;
      total += Math.ceil(unidades[prod] / cap);
    }
    bacias.total = total;
  }

  const result = {
    plan: {
      modo,
      tabuleiros,
      totalTabuleiros,
      bacias,
      ...(baciasPorCor ? { baciasPorCor } : {}),
    },
  };

  // 5) Compras
  if (compras) {
    // ===== Massa por tabuleiro =====
    const margarina_massa_g  = totalTabuleiros * MARG_MASSA_G_POR_TAB;
    const ovos_massa_g       = totalTabuleiros * OVOS_MASSA_G_POR_TAB;
    const farinha_massa_g    = totalTabuleiros * FARINHA_MASSA_G_POR_TAB;
    const farinha_massa_pacotes_450 = totalTabuleiros * 2; // 2 pacotes por tabuleiro
    const ovos_un            = Math.ceil(ovos_massa_g / PESO_MEDIO_OVO_G);

    // ===== Untar (proporcional por tabuleiro) =====
    const marg_por_tab = MARG_UNTAR_G_PARA_3 / 3;      // ≈13,33 g/tab
    const far_por_tab  = FARINHA_UNTAR_G_PARA_12 / 12; // 12,5 g/tab
    const margarina_untar_g = Math.round(totalTabuleiros * marg_por_tab);
    const farinha_untar_g   = Math.round(totalTabuleiros * far_por_tab);

    // ===== Recheios base (bacias totais) =====
    const totalB = bacias.total;
    const leite_cond_395g_un = totalB * 4;
    const creme_de_leite_g   = totalB * 650;

    // GLUCOSE (mínimo 1 pote 500 g quando houver bacias; 0 se não houver)
    const glucose_frascos = totalB > 0 ? Math.ceil(totalB / 6) : 0;
    const glucose_g       = glucose_frascos * GLUCOSE_G_POR_6_BACIAS;

    // ===== Nutella + Achocolatado (apenas TEMPO_REAL) =====
    let nutella_potes;     // BRW 7x7 / 6x6
    let achocolatado_g;    // por bacia PRETA

    if (modo === "TEMPO_REAL") {
      // Nutella por unidade (BRW)
      const nutellaUnits = { "BRW 7X7": 0, "BRW 6X6": 0 };
      for (const { produto, qtd, sabor } of itens) {
        const s = String(sabor||"").toLowerCase();
        if (!s.includes("nutella")) continue;
        if (produto === "BRW 7X7") nutellaUnits["BRW 7X7"] += qtd;
        else if (produto === "BRW 6X6") nutellaUnits["BRW 6X6"] += qtd;
      }
      const potes7x7 = Math.ceil((nutellaUnits["BRW 7X7"] || 0) / NUTELLA_BRW_7X7_POR_POTE);
      const potes6x6 = Math.ceil((nutellaUnits["BRW 6X6"] || 0) / NUTELLA_BRW_6X6_POR_POTE);
      nutella_potes = (potes7x7 + potes6x6) || undefined;

      // Achocolatado: 360 g por bacia PRETA
      const bPreto = (baciasPorCor?.preto || 0);
      achocolatado_g = bPreto * ACHOCOLATADO_G_POR_BACIA_PRETO || undefined;
    }

    // ===== DUDU (entra na lista de compras) =====
    const dudu_un = unidades["DUDU"] || 0;
    let duduCompras;
    if (dudu_un > 0) {
      const leite_litros             = Math.ceil(dudu_un / 10) * DUDU_LEITE_L_PARA_10;        // 1 L/10
      const mistura_lactea_395g_un   = Math.ceil(dudu_un / 10) * DUDU_MISTURA_395G_PARA_10;   // 1 un/10
      const leite_em_po_200g_un      = Math.ceil(dudu_un / 20) * DUDU_LEITE_EM_PO_200G_PARA_20; // 1 un/20

      // Nutella para DUDU (apenas TEMPO_REAL e só se sabor contiver “Nutella”)
      let nutella_dudu_potes;
      if (modo === "TEMPO_REAL") {
        let duduNutella = 0;
        for (const { produto, qtd, sabor } of itens) {
          if (produto !== "DUDU") continue;
          if (String(sabor||"").toLowerCase().includes("nutella")) duduNutella += qtd;
        }
        if (duduNutella > 0) {
          nutella_dudu_potes = Math.ceil(duduNutella / NUTELLA_DUDU_POR_POTE);
        }
      }

      duduCompras = {
        unidades: dudu_un,
        leite_litros,
        mistura_lactea_395g_un,
        leite_em_po_200g_un,
        ...(nutella_dudu_potes ? { nutella_potes: nutella_dudu_potes } : {}),
      };
    }

    // ===== Embalagens e Adesivos (todos os produtos, inclusive DUDU) =====
    const embalagens = {};
    const adesivos   = {};
    for (const [prod, qtd] of Object.entries(unidades)) {
      const map = EMBE_ADES[prod];
      if (!map) continue;
      if (map.embalagens) {
        for (const [cod, perUn] of Object.entries(map.embalagens)) {
          addTo(embalagens, cod, perUn * qtd);
        }
      }
      if (map.adesivos) {
        for (const [cod, perUn] of Object.entries(map.adesivos)) {
          addTo(adesivos, cod, perUn * qtd);
        }
      }
    }

    // ===== Avisos por sabor (Tempo Real) =====
    const avisos = (modo === "TEMPO_REAL") ? buildAvisos(itens) : undefined;

    const comprasObj = {
      massa_untar: {
        tabuleiros: totalTabuleiros,
        // massa (por tabuleiro)
        margarina_massa_g,
        ovos_un,
        farinha_massa_g,
        farinha_massa_pacotes_450,
        // untar
        margarina_untar_g,
        farinha_untar_g,
      },
      recheios: {
        total_bacias_aprox: totalB,
        leite_cond_395g_un,
        creme_de_leite_g,
        glucose_frascos, // exibe frascos…
        glucose_g,       // …e gramas
        ...(nutella_potes ? { nutella_potes } : {}),
        ...(achocolatado_g ? { achocolatado_g } : {}),
      },
      ...(duduCompras ? { dudu: duduCompras } : {}),
      embalagens,
      adesivos,
      ...(avisos ? { avisos } : {}),
    };

    result.compras = comprasObj;
  }

  return result;
}

// avisos de complementos conforme palavras-chave (somente para referência)
function buildAvisos(itens) {
  const s = itens.map(i => String(i.sabor||"").toLowerCase()).join(" | ");
  const out = [];
  if (s.includes("confete"))        out.push("Precisará de CONFETE");
  if (s.includes("prestigio"))      out.push("Precisará de COCO RALADO");
  if (s.includes("palha italiana")) out.push("Precisará de BISCOITO MAIZENA");
  if (s.includes("paçoca") || s.includes("pacoca"))
                                   out.push("Precisará de PAÇOCA");
  if (s.includes("brigadeiro preto")) out.push("Precisará de GRANULADO");
  return out;
  }

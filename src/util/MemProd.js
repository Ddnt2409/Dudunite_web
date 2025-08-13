// src/util/MemProd.js

/** ============================================================
 *  CÁLCULOS DE PRODUÇÃO
 *  - Rendimentos por tabuleiro
 *  - Cálculo de bacias (branco x preto) com regra de bem‑casado 50/50
 *  - Compras: margarina e farinha para untar (valores ajustáveis)
 *  ============================================================ */

/** Ajuste aqui os rendimentos (unidades por tabuleiro) */
export const RENDIMENTO_TABULEIRO = {
  "BROWNIE 7X7": 20,
  "BROWNIE 6X6": 24,
  "POCKET 5X5": 35,
  "POCKET 6X6": 24,
  "ESCONDIDINHO": 12,
  "DUDU": 1, // unidade avulsa
};

/** Quantas unidades equivalem a 1 bacia de recheio (aproximação) */
export const RENDIMENTO_BACIA = 50;

/** Margarina e farinha para UNTar por tabuleiro (em gramas) — AJUSTE OFICIAL AQUI */
export const MARGARINA_UNTAR_G_POR_TAB = 12; // TODO: confirmar valor oficial
export const FARINHA_UNTAR_G_POR_TAB = 8;    // TODO: confirmar valor oficial

/** Classificação de sabores por cor (para bacias) */
const BRANCOS = new Set([
  "Ninho", "Beijinho", "Brigadeiro branco", "Brigadeiro branco com confete",
  "Paçoca", "Bem casado", "Ninho com Nutella", "Palha italiana (branca)"
]);
const PRETOS = new Set([
  "Brigadeiro preto", "Brigadeiro preto com confete", "Oreo", "Ovomaltine",
  "KitKat", "Prestigio", "Palha italiana", "Palha italiana (preta)"
]);

/** Normalização mínima de produto */
export function normalizaProduto(p = "") {
  const pUp = String(p).toUpperCase();
  if (pUp.includes("7X7")) return "BROWNIE 7X7";
  if (pUp.includes("6X6") && pUp.includes("BROW")) return "BROWNIE 6X6";
  if (pUp.includes("5X5")) return "POCKET 5X5";
  if (pUp.includes("6X6") && pUp.includes("POC")) return "POCKET 6X6";
  if (pUp.includes("ESC")) return "ESCONDIDINHO";
  if (pUp.includes("DUDU")) return "DUDU";
  return p.trim();
}

/** Soma tabuleiros por produto a partir de itens */
function agregaTabuleiros(itens = []) {
  const tabuleiros = {};
  let totalTabuleiros = 0;

  itens.forEach(({ produto, quantidade }) => {
    const prod = normalizaProduto(produto);
    const qtd = Number(quantidade || 0);
    const rend = RENDIMENTO_TABULEIRO[prod] || RENDIMENTO_TABULEIRO["BROWNIE 7X7"]; // fallback
    const tabs = Math.ceil(qtd / rend);

    tabuleiros[prod] = (tabuleiros[prod] || 0) + tabs;
    totalTabuleiros += tabs;
  });

  return { tabuleiros, totalTabuleiros };
}

/** Bacias por cor a partir dos sabores { PRODUTO: [{sabor, qtd}] } */
function baciasPorCorFromSabores(saboresObj = {}) {
  let branco = 0;
  let preto = 0;

  Object.values(saboresObj).forEach((linhas = []) => {
    linhas.forEach(({ sabor, qtd }) => {
      const q = Number(qtd || 0);
      const s = String(sabor || "").trim();

      if (s.toLowerCase().includes("bem casado")) {
        // 50/50
        branco += q / 2;
        preto  += q / 2;
      } else if (BRANCOS.has(s)) {
        branco += q;
      } else if (PRETOS.has(s)) {
        preto += q;
      } else {
        // não classificado: não soma (ou decidir uma default)
      }
    });
  });

  const baciasBranco = Math.ceil(branco / RENDIMENTO_BACIA);
  const baciasPreto  = Math.ceil(preto  / RENDIMENTO_BACIA);
  return {
    branco: baciasBranco,
    preto: baciasPreto,
    total: baciasBranco + baciasPreto,
  };
}

/** Agrega itens e sabores dos pedidos já filtrados */
function agregaDosPedidos(pedidos = []) {
  const itensAcum = [];
  const saboresAcum = {};

  pedidos.forEach((p) => {
    // itens
    (p.itens || []).forEach((it) => {
      itensAcum.push({
        produto: normalizaProduto(it.produto),
        quantidade: Number(it.quantidade || 0),
      });
    });

    // sabores
    if (p.sabores && typeof p.sabores === "object") {
      Object.entries(p.sabores).forEach(([prod, linhas]) => {
        const key = normalizaProduto(prod);
        saboresAcum[key] = [...(saboresAcum[key] || []), ...linhas.map(l => ({
          sabor: l.sabor, qtd: Number(l.qtd || 0),
        }))];
      });
    }
  });

  return { itensAcum, saboresAcum };
}

/** Compras (massa para untar) a partir do total de tabuleiros */
function comprasFromTabuleiros(totalTabuleiros) {
  const margU = Math.round(totalTabuleiros * MARGARINA_UNTAR_G_POR_TAB);
  const farU  = Math.round(totalTabuleiros * FARINHA_UNTAR_G_POR_TAB);

  return {
    massa_e_untar: {
      tabuleiros: totalTabuleiros,
      margarina_untar_g: margU,
      farinha_untar_g: farU,
      // placeholders (mantidos para compatibilidade com relatórios)
      margarina_massa_g: 0,
      ovos_total_g: 0,
      ovos_un_aprox: 0,
      ovos_bandejas_30: 0,
      farinha_massa_total_g: 0,
      massa_450g_pacotes: 0,
    },
    recheios: {
      total_bacias_aprox: 0,
      leite_cond_395g_un: 0,
      creme_de_leite_g: 0,
      glucose_g: 0,
    },
    embalagens: {},
    adesivos: {},
  };
}

/** ===========================================
 *  API PRINCIPAL
 *  pedidos: Array<{ itens, sabores?, statusEtapa }>
 *  opt.modo: "GERAL" | "TEMPO_REAL"
 *   - GERAL: todos com statusEtapa >= "Lançado" (Lançado + Alimentado)
 *   - TEMPO_REAL: somente "Alimentado"
 *  =========================================== */
export function calculaPlanejamento(pedidos = [], opt = { modo: "GERAL" }) {
  const modo = opt?.modo === "TEMPO_REAL" ? "TEMPO_REAL" : "GERAL";

  // Filtragem por modo
  const filtrados = pedidos.filter((p) => {
    const st = (p.statusEtapa || "Lançado").toLowerCase();
    if (modo === "TEMPO_REAL") return st.includes("aliment");
    // Geral = lançados + alimentados
    return st.includes("lanc") || st.includes("lanç") || st.includes("aliment");
  });

  const { itensAcum, saboresAcum } = agregaDosPedidos(filtrados);

  const { tabuleiros, totalTabuleiros } = agregaTabuleiros(itensAcum);

  // Bacias:
  // - No geral, podemos estimar pelas quantidades (se quisesse).
  // - No tempo real, usamos sabores (mais preciso).
  let bacias = { branco: 0, preto: 0, total: 0 };
  if (modo === "TEMPO_REAL") {
    bacias = baciasPorCorFromSabores(saboresAcum);
  } else {
    // Estimativa simples no "GERAL": distribui 50/50
    const unidadesTotais = itensAcum.reduce((s, it) => s + Number(it.quantidade || 0), 0);
    const aprox = Math.ceil(unidadesTotais / RENDIMENTO_BACIA);
    bacias = { branco: Math.ceil(aprox / 2), preto: Math.floor(aprox / 2), total: aprox };
  }

  const compras = comprasFromTabuleiros(totalTabuleiros);

  return {
    plan: {
      modo,
      tabuleiros,
      totalTabuleiros,
      bacias,
      baciasPorCor: { branco: bacias.branco, preto: bacias.preto },
      totalBacias: bacias.total,
    },
    compras,
  };
}

export default {
  calculaPlanejamento,
  normalizaProduto,
  RENDIMENTO_TABULEIRO,
  RENDIMENTO_BACIA,
  MARGARINA_UNTAR_G_POR_TAB,
  FARINHA_UNTAR_G_POR_TAB,
};

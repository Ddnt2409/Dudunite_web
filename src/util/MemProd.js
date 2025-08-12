// === INÍCIO FNMP01 – Constantes e Mapas (Rendimentos/Embalagens/Adesivos) ===
/*
Regras de projeto (memória ativa):
- Rendimento por tabuleiro:
  BRW 7x7 = 12 un/tab
  BRW 6x6 = 17 un/tab
  PKT 5x5 = 20 un/tab
  PKT 6x6 = 15 un/tab
  Esc     = 26 un/tab

- Recheio (bacias):
  1 bacia = 4 leites condensados (395g) + 650g de creme de leite = 2.230g totais
  Rendimentos por bacia:
    BRW 7x7 = 25 un
    BRW 6x6 = 35 un
    Esc     = 26 un
    PKT 5x5 = 2.230g / 20g ≈ 111.5 un
    PKT 6x6 = 2.230g / 30g ≈ 74.33 un
  “Bem casado” = 50% branco + 50% preto (não existe bacia mista; somar 0.5 em cada cor).

- Insumos por tabuleiro (massa):
  Margarina (massa): 76 g/tab
  Ovos (massa):      190 g/tab  (ovo = 60g → compras em bandeja de 30)
  Farinha “massa” (Finna brownie): 900 g/tab  → pacotes de 450g (“massas”)

- Untar tabuleiros (regras novas):
  Margarina para untar: 40 g → 3 assadeiras  (≈ 13.333 g/tab)
  Farinha TRADICIONAL para untar: 150 g → 12 tab (≈ 12.5 g/tab)

- Embalagens/adesivos:
  BRW 7x7 → G650  / EtiqBrw
  BRW 6x6 → G640  / EtiqBrw
  PKT 5x5 → SQ5x5 / (adesivo por unidade, sem m²)
  PKT 6x6 → SQ6x6 / (adesivo por unidade, sem m²)
  Esc     → D135 Tampa Pet / EtiqEsc
  *Lista de compras pode ser feita por UNIDADE (decisão de caixa é manual).
*/

export const REND_TAB = {
  'BRW 7x7': 12,
  'BRW 6x6': 17,
  'PKT 5x5': 20,
  'PKT 6x6': 15,
  'Esc': 26,
};

export const REND_BACIA = {
  'BRW 7x7': 25,
  'BRW 6x6': 35,
  'Esc': 26,
  // PKT calculado pelo peso da bacia / g por unid
  'PKT 5x5': 2230 / 20,   // ≈111.5
  'PKT 6x6': 2230 / 30,   // ≈74.33
};

export const EMBALAGENS = {
  'BRW 7x7': { embalagem: 'G650', adesivo: 'EtiqBrw' },
  'BRW 6x6': { embalagem: 'G640', adesivo: 'EtiqBrw' },
  'PKT 5x5': { embalagem: 'SQ5x5', adesivo: 'SQ5x5' },
  'PKT 6x6': { embalagem: 'SQ6x6', adesivo: 'SQ6x6' },
  'Esc':     { embalagem: 'D135 Tampa Pet', adesivo: 'EtiqEsc' },
};

export const SABORES_BRANCOS = new Set([
  'Ninho','Ninho com Nutella','Oreo','Ovomaltine','Beijinho',
  'Brigadeiro branco','Brigadeiro branco com confete','Paçoca','KitKat'
  // “Bem casado” é 50/50 (tratado à parte)
]);

export const SABORES_PRETOS = new Set([
  'Brigadeiro preto','Brigadeiro preto com confete','Palha italiana'
  // “Bem casado” é 50/50 (tratado à parte)
]);

export const BEM_CASADO = 'Bem casado';
// === FIM FNMP01 ===


// === INÍCIO FNMP02 – Utilidades Gerais (arredondamento e somas) ===
const ceilDiv = (a, b) => Math.ceil(a / b);

const add = (obj, key, val) => {
  obj[key] = (obj[key] || 0) + val;
};

const clone = (x) => JSON.parse(JSON.stringify(x));
// === FIM FNMP02 ===


// === INÍCIO FNMP03 – Filtros por status para StaPed ===
/*
Tipos de filtro:
- 'PLAN_GERAL': pedidos com statusEtapa >= "Lançado"
- 'PLAN_TEMPO_REAL': statusEtapa === "Alimentado"
- 'COMPRAS_GERAL': statusEtapa ∈ {"Alimentado","Produzido"}
- 'COMPRAS_TEMPO_REAL': statusEtapa === "Alimentado"
*/
export function filtrarPorStatus(pedidos, tipo) {
  if (!Array.isArray(pedidos)) return [];
  const ok = (s) => typeof s === 'string' ? s.toLowerCase() : '';

  switch (tipo) {
    case 'PLAN_GERAL':
      return pedidos.filter(p => {
        const s = ok(p?.statusEtapa);
        return s === 'lançado' || s === 'alimentado' || s === 'produzido';
      });

    case 'PLAN_TEMPO_REAL':
      return pedidos.filter(p => ok(p?.statusEtapa) === 'alimentado');

    case 'COMPRAS_GERAL':
      return pedidos.filter(p => {
        const s = ok(p?.statusEtapa);
        return s === 'alimentado' || s === 'produzido';
      });

    case 'COMPRAS_TEMPO_REAL':
      return pedidos.filter(p => ok(p?.statusEtapa) === 'alimentado');

    default:
      return [];
  }
}
// === FIM FNMP03 ===


// === INÍCIO FNMP04 – Cálculo de Tabuleiros por Produto ===
/*
Entrada esperada por pedido:
{
  cidade, pdv, itens: [
    { produto: 'BRW 6x6', qtd: 34 }, ...
  ],
  sabores: { 'BRW 6x6': [ { sabor:'Ninho', qtd:10 }, ... ] } // só se “Alimentado”
}
*/
function totalizarTabuleiros(pedidos) {
  const totalPorProduto = {};
  let totalTab = 0;

  for (const ped of pedidos) {
    const itens = Array.isArray(ped?.itens) ? ped.itens : [];
    for (const it of itens) {
      const prod = it?.produto;
      const qtd = Number(it?.qtd || 0);
      if (!prod || !REND_TAB[prod] || !qtd) continue;
      const tab = ceilDiv(qtd, REND_TAB[prod]);
      add(totalPorProduto, prod, tab);
      totalTab += tab;
    }
  }

  return { totalPorProduto, totalTabuleiros: totalTab };
}
// === FIM FNMP04 ===


// === INÍCIO FNMP05 – Cálculo de Bacias (Total e por Cor quando houver sabores) ===
function totalizarBacias(pedidos, dividirCores=false) {
  const baciasPorProduto = {};
  const cores = { branco: 0, preto: 0 }; // somente quando dividirCores=true
  let totalBacias = 0;

  for (const ped of pedidos) {
    const itens = Array.isArray(ped?.itens) ? ped.itens : [];
    const sabores = ped?.sabores || null;

    for (const it of itens) {
      const prod = it?.produto;
      const qtd = Number(it?.qtd || 0);
      const rend = REND_BACIA[prod];
      if (!prod || !rend || !qtd) continue;

      // bacias “totais” por produto (sem cor)
      const bacias = qtd / rend;
      add(baciasPorProduto, prod, bacias);
      totalBacias += bacias;

      // Se dividir por cor, só faz sentido quando há sabores definidos (Alimentado)
      if (dividirCores && sabores && Array.isArray(sabores[prod])) {
        for (const s of sabores[prod]) {
          const nome = s?.sabor;
          const q = Number(s?.qtd || 0);
          if (!nome || !q) continue;

          const b = q / rend;
          if (nome === BEM_CASADO) {
            cores.branco += b * 0.5;
            cores.preto  += b * 0.5;
          } else if (SABORES_BRANCOS.has(nome)) {
            cores.branco += b;
          } else if (SABORES_PRETOS.has(nome)) {
            cores.preto  += b;
          } else {
            // Sabor não mapeado → não classifica cor, mas mantém no total
          }
        }
      }
    }
  }

  return { baciasPorProduto, totalBacias, baciasPorCor: dividirCores ? cores : null };
}
// === FIM FNMP05 ===


// === INÍCIO FNMP06 – Planejamento de Produção (Geral / Tempo Real) ===
/*
modo = 'GERAL'          → pedidos ≥ Lançado (sem cores)
modo = 'TEMPO_REAL'     → pedidos = Alimentado (divide cores)
*/
export function montarPlanejamento(pedidos, modo='GERAL') {
  const dividirCores = (modo === 'TEMPO_REAL');
  const { totalPorProduto, totalTabuleiros } = totalizarTabuleiros(pedidos);
  const { baciasPorProduto, totalBacias, baciasPorCor } = totalizarBacias(pedidos, dividirCores);

  return {
    modo,
    tabuleiros: totalPorProduto,
    totalTabuleiros,
    bacias: baciasPorProduto,
    totalBacias,
    baciasPorCor: baciasPorCor || undefined,
  };
}
// === FIM FNMP06 ===


// === INÍCIO FNMP07 – Lista de Compras (insumos + embalagens/etiquetas) ===
/*
Saída em gramas/unidades; decisões de embalagem (caixa/balde, m², etc.) ficam manuais.
Inclui:
- Massa Finna: 900g/tab (e “massas” de 450g)
- Margarina massa: 76g/tab
- Ovos: 190g/tab (ovos de 60g → bandeja com 30)
- Margarina untar: ~13.333g/tab
- Farinha tradicional untar: 12.5g/tab
- Bacias: 1 bacia = 4 LC (395g) + 650g creme; a cada 6 bacias somar 500g de glucose
- Embalagens e adesivos por unidade pedida
*/
export function montarListaCompras(pedidos, resumoPlanejamento) {
  // Tabuleiros (do planejamento)
  const totalTabuleiros = Number(resumoPlanejamento?.totalTabuleiros || 0);

  // 1) Insumos de massa por tabuleiro
  const margarinaMassa_g = totalTabuleiros * 76;
  const ovos_g = totalTabuleiros * 190;
  const ovos_un = ovos_g / 60; // ovos de 60g
  const ovos_bandejas = Math.ceil(ovos_un / 30);

  const farinhaMassa_g = totalTabuleiros * 900;
  const massas_450g = Math.ceil(farinhaMassa_g / 450);

  // 2) Untar tabuleiros (regras novas)
  const margarinaUntar_g = totalTabuleiros * (40 / 3); // 13.333...
  const farinhaUntar_g = totalTabuleiros * 12.5;

  // 3) Recheios (bacias)
  const totalBacias = Number(resumoPlanejamento?.totalBacias || 0);
  const leiteCond_395g_un = Math.ceil(totalBacias * 4);   // 4 por bacia
  const cremeLeite_g = Math.ceil(totalBacias * 650);      // 650g por bacia
  const glucose_g = Math.ceil((Math.floor(totalBacias / 6)) * 500);

  // 4) Embalagens/adesivos por unidade PEDIDA
  const unidadesPorProduto = {};
  for (const ped of pedidos) {
    const itens = Array.isArray(ped?.itens) ? ped.itens : [];
    for (const it of itens) {
      const prod = it?.produto;
      const qtd = Number(it?.qtd || 0);
      if (!prod || !qtd) continue;
      add(unidadesPorProduto, prod, qtd);
    }
  }

  const embalagens = {};
  const adesivos = {};
  Object.keys(unidadesPorProduto).forEach((prod) => {
    const un = unidadesPorProduto[prod];
    const map = EMBALAGENS[prod] || {};
    if (map.embalagem) add(embalagens, map.embalagem, un);
    if (map.adesivo)   add(adesivos,   map.adesivo,   un);
  });

  // 5) Saída consolidada
  return {
    massa_e_untar: {
      tabuleiros: totalTabuleiros,
      margarina_massa_g: Math.ceil(margarinaMassa_g),
      ovos_total_g: Math.ceil(ovos_g),
      ovos_un_aprox: Math.ceil(ovos_un),
      ovos_bandejas_30: ovos_bandejas,
      farinha_massa_total_g: Math.ceil(farinhaMassa_g),
      massas_450g_pacotes: massas_450g,
      margarina_untar_g: Math.ceil(margarinaUntar_g),
      farinha_untar_g: Math.ceil(farinhaUntar_g),
    },
    recheios: {
      total_bacias_aprox: Number(totalBacias.toFixed(3)),
      leite_cond_395g_un: leiteCond_395g_un,
      creme_de_leite_g: cremeLeite_g,
      glucose_g: glucose_g,
      // Quando houver divisão por cor (Tempo Real):
      bacias_por_cor: resumoPlanejamento?.baciasPorCor || undefined,
    },
    embalagens: clone(embalagens),
    adesivos: clone(adesivos),
  };
}
// === FIM FNMP07 ===

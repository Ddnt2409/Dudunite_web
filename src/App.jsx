// Bloco 1 – Importações e Constantes Globais

// Fn01 – Importações Gerais
import React, { useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import {
  collection,
  addDoc,
  getDocs,
  serverTimestamp,
  query,
  where,
  Timestamp,
} from "firebase/firestore";
import db from './firebase';

// Fn02 – Logomarca e Cores
const logoPath = "/LogomarcaDDnt2025Vazado.png";
const corPrimaria = "#8c3b1b";  // Terracota escuro
const corFundo = "#fff5ec";     // Terracota claro
// FN02 - FINAL//
// ✅ FN03 – gerarPDF (Planejamento de Produção) – AJUSTE PARA CELULAR E ERROS SILENCIOSOS
const gerarPDF = () => {
  const pedidosFiltrados = filtrarPedidosPorData();

  if (!pedidosFiltrados.length) {
    alert('Nenhum pedido encontrado para o período selecionado.');
    return;
  }

  const doc = new jsPDF();
  let y = 10;

  doc.setFont('courier', 'normal');
  doc.setFontSize(10);
  doc.text('Planejamento de Produção - Dudunitê', 10, y);
  y += 10;

  const rendimentoPorProduto = {
    "BRW 7x7": { tabuleiro: 12, bacia: { branco: 25, preto: 25 } },
    "BRW 6x6": { tabuleiro: 17, bacia: { branco: 35, preto: 35 } },
    "PKT 5x5": { tabuleiro: 20, bacia: { branco: 650 / 20, preto: 650 / 20 } },
    "PKT 6x6": { tabuleiro: 15, bacia: { branco: 650 / 30, preto: 650 / 30 } },
    "ESC":     { tabuleiro: 26, bacia: { branco: 26, preto: 26 } },
    "DUDU":    { tabuleiro: 100, bacia: { branco: 100, preto: 100 } }
  };

  const saboresBrancos = [
    "Ninho", "Ninho com nutella", "Brigadeiro branco", "Oreo",
    "Ovomaltine", "Paçoca", "Brigadeiro branco c confete", "Beijinho"
  ];
  const saboresPretos = [
    "Brigadeiro preto", "Brigadeiro c confete", "Palha italiana", "Prestigio"
  ];

  const tabuleiros = {};
  const bacias = { branco: 0, preto: 0 };

  pedidosFiltrados.forEach((pedido) => {
    try {
      const dataFormatada = pedido.timestamp?.toDate?.()?.toLocaleDateString?.("pt-BR") || "Data inválida";

      doc.text(`Escola: ${pedido.escola || '---'}`, 10, y); y += 6;
      doc.text(`Cidade: ${pedido.cidade || '---'}`, 10, y); y += 6;
      doc.text(`Data: ${dataFormatada}`, 10, y); y += 6;
      doc.text('Itens:', 10, y); y += 6;

      pedido.itens.forEach(({ produto, sabor, quantidade }) => {
        const qtd = Number(quantidade);
        doc.text(`${produto} - ${sabor} - ${qtd} un`, 12, y); y += 6;

        const rend = rendimentoPorProduto[produto];
        if (!rend) return;

        if (!tabuleiros[produto]) tabuleiros[produto] = 0;
        tabuleiros[produto] += qtd / rend.tabuleiro;

        if (sabor === "Bem casado") {
          bacias.branco += qtd / (rend.bacia.branco * 2);
          bacias.preto += qtd / (rend.bacia.preto * 2);
        } else if (saboresBrancos.includes(sabor)) {
          bacias.branco += qtd / rend.bacia.branco;
        } else if (saboresPretos.includes(sabor)) {
          bacias.preto += qtd / rend.bacia.preto;
        }
      });

      y += 4;
      if (y >= 270) {
        doc.addPage();
        y = 10;
      }
    } catch (erro) {
      console.error('Erro ao processar pedido:', pedido, erro);
    }
  });

  doc.addPage(); y = 10;
  doc.text('--- RESUMO DE PRODUÇÃO ---', 10, y); y += 8;

  doc.text('TABULEIROS:', 10, y); y += 6;
  Object.entries(tabuleiros).forEach(([produto, qtd]) => {
    doc.text(`${produto}: ${qtd.toFixed(2)} tabuleiros`, 12, y); y += 6;
  });

  y += 4;
  doc.text('RECHEIOS:', 10, y); y += 6;
  doc.text(`Branco: ${bacias.branco.toFixed(2)} bacias`, 12, y); y += 6;
  doc.text(`Preto: ${bacias.preto.toFixed(2)} bacias`, 12, y); y += 6;

  const agora = new Date();
  const dia = String(agora.getDate()).padStart(2, '0');
  const mes = String(agora.getMonth() + 1).padStart(2, '0');
  const ano = agora.getFullYear();
  const hora = String(agora.getHours()).padStart(2, '0');
  const minuto = String(agora.getMinutes()).padStart(2, '0');
  const nomePDF = `producao-${dia}-${mes}-${ano}-${hora}h${minuto}.pdf`;

  try {
    doc.save(nomePDF);
  } catch (erro) {
    alert('Erro ao tentar salvar o PDF. Experimente usar um navegador em modo desktop.');
    console.error(erro);
  }
};
// === FIM FN03 ===
// Bloco 2 – Estados e Funções Iniciais
// Fn04 – Estados Gerais do App
const App = () => {
  const [cidade, setCidade] = useState('');
  const [escola, setEscola] = useState('');
  const [produto, setProduto] = useState('');
  const [sabor, setSabor] = useState('');
  const [quantidade, setQuantidade] = useState(1);
  const [itens, setItens] = useState([]);
  const [pedidos, setPedidos] = useState([]);
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [filtroDia, setFiltroDia] = useState('');
  const [filtroMes, setFiltroMes] = useState('');
  const [pedidosFiltrados, setPedidosFiltrados] = useState([]);
  const [mostrarDadosMestres, setMostrarDadosMestres] = useState(false);
  const [novaEscola, setNovaEscola] = useState('');
  const [novoProduto, setNovoProduto] = useState('');
  const [novoSabor, setNovoSabor] = useState('');

// ✅ FN04b – carregarPedidos: busca pedidos e aplica filtro com compatibilidade retroativa
// ✅ FN04b – carregarPedidos: valida timestamps e exclui pedidos malformados
const carregarPedidos = async () => {
  try {
    const snapshot = await getDocs(collection(db, "pedidos"));
    const lista = snapshot.docs.map(doc => {
      const data = doc.data();

      let timestamp = data.timestamp;

      // Compatibilidade com pedidos antigos
      if (!timestamp && data.dataServidor?.seconds) {
        timestamp = new Timestamp(
          data.dataServidor.seconds,
          data.dataServidor.nanoseconds || 0
        );
      }

      if (!timestamp && typeof data.data === 'string') {
        const d = new Date(data.data);
        if (!isNaN(d.getTime()) && d.getFullYear() > 2000 && d.getFullYear() < 2100) {
          timestamp = Timestamp.fromDate(d);
        }
      }

      return {
        id: doc.id,
        ...data,
        timestamp // pode ainda ser null se inválido
      };
    })
    // 🔍 EXCLUI explicitamente os pedidos sem timestamp válido
    .filter(p => p.timestamp && typeof p.timestamp.toDate === 'function');

    setPedidos(lista);

    const filtrados = fn05_filtrarPedidos(lista, dataInicio, dataFim);
    setPedidosFiltrados(filtrados);
  } catch (err) {
    console.error("Erro ao carregar pedidos:", err);
    alert("Erro ao carregar pedidos do banco de dados.");
  }
};
// ✅ FN04b – FIM (atualizada com filtro forte)
  // 👇 A partir daqui seguem os useEffect, funções etc., tudo dentro do App

// === INÍCIO FN05 – Filtrar Pedidos com Intervalo Seguro (1900–2050) ===
function fn05_filtrarPedidos(pedidos, dataInicio, dataFim) {
  if (!Array.isArray(pedidos)) return [];

  const parseData = (data, isInicio) => {
    if (!data) {
      return isInicio
        ? new Date('1900-01-01T00:00:00')
        : new Date('2050-12-31T23:59:59.999');
    }

    const parsed = new Date(data);
    if (isNaN(parsed)) {
      return isInicio
        ? new Date('1900-01-01T00:00:00')
        : new Date('2050-12-31T23:59:59.999');
    }

    parsed.setHours(isInicio ? 0 : 23, isInicio ? 0 : 59, isInicio ? 0 : 59, isInicio ? 0 : 999);
    return parsed;
  };

  const dataLimiteInicio = parseData(dataInicio, true);
  const dataLimiteFim = parseData(dataFim, false);

  return pedidos.filter((pedido) => {
    if (!pedido.timestamp || typeof pedido.timestamp.toDate !== 'function') return false;
    const dataPedido = pedido.timestamp.toDate();
    return dataPedido >= dataLimiteInicio && dataPedido <= dataLimiteFim;
  });
}
// === FIM FN05 ===
// Fn06 – Formata data ISO para DD/MM/AAAA
const formatarData = (isoString) => {
  const data = new Date(isoString);
  return data.toLocaleDateString('pt-BR');
};

// Bloco 3 – Effects e Lógica Visual de Dados Mestres

// Fn07 – useEffect: Carrega pedidos ao selecionar intervalo de datas
useEffect(() => {
  if (dataInicio && dataFim) {
    carregarPedidos();
  }
}, [dataInicio, dataFim]);

// Fn08 – useEffect: Carrega todos os pedidos na carga inicial se sem filtro
useEffect(() => {
  if (!dataInicio && !dataFim) {
    carregarPedidos();
  }
}, []);

// Fn09 – toggleDadosMestres: exibe ou oculta seção de dados mestres
const toggleDadosMestres = () => {
  setMostrarDadosMestres(!mostrarDadosMestres);
};

// Bloco 4 – Adicionar e Salvar Pedidos

// Fn10 – adicionarItem: adiciona item ao pedido com validação
const adicionarItem = () => {
  if (!produto || !sabor || !quantidade || quantidade <= 0) {
    alert("Preencha todos os campos corretamente.");
    return;
  }
  setItens([...itens, { produto, sabor, quantidade: Number(quantidade) }]);
  setSabor('');
  setQuantidade(1);
};

// Fn11 – salvarPedido: envia pedido ao Firestore com validações
const salvarPedido = async () => {
  if (!cidade || !escola || itens.length === 0) {
    alert('Preencha todos os campos antes de salvar.');
    return;
  }

  const agora = new Date();

  const novoPedido = {
    cidade,
    escola,
    itens,
    data: agora.toISOString(),
    dataServidor: serverTimestamp()
  };

  try {
    await addDoc(collection(db, "pedidos"), novoPedido);
    setPedidos([...pedidos, novoPedido]);

    setCidade('');
    setEscola('');
    setProduto('');
    setSabor('');
    setQuantidade(1);
    setItens([]);

    alert('✅ Pedido salvo com sucesso!');
  } catch (error) {
    console.error("Erro ao salvar:", error);
    alert('❌ Falha ao salvar pedido.');
  }
};

// Fn12 – totalItens: totaliza a quantidade atual do pedido em andamento
const totalItens = itens.reduce((soma, item) => soma + item.quantidade, 0);

// Bloco 5 – Estrutura para cálculo de insumos e embalagens

// Fn13 – Estruturas iniciais para PDF, insumos e embalagens
const insumos = {
  margarina: 0,
  ovos: 0,
  massas: 0,
  recheiosPretos: 0,
  recheiosBrancos: 0,
  nutella: 0,
  dudus: 0
};

const embalagens = {
  G650: 0,
  G640: 0,
  SQ5x5: 0,
  SQ6x6: 0,
  SQ30x5: 0,
  SQ22x6: 0,
  D135: 0,
  EtiqBrw: 0,
  EtiqDD: 0,
  EtiqEsc: 0
};

// Bloco 6 – Geração do PDF de Planejamento de Produção
// Bloco 9 – Funções auxiliares: filtros, dados mestres, toggle
// === INÍCIO FN15 – gerarListaCompras (com recheios) ===
const gerarListaCompras = () => {
  const pedidosFiltrados = filtrarPedidosPorData();
  const doc = new jsPDF();
  let y = 10;

  doc.setFont('courier', 'normal');
  doc.setFontSize(10);
  doc.text('Lista de Compras - Dudunitê', 10, y);
  y += 10;

  const insumos = {
    margarina: 0,
    ovos: 0,
    massas: 0,
    nutella: 0,
    leite: 0,
    misturaLactea: 0,
    leiteEmPo: 0,
    leiteCondensado: 0,
    cremeDeLeite: 0,
    glucose: 0,
    nescau: 0
  };

  const embalagens = {
    G650: 0, G640: 0, SQ5x5: 0, SQ6x6: 0, D135: 0,
    SQ30x5: 0, SQ22x6: 0,
    EtiqBrw: 0, EtiqEsc: 0, EtiqDD: 0
  };

  const saboresRecheioBranco = [
    "Ninho", "Ninho com nutella", "Brigadeiro branco", "Oreo", "Ovomaltine",
    "Paçoca", "Brigadeiro branco c confete", "Beijinho"
  ];
  const saboresRecheioPreto = [
    "Brigadeiro preto", "Brigadeiro c confete", "Palha italiana", "Prestigio"
  ];

  const alertaExtras = new Set();

  let baciasBranco = 0;
  let baciasPreto = 0;

  pedidosFiltrados.forEach(p => {
    p.itens.forEach(({ produto, sabor, quantidade }) => {
      const qtd = Number(quantidade);

      // === Produção base ===
      const add = (m, o, f, emb, etiq) => {
        insumos.margarina += 76 * (qtd / m);
        insumos.ovos += 190 * (qtd / o);
        insumos.massas += 2 * (qtd / f);
        if (emb) embalagens[emb] += qtd;
        if (etiq) embalagens[etiq] += qtd;
      };

      if (produto === "BRW 7x7") add(12, 12, 12, "G650", "EtiqBrw");
      if (produto === "BRW 6x6") add(17, 17, 17, "G640", "EtiqBrw");
      if (produto === "PKT 5x5") add(20, 20, 20, "SQ5x5", "EtiqBrw");
      if (produto === "PKT 6x6") add(15, 15, 15, "SQ6x6", "EtiqBrw");
      if (produto === "ESC")     add(26, 26, 26, "D135", "EtiqEsc");

      if (produto === "DUDU") {
        embalagens.SQ30x5 += qtd;
        embalagens.SQ22x6 += qtd;
// === INÍCIO FN13 – Estruturas iniciais para PDF, insumos e embalagens ===
const insumos = {
  margarina: 0,
  ovos: 0,
  massas: 0,
  recheiosPretos: 0,
  recheiosBrancos: 0,
  nutella: 0,
  dudus: 0
};

const embalagens = {
  G650: 0,
  G640: 0,
  SQ5x5: 0,
  SQ6x6: 0,
  SQ30x5: 0,
  SQ22x6: 0,
  D135: 0,
  EtiqBrw: 0,
  EtiqDD: 0,
  EtiqEsc: 0
};
// === FIM FN13 ===

// === INÍCIO FN14 – Obter Produtos e Sabores (usado em dados estáticos) ===
const saboresRecheioBranco = [
  "Ninho", "Ninho com nutella", "Brigadeiro branco", "Oreo",
  "Ovomaltine", "Paçoca", "Brigadeiro branco c confete", "Beijinho"
];

const saboresRecheioPreto = [
  "Brigadeiro preto", "Brigadeiro c confete", "Palha italiana", "Prestigio"
];
// === FIM FN14 ===

// === INÍCIO FN15 – gerarListaCompras (com recheios) ===
const gerarListaCompras = () => {
  const pedidosFiltrados = filtrarPedidosPorData();
  const doc = new jsPDF();
  let y = 10;

  doc.setFont('courier', 'normal');
  doc.setFontSize(10);
  doc.text('Lista de Compras – Dudunitê', 10, y);
  y += 10;

  const insumos = {
    margarina: 0, ovos: 0, massas: 0, nutella: 0,
    leite: 0, misturaLactea: 0, leiteEmPo: 0,
    leiteCondensado: 0, cremeDeLeite: 0,
    glucose: 0, nescau: 0
  };

  const embalagens = {
    G650: 0, G640: 0, SQ5x5: 0, SQ6x6: 0, D135: 0,
    SQ30x5: 0, SQ22x6: 0,
    EtiqBrw: 0, EtiqEsc: 0, EtiqDD: 0
  };

  const alertaExtras = new Set();
  let baciasBranco = 0;
  let baciasPreto = 0;

  pedidosFiltrados.forEach(p => {
    p.itens.forEach(({ produto, sabor, quantidade }) => {
      const qtd = Number(quantidade);

      const add = (m, o, f, emb, etiq) => {
        insumos.margarina += 76 * (qtd / m);
        insumos.ovos += 190 * (qtd / o);
        insumos.massas += 2 * (qtd / f);
        if (emb) embalagens[emb] += qtd;
        if (etiq) embalagens[etiq] += qtd;
      };

      if (produto === "BRW 7x7") add(12, 12, 12, "G650", "EtiqBrw");
      if (produto === "BRW 6x6") add(17, 17, 17, "G640", "EtiqBrw");
      if (produto === "PKT 5x5") add(20, 20, 20, "SQ5x5", "EtiqBrw");
      if (produto === "PKT 6x6") add(15, 15, 15, "SQ6x6", "EtiqBrw");
      if (produto === "ESC")     add(26, 26, 26, "D135", "EtiqEsc");

      if (produto === "DUDU") {
        embalagens.SQ30x5 += qtd;
        embalagens.SQ22x6 += qtd;
        embalagens.EtiqDD += qtd;
        insumos.leite += qtd / 10;
        insumos.misturaLactea += qtd / 10;
        insumos.leiteEmPo += qtd / 20;
      }

      if (sabor === "Ninho com nutella") {
        if (produto === "BRW 7x7") insumos.nutella += qtd / 60;
        if (produto === "BRW 6x6") insumos.nutella += qtd / 85;
        if (produto === "ESC")     insumos.nutella += qtd / 70;
        if (produto === "DUDU")    insumos.nutella += qtd / 100;
      }

      let unidadesPorBacia = 1;
      if (produto === "BRW 7x7") unidadesPorBacia = 25;
      if (produto === "BRW 6x6") unidadesPorBacia = 35;
      if (produto === "ESC")     unidadesPorBacia = 26;
      if (produto === "PKT 5x5") unidadesPorBacia = 650 / 20;
      if (produto === "PKT 6x6") unidadesPorBacia = 650 / 30;
      if (produto === "DUDU")    unidadesPorBacia = 1e6;

      const bacias = qtd / unidadesPorBacia;

      if (saboresRecheioBranco.includes(sabor)) {
        baciasBranco += bacias;
      } else if (saboresRecheioPreto.includes(sabor)) {
        baciasPreto += bacias;
      } else if (sabor === "Bem casado") {
        baciasBranco += bacias / 2;
        baciasPreto += bacias / 2;
      }

      const saborLower = sabor.toLowerCase();
      if (saborLower.includes("confete")) alertaExtras.add("coloreti");
      if (saborLower.includes("beijinho") || saborLower.includes("prestigio")) alertaExtras.add("coco ralado");
      if (saborLower.includes("palha")) alertaExtras.add("biscoito maisena");
    });
  });

  const baciasTotais = Math.ceil(baciasBranco + baciasPreto);
  insumos.leiteCondensado += Math.ceil(baciasTotais * 4);
  insumos.cremeDeLeite += Math.ceil(baciasTotais * 650);
  insumos.glucose += Math.ceil((baciasTotais / 6) * 500);
  insumos.nescau += Math.ceil(baciasPreto * 361);

  doc.text('--- INSUMOS ---', 10, y); y += 8;
  doc.text(`Margarina: ${insumos.margarina.toFixed(0)}g`, 10, y); y += 6;
  doc.text(`Ovos: ${(insumos.ovos / 60).toFixed(0)} un`, 10, y); y += 6;
  doc.text(`Massas (450g): ${insumos.massas.toFixed(0)} un`, 10, y); y += 6;
  doc.text(`Nutella (650g): ${Math.ceil(insumos.nutella)} un`, 10, y); y += 6;
  doc.text(`Leite (L): ${insumos.leite.toFixed(1)} L`, 10, y); y += 6;
  doc.text(`Mistura Láctea: ${Math.ceil(insumos.misturaLactea)} un`, 10, y); y += 6;
  doc.text(`Leite em Pó: ${Math.ceil(insumos.leiteEmPo)} un`, 10, y); y += 6;
  doc.text(`Leite Condensado: ${insumos.leiteCondensado} un`, 10, y); y += 6;
  doc.text(`Creme de Leite: ${insumos.cremeDeLeite} g`, 10, y); y += 6;
  doc.text(`Glucose: ${insumos.glucose} g`, 10, y); y += 6;
  doc.text(`Nescau: ${insumos.nescau} g`, 10, y); y += 10;

  doc.addPage(); y = 10;
  doc.text('--- EMBALAGENS ---', 10, y); y += 8;
  Object.entries(embalagens).forEach(([codigo, qtd]) => {
    doc.text(`${codigo}: ${Math.ceil(qtd)} un`, 10, y);
    y += 6;
  });

  if (alertaExtras.size > 0) {
    y += 10;
    doc.text('⚠️ Itens adicionais necessários:', 10, y); y += 6;
    alertaExtras.forEach(item => {
      doc.text(`- ${item}`, 10, y);
      y += 6;
    });
  }

  const agora = new Date();
  const dia = String(agora.getDate()).padStart(2, '0');
  const mes = String(agora.getMonth() + 1).padStart(2, '0');
  const ano = agora.getFullYear();
  const hora = String(agora.getHours()).padStart(2, '0');
  const minuto = String(agora.getMinutes()).padStart(2, '0');
  const nomePDF = `lista-compras-${dia}-${mes}-${ano}-${hora}h${minuto}.pdf`;

  doc.save(nomePDF);
};
// === FIM FN15 ===
// === INÍCIO FN16 – Gerar Planejamento de Produção ===
const gerarPlanejamentoProducao = () => {
  const pedidosFiltrados = filtrarPedidosPorData();

  if (pedidosFiltrados.length === 0) {
    alert("Nenhum pedido encontrado no período selecionado.");
    return;
  }

  const resumo = {};
  let totalTabuleiros = 0;
  let totalBaciasBranco = 0;
  let totalBaciasPreto = 0;
  const resumoDudus = {};

  pedidosFiltrados.forEach((pedido) => {
    pedido.itens.forEach((item) => {
      const { produto, sabor, quantidade } = item;

      if (produto.toLowerCase().includes("dudu")) {
        // Totaliza os sabores de DUDUs separadamente
        if (!resumoDudus[sabor]) resumoDudus[sabor] = 0;
        resumoDudus[sabor] += quantidade;
        return; // pula o restante para não contar como tabuleiro ou bacia
      }

      // Inicializa produto se ainda não existe
      if (!resumo[produto]) {
        resumo[produto] = {
          quantidade: 0,
          tabuleiros: 0,
          baciasBranco: 0,
          baciasPreto: 0,
        };
      }

      // Totaliza quantidade por produto
      resumo[produto].quantidade += quantidade;

      // Define fator de tabuleiros conforme tipo
      let fatorTabuleiro = 1;
      if (produto === "BRW 7x7") fatorTabuleiro = 12;
      else if (produto === "BRW 6x6") fatorTabuleiro = 17;
      else if (produto === "PKT 5x5") fatorTabuleiro = 20;
      else if (produto === "PKT 6x6") fatorTabuleiro = 15;
      else if (produto === "Esc") fatorTabuleiro = 26;

      const tabuleiros = Math.ceil(quantidade / fatorTabuleiro);
      resumo[produto].tabuleiros += tabuleiros;
      totalTabuleiros += tabuleiros;

      // Recheios
      const saboresBranco = [
        "Ninho", "Ninho com Nutella", "Oreo", "Ovomaltine", "Beijinho",
        "Brigadeiro branco", "Brigadeiro branco com confete", "Paçoca", "KitKat",
      ];
      const saboresPreto = [
        "Brigadeiro preto", "Brigadeiro preto com confete", "Palha italiana",
      ];

      if (sabor === "Bem casado") {
        resumo[produto].baciasBranco += 0.5 * (quantidade / fatorTabuleiro);
        resumo[produto].baciasPreto += 0.5 * (quantidade / fatorTabuleiro);
        totalBaciasBranco += 0.5 * (quantidade / fatorTabuleiro);
        totalBaciasPreto += 0.5 * (quantidade / fatorTabuleiro);
      } else if (saboresBranco.includes(sabor)) {
        resumo[produto].baciasBranco += quantidade / fatorTabuleiro;
        totalBaciasBranco += quantidade / fatorTabuleiro;
      } else if (saboresPreto.includes(sabor)) {
        resumo[produto].baciasPreto += quantidade / fatorTabuleiro;
        totalBaciasPreto += quantidade / fatorTabuleiro;
      }
    });
  });

  // Gera PDF
  const doc = new jsPDF();
  doc.setFontSize(16);
  doc.text("Planejamento de Produção", 14, 15);

  doc.setFontSize(12);
  let y = 25;
  Object.keys(resumo).forEach((produto) => {
    const item = resumo[produto];
    doc.text(
      `Produto: ${produto} – Qtde: ${item.quantidade} – Tabuleiros: ${Math.ceil(item.tabuleiros)} – Bacias Branco: ${item.baciasBranco.toFixed(1)} – Bacias Preto: ${item.baciasPreto.toFixed(1)}`,
      14,
      y
    );
    y += 8;
  });

  // Se houver DUDUs, adiciona seção separada
  if (Object.keys(resumoDudus).length > 0) {
    y += 10;
    doc.setFontSize(14);
    doc.text("DUDUs", 14, y);
    doc.setFontSize(12);
    y += 6;
    Object.keys(resumoDudus).forEach((sabor) => {
      doc.text(`- ${sabor}: ${resumoDudus[sabor]} unidades`, 16, y);
      y += 6;
    });
  }

  y += 10;
  doc.setFontSize(14);
  doc.text("Resumo Final", 14, y);
  y += 8;
  doc.setFontSize(12);
  doc.text(`Total de Tabuleiros: ${totalTabuleiros}`, 14, y);
  y += 6;
  doc.text(`Total de Bacias de Recheio Branco: ${totalBaciasBranco.toFixed(1)}`, 14, y);
  y += 6;
  doc.text(`Total de Bacias de Recheio Preto: ${totalBaciasPreto.toFixed(1)}`, 14, y);

  doc.save("planejamento_producao.pdf");
};
// === FIM FN16 ===
// Fn17 – salvarDadosMestres: grava dados manuais como cidade, escola, produto, sabor
const salvarDadosMestres = async () => {
  const novoItem = {
    cidade,
    escola,
    produto,
    sabor,
    data: serverTimestamp()
  };
  await addDoc(collection(db, "dadosMestres"), novoItem);
  alert("Item salvo nos Dados Mestres!");
};
//FN17 - FINAL//
// === INÍCIO FN18 – toggleMostrarDadosMestres ===
const toggleMostrarDadosMestres = () => {
  setMostrarDadosMestres((prev) => !prev);
};
// === FIM FN18 ===

// === INÍCIO FN19 – PainelDadosMestres ===
const PainelDadosMestres = ({
  tipoSelecionado,
  setTipoSelecionado,
  dadosEscolas,
  setDadosEscolas,
  dadosProdutos,
  setDadosProdutos,
}) => {
  return (
    <div className="mt-6 p-4 border rounded bg-white">
      <h2 className="text-lg font-bold mb-4">🛠️ Dados Mestres</h2>
      <div className="flex gap-4 mb-4">
        <button
          onClick={() => setTipoSelecionado('escolas')}
          className="px-4 py-2 bg-blue-600 text-white rounded"
        >
          Ponto de Venda
        </button>
        <button
          onClick={() => setTipoSelecionado('produtos')}
          className="px-4 py-2 bg-green-600 text-white rounded"
        >
          Produtos
        </button>
      </div>

      {tipoSelecionado === 'escolas' && (
        <EditorEscolas
          dadosEscolas={dadosEscolas}
          setDadosEscolas={setDadosEscolas}
        />
      )}
      {tipoSelecionado === 'produtos' && (
        <EditorProdutos
          dadosProdutos={dadosProdutos}
          setDadosProdutos={setDadosProdutos}
        />
      )}
    </div>
  );
};
// === FIM FN19 ===

// === INÍCIO FN20 – EditorEscolas ===
const EditorEscolas = ({ dadosEscolas, setDadosEscolas }) => {
  return (
    <div>
      <h3 className="font-semibold mb-2">Pontos de Venda</h3>
      <p className="text-sm text-gray-600">
        🔧 Área em desenvolvimento: incluir edição, inativação e exclusão de escolas
      </p>
    </div>
  );
};
// === FIM FN20 ===

// === INÍCIO FN21 – EditorProdutos ===
const EditorProdutos = ({ dadosProdutos, setDadosProdutos }) => {
  return (
    <div>
      <h3 className="font-semibold mb-2">Produtos</h3>
      <p className="text-sm text-gray-600">
        🔧 Área em desenvolvimento: incluir edição, inativação e exclusão de produtos e sabores
      </p>
    </div>
  );
};
// === FIM FN21 ===

// === INÍCIO FN22 – Buscar dados mestres (DESATIVADA) ===
// useEffect(() => {
//   const buscarDadosMestres = async () => {
//     const colRef = collection(db, "dados_mestres");
//     const snapshot = await getDocs(colRef);
//     const dadosFirestore = {};
//     snapshot.forEach(doc => {
//       const data = doc.data();
//       if (data.cidade && data.escolas) {
//         dadosFirestore[data.cidade] = data.escolas;
//       }
//     });
//     setDadosEscolas(dadosFirestore);
//   };

//   buscarDadosMestres();
// }, []);
// === FIM FN22 ===

  // === INÍCIO FN22a – Carga estática dos dados dos selects ===
useEffect(() => {
  const escolas = {
    "Gravatá": [
      "Pequeno Príncipe", "Salesianas", "Céu Azul", "Russas", "Bora Gastar", "Kaduh", "Society Show", "Degusty"
    ],
    "Recife": [
      "Tio Valter", "Vera Cruz", "Pinheiros", "Dourado", "BMQ", "CFC", "Madre de Deus", "Saber Viver", "Anita Garib"
    ],
    "Caruaru": [
      "Interativo", "Exato Sede", "Exato Anexo", "Sesi", "Motivo", "Jesus Salvador"
    ]
  };

  const sabores = {
    "BRW 7x7": [
      "Ninho", "Ninho com Nutella", "Oreo", "Ovomaltine", "Beijinho", "Brigadeiro branco", "Brigadeiro branco com confete",
      "Bem casado", "Paçoca", "KitKat", "Brigadeiro preto", "Brigadeiro preto com confete", "Palha italiana"
    ],
    "BRW 6x6": [
      "Ninho", "Ninho com Nutella", "Oreo", "Ovomaltine", "Beijinho", "Brigadeiro branco", "Brigadeiro branco com confete",
      "Bem casado", "Paçoca", "KitKat", "Brigadeiro preto", "Brigadeiro preto com confete", "Palha italiana"
    ],
    "PKT 5x5": [
      "Ninho", "Ninho com Nutella", "Oreo", "Ovomaltine", "Beijinho", "Brigadeiro branco", "Brigadeiro branco com confete",
      "Bem casado", "Paçoca", "KitKat", "Brigadeiro preto", "Brigadeiro preto com confete", "Palha italiana"
    ],
    "PKT 6x6": [
      "Ninho", "Ninho com Nutella", "Oreo", "Ovomaltine", "Beijinho", "Brigadeiro branco", "Brigadeiro branco com confete",
      "Bem casado", "Paçoca", "KitKat", "Brigadeiro preto", "Brigadeiro preto com confete", "Palha italiana"
    ],
    "Esc": [
      "Ninho", "Ninho com Nutella", "Oreo", "Ovomaltine", "Beijinho", "Brigadeiro branco", "Brigadeiro branco com confete",
      "Bem casado", "Paçoca", "KitKat", "Brigadeiro preto", "Brigadeiro preto com confete", "Palha italiana"
    ],
    "Dudu": [
      "Dd Oreo", "Dd Ovomaltine", "Dd Ninho com Nutella", "Dd Creme de Maracujá", "Dd KitKat"
    ]
  };

  setDadosEscolas(escolas);
  setDadosProdutos(sabores);
}, []);
// === FIM FN22a ===

// === INÍCIO FN23 ===
const [tipoSelecionado, setTipoSelecionado] = useState('');
const [dadosEscolas, setDadosEscolas] = useState({});
const [dadosProdutos, setDadosProdutos] = useState({});
// === FIM FN23 ===

return (
  <div className="bg-[#FFF3E9] min-h-screen p-4 text-sm font-sans text-[#5C1D0E]">
    <div className="max-w-xl mx-auto">
      <img src="/logo.png" alt="Dudunitê" className="w-48 mx-auto mb-4" />
      <h1 className="text-center text-xl font-bold mb-6">Lançamento de Pedidos - Dudunitê</h1>

      {/* === FIM RT01 === */}

      {/* === INÍCIO RT02 – Filtro por período === */}
      <div className="mb-6">
        <label className="font-semibold block mb-1">📆 Período:</label>
        <div className="flex items-center gap-2">
          <input type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} className="p-2 border rounded" />
          <span>até</span>
          <input type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)} className="p-2 border rounded" />
        </div>
      </div>
      {/* === FIM RT02 === */}

{/* === INÍCIO RT03 – Campos do pedido === */}
<div className="grid grid-cols-2 gap-4 mb-4">
  <div>
    <label>Cidade</label>
    <select value={cidade} onChange={(e) => setCidade(e.target.value)} className="w-full p-2 rounded border">
      <option value="">Selecione</option>
      {Object.keys(dadosEscolas).map((c) => (
        <option key={c} value={c}>{c}</option>
      ))}
    </select>
  </div>

  <div>
    <label>Escola</label>
    <select value={escola} onChange={(e) => setEscola(e.target.value)} className="w-full p-2 rounded border">
      <option value="">Selecione</option>
      {dadosEscolas[cidade]?.map((e) => (
        <option key={e} value={e}>{e}</option>
      ))}
    </select>
  </div>

  <div>
    <label>Produto</label>
    <select value={produto} onChange={(e) => setProduto(e.target.value)} className="w-full p-2 rounded border">
      <option value="">Selecione</option>
      {Object.keys(dadosProdutos).map((p) => (
        <option key={p} value={p}>{p}</option>
      ))}
    </select>
  </div>

  <div>
    <label>Sabor</label>
    <select value={sabor} onChange={(e) => setSabor(e.target.value)} className="w-full p-2 rounded border">
      <option value="">Selecione</option>
      {dadosProdutos[produto]?.map((s) => (
        <option key={s} value={s}>{s}</option>
      ))}
    </select>
  </div>

  <div className="col-span-2">
    <label>Quantidade</label>
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => setQuantidade(prev => Math.max(1, prev - 1))}
        className="px-3 py-1 bg-red-600 text-white rounded"
      >
        -
      </button>

      <input
        type="number"
        min="1"
        value={quantidade}
        onChange={(e) => setQuantidade(Number(e.target.value))}
        className="w-20 p-2 border rounded text-center"
      />

      <button
        type="button"
        onClick={() => setQuantidade(prev => prev + 1)}
        className="px-3 py-1 bg-green-600 text-white rounded"
      >
        +
      </button>

      <button
        type="button"
        onClick={adicionarItem}
        className="ml-4 bg-[#8c3b1b] hover:bg-[#732f16] text-white font-semibold py-2 px-3 rounded flex items-center gap-1 text-sm"
      >
        <span className="text-lg">➕</span> <span>Adicionar</span>
      </button>
    </div>
  </div>
</div>
{/* === FIM RT03 === */}
      
      {/* === INÍCIO RT04 – Lista de Itens e botão Salvar Pedido === */}
      {itens.length > 0 && (
        <div className="mb-6">
          <h2 className="font-semibold text-lg mb-2">Itens do Pedido ({totalItens} un):</h2>
          <ul className="list-disc pl-5">
            {itens.map((item, index) => (
              <li key={index}>{item.produto} - {item.sabor} - {item.quantidade} un</li>
            ))}
          </ul>
        </div>
      )}

      <button onClick={salvarPedido} className="bg-green-700 text-white px-4 py-2 rounded hover:bg-green-800 w-full mb-4">
        💾 Salvar Pedido
      </button>
      {/* === FIM RT04 === */}

      {/* === INÍCIO RT05 – Ações adicionais === */}
      <div className="flex flex-wrap justify-center gap-4 mt-6 mb-6">
        <button onClick={gerarPDF} className="bg-purple-700 text-white px-4 py-2 rounded hover:bg-purple-800">
          📋 Planejamento de Produção
        </button>
        <button onClick={gerarListaCompras} className="bg-blue-700 text-white px-4 py-2 rounded hover:bg-blue-800">
          🧾 Lista de Compras
        </button>
      </div>

      <div className="flex justify-center">
        <button onClick={toggleMostrarDadosMestres} className="bg-zinc-700 text-white px-4 py-2 rounded hover:bg-zinc-800">
          ⚙️ Dados Mestres
        </button>
      </div>
      {/* === FIM RT05 === */}

      {/* === INÍCIO RT06 – Painel de Dados Mestres (corrigido) */}
      {mostrarDadosMestres && (
        <div className="mt-6">
          <PainelDadosMestres
            tipoSelecionado={tipoSelecionado}
            setTipoSelecionado={setTipoSelecionado}
            dadosEscolas={dadosEscolas}
            setDadosEscolas={setDadosEscolas}
            dadosProdutos={dadosProdutos}
            setDadosProdutos={setDadosProdutos}
          />
        </div>
      )}
      {/* === FIM RT06 === */}
    </div>
  </div>
);
};
export default App;

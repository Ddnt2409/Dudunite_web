// === Fn01: IMPORTAÇÕES GERAIS ===
import React, { useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import { collection, addDoc, serverTimestamp, getDocs, query, where, Timestamp } from "firebase/firestore";
import db from './firebase';

// === Fn02: COMPONENTE PRINCIPAL ===
const App = () => {
  // === Fn03: ESTADOS GLOBAIS ===
  const [cidade, setCidade] = useState('');
  const [escola, setEscola] = useState('');
  const [produto, setProduto] = useState('');
  const [sabor, setSabor] = useState('');
  const [quantidade, setQuantidade] = useState(1);
  const [itens, setItens] = useState([]);
  const [pedidos, setPedidos] = useState([]);
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');

  // === Fn04: DADOS FIXOS (CIDADES, ESCOLAS, PRODUTOS E SABORES) ===
  const dados = {
    "Recife": ["Tio Valter", "Vera Cruz", "Pinheiros", "BMQ", "Dourado", "CFC", "Madre de Deus", "Saber Viver", "Anita Garibaldi"],
    "Caruaru": ["Interativo", "Exato 1", "Exato 2", "SESI", "Motivo"],
    "Gravatá": ["Russas", "Salesianas", "Pequeno Príncipe", "Céu Azul"]
  };

  const saboresPadrao = [
    "Ninho com nutella",
    "Ninho",
    "Brig bco",
    "Brig pto",
    "Brig pto confete",
    "Brig bco confete",
    "Oreo",
    "Ovomaltine",
    "Bem casado",
    "Palha italiana",
    "Cr maracujá"
  ];

  const produtos = {
    "BRW 7x7": saboresPadrao,
    "BRW 6x6": saboresPadrao,
    "ESC": saboresPadrao,
    "PKT 5x5": saboresPadrao,
    "PKT 6x6": saboresPadrao,
    "DUDU": saboresPadrao
  };

  // === Fn05: ADICIONAR ITEM AO PEDIDO ===
  const adicionarItem = () => {
    if (produto && sabor && quantidade > 0) {
      setItens([...itens, { produto, sabor, quantidade: Number(quantidade) }]);
      setSabor('');
      setQuantidade(1);
    }
  };

  // -------------------------
  // Fn04 - Adicionar item ao pedido
  // -------------------------
  const adicionarItem = () => {
    if (produto && sabor && quantidade > 0) {
      setItens([...itens, { produto, sabor, quantidade: Number(quantidade) }]);
      setSabor('');
      setQuantidade(1);
    }
  };

  // -------------------------
  // Fn05 - Salvar pedido no Firestore
  // -------------------------
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
      alert('✅ Pedido salvo no Firestore!');
    } catch (error) {
      console.error("Erro ao salvar no Firestore:", error);
      alert('❌ Falha ao salvar no Firestore. Verifique o console.');
    }
  };

  // -------------------------
  // Fn06 - Carregar pedidos com filtro por data
  // -------------------------
  const carregarPedidos = async () => {
    try {
      const pedidosRef = collection(db, "pedidos");
      let q = pedidosRef;

      if (dataInicio && dataFim) {
        const inicio = Timestamp.fromDate(new Date(dataInicio + "T00:00:00"));
        const fim = Timestamp.fromDate(new Date(dataFim + "T23:59:59"));
        q = query(pedidosRef, where("dataServidor", ">=", inicio), where("dataServidor", "<=", fim));
      }

      const snapshot = await getDocs(q);
      const lista = snapshot.docs.map(doc => doc.data());
      setPedidos(lista);
    } catch (e) {
      console.error("Erro ao carregar pedidos:", e);
    }
  };

  // -------------------------
  // Fn07 - Contador de itens do pedido atual
  // -------------------------
  const totalItens = itens.reduce((soma, item) => soma + item.quantidade, 0);

  // -------------------------
  // Fn08 - Função auxiliar para criar nova linha no PDF
  // -------------------------
  const addLine = (text, docRef, yRef) => {
    if (yRef.value > 270) {
      docRef.addPage();
      yRef.value = 10;
    }
    docRef.text(text, 10, yRef.value);
    yRef.value += 6;
  };

  // -------------------------
  // Fn09 - Gerar PDF de produção com resumo por escola/cidade
  // -------------------------
  const gerarPDF = () => {
    const doc = new jsPDF();
    let y = { value: 10 };

    const agora = new Date();
    const dia = String(agora.getDate()).padStart(2, '0');
    const mes = String(agora.getMonth() + 1).padStart(2, '0');
    const ano = agora.getFullYear();
    const hora = String(agora.getHours()).padStart(2, '0');
    const minuto = String(agora.getMinutes()).padStart(2, '0');
    const nomePDF = `planejamento-${dia}-${mes}-${ano}-${hora}h${minuto}.pdf`;

    doc.setFont('courier', 'normal');
    doc.setFontSize(10);
    doc.text('Planejamento de Produção - Dudunitê', 10, y.value);
    y.value += 10;

    if (dataInicio && dataFim) {
      doc.text(`📆 Período: ${dataInicio.split('-').reverse().join('/')} a ${dataFim.split('-').reverse().join('/')}`, 10, y.value);
      y.value += 10;
    }

    const agrupado = {};
    const totalPorCidade = {};
    const totalGeral = {};

    pedidos.forEach(({ cidade, escola, itens }) => {
      if (!agrupado[cidade]) agrupado[cidade] = {};
      if (!agrupado[cidade][escola]) agrupado[cidade][escola] = {};

      itens.forEach(({ produto, sabor, quantidade }) => {
        if (!agrupado[cidade][escola][produto]) agrupado[cidade][escola][produto] = {};
        if (!agrupado[cidade][escola][produto][sabor]) agrupado[cidade][escola][produto][sabor] = 0;
        agrupado[cidade][escola][produto][sabor] += quantidade;

        totalPorCidade[cidade] = totalPorCidade[cidade] || {};
        totalPorCidade[cidade][produto] = (totalPorCidade[cidade][produto] || 0) + quantidade;
        totalGeral[produto] = (totalGeral[produto] || 0) + quantidade;
      });
    });

    Object.entries(agrupado).forEach(([cidade, escolas]) => {
      addLine(`Cidade: ${cidade}`, doc, y);
      Object.entries(escolas).forEach(([escola, produtos]) => {
        addLine(` Escola: ${escola}`, doc, y);
        let totalEscola = 0;

        Object.entries(produtos).forEach(([produto, sabores]) => {
          const totalProduto = Object.values(sabores).reduce((a, b) => a + b, 0);
          addLine(`\n ${produto} — Total: ${totalProduto} un`, doc, y);
          totalEscola += totalProduto;

          addLine(` Sabor             | Quantidade`, doc, y);
          addLine(` ------------------|-----------`, doc, y);
          Object.entries(sabores).forEach(([sabor, qtd]) => {
            const linha = ` ${sabor.padEnd(18)}| ${String(qtd).padStart(3)} un`;
            addLine(linha, doc, y);
          });
          addLine('', doc, y);
        });

        addLine(`➡️ Total da escola: ${totalEscola} un\n`, doc, y);
      });

      addLine(` Total da cidade ${cidade}:`, doc, y);
      Object.entries(totalPorCidade[cidade]).forEach(([produto, qtd]) => {
        addLine(` ${produto.padEnd(10)}: ${qtd} un`, doc, y);
      });

      addLine('\n', doc, y);
    });

    addLine(`TOTAL GERAL DE TODOS OS PRODUTOS:`, doc, y);
    Object.entries(totalGeral).forEach(([produto, qtd]) => {
      addLine(` ${produto.padEnd(10)}: ${qtd} un`, doc, y);
    });

y += 10;
    // ➕ RESUMO FINAL DE PRODUÇÃO
    addLine(`-----------------------------`);
    addLine(`📦 RESUMO FINAL DE PRODUÇÃO:`);

    const totalTabuleiros =
      (totalGeral["BRW 7x7"] || 0) / 12 +
      (totalGeral["BRW 6x6"] || 0) / 17 +
      (totalGeral["PKT 5x5"] || 0) / 20 +
      (totalGeral["PKT 6x6"] || 0) / 15 +
      (totalGeral["ESC"] || 0) / 26;

    addLine(`🧾 Total de tabuleiros: ${Math.ceil(totalTabuleiros)} un`);

    const saboresBrancos = [
      "Ninho com nutella", "Ninho", "Brig bco", "Brig bco confete",
      "Oreo", "Ovomaltine", "Palha italiana"
    ];
    const saboresPretos = [
      "Brig pto", "Brig pto confete"
    ];

    let baciasBranco = 0;
    let baciasPreto = 0;

    pedidos.forEach(pedido => {
      pedido.itens.forEach(({ produto, sabor, quantidade }) => {
        const qtd = Number(quantidade);

        const bacia = (qtd, rendimento) => qtd / rendimento;

        if (saboresBrancos.includes(sabor)) {
          if (produto === "BRW 7x7") baciasBranco += bacia(qtd, 25);
          if (produto === "BRW 6x6") baciasBranco += bacia(qtd, 35);
          if (produto === "ESC")     baciasBranco += bacia(qtd, 26);
          if (produto === "PKT 5x5") baciasBranco += (qtd * 20) / 1350;
          if (produto === "PKT 6x6") baciasBranco += (qtd * 30) / 1350;
        }

        if (saboresPretos.includes(sabor)) {
          if (produto === "BRW 7x7") baciasPreto += bacia(qtd, 25);
          if (produto === "BRW 6x6") baciasPreto += bacia(qtd, 35);
          if (produto === "ESC")     baciasPreto += bacia(qtd, 26);
          if (produto === "PKT 5x5") baciasPreto += (qtd * 20) / 1350;
          if (produto === "PKT 6x6") baciasPreto += (qtd * 30) / 1350;
        }
      });
    });

    addLine(`🥛 Bacias de recheio branco: ${Math.ceil(baciasBranco)} un`);
    addLine(`🍫 Bacias de recheio preto: ${Math.ceil(baciasPreto)} un`);
    addLine(`-----------------------------`);
    addLine(`📄 Gerado em ${dia}/${mes}/${ano} às ${hora}h${minuto}`);

    doc.save(nomePDF);
  };

  // Fn10 - totalItens (totaliza quantidade dos itens do pedido atual)
const totalItens = itens.reduce((soma, item) => soma + item.quantidade, 0);

// Fn11 - insumos (objeto base para insumos calculados)
const insumos = {
  margarina: 0,
  ovos: 0,
  massas: 0,
  recheiosPretos: 0,
  recheiosBrancos: 0,
  dudus: 0
};

// Fn12 - embalagens (objeto base para embalagens calculadas)
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

// Fn13 - Cálculo dos insumos e embalagens a partir dos pedidos
pedidos.forEach(pedido => {
  pedido.itens.forEach(({ produto, quantidade }) => {
    const qtd = Number(quantidade);

    if (produto === "BRW 7x7") {
      insumos.margarina += 76 * (qtd / 12);
      insumos.ovos += 190 * (qtd / 12);
      insumos.massas += 2 * (qtd / 12);
      embalagens.G650 += qtd;
      embalagens.EtiqBrw += qtd;
    }

    if (produto === "BRW 6x6") {
      insumos.margarina += 76 * (qtd / 17);
      insumos.ovos += 190 * (qtd / 17);
      insumos.massas += 2 * (qtd / 17);
      embalagens.G640 += qtd;
      embalagens.EtiqBrw += qtd;
    }

    if (produto === "PKT 5x5") {
      insumos.margarina += 76 * (qtd / 20);
      insumos.ovos += 190 * (qtd / 20);
      insumos.massas += 2 * (qtd / 20);
      embalagens.SQ5x5 += qtd;
      embalagens.EtiqBrw += qtd;
    }

    if (produto === "PKT 6x6") {
      insumos.margarina += 76 * (qtd / 15);
      insumos.ovos += 190 * (qtd / 15);
      insumos.massas += 2 * (qtd / 15);
      embalagens.SQ6x6 += qtd;
      embalagens.EtiqBrw += qtd;
    }

    if (produto === "ESC") {
      insumos.margarina += 76 * (qtd / 26);
      insumos.ovos += 190 * (qtd / 26);
      insumos.massas += 2 * (qtd / 26);
      embalagens.D135 += qtd;
      embalagens.EtiqEsc += qtd;
    }

    if (produto === "DUDU") {
      insumos.dudus += qtd;
      embalagens.SQ30x5 += qtd * 2;
      embalagens.SQ22x6 += qtd * 2;
      embalagens.EtiqDD += qtd;
    }
  });
});

// Fn14 - gerarListaCompras (completo)
const gerarListaCompras = () => {
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
    recheiosPretos: 0,
    recheiosBrancos: 0,
    recheiosMistos: 0,
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

  pedidos.forEach(pedido => {
    pedido.itens.forEach(({ produto, sabor, quantidade }) => {
      const qtd = Number(quantidade);

      // Massa base (BRW, PKT, ESC)
      if (produto === "BRW 7x7") {
        insumos.margarina += 76 * (qtd / 12);
        insumos.ovos += 190 * (qtd / 12);
        insumos.massas += 2 * (qtd / 12);
        embalagens.G650 += qtd;
        embalagens.EtiqBrw += qtd;
      }

      if (produto === "BRW 6x6") {
        insumos.margarina += 76 * (qtd / 17);
        insumos.ovos += 190 * (qtd / 17);
        insumos.massas += 2 * (qtd / 17);
        embalagens.G640 += qtd;
        embalagens.EtiqBrw += qtd;
      }

      if (produto === "PKT 5x5") {
        insumos.margarina += 76 * (qtd / 20);
        insumos.ovos += 190 * (qtd / 20);
        insumos.massas += 2 * (qtd / 20);
        embalagens.SQ5x5 += qtd;
        embalagens.EtiqBrw += qtd;
      }

      if (produto === "PKT 6x6") {
        insumos.margarina += 76 * (qtd / 15);
        insumos.ovos += 190 * (qtd / 15);
        insumos.massas += 2 * (qtd / 15);
        embalagens.SQ6x6 += qtd;
        embalagens.EtiqBrw += qtd;
      }

      if (produto === "ESC") {
        insumos.margarina += 76 * (qtd / 26);
        insumos.ovos += 190 * (qtd / 26);
        insumos.massas += 2 * (qtd / 26);
        embalagens.D135 += qtd;
        embalagens.EtiqEsc += qtd;
      }

      // DUDU
      if (produto === "DUDU") {
        insumos.dudus += qtd;
        embalagens.SQ30x5 += qtd * 2;
        embalagens.SQ22x6 += qtd * 2;
        embalagens.EtiqDD += qtd;
      }

      // Recheios

      const bacia = (qtd, rendimento) => qtd / rendimento;

      const saboresBrancos = [
        "Ninho com nutella", "Ninho", "Brig bco", "Brig bco confete",
        "Oreo", "Ovomaltine", "Palha italiana"
      ];
      const saboresPretos = [
        "Brig pto", "Brig pto confete"
      ];
      const saboresMistos = [
        "Bem casado"
      ];

      // Nutella (apenas para "Ninho com nutella")
      if (sabor === "Ninho com nutella") {
        if (produto === "BRW 7x7") insumos.nutella += qtd / 60;
        if (produto === "BRW 6x6") insumos.nutella += qtd / 85;
        if (produto === "ESC") insumos.nutella += qtd / 70;
        if (produto === "DUDU") insumos.nutella += qtd / 100;
        // PKT ignora nutella
      }

      // Recheio Branco
      if (saboresBrancos.includes(sabor)) {
        if (produto === "BRW 7x7") insumos.recheiosBrancos += bacia(qtd, 25);
        if (produto === "BRW 6x6") insumos.recheiosBrancos += bacia(qtd, 35);
        if (produto === "ESC") insumos.recheiosBrancos += bacia(qtd, 26);
        if (produto === "PKT 5x5") insumos.recheiosBrancos += (qtd * 20) / 1350;
        if (produto === "PKT 6x6") insumos.recheiosBrancos += (qtd * 25) / 1350;
      }

      // Recheio Preto
      if (saboresPretos.includes(sabor)) {
        if (produto === "BRW 7x7") insumos.recheiosPretos += bacia(qtd, 25);
        if (produto === "BRW 6x6") insumos.recheiosPretos += bacia(qtd, 35);
        if (produto === "ESC") insumos.recheiosPretos += bacia(qtd, 26);
        if (produto === "PKT 5x5") insumos.recheiosPretos += (qtd * 20) / 1350;
        if (produto === "PKT 6x6") insumos.recheiosPretos += (qtd * 25) / 1350;
      }

      // Recheio Misto (Bem Casado)
      if (saboresMistos.includes(sabor)) {
        if (produto === "BRW 7x7") insumos.recheiosMistos += bacia(qtd, 25);
        if (produto === "BRW 6x6") insumos.recheiosMistos += bacia(qtd, 35);
        if (produto === "ESC") insumos.recheiosMistos += bacia(qtd, 26);
        if (produto === "PKT 5x5") insumos.recheiosMistos += (qtd * 20) / 1350;
        if (produto === "PKT 6x6") insumos.recheiosMistos += (qtd * 25) / 1350;
      }
    });
  });

  // RESUMO DE INSUMOS - imprime no PDF
  doc.text('--- INSUMOS ---', 10, y); y += 8;
  doc.text(`Margarina: ${insumos.margarina.toFixed(0)}g`, 10, y); y += 6;
  doc.text(`Ovos: ${(insumos.ovos / 60).toFixed(0)} ovos (${insumos.ovos.toFixed(0)}g)`, 10, y); y += 6;
  doc.text(`Massas (Finna 450g): ${insumos.massas.toFixed(0)} un`, 10, y); y += 6;

  doc.text(`Nutella (pote 650g): ${Math.ceil(insumos.nutella)} un`, 10, y); y += 6;

  doc.text(`Bacias recheio branco: ${Math.ceil(insumos.recheiosBrancos)} un`, 10, y); y += 6;
  doc.text(`Bacias recheio preto: ${Math.ceil(insumos.recheiosPretos)} un`, 10, y); y += 6;
  doc.text(`Bacias recheio misto: ${Math.ceil(insumos.recheiosMistos)} un`, 10, y); y += 10;

  // NOVA PÁGINA para embalagens
  doc.addPage();
  y = 10;

  // EMBALAGENS - imprime no PDF
  doc.text('--- EMBALAGENS ---', 10, y); y += 8;
  Object.entries(embalagens).forEach(([codigo, qtd]) => {
    doc.text(`${codigo}: ${Math.ceil(qtd)} un`, 10, y);
    y += 6;
  });

  // Data e nome do arquivo
  const agora = new Date();
  const dia = String(agora.getDate()).padStart(2, '0');
  const mes = String(agora.getMonth() + 1).padStart(2, '0');
  const ano = agora.getFullYear();
  const hora = String(agora.getHours()).padStart(2, '0');
  const minuto = String(agora.getMinutes()).padStart(2, '0');
  const nomePDF = `lista-compras-${dia}-${mes}-${ano}-${hora}h${minuto}.pdf`;

  doc.save(nomePDF);
};

  // Fn15 - salvarPedido: envia novo pedido para Firestore
const salvarPedido = async () => {
  try {
    if (!cidade || !escola || itens.length === 0) {
      alert("Preencha todos os campos e adicione pelo menos um item.");
      return;
    }

    const novoPedido = {
      cidade,
      escola,
      itens,
      criadoEm: serverTimestamp(),
    };

    await addDoc(collection(db, "pedidos"), novoPedido);

    alert("Pedido salvo com sucesso!");
    setCidade('');
    setEscola('');
    setItens([]);
  } catch (error) {
    console.error("Erro ao salvar pedido: ", error);
    alert("Erro ao salvar pedido.");
  }
};

// Fn16 - carregarPedidos: busca pedidos do Firestore (opcional com filtro)
const carregarPedidos = async (filtroCidade = '', filtroEscola = '') => {
  try {
    let q = collection(db, "pedidos");

    if (filtroCidade && filtroEscola) {
      q = query(q, where("cidade", "==", filtroCidade), where("escola", "==", filtroEscola));
    } else if (filtroCidade) {
      q = query(q, where("cidade", "==", filtroCidade));
    } else if (filtroEscola) {
      q = query(q, where("escola", "==", filtroEscola));
    }

    const querySnapshot = await getDocs(q);
    const pedidosCarregados = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    setPedidos(pedidosCarregados);
  } catch (error) {
    console.error("Erro ao carregar pedidos: ", error);
  }
};

// Fn17 - limparCampos: reseta os inputs da tela
const limparCampos = () => {
  setCidade('');
  setEscola('');
  setItens([]);
};

// Fn18 - removerItem: remove um item da lista de itens pelo índice
const removerItem = (index) => {
  const novaLista = [...itens];
  novaLista.splice(index, 1);
  setItens(novaLista);
};

// Fn19 - adicionarItem: adiciona item novo à lista com validação
const adicionarItem = (produto, sabor, quantidade) => {
  if (!produto || !quantidade || quantidade <= 0) {
    alert("Produto e quantidade devem ser preenchidos corretamente.");
    return;
  }
  const novoItem = { produto, sabor, quantidade: Number(quantidade) };
  setItens([...itens, novoItem]);
};

  // Fn20 - calcularTotalItens: soma todas as quantidades dos itens do pedido
const calcularTotalItens = () => {
  return itens.reduce((total, item) => total + item.quantidade, 0);
};

// Fn21 - gerarResumoProducao: gera resumo quantitativo para produção
const gerarResumoProducao = () => {
  const resumo = {};

  pedidos.forEach(({ itens }) => {
    itens.forEach(({ produto, quantidade }) => {
      if (!resumo[produto]) resumo[produto] = 0;
      resumo[produto] += quantidade;
    });
  });

  return resumo;
};

// Fn22 - calcularInsumos: calcula insumos (margarina, ovos, massas etc) baseados nos pedidos
const calcularInsumos = () => {
  const insumos = {
    margarina: 0,
    ovos: 0,
    massas: 0,
    recheiosPretos: 0,
    recheiosBrancos: 0,
    dudus: 0,
  };

  pedidos.forEach(({ itens }) => {
    itens.forEach(({ produto, quantidade }) => {
      const qtd = Number(quantidade);

      switch (produto) {
        case "BRW 7x7":
          insumos.margarina += 76 * (qtd / 12);
          insumos.ovos += 190 * (qtd / 12);
          insumos.massas += 2 * (qtd / 12);
          break;
        case "BRW 6x6":
          insumos.margarina += 76 * (qtd / 17);
          insumos.ovos += 190 * (qtd / 17);
          insumos.massas += 2 * (qtd / 17);
          break;
        case "PKT 5x5":
          insumos.margarina += 76 * (qtd / 20);
          insumos.ovos += 190 * (qtd / 20);
          insumos.massas += 2 * (qtd / 20);
          break;
        case "PKT 6x6":
          insumos.margarina += 76 * (qtd / 15);
          insumos.ovos += 190 * (qtd / 15);
          insumos.massas += 2 * (qtd / 15);
          break;
        case "ESC":
          insumos.margarina += 76 * (qtd / 26);
          insumos.ovos += 190 * (qtd / 26);
          insumos.massas += 2 * (qtd / 26);
          break;
        case "DUDU":
          insumos.dudus += qtd;
          break;
      }
    });
  });

  return insumos;
};

// Fn23 - gerarListaCompras: gera o PDF da lista de compras (exemplo simplificado)
const gerarListaCompras = () => {
  const doc = new jsPDF();
  let y = 10;

  doc.setFont('courier', 'normal');
  doc.setFontSize(10);
  doc.text('Lista de Compras - Dudunitê', 10, y);
  y += 10;

  const insumos = calcularInsumos();

  doc.text(`Margarina: ${insumos.margarina.toFixed(0)} g`, 10, y);
  y += 6;
  doc.text(`Ovos: ${insumos.ovos.toFixed(0)} g`, 10, y);
  y += 6;
  doc.text(`Massas: ${insumos.massas.toFixed(0)} un`, 10, y);
  y += 6;
  doc.text(`Dudus: ${insumos.dudus.toFixed(0)} un`, 10, y);
  y += 10;

  doc.save('lista-compras.pdf');
};

// Fn24 - validações adicionais (exemplo para input quantidade)
const validarQuantidade = (qtd) => {
  if (isNaN(qtd) || qtd <= 0) {
    alert("Quantidade inválida");
    return false;
  }
  return true;
};

  return (
  <div className="max-w-3xl mx-auto p-4 bg-[#fff5ec] min-h-screen">
    {/* Logo e cabeçalho */}
    <div className="flex justify-center mb-6">
      <img
        src="/logo-dudunite.png"
        alt="Logo Dudunitê"
        className="h-20 w-auto"
      />
    </div>
    
    <h1 className="text-xl font-bold mb-4 text-center text-[#8c3b1b]">
      Lançamento de Pedidos - Dudunitê
    </h1>

    {/* Seleção de cidade e escola */}
    <div className="grid grid-cols-2 gap-4 mb-4">
      <div>
        <label className="block mb-1 font-semibold">Cidade</label>
        <select
          className="w-full border p-2 rounded"
          value={cidade}
          onChange={e => {
            setCidade(e.target.value);
            setEscola('');
          }}
        >
          <option value="">Selecione</option>
          {Object.keys(dados).map(c => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block mb-1 font-semibold">Escola</label>
        <select
          className="w-full border p-2 rounded"
          value={escola}
          onChange={e => setEscola(e.target.value)}
          disabled={!cidade}
        >
          <option value="">Selecione</option>
          {cidade &&
            dados[cidade].map(e => (
              <option key={e} value={e}>
                {e}
              </option>
            ))}
        </select>
      </div>
    </div>

    {/* Seleção de produto e sabor */}
    <div className="grid grid-cols-2 gap-4 mb-4">
      <div>
        <label className="block mb-1 font-semibold">Produto</label>
        <select
          className="w-full border p-2 rounded"
          value={produto}
          onChange={e => {
            setProduto(e.target.value);
            setSabor('');
          }}
        >
          <option value="">Selecione</option>
          {Object.keys(produtos).map(p => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block mb-1 font-semibold">Sabor</label>
        <select
          className="w-full border p-2 rounded"
          value={sabor}
          onChange={e => setSabor(e.target.value)}
          disabled={!produto}
        >
          <option value="">Selecione</option>
          {produto &&
            produtos[produto].map(s => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
        </select>
      </div>
    </div>

    {/* Quantidade e botão adicionar */}
    <div className="grid grid-cols-2 gap-4 mb-6">
      <div>
        <label className="block mb-1 font-semibold">Quantidade</label>
        <input
          type="number"
          min="1"
          className="w-full border p-2 rounded"
          value={quantidade}
          onChange={e => setQuantidade(e.target.value)}
        />
      </div>

      <div className="flex items-end">
        <button
          onClick={adicionarItem}
          className="bg-[#a84d2a] hover:bg-[#8c3b1b] text-white px-4 py-2 rounded w-full"
        >
          + Adicionar
        </button>
      </div>
    </div>

    {/* Lista de itens adicionados */}
    <div className="mb-6">
      <h2 className="font-bold text-lg mb-2">
        Itens do Pedido (Total: {totalItens} un)
      </h2>
      {itens.length === 0 ? (
        <p className="text-gray-500 italic">Nenhum item adicionado.</p>
      ) : (
        <ul className="list-disc list-inside space-y-1">
          {itens.map((item, index) => (
            <li key={index}>
              {item.produto} - {item.sabor} - {item.quantidade} un
            </li>
          ))}
        </ul>
      )}
    </div>

    {/* Botões para salvar, gerar PDF e lista de compras */}
    <div className="flex flex-wrap gap-4 mb-8">
      <button
        onClick={salvarPedido}
        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded flex-grow"
      >
        Salvar Pedido
      </button>
      <button
        onClick={gerarPDF}
        className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded flex-grow"
      >
        Gerar PDF Produção
      </button>
      <button
        onClick={gerarListaCompras}
        className="bg-green-700 hover:bg-green-800 text-white px-6 py-2 rounded flex-grow"
      >
        🛒 Gerar Lista de Compras
      </button>
    </div>

    {/* Listagem dos pedidos carregados */}
    <div>
      <h2 className="font-bold text-lg mb-2">Pedidos Filtrados</h2>
      {pedidos.length === 0 ? (
        <p className="text-gray-500 italic">Nenhum pedido encontrado.</p>
      ) : (
        <ul className="text-sm text-gray-700 list-disc list-inside space-y-1 max-h-48 overflow-auto border p-2 rounded bg-white">
          {pedidos.map((p, i) => (
            <li key={i}>
              📌 {p.cidade} - {p.escola} ({p.itens.length} itens)
            </li>
          ))}
        </ul>
      )}
    </div>
  </div>
);

  return (
  <div className="max-w-3xl mx-auto p-4 bg-[#fff5ec] min-h-screen font-sans">
    {/* LOGO */}
    <div className="flex justify-center mb-6">
      <img
        src="/logo-dudunite.png"
        alt="Logomarca Dudunitê"
        className="h-20 w-auto"
      />
    </div>

    <h1 className="text-2xl font-bold mb-6 text-center text-[#8c3b1b]">
      Lançamento de Pedidos - Dudunitê
    </h1>

    {/* Formulário de Seleção */}
    <div className="grid grid-cols-2 gap-4 mb-4">
      <div>
        <label className="block font-semibold mb-1 text-[#a84d2a]">Cidade</label>
        <select
          className="w-full border border-[#a84d2a] rounded p-2"
          value={cidade}
          onChange={e => {
            setCidade(e.target.value);
            setEscola('');
          }}
        >
          <option value="">Selecione</option>
          {Object.keys(dados).map(c => (
            <option key={c}>{c}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block font-semibold mb-1 text-[#a84d2a]">Escola</label>
        <select
          className="w-full border border-[#a84d2a] rounded p-2"
          value={escola}
          onChange={e => setEscola(e.target.value)}
          disabled={!cidade}
        >
          <option value="">Selecione</option>
          {cidade &&
            dados[cidade].map(e => (
              <option key={e}>{e}</option>
            ))}
        </select>
      </div>

      <div>
        <label className="block font-semibold mb-1 text-[#a84d2a]">Produto</label>
        <select
          className="w-full border border-[#a84d2a] rounded p-2"
          value={produto}
          onChange={e => {
            setProduto(e.target.value);
            setSabor('');
          }}
        >
          <option value="">Selecione</option>
          {Object.keys(produtos).map(p => (
            <option key={p}>{p}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block font-semibold mb-1 text-[#a84d2a]">Sabor</label>
        <select
          className="w-full border border-[#a84d2a] rounded p-2"
          value={sabor}
          onChange={e => setSabor(e.target.value)}
          disabled={!produto}
        >
          <option value="">Selecione</option>
          {produto &&
            produtos[produto].map(s => (
              <option key={s}>{s}</option>
            ))}
        </select>
      </div>

      <div>
        <label className="block font-semibold mb-1 text-[#a84d2a]">Quantidade</label>
        <input
          type="number"
          min="1"
          className="w-full border border-[#a84d2a] rounded p-2"
          value={quantidade}
          onChange={e => setQuantidade(e.target.value)}
        />
      </div>

      <div className="flex items-end">
        <button
          onClick={adicionarItem}
          className="bg-[#a84d2a] hover:bg-[#8c3b1b] text-white px-4 py-2 rounded w-full"
        >
          + Adicionar
        </button>
      </div>
    </div>

    {/* Itens do Pedido */}
    <div className="mb-6">
      <h2 className="font-bold text-[#a84d2a] mb-2">
        Itens do Pedido (Total: {totalItens} un):
      </h2>
      {itens.length === 0 ? (
        <p className="text-sm text-gray-600 italic">Nenhum item adicionado.</p>
      ) : (
        <ul className="list-disc list-inside text-[#5c3213]">
          {itens.map((item, i) => (
            <li key={i}>
              {item.produto} - {item.sabor} - {item.quantidade} un
            </li>
          ))}
        </ul>
      )}
    </div>

    {/* Botões principais */}
    <div className="flex gap-4 flex-wrap mb-6">
      <button
        onClick={salvarPedido}
        className="bg-[#8c3b1b] hover:bg-[#7a3216] text-white px-6 py-2 rounded flex-1 min-w-[140px]"
      >
        Salvar Pedido
      </button>
      <button
        onClick={gerarPDF}
        className="bg-[#6f4e37] hover:bg-[#5c3f2b] text-white px-6 py-2 rounded flex-1 min-w-[140px]"
      >
        Gerar PDF Produção
      </button>
      <button
        onClick={gerarListaCompras}
        className="bg-[#4a7a33] hover:bg-[#3d6528] text-white px-6 py-2 rounded flex-1 min-w-[140px]"
      >
        🛒 Gerar Lista de Compras
      </button>
    </div>

    {/* Pedidos Filtrados */}
    <div>
      <h2 className="font-bold text-[#a84d2a] mb-2">Pedidos Filtrados:</h2>
      {pedidos.length === 0 ? (
        <p className="text-sm text-gray-600 italic">Nenhum pedido carregado.</p>
      ) : (
        <ul className="text-sm text-[#5c3213]">
          {pedidos.map((p, i) => (
            <li key={i}>
              📌 {p.cidade} - {p.escola} ({p.itens.length} itens)
            </li>
          ))}
        </ul>
      )}
    </div>
  </div>
);

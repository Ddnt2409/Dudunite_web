// Fn01 - Importações gerais
import React, { useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import { collection, addDoc, getDocs, query, where, Timestamp, serverTimestamp, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import db from './firebase';

// Fn02 - Setup de dados (cidades, escolas, produtos, sabores)
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

// Fn03 - Logomarca e tons
const estiloContainer = {
  fontFamily: 'sans-serif',
  padding: 20,
  backgroundColor: '#fff5ec', // tom terracota claro
  minHeight: '100vh'
};

const estiloTitulo = {
  color: '#8c3b1b', // tom terracota escuro
  textAlign: 'center',
  marginBottom: 20
};

// Fn04 - Estados iniciais do App
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

// Fn05 - useEffect para carregar pedidos do Firestore
  useEffect(() => {
    const carregarPedidos = async () => {
      try {
        const pedidosRef = collection(db, "pedidos");
        const snapshot = await getDocs(pedidosRef);
        const lista = snapshot.docs.map(doc => doc.data());
        setPedidos(lista);
      } catch (error) {
        console.error("Erro ao carregar pedidos:", error);
      }
    };
    carregarPedidos();
  }, []);

// Fn06 - Função formatar data (DD/MM/YYYY)
const formatarData = (isoString) => {
  const data = new Date(isoString);
  return data.toLocaleDateString('pt-BR');
};

  // Fn07 - validarQuantidade: verifica se quantidade é válida
const validarQuantidade = (qtd) => {
  if (isNaN(qtd) || qtd <= 0) {
    alert("Quantidade inválida");
    return false;
  }
  return true;
};

// Fn08 - adicionarItem: adiciona item novo à lista com validação
const adicionarItem = () => {
  if (!produto || !sabor || !validarQuantidade(quantidade)) return;

  setItens([...itens, { produto, sabor, quantidade: Number(quantidade) }]);
  setSabor('');
  setQuantidade(1);
};

// Fn09 - salvarPedido: envia novo pedido para o Firestore
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
    alert('❌ Falha ao salvar. Verifique o console.');
  }
};

// Fn10 - filtrarPedidosPorData
const filtrarPedidosPorData = () => {
  if (!dataInicio || !dataFim) return pedidos;

  const inicio = new Date(dataInicio);
  const fim = new Date(dataFim);
  fim.setHours(23, 59, 59, 999);

  return pedidos.filter(pedido => {
    const dataPedido = new Date(pedido.data);
    return dataPedido >= inicio && dataPedido <= fim;
  });
};

  // Fn11 - carregarPedidos: busca pedidos do Firestore (opcional com filtro)
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

// Fn12 - totalItens (totaliza quantidade dos itens do pedido atual)
const totalItens = itens.reduce((soma, item) => soma + item.quantidade, 0);

// Fn13 - insumos (objeto base para insumos calculados)
const insumos = {
  margarina: 0,
  ovos: 0,
  massas: 0,
  recheiosPretos: 0,
  recheiosBrancos: 0,
  dudus: 0
};

// Fn14 - embalagens (objeto base para embalagens calculadas)
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

  // Fn15 - gerarPDF: planejamento de produção com agrupamento e resumo
const gerarPDF = () => {
  const doc = new jsPDF();
  let y = 10;

  const agora = new Date();
  const dia = String(agora.getDate()).padStart(2, '0');
  const mes = String(agora.getMonth() + 1).padStart(2, '0');
  const ano = agora.getFullYear();
  const hora = String(agora.getHours()).padStart(2, '0');
  const minuto = String(agora.getMinutes()).padStart(2, '0');
  const nomePDF = `planejamento-${dia}-${mes}-${ano}-${hora}h${minuto}.pdf`;

  doc.setFont('courier', 'normal');
  doc.setFontSize(10);
  doc.text('Planejamento de Produção - Dudunitê', 10, y);
  y += 10;

  if (dataInicio && dataFim) {
    doc.text(`📆 Período: ${dataInicio.split('-').reverse().join('/')} a ${dataFim.split('-').reverse().join('/')}`, 10, y);
    y += 10;
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

  const addLine = (text) => {
    if (y > 270) {
      doc.addPage();
      y = 10;
    }
    doc.text(text, 10, y);
    y += 6;
  };

  Object.entries(agrupado).forEach(([cidade, escolas]) => {
    addLine(`Cidade: ${cidade}`);
    Object.entries(escolas).forEach(([escola, produtos]) => {
      addLine(` Escola: ${escola}`);
      let totalEscola = 0;

      Object.entries(produtos).forEach(([produto, sabores]) => {
        const totalProduto = Object.values(sabores).reduce((a, b) => a + b, 0);
        addLine(`\n ${produto} — Total: ${totalProduto} un`);
        totalEscola += totalProduto;

        addLine(` Sabor             | Quantidade`);
        addLine(` ------------------|-----------`);
        Object.entries(sabores).forEach(([sabor, qtd]) => {
          const linha = ` ${sabor.padEnd(18)}| ${String(qtd).padStart(3)} un`;
          addLine(linha);
        });
        addLine('');
      });

      addLine(`➡️ Total da escola: ${totalEscola} un\n`);
    });

    addLine(` Total da cidade ${cidade}:`);
    Object.entries(totalPorCidade[cidade]).forEach(([produto, qtd]) => {
      addLine(` ${produto.padEnd(10)}: ${qtd} un`);
    });

    addLine('\n');
  });

  addLine(`TOTAL GERAL DE TODOS OS PRODUTOS:`);
  Object.entries(totalGeral).forEach(([produto, qtd]) => {
    addLine(` ${produto.padEnd(10)}: ${qtd} un`);
  });

  y += 10;
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

  // Fn16 - gerarListaCompras: gera o PDF da lista de compras com insumos e embalagens
const gerarListaCompras = () => {
  const doc = new jsPDF();
  let y = 10;

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

      // Massa base
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

      // Dudus
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
      const saboresMistos = ["Bem casado"];

      if (sabor === "Ninho com nutella") {
        if (produto === "BRW 7x7") insumos.nutella += qtd / 60;
        if (produto === "BRW 6x6") insumos.nutella += qtd / 85;
        if (produto === "ESC")     insumos.nutella += qtd / 70;
        if (produto === "DUDU")    insumos.nutella += qtd / 100;
      }

      if (saboresBrancos.includes(sabor)) {
        if (produto === "BRW 7x7") insumos.recheiosBrancos += bacia(qtd, 25);
        if (produto === "BRW 6x6") insumos.recheiosBrancos += bacia(qtd, 35);
        if (produto === "ESC")     insumos.recheiosBrancos += bacia(qtd, 26);
        if (produto === "PKT 5x5") insumos.recheiosBrancos += (qtd * 20) / 1350;
        if (produto === "PKT 6x6") insumos.recheiosBrancos += (qtd * 25) / 1350;
      }

      if (saboresPretos.includes(sabor)) {
        if (produto === "BRW 7x7") insumos.recheiosPretos += bacia(qtd, 25);
        if (produto === "BRW 6x6") insumos.recheiosPretos += bacia(qtd, 35);
        if (produto === "ESC")     insumos.recheiosPretos += bacia(qtd, 26);
        if (produto === "PKT 5x5") insumos.recheiosPretos += (qtd * 20) / 1350;
        if (produto === "PKT 6x6") insumos.recheiosPretos += (qtd * 25) / 1350;
      }

      if (saboresMistos.includes(sabor)) {
        if (produto === "BRW 7x7") insumos.recheiosMistos += bacia(qtd, 25);
        if (produto === "BRW 6x6") insumos.recheiosMistos += bacia(qtd, 35);
        if (produto === "ESC")     insumos.recheiosMistos += bacia(qtd, 26);
        if (produto === "PKT 5x5") insumos.recheiosMistos += (qtd * 20) / 1350;
        if (produto === "PKT 6x6") insumos.recheiosMistos += (qtd * 25) / 1350;
      }
    });
  });

  // RESUMO INSUMOS
  doc.setFont('courier', 'normal');
  doc.setFontSize(10);
  doc.text('--- INSUMOS ---', 10, y); y += 8;
  doc.text(`Margarina: ${insumos.margarina.toFixed(0)}g`, 10, y); y += 6;
  doc.text(`Ovos: ${(insumos.ovos / 60).toFixed(0)} ovos (${insumos.ovos.toFixed(0)}g)`, 10, y); y += 6;
  doc.text(`Massas (Finna 450g): ${insumos.massas.toFixed(0)} un`, 10, y); y += 6;
  doc.text(`Nutella (650g): ${Math.ceil(insumos.nutella)} un`, 10, y); y += 6;
  doc.text(`Recheio branco: ${Math.ceil(insumos.recheiosBrancos)} bacias`, 10, y); y += 6;
  doc.text(`Recheio preto: ${Math.ceil(insumos.recheiosPretos)} bacias`, 10, y); y += 6;
  doc.text(`Recheio misto: ${Math.ceil(insumos.recheiosMistos)} bacias`, 10, y); y += 10;

  // NOVA PÁGINA
  doc.addPage();
  y = 10;

  doc.text('--- EMBALAGENS ---', 10, y); y += 8;
  Object.entries(embalagens).forEach(([codigo, qtd]) => {
    doc.text(`${codigo}: ${Math.ceil(qtd)} un`, 10, y);
    y += 6;
  });

  const agora = new Date();
  const dia = String(agora.getDate()).padStart(2, '0');
  const mes = String(agora.getMonth() + 1).padStart(2, '0');
  const ano = agora.getFullYear();
  const hora = String(agora.getHours()).padStart(2, '0');
  const minuto = String(agora.getMinutes()).padStart(2, '0');
  const nomePDF = `lista-compras-${dia}-${mes}-${ano}-${hora}h${minuto}.pdf`;

  doc.save(nomePDF);
};

  // Fn17 - abrirMenuDadosMestres: simula a abertura de um painel de ajustes
const abrirMenuDadosMestres = () => {
  alert(
    '🛠️ Menu de Dados Mestres\n\nAjustes de cidades, escolas e produtos ainda não implementados com interface gráfica.\nFuturamente: adicionar, editar e suspender pontos de venda.'
  );
};

// Fn18 - alterarDadosMestres: atualiza um documento de uma coleção no Firestore
const alterarDadosMestres = async (colecao, idDoc, novosDados) => {
  try {
    const ref = doc(db, colecao, idDoc);
    await updateDoc(ref, novosDados);
    alert('✅ Dados atualizados com sucesso!');
  } catch (error) {
    console.error('Erro ao atualizar dados:', error);
    alert('❌ Erro ao atualizar dados.');
  }
};

// Fn19 - suspenderOuDeletarPontoDeVenda: permite suspender, reativar ou deletar
const suspenderOuDeletarPontoDeVenda = async (colecao, idDoc, acao = 'suspender') => {
  try {
    const ref = doc(db, colecao, idDoc);

    if (acao === 'suspender') {
      await updateDoc(ref, { ativo: false });
      alert('⏸️ Ponto de venda suspenso.');
    } else if (acao === 'reativar') {
      await updateDoc(ref, { ativo: true });
      alert('✅ Ponto de venda reativado.');
    } else if (acao === 'deletar') {
      await deleteDoc(ref);
      alert('🗑️ Ponto de venda deletado.');
    }
  } catch (error) {
    console.error('Erro na operação:', error);
    alert('❌ Falha na operação.');
  }
};

// Fn20 - gerarNumeradorProducao: consulta o último número de produção no Firestore
const gerarNumeradorProducao = async () => {
  const agora = new Date();
  const ano = agora.getFullYear();
  const mes = String(agora.getMonth() + 1).padStart(2, '0');
  const anoMes = `${ano}-${mes}`;

  try {
    const ref = doc(db, "configs", "producao");
    const docSnap = await getDoc(ref);

    let numeroAtual = 0;
    let dataAtual = anoMes;

    if (docSnap.exists()) {
      const dados = docSnap.data();
      if (dados.anoMes === anoMes) {
        numeroAtual = dados.numero || 0;
      }
    }

    const novoNumero = numeroAtual + 1;
    await setDoc(ref, { anoMes: dataAtual, numero: novoNumero });
    return `${String(novoNumero).padStart(3, '0')}/${ano}`;
  } catch (e) {
    console.error("Erro ao gerar numerador:", e);
    return `000/${ano}`;
  }
};

  // Fn21 - limparFormulario: limpa os campos após salvar pedido
const limparFormulario = () => {
  setCidade('');
  setEscola('');
  setProduto('');
  setSabor('');
  setQuantidade(1);
  setItens([]);
};

// Fn22 - gerarResumoInsumos: calcula totais gerais e insumos (auxiliar interno)
const gerarResumoInsumos = () => {
  const total = itens.reduce((acc, item) => acc + item.quantidade, 0);
  return `Total de itens: ${total}`;
};

// Fn23 - gerarListaCompras: gera o PDF da lista de compras com insumos e embalagens
const gerarListaCompras = () => {
  const doc = new jsPDF();
  let y = 10;

  doc.setFont('courier', 'normal');
  doc.setFontSize(10);
  doc.text('Lista de Compras - Dudunitê', 10, y);
  y += 10;

  // Dados simulados — deve ser substituído pelo cálculo real
  const listaInsumos = [
    ['Margarina', '2280g'],
    ['Ovos', '95 unidades'],
    ['Massas', '120 un (Finna 450g)'],
    ['Bacias recheio branco', '12'],
    ['Bacias recheio preto', '7'],
    ['Nutella', '3 potes'],
  ];

  const listaEmbalagens = [
    ['G650 (7x7)', '60'],
    ['G640 (6x6)', '80'],
    ['SQ5x5', '50'],
    ['SQ6x6', '45'],
    ['D135 (Escondidinho)', '30'],
    ['EtiqBrw', '185'],
    ['EtiqDD', '20'],
    ['EtiqEsc', '15']
  ];

  doc.text('--- INSUMOS ---', 10, y); y += 8;
  listaInsumos.forEach(([insumo, qtd]) => {
    doc.text(`${insumo}: ${qtd}`, 10, y);
    y += 6;
  });

  doc.addPage();
  y = 10;
  doc.text('--- EMBALAGENS ---', 10, y); y += 8;
  listaEmbalagens.forEach(([emb, qtd]) => {
    doc.text(`${emb}: ${qtd}`, 10, y);
    y += 6;
  });

  const agora = new Date();
  const dia = String(agora.getDate()).padStart(2, '0');
  const mes = String(agora.getMonth() + 1).padStart(2, '0');
  const ano = agora.getFullYear();
  const hora = String(agora.getHours()).padStart(2, '0');
  const minuto = String(agora.getMinutes()).padStart(2, '0');
  const nomePDF = `lista-compras-${dia}-${mes}-${ano}-${hora}h${minuto}.pdf`;

  doc.save(nomePDF);
};

// Fn24 - return (Renderização final)
return (
  <div className="max-w-3xl mx-auto p-4 bg-[#fff5ec] min-h-screen">
    {/* Logomarca no topo */}
    <div className="flex justify-center mb-6">
      <img
        src="/LogomarcaDDnt2025Vazado.png"
        alt="Logomarca Dudunitê"
        style={{ maxWidth: 200 }}
      />
    </div>

    <h1 className="text-2xl font-bold mb-4 text-center text-[#8c3b1b]">📋 Sistema de Pedidos - Dudunitê</h1>

    {/* Campos do formulário */}
    <div className="grid grid-cols-2 gap-4">
      <div>
        <label>Cidade</label>
        <select className="w-full border p-1" value={cidade} onChange={e => { setCidade(e.target.value); setEscola(''); }}>
          <option value="">Selecione</option>
          {Object.keys(dados).map(c => <option key={c}>{c}</option>)}
        </select>
      </div>

      <div>
        <label>Escola</label>
        <select className="w-full border p-1" value={escola} onChange={e => setEscola(e.target.value)} disabled={!cidade}>
          <option value="">Selecione</option>
          {cidade && dados[cidade].map(e => <option key={e}>{e}</option>)}
        </select>
      </div>

      <div>
        <label>Produto</label>
        <select className="w-full border p-1" value={produto} onChange={e => { setProduto(e.target.value); setSabor(''); }}>
          <option value="">Selecione</option>
          {Object.keys(produtos).map(p => <option key={p}>{p}</option>)}
        </select>
      </div>

      <div>
        <label>Sabor</label>
        <select className="w-full border p-1" value={sabor} onChange={e => setSabor(e.target.value)} disabled={!produto}>
          <option value="">Selecione</option>
          {produto && produtos[produto].map(s => <option key={s}>{s}</option>)}
        </select>
      </div>

      <div>
        <label>Quantidade</label>
        <input
          type="number"
          min="1"
          className="w-full border p-1"
          value={quantidade}
          onChange={e => setQuantidade(e.target.value)}
        />
      </div>

      <div className="flex items-end">
        <button
          onClick={() => adicionarItem(produto, sabor, quantidade)}
          className="bg-[#a84d2a] text-white px-4 py-2 rounded w-full"
        >
          + Adicionar
        </button>
      </div>
    </div>

    {/* Lista de itens */}
    <div className="mt-4">
      <h2 className="font-bold">
        Itens do Pedido ({itens.length} itens):
      </h2>
      <ul className="list-disc pl-5 text-sm">
        {itens.map((item, i) => (
          <li key={i}>
            {item.produto} - {item.sabor} - {item.quantidade} un
          </li>
        ))}
      </ul>
    </div>

    {/* Botões principais */}
    <div className="mt-4 flex gap-4 flex-wrap">
      <button
        onClick={salvarPedido}
        className="bg-blue-600 text-white px-4 py-2 rounded"
      >
        💾 Salvar Pedido
      </button>
      <button
        onClick={gerarPDF}
        className="bg-purple-600 text-white px-4 py-2 rounded"
      >
        📄 Gerar PDF Produção
      </button>
      <button
        onClick={gerarListaCompras}
        className="bg-green-700 text-white px-4 py-2 rounded"
      >
        🛒 Lista de Compras
      </button>
      <button
        onClick={abrirMenuDadosMestres}
        className="bg-yellow-600 text-white px-4 py-2 rounded"
      >
        ⚙️ Dados Mestres
      </button>
    </div>

    {/* Filtro de data (em breve refinado) */}
    <div className="mt-6">
      <h2 className="font-bold text-lg">📆 Filtro de Datas</h2>
      <div className="flex gap-4 mt-2">
        <input
          type="date"
          value={dataInicio}
          onChange={e => setDataInicio(e.target.value)}
          className="border p-1"
        />
        <input
          type="date"
          value={dataFim}
          onChange={e => setDataFim(e.target.value)}
          className="border p-1"
        />
        <button
          onClick={() => carregarPedidos()}
          className="bg-slate-700 text-white px-4 py-1 rounded"
        >
          🔍 Buscar
        </button>
      </div>
    </div>

    {/* Lista de pedidos (resumida) */}
    <div className="mt-6">
      <h3 className="font-bold">📋 Pedidos encontrados:</h3>
      <ul className="text-sm list-disc pl-5">
        {pedidos.map((p, i) => (
          <li key={i}>
            📌 {p.cidade} - {p.escola} ({p.itens.length} itens)
          </li>
        ))}
      </ul>
    </div>
  </div>
);
  </div> // ← Fecha o container principal
);        // ← Fecha o return

} // ← Fecha a função App

export default App;

// === INÍCIO FN01 – Importações e Constantes Globais ===
import React, { useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { collection, addDoc, getDocs, serverTimestamp } from 'firebase/firestore';
import db from './firebase';

const App = () => {
  // === Estados Globais ===
  const [cidade, setCidade] = useState('');
  const [escola, setEscola] = useState('');
  const [produto, setProduto] = useState('');
  const [sabor, setSabor] = useState('');
  const [quantidade, setQuantidade] = useState('');
  const [itens, setItens] = useState([]);
  const [pedidos, setPedidos] = useState([]);
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [mostrarDadosMestres, setMostrarDadosMestres] = useState(false);
// === FIM FN01 ===

  // === INÍCIO FN02 – gerarPDF (gera relatório de pedidos em PDF) ===
const gerarPDF = () => {
  const doc = new jsPDF();
  doc.text(`Relatório de Pedidos – ${cidade}`, 10, 10);

  const dadosTabela = itens.map((item, index) => [
    index + 1,
    item.produto,
    item.sabor,
    item.quantidade,
  ]);

  doc.autoTable({
    head: [['#', 'Produto', 'Sabor', 'Quantidade']],
    body: dadosTabela,
    startY: 20,
  });

  doc.save(`Pedidos_${cidade}_${new Date().toISOString().slice(0, 10)}.pdf`);
};
// === FIM FN02 ===


// === INÍCIO FN03 – obterProdutosDisponiveis (dados fixos no código) ===
const obterProdutosDisponiveis = () => [
  'BRW 6x6',
  'BRW 7x7',
  'PKT 5x5',
  'PKT 6x6',
  'Esc',
  'Dudu'
];
// === FIM FN03 ===


// === INÍCIO FN04 – obterSaboresPorProduto (com base no tipo e nome do produto) ===
const obterSaboresPorProduto = (produtoSelecionado) => {
  const saboresBrancos = [
    'Ninho',
    'Ninho com Nutella',
    'Oreo',
    'Ovomaltine',
    'Beijinho',
    'Brigadeiro branco',
    'Brigadeiro branco c confete',
    'Bem casado',
    'Paçoca',
    'Kitkat',
  ];

  const saboresPretos = [
    'Brigadeiro preto',
    'Brigadeiro preto c confete',
    'Palha italiana',
    'Bem casado',
  ];

  const saboresDudu = [
    'Dd Oreo',
    'Dd Ovomaltine',
    'Dd Ninho com Nutella',
    'Dd Creme de Maracujá',
    'Dd Kitkat'
  ];

  if (produtoSelecionado === 'Dudu') return saboresDudu;
  return [...new Set([...saboresBrancos, ...saboresPretos])];
};
// === FIM FN04 ===

  // === INÍCIO FN05 – obterCidadesDisponiveis (lista fixa de cidades permitidas) ===
const obterCidadesDisponiveis = () => [
  'Gravatá',
  'Recife',
  'Caruaru'
];
// === FIM FN05 ===


// === INÍCIO FN06 – obterEscolasPorCidade (mapeamento direto por cidade) ===
const obterEscolasPorCidade = (cidadeSelecionada) => {
  const escolas = {
    'Gravatá': [
      'Pequeno Príncipe',
      'Salesianas',
      'Céu Azul',
      'Russas',
      'Bora Gastar',
      'Kaduh',
      'Society Show',
      'Degusty'
    ],
    'Recife': [
      'Tio Valter',
      'Vera Cruz',
      'Pinheiros',
      'Dourado',
      'BMQ',
      'CFC',
      'Madre de Deus',
      'Saber Viver'
    ],
    'Caruaru': [
      'Interativo',
      'Exato Sede',
      'Exato Anexo',
      'Sesi',
      'Motivo',
      'Jesus Salvador'
    ]
  };

  return escolas[cidadeSelecionada] || [];
};
// === FIM FN06 ===


// === INÍCIO FN07 – adicionarItem (validação e inclusão do item na lista) ===
const adicionarItem = () => {
  if (!produto || !sabor || !quantidade || quantidade <= 0) {
    alert("Preencha todos os campos corretamente.");
    return;
  }

  const novoItem = {
    produto,
    sabor,
    quantidade,
  };

  setItens([...itens, novoItem]);
  setProduto('');
  setSabor('');
  setQuantidade('');
};
// === FIM FN07 ===

  // === INÍCIO FN08 – obterProdutosDisponiveis (lista fixa de tipos de produtos) ===
const obterProdutosDisponiveis = () => [
  'BRW 7x7',
  'BRW 6x6',
  'PKT 5x5',
  'PKT 6x6',
  'Dudu',
  'Esc'
];
// === FIM FN08 ===


// === INÍCIO FN09 – obterSaboresPorProduto (com exceção dos Dudus que têm sabores próprios) ===
const obterSaboresPorProduto = (produtoSelecionado) => {
  if (produtoSelecionado === 'Dudu') {
    return [
      'Dd Oreo',
      'Dd Ovomaltine',
      'Dd Ninho com Nutella',
      'Dd Creme de Maracujá',
      'Dd KitKat'
    ];
  }

  return [
    'Ninho',
    'Ninho com Nutella',
    'Oreo',
    'Ovomaltine',
    'Beijinho',
    'Brigadeiro branco',
    'Brigadeiro branco com confete',
    'Bem casado',
    'Paçoca',
    'KitKat',
    'Brigadeiro preto',
    'Brigadeiro preto com confete',
    'Palha italiana'
  ];
};
// === FIM FN09 ===


// === INÍCIO FN10 – obterRecheioPorSabor (retorna branco, preto ou misto conforme o sabor) ===
const obterRecheioPorSabor = (sabor) => {
  const recheioBranco = [
    'Ninho',
    'Ninho com Nutella',
    'Oreo',
    'Ovomaltine',
    'Beijinho',
    'Brigadeiro branco',
    'Brigadeiro branco com confete',
    'Paçoca',
    'KitKat'
  ];

  const recheioPreto = [
    'Brigadeiro preto',
    'Brigadeiro preto com confete',
    'Palha italiana'
  ];

  if (sabor === 'Bem casado') return 'misto';
  if (recheioBranco.includes(sabor)) return 'branco';
  if (recheioPreto.includes(sabor)) return 'preto';
  return null;
};
// === FIM FN10 ===


// === INÍCIO FN11 – obterQuantidadePorTabuleiro (retorna rendimento por tipo de produto) ===
const obterQuantidadePorTabuleiro = (produto) => {
  switch (produto) {
    case 'BRW 7x7': return 12;
    case 'BRW 6x6': return 17;
    case 'PKT 5x5': return 20;
    case 'PKT 6x6': return 15;
    case 'Esc': return 26;
    default: return 0;
  }
};
// === FIM FN11 ===

  // === INÍCIO FN12 – formatarData (DD/MM/AAAA a partir de objeto Date ou ISO) ===
const formatarData = (dataInput) => {
  if (!dataInput) return '';
  const data = new Date(dataInput);
  const dia = String(data.getDate()).padStart(2, '0');
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  const ano = data.getFullYear();
  return `${dia}/${mes}/${ano}`;
};
// === FIM FN12 ===


// === INÍCIO FN13 – toggleMostrarDadosMestres (exibe ou oculta painel de Dados Mestres) ===
const toggleMostrarDadosMestres = () => {
  setMostrarDadosMestres((prev) => !prev);
};
// === FIM FN13 ===


// === INÍCIO FN14 – inicializarDatasFiltro (define datas padrão para filtros caso estejam vazias) ===
const inicializarDatasFiltro = () => {
  if (!dataInicio) setDataInicio('01/01/1900');
  if (!dataFim) setDataFim('31/12/2050');
};
// === FIM FN14 ===

  // === INÍCIO FN15 – filtrarPedidosPorData (fallback se datas não preenchidas) ===
const filtrarPedidosPorData = () => {
  let inicio = new Date('1900-01-01T00:00:00');
  let fim = new Date('2050-12-31T23:59:59');

  if (dataInicio) {
    const [dia, mes, ano] = dataInicio.split('/');
    inicio = new Date(`${ano}-${mes}-${dia}T00:00:00`);
  }

  if (dataFim) {
    const [dia, mes, ano] = dataFim.split('/');
    fim = new Date(`${ano}-${mes}-${dia}T23:59:59`);
  }

  const pedidosFiltrados = pedidos.filter((pedido) => {
    const dataPedido = new Date(pedido.data?.seconds * 1000 || pedido.data);
    return dataPedido >= inicio && dataPedido <= fim;
  });

  setPedidosFiltrados(pedidosFiltrados);
};
// === FIM FN15 ===


// === INÍCIO FN16 – carregarPedidos (busca todos os pedidos do Firestore) ===
const carregarPedidos = async () => {
  try {
    const snapshot = await getDocs(collection(db, "pedidos"));
    const lista = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    setPedidos(lista);
    setPedidosFiltrados(lista);
  } catch (error) {
    console.error("Erro ao carregar pedidos:", error);
  }
};
// === FIM FN16 ===


// === INÍCIO FN17 – adicionarItem (validação e inclusão do item na lista) ===
const adicionarItem = () => {
  if (!produto || !sabor || !quantidade || quantidade <= 0) {
    alert("Preencha todos os campos corretamente.");
    return;
  }

  const novoItem = { produto, sabor, quantidade };
  setItens([...itens, novoItem]);
  setProduto('');
  setSabor('');
  setQuantidade('');
};
// === FIM FN17 ===


// === INÍCIO FN18 – totalItens (soma da quantidade atual do pedido) ===
const totalItens = itens.reduce((soma, item) => soma + item.quantidade, 0);
// === FIM FN18 ===

  // === INÍCIO FN19 – salvarPedido (envia pedido completo ao Firestore com validação) ===
const salvarPedido = async () => {
  if (!cidade || !escola || itens.length === 0) {
    alert('Preencha todos os campos antes de salvar.');
    return;
  }

  const novoPedido = {
    cidade,
    escola,
    itens,
    data: serverTimestamp(),
  };

  try {
    await addDoc(collection(db, "pedidos"), novoPedido);
    alert("Pedido salvo com sucesso!");
    setCidade('');
    setEscola('');
    setItens([]);
  } catch (error) {
    console.error("Erro ao salvar pedido:", error);
    alert("Erro ao salvar pedido.");
  }
};
// === FIM FN19 ===


// === INÍCIO FN20 – formatarData (converte ISO em dd/mm/aaaa) ===
const formatarData = (isoString) => {
  if (!isoString) return '';
  const data = new Date(isoString);
  return data.toLocaleDateString('pt-BR');
};
// === FIM FN20 ===


// === INÍCIO FN21 – filtrarPedidosPorData (usa dataInicio e dataFim para filtrar pedidos) ===
const filtrarPedidosPorData = (
  lista = pedidos,
  inicioStr = dataInicio,
  fimStr = dataFim
) => {
  let inicio = new Date('1900-01-01T00:00:00');
  let fim = new Date('2050-12-31T23:59:59');

  if (inicioStr) {
    const [dia, mes, ano] = inicioStr.split('/');
    inicio = new Date(`${ano}-${mes}-${dia}T00:00:00`);
  }

  if (fimStr) {
    const [dia, mes, ano] = fimStr.split('/');
    fim = new Date(`${ano}-${mes}-${dia}T23:59:59`);
  }

  return lista.filter((pedido) => {
    const data = new Date(pedido.data?.seconds * 1000 || pedido.data);
    return data >= inicio && data <= fim;
  });
};
// === FIM FN21 ===


// === INÍCIO FN22 – salvarDadosMestres (grava cidade, escola, produto, sabor) ===
const salvarDadosMestres = async () => {
  const novoItem = {
    cidade,
    escola,
    produto,
    sabor,
  };

  try {
    await addDoc(collection(db, "dadosMestres"), novoItem);
    alert("Dados mestres salvos com sucesso!");
  } catch (error) {
    console.error("Erro ao salvar dados mestres:", error);
    alert("Erro ao salvar dados mestres.");
  }
};
// === FIM FN22 ===

  // === INÍCIO RT99 – Interface Principal do App ===
return (
  <div className="container">
    {/* === INÍCIO RT01 – Seletor de Cidade === */}
    <div>
      <label>Cidade:</label>
      <select value={cidade} onChange={(e) => setCidade(e.target.value)}>
        <option value="">Selecione</option>
        <option value="Gravatá">Gravatá</option>
        <option value="Recife">Recife</option>
        <option value="Caruaru">Caruaru</option>
      </select>
    </div>
    {/* === FIM RT01 === */}

    {/* === INÍCIO RT02 – Seletor de Escola === */}
    <div>
      <label>Escola:</label>
      <select value={escola} onChange={(e) => setEscola(e.target.value)}>
        <option value="">Selecione</option>
        {escolasDisponiveis.map((esc) => (
          <option key={esc} value={esc}>{esc}</option>
        ))}
      </select>
    </div>
    {/* === FIM RT02 === */}

    {/* === INÍCIO RT03 – Seletor de Produto e Sabor === */}
    <div>
      <label>Produto:</label>
      <select value={produto} onChange={(e) => setProduto(e.target.value)}>
        <option value="">Selecione</option>
        {produtosDisponiveis.map((prod) => (
          <option key={prod} value={prod}>{prod}</option>
        ))}
      </select>

      <label>Sabor:</label>
      <select value={sabor} onChange={(e) => setSabor(e.target.value)}>
        <option value="">Selecione</option>
        {saboresDisponiveis.map((sab) => (
          <option key={sab} value={sab}>{sab}</option>
        ))}
      </select>
    </div>
    {/* === FIM RT03 === */}

    {/* === INÍCIO RT04 – Campo de Quantidade e Botão Adicionar === */}
    <div>
      <label>Quantidade:</label>
      <input
        type="number"
        value={quantidade}
        onChange={(e) => setQuantidade(Number(e.target.value))}
        min={1}
      />
      <button onClick={adicionarItem}>Adicionar</button>
    </div>
    {/* === FIM RT04 === */}

    {/* === INÍCIO RT05 – Lista de Itens do Pedido === */}
    <div>
      <h3>Itens:</h3>
      <ul>
        {itens.map((item, index) => (
          <li key={index}>
            {item.produto} - {item.sabor} - {item.quantidade} un
          </li>
        ))}
      </ul>
      <p>Total de itens: {totalItens}</p>
    </div>
    {/* === FIM RT05 === */}

    {/* === INÍCIO RT06 – Botão de Salvar Pedido === */}
    <div>
      <button onClick={salvarPedido}>Salvar Pedido</button>
    </div>
    {/* === FIM RT06 === */}
  </div>
);
// === FIM RT99 ===

// === Fechamento do Componente App ===
};

export default App;

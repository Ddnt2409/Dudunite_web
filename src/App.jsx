// --- BLOCO 1 ---
// Fn01 – Importações Gerais
import React, { useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import { collection, addDoc, getDocs, serverTimestamp, query, where, Timestamp } from "firebase/firestore";
import db from './firebase';

// Fn02 – Logomarca e Cores
const logoPath = "/LogomarcaDDnt2025Vazado.png";
const corPrimaria = "#8c3b1b";  // Terracota escuro
const corFundo = "#fff5ec";     // Terracota claro

// Fn03 – Dados Estáticos
const dados = {
  "Recife": ["Tio Valter", "Vera Cruz", "Pinheiros", "BMQ", "Dourado", "CFC", "Madre de Deus", "Saber Viver", "Anita Garibaldi"],
  "Caruaru": ["Interativo", "Exato 1", "Exato 2", "SESI", "Motivo"],
  "Gravatá": ["Russas", "Salesianas", "Pequeno Príncipe", "Céu Azul"]
};

const saboresPadrao = [
  "Ninho com nutella", "Ninho", "Brig bco", "Brig pto",
  "Brig pto confete", "Brig bco confete", "Oreo", "Ovomaltine",
  "Bem casado", "Palha italiana", "Cr maracujá"
];

const produtos = {
  "BRW 7x7": saboresPadrao,
  "BRW 6x6": saboresPadrao,
  "ESC": saboresPadrao,
  "PKT 5x5": saboresPadrao,
  "PKT 6x6": saboresPadrao,
  "DUDU": saboresPadrao
};
// --- FIM BLOCO 1 ---

// --- BLOCO 2 ---
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

  const carregarPedidos = async () => {
    try {
      const pedidosRef = collection(db, "pedidos");
      let q = pedidosRef;

      if (dataInicio && dataFim) {
        const inicio = Timestamp.fromDate(new Date(`${dataInicio}T00:00:00`));
        const fim = Timestamp.fromDate(new Date(`${dataFim}T23:59:59`));
        q = query(pedidosRef, where("dataServidor", ">=", inicio), where("dataServidor", "<=", fim));
      }

      const snapshot = await getDocs(q);
      const lista = snapshot.docs.map(doc => doc.data());
      setPedidos(lista);
    } catch (e) {
      console.error("Erro ao carregar pedidos:", e);
      alert("❌ Erro ao carregar pedidos. Veja o console.");
    }
  };

  const formatarData = (isoString) => {
    const data = new Date(isoString);
    return data.toLocaleDateString('pt-BR');
  };
// --- FIM BLOCO 2 ---

  // --- BLOCO 3 ---
return (
  <div className="bg-[#FFF3E9] min-h-screen p-4 text-[#5C1D0E]">
    <div className="max-w-xl mx-auto">
      <img src="/logo.png" alt="Dudunitê" className="w-48 mx-auto mb-4" />
      <h1 className="text-center text-xl font-bold mb-6">Lançamento de Pedidos - Dudunitê</h1>

      {/* Filtro por período */}
      <div className="mb-6">
        <label className="font-semibold block mb-1">📆 Período:</label>
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={dataInicio}
            onChange={(e) => setDataInicio(e.target.value)}
            className="p-2 border rounded"
          />
          <span>até</span>
          <input
            type="date"
            value={dataFim}
            onChange={(e) => setDataFim(e.target.value)}
            className="p-2 border rounded"
          />
        </div>
      </div>

      {/* Campos do Pedido */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label>Cidade</label>
          <select value={cidade} onChange={(e) => setCidade(e.target.value)} className="w-full p-2 rounded border">
            <option value="">Selecione</option>
            {Object.keys(dados).map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <div>
          <label>Escola</label>
          <select value={escola} onChange={(e) => setEscola(e.target.value)} className="w-full p-2 rounded border">
            <option value="">Selecione</option>
            {dados[cidade]?.map((e) => (
              <option key={e} value={e}>{e}</option>
            ))}
          </select>
        </div>
        <div>
          <label>Produto</label>
          <select value={produto} onChange={(e) => setProduto(e.target.value)} className="w-full p-2 rounded border">
            <option value="">Selecione</option>
            {Object.keys(produtos).map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>
        <div>
          <label>Sabor</label>
          <select value={sabor} onChange={(e) => setSabor(e.target.value)} className="w-full p-2 rounded border">
            <option value="">Selecione</option>
            {produtos[produto]?.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>
// --- FIM BLOCO 3 ---

      // --- BLOCO 4 ---
  // Carrega pedidos ao selecionar intervalo
  useEffect(() => {
    if (dataInicio && dataFim) {
      carregarPedidos();
    }
  }, [dataInicio, dataFim]);

  // Carrega todos os pedidos no carregamento inicial
  useEffect(() => {
    if (!dataInicio && !dataFim) {
      carregarPedidos();
    }
  }, []);

  const irParaDadosMestres = () => {
    alert("⚙️ Em breve: Tela de Dados Mestres.");
  };
// --- FIM BLOCO 4 ---

      // --- BLOCO 5 ---
// Fn09 – adicionarItem: adiciona item ao pedido com validação
const adicionarItem = () => {
  if (!produto || !sabor || !quantidade || quantidade <= 0) {
    alert("Preencha todos os campos corretamente.");
    return;
  }
  setItens([...itens, { produto, sabor, quantidade: Number(quantidade) }]);
  setSabor('');
  setQuantidade(1);
};

// Fn10 – salvarPedido: envia pedido ao Firestore com validações
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

// Fn11 – totalItens: totaliza a quantidade atual do pedido em andamento
const totalItens = itens.reduce((soma, item) => soma + item.quantidade, 0);

// Fn12 – insumos e embalagens: base usada no resumo e no PDF
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
// --- FIM BLOCO 5 ---

    // --- BLOCO 6 ---
// Fn13 – gerarPDF: gera o planejamento de produção por cidade, escola, produto e sabor
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

  // Continuação no próximo bloco...
};
// --- FIM BLOCO 6 ---

    // --- BLOCO 7 ---
// Continuação da Fn13 – gerarPDF

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

      if (sabor === "Bem casado") {
        const metade = qtd / 2;
        if (produto === "BRW 7x7") {
          baciasBranco += bacia(metade, 25);
          baciasPreto  += bacia(metade, 25);
        }
        if (produto === "BRW 6x6") {
          baciasBranco += bacia(metade, 35);
          baciasPreto  += bacia(metade, 35);
        }
        if (produto === "ESC") {
          baciasBranco += bacia(metade, 26);
          baciasPreto  += bacia(metade, 26);
        }
        if (produto === "PKT 5x5") {
          baciasBranco += (metade * 20) / 1350;
          baciasPreto  += (metade * 20) / 1350;
        }
        if (produto === "PKT 6x6") {
          baciasBranco += (metade * 30) / 1350;
          baciasPreto  += (metade * 30) / 1350;
        }
      }
    });
  });

  addLine(`🥛 Bacias de recheio branco: ${Math.ceil(baciasBranco)} un`);
  addLine(`🍫 Bacias de recheio preto: ${Math.ceil(baciasPreto)} un`);

  addLine(`-----------------------------`);
  addLine(`📄 Gerado em ${dia}/${mes}/${ano} às ${hora}h${minuto}`);

  doc.save(nomePDF);
};
// --- FIM BLOCO 7 ---

    // --- BLOCO 8 ---
// Fn14 – gerarListaCompras: gera PDF com insumos e embalagens usando pedidos filtrados
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
    nutella: 0
  };

  const embalagens = {
    G650: 0, G640: 0, SQ5x5: 0, SQ6x6: 0, D135: 0,
    SQ30x5: 0, SQ22x6: 0,
    EtiqBrw: 0, EtiqEsc: 0, EtiqDD: 0
  };

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
        embalagens.SQ30x5 += qtd * 2;
        embalagens.SQ22x6 += qtd * 2;
        embalagens.EtiqDD += qtd;
      }

      if (sabor === "Ninho com nutella") {
        if (produto === "BRW 7x7") insumos.nutella += qtd / 60;
        if (produto === "BRW 6x6") insumos.nutella += qtd / 85;
        if (produto === "ESC")     insumos.nutella += qtd / 70;
        if (produto === "DUDU")    insumos.nutella += qtd / 100;
      }
    });
  });

  // RESUMO DE INSUMOS
  doc.text('--- INSUMOS ---', 10, y); y += 8;
  doc.text(`Margarina: ${insumos.margarina.toFixed(0)}g`, 10, y); y += 6;
  doc.text(`Ovos: ${(insumos.ovos / 60).toFixed(0)} un`, 10, y); y += 6;
  doc.text(`Massas (450g): ${insumos.massas.toFixed(0)} un`, 10, y); y += 6;
  doc.text(`Nutella (650g): ${Math.ceil(insumos.nutella)} un`, 10, y); y += 10;

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
// --- FIM BLOCO 8 ---

    // --- BLOCO 9 ---
// Fn15 – filtrarPedidosPorData
const filtrarPedidosPorData = () => {
  if (!dataInicio || !dataFim) return pedidos;
  const inicio = new Date(dataInicio + 'T00:00:00');
  const fim = new Date(dataFim + 'T23:59:59');
  return pedidos.filter(p => {
    const d = new Date(p.data);
    return d >= inicio && d <= fim;
  });
};

// Fn16 – Estados e função para filtro por data única
const [dataFiltro, setDataFiltro] = useState('');
const [pedidosFiltrados, setPedidosFiltrados] = useState([]);
const [mostrarPedidos, setMostrarPedidos] = useState(false);

const filtrarPorData = async () => {
  if (!dataFiltro) return;
  const dataSelecionada = new Date(dataFiltro);
  const dia = dataSelecionada.getDate();
  const mes = dataSelecionada.getMonth() + 1;
  const ano = dataSelecionada.getFullYear();

  const dataInicio = Timestamp.fromDate(new Date(`${ano}-${mes}-${dia} 00:00:00`));
  const dataFim = Timestamp.fromDate(new Date(`${ano}-${mes}-${dia} 23:59:59`));

  const q = query(
    collection(db, 'pedidos'),
    where('dataRegistro', '>=', dataInicio),
    where('dataRegistro', '<=', dataFim)
  );

  const querySnapshot = await getDocs(q);
  const lista = [];

  querySnapshot.forEach((doc) => {
    const data = doc.data();
    lista.push({ id: doc.id, ...data });
  });

  setPedidosFiltrados(lista);
  setMostrarPedidos(true);
};
// --- FIM BLOCO 9 ---

      // --- BLOCO 10 ---
// Fn17 – useEffect para carregar pedidos conforme o período
useEffect(() => {
  if (dataInicio && dataFim) {
    carregarPedidos();
  }
}, [dataInicio, dataFim]);

// Fn18 – Renderização do componente
return (
  <div className="p-4 text-sm font-sans relative">
    {/* ✅ Botão Dados Mestres no topo direito */}
    <button
      onClick={toggleDadosMestres}
      className="absolute right-4 top-4 bg-zinc-800 text-white px-3 py-1 rounded hover:bg-zinc-700"
    >
      Dados Mestres
    </button>

    <h1 className="text-xl font-bold mb-4 text-center text-[#a3492c]">Dudunitê – Sistema de Produção</h1>

    {/* ✅ Filtro por Data - Antes dos botões */}
    <div className="flex flex-col md:flex-row md:items-center gap-2 justify-center mb-6">
      <select
        value={filtroDia}
        onChange={(e) => setFiltroDia(e.target.value)}
        className="border rounded px-2 py-1"
      >
        <option value="">Dia</option>
        {dias.map((dia) => (
          <option key={dia} value={dia}>{dia}</option>
        ))}
      </select>

      <select
        value={filtroMes}
        onChange={(e) => setFiltroMes(e.target.value)}
        className="border rounded px-2 py-1"
      >
        <option value="">Mês</option>
        {meses.map((mes) => (
          <option key={mes} value={mes}>{mes}</option>
        ))}
      </select>

      <button
        onClick={filtrarPedidosPorData}
        className="bg-[#a3492c] text-white px-3 py-1 rounded hover:bg-[#802f16]"
      >
        Filtrar
      </button>
    </div>

    {/* ✅ Botões principais */}
    <div className="flex flex-wrap justify-center gap-4 mb-6">
      <button
        onClick={gerarPlanejamento}
        className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
      >
        📋 Planejamento de Produção
      </button>
      <button
        onClick={gerarListaCompras}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        🧾 Gerar Lista de Compras
      </button>
    </div>

    {/* ✅ Lista de pedidos filtrados */}
    <h2 className="text-lg font-semibold mb-2 text-[#a3492c]">Pedidos Filtrados:</h2>
    {pedidosFiltrados.length > 0 ? (
      <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {pedidosFiltrados.map((pedido, index) => (
          <li key={index} className="bg-white rounded-lg shadow p-3">
            <p><strong>Escola:</strong> {pedido.escola}</p>
            <p><strong>Produto:</strong> {pedido.produto}</p>
            <p><strong>Quantidade:</strong> {pedido.quantidade}</p>
            <p><strong>Sabor:</strong> {pedido.sabor}</p>
            <p><strong>Data:</strong> {pedido.data}</p>
          </li>
        ))}
      </ul>
    ) : (
      <p className="text-gray-500">Nenhum pedido encontrado para os filtros selecionados.</p>
    )}

    {/* ✅ Área Dados Mestres */}
    {mostrarDadosMestres && (
      <div className="fixed bottom-4 right-4 bg-white border border-zinc-300 rounded p-4 shadow-lg z-50 max-w-[90vw] md:max-w-md">
        <h2 className="text-lg font-semibold mb-2 text-[#a3492c]">Alterar Dados Mestres</h2>

        <div className="mb-2">
          <input
            type="text"
            placeholder="Nova Escola"
            value={novaEscola}
            onChange={(e) => setNovaEscola(e.target.value)}
            className="border rounded px-2 py-1 w-full mb-1"
          />
          <button onClick={adicionarEscola} className="bg-zinc-800 text-white px-2 py-1 rounded text-xs">Adicionar Escola</button>
        </div>

        <div className="mb-2">
          <input
            type="text"
            placeholder="Novo Produto"
            value={novoProduto}
            onChange={(e) => setNovoProduto(e.target.value)}
            className="border rounded px-2 py-1 w-full mb-1"
          />
          <button onClick={adicionarProduto} className="bg-zinc-800 text-white px-2 py-1 rounded text-xs">Adicionar Produto</button>
        </div>

        <div className="mb-2">
          <input
            type="text"
            placeholder="Novo Sabor"
            value={novoSabor}
            onChange={(e) => setNovoSabor(e.target.value)}
            className="border rounded px-2 py-1 w-full mb-1"
          />
          <button onClick={adicionarSabor} className="bg-zinc-800 text-white px-2 py-1 rounded text-xs">Adicionar Sabor</button>
        </div>

        <button
          onClick={toggleDadosMestres}
          className="mt-2 bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
        >
          Fechar
        </button>
      </div>
    )}
  </div>
);
      };

export default App;

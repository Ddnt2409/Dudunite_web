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
// Fn04 + Fn05 – Abertura do componente e estados iniciais
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

// Fn06 – useEffect: carregar pedidos automaticamente na abertura
useEffect(() => {
  carregarPedidos();
}, []);

  // Fn07 – carregarPedidos: busca pedidos do Firestore (com ou sem filtro)
// Fn07 – carregarPedidos: busca pedidos do Firestore (com ou sem filtro)
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

  // Fn08 – formatarData: converte ISO para DD/MM/YYYY
  const formatarData = (isoString) => {
    const data = new Date(isoString);
    return data.toLocaleDateString('pt-BR');
  };
// --- FIM BLOCO 2 ---

  // --- BLOCO 3 ---
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
// --- FIM BLOCO 3 ---

  // --- BLOCO 4 ---
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
// --- FIM BLOCO 4 ---

  // --- BLOCO 5 ---
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
// --- FIM BLOCO 5 ---

// --- BLOCO 6 ---
// Fn16 – gerarListaCompras: gera PDF com insumos e embalagens usando pedidos filtrados
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

// Fn17 – filtrarPedidosPorData
const filtrarPedidosPorData = () => {
  if (!dataInicio || !dataFim) return pedidos;
  const inicio = new Date(dataInicio + 'T00:00:00');
  const fim = new Date(dataFim + 'T23:59:59');
  return pedidos.filter(p => {
    const d = new Date(p.data);
    return d >= inicio && d <= fim;
  });
};
// --- FIM BLOCO 6 ---

// FN18 – Filtrar pedidos por data
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

// return (...)
return (
  <div className="bg-[#FFF3E9] min-h-screen p-4 text-[#5C1D0E]">
    <div className="max-w-xl mx-auto">
      <img src="/logo.png" alt="Dudunitê" className="w-48 mx-auto mb-4" />

      <h1 className="text-center text-xl font-bold mb-6">Lançamento de Pedidos - Dudunitê</h1>

      {/* Filtro por data - AGORA NO TOPO */}
      <div className="mb-4">
        <label className="font-semibold block mb-1 flex items-center gap-1">
          <span role="img" aria-label="calendário">📅</span> Filtrar pedidos por data
        </label>
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={dataFiltro}
            onChange={(e) => setDataFiltro(e.target.value)}
            className="flex-1 border rounded p-2"
          />
          <button onClick={filtrarPorData} className="bg-[#A54C25] text-white px-4 py-2 rounded">
            Filtrar
          </button>
        </div>
      </div>

      {/* Campos do Pedido */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label>Cidade</label>
          <select value={cidade} onChange={(e) => setCidade(e.target.value)} className="w-full p-2 rounded border">
            <option>Selecione</option>
            {/* Cidades */}
          </select>
        </div>
        <div>
          <label>Escola</label>
          <select value={escola} onChange={(e) => setEscola(e.target.value)} className="w-full p-2 rounded border">
            <option>Selecione</option>
            {/* Escolas */}
          </select>
        </div>
        <div>
          <label>Produto</label>
          <select value={produto} onChange={(e) => setProduto(e.target.value)} className="w-full p-2 rounded border">
            <option>Selecione</option>
            {/* Produtos */}
          </select>
        </div>
        <div>
          <label>Sabor</label>
          <select value={sabor} onChange={(e) => setSabor(e.target.value)} className="w-full p-2 rounded border">
            <option>Selecione</option>
            {/* Sabores */}
          </select>
        </div>
      </div>

      {/* Quantidade e Adicionar */}
      <div className="flex items-center gap-2 mb-4">
        <input
          type="number"
          value={quantidade}
          onChange={(e) => setQuantidade(e.target.value)}
          className="w-24 p-2 border rounded"
        />
        <button onClick={adicionarItem} className="bg-[#A54C25] text-white px-4 py-2 rounded">
          + Adicionar
        </button>
      </div>

      {/* Itens adicionados */}
      <div className="mb-4">
        <strong>Itens do Pedido (Total: {itens.length} un):</strong>
        <ul className="text-sm text-gray-600">
          {itens.length === 0 ? (
            <li>Nenhum item adicionado.</li>
          ) : (
            itens.map((item, index) => (
              <li key={index}>
                {item.produto} - {item.sabor} - {item.quantidade} un
              </li>
            ))
          )}
        </ul>
      </div>

      {/* Botões principais */}
      <div className="flex flex-col gap-3 mb-6">
        <button onClick={salvarPedido} className="bg-blue-600 text-white py-2 rounded flex items-center justify-center gap-2">
          <span role="img" aria-label="disquete">💾</span> Salvar Pedido
        </button>
        <button onClick={gerarPDF} className="bg-purple-600 text-white py-2 rounded">
          Gerar PDF Produção
        </button>
        <button onClick={gerarListaCompras} className="bg-green-700 text-white py-2 rounded">
          Lista de Compras
        </button>
      </div>

      {/* Lista de pedidos filtrados */}
      {mostrarPedidos && (
        <div className="mb-6">
          <h2 className="text-md font-bold flex items-center gap-1 mb-2">
            📋 Pedidos filtrados:
          </h2>
          <ul className="text-sm">
            {pedidosFiltrados.length === 0 ? (
              <li>Nenhum pedido encontrado para essa data.</li>
            ) : (
              pedidosFiltrados.map((pedido, index) => (
                <li key={index}>
                  📌 {pedido.cidade} - {pedido.escola} ({pedido.itens.length} itens)
                </li>
              ))
            )}
          </ul>
        </div>
      )}

      {/* Botão Dados Mestres – PERTO DO RODAPÉ */}
      <div className="text-center mt-12 mb-4">
        <button onClick={irParaDadosMestres} className="bg-gray-300 text-gray-800 px-6 py-2 rounded text-sm">
          ⚙️ Dados Mestres
        </button>
      </div>
    </div>
  </div>
);




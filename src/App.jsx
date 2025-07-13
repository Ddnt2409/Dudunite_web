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

// ✅ FN05 – fn05_filtrarPedidos: filtra pedidos por data com segurança
function fn05_filtrarPedidos(pedidos, dataInicio, dataFim) {
  if (!Array.isArray(pedidos)) return [];

  const parseData = (data, isInicio) => {
    if (!data) return isInicio ? new Date(0) : new Date(8640000000000000);
    const parsed = new Date(data);
    if (isNaN(parsed)) return isInicio ? new Date(0) : new Date(8640000000000000);
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
// ✅ FN05 – FIM
  
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
// ✅ FN14 – gerarPDF: gera o planejamento de produção com filtro aplicado no momento do clique
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

  // 🔍 Filtro reaplicado no momento do clique
  const pedidosFiltradosAtualizados = fn05_filtrarPedidos(pedidos, dataInicio, dataFim);

  const agrupado = {};
  const totalPorCidade = {};
  const totalGeral = {};

  pedidosFiltradosAtualizados.forEach(({ cidade, escola, itens }) => {
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

  const resumoFinal = {};

  Object.entries(totalGeral).forEach(([produto, quantidade]) => {
    if (!resumoFinal[produto]) resumoFinal[produto] = 0;
    resumoFinal[produto] += quantidade;
  });

  addLine('\n-----------------------------');
  addLine(`📌 PRODUTOS POR TIPO:`);
  Object.entries(resumoFinal).forEach(([produto, qtd]) => {
    addLine(` ${produto}: ${qtd} un`);
  });

  doc.save(nomePDF);
};
// ✅ FN14 – FIM
// Bloco 9 – Funções auxiliares: filtros, dados mestres, toggle
// ✅ FN15 – gerarListaCompras: gera PDF com insumos e embalagens
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
// ✅ FN15 – FIM
// ✅ FN16 – filtrarPedidosPorData: filtra pedidos com base no timestamp correto
const filtrarPedidosPorData = () => {
  return pedidos.filter((p) => {
    if (!p.timestamp || typeof p.timestamp.toDate !== 'function') return false;

    const dataPedido = p.timestamp.toDate();

    return (
      (!dataInicio || dataPedido >= new Date(`${dataInicio}T00:00:00`)) &&
      (!dataFim || dataPedido <= new Date(`${dataFim}T23:59:59`))
    );
  });
};
// ✅ FN16 – FIM
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

// Fn18 – toggleMostrarDadosMestres: mostra ou oculta o bloco de dados mestres
const toggleMostrarDadosMestres = () => {
  setMostrarDadosMestres(!mostrarDadosMestres);
};
  // ... seus useState, useEffect etc.

  // ✅ FN00 - Tratamento de erro global (exibe erro no celular)
  if (!Array.isArray(pedidos)) {
    return <div style={{ padding: 20, color: 'red' }}>Erro: pedidos não é uma lista válida.</div>;
  }

  if (pedidos.length > 0 && !pedidos[0].timestamp) {
    return <div style={{ padding: 20, color: 'red' }}>Erro: campo 'timestamp' ausente nos pedidos.</div>;
  }

  if (typeof fn05_filtrarPedidos !== 'function') {
    return <div style={{ padding: 20, color: 'red' }}>Erro: função FN05 não está carregada.</div>;
  }

  // 👇 abaixo disso, seu return normal//
return (
  <div className="bg-[#FFF3E9] min-h-screen p-4 text-sm font-sans text-[#5C1D0E]">
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

      <div className="mb-4">
        <label>Quantidade</label>
        <input
          type="number"
          min="1"
          value={quantidade}
          onChange={(e) => setQuantidade(Number(e.target.value))}
          className="w-full p-2 rounded border"
        />
      </div>

      <button
        onClick={adicionarItem}
        className="bg-[#8c3b1b] text-white px-4 py-2 rounded hover:bg-[#6f2d11] w-full mb-4"
      >
        ➕ Adicionar Item
      </button>

      {/* Lista de Itens adicionados */}
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

      <button
        onClick={salvarPedido}
        className="bg-green-700 text-white px-4 py-2 rounded hover:bg-green-800 w-full mb-4"
      >
        💾 Salvar Pedido
      </button>

      {/* Botões de Ação */}
      <div className="flex flex-wrap justify-center gap-4 mt-6 mb-6">
        <button
          onClick={gerarPDF}
          className="bg-purple-700 text-white px-4 py-2 rounded hover:bg-purple-800"
        >
          📋 Planejamento de Produção
        </button>
        <button
          onClick={gerarListaCompras}
          className="bg-blue-700 text-white px-4 py-2 rounded hover:bg-blue-800"
        >
          🧾 Lista de Compras
        </button>
      </div>

      {/* Botão Dados Mestres */}
      <div className="flex justify-center">
        <button
          onClick={toggleMostrarDadosMestres}
          className="bg-zinc-700 text-white px-4 py-2 rounded hover:bg-zinc-800"
        >
          ⚙️ Dados Mestres
        </button>
      </div>

      {/* Dados Mestres – Se visível */}
      {mostrarDadosMestres && (
        <div className="bg-white border mt-4 p-4 rounded shadow-md">
          <h3 className="text-lg font-semibold mb-2">Painel de Dados Mestres</h3>
          <button
            onClick={salvarDadosMestres}
            className="bg-zinc-800 text-white px-3 py-1 rounded hover:bg-zinc-900 mb-2"
          >
            💾 Salvar Item Atual
          </button>
          <p className="text-xs text-gray-600">Cadastra o último item como referência futura</p>
        </div>
      )}
    </div>
  </div>
);
};
export default App;
//substituida fn16//

// === FN01 – Importações Gerais ===
import React, { useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import db from './firebase';

// === FN02 – Logomarca e Cores ===
const logoPath = "/LogomarcaDDnt2025Vazado.png";
const corPrimaria = "#8c3b1b";  // Terracota escuro
const corFundo = "#fff5ec";     // Terracota claro

// === FN03 – Componente Principal: App ===
const App = () => {
  // Estados principais
  const [cidade, setCidade] = useState('');
  const [escola, setEscola] = useState('');
  const [produto, setProduto] = useState('');
  const [sabor, setSabor] = useState('');
  const [quantidade, setQuantidade] = useState(1);
  const [itens, setItens] = useState([]);
  const [pedidos, setPedidos] = useState([]);
  const [pedidosFiltrados, setPedidosFiltrados] = useState([]);
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [mostrarPainelDadosMestres, setMostrarPainelDadosMestres] = useState(false);

// === FN04 – Filtrar Pedidos por Data ===
  const filtrarPedidosPorData = () => {
    if (!dataInicio && !dataFim) {
      setPedidosFiltrados(pedidos);
      return;
    }

    const inicio = dataInicio ? new Date(`${dataInicio}T00:00:00`) : null;
    const fim = dataFim ? new Date(`${dataFim}T23:59:59`) : null;

    const filtrados = pedidos.filter((pedido) => {
      const dataPedido = pedido.data?.toDate?.() || new Date(pedido.data);
      if (inicio && fim) {
        return dataPedido >= inicio && dataPedido <= fim;
      } else if (inicio) {
        return dataPedido >= inicio;
      } else if (fim) {
        return dataPedido <= fim;
      }
      return true;
    });

    setPedidosFiltrados(filtrados);
  };

  // === FN05 – useEffect para carregar pedidos ===
useEffect(() => {
  const carregarPedidos = async () => {
    try {
      const pedidosSnapshot = await getDocs(collection(db, "pedidos"));
      const pedidosData = pedidosSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      }));
      setPedidos(pedidosData);
      setPedidosFiltrados(pedidosData);
    } catch (erro) {
      console.error("Erro ao carregar pedidos:", erro);
    }
  };

  carregarPedidos();
}, []);

// === FN06 – Adicionar Item à Lista Temporária ===
const adicionarItem = () => {
  if (!cidade || !escola || !produto || !sabor || quantidade < 1) {
    alert('Preencha todos os campos antes de adicionar.');
    return;
  }

  const novoItem = { cidade, escola, produto, sabor, quantidade };
  setItens([...itens, novoItem]);
  setProduto('');
  setSabor('');
  setQuantidade(1);
};

// === FN07 – Salvar Pedido no Firebase ===
const salvarPedido = async () => {
  if (itens.length === 0) {
    alert('Adicione pelo menos um item antes de salvar o pedido.');
    return;
  }

  try {
    await addDoc(collection(db, "pedidos"), {
      itens,
      data: serverTimestamp(),
    });
    alert('Pedido salvo com sucesso!');
    setItens([]);
    const pedidosSnapshot = await getDocs(collection(db, "pedidos"));
    const pedidosData = pedidosSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data()
    }));
    setPedidos(pedidosData);
    setPedidosFiltrados(pedidosData);
  } catch (erro) {
    console.error("Erro ao salvar pedido:", erro);
    alert('Erro ao salvar pedido. Tente novamente.');
  }
};

  // === FN08 – Gerar PDF de Planejamento ===
const gerarPDF = () => {
  const doc = new jsPDF();
  let y = 10;

  doc.setFont('courier', 'normal');
  doc.setFontSize(10);
  doc.text('Planejamento de Produção - Dudunitê', 10, y);
  y += 10;

  pedidosFiltrados.forEach((pedido, index) => {
    doc.setFont('courier', 'bold');
    doc.text(`Pedido ${index + 1} - ${pedido.data?.toDate().toLocaleString() || ''}`, 10, y);
    y += 8;

    pedido.itens.forEach((item) => {
      doc.setFont('courier', 'normal');
      doc.text(
        `Cidade: ${item.cidade} | Escola: ${item.escola} | Produto: ${item.produto} | Sabor: ${item.sabor} | Qtd: ${item.quantidade}`,
        10,
        y
      );
      y += 6;
    });

    y += 4;
    if (y > 270) {
      doc.addPage();
      y = 10;
    }
  });

  const dataHora = new Date().toISOString().replace(/[:.]/g, '-');
  doc.save(`Planejamento-Dudunite-${dataHora}.pdf`);
};

// === FN09 – Gerar Lista de Compras ===
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
    glucose: 0,
  };

  const embalagem = {};
  const adesivos = {};

  const tabuleiroMap = {
    "BRW 7x7": { tabuleiros: 0, porTabuleiro: 12, bacia: 25, emb: "G650", adesivo: "EtiqBrw" },
    "BRW 6x6": { tabuleiros: 0, porTabuleiro: 17, bacia: 35, emb: "G640", adesivo: "EtiqBrw" },
    "PKT 5x5": { tabuleiros: 0, porTabuleiro: 20, bacia: 45, emb: "SQ5x5", adesivo: "SQ5x5", gramas: 20 },
    "PKT 6x6": { tabuleiros: 0, porTabuleiro: 15, bacia: 30, emb: "SQ6x6", adesivo: "SQ6x6", gramas: 30 },
    "DUDU":    { tabuleiros: 0, porTabuleiro: 10, emb: "SQ30x5", adesivo: "EtiqDD" },
    "Esc":     { tabuleiros: 0, porTabuleiro: 26, bacia: 26, emb: "D135", adesivo: "EtiqEsc" },
  };

  pedidosFiltrados.forEach((pedido) => {
    pedido.itens.forEach((item) => {
      const tipo = tabuleiroMap[item.produto];
      if (!tipo) return;

      const tabuleiros = Math.ceil(item.quantidade / tipo.porTabuleiro);
      tabuleiroMap[item.produto].tabuleiros += tabuleiros;
    });
  });

  Object.entries(tabuleiroMap).forEach(([produto, ref]) => {
    const { tabuleiros, bacia, emb, adesivo, gramas } = ref;

    if (tabuleiros > 0) {
      insumos.margarina += tabuleiros * 76;
      insumos.ovos += tabuleiros * 190;
      insumos.massas += tabuleiros * 2;

      if (bacia) {
        const unidades = bacia ? tabuleiros * ref.porTabuleiro : 0;
        const bacias = Math.ceil(unidades / bacia);
        if (["BRW 7x7", "BRW 6x6", "Esc"].includes(produto)) {
          insumos.recheiosPretos += bacias;
        } else if (["PKT 5x5", "PKT 6x6"].includes(produto)) {
          const totalGramas = tabuleiros * ref.porTabuleiro * gramas;
          const gramasPorBacia = 4 * 395 + 650; // 2.23kg por bacia
          const bacias = Math.ceil(totalGramas / gramasPorBacia);
          insumos.recheiosBrancos += bacias;
        }
      }

      if (emb) {
        embalagem[emb] = (embalagem[emb] || 0) + tabuleiros * ref.porTabuleiro;
      }
      if (adesivo) {
        adesivos[adesivo] = (adesivos[adesivo] || 0) + tabuleiros * ref.porTabuleiro;
      }
    }
  });

  insumos.glucose = Math.ceil((insumos.recheiosPretos + insumos.recheiosBrancos) / 6 * 500);

  // Impressão dos insumos no PDF
  doc.text('--- INSUMOS ---', 10, y); y += 8;
  Object.entries(insumos).forEach(([nome, qtd]) => {
    doc.text(`${nome}: ${qtd}`, 10, y); y += 6;
  });

  y += 6;
  doc.text('--- EMBALAGENS ---', 10, y); y += 8;
  Object.entries(embalagem).forEach(([codigo, qtd]) => {
    doc.text(`${codigo}: ${qtd}`, 10, y); y += 6;
  });

  y += 6;
  doc.text('--- ADESIVOS ---', 10, y); y += 8;
  Object.entries(adesivos).forEach(([codigo, qtd]) => {
    doc.text(`${codigo}: ${qtd}`, 10, y); y += 6;
  });

  const dataHora = new Date().toISOString().replace(/[:.]/g, '-');
  doc.save(`Lista-Compras-Dudunite-${dataHora}.pdf`);
};

  // === FN11 – Filtro por Data ===
const filtrarPorData = () => {
  if (!dataInicio || !dataFim) {
    setPedidosFiltrados(pedidos);
    return;
  }

  const inicio = new Date(dataInicio);
  inicio.setHours(0, 0, 0, 0);
  const fim = new Date(dataFim);
  fim.setHours(23, 59, 59, 999);

  const pedidosFiltradosData = pedidos.filter((pedido) => {
    if (!pedido.data) return false;
    const dataPedido = pedido.data.toDate();
    return dataPedido >= inicio && dataPedido <= fim;
  });

  setPedidosFiltrados(pedidosFiltradosData);
};

// === FN12 – Limpar Filtros ===
const limparFiltros = () => {
  setDataInicio('');
  setDataFim('');
  setPedidosFiltrados(pedidos);
};

// === FN13 – Remover Item da Lista Temporária ===
const removerItem = (index) => {
  const novaLista = [...itens];
  novaLista.splice(index, 1);
  setItens(novaLista);
};

  // === FN14 – Gerar PDF de Planejamento de Produção ===
const gerarPDF = () => {
  const doc = new jsPDF();
  let y = 10;

  doc.setFont('courier', 'normal');
  doc.setFontSize(12);
  doc.text('Planejamento de Produção - Dudunitê', 10, y);
  y += 10;

  pedidosFiltrados.forEach((pedido, idx) => {
    const dataPedido = pedido.data?.toDate().toLocaleString("pt-BR") || 'Data não disponível';
    doc.setFontSize(10);
    doc.text(`Pedido ${idx + 1} - ${dataPedido}`, 10, y);
    y += 6;

    pedido.itens.forEach((item) => {
      const linha = `${item.cidade} | ${item.escola} | ${item.produto} | ${item.sabor} | ${item.quantidade}`;
      doc.text(linha, 12, y);
      y += 5;
    });

    y += 4;
    if (y > 270) {
      doc.addPage();
      y = 10;
    }
  });

  const dataAgora = new Date();
  const timestamp = dataAgora.toLocaleString("pt-BR").replace(/[/: ]/g, '-');
  doc.save(`Planejamento-Dudunite-${timestamp}.pdf`);
};

// === FN15 – Função para gerar hash de insumos ===
const calcularInsumos = () => {
  const insumos = {
    margarina: 0,
    ovos: 0,
    massas: 0,
    recheiosPretos: 0,
    recheiosBrancos: 0,
    glucose: 0,
    leite: 0,
    misturaLactea: 0,
    leiteEmPo: 0,
    nutella: 0
  };

  const embalagens = {};
  const adesivos = {};

  const totalPorProduto = {};

  pedidosFiltrados.forEach((pedido) => {
    pedido.itens.forEach((item) => {
      const { produto, quantidade } = item;
      if (!totalPorProduto[produto]) {
        totalPorProduto[produto] = 0;
      }
      totalPorProduto[produto] += quantidade;
    });
  });

  return { insumos, embalagens, adesivos, totalPorProduto };
};

// === FN16 – Utilitário: Arredondar para cima ===
const arredondarParaCima = (valor) => {
  return Math.ceil(valor);
};

  // === FN17 – Gerar Lista de Compras em PDF ===
const gerarListaCompras = () => {
  const doc = new jsPDF();
  let y = 10;

  doc.setFont('courier', 'normal');
  doc.setFontSize(12);
  doc.text('Lista de Compras - Dudunitê', 10, y);
  y += 10;

  const { insumos, embalagens, adesivos, totalPorProduto } = calcularInsumos();

  doc.setFontSize(10);
  doc.text('--- INSUMOS ---', 10, y); y += 8;
  Object.entries(insumos).forEach(([nome, valor]) => {
    doc.text(`${nome}: ${valor}`, 10, y);
    y += 5;
  });

  y += 6;
  doc.text('--- EMBALAGENS ---', 10, y); y += 8;
  Object.entries(embalagens).forEach(([codigo, qtd]) => {
    doc.text(`${codigo}: ${qtd}`, 10, y);
    y += 5;
  });

  y += 6;
  doc.text('--- ADESIVOS ---', 10, y); y += 8;
  Object.entries(adesivos).forEach(([codigo, qtd]) => {
    doc.text(`${codigo}: ${qtd}`, 10, y);
    y += 5;
  });

  const dataAgora = new Date();
  const timestamp = dataAgora.toLocaleString("pt-BR").replace(/[/: ]/g, '-');
  doc.save(`ListaCompras-Dudunite-${timestamp}.pdf`);
};

// === FN18 – Função para Adicionar Item à Lista Temporária ===
const adicionarItem = () => {
  if (!cidade || !escola || !produto || !sabor || quantidade <= 0) return;

  const novoItem = {
    cidade,
    escola,
    produto,
    sabor,
    quantidade,
  };

  setItens([...itens, novoItem]);

  // Reset parcial
  setProduto('');
  setSabor('');
  setQuantidade(1);
};

// === FN19 – Função de Salvar Pedido no Firestore ===
const salvarPedido = async () => {
  if (!cidade || !escola || itens.length === 0) {
    alert("Preencha cidade, escola e adicione ao menos 1 item.");
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
    buscarPedidos(); // Atualiza os pedidos na tela
  } catch (error) {
    alert("Erro ao salvar pedido: " + error.message);
  }
};

  // === FN20 – Buscar Pedidos no Firestore ===
const buscarPedidos = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, "pedidos"));
    const listaPedidos = [];
    querySnapshot.forEach((doc) => {
      listaPedidos.push({ ...doc.data(), id: doc.id });
    });
    setPedidos(listaPedidos);
    setPedidosFiltrados(listaPedidos);
  } catch (error) {
    console.error("Erro ao buscar pedidos:", error);
  }
};

// === FN21 – useEffect para carregar pedidos na inicialização ===
useEffect(() => {
  buscarPedidos();
}, []);

// === FN22 – Dados Mestres ===
const dados = {
  "Recife": ["Tio Valter", "Vera Cruz", "Pinheiros", "BMQ", "Dourado", "CFC", "Madre de Deus", "Saber Viver", "Anita Garibaldi"],
  "Caruaru": ["Interativo", "Exato", "Alternativo", "Uniodonto"],
  "Gravatá": ["Objetivo", "Impacto", "Dinâmico", "Russas", "Bora Gastar", "Kaduh", "Society show", "Degusty"]
};

const produtos = [
  "BRW 7x7", "BRW 6x6", "PKT 5x5", "PKT 6x6", "DUDU", "Esc"
];

const sabores = [
  "Ninho com nutella", "Ninho", "Brig bco", "Brig pto", "Brig pto confete",
  "Brig bco confete", "Oreo", "Ovomaltine", "Bem casado", "Palha italiana", "Cr maracujá"
];

  // === RT99 – Interface Final ===
return (
  <> {/* RT99 – Início da Interface */}
    <div className="min-h-screen bg-[#fff5ec] p-4"> {/* Abre .bg */}
      <div className="max-w-xl mx-auto bg-white p-6 rounded shadow"> {/* Abre .max-w-xl */}

        {/* Seleção de Cidade */}
        <select value={cidade} onChange={(e) => setCidade(e.target.value)} className="w-full mb-2 p-2 border rounded">
          <option value="">Selecione a cidade</option>
          {Object.keys(dados).map((cid) => (
            <option key={cid} value={cid}>{cid}</option>
          ))}
        </select>

        {/* Seleção de Escola */}
        <select value={escola} onChange={(e) => setEscola(e.target.value)} className="w-full mb-2 p-2 border rounded">
          <option value="">Selecione a escola</option>
          {dados[cidade]?.map((esc) => (
            <option key={esc} value={esc}>{esc}</option>
          ))}
        </select>

        {/* Seleção de Produto */}
        <select value={produto} onChange={(e) => setProduto(e.target.value)} className="w-full mb-2 p-2 border rounded">
          <option value="">Selecione o produto</option>
          {produtos.map((prod) => (
            <option key={prod} value={prod}>{prod}</option>
          ))}
        </select>

        {/* Seleção de Sabor */}
        <select value={sabor} onChange={(e) => setSabor(e.target.value)} className="w-full mb-2 p-2 border rounded">
          <option value="">Selecione o sabor</option>
          {sabores.map((sab) => (
            <option key={sab} value={sab}>{sab}</option>
          ))}
        </select>

        {/* Quantidade */}
        <input
          type="number"
          value={quantidade}
          onChange={(e) => setQuantidade(Number(e.target.value))}
          className="w-full mb-4 p-2 border rounded"
          placeholder="Quantidade"
        />

        {/* Botões de ação principais – adicionar, gerar PDF, salvar */}
        <div className="flex flex-col gap-2">
          <button onClick={adicionarItem} className="bg-[#8c3b1b] text-white p-2 rounded">➕ Adicionar Item</button>
          <button onClick={salvarPedido} className="bg-green-600 text-white p-2 rounded">💾 Salvar Pedido</button>
          <button onClick={gerarPDF} className="bg-blue-600 text-white p-2 rounded">📄 Gerar PDF</button>
          <button onClick={gerarListaCompras} className="bg-yellow-600 text-white p-2 rounded">🛒 Gerar Lista de Compras</button>
        </div>

        {/* Lista Temporária */}
        <div className="mt-6">
          <h2 className="text-lg font-bold mb-2">Itens Temporários:</h2>
          <ul className="list-disc ml-5">
            {itens.map((item, index) => (
              <li key={index}>
                {item.quantidade}x {item.produto} - {item.sabor} ({item.escola} - {item.cidade})
                <button onClick={() => removerItem(index)} className="ml-2 text-red-500">Remover</button>
              </li>
            ))}
          </ul>
        </div>

        {/* Filtros de Data para histórico */}
        <div className="mt-6">
          <h2 className="text-lg font-bold mb-2">Filtrar Pedidos:</h2>
          <input type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} className="mr-2 p-2 border rounded" />
          <input type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)} className="mr-2 p-2 border rounded" />
          <button onClick={filtrarPorData} className="bg-gray-800 text-white px-3 py-1 rounded mr-2">Filtrar</button>
          <button onClick={limparFiltros} className="bg-gray-400 text-black px-3 py-1 rounded">Limpar</button>
        </div>

        {/* Lista de Pedidos Filtrados */}
        <div className="mt-6">
          <h2 className="text-lg font-bold mb-2">Pedidos:</h2>
          <ul className="list-disc ml-5">
            {pedidosFiltrados.map((pedido, index) => (
              <li key={index}>
                {pedido.itens.length} itens - {pedido.escola} ({pedido.cidade}) - {pedido.data?.toDate().toLocaleString()}
              </li>
            ))}
          </ul>
        </div>

      </div> {/* Fecha .max-w-xl */}
    </div> {/* Fecha .bg */}
  </> // RT99 – Fim da Interface
);

// === EXPORTAÇÃO FINAL ===
export default App;

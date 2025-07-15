// === BLOCO 1 – Início ===
// FN01 – Importações Gerais
import React, { useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import {
  collection,
  addDoc,
  getDocs,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import db from './firebase';

// FN02 – Logomarca e Cores
const logoPath = "/LogomarcaDDnt2025Vazado.png";
const corPrimaria = "#8c3b1b";  // Terracota escuro
const corFundo = "#fff5ec";     // Terracota claro

// FN04 – Componente principal
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
  const [pedidosFiltrados, setPedidosFiltrados] = useState([]);
  const [mostrarDadosMestres, setMostrarDadosMestres] = useState(false);
  const [novaEscola, setNovaEscola] = useState('');
  const [novoProduto, setNovoProduto] = useState('');
  const [novoSabor, setNovoSabor] = useState('');
  const [dadosEscolas, setDadosEscolas] = useState({});
  const [dadosProdutos, setDadosProdutos] = useState({});
  const [tipoSelecionado, setTipoSelecionado] = useState('');

// === FN03 – carregarDadosFixosIniciais ===
useEffect(() => {
  const carregarDadosFixosIniciais = () => {
    const escolasPorCidade = {
      "RECIFE": [
        "Tio Valter", "Vera Cruz", "Pinheiros", "Dourado",
        "BMQ", "CFC", "Madre de Deus", "Saber Viver"
      ],
      "CARUARU": [
        "Interativo", "Exato Sede", "Exato Anexo", "Sesi", "Motivo", "Jesus Salvador"
      ],
      "GRAVATÁ": [
        "Pequeno Príncipe", "Salesianas", "Céu Azul", "Russas",
        "Bora Gastar", "Kaduh", "Society Show", "Degusty"
      ]
    };

    const produtosComSabores = {
      "BRW 7x7": [
        "Brigadeiro preto", "Brigadeiro c confete", "Ninho", "Ninho com nutella",
        "Beijinho", "Palha italiana", "Prestigio", "Oreo", "Paçoca",
        "Ovomaltine", "Bem casado"
      ],
      "BRW 6x6": [
        "Brigadeiro branco", "Brigadeiro branco c confete", "Brigadeiro preto",
        "Palha italiana", "Ninho", "Bem casado"
      ],
      "ESC": ["Brigadeiro branco", "Ninho com nutella", "Brigadeiro preto"],
      "PKT 5x5": ["Oreo", "Beijinho", "Brigadeiro preto"],
      "PKT 6x6": ["Prestigio", "Paçoca", "Brigadeiro branco"],
      "DUDU": ["Ninho com nutella", "Brigadeiro preto", "Beijinho"]
    };

    setDadosEscolas(escolasPorCidade);
    setDadosProdutos(produtosComSabores);
  };

  carregarDadosFixosIniciais();
}, []);

// === FN04b – carregarPedidos com validações e filtro retroativo ===
const carregarPedidos = async () => {
  try {
    const snapshot = await getDocs(collection(db, "pedidos"));
    const lista = snapshot.docs.map(doc => {
      const data = doc.data();
      let timestamp = data.timestamp;

      if (!timestamp && data.dataServidor?.seconds) {
        timestamp = new Timestamp(data.dataServidor.seconds, data.dataServidor.nanoseconds || 0);
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
        timestamp
      };
    }).filter(p => p.timestamp && typeof p.timestamp.toDate === 'function');

    setPedidos(lista);
    const filtrados = fn05_filtrarPedidos(lista, dataInicio, dataFim);
    setPedidosFiltrados(filtrados);
  } catch (err) {
    console.error("Erro ao carregar pedidos:", err);
    alert("Erro ao carregar pedidos do banco de dados.");
  }
};
// === BLOCO 1 – Fim ===
// === BLOCO 2 – Início ===

// === FN05 – filtrarPedidosPorData (renomeada para fn05_filtrarPedidos para uso interno) ===
const fn05_filtrarPedidos = (lista, dataInicio, dataFim) => {
  let inicio = new Date(0); // início muito antigo
  let fim = new Date(8640000000000000); // fim muito distante

  if (dataInicio) {
    const dInicio = new Date(`${dataInicio}T00:00:00`);
    if (!isNaN(dInicio.getTime())) inicio = dInicio;
  }

  if (dataFim) {
    const dFim = new Date(`${dataFim}T23:59:59.999`);
    if (!isNaN(dFim.getTime())) fim = dFim;
  }

  return lista.filter((p) => {
    if (!p.timestamp || typeof p.timestamp.toDate !== 'function') return false;
    const dataPedido = p.timestamp.toDate();
    return dataPedido >= inicio && dataPedido <= fim;
  });
};

// === FN06 – adicionarItemAoPedido ===
const adicionarItemAoPedido = () => {
  if (!produto || !sabor || !quantidade || quantidade < 1) {
    alert("Informe produto, sabor e quantidade válida.");
    return;
  }

  const novoItem = {
    produto,
    sabor,
    quantidade: Number(quantidade),
  };

  setItens(prev => [...prev, novoItem]);
  setProduto('');
  setSabor('');
  setQuantidade(1);
};

// === FN07 – salvarPedido ===
const salvarPedido = async () => {
  if (!cidade || !escola || itens.length === 0) {
    alert("Preencha cidade, escola e ao menos um item.");
    return;
  }

  const novoPedido = {
    cidade,
    escola,
    itens,
    timestamp: serverTimestamp(),
  };

  try {
    await addDoc(collection(db, "pedidos"), novoPedido);
    alert("Pedido salvo com sucesso!");
    setItens([]);
    setCidade('');
    setEscola('');
    setProduto('');
    setSabor('');
    setQuantidade(1);
    carregarPedidos();
  } catch (error) {
    console.error("Erro ao salvar pedido:", error);
    alert("Erro ao salvar pedido. Tente novamente.");
  }
};

// === FN08 – gerarPlanejamentoProducao (corrigida) ===
const gerarPlanejamentoProducao = () => {
  const pedidosFiltrados = fn05_filtrarPedidos(pedidos, dataInicio, dataFim);

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
    "DUDU":    null // Ignora DUDU no cálculo
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
// === BLOCO 2 – Fim ===
// === BLOCO 3 – Início ===

// === FN09 – gerarListaCompras ===
const gerarListaCompras = () => {
  const pedidosFiltrados = fn05_filtrarPedidos(pedidos, dataInicio, dataFim);

  if (!pedidosFiltrados.length) {
    alert('Nenhum pedido encontrado para o período selecionado.');
    return;
  }

  const insumos = {};

  pedidosFiltrados.forEach(pedido => {
    pedido.itens.forEach(({ produto, sabor, quantidade }) => {
      const chave = `${produto} - ${sabor}`;
      if (!insumos[chave]) insumos[chave] = 0;
      insumos[chave] += Number(quantidade);
    });
  });

  const doc = new jsPDF();
  let y = 10;

  doc.setFont('courier', 'normal');
  doc.setFontSize(10);
  doc.text('🧾 Lista de Compras - Dudunitê', 10, y);
  y += 10;

  Object.entries(insumos).forEach(([nome, qtd]) => {
    doc.text(`${nome}: ${qtd} un`, 10, y);
    y += 6;
    if (y >= 270) {
      doc.addPage();
      y = 10;
    }
  });

  const agora = new Date();
  const dia = String(agora.getDate()).padStart(2, '0');
  const mes = String(agora.getMonth() + 1).padStart(2, '0');
  const ano = agora.getFullYear();
  const hora = String(agora.getHours()).padStart(2, '0');
  const minuto = String(agora.getMinutes()).padStart(2, '0');
  const nomePDF = `compras-${dia}-${mes}-${ano}-${hora}h${minuto}.pdf`;

  try {
    doc.save(nomePDF);
  } catch (erro) {
    alert('Erro ao tentar salvar o PDF. Experimente usar um navegador em modo desktop.');
    console.error(erro);
  }
};

// === FN10 – salvarDadosMestres ===
const salvarDadosMestres = async () => {
  if (!cidade || !escola || !produto || !sabor) {
    alert("Preencha cidade, escola, produto e sabor.");
    return;
  }

  const novoItem = {
    cidade,
    escola,
    produto,
    sabor,
    data: serverTimestamp()
  };

  try {
    await addDoc(collection(db, "dadosMestres"), novoItem);
    alert("Item salvo nos Dados Mestres!");
  } catch (erro) {
    console.error("Erro ao salvar dados mestres:", erro);
    alert("Erro ao salvar item. Tente novamente.");
  }
};

// === FN11 – PainelDadosMestres ===
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

// === FN12 – EditorEscolas (em desenvolvimento) ===
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

// === FN13 – EditorProdutos (em desenvolvimento) ===
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

// === BLOCO 3 – Fim ===
// === BLOCO 4 – Início ===

// === FN14 – carregarDadosMestresViaPedidos (desativada por decisão de escopo) ===
/*
useEffect(() => {
  const reconstruirDadosMestres = async () => {
    try {
      const snapshot = await getDocs(collection(db, "pedidos"));
      const lista = snapshot.docs.map(doc => doc.data());

      const escolasMapeadas = {};
      const produtosMapeados = {};

      lista.forEach((pedido) => {
        const cidade = pedido.cidade;
        const escola = pedido.escola;

        if (cidade && escola) {
          if (!escolasMapeadas[cidade]) escolasMapeadas[cidade] = [];
          if (!escolasMapeadas[cidade].includes(escola)) {
            escolasMapeadas[cidade].push(escola);
          }
        }

        if (Array.isArray(pedido.itens)) {
          pedido.itens.forEach(({ produto, sabor }) => {
            if (produto && sabor) {
              if (!produtosMapeados[produto]) produtosMapeados[produto] = [];
              if (!produtosMapeados[produto].includes(sabor)) {
                produtosMapeados[produto].push(sabor);
              }
            }
          });
        }
      });

      setDadosEscolas(prev => ({ ...prev, ...escolasMapeadas }));
      setDadosProdutos(prev => ({ ...prev, ...produtosMapeados }));
    } catch (err) {
      console.error("Erro ao reconstruir dados mestres via pedidos:", err);
    }
  };

  reconstruirDadosMestres();
}, []);
*/

// === FN15 – carregarDadosMestres via Firestore (desativada) ===
/*
useEffect(() => {
  const carregarDadosMestres = async () => {
    try {
      const snapshot = await getDocs(collection(db, "dadosMestres"));
      const lista = snapshot.docs
        .map((doc) => doc.data())
        .filter((item) =>
          item.cidade && item.escola && item.produto && item.sabor
        );

      if (lista.length === 0) {
        console.warn("⚠️ Nenhum dado válido encontrado na coleção dadosMestres.");
        carregarDadosMestresIniciais();
        return;
      }

      const escolasMapeadas = {};
      const produtosMapeados = {};

      lista.forEach((item) => {
        if (!escolasMapeadas[item.cidade]) escolasMapeadas[item.cidade] = [];
        if (!escolasMapeadas[item.cidade].includes(item.escola)) {
          escolasMapeadas[item.cidade].push(item.escola);
        }

        if (!produtosMapeados[item.produto]) produtosMapeados[item.produto] = [];
        if (!produtosMapeados[item.produto].includes(item.sabor)) {
          produtosMapeados[item.produto].push(item.sabor);
        }
      });

      setDadosEscolas(prev => ({ ...prev, ...escolasMapeadas }));
      setDadosProdutos(prev => ({ ...prev, ...produtosMapeados }));
    } catch (error) {
      alert("❌ Erro ao carregar dados mestres");
      console.error("Erro Firebase:", error);
      carregarDadosMestresIniciais();
    }
  };

  carregarDadosMestres();
}, []);
*/

// === BLOCO 4 – Fim ===
// === BLOCO 5 – Início ===

return (
  <div className="bg-[#FFF3E9] min-h-screen p-4 text-sm font-sans text-[#5C1D0E]">
    <div className="max-w-xl mx-auto">
      <img src="/logo.png" alt="Dudunitê" className="w-48 mx-auto mb-4" />
      <h1 className="text-center text-xl font-bold mb-6">Lançamento de Pedidos - Dudunitê</h1>

      {/* === RT02 – Filtro por período === */}
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

      {/* === RT03 – Campos do Pedido === */}
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
      </div>

      {/* === RT04 – Lista de Itens e botão Salvar Pedido === */}
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

      {/* === RT05 – Ações adicionais === */}
      <div className="flex flex-wrap justify-center gap-4 mt-6 mb-6">
        <button
          onClick={gerarPlanejamentoProducao}
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
        <button
          onClick={toggleDadosMestres}
          className="bg-gray-700 text-white px-4 py-2 rounded hover:bg-gray-800"
        >
          ⚙️ Dados Mestres
        </button>
      </div>

      {/* === RT06 – Painel Dados Mestres === */}
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
    </div>
  </div>
);

// === BLOCO 5 – Fim ===
export default App;
  
  
  
  

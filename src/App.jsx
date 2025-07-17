// === INÍCIO FN01 – Importações e Constantes Globais ===
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

const logoPath = "/LogomarcaDDnt2025Vazado.png";
const corPrimaria = "#8c3b1b";
const corFundo = "#fff5ec";
// === FIM FN01 ===


// === INÍCIO FN02 – Carga Estática das Cidades e Escolas ===
const obterCidadesEscolas = () => ({
  "Gravatá": [
    "Pequeno Príncipe",
    "Salesianas",
    "Céu Azul",
    "Russas",
    "Bora Gastar",
    "Kaduh",
    "Society Show",
    "Degusty",
  ],
  "Recife": [
    "Tio Valter",
    "Vera Cruz",
    "Pinheiros",
    "Dourado",
    "BMQ",
    "CFC",
    "Madre de Deus",
    "Saber Viver",
  ],
  "Caruaru": [
    "Interativo",
    "Exato Sede",
    "Exato Anexo",
    "Sesi",
    "Motivo",
    "Jesus Salvador",
  ],
});
// === FIM FN02 ===


// === INÍCIO FN03 – Carga Estática de Sabores por Produto ===
const obterSaboresPorProduto = () => ({
  "BRW 7x7": [
    "Ninho",
    "Ninho com Nutella",
    "Oreo",
    "Ovomaltine",
    "Beijinho",
    "Brigadeiro branco",
    "Brigadeiro branco com confete",
    "Bem casado",
    "Paçoca",
    "KitKat",
    "Brigadeiro preto",
    "Brigadeiro preto com confete",
    "Palha italiana"
  ],
  "BRW 6x6": [
    "Ninho",
    "Ninho com Nutella",
    "Oreo",
    "Ovomaltine",
    "Beijinho",
    "Brigadeiro branco",
    "Brigadeiro branco com confete",
    "Bem casado",
    "Paçoca",
    "KitKat",
    "Brigadeiro preto",
    "Brigadeiro preto com confete",
    "Palha italiana"
  ],
  "PKT 5x5": [
    "Ninho",
    "Ninho com Nutella",
    "Oreo",
    "Ovomaltine",
    "Beijinho",
    "Brigadeiro branco",
    "Brigadeiro branco com confete",
    "Bem casado",
    "Paçoca",
    "KitKat",
    "Brigadeiro preto",
    "Brigadeiro preto com confete",
    "Palha italiana"
  ],
  "PKT 6x6": [
    "Ninho",
    "Ninho com Nutella",
    "Oreo",
    "Ovomaltine",
    "Beijinho",
    "Brigadeiro branco",
    "Brigadeiro branco com confete",
    "Bem casado",
    "Paçoca",
    "KitKat",
    "Brigadeiro preto",
    "Brigadeiro preto com confete",
    "Palha italiana"
  ],
  "DUDU": [
    "Dd Oreo",
    "Dd Ovomaltine",
    "Dd Ninho com Nutella",
    "Dd Creme de Maracujá",
    "Dd KitKat"
  ],
  "Esc": [
    "Ninho",
    "Ninho com Nutella",
    "Oreo",
    "Ovomaltine",
    "Beijinho",
    "Brigadeiro branco",
    "Brigadeiro branco com confete",
    "Bem casado",
    "Paçoca",
    "KitKat",
    "Brigadeiro preto",
    "Brigadeiro preto com confete",
    "Palha italiana"
  ]
});
// === FIM FN03 ===

// === INÍCIO FN04 – Recheios por Sabor ===
const obterRecheioPorSabor = () => ({
  "Ninho": "branco",
  "Ninho com Nutella": "branco",
  "Oreo": "branco",
  "Ovomaltine": "branco",
  "Beijinho": "branco",
  "Brigadeiro branco": "branco",
  "Brigadeiro branco com confete": "branco",
  "Paçoca": "branco",
  "KitKat": "branco",

  "Brigadeiro preto": "preto",
  "Brigadeiro preto com confete": "preto",
  "Palha italiana": "preto",

  "Bem casado": "misto", // 50% branco, 50% preto
});
// === FIM FN04 ===


// === INÍCIO FN05 – Estados Globais do App ===
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
  const [tipoSelecionado, setTipoSelecionado] = useState('');
  const [dadosEscolas, setDadosEscolas] = useState({});
  const [dadosProdutos, setDadosProdutos] = useState({});
// === FIM FN05 ===

  // === INÍCIO FN06 – Carga de Cidades e Escolas (fixa) ===
const obterCidadesEscolas = () => ({
  "Gravatá": [
    "Pequeno Príncipe",
    "Salesianas",
    "Céu Azul",
    "Russas",
    "Bora Gastar",
    "Kaduh",
    "Society Show",
    "Degusty"
  ],
  "Recife": [
    "Tio Valter",
    "Vera Cruz",
    "Pinheiros",
    "Dourado",
    "BMQ",
    "CFC",
    "Madre de Deus",
    "Saber Viver"
  ],
  "Caruaru": [
    "Interativo",
    "Exato Sede",
    "Exato Anexo",
    "Sesi",
    "Motivo",
    "Jesus Salvador"
  ]
});
// === FIM FN06 ===


// === INÍCIO FN07 – Carga de Sabores por Produto ===
const obterSaboresPorProduto = () => ({
  "BRW 7x7": [
    "Ninho", "Ninho com Nutella", "Oreo", "Ovomaltine", "Beijinho",
    "Brigadeiro branco", "Brigadeiro branco com confete", "Paçoca", "KitKat",
    "Brigadeiro preto", "Brigadeiro preto com confete", "Palha italiana", "Bem casado"
  ],
  "BRW 6x6": [
    "Ninho", "Ninho com Nutella", "Oreo", "Ovomaltine", "Beijinho",
    "Brigadeiro branco", "Brigadeiro branco com confete", "Paçoca", "KitKat",
    "Brigadeiro preto", "Brigadeiro preto com confete", "Palha italiana", "Bem casado"
  ],
  "PKT 5x5": [
    "Ninho", "Ninho com Nutella", "Oreo", "Ovomaltine", "Beijinho",
    "Brigadeiro branco", "Brigadeiro branco com confete", "Paçoca", "KitKat",
    "Brigadeiro preto", "Brigadeiro preto com confete", "Palha italiana", "Bem casado"
  ],
  "PKT 6x6": [
    "Ninho", "Ninho com Nutella", "Oreo", "Ovomaltine", "Beijinho",
    "Brigadeiro branco", "Brigadeiro branco com confete", "Paçoca", "KitKat",
    "Brigadeiro preto", "Brigadeiro preto com confete", "Palha italiana", "Bem casado"
  ],
  "Esc": [
    "Ninho", "Ninho com Nutella", "Oreo", "Ovomaltine", "Beijinho",
    "Brigadeiro branco", "Brigadeiro branco com confete", "Paçoca", "KitKat",
    "Brigadeiro preto", "Brigadeiro preto com confete", "Palha italiana", "Bem casado"
  ],
  "Dudu": [
    "Dd Oreo", "Dd Ovomaltine", "Dd Ninho com Nutella", "Dd Creme de Maracujá", "Dd KitKat"
  ]
});
// === FIM FN07 ===

  // === INÍCIO FN08 – adicionarItem (validação e inclusão do item na lista) ===
  const adicionarItem = () => {
    if (!produto || !sabor || !quantidade || quantidade <= 0) {
      alert("Preencha todos os campos corretamente.");
      return;
    }

    const novoItem = { produto, sabor, quantidade: parseInt(quantidade) };
    setItens((prev) => [...prev, novoItem]);

    setProduto('');
    setSabor('');
    setQuantidade(1);
  };
  // === FIM FN08 ===

  // === INÍCIO FN09 – totalItens (soma da quantidade atual do pedido) ===
  const totalItens = itens.reduce((soma, item) => soma + item.quantidade, 0);
  // === FIM FN09 ===

  // === INÍCIO FN10 – salvarPedido (validação e envio para o Firestore) ===
  const salvarPedido = async () => {
    if (!cidade || !escola || itens.length === 0) {
      alert("Preencha todos os campos antes de salvar.");
      return;
    }

    const novoPedido = {
      cidade,
      escola,
      itens,
      data: serverTimestamp()
    };

    try {
      const docRef = await addDoc(collection(db, "pedidos"), novoPedido);
      if (docRef.id) {
        alert("Pedido salvo com sucesso!");
        setCidade('');
        setEscola('');
        setItens([]);
      } else {
        throw new Error("Erro ao salvar.");
      }
    } catch (error) {
      console.error("Erro ao salvar pedido:", error);
      alert("Erro ao salvar o pedido.");
    }
  };
  // === FIM FN10 ===

  // === INÍCIO FN11 – carregarPedidos (busca do Firestore + ajuste datas) ===
  const carregarPedidos = async () => {
    try {
      const snapshot = await getDocs(collection(db, "pedidos"));
      const lista = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        data: doc.data().data?.toDate?.() || new Date()
      }));
      setPedidos(lista);
    } catch (error) {
      console.error("Erro ao carregar pedidos:", error);
    }
  };
  // === FIM FN11 ===

  // === INÍCIO FN12 – useEffect para carregarPedidos ao iniciar ===
  useEffect(() => {
    carregarPedidos();
  }, []);
  // === FIM FN12 ===

  // === INÍCIO FN13 – formatarData (converte ISO em dd/mm/aaaa) ===
  const formatarData = (isoString) => {
    const data = new Date(isoString);
    return data.toLocaleDateString('pt-BR');
  };
  // === FIM FN13 ===

  // === INÍCIO FN14 – filtrarPedidosPorData (com fallback se sem filtro) ===
  const filtrarPedidosPorData = () => {
    let inicio = new Date("1900-01-01");
    let fim = new Date("2050-12-31");

    if (dataInicio) {
      const partesInicio = dataInicio.split("-");
      inicio = new Date(`${partesInicio[0]}-${partesInicio[1]}-${partesInicio[2]}T00:00:00`);
    }

    if (dataFim) {
      const partesFim = dataFim.split("-");
      fim = new Date(`${partesFim[0]}-${partesFim[1]}-${partesFim[2]}T23:59:59`);
    }

    const pedidosFiltrados = pedidos.filter((pedido) => {
      const dataPedido = new Date(pedido.data);
      return dataPedido >= inicio && dataPedido <= fim;
    });

    setPedidosFiltrados(pedidosFiltrados);
  };
  // === FIM FN14 ===

  // === INÍCIO FN15 – toggleMostrarDadosMestres ===
  const toggleMostrarDadosMestres = () => {
    setMostrarDadosMestres((prev) => !prev);
  };
  // === FIM FN15 ===

  // === INÍCIO FN16 – salvarDadosMestres (grava cidade, escola, produto, sabor) ===
  const salvarDadosMestres = async () => {
    const novoItem = {
      cidade,
      escola,
      produto,
      sabor
    };

    try {
      await addDoc(collection(db, "dadosMestres"), novoItem);
      alert("Dados mestres salvos com sucesso!");
      setNovaEscola('');
      setNovoProduto('');
      setNovoSabor('');
      carregarDadosMestres();
    } catch (error) {
      console.error("Erro ao salvar dados mestres:", error);
      alert("Erro ao salvar dados mestres.");
    }
  };
  // === FIM FN16 ===

  // === INÍCIO FN17 – adicionarItem (validação e inclusão do item na lista) ===
  const adicionarItem = () => {
    if (!produto || !sabor || !quantidade || quantidade <= 0) {
      alert("Preencha todos os campos corretamente.");
      return;
    }

    const novoItem = { produto, sabor, quantidade: parseInt(quantidade) };
    setItens((prevItens) => [...prevItens, novoItem]);
    setProduto('');
    setSabor('');
    setQuantidade(1);
  };
  // === FIM FN17 ===

  // === INÍCIO FN18 – totalItens (soma da quantidade atual do pedido) ===
  const totalItens = itens.reduce((soma, item) => soma + item.quantidade, 0);
  // === FIM FN18 ===

  // === INÍCIO FN19 – salvarPedido (envia pedido completo ao Firestore com validação) ===
  const salvarPedido = async () => {
    if (!cidade || !escola || itens.length === 0) {
      alert("Preencha todos os campos antes de salvar.");
      return;
    }

    const novoPedido = {
      cidade,
      escola,
      data: new Date().toISOString(),
      itens,
      criadoEm: serverTimestamp()
    };

    try {
      const docRef = await addDoc(collection(db, "pedidos"), novoPedido);
      if (docRef && docRef.id) {
        alert("Pedido salvo com sucesso!");
        setCidade('');
        setEscola('');
        setItens([]);
        carregarPedidos();
      } else {
        throw new Error("Falha ao salvar no Firestore");
      }
    } catch (error) {
      console.error("Erro ao salvar pedido:", error);
      alert("Erro ao salvar o pedido.");
    }
  };
  // === FIM FN19 ===

  // === INÍCIO FN20 – carregarPedidos (busca todos os pedidos do Firestore) ===
  const carregarPedidos = async () => {
    try {
      const snapshot = await getDocs(collection(db, "pedidos"));
      const listaPedidos = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setPedidos(listaPedidos);
      filtrarPedidosPorData(listaPedidos); // aplica filtro ao carregar
    } catch (error) {
      console.error("Erro ao carregar pedidos:", error);
    }
  };
  // === FIM FN20 ===

  // === INÍCIO FN21 – filtrarPedidosPorData (usa dataInicio e dataFim para filtrar) ===
  const filtrarPedidosPorData = (
    lista = pedidos,
    inicioStr = dataInicio,
    fimStr = dataFim
  ) => {
    let inicio = inicioStr ? new Date(inicioStr + " 00:00:00") : new Date("1900-01-01T00:00:00");
    let fim = fimStr ? new Date(fimStr + " 23:59:59") : new Date("2050-12-31T23:59:59");

    const filtrados = lista.filter((pedido) => {
      const dataPedido = new Date(pedido.data);
      return dataPedido >= inicio && dataPedido <= fim;
    });

    setPedidosFiltrados(filtrados);
  };
  // === FIM FN21 ===

  // === INÍCIO FN22 – formatarData (converte ISO em dd/mm/aaaa) ===
  const formatarData = (isoString) => {
    if (!isoString) return '';
    const data = new Date(isoString);
    return data.toLocaleDateString('pt-BR');
  };
  // === FIM FN22 ===

  // === INÍCIO RT99 – BLOCO PRINCIPAL DE INTERFACE ===
return (
  <div className="container mx-auto p-4">
    {/* === INÍCIO RT01 – Seletor de Cidade, Escola, Produto e Sabor === */}
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 border border-gray-300 p-4 rounded-2xl shadow">
      <div>
        <label className="block text-sm font-medium">Cidade</label>
        <select value={cidade} onChange={(e) => setCidade(e.target.value)} className="w-full border rounded p-1">
          <option value="">Selecione</option>
          {cidades.map((c, i) => (
            <option key={i} value={c}>{c}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium">Escola</label>
        <select value={escola} onChange={(e) => setEscola(e.target.value)} className="w-full border rounded p-1">
          <option value="">Selecione</option>
          {escolasFiltradas.map((e, i) => (
            <option key={i} value={e}>{e}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium">Produto</label>
        <select value={produto} onChange={(e) => handleProdutoChange(e.target.value)} className="w-full border rounded p-1">
          <option value="">Selecione</option>
          {produtos.map((p, i) => (
            <option key={i} value={p}>{p}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium">Sabor</label>
        <select value={sabor} onChange={(e) => setSabor(e.target.value)} className="w-full border rounded p-1">
          <option value="">Selecione</option>
          {saboresFiltrados.map((s, i) => (
            <option key={i} value={s}>{s}</option>
          ))}
        </select>
      </div>
    </div>
    {/* === FIM RT01 === */}

    {/* === INÍCIO RT02 – Quantidade e Botão Adicionar === */}
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 items-end">
      <div>
        <label className="block text-sm font-medium">Quantidade</label>
        <input
          type="number"
          value={quantidade}
          onChange={(e) => setQuantidade(Number(e.target.value))}
          className="w-full border rounded p-1"
          min="1"
        />
      </div>
      <div>
        <button onClick={adicionarItem} className="bg-green-600 text-white px-4 py-2 rounded shadow-md w-full">
          Adicionar
        </button>
      </div>
    </div>
    {/* === FIM RT02 === */}

    {/* === INÍCIO RT03 – Lista de Itens do Pedido === */}
    <div className="mb-6">
      <h2 className="text-lg font-semibold mb-2">Itens do Pedido ({totalItens})</h2>
      <ul className="list-disc ml-5">
        {itens.map((item, i) => (
          <li key={i}>
            {item.produto} – {item.sabor} – {item.quantidade}
          </li>
        ))}
      </ul>
    </div>
    {/* === FIM RT03 === */}

    {/* === INÍCIO RT04 – Botão Salvar Pedido e Planejamento === */}
    <div className="flex flex-col md:flex-row gap-4 mb-6">
      <button onClick={salvarPedido} className="bg-blue-600 text-white px-4 py-2 rounded shadow-md w-full md:w-auto">
        Salvar Pedido
      </button>
      <button onClick={gerarPlanejamento} className="bg-purple-600 text-white px-4 py-2 rounded shadow-md w-full md:w-auto">
        Planejamento de Produção
      </button>
      <button onClick={gerarListaCompras} className="bg-amber-700 text-white px-4 py-2 rounded shadow-md w-full md:w-auto">
        Lista de Compras
      </button>
      <button onClick={toggleMostrarDadosMestres} className="bg-gray-800 text-white px-4 py-2 rounded shadow-md w-full md:w-auto">
        Dados Mestres
      </button>
    </div>
    {/* === FIM RT04 === */}

    {/* === INÍCIO RT05 – Filtros por Data e Geração de PDF === */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <div>
        <label className="block text-sm font-medium">Data Início</label>
        <input type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} className="w-full border rounded p-1" />
      </div>
      <div>
        <label className="block text-sm font-medium">Data Fim</label>
        <input type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)} className="w-full border rounded p-1" />
      </div>
      <div className="flex items-end">
        <button onClick={() => gerarPDF(pedidosFiltrados)} className="bg-red-600 text-white px-4 py-2 rounded shadow-md w-full">
          Gerar PDF
        </button>
      </div>
    </div>
    {/* === FIM RT05 === */}

    {/* === INÍCIO RT06 – Tabela de Pedidos Salvos === */}
    <div className="overflow-x-auto border border-gray-300 rounded-2xl shadow mb-8">
      <table className="min-w-full text-sm">
        <thead className="bg-terra text-white">
          <tr>
            <th className="py-2 px-4 border">Data</th>
            <th className="py-2 px-4 border">Cidade</th>
            <th className="py-2 px-4 border">Escola</th>
            <th className="py-2 px-4 border">Produto</th>
            <th className="py-2 px-4 border">Sabor</th>
            <th className="py-2 px-4 border">Qtd</th>
          </tr>
        </thead>
        <tbody>
          {pedidosFiltrados.map((p, i) => (
            <tr key={i} className="bg-white even:bg-gray-100">
              <td className="py-1 px-4 border">{formatarData(p.timestamp)}</td>
              <td className="py-1 px-4 border">{p.cidade}</td>
              <td className="py-1 px-4 border">{p.escola}</td>
              <td className="py-1 px-4 border">{p.produto}</td>
              <td className="py-1 px-4 border">{p.sabor}</td>
              <td className="py-1 px-4 border">{p.quantidade}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    {/* === FIM RT06 === */}
  </div>
);
// === FIM RT99 ===

export default App;

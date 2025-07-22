// === FN01 – Importações Gerais ===
import React, { useState, useEffect } from "react";
import { collection, addDoc, getDocs, query, where, serverTimestamp } from "firebase/firestore";
import db from "./firebase";
// === FIM FN01 ===
// === FN02 – Cores e Logomarca (placeholder, não usado aqui) ===
const corPrimaria = "#8c3b1b";
const logoPath = "/LogomarcaDDnt2025Vazado.png";

// === INÍCIO FN03 – Componente App e Estados ===
function App() {
  const [telaAtual, setTelaAtual] = useState("PCP");
  const [cidade, setCidade] = useState("");
  const [escola, setEscola] = useState("");
  const [produtoSelecionado, setProdutoSelecionado] = useState("");
  const [quantidade, setQuantidade] = useState(1);
  const [dataVencimento, setDataVencimento] = useState("");
  const [formaPagamento, setFormaPagamento] = useState("");
  const [referenciaTabela, setReferenciaTabela] = useState("");
  const [valorUnitario, setValorUnitario] = useState("");
  const [itensPedido, setItensPedido] = useState([]);
  const [pedidosLancados, setPedidosLancados] = useState([]);

  const cidades = ["Gravatá", "Recife", "Caruaru"];
  const produtos = ["BRW 7x7", "BRW 6x6", "PKT 5x5", "PKT 6x6", "Esc", "DUDU"];

  const escolasPorCidade = {
    Gravatá: ["Pequeno Príncipe", "Salesianas", "Céu Azul", "Russas", "Bora Gastar", "Kaduh", "Society Show", "Degusty"],
    Recife: ["Tio Valter", "Vera Cruz", "Pinheiros", "Dourado", "BMQ", "CFC", "Madre de Deus", "Saber Viver"],
    Caruaru: ["Interativo", "Exato Sede", "Exato Anexo", "Sesi", "Motivo", "Jesus Salvador"],
  };

  const escolasFiltradas = cidade ? escolasPorCidade[cidade] || [] : [];

  const handleAnexoNota = (e) => setAnexoNota(e.target.files[0]);
  const handleAnexoBoleto = (e) => setAnexoBoleto(e.target.files[0]);
}
// === FIM FN03 ===
// === INÍCIO FN04 – Carregar pedidos com status 'Lançado' ===
const carregarPedidosLancados = async () => {
  try {
    const pedidosRef = collection(db, "PEDIDOS");
    const q = query(pedidosRef, where("statusEtapa", "==", "Lançado"));
    const querySnapshot = await getDocs(q);

    const pedidos = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    setPedidosLancados(pedidos);
  } catch (error) {
    console.error("Erro ao carregar pedidos lançados:", error);
    setPedidosLancados([]);
  }
};

useEffect(() => {
  if (telaAtual === "Sabores") {
    carregarPedidosLancados();
  }
}, [telaAtual]);
// === FIM FN04 ===
// === INÍCIO FN05 – salvarPedidoRapido: Salvar Pedido Detalhado com Itens e Valor ===
const salvarPedidoRapido = async () => {
  try {
    const totalPedido = itensPedido.reduce(
      (soma, item) => soma + item.quantidade * item.valorUnitario,
      0
    );

    const novoPedido = {
      cidade,
      escola,
      tabela: referenciaTabela,
      itens: itensPedido,
      dataVencimento,
      formaPagamento,
      totalPedido,
      statusEtapa: "Lançado",
      criadoEm: serverTimestamp(),
    };

    const pedidosRef = collection(db, "PEDIDOS");
    await addDoc(pedidosRef, novoPedido);

    // Resetar campos
    setCidade("");
    setEscola("");
    setReferenciaTabela("");
    setProdutoSelecionado("");
    setQuantidade(1);
    setValorUnitario(0);
    setItensPedido([]);
    setDataVencimento("");
    setFormaPagamento("");

    // Voltar à tela inicial
    setTelaAtual("PCP");

    // Atualizar pedidos exibidos
    carregarPedidosLancados();
  } catch (error) {
    console.error("Erro ao salvar pedido:", error);
  }
};
// === FIM FN05 ===
  // === INÍCIO FN06 – adicionarItemAoPedido ===
const adicionarItemAoPedido = () => {
  if (!produtoSelecionado || !quantidade || !valorUnitario) {
    alert("Preencha produto, quantidade e valor unitário.");
    return;
  }

  const novoItem = {
    produto: produtoSelecionado,
    quantidade: Number(quantidade),
    valorUnitario: Number(valorUnitario),
  };

  setItensPedido((prev) => [...prev, novoItem]);
  setProdutoSelecionado("");
  setQuantidade(1);
  setValorUnitario("");
};
// === FIM FN06 ===

// === INÍCIO FN07 – salvarPedidoRapido (Wrapper) ===
const salvarPedidoRapido = () => {
  salvarPedidoRapidoOriginal({
    cidade,
    escola,
    tabelaSelecionada: referenciaTabela,
    itensPedido,
    dataVencimento,
    formaPagamento,
    setCidade,
    setEscola,
    setTabelaSelecionada: setReferenciaTabela,
    setItensPedido,
    setDataVencimento,
    setFormaPagamento,
    setTelaAtual,
    carregarPedidosLancados,
  });
};
// === FIM FN07 ===
  // === RT99 – Return mínimo apenas para teste ===
  return (
    <>
{/* === INÍCIO RT0a – PCP: Tela Inicial com Botões === */}
{telaAtual === "PCP" && (
  <div className="min-h-screen bg-[#fdf8f5] flex flex-col items-center p-4">
    <img src="/LogomarcaDDnt2025Vazado.png" alt="Logomarca Dudunitê" className="w-40 mt-4 mb-2" />
    <h1 className="text-2xl font-bold text-[#a65a3d] mb-6">PCP – Planejamento e Controle de Produção</h1>
    <div className="flex flex-col space-y-4 w-full max-w-xs">
      <button
        className="bg-[#d38b5d] hover:bg-[#c3794a] text-white font-semibold py-3 px-6 rounded-xl shadow"
        onClick={() => setTelaAtual("Lancamento")}
      >
        📦 Lançar Pedido
      </button>
      <button
        className="bg-[#d38b5d] hover:bg-[#c3794a] text-white font-semibold py-3 px-6 rounded-xl shadow"
        onClick={() => setTelaAtual("Sabores")}
      >
        🍫 Alimentar Sabores
      </button>
    </div>
  </div>
)}
{/* === FIM RT0a === */}

{/* === INÍCIO RT0b – Lista de Pedidos Lançados === */}
{telaAtual === "PCP" && pedidosLancados.length > 0 && (
  <div className="mt-6 w-full max-w-xl bg-white p-4 rounded-lg shadow text-sm">
    <h2 className="text-lg font-bold mb-3 text-[#5C1D0E]">Pedidos já lançados</h2>
    <ul className="space-y-2">
      {pedidosLancados.map((pedido) => {
        const data = pedido.criadoEm?.toDate?.();
        const dataFormatada = data
          ? `${data.toLocaleDateString()} ${data.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
          : "Data desconhecida";
        return (
          <li
            key={pedido.id}
            className="flex justify-between items-center bg-[#f9f1e8] p-2 rounded border border-[#d3c0b0]"
          >
            <span>{dataFormatada} – {pedido.escola}</span>
            <button
              className="text-blue-700 hover:underline text-xs"
              onClick={() => alert(`Alterar pedido: ${pedido.id}`)}
            >
              Alterar Pedido
            </button>
          </li>
        );
      })}
    </ul>
  </div>
)}
{/* === FIM RT0b === */}

{/* === INÍCIO RT01 – Lançamento de Pedido Rápido com Itens e Valor === */}
{telaAtual === "Lancamento" && (
  <div className="bg-[#FFF3E9] min-h-screen p-4 text-sm font-sans text-[#5C1D0E]">
    <div className="max-w-xl mx-auto">
      <img src="/LogomarcaDDnt2025Vazado.png" alt="Dudunitê" className="w-48 mx-auto mb-4" />
      <h1 className="text-center text-xl font-bold mb-6">Lançamento de Pedido</h1>

      {/* Referência de Tabela */}
      <div className="mb-4">
        <label className="block font-semibold mb-1">Tabela de Preço</label>
        <select
          value={referenciaTabela}
          onChange={(e) => setReferenciaTabela(e.target.value)}
          className="w-full p-2 border rounded"
        >
          <option value="">Selecione</option>
          <option value="REV1">REV1</option>
          <option value="REV2">REV2</option>
          <option value="VAR1">VAR1</option>
          <option value="VAR2">VAR2</option>
        </select>
      </div>

      {/* Produto */}
      <div className="mb-4">
        <label className="block font-semibold mb-1">Produto</label>
        <select
          value={produtoSelecionado}
          onChange={(e) => setProdutoSelecionado(e.target.value)}
          className="w-full p-2 border rounded"
        >
          <option value="">Selecione</option>
          {produtos.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
      </div>

      {/* Quantidade */}
      <div className="mb-4">
        <label className="block font-semibold mb-1">Quantidade</label>
        <input
          type="number"
          value={quantidade}
          onChange={(e) => setQuantidade(e.target.value)}
          className="w-full p-2 border rounded"
        />
      </div>

      {/* Valor Unitário */}
      <div className="mb-4">
        <label className="block font-semibold mb-1">Valor Unitário</label>
        <input
          type="number"
          step="0.01"
          value={valorUnitario}
          onChange={(e) => setValorUnitario(e.target.value)}
          className="w-full p-2 border rounded"
        />
      </div>

      {/* Botão Adicionar Item */}
      <div className="mb-6">
        <button
          onClick={adicionarItemAoPedido}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded"
        >
          ➕ Adicionar Item
        </button>
      </div>

      {/* Lista de Itens Adicionados */}
      <div className="mb-6">
        <h2 className="font-bold mb-2">Itens do Pedido:</h2>
        {itensPedido.length === 0 ? (
          <p className="text-gray-600">Nenhum item adicionado ainda.</p>
        ) : (
          <>
            {itensPedido.map((item, index) => (
              <div key={index} className="flex justify-between border-b py-1">
                <span>{item.quantidade}x {item.produto}</span>
                <span>R$ {(item.quantidade * item.valorUnitario).toFixed(2)}</span>
              </div>
            ))}
            <div className="text-right font-bold mt-2">
              Total: R$ {itensPedido.reduce((acc, item) => acc + item.quantidade * item.valorUnitario, 0).toFixed(2)}
            </div>
          </>
        )}
      </div>

      {/* Forma de Pagamento */}
      <div className="mb-4">
        <label className="block font-semibold mb-1">Forma de Pagamento</label>
        <select
          value={formaPagamento}
          onChange={(e) => setFormaPagamento(e.target.value)}
          className="w-full p-2 border rounded"
        >
          <option value="">Selecione</option>
          <option value="PIX">PIX</option>
          <option value="Boleto">Boleto</option>
          <option value="Espécie">Espécie</option>
        </select>
      </div>

      {/* Data de Vencimento */}
      <div className="mb-6">
        <label className="block font-semibold mb-1">Data de Vencimento</label>
        <input
          type="date"
          value={dataVencimento}
          onChange={(e) => setDataVencimento(e.target.value)}
          className="w-full p-2 border rounded"
        />
      </div>

      {/* Botão Final de Salvamento */}
      <button
        onClick={salvarPedidoRapido}
        className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 rounded"
      >
        💾 Salvar Pedido
      </button>
    </div>
  </div>
)}
{/* === FIM RT01 === */}
    </>
  );
}

// === FIM RT99 ===
export default App;

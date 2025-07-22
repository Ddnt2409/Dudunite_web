// === FN01 – Importações Gerais ===
import React, { useState, useEffect } from "react";
import { collection, addDoc, getDocs, query, where, serverTimestamp } from "firebase/firestore";
import db from "./firebase";
// === FIM FN01 ===
// === FN02 – Cores e Logomarca (placeholder, não usado aqui) ===
const corPrimaria = "#8c3b1b";
const logoPath = "/LogomarcaDDnt2025Vazado.png";

// === FN03 – Componente App ===
function App() {
  // === FN03 – Estados Principais de Testes ===
  const [telaAtual, setTelaAtual] = useState("PCP");
  const [cidade, setCidade] = useState("");
  const [escola, setEscola] = useState("");
  const [produtoSelecionado, setProdutoSelecionado] = useState("");
  const [quantidade, setQuantidade] = useState(1);

  const cidades = ["Gravatá", "Recife", "Caruaru"];
  const produtos = ["BRW 7x7", "BRW 6x6", "PKT 5x5", "PKT 6x6", "Esc", "DUDU"];

  const escolasPorCidade = {
    Gravatá: ["Pequeno Príncipe", "Salesianas", "Céu Azul", "Russas", "Bora Gastar", "Kaduh", "Society Show", "Degusty"],
    Recife: ["Tio Valter", "Vera Cruz", "Pinheiros", "Dourado", "BMQ", "CFC", "Madre de Deus", "Saber Viver"],
    Caruaru: ["Interativo", "Exato Sede", "Exato Anexo", "Sesi", "Motivo", "Jesus Salvador"],
  };

  const escolasFiltradas = cidade ? escolasPorCidade[cidade] || [] : [];

  function salvarPedidoRapido() {
    alert("Pedido salvo (simulação)");
  }
  //FN03 - final
// === INÍCIO FN04 – Carregar pedidos com status 'Lançado' ===
const [pedidosLancados, setPedidosLancados] = useState([]);

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
// === INÍCIO FN05 – Salvar Pedido Rápido e Retornar à Tela Inicial ===
// === INÍCIO FN05 – Salvar Pedido Rápido e Retornar à Tela Inicial ===
const salvarPedidoRapido = async () => {
  try {
    const novoPedido = {
      cidade,
      escola,
      produto: produtoSelecionado,
      quantidade: Number(quantidade),
      statusEtapa: "Lançado",
      criadoEm: serverTimestamp(),
    };

    const pedidosRef = collection(db, "PEDIDOS");
    await addDoc(pedidosRef, novoPedido);

    // Resetar campos
    setCidade("");
    setEscola("");
    setProdutoSelecionado("");
    setQuantidade(1);

    // Voltar à tela principal
    setTelaAtual("PCP");

    // Atualizar lista de pedidos
    carregarPedidosLancados();
  } catch (error) {
    console.error("Erro ao salvar pedido:", error);
  }
};
// === FIM FN05 ===
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

      {/* === INÍCIO RT01 – Lançamento de Pedido Rápido === */}
      {telaAtual === "Lancamento" && (
        <div className="bg-[#FFF3E9] min-h-screen p-4 text-sm font-sans text-[#5C1D0E]">
          <div className="max-w-xl mx-auto">
            <img src="/LogomarcaDDnt2025Vazado.png" alt="Dudunitê" className="w-48 mx-auto mb-4" />
            <h1 className="text-center text-xl font-bold mb-6">Lançamento de Pedido Rápido</h1>

            <div className="mb-4">
              <label className="block font-semibold mb-1">Cidade</label>
              <select value={cidade} onChange={(e) => setCidade(e.target.value)} className="w-full p-2 border rounded">
                <option value="">Selecione</option>
                {cidades.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div className="mb-4">
              <label className="block font-semibold mb-1">Escola / PDV</label>
              <select
                value={escola}
                onChange={(e) => setEscola(e.target.value)}
                className="w-full p-2 border rounded"
                disabled={!cidade}
              >
                <option value="">Selecione</option>
                {escolasFiltradas.map((e) => (
                  <option key={e} value={e}>{e}</option>
                ))}
              </select>
            </div>

            <div className="mb-4">
              <label className="block font-semibold mb-1">Produto</label>
              <select value={produtoSelecionado} onChange={(e) => setProdutoSelecionado(e.target.value)} className="w-full p-2 border rounded">
                <option value="">Selecione</option>
                {produtos.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>

            <div className="mb-4">
              <label className="block font-semibold mb-1">Quantidade</label>
              <input
                type="number"
                value={quantidade}
                onChange={(e) => setQuantidade(e.target.value)}
                className="w-full p-2 border rounded"
              />
            </div>

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

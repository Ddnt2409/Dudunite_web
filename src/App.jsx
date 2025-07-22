// === FN01 – Importações Gerais ===
import React, { useState } from "react";

// === FN02 – Cores e Logomarca (placeholder, não usado aqui) ===
const corPrimaria = "#8c3b1b";
const logoPath = "/LogomarcaDDnt2025Vazado.png";

// === FN03 – Estado Principal ===
const App = () => {
  const [telaAtual, setTelaAtual] = useState("PCP");
// === INÍCIO FN03b – Cidades fixas ===
const cidades = ["Gravatá", "Recife", "Caruaru"];
// === FIM FN03b ===
  // === RT99 – Return mínimo apenas para teste ===
  return (
    <>
{/* === INÍCIO RT00 – PCP: Tela Inicial === */}
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
{/* === FIM RT00 === */}
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
};

export default App;

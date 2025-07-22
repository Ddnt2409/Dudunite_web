// === FN01 – Importações Gerais ===
import React, { useState } from "react";

// === FN02 – Cores e Logomarca (placeholder, não usado aqui) ===
const corPrimaria = "#8c3b1b";
const logoPath = "/LogomarcaDDnt2025Vazado.png";

// === FN03 – Estado Principal ===
const App = () => {
  const [telaAtual, setTelaAtual] = useState("PCP");

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
{/* === INÍCIO RT01 – Lançamento de Pedido Rápido (Teste mínimo) === */}
{telaAtual === "Lancamento" && (
  <div className="min-h-screen p-6 text-center">
    <h1 className="text-2xl font-bold text-green-800">🧪 RT01 OK</h1>
  </div>
)}
{/* === FIM RT01 === */}
    </>
  );
};

export default App;

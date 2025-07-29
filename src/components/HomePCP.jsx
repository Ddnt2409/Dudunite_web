// src/components/HomePCP.jsx
import React from 'react';

// FN – HomePCP
const HomePCP = () => {
  return (
    <div
      className="min-h-screen flex flex-col justify-between bg-cover bg-center"
      style={{ backgroundImage: `url(/bg001.png)` }}
    >
      {/* === INÍCIO RT00 – Tela PCP (Homepage) === */}

      {/* Cabeçalho com lente translúcida mais clara (+15%) */}
      <header className="flex justify-between items-center px-4 py-2 bg-white/25 backdrop-brightness-90 shadow-md">
        <img src="/LogomarcaDDnt2025Vazado.png" alt="Logomarca" className="h-20" />
        <h1 className="text-[1.5rem] font-bold text-[#8c3b1b]">ERP DUDUNITÊ</h1>
      </header>

      {/* Botão "PCP" menor, centralizado, metade da largura */}
      <div className="flex justify-center mt-8">
        <button className="bg-[#8c3b1b] text-white text-3xl font-bold py-3 px-6 rounded-xl shadow-xl w-1/2 hover:scale-105 transition-transform duration-300">
          PCP
        </button>
      </div>

      {/* Subtítulo menor */}
      <div className="text-center mt-3">
        <p className="text-lg text-[#8c3b1b] font-medium">
          Planejamento e Controle de Produção
        </p>
      </div>

      {/* Botões centrais em MAIÚSCULAS, com sombra 3D */}
      <div className="flex flex-col items-center gap-6 mt-12 px-6">
        <button className="bg-[#8c3b1b] text-white py-4 w-full max-w-xs rounded-2xl text-xl font-semibold uppercase shadow-2xl hover:scale-105 transition-transform duration-300">
          Lançar Pedido
        </button>
        <button className="bg-[#8c3b1b] text-white py-4 w-full max-w-xs rounded-2xl text-xl font-semibold uppercase shadow-2xl hover:scale-105 transition-transform duration-300">
          Alimentar Sabores
        </button>
      </div>

      {/* Rodapé com lente translúcida e texto centralizado */}
      <footer className="mt-auto bg-white/25 backdrop-brightness-90 text-center py-3 shadow-inner">
        <span className="text-[#8c3b1b] font-medium">Status de pedidos em tempo real</span>
      </footer>

      {/* === FIM RT00 === */}
    </div>
  );
};

export default HomePCP;

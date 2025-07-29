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

      {/* Cabeçalho com lente translúcida */}
      <header className="flex justify-between items-center px-4 py-2 bg-white/40 backdrop-brightness-75 shadow-md">
        <img src="/LogomarcaDDnt2025Vazado.png" alt="Logomarca" className="h-16" />
        <h1 className="text-[1.6rem] font-bold text-[#8c3b1b]">ERP DUDUNITÊ</h1>
      </header>

      {/* Título da página – PCP dividido em 2 linhas */}
      <div className="text-center mt-10">
        <h2 className="text-5xl font-bold text-[#8c3b1b] drop-shadow-md">PCP</h2>
        <p className="text-xl text-[#8c3b1b] font-medium mt-2">
          Planejamento e Controle de Produção
        </p>
      </div>

      {/* Botões centrais com 3D e profundidade */}
      <div className="flex flex-col items-center gap-6 mt-12 px-6">
        <button className="bg-[#8c3b1b] text-white py-4 w-full max-w-xs rounded-2xl text-xl shadow-2xl hover:scale-105 transition-transform duration-300">
          Lançar Pedido
        </button>
        <button className="bg-[#8c3b1b] text-white py-4 w-full max-w-xs rounded-2xl text-xl shadow-2xl hover:scale-105 transition-transform duration-300">
          Alimentar Sabores
        </button>
      </div>

      {/* Rodapé com lente igual ao cabeçalho */}
      <footer className="mt-auto bg-white/40 backdrop-brightness-75 text-center py-3 shadow-inner">
        <span className="text-[#8c3b1b] font-medium">Status de pedidos em tempo real</span>
      </footer>

      {/* === FIM RT00 === */}
    </div>
  );
};

export default HomePCP;

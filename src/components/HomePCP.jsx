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

      {/* Cabeçalho com lente e logomarca */}
      <header className="flex justify-between items-center px-4 py-2 bg-white/70 backdrop-blur-sm shadow-md">
        <img src="/LogomarcaDDnt2025Vazado.png" alt="Logomarca" className="h-12" />
        <h1 className="text-2xl font-bold text-[#8c3b1b]">ERP DUDUNITÊ</h1>
      </header>

      {/* Título da página */}
      <div className="text-center mt-10">
        <h2 className="text-4xl font-semibold text-[#8c3b1b] drop-shadow-md">PCP – Planejamento e Controle de Produção</h2>
      </div>

      {/* Botões centrais */}
      <div className="flex flex-col items-center gap-6 mt-12">
        <button className="bg-[#8c3b1b] text-white px-6 py-3 rounded-2xl text-xl shadow-lg hover:scale-105 transition">
          Lançar Pedido
        </button>
        <button className="bg-[#8c3b1b] text-white px-6 py-3 rounded-2xl text-xl shadow-lg hover:scale-105 transition">
          Alimentar Sabores
        </button>
      </div>

      {/* Rodapé com lente */}
      <footer className="mt-auto bg-white/70 backdrop-blur-sm text-center py-3 shadow-inner">
        <span className="text-[#8c3b1b] font-medium">Status de pedidos em tempo real</span>
      </footer>

      {/* === FIM RT00 === */}
    </div>
  );
};

export default HomePCP;

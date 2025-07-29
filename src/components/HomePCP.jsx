// src/components/HomePCP.jsx
import React from 'react';

const HomePCP = () => {
  return (
    <div
      className="min-h-screen flex flex-col justify-between bg-cover bg-center"
      style={{ backgroundImage: `url(/bg001.png)` }}
    >
      {/* === INÍCIO RT00 – Tela PCP (Homepage) === */}

      {/* Cabeçalho com lente e ajustes */}
      <header className="w-full flex justify-between items-center px-4 py-2 bg-white/20 backdrop-brightness-90 rounded-b-md h-16">
        <img src="/LogomarcaDDnt2025Vazado.png" alt="Logomarca" className="h-[90px]" />
        <h1 className="text-[1.2rem] font-bold text-[#8c3b1b] text-right leading-tight">
          ERP<br />DUDUNITÊ
        </h1>
      </header>

      {/* Botão PCP */}
      <div className="flex justify-center mt-8">
        <button className="bg-[#8c3b1b] text-white text-3xl font-bold py-3 px-6 rounded-xl w-1/2 transition duration-300 shadow-[0_6px_12px_rgba(0,0,0,0.4)] hover:shadow-[0_8px_16px_rgba(0,0,0,0.5)]">
          PCP
        </button>
      </div>

      {/* Frase central com negrito */}
      <div className="flex justify-center mt-4">
        <div className="bg-white/20 backdrop-brightness-90 px-4 py-2 rounded-md">
          <p className="text-lg text-[#8c3b1b] font-bold text-center">
            Planejamento e Controle de Produção
          </p>
        </div>
      </div>

      {/* Botões principais com efeito 3D (sombra mais forte) */}
      <div className="flex flex-col items-center gap-6 mt-[5rem] px-6">
        <button className="bg-[#8c3b1b] text-white py-4 w-full max-w-xs rounded-2xl text-xl font-semibold uppercase shadow-[0_6px_12px_rgba(0,0,0,0.4)] hover:shadow-[0_8px_16px_rgba(0,0,0,0.5)] transition duration-300">
          Lançar Pedido
        </button>
        <button className="bg-[#8c3b1b] text-white py-4 w-full max-w-xs rounded-2xl text-xl font-semibold uppercase shadow-[0_6px_12px_rgba(0,0,0,0.4)] hover:shadow-[0_8px_16px_rgba(0,0,0,0.5)] transition duration-300">
          Alimentar Sabores
        </button>
      </div>

      {/* Rodapé com a mesma lente do cabeçalho */}
      <footer className="mt-auto bg-white/20 backdrop-brightness-90 text-center py-3">
        <span className="text-[#8c3b1b] font-medium">Status de pedidos em tempo real</span>
      </footer>

      {/* === FIM RT00 === */}
    </div>
  );
};

export default HomePCP;

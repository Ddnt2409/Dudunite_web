// src/components/HomePCP.jsx
import React from 'react';

const HomePCP = () => {
  return (
    <div
      className="min-h-screen flex flex-col justify-between bg-cover bg-center"
      style={{ backgroundImage: `url(/bg001.png)` }}
    >
      {/* === INÍCIO RT00 – Tela PCP (Homepage) === */}

      {/* Cabeçalho com altura reduzida em 25% */}
      <header className="w-full flex justify-between items-center px-4 py-2 bg-white/20 backdrop-brightness-90 rounded-b-md h-16">
        <img src="/LogomarcaDDnt2025Vazado.png" alt="Logomarca" className="h-full" />
        <h1 className="text-[1.5rem] font-bold text-[#8c3b1b]">ERP DUDUNITÊ</h1>
      </header>

      {/* Botão "PCP" */}
      <div className="flex justify-center mt-8">
        <button className="bg-[#8c3b1b] text-white text-3xl font-bold py-3 px-6 rounded-xl w-1/2 transition duration-300 shadow-lg hover:shadow-xl">
          PCP
        </button>
      </div>

      {/* Frase central em negrito */}
      <div className="flex justify-center mt-4">
        <div className="bg-white/20 backdrop-brightness-90 px-4 py-2 rounded-md">
          <p className="text-lg text-[#8c3b1b] font-bold text-center">
            Planejamento e Controle de Produção
          </p>
        </div>
      </div>

      {/* Botões com sombra de desfocagem (3D leve) */}
      <div className="flex flex-col items-center gap-6 mt-[5rem] px-6">
        <button className="bg-[#8c3b1b] text-white py-4 w-full max-w-xs rounded-2xl text-xl font-semibold uppercase shadow-lg hover:shadow-xl transition duration-300">
          Lançar Pedido
        </button>
        <button className="bg-[#8c3b1b] text-white py-4 w-full max-w-xs rounded-2xl text-xl font-semibold uppercase shadow-lg hover:shadow-xl transition duration-300">
          Alimentar Sabores
        </button>
      </div>

      {/* Rodapé */}
      <footer className="mt-auto bg-white/20 backdrop-brightness-90 text-center py-3">
        <span className="text-[#8c3b1b] font-medium">Status de pedidos em tempo real</span>
      </footer>

      {/* === FIM RT00 === */}
    </div>
  );
};

export default HomePCP;

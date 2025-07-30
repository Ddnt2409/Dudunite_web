// HomePCP.jsx

import React from 'react';

// RT00 – Tela PCP (Homepage)
const HomePCP = () => {
  return (
    <>
      {/* === INÍCIO RT00 – Tela PCP (Homepage) === */}
      <div className="min-h-screen flex flex-col justify-between bg-cover bg-center" style={{ backgroundImage: `url('/bg001.png')` }}>
        
        {/* Cabeçalho translúcido com logomarca e título */}
        <header className="bg-white bg-opacity-85 p-4 flex items-center justify-between shadow-md">
          <img
            src="/LogomarcaDDnt2025Vazado.png"
            alt="Logomarca"
            className="h-20 sm:h-24 md:h-28 lg:h-32" // aumento da logomarca em 40%
          />
          <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-[#8c3b1b] tracking-widest">
            ERP DUDUNITÊ
          </h1>
        </header>

        {/* Nome da tela com tarja translúcida */}
        <div className="mx-auto mt-4 bg-white bg-opacity-70 px-6 py-2 rounded-lg shadow">
          <h2 className="text-center text-lg md:text-2xl font-bold text-[#8c3b1b]">
            PLANEJAMENTO E CONTROLE DE PRODUÇÃO
          </h2>
        </div>

        {/* Botões principais */}
        <div className="flex flex-col items-center justify-center mt-10 space-y-6 px-4">
          {/* Botão PCP central */}
          <button
            className="w-1/2 py-3 bg-[#8c3b1b] text-white font-bold text-lg rounded-lg shadow-lg hover:shadow-2xl transition-shadow duration-300"
          >
            PCP
          </button>

          {/* Botão Lançar Pedido */}
          <button
            className="w-4/5 py-4 bg-[#8c3b1b] text-white font-bold text-xl rounded-xl shadow-xl hover:shadow-2xl uppercase"
          >
            LANÇAR PEDIDO
          </button>

          {/* Botão Alimentar Sabores */}
          <button
            className="w-4/5 py-4 bg-[#8c3b1b] text-white font-bold text-xl rounded-xl shadow-xl hover:shadow-2xl uppercase"
          >
            ALIMENTAR SABORES
          </button>
        </div>

        {/* Rodapé com status */}
        <footer className="bg-[#8c3b1b] text-white text-center py-2 mt-16">
          <marquee behavior="scroll" direction="left" className="text-sm">
            Status em tempo real: Russas • Degusty • Society Show • Kaduh
          </marquee>
        </footer>
      </div>
      {/* === FIM RT00 === */}

      {/* === RESERVA RT01 === */}
      {/* === RESERVA RT02 === */}
      {/* === RESERVA RT03 === */}
      {/* === RESERVA RT04 === */}
      {/* === RESERVA RT05 === */}
      {/* === RESERVA RT06 === */}
    </>
  );
};

export default HomePCP;

// === INÍCIO RT00 – Tela PCP (Homepage) ===
import React from 'react';
import logoPath from '../assets/LogomarcaDDnt2025Vazado.png';
import bg001 from '../assets/bg001.png';

const HomePCP = () => {
  return (
    <div
      className="min-h-screen flex flex-col justify-between bg-cover bg-center"
      style={{ backgroundImage: `url(${bg001})` }}
    >
      {/* === Cabeçalho com lente translúcida === */}
      <header className="flex items-center justify-between px-6 py-3 bg-white/35 backdrop-blur-sm shadow-md">
        <img
          src={logoPath}
          alt="Logomarca"
          className="h-16 md:h-20" // Aumento de 20%
        />
        <h1 className="text-2xl md:text-3xl font-bold text-[#8c3b1b] tracking-wide">
          ERP DUDUNITÊ
        </h1>
      </header>

      {/* === Título da tela === */}
      <div className="text-center mt-4">
        <div className="bg-white/35 backdrop-blur-sm inline-block px-4 py-2 rounded-md">
          <h2 className="text-4xl font-extrabold tracking-wide text-[#8c3b1b]">PCP</h2>
          <p className="text-md font-semibold text-[#8c3b1b]">Planejamento e Controle de Produção</p>
        </div>
      </div>

      {/* === Botões principais === */}
      <div className="flex flex-col items-center gap-6 mt-8">
        <button
          className="w-72 py-4 bg-[#8c3b1b] text-white font-bold rounded-xl uppercase shadow-[0_10px_30px_rgba(0,0,0,0.4)] hover:scale-105 transition"
        >
          Lançar Pedido
        </button>
        <button
          className="w-72 py-4 bg-[#8c3b1b] text-white font-bold rounded-xl uppercase shadow-[0_10px_30px_rgba(0,0,0,0.4)] hover:scale-105 transition"
        >
          Alimentar Sabores
        </button>
      </div>

      {/* === Rodapé translúcido com status dos pedidos === */}
      <footer className="mt-[6rem] bg-white/30 backdrop-blur-sm text-[#8c3b1b] text-sm py-3 px-6">
        <div className="whitespace-nowrap animate-marquee">
          Status dos pedidos em tempo real • Russas - ● PENDENTE • Bora Gastar - ● ENTREGUE • Kaduh - ● PRODUÇÃO
        </div>
      </footer>
    </div>
  );
};

export default HomePCP;
// === FIM RT00 ===

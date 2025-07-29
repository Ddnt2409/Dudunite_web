// src/components/HomePCP.jsx
import React from 'react';
import logoPath from './assets/LogomarcaDDnt2025Vazado.png';
import bg001 from './assets/bg001.png';

const HomePCP = () => {
  return (
    <div
      className="min-h-screen flex flex-col justify-between bg-cover bg-center"
      style={{ backgroundImage: `url(${bg001})` }}
    >
      {/* === INÍCIO RT00 – Tela PCP (Homepage) === */}

      {/* Cabeçalho com lente */}
      <header className="bg-black bg-opacity-40 text-white p-4 flex justify-between items-center">
        <img src={logoPath} alt="Logomarca" className="h-12" />
        <h1 className="text-xl font-bold">ERP DUDUNITÊ</h1>
      </header>

      {/* Título PCP */}
      <div className="text-center mt-8">
        <h2 className="text-3xl font-bold text-white drop-shadow">PCP</h2>
      </div>

      {/* Botões principais */}
      <div className="flex flex-col items-center justify-center gap-6 mt-10">
        <button className="bg-white bg-opacity-90 text-terra font-semibold py-3 px-8 rounded-2xl shadow-md hover:bg-opacity-100">
          Lançar Pedido
        </button>
        <button className="bg-white bg-opacity-90 text-terra font-semibold py-3 px-8 rounded-2xl shadow-md hover:bg-opacity-100">
          Alimentar Sabores
        </button>
      </div>

      {/* Rodapé com lente */}
      <footer className="bg-black bg-opacity-40 text-white p-4 text-center mt-10">
        <p className="text-sm">© 2025 Dudunitê. Todos os direitos reservados.</p>
      </footer>

      {/* === FIM RT00 === */}
    </div>
  );
};

export default HomePCP;

// HomePCP.jsx import React from 'react'; import logoPath from './assets/LogomarcaDDnt2025Vazado.png'; import bg001 from './assets/bg001.png';

const HomePCP = () => { return ( <div className="min-h-screen flex flex-col justify-between bg-cover bg-center" style={{ backgroundImage: url(${bg001}) }} > {/* === INÍCIO RT00 – Tela PCP (Homepage) === */}

{/* Cabeçalho com lente */}
  <div className="w-full bg-black bg-opacity-50 flex items-center justify-between px-6 py-4">
    <img src={logoPath} alt="Logomarca" className="h-12" />
    <h1 className="text-white text-2xl font-bold">ERP DUDUNITÊ</h1>
  </div>

  {/* Título Central */}
  <div className="flex flex-col items-center mt-10">
    <h2 className="text-white text-3xl font-bold bg-black bg-opacity-40 px-4 py-2 rounded-xl">
      PCP – Planejamento e Controle de Produção
    </h2>
  </div>

  {/* Botões centrais */}
  <div className="flex flex-col sm:flex-row justify-center items-center gap-6 mt-12">
    <button
      onClick={() => console.log('Lançar Pedido')}
      className="bg-[#8c3b1b] text-white px-8 py-4 rounded-2xl shadow-md hover:scale-105 transition-transform"
    >
      Lançar Pedido
    </button>
    <button
      onClick={() => console.log('Alimentar Sabores')}
      className="bg-[#8c3b1b] text-white px-8 py-4 rounded-2xl shadow-md hover:scale-105 transition-transform"
    >
      Alimentar Sabores
    </button>
  </div>

  {/* Rodapé com lente */}
  <footer className="w-full bg-black bg-opacity-50 text-center py-4 mt-20">
    <p className="text-white text-sm">© 2025 Dudunitê. Todos os direitos reservados.</p>
  </footer>

  {/* === FIM RT00 === */}
</div>

); };

export default HomePCP;


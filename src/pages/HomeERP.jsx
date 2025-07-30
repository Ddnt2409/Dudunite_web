// === HomeERP.jsx – Tela principal ERP Dudunitê ===
import React, { useState, useRef } from 'react';

const HomeERP = () => {
  const [moduloAtivo, setModuloAtivo] = useState(1); // Começa no PCP
  const startX = useRef(null);

  const handleTouchStart = (e) => {
    startX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e) => {
    if (startX.current === null) return;
    const currentX = e.touches[0].clientX;
    const diffX = currentX - startX.current;

    if (diffX > 50 && moduloAtivo > 1) {
      setModuloAtivo(moduloAtivo - 1);
      startX.current = null;
    } else if (diffX < -50 && moduloAtivo < 3) {
      setModuloAtivo(moduloAtivo + 1);
      startX.current = null;
    }
  };

  const renderModulo = () => {
    switch (moduloAtivo) {
      case 1:
        return (
          <div className="flex flex-col items-center mt-8">
            <h1 className="text-4xl font-bold text-[#8c3b1b] mb-4">Produção</h1>
            <div className="bg-[#f6e9df] rounded-2xl shadow-md p-6 text-center w-64">
              <p className="font-semibold text-[#8c3b1b] mb-2">PCP</p>
              <p className="text-[#8c3b1b]">Lançar Pedido</p>
              <p className="text-[#8c3b1b]">Alimentar Sabores</p>
              <p className="text-[#8c3b1b]">Cozinha</p>
              <p className="text-[#8c3b1b]">Status dos pedidos</p>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="flex flex-col items-center mt-8">
            <h1 className="text-4xl font-bold text-[#8c3b1b] mb-4">Financeiro</h1>
            <div className="bg-[#f6e9df] rounded-2xl shadow-md p-6 text-center w-64">
              <p className="font-semibold text-[#8c3b1b] mb-2">FinFlux</p>
              <p className="text-[#8c3b1b]">Contas a Pagar</p>
              <p className="text-[#8c3b1b]">Contas a Receber</p>
              <p className="text-[#8c3b1b]">Fluxo de Caixa</p>
            </div>
          </div>
        );
      case 3:
        return (
          <div className="flex flex-col items-center mt-8">
            <h1 className="text-4xl font-bold text-[#8c3b1b] mb-4">Resultados</h1>
            <div className="bg-[#f6e9df] rounded-2xl shadow-md p-6 text-center w-64">
              <p className="font-semibold text-[#8c3b1b] mb-2">Análise</p>
              <p className="text-[#8c3b1b]">Custos</p>
              <p className="text-[#8c3b1b]">Vendas</p>
              <p className="text-[#8c3b1b]">Lucros</p>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col justify-between bg-cover bg-center"
      style={{ backgroundImage: 'url("/bg002.png")' }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
    >
      {/* === Cabeçalho Translúcido === */}
      <header className="bg-white bg-opacity-50 flex justify-between items-center p-4">
        <img
          src="/LogomarcaDDnt2025Vazado.png"
          alt="Logomarca Dudunitê"
          className="h-12"
        />
        <h1 className="text-2xl font-bold text-[#8c3b1b]">ERP DUDUNITÊ</h1>
      </header>

      {/* === Conteúdo Central === */}
      <main className="flex-1 flex items-center justify-center">
        {renderModulo()}
      </main>

      {/* === Rodapé Status === */}
      <footer className="bg-[#8c3b1b] text-white p-2 text-center text-sm animate-marquee whitespace-nowrap overflow-hidden">
        <div className="inline-block animate-marquee-content">
          luh • Society Show • Degusty • Tio Valter • Vera Cruz • Pequeno Príncipe • Russas • Kaduh • Salesianas • Céu Azul
        </div>
      </footer>

      {/* === Estilos Animados do Rodapé === */}
      <style jsx>{`
        @keyframes marquee {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
        .animate-marquee-content {
          display: inline-block;
          padding-left: 100%;
          animation: marquee 20s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default HomeERP;

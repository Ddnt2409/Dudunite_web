// === HomeERP.jsx – Tela Principal do ERP Dudunitê ===
import React, { useState, useRef } from 'react';

const HomeERP = () => {
  const [moduloAtivo, setModuloAtivo] = useState(1);
  const [mostrarFuncoes, setMostrarFuncoes] = useState(false);
  const startX = useRef(null);

  const handleTouchStart = (e) => {
    startX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e) => {
    if (startX.current === null) return;
    const currentX = e.touches[0].clientX;
    const diffX = currentX - startX.current;

    if (diffX > 60 && moduloAtivo > 1) {
      setModuloAtivo(moduloAtivo - 1);
      setMostrarFuncoes(false);
      startX.current = null;
    } else if (diffX < -60 && moduloAtivo < 3) {
      setModuloAtivo(moduloAtivo + 1);
      setMostrarFuncoes(false);
      startX.current = null;
    }
  };

  const getModuloNome = () => {
    switch (moduloAtivo) {
      case 1: return "Produção";
      case 2: return "Financeiro";
      case 3: return "Resultados";
      default: return "";
    }
  };

  const getModuloFuncoes = () => {
    switch (moduloAtivo) {
      case 1:
        return ["Lançar Pedido", "Alimentar Sabores", "Cozinha", "Status dos pedidos"];
      case 2:
        return ["Contas a Pagar", "Contas a Receber", "Fluxo de Caixa"];
      case 3:
        return ["Custos", "Vendas", "Lucros"];
      default:
        return [];
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col justify-between bg-cover bg-center"
      style={{ backgroundImage: 'url("/bg002.png")' }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
    >
      {/* === Cabeçalho (igual ao HomePCP) === */}
      <header className="bg-[#fff5ec] flex items-center justify-between px-4 py-3">
        <img src="/LogomarcaDDnt2025Vazado.png" alt="Logomarca" className="h-10" />
        <h1 className="text-2xl font-bold text-[#8c3b1b]">ERP DUDUNITÊ</h1>
      </header>

      {/* === Conteúdo Central com Cartões === */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 relative overflow-hidden">
        <div className="w-full flex justify-center items-center">
          <div
            className="w-72 bg-[#fff5ec] rounded-3xl shadow-lg p-6 text-center transition-transform duration-500"
            style={{ transform: `translateX(${(1 - moduloAtivo) * 100}%)` }}
          >
            <h2
              className="text-2xl font-bold text-[#8c3b1b] mb-4"
              onClick={() => setMostrarFuncoes(!mostrarFuncoes)}
            >
              {getModuloNome()}
            </h2>
            {mostrarFuncoes && (
              <div className="flex flex-col gap-3">
                {getModuloFuncoes().map((funcao, index) => (
                  <button
                    key={index}
                    className="bg-white text-[#8c3b1b] border border-[#8c3b1b] py-2 rounded-xl shadow"
                  >
                    {funcao}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* === Rodapé animado com status dos PDVs === */}
      <footer className="bg-[#8c3b1b] text-white text-sm p-2 overflow-hidden relative">
        <div className="absolute whitespace-nowrap animate-marquee">
          Russas • Society Show • Degusty • Tio Valter • Vera Cruz • Céu Azul • Pequeno Príncipe • Kaduh • Salesianas
        </div>
      </footer>

      {/* === Estilos adicionais === */}
      <style jsx>{`
        @keyframes marquee {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
        .animate-marquee {
          display: inline-block;
          animation: marquee 20s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default HomeERP;

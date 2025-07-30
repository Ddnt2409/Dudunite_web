// === HomeERP.jsx – Tela principal ERP Dudunitê ===
import React, { useState, useRef } from 'react';

const HomeERP = () => {
  const [moduloAtivo, setModuloAtivo] = useState(1);
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
      startX.current = null;
    } else if (diffX < -60 && moduloAtivo < 3) {
      setModuloAtivo(moduloAtivo + 1);
      startX.current = null;
    }
  };

  const getModuloNome = () => {
    switch (moduloAtivo) {
      case 1: return "PRODUÇÃO";
      case 2: return "FINANCEIRO";
      case 3: return "RESULTADOS";
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
      {/* === Cabeçalho === */}
      <header className="bg-white bg-opacity-50 flex justify-between items-center px-4 py-2">
        <img src="/LogomarcaDDnt2025Vazado.png" alt="Logomarca" className="h-10" />
        <h1 className="text-xl font-bold text-[#8c3b1b]">ERP DUDUNITÊ</h1>
      </header>

      {/* === Conteúdo === */}
      <main className="flex-1 flex flex-col items-center justify-center px-4">
        {/* Botão central quadrado */}
        <div className="w-52 h-52 bg-[#fff5ec] rounded-2xl shadow-md flex items-center justify-center mb-4">
          <h2 className="text-2xl font-bold text-[#8c3b1b] text-center">{getModuloNome()}</h2>
        </div>

        {/* Botões laterais das funções */}
        <div className="flex gap-4 flex-wrap justify-center">
          {getModuloFuncoes().map((funcao, index) => (
            <button
              key={index}
              className="bg-white text-[#8c3b1b] border border-[#8c3b1b] px-4 py-2 rounded-xl text-sm shadow-md"
            >
              {funcao}
            </button>
          ))}
        </div>
      </main>

      {/* === Rodapé animado === */}
      <footer className="bg-[#8c3b1b] text-white text-sm p-2 overflow-hidden relative">
        <div className="absolute whitespace-nowrap animate-marquee">
          luh • Society Show • Degusty • Tio Valter • Vera Cruz • Pequeno Príncipe • Russas • Kaduh • Salesianas • Céu Azul
        </div>
      </footer>

      {/* === Estilo do rodapé === */}
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

// === HomeERP.jsx – Tela principal ERP Dudunitê ===
import React, { useState, useRef } from 'react';
import '../../public/LogomarcaDDnt2025Vazado.png';
import '../../public/BG002.png';

const HomeERP = () => {
  const [moduloAtivo, setModuloAtivo] = useState(1); // Começa no PCP
  const startX = useRef(null);

  const modulos = [
    {
      nome: 'Adm',
      conteudo: ['Cadastro', 'Permissões', 'Usuários'],
    },
    {
      nome: 'Produção',
      conteudo: ['Lançar Pedido', 'Alimentar Sabores', 'Cozinha', 'Status dos pedidos'],
    },
    {
      nome: 'Financeiro',
      conteudo: ['Contas a Pagar', 'Contas a Receber', 'Fluxo de Caixa'],
    },
  ];

  const handleTouchStart = (e) => {
    startX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e) => {
    if (startX.current === null) return;
    const endX = e.changedTouches[0].clientX;
    const diffX = startX.current - endX;

    if (diffX > 50) {
      // deslizou para esquerda
      setModuloAtivo((moduloAtivo + 1) % modulos.length);
    } else if (diffX < -50) {
      // deslizou para direita
      setModuloAtivo((moduloAtivo - 1 + modulos.length) % modulos.length);
    }

    startX.current = null;
  };

  return (
    <div
      className="min-h-screen bg-[#fff5ec] flex flex-col justify-between items-center p-4 relative overflow-hidden"
      style={{
        backgroundImage: 'url("/BG002.png")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >

      {/* === Cabeçalho === */}
      <header className="w-full flex justify-between items-center px-4 py-2 bg-white/30 backdrop-blur-md rounded-b-xl">
        <img src="/LogomarcaDDnt2025Vazado.png" alt="Logomarca Dudunitê" className="h-12" />
        <span className="text-[#8c3b1b] font-semibold text-lg">ERP DUDUNITÊ</span>
      </header>

      {/* === Módulo Ativo === */}
      <div className="flex-1 flex flex-col justify-center items-center space-y-4">

        <div className="flex items-center space-x-4 mt-4 transition-all duration-500">

          {/* Módulo anterior */}
          <div className="opacity-40 scale-90 transition-all duration-300">
            <div className="bg-[#f2e0d5] p-4 rounded-3xl text-center w-40">
              <p className="text-[#8c3b1b] text-lg font-bold">{modulos[(moduloAtivo + 2) % 3].nome}</p>
            </div>
          </div>

          {/* Módulo ativo */}
          <div className="bg-[#f2e0d5] p-6 rounded-3xl shadow-lg text-center w-56 scale-105 transition-all duration-300">
            <p className="text-[#8c3b1b] text-xl font-bold">{modulos[moduloAtivo].nome}</p>
            <ul className="mt-2 space-y-1 text-[#8c3b1b] text-sm">
              {modulos[moduloAtivo].conteudo.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          </div>

          {/* Módulo seguinte */}
          <div className="opacity-40 scale-90 transition-all duration-300">
            <div className="bg-[#f2e0d5] p-4 rounded-3xl text-center w-40">
              <p className="text-[#8c3b1b] text-lg font-bold">{modulos[(moduloAtivo + 1) % 3].nome}</p>
            </div>
          </div>
        </div>
      </div>

      {/* === Rodapé animado === */}
      <footer className="w-full py-2 bg-[#8c3b1b] overflow-hidden">
        <div className="animate-marquee whitespace-nowrap text-white text-sm px-4">
          luh • Society Show • Degusty • Tio Valter • Vera Cruz • Pinheiros • Céu Azul • Russas • Madre de Deus • Bora Gastar • Kaduh • BMQ • CFC • Saber Viver • Interativo • Exato Sede • Exato Anexo • Sesi • Jesus Salvador
        </div>
      </footer>
    </div>
  );
};

export default HomeERP;

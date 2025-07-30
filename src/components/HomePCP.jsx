// === RT00 – Início – Página Inicial PCP ===
import React from 'react';
import logo from '/LogomarcaDDnt2025Vazado.png';

const HomePCP = () => {
  return (
    <div className="min-h-screen bg-cover bg-center bg-no-repeat" style={{ backgroundImage: "url('/bg_dudus2.jpg')" }}>
      {/* === INÍCIO RT00 – Cabeçalho === */}
      <div className="flex justify-between items-center px-6 py-4"
           style={{ backgroundColor: 'rgba(255, 245, 236, 0.6)', height: '60px' }}>
        <img src={logo} alt="Logo" className="h-[48px]" />
        <h1 className="text-xl font-bold text-[#8c3b1b]" style={{ fontSize: '1.125rem' }}>
          ERP DUDUNITÊ
        </h1>
      </div>
      {/* === FIM RT00 – Cabeçalho === */}

      {/* === INÍCIO RT00 – Título e Botões === */}
      <div className="flex flex-col items-center justify-center mt-6 space-y-4 px-4">
        <h2 className="text-2xl font-bold text-white py-1 px-4 rounded-lg"
            style={{
              backgroundColor: 'rgba(255, 245, 236, 0.6)',
              fontSize: '1.75rem'
            }}>
          PCP
        </h2>
        <h3 className="text-md font-semibold text-[#8c3b1b] tracking-wide"
            style={{
              backgroundColor: 'rgba(255, 245, 236, 0.6)',
              padding: '4px 12px',
              borderRadius: '0.5rem',
              fontSize: '0.875rem'
            }}>
          PLANEJAMENTO E CONTROLE DE PRODUÇÃO
        </h3>

        <button className="w-72 py-3 rounded-xl text-white font-bold shadow-2xl"
                style={{
                  backgroundColor: '#8c3b1b',
                  boxShadow: '0px 8px 20px rgba(0, 0, 0, 0.4)'
                }}>
          LANÇAR PEDIDO
        </button>

        <button className="w-72 py-3 rounded-xl text-white font-bold shadow-2xl"
                style={{
                  backgroundColor: '#8c3b1b',
                  boxShadow: '0px 8px 20px rgba(0, 0, 0, 0.4)'
                }}>
          ALIMENTAR SABORES
        </button>
      </div>
      {/* === FIM RT00 – Título e Botões === */}

      {/* === INÍCIO RT00 – Rodapé === */}
      <div className="absolute bottom-0 w-full text-center py-3 text-white text-sm"
           style={{
             backgroundColor: 'rgba(140, 59, 27, 0.6)',
             fontSize: '0.85rem'
           }}>
        • Degusty • Society Show • Kaduh
      </div>
      {/* === FIM RT00 – Rodapé === */}
    </div>
  );
};

export default HomePCP;
// === FIM RT00 – Página Inicial PCP ===

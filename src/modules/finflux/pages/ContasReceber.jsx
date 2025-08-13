// === INÍCIO Rec01 – Tela Contas a Receber (Visual) ===

import React, { useState } from 'react';

const ContasReceber = () => {
  const [modo, setModo] = useState('pedidos'); // 'pedidos' ou 'avulso'

  return (
    <div className="p-4 bg-[#FFF3E9] min-h-screen text-[#5C1D0E]">
      <h2 className="text-2xl font-bold mb-4">Contas a Receber</h2>

      {/* Botões de Alternância */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => setModo('pedidos')}
          className={`py-2 px-4 rounded ${modo === 'pedidos' ? 'bg-orange-600 text-white' : 'bg-gray-300 text-black'}`}
        >
          📥 Pedidos Acumulados
        </button>
        <button
          onClick={() => setModo('avulso')}
          className={`py-2 px-4 rounded ${modo === 'avulso' ? 'bg-orange-600 text-white' : 'bg-gray-300 text-black'}`}
        >
          📝 Lançamento Avulso
        </button>
      </div>

      {/* MODO: PEDIDOS ACUMULADOS */}
      {modo === 'pedidos' && (
        <div className="border rounded-lg p-4 bg-white shadow-sm">
          <h3 className="text-xl font-semibold mb-2">Pedidos pendentes de aprovação</h3>
          <p className="text-sm mb-4 text-gray-600">Aqui serão exibidos os pedidos lançados no Módulo 1 que ainda aguardam aprovação.</p>
          <div className="text-gray-500 italic">🔄 Em breve: carregamento automático de pedidos do Firebase.</div>
        </div>
      )}

      {/* MODO: LANÇAMENTO AVULSO */}
      {modo === 'avulso' && (
        <div className="border rounded-lg p-4 bg-white shadow-sm">
          <h3 className="text-xl font-semibold mb-2">Lançamento Avulso de Varejo</h3>
          <p className="text-sm mb-4 text-gray-600">Use esse formulário para registrar uma venda de varejo manual.</p>

          <form className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm mb-1">Produto</label>
              <select className="w-full border border-gray-300 rounded p-2 bg-white">
                <option>Selecione um produto</option>
              </select>
            </div>

            <div>
              <label className="block text-sm mb-1">Quantidade</label>
              <input type="number" className="w-full border border-gray-300 rounded p-2" />
            </div>

            <div>
              <label className="block text-sm mb-1">Valor Unitário</label>
              <input type="number" step="0.01" className="w-full border border-gray-300 rounded p-2" />
            </div>

            <div>
              <label className="block text-sm mb-1">Forma de Pagamento</label>
              <select className="w-full border border-gray-300 rounded p-2 bg-white">
                <option>PIX</option>
                <option>Espécie</option>
                <option>Cartão</option>
                <option>Boleto</option>
              </select>
            </div>

            <div>
              <label className="block text-sm mb-1">Vencimento</label>
              <input type="date" className="w-full border border-gray-300 rounded p-2" />
            </div>
          </form>

          <div className="mt-6">
            <button className="bg-orange-600 hover:bg-orange-700 text-white py-2 px-4 rounded">
              💾 Lançar no Contas a Receber
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContasReceber;

// === FIM Rec01 ===

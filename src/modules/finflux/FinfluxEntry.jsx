// === PORTO SEGURO DO MÓDULO 2 ===
// === FNintroFinFlux – ENTRY ÚNICO (sem imports externos) ===

import React, { useState } from 'react';

// ---- Componentes internos (stubs) para não precisar criar arquivos ----
const FnFin006_TabelaPrecos = () => (
  <div className="text-lg">🧾 Tabela de Preços — em breve (integração com Firestore do Módulo 1).</div>
);

const FnFin007_CtsReceber = ({ planoContas = [] }) => (
  <div className="text-lg">
    💙 Contas a Receber — em breve. Plano de contas: {planoContas.length} grupos.
  </div>
);

const FnFin008_CtsPagar = ({ planoContas = [] }) => (
  <div className="text-lg">
    ❤️ Contas a Pagar — em breve. Plano de contas: {planoContas.length} grupos.
  </div>
);

const FnFin009_FluxoCaixa = () => (
  <div className="text-lg">📊 Fluxo de Caixa — em breve.</div>
);

// ---- Planos de contas (conforme escopo) ----
const planoContasReceber = [
  { codigo: '0201', nome: 'Receita de PDV', filhos: [
    { codigo: '0201001', nome: 'Cidade', filhos: [
      { codigo: '0201001001', nome: 'Recife' },
      { codigo: '0201001002', nome: 'Gravatá' },
      { codigo: '0201001003', nome: 'Caruaru' },
    ]},
  ]},
  { codigo: '0202', nome: 'Receita de Varejo', filhos: [
    { codigo: '0202001', nome: 'Venda Direta' }
  ]},
  { codigo: '0203', nome: 'Receita de Empréstimos' },
  { codigo: '0204', nome: 'Receita de Demais Projetos' },
];

const planoContasPagar = [
  { codigo: '0101', nome: 'Custos de Produção' },
  { codigo: '0102', nome: 'Despesas Administrativas' },
  { codigo: '0103', nome: 'Despesas com Pessoal' },
  { codigo: '0104', nome: 'Despesas com Vendas' },
  { codigo: '0105', nome: 'Outras Despesas' },
];

// ---- Entry do módulo financeiro (renomeado para não colidir com App do M1) ----
const FinfluxEntry = () => {
  const [tela, setTela] = useState('inicio');

  return (
    <div className="bg-[#FFF3E9] min-h-screen p-4 text-[#5C1D0E]">
      {tela === 'inicio' && (
        <div>
          <h1 className="text-2xl font-bold mb-2">Módulo Financeiro – Dudunitê</h1>
          <p className="mb-4">Bem-vindo! Selecione uma opção.</p>

          <div className="flex flex-col gap-2">
            <button
              onClick={() => setTela('tabelaPrecos')}
              className="bg-orange-600 hover:bg-orange-700 text-white py-2 px-4 rounded"
            >
              Tabela de Preços
            </button>

            <button
              onClick={() => setTela('historicoPrecos')}
              className="bg-orange-600 hover:bg-orange-700 text-white py-2 px-4 rounded"
            >
              Histórico de Alterações
            </button>

            <button
              onClick={() => setTela('ctsReceber')}
              className="bg-orange-600 hover:bg-orange-700 text-white py-2 px-4 rounded"
            >
              Contas a Receber
            </button>

            <button
              onClick={() => setTela('ctsPagar')}
              className="bg-orange-600 hover:bg-orange-700 text-white py-2 px-4 rounded"
            >
              Contas a Pagar
            </button>

            <button
              onClick={() => setTela('fluxoCaixa')}
              className="bg-orange-600 hover:bg-orange-700 text-white py-2 px-4 rounded"
            >
              Fluxo de Caixa
            </button>
          </div>
        </div>
      )}

      {tela !== 'inicio' && (
        <div>
          <button
            onClick={() => setTela('inicio')}
            className="mb-4 bg-gray-300 hover:bg-gray-400 text-black py-1 px-3 rounded"
          >
            Voltar
          </button>

          {tela === 'tabelaPrecos' && <FnFin006_TabelaPrecos />}
          {tela === 'ctsReceber' && <FnFin007_CtsReceber planoContas={planoContasReceber} />}
          {tela === 'ctsPagar' && <FnFin008_CtsPagar planoContas={planoContasPagar} />}
          {tela === 'fluxoCaixa' && <FnFin009_FluxoCaixa />}

          {tela === 'historicoPrecos' && (
            <div className="text-lg">📅 Em breve: histórico de alterações da tabela de preços.</div>
          )}
        </div>
      )}
    </div>
  );
};

export default FinfluxEntry;

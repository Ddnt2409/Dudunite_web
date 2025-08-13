// FnFin006_TabelaPrecos.jsx
import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase';

function FnFin006_TabelaPrecos({ voltarInicio }) {
  const [precos, setPrecos] = useState({});
  const [modoEdicao, setModoEdicao] = useState(false);
  const [valoresEdicao, setValoresEdicao] = useState({});

  useEffect(() => {
    const carregarPrecos = async () => {
      const precosRef = collection(db, 'tabela_precos');
      const snapshot = await getDocs(precosRef);
      const dados = {};
      snapshot.forEach((doc) => {
        dados[doc.id] = doc.data();
      });
      setPrecos(dados);
    };
    carregarPrecos();
  }, []);

  const produtos = [
    'BRW6X6', 'BRW7X7', 'DUDU', 'ESC', 'PKT5X5', 'PKT6X6'
  ];

  const handleAlterarClick = () => {
    setModoEdicao(true);
    const valoresIniciais = {};
    produtos.forEach((produto) => {
      valoresIniciais[produto] = {
        revenda: precos[produto]?.revenda?.toFixed(2).replace('.', ',') || '',
        varejo: precos[produto]?.varejo?.toFixed(2).replace('.', ',') || '',
      };
    });
    setValoresEdicao(valoresIniciais);
  };

  const handleInputChange = (produto, campo, valor) => {
    setValoresEdicao((prev) => ({
      ...prev,
      [produto]: {
        ...prev[produto],
        [campo]: valor
      }
    }));
  };

  const handleSalvarClick = async () => {
    const novosPrecos = { ...precos };

    for (const [produto, valores] of Object.entries(valoresEdicao)) {
      const revendaNum = parseFloat(valores.revenda.replace(',', '.'));
      const varejoNum = parseFloat(valores.varejo.replace(',', '.'));

      if (!isNaN(revendaNum) && !isNaN(varejoNum)) {
        novosPrecos[produto] = {
          revenda: revendaNum,
          varejo: varejoNum,
          ultimaAlteracao: new Date().toISOString().split('T')[0]
        };
        await setDoc(doc(db, 'tabela_precos', produto), novosPrecos[produto]);
      }
    }

    setPrecos(novosPrecos);
    setModoEdicao(false);
  };

  return (
    <div className="p-4">
      <button onClick={voltarInicio} className="mb-4 px-3 py-1 bg-gray-200 rounded">Voltar</button>

      <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
        <span>📋</span> Tabela de Preços Atuais
      </h2>

      <div className="overflow-x-auto">
        <table className="min-w-full border border-gray-300">
          <thead>
            <tr className="bg-orange-100 text-left">
              <th className="py-2 px-4 border">Produto</th>
              <th className="py-2 px-4 border">Revenda</th>
              <th className="py-2 px-4 border">Varejo</th>
              <th className="py-2 px-4 border">Última Alteração</th>
            </tr>
          </thead>
          <tbody>
            {produtos.map((produto) => {
              const preco = precos[produto];
              const edicao = valoresEdicao[produto] || {};

              return (
                <tr key={produto} className="border-t">
                  <td className="py-2 px-4 font-bold">{produto}</td>
                  <td className="py-2 px-4">
                    {modoEdicao ? (
                      <input
                        type="text"
                        value={edicao.revenda || ''}
                        onChange={(e) => handleInputChange(produto, 'revenda', e.target.value)}
                        className="border px-2 py-1 w-24"
                      />
                    ) : (
                      preco ? `R$ ${preco.revenda.toFixed(2).replace('.', ',')}` : '—'
                    )}
                  </td>
                  <td className="py-2 px-4">
                    {modoEdicao ? (
                      <input
                        type="text"
                        value={edicao.varejo || ''}
                        onChange={(e) => handleInputChange(produto, 'varejo', e.target.value)}
                        className="border px-2 py-1 w-24"
                      />
                    ) : (
                      preco ? `R$ ${preco.varejo.toFixed(2).replace('.', ',')}` : '—'
                    )}
                  </td>
                  <td className="py-2 px-4">
                    {preco?.ultimaAlteracao || '—'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-6">
        {modoEdicao ? (
          <button
            onClick={handleSalvarClick}
            className="bg-orange-700 text-white px-4 py-2 rounded"
          >
            Salvar
          </button>
        ) : (
          <button
            onClick={handleAlterarClick}
            className="bg-orange-500 text-white px-4 py-2 rounded"
          >
            Alterar
          </button>
        )}
      </div>
    </div>
  );
}

export default FnFin006_TabelaPrecos;

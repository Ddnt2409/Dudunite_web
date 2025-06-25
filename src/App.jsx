import React, { useState } from 'react';
import { jsPDF } from 'jspdf';

const escolasDB = {
  "Gravatá": ["Escola Municipal A", "Escola Estadual B"],
  "Bezerros": ["Escola Central", "Escola Bairro Novo"]
};

const produtos = ["Brownie 7x7", "Brownie 6x6", "Pocket 5x5", "Escondidinho"];
const sabores = ["Nutella", "Doce de Leite", "Prestígio", "Beijinho", "Brigadeiro"];

const App = () => {
  const [cidade, setCidade] = useState('');
  const [escola, setEscola] = useState('');
  const [produto, setProduto] = useState('');
  const [sabor, setSabor] = useState('');
  const [quantidade, setQuantidade] = useState('');
  const [itens, setItens] = useState([]);
  const [pedidos, setPedidos] = useState([]);

  const adicionarItem = () => {
    if (produto && sabor && quantidade > 0) {
      setItens([...itens, { produto, sabor, quantidade: parseInt(quantidade) }]);
      setProduto('');
      setSabor('');
      setQuantidade('');
    }
  };

  const salvarPedido = () => {
    if (!cidade || !escola || itens.length === 0) return;

    const hoje = new Date();
    const cincoDiasAtras = new Date(hoje);
    cincoDiasAtras.setDate(hoje.getDate() - 5);

    const indiceExistente = pedidos.findIndex(p =>
      p.escola === escola &&
      p.cidade === cidade &&
      new Date(p.data) >= cincoDiasAtras
    );

    const novoPedido = {
      cidade,
      escola,
      itens,
      data: hoje.toISOString()
    };

    if (indiceExistente !== -1) {
      const pedidosAtualizados = [...pedidos];
      pedidosAtualizados[indiceExistente].itens.push(...itens);
      setPedidos(pedidosAtualizados);
    } else {
      setPedidos([...pedidos, novoPedido]);
    }

    setItens([]);
    setCidade('');
    setEscola('');
  };

  const gerarPDF = () => {
    const doc = new jsPDF();
    doc.text("Lista de Compras - Dudunitê", 10, 10);
    let y = 20;

    pedidos.forEach((pedido, i) => {
      doc.text(`${i + 1}. ${pedido.cidade} - ${pedido.escola}`, 10, y);
      y += 6;
      pedido.itens.forEach(item => {
        doc.text(`  - ${item.produto} | ${item.sabor} | ${item.quantidade} un`, 10, y);
        y += 6;
      });
      y += 4;
    });

    doc.save("lista-de-compras.pdf");
  };

  return (
    <div className="max-w-xl mx-auto p-4">
      <h1 className="text-2xl font-bold text-center mb-6">Pedidos Dudunitê</h1>

      <div className="grid gap-2 mb-4">
        <select value={cidade} onChange={(e) => {
          setCidade(e.target.value);
          setEscola('');
        }} className="border p-2 rounded">
          <option value="">Selecione a cidade</option>
          {Object.keys(escolasDB).map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>

        <select value={escola} onChange={(e) => setEscola(e.target.value)} className="border p-2 rounded" disabled={!cidade}>
          <option value="">Selecione a escola</option>
          {cidade && escolasDB[cidade].map(e => (
            <option key={e} value={e}>{e}</option>
          ))}
        </select>

        <select value={produto} onChange={(e) => setProduto(e.target.value)} className="border p-2 rounded">
          <option value="">Selecione o produto</option>
          {produtos.map(p => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>

        <select value={sabor} onChange={(e) => setSabor(e.target.value)} className="border p-2 rounded">
          <option value="">Selecione o sabor</option>
          {sabores.map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>

        <input
          type="number"
          placeholder="Quantidade"
          value={quantidade}
          onChange={(e) => setQuantidade(e.target.value)}
          className="border p-2 rounded"
        />

        <button onClick={adicionarItem} className="bg-green-600 text-white py-2 px-4 rounded">
          Adicionar Item
        </button>

        <button onClick={salvarPedido} className="bg-blue-600 text-white py-2 px-4 rounded">
          Salvar Pedido da Escola
        </button>
      </div>

      {itens.length > 0 && (
        <div className="mb-4">
          <h2 className="font-semibold">Itens do Pedido:</h2>
          <ul className="list-disc ml-6">
            {itens.map((item, i) => (
              <li key={i}>{item.produto} - {item.sabor} - {item.quantidade} un</li>
            ))}
          </ul>
        </div>
      )}

      {pedidos.length > 0 && (
        <div className="text-center mb-6">
          <button onClick={gerarPDF} className="bg-purple-600 text-white py-2 px-4 rounded">
            Gerar PDF
          </button>
        </div>
      )}

      <div className="space-y-4">
        {pedidos.map((pedido, i) => (
          <div key={i} className="bg-gray-100 p-3 rounded shadow">
            <strong>{pedido.cidade} - {pedido.escola}</strong>
            <ul className="ml-4 list-disc">
              {pedido.itens.map((item, j) => (
                <li key={j}>{item.produto} - {item.sabor} - {item.quantidade} un</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
};

export default App;

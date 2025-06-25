import React, { useState } from "react";
import { jsPDF } from "jspdf";

function App() {
  const [cidade, setCidade] = useState("");
  const [escola, setEscola] = useState("");
  const [produto, setProduto] = useState("");
  const [sabor, setSabor] = useState("");
  const [quantidade, setQuantidade] = useState("");
  const [itens, setItens] = useState([]);
  const [pedidos, setPedidos] = useState([]);

  const adicionarItem = () => {
    if (produto && sabor && quantidade) {
      setItens([...itens, { produto, sabor, quantidade }]);
      setProduto("");
      setSabor("");
      setQuantidade("");
    }
  };

  const salvarPedido = () => {
    if (cidade && escola && itens.length > 0) {
      const novoPedido = {
        cidade,
        escola,
        itens,
        data: new Date().toLocaleString("pt-BR")
      };
      setPedidos([...pedidos, novoPedido]);
      setItens([]);
      setCidade("");
      setEscola("");
    }
  };

  const gerarPDF = () => {
    const doc = new jsPDF();
    doc.text("Lista de Compras Dudunitê", 10, 10);
    let y = 20;

    pedidos.forEach((pedido, index) => {
      doc.text(
        `#${index + 1} - ${pedido.cidade} / ${pedido.escola} - ${pedido.data}`,
        10,
        y
      );
      y += 8;
      pedido.itens.forEach((item) => {
        doc.text(
          `  - ${item.produto} | ${item.sabor} | ${item.quantidade} un`,
          10,
          y
        );
        y += 6;
      });
      y += 4;
    });

    doc.save("lista-compras.pdf");
  };

  return (
    <div className="p-4 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4 text-center">
        Sistema de Pedidos Dudunitê
      </h1>

      <div className="grid gap-2 mb-4">
        <input
          type="text"
          placeholder="Cidade"
          value={cidade}
          onChange={(e) => setCidade(e.target.value)}
          className="border p-2 rounded"
        />
        <input
          type="text"
          placeholder="Escola"
          value={escola}
          onChange={(e) => setEscola(e.target.value)}
          className="border p-2 rounded"
        />
        <input
          type="text"
          placeholder="Produto"
          value={produto}
          onChange={(e) => setProduto(e.target.value)}
          className="border p-2 rounded"
        />
        <input
          type="text"
          placeholder="Sabor"
          value={sabor}
          onChange={(e) => setSabor(e.target.value)}
          className="border p-2 rounded"
        />
        <input
          type="number"
          placeholder="Quantidade"
          value={quantidade}
          onChange={(e) => setQuantidade(e.target.value)}
          className="border p-2 rounded"
        />
        <button
          onClick={adicionarItem}
          className="bg-green-600 text-white py-2 rounded"
        >
          Adicionar Item
        </button>
        <button
          onClick={salvarPedido}
          className="bg-blue-600 text-white py-2 rounded"
        >
          Salvar Pedido da Escola
        </button>
      </div>

      {pedidos.length > 0 && (
        <button
          onClick={gerarPDF}
          className="bg-purple-600 text-white py-2 px-4 rounded mb-4"
        >
          Gerar PDF da Lista de Compras
        </button>
      )}

      <div className="space-y-4">
        {pedidos.map((pedido, i) => (
          <div key={i} className="p-2 border rounded bg-gray-100">
            <strong>
              {pedido.cidade} / {pedido.escola}
            </strong>{" "}
            <span className="text-sm text-gray-500">({pedido.data})</span>
            <ul className="ml-4 list-disc">
              {pedido.itens.map((item, j) => (
                <li key={j}>
                  {item.produto} - {item.sabor} - {item.quantidade} un
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;

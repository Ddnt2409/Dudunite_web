import { useState, useEffect } from "react";
import { jsPDF } from "jspdf";
import {
  cidades,
  escolas,
  produtosPorEscola,
  saboresPorProduto,
} from "./data";

export default function App() {
  const [cidadeSelecionada, setCidadeSelecionada] = useState("");
  const [escolaSelecionada, setEscolaSelecionada] = useState("");
  const [produtoSelecionado, setProdutoSelecionado] = useState("");
  const [saborSelecionado, setSaborSelecionado] = useState("");
  const [quantidade, setQuantidade] = useState("");
  const [itensTemp, setItensTemp] = useState([]);
  const [pedidos, setPedidos] = useState([]);

  // Filtra as escolas pela cidade selecionada
  const escolasFiltradas = cidades.includes(cidadeSelecionada)
    ? escolas.filter((e) => e.cidade === cidadeSelecionada)
    : [];

  // Filtra os produtos pela escola selecionada
  const produtosFiltrados = produtosPorEscola[escolaSelecionada] || [];

  // Filtra os sabores pelo produto selecionado
  const saboresFiltrados = saboresPorProduto[produtoSelecionado] || [];

  useEffect(() => {
    const pedidosSalvos = JSON.parse(localStorage.getItem("pedidos") || "[]");
    setPedidos(pedidosSalvos);
  }, []);

  useEffect(() => {
    localStorage.setItem("pedidos", JSON.stringify(pedidos));
  }, [pedidos]);

  function adicionarItemAoPedido() {
    if (!produtoSelecionado || !saborSelecionado || !quantidade) {
      alert("Preencha produto, sabor e quantidade.");
      return;
    }

    const novoItem = {
      produto: produtoSelecionado,
      sabor: saborSelecionado,
      quantidade: Number(quantidade),
    };

    setItensTemp((prev) => [...prev, novoItem]);
    setProdutoSelecionado("");
    setSaborSelecionado("");
    setQuantidade("");
  }

  function salvarPedidoCompleto() {
    if (!cidadeSelecionada || !escolaSelecionada || itensTemp.length === 0) {
      alert("Selecione a escola e adicione pelo menos um item.");
      return;
    }

    const agora = Date.now();
    const cincoDiasMs = 5 * 24 * 60 * 60 * 1000;

    const pedidosAtualizados = [...pedidos];
    const indexExistente = pedidos.findIndex(
      (p) =>
        p.escolaId === parseInt(escolaSelecionada) &&
        agora - p.data < cincoDiasMs
    );

    if (indexExistente !== -1) {
      // Adiciona ao pedido existente
      pedidosAtualizados[indexExistente].itens.push(...itensTemp);
      pedidosAtualizados[indexExistente].data = agora; // atualiza a data para o último pedido
    } else {
      // Cria novo pedido
      const novoPedido = {
        id: Date.now(),
        data: agora,
        cidade: cidadeSelecionada,
        escolaId: parseInt(escolaSelecionada),
        escola:
          escolas.find((e) => e.id === parseInt(escolaSelecionada))?.nome || "",
        itens: itensTemp,
      };
      pedidosAtualizados.push(novoPedido);
    }

    setPedidos(pedidosAtualizados);
    setItensTemp([]);
    setProdutoSelecionado("");
    setSaborSelecionado("");
    setQuantidade("");
    setCidadeSelecionada("");
    setEscolaSelecionada("");
  }

  function gerarPDF() {
    if (!pedidos || pedidos.length === 0) {
      alert("Nenhum pedido para gerar PDF.");
      return;
    }

    // Consolidar os itens de todos os pedidos
    const consolidado = {};

    pedidos.forEach(({ itens }) => {
      itens.forEach(({ produto, sabor, quantidade }) => {
        const chave = produto + " - " + sabor;
        if (!consolidado[chave]) consolidado[chave] = 0;
        consolidado[chave] += quantidade;
      });
    });

    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text("Lista de Compras Dudunitê", 14, 22);

    doc.setFontSize(12);
    doc.text(`Data: ${new Date().toLocaleDateString()}`, 14, 30);

    let y = 40;

    doc.setFontSize(14);
    doc.text("Produto - Sabor | Quantidade Total", 14, y);
    y += 8;

    doc.setFontSize(12);
    Object.entries(consolidado).forEach(([chave, qtd]) => {
      doc.text(`${chave} : ${qtd}`, 14, y);
      y += 7;
      if (y > 280) {
        doc.addPage();
        y = 20;
      }
    });

    doc.save("lista-compras-dudunite.pdf");
  }

  return (
    <main className="min-h-screen bg-orangeLight p-6">
      <div className="max-w-xl mx-auto bg-white rounded-3xl shadow-lg p-8">
        <h1 className="text-3xl font-bold mb-6 text-orangeDark text-center">
          Dudunitê – Lançamento de Pedidos
        </h1>

        <label className="block mb-2 font-semibold">Cidade</label>
        <select
          className="w-full mb-4 p-3 border border-orangeMid rounded-xl"
          value={cidadeSelecionada}
          onChange={(e) => {
            setCidadeSelecionada(e.target.value);
            setEscolaSelecionada("");
          }}
        >
          <option value="">Selecione a cidade</option>
          {cidades.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        <label className="block mb-2 font-semibold">Escola</label>
        <select
          className="w-full mb-4 p-3 border border-orangeMid rounded-xl"
          value={escolaSelecionada}
          onChange={(e) => setEscolaSelecionada(e.target.value)}
          disabled={!cidadeSelecionada}
        >
          <option value="">Selecione a escola</option>
          {escolasFiltradas.map((e) => (
            <option key={e.id} value={e.id}>
              {e.nome}
            </option>
          ))}
        </select>

        <hr className="my-4 border-orangeMid" />

        <label className="block mb-2 font-semibold">Produto</label>
        <select
          className="w-full mb-4 p-3 border border-orangeMid rounded-xl"
          value={produtoSelecionado}
          onChange={(e) => {
            setProdutoSelecionado(e.target.value);
            setSaborSelecionado("");
          }}
          disabled={!escolaSelecionada}
        >
          <option value="">Selecione o produto</option>
          {produtosFiltrados.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>

        <label className="block mb-2 font-semibold">Sabor</label>
        <select
          className="w-full mb-4 p-3 border border-orangeMid rounded-xl"
          value={saborSelecionado}
          onChange={(e) => setSaborSelecionado(e.target.value)}
          disabled={!produtoSelecionado}
        >
          <option value="">Selecione o sabor</option>
          {saboresFiltrados.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>

        <label className="block mb-2 font-semibold">Quantidade</label>
        <input
          type="number"
          min="1"
          className="w-full mb-4 p-3 border border-orangeMid rounded-xl"
          value={quantidade}
          onChange={(e) => setQuantidade(e.target.value)}
          disabled={!saborSelecionado}
        />

        <button
          onClick={adicionarItemAoPedido}
          className="w-full bg-orangeMid hover:bg-orangeDark text-white font-bold py-3 rounded-xl transition-colors"
        >
          Adicionar Item
        </button>

        {itensTemp.length > 0 && (
          <div className="mt-6 bg-orangeLight border rounded-xl p-4">
            <h2 className="font-semibold text-orangeDark mb-2">
              Itens a serem salvos:
            </h2>
            {itensTemp.map((item, i) => (
              <p key={i}>
                {item.produto} - {item.sabor} ({item.quantidade})
              </p>
            ))}
            <button
              onClick={salvarPedidoCompleto}
              className="mt-4 w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 rounded-xl"
            >
              Salvar Pedido da Escola
            </button>
          </div>
        )}

        {pedidos.length > 0 && (
          <>
            <h2 className="mt-10 mb-4 text-xl font-semibold text-orangeDark">
              Pedidos Salvos
            </h2>
            <div className="max-h-64 overflow-y-auto border border-orangeMid rounded-xl p-4">
              {pedidos.map((p) => (
                <div key={p.id} className="mb-4 border-b pb-2">
                  <p className="font-bold">
                    {p.escola} ({p.cidade})
                  </p>
                  <ul className="pl-4 list-disc">
                    {p.itens.map((item, i) => (
                      <li key={i}>
                        {item.produto} – {item.sabor} – {item.quantidade}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <button
              onClick={gerarPDF}
              className="mt-6 w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl"
            >
              Gerar PDF da Lista de Compras
            </button>
          </>
        )}
      </div>
    </main>
  );
}

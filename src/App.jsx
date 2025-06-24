import { useState, useEffect } from "react";
import { cidades, escolas, produtosPorEscola, saboresPorProduto } from "./data";

export default function App() {
  const [cidadeSelecionada, setCidadeSelecionada] = useState("");
  const [escolaSelecionada, setEscolaSelecionada] = useState("");
  const [produtoSelecionado, setProdutoSelecionado] = useState("");
  const [saborSelecionado, setSaborSelecionado] = useState("");
  const [quantidade, setQuantidade] = useState("");
  const [pedidos, setPedidos] = useState([]);

  const escolasFiltradas = cidades.includes(cidadeSelecionada)
    ? escolas.filter((e) => e.cidade === cidadeSelecionada)
    : [];

  const produtosFiltrados =
    produtosPorEscola[escolaSelecionada]
      ? produtosPorEscola[escolaSelecionada]
      : [];

  const saboresFiltrados =
    saboresPorProduto[produtoSelecionado]
      ? saboresPorProduto[produtoSelecionado]
      : [];

  useEffect(() => {
    const pedidosSalvos = JSON.parse(localStorage.getItem("pedidos") || "[]");
    setPedidos(pedidosSalvos);
  }, []);

  useEffect(() => {
    localStorage.setItem("pedidos", JSON.stringify(pedidos));
  }, [pedidos]);

  function handleSalvarPedido() {
    if (
      !cidadeSelecionada ||
      !escolaSelecionada ||
      !produtoSelecionado ||
      !saborSelecionado ||
      !quantidade
    ) {
      alert("Preencha todos os campos!");
      return;
    }

    const novaPedido = {
      id: Date.now(),
      cidade: cidadeSelecionada,
      escola: escolas.find((e) => e.id === parseInt(escolaSelecionada))?.nome || "",
      produto: produtoSelecionado,
      sabor: saborSelecionado,
      quantidade: Number(quantidade),
    };

    setPedidos((prev) => [...prev, novaPedido]);
    setQuantidade("");
    setProdutoSelecionado("");
    setSaborSelecionado("");
  }

  return (
    <main className="min-h-screen bg-orangeLight p-6">
      <div className="max-w-md mx-auto bg-white rounded-3xl shadow-lg p-8">
        <h1 className="text-3xl font-bold mb-6 text-orangeDark text-center">
          Dudunitê - Lançamento de Pedidos
        </h1>

        <label className="block mb-2 font-semibold">Cidade</label>
        <select
          className="w-full mb-4 p-3 border border-orangeMid rounded-xl"
          value={cidadeSelecionada}
          onChange={(e) => {
            setCidadeSelecionada(e.target.value);
            setEscolaSelecionada("");
            setProdutoSelecionado("");
            setSaborSelecionado("");
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
          onChange={(e) => {
            setEscolaSelecionada(e.target.value);
            setProdutoSelecionado("");
            setSaborSelecionado("");
          }}
          disabled={!cidadeSelecionada}
        >
          <option value="">Selecione a escola</option>
          {escolasFiltradas.map((e) => (
            <option key={e.id} value={e.id}>
              {e.nome}
            </option>
          ))}
        </select>

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
          className="w-full mb-6 p-3 border border-orangeMid rounded-xl"
          value={quantidade}
          onChange={(e) => setQuantidade(e.target.value)}
          disabled={!saborSelecionado}
        />

        <button
          onClick={handleSalvarPedido}
          className="w-full bg-orangeMid hover:bg-orangeDark text-white font-bold py-3 rounded-xl transition-colors"
        >
          Salvar Pedido
        </button>

        {pedidos.length > 0 && (
          <>
            <h2 className="mt-8 mb-4 text-xl font-semibold text-orangeDark">
              Pedidos Cadastrados
            </h2>
            <div className="max-h-60 overflow-y-auto border border-orangeMid rounded-xl p-4">
              {pedidos.map(({ id, cidade, escola, produto, sabor, quantidade }) => (
                <div
                  key={id}
                  className="mb-3 p-3 border-b border-orangeMid last:border-none"
                >
                  <p>
                    <strong>Escola:</strong> {escola} ({cidade})
                  </p>
                  <p>
                    <strong>Produto:</strong> {produto}
                  </p>
                  <p>
                    <strong>Sabor:</strong> {sabor}
                  </p>
                  <p>
                    <strong>Quantidade:</strong> {quantidade}
                  </p>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </main>
  );
}

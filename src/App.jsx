// === FN01 – Importações Gerais ===
import React, { useState, useEffect } from "react";
import { collection, addDoc, getDocs, query, where, serverTimestamp } from "firebase/firestore";
import db from "./firebase";

// === FN02 – Cores e Logomarca ===
const corPrimaria = "#8c3b1b";
const logoPath = "/LogomarcaDDnt2025Vazado.png";

// === FN03 – Componente App ===
function App() {
  const [telaAtual, setTelaAtual] = useState("PCP");
  const [cidade, setCidade] = useState("");
  const [escola, setEscola] = useState("");
  const [produtoSelecionado, setProdutoSelecionado] = useState("");
  const [quantidade, setQuantidade] = useState(1);
  const [dataVencimento, setDataVencimento] = useState("");
  const [formaPagamento, setFormaPagamento] = useState("");
  const [referenciaTabela, setReferenciaTabela] = useState("");
  const [valorUnitario, setValorUnitario] = useState("");
  const [itensPedido, setItensPedido] = useState([]);
  const [pedidosLancados, setPedidosLancados] = useState([]);
  const [pedidosPendentes, setPedidosPendentes] = useState([]);
  const [saboresDisponiveis, setSaboresDisponiveis] = useState([]);

  const cidades = ["Gravatá", "Recife", "Caruaru"];
  const produtos = ["BRW 7x7", "BRW 6x6", "PKT 5x5", "PKT 6x6", "Esc", "DUDU"];

  const escolasPorCidade = {
    Gravatá: ["Pequeno Príncipe", "Salesianas", "Céu Azul", "Russas", "Bora Gastar", "Kaduh", "Society Show", "Degusty"],
    Recife: ["Tio Valter", "Vera Cruz", "Pinheiros", "Dourado", "BMQ", "CFC", "Madre de Deus", "Saber Viver"],
    Caruaru: ["Interativo", "Exato Sede", "Exato Anexo", "Sesi", "Motivo", "Jesus Salvador"],
  };

  const escolasFiltradas = cidade ? escolasPorCidade[cidade] || [] : [];

  // === FN04 – Carregar pedidos com status 'Lançado' ===
  const carregarPedidosLancados = async () => {
    try {
      const pedidosRef = collection(db, "PEDIDOS");
      const q = query(pedidosRef, where("statusEtapa", "==", "Lançado"));
      const querySnapshot = await getDocs(q);
      const pedidos = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setPedidosLancados(pedidos);
    } catch (error) {
      console.error("Erro ao carregar pedidos lançados:", error);
      setPedidosLancados([]);
    }
  };

  useEffect(() => {
    if (telaAtual === "Sabores") {
      carregarPedidosLancados();
    }
  }, [telaAtual]);

  // === FN05 – salvarPedidoRapidoOriginal ===
  const salvarPedidoRapidoOriginal = async ({
    cidade,
    escola,
    tabelaSelecionada,
    itensPedido,
    dataVencimento,
    formaPagamento,
    setCidade,
    setEscola,
    setTabelaSelecionada,
    setItensPedido,
    setDataVencimento,
    setFormaPagamento,
    setTelaAtual,
    carregarPedidosLancados,
  }) => {
    try {
      const totalPedido = itensPedido.reduce(
        (soma, item) => soma + item.quantidade * item.valorUnitario,
        0
      );

      const novoPedido = {
        cidade,
        escola,
        tabela: tabelaSelecionada,
        itens: itensPedido,
        dataVencimento,
        formaPagamento,
        totalPedido,
        statusEtapa: "Lançado",
        criadoEm: serverTimestamp(),
      };

      const pedidosRef = collection(db, "PEDIDOS");
      await addDoc(pedidosRef, novoPedido);

      setCidade("");
      setEscola("");
      setTabelaSelecionada("");
      setItensPedido([]);
      setDataVencimento("");
      setFormaPagamento("");
      setTelaAtual("PCP");
      carregarPedidosLancados();
    } catch (error) {
      console.error("Erro ao salvar pedido:", error);
    }
  };

  // === FN06 – adicionarItemAoPedido ===
  const adicionarItemAoPedido = () => {
    if (!produtoSelecionado || !quantidade || !valorUnitario) {
      alert("Preencha produto, quantidade e valor unitário.");
      return;
    }

    const novoItem = {
      produto: produtoSelecionado,
      quantidade: Number(quantidade),
      valorUnitario: Number(valorUnitario),
    };

    setItensPedido((prev) => [...prev, novoItem]);
    setProdutoSelecionado("");
    setQuantidade(1);
    setValorUnitario("");
  };

  // === FN07 – Wrapper salvarPedidoRapido ===
  const salvarPedidoRapido = () => {
    salvarPedidoRapidoOriginal({
      cidade,
      escola,
      tabelaSelecionada: referenciaTabela,
      itensPedido,
      dataVencimento,
      formaPagamento,
      setCidade,
      setEscola,
      setTabelaSelecionada: setReferenciaTabela,
      setItensPedido,
      setDataVencimento,
      setFormaPagamento,
      setTelaAtual,
      carregarPedidosLancados,
    });
  };

  // === RT99 – Return do Componente ===
  return (
    <>
      {/* === RT00a – Tela Inicial PCP === */}
      {telaAtual === "PCP" && (
        <div className="min-h-screen bg-[#fdf8f5] flex flex-col items-center p-4">
          <img src={logoPath} alt="Logomarca Dudunitê" className="w-40 mt-4 mb-2" />
          <h1 className="text-2xl font-bold text-[#a65a3d] mb-6">PCP – Planejamento e Controle de Produção</h1>
          <div className="flex flex-col space-y-4 w-full max-w-xs">
            <button
              className="bg-[#d38b5d] hover:bg-[#c3794a] text-white font-semibold py-3 px-6 rounded-xl shadow"
              onClick={() => setTelaAtual("Lancamento")}
            >
              📦 Lançar Pedido
            </button>
            <button
              className="bg-[#d38b5d] hover:bg-[#c3794a] text-white font-semibold py-3 px-6 rounded-xl shadow"
              onClick={() => setTelaAtual("Sabores")}
            >
              🍫 Alimentar Sabores
            </button>
          </div>

          {pedidosLancados.length > 0 && (
            <div className="mt-6 w-full max-w-xl bg-white p-4 rounded-lg shadow text-sm">
              <h2 className="text-lg font-bold mb-3 text-[#5C1D0E]">Pedidos já lançados</h2>
              <ul className="space-y-2">
                {pedidosLancados.map((pedido) => {
                  const data = pedido.criadoEm?.toDate?.();
                  const dataFormatada = data
                    ? `${data.toLocaleDateString()} ${data.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                    : "Data desconhecida";
                  return (
                    <li
                      key={pedido.id}
                      className="flex justify-between items-center bg-[#f9f1e8] p-2 rounded border border-[#d3c0b0]"
                    >
                      <span>{dataFormatada} – {pedido.escola}</span>
                      <button
                        className="text-blue-700 hover:underline text-xs"
                        onClick={() => alert(`Alterar pedido: ${pedido.id}`)}
                      >
                        Alterar Pedido
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>
      )}

{/* === INÍCIO RT01 – Tela Sabores === */}
{telaAtual === "Sabores" && (
  <>
    <h2 className="text-2xl font-bold mb-4 text-[#8c3b1b]">Alimentar Sabores</h2>

    {/* Comentado para testes e isolamento de erro */}
    {/*
    {pedidosPendentes.length === 0 ? (
      <p className="text-gray-600">Nenhum pedido pendente encontrado.</p>
    ) : (
      <div className="space-y-6">
        {pedidosPendentes.map((pedido, index) => (
          <div key={index} className="border border-gray-300 rounded p-4 bg-white shadow">
            <p><strong>Cidade:</strong> {pedido.cidade}</p>
            <p><strong>Escola:</strong> {pedido.escola}</p>
            <div className="mt-4 space-y-4">
              {pedido.itens.map((item, itemIndex) => (
                <div key={itemIndex} className="border p-3 rounded bg-gray-50">
                  <p><strong>Produto:</strong> {item.produto}</p>
                  <p><strong>Quantidade:</strong> {item.quantidade}</p>
                  <div className="mt-2">
                    <label className="block text-sm font-medium text-gray-700">Sabores:</label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-1">
                      {saboresDisponiveis
                        .filter((sabor) => sabor.produto === item.produto)
                        .map((sabor, saborIndex) => (
                          <label key={saborIndex} className="inline-flex items-center">
                            <input
                              type="checkbox"
                              className="form-checkbox h-4 w-4 text-[#8c3b1b] transition duration-150 ease-in-out"
                              checked={item.sabores?.includes(sabor.nome) || false}
                              onChange={(e) => {
                                const novosPedidos = [...pedidosPendentes];
                                const saboresAtuais = novosPedidos[index].itens[itemIndex].sabores || [];
                                if (e.target.checked) {
                                  saboresAtuais.push(sabor.nome);
                                } else {
                                  const idx = saboresAtuais.indexOf(sabor.nome);
                                  if (idx > -1) saboresAtuais.splice(idx, 1);
                                }
                                novosPedidos[index].itens[itemIndex].sabores = saboresAtuais;
                                setPedidosPendentes(novosPedidos);
                              }}
                            />
                            <span className="ml-2 text-sm">{sabor.nome}</span>
                          </label>
                        ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 text-right">
              <button
                onClick={() => salvarSabores(pedido, index)}
                className="bg-[#8c3b1b] hover:bg-[#6d2d14] text-white font-semibold py-2 px-4 rounded"
              >
                💾 Salvar Pedido
              </button>
            </div>
          </div>
        ))}
      </div>
    )}
    */}
    <p className="text-gray-500 italic">[RT01 está renderizando com conteúdo interno comentado]</p>
  </>
)}
{/* === FIM RT01 === */}


{/* === RT02 – Tela de Lançar Pedido === */}
{telaAtual === "Lancamento" && (
  <div className="min-h-screen bg-[#fff8f3] flex flex-col items-center p-6">
    <h2 className="text-2xl font-bold text-[#8c3b1b] mb-4">📦 Lançamento Rápido de Pedido</h2>

    <div className="grid gap-4 w-full max-w-md">
      <select
        className="p-2 border rounded"
        value={cidade}
        onChange={(e) => setCidade(e.target.value)}
      >
        <option value="">Selecione a cidade</option>
        {cidades.map((c) => (
          <option key={c} value={c}>{c}</option>
        ))}
      </select>

      <select
        className="p-2 border rounded"
        value={escola}
        onChange={(e) => setEscola(e.target.value)}
        disabled={!cidade}
      >
        <option value="">Selecione a escola</option>
        {escolasFiltradas.map((e) => (
          <option key={e} value={e}>{e}</option>
        ))}
      </select>

      <input
        className="p-2 border rounded"
        type="text"
        placeholder="Referência da Tabela"
        value={referenciaTabela}
        onChange={(e) => setReferenciaTabela(e.target.value)}
      />

      <input
        className="p-2 border rounded"
        type="date"
        placeholder="Data de Vencimento"
        value={dataVencimento}
        onChange={(e) => setDataVencimento(e.target.value)}
      />

      <input
        className="p-2 border rounded"
        type="text"
        placeholder="Forma de Pagamento"
        value={formaPagamento}
        onChange={(e) => setFormaPagamento(e.target.value)}
      />

      <hr />

      <div className="grid gap-2">
        <select
          className="p-2 border rounded"
          value={produtoSelecionado}
          onChange={(e) => setProdutoSelecionado(e.target.value)}
        >
          <option value="">Selecione o produto</option>
          {produtos.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>

        <input
          className="p-2 border rounded"
          type="number"
          placeholder="Quantidade"
          value={quantidade}
          onChange={(e) => setQuantidade(e.target.value)}
        />

        <input
          className="p-2 border rounded"
          type="number"
          placeholder="Valor Unitário"
          value={valorUnitario}
          onChange={(e) => setValorUnitario(e.target.value)}
        />

        <button
          className="bg-[#a65a3d] hover:bg-[#8c3b1b] text-white py-2 rounded"
          onClick={adicionarItemAoPedido}
        >
          ➕ Adicionar Item
        </button>
      </div>

      {itensPedido.length > 0 && (
        <div className="bg-white p-3 rounded border mt-4">
          <h3 className="font-bold mb-2">Itens do Pedido:</h3>
          <ul className="list-disc pl-5 text-sm text-gray-700">
            {itensPedido.map((item, idx) => (
              <li key={idx}>
                {item.produto} – {item.quantidade}x R${item.valorUnitario}
              </li>
            ))}
          </ul>
        </div>
      )}

      <button
        onClick={salvarPedidoRapido}
        className="mt-6 bg-[#d38b5d] hover:bg-[#c3794a] text-white font-bold py-3 rounded"
      >
        💾 Salvar Pedido
      </button>

      <button
        onClick={() => setTelaAtual("PCP")}
        className="text-[#a65a3d] text-sm mt-2 underline"
      >
        Voltar para o Início
      </button>
    </div>
  </div>
)}
{/* === FIM RT02 === */}
    </>
  );
}

export default App;

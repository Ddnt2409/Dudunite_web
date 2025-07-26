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
  const [formasPagamento, setFormasPagamento] = useState([]);
  const [tabelaPreco, setTabelaPreco] = useState([]);

  const cidades = ["Gravatá", "Recife", "Caruaru"];
  const produtos = ["BRW 7x7", "BRW 6x6", "PKT 5x5", "PKT 6x6", "Esc", "DUDU"];

  const escolasPorCidade = {
    Gravatá: ["Pequeno Príncipe", "Salesianas", "Céu Azul", "Russas", "Bora Gastar", "Kaduh", "Society Show", "Degusty"],
    Recife: ["Tio Valter", "Vera Cruz", "Pinheiros", "Dourado", "BMQ", "CFC", "Madre de Deus", "Saber Viver"],
    Caruaru: ["Interativo", "Exato Sede", "Exato Anexo", "Sesi", "Motivo", "Jesus Salvador"],
  };

  const escolasFiltradas = cidade ? escolasPorCidade[cidade] || [] : [];

  useEffect(() => {
    if (telaAtual === "Sabores") {
      carregarPedidosLancados();
    }
  }, [telaAtual]);

  useEffect(() => {
    carregarTabelaPrecoFirebase(setTabelaPreco);
    carregarFormasPagamento(setFormasPagamento);
  }, []);
// === FIM FN03 ===
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
  // === FN08 – Carregar pedidos com status 'Pendente' ===
const carregarPedidosPendentes = async () => {
  try {
    const pedidosRef = collection(db, "PEDIDOS");
    const q = query(pedidosRef, where("statusEtapa", "==", "Pendente"));
    const querySnapshot = await getDocs(q);
    const pedidos = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    setPedidosPendentes(pedidos);
  } catch (error) {
    console.error("Erro ao carregar pedidos pendentes:", error);
    setPedidosPendentes([]);
  }
};
// === FN09 – Salvar sabores selecionados ===
const salvarSabores = async (pedido, index) => {
  try {
    const pedidoRef = collection(db, "PEDIDOS");

    await addDoc(pedidoRef, {
      ...pedido,
      statusEtapa: "Sabores Preenchidos",
      atualizadoEm: serverTimestamp(),
    });

    alert("Sabores salvos com sucesso!");
  } catch (error) {
    console.error("Erro ao salvar sabores:", error);
    alert("Erro ao salvar sabores.");
  }
};
  //FN09 - Final
  // === FN10 – Carregar Tabela de Preços ===
const carregarTabelaDePrecos = async () => {
  try {
    const tabelaRef = collection(db, "tabela_precos");
    const querySnapshot = await getDocs(tabelaRef);
    const precos = {};
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      precos[data.produto] = data.valorRevenda; // apenas revenda usada como referência
    });
    setTabelaPrecos(precos);
  } catch (error) {
    console.error("Erro ao carregar tabela de preços:", error);
  }
};  
// === FIM FN10 ===

// === FN11 – Buscar valor unitário na tabela ===
const buscarValorUnitario = (produtoSelecionado) => {
  if (tabelaPrecos && tabelaPrecos[produtoSelecionado]) {
    setValorUnitario(tabelaPrecos[produtoSelecionado]);
  } else {
    setValorUnitario("");
  }
};
// === FIM FN11 ===
  // === INÍCIO FN12 – Carregar tabela de preços do Firebase ===
const carregarTabelaPrecoFirebase = async (setTabelaPreco) => {
  try {
    const ref = collection(db, "tabela_precos");
    const snapshot = await getDocs(ref);

    const precos = snapshot.docs.map((doc) => doc.data());
    const precosMaisRecentes = {};

    precos.forEach((p) => {
      const chave = `${p.cidade}-${p.produto}`;
      if (
        !precosMaisRecentes[chave] ||
        (p.timestamp?.seconds || 0) > (precosMaisRecentes[chave].timestamp?.seconds || 0)
      ) {
        precosMaisRecentes[chave] = p;
      }
    });

    setTabelaPreco(Object.values(precosMaisRecentes));
  } catch (error) {
    console.error("Erro ao carregar tabela de preços:", error);
    setTabelaPreco([]);
  }
};
// === FIM FN12 ===

// === INÍCIO FN13 – Ajustar valor unitário ao selecionar produto ===
const ajustarValorProdutoAoSelecionar = ({
  produtoSelecionado,
  cidade,
  tabelaPreco,
  setValorUnitario,
  referenciaTabela,
}) => {
  const item = tabelaPreco.find(
    (p) =>
      p.produto === produtoSelecionado &&
      p.cidade === cidade &&
      p.referencia === referenciaTabela
  );

  if (item) {
    setValorUnitario(item.valor);
  } else {
    setValorUnitario("");
  }
};
// === FIM FN13 ===

// === INÍCIO FN14 – Carregar formas de pagamento fixas ===
const carregarFormasPagamento = (setFormasPagamento) => {
  const formas = ["PIX", "Espécie", "Boleto"];
  setFormasPagamento(formas);
};
// === FIM FN14 ===
  // === INÍCIO FN15 – Inicializar Formas de Pagamento ===
useEffect(() => {
  const formas = ["PIX", "Espécie", "Boleto"];
  setFormasPagamento(formas);
}, []);
// === FIM FN15 ===
// === RT99 – Return do Componente ===
return (
  <>
    {/* === RT00a – Tela Inicial PCP === */}
    {telaAtual === "PCP" && (
      <div className="min-h-screen bg-[#fdf8f5] flex flex-col items-center p-4">
        <img src={logoPath} alt="Logomarca Dudunitê" className="w-40 mt-4 mb-2" />
        <h1 className="text-2xl font-bold text-[#a65a3d] mb-6">
          PCP – Planejamento e Controle de Produção
        </h1>

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
                  ? `${data.toLocaleDateString()} ${data.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}`
                  : "Data desconhecida";
                return (
                  <li
                    key={pedido.id}
                    className="flex justify-between items-center bg-[#f9f1e8] p-2 rounded border border-[#d3c0b0]"
                  >
                    <span>
                      {dataFormatada} – {pedido.escola}
                    </span>
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
    {/* === FIM RT00a === */}

    {/* === INÍCIO RT01 – Alimentar Sabores === */}
    {telaAtual === "Sabores" && (
      <div className="p-4 bg-[#fdf8f5] min-h-screen">
        <h2 className="text-2xl font-bold mb-4 text-[#8c3b1b]">Alimentar Sabores</h2>

        {pedidosPendentes.length === 0 ? (
          <p className="text-gray-600">Nenhum pedido pendente encontrado.</p>
        ) : (
          <div className="space-y-6">
            {pedidosPendentes.map((pedido, index) => (
              <div
                key={index}
                className="border border-gray-300 rounded p-4 bg-white shadow"
              >
                <p><strong>Cidade:</strong> {pedido.cidade}</p>
                <p><strong>Escola:</strong> {pedido.escola}</p>

                <div className="mt-4 space-y-4">
                  {pedido.itens.map((item, itemIndex) => (
                    <div
                      key={itemIndex}
                      className="border p-3 rounded bg-gray-50"
                    >
                      <p><strong>Produto:</strong> {item.produto}</p>
                      <p><strong>Quantidade:</strong> {item.quantidade}</p>

                      <div className="mt-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Sabores:
                        </label>
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
                                    const saboresAtuais =
                                      novosPedidos[index].itens[itemIndex].sabores || [];

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
      </div>
    )}
    {/* === FIM RT01 === */}

    {/* === INÍCIO RT02 – Tela de Resumo de Pedidos === */}
    {telaAtual === "Resumo" && (
      <div className="p-6 bg-[#fdf8f5] min-h-screen">
        <h2 className="text-2xl font-bold mb-4 text-[#8c3b1b]">Resumo de Pedidos</h2>

        {pedidosLancados.length === 0 ? (
          <p className="text-gray-600">Nenhum pedido lançado.</p>
        ) : (
          <ul className="space-y-3">
            {pedidosLancados.map((pedido, idx) => (
              <li
                key={pedido.id || idx}
                className="bg-white rounded p-3 border border-gray-200 shadow-sm"
              >
                <p><strong>Escola:</strong> {pedido.escola}</p>
                <p><strong>Cidade:</strong> {pedido.cidade}</p>
                <p><strong>Valor Total:</strong> R$ {pedido.totalPedido?.toFixed(2)}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    )}
    {/* === FIM RT02 === */}

{/* === INÍCIO RT03 – Tela de Lançamento de Pedido === */}
{telaAtual === "Lancamento" && (
  <div className="p-6 bg-[#fdf8f5] min-h-screen">
    <h2 className="text-2xl font-bold mb-4 text-[#8c3b1b]">Lançamento de Pedido</h2>

    <div className="space-y-4 max-w-xl mx-auto">
      {/* Cidade */}
      <div>
        <label className="block text-sm font-medium text-gray-700">Cidade</label>
        <select
          value={cidade}
          onChange={(e) => {
            setCidade(e.target.value);
            ajustarValorProdutoAoSelecionar({
              produtoSelecionado,
              cidade: e.target.value,
              tabelaPreco,
              setValorUnitario,
              referenciaTabela,
            });
          }}
          className="mt-1 block w-full border border-gray-300 rounded px-3 py-2"
        >
          <option value="">Selecione</option>
          {cidades.map((c, i) => (
            <option key={i} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {/* Escola */}
      <div>
        <label className="block text-sm font-medium text-gray-700">Escola</label>
        <select
          value={escola}
          onChange={(e) => setEscola(e.target.value)}
          className="mt-1 block w-full border border-gray-300 rounded px-3 py-2"
        >
          <option value="">Selecione</option>
          {escolasFiltradas.map((e, i) => (
            <option key={i} value={e}>{e}</option>
          ))}
        </select>
      </div>

      {/* Vencimento */}
      <div>
        <label className="block text-sm font-medium text-gray-700">Vencimento</label>
        <input
          type="date"
          value={dataVencimento}
          onChange={(e) => setDataVencimento(e.target.value)}
          className="mt-1 block w-full border border-gray-300 rounded px-3 py-2"
        />
      </div>

      {/* Forma de Pagamento */}
      <div>
        <label className="block text-sm font-medium text-gray-700">Forma de Pagamento</label>
        <select
          value={formaPagamento}
          onChange={(e) => setFormaPagamento(e.target.value)}
          className="mt-1 block w-full border border-gray-300 rounded px-3 py-2"
        >
          <option value="">Selecione</option>
          {formasPagamento.map((f, i) => (
            <option key={i} value={f}>{f}</option>
          ))}
        </select>
      </div>

      {/* === QUADRANTE – Produto, Quantidade, V. Unit, Total === */}
      <div className="space-y-2">
        {/* Linha de Produto, Qtd, V. Unit */}
        <div className="grid grid-cols-3 gap-2">
          <select
            value={produtoSelecionado}
            onChange={(e) => {
              setProdutoSelecionado(e.target.value);
              ajustarValorProdutoAoSelecionar({
                produtoSelecionado: e.target.value,
                cidade,
                tabelaPreco,
                setValorUnitario,
                referenciaTabela,
              });
            }}
            className="border border-gray-300 rounded px-2 py-1"
          >
            <option value="">Produto</option>
            {produtos.map((p, i) => (
              <option key={i} value={p}>{p}</option>
            ))}
          </select>

          <input
            type="number"
            min="1"
            value={quantidade}
            onChange={(e) => setQuantidade(e.target.value)}
            className="border border-gray-300 rounded px-2 py-1"
            placeholder="Qtd"
          />

          <input
            type="number"
            min="0"
            step="0.01"
            value={valorUnitario}
            onChange={(e) => setValorUnitario(e.target.value)}
            className="border border-gray-300 rounded px-2 py-1"
            placeholder="V. Unit"
          />
        </div>

        {/* Botão Adicionar Item */}
        <button
          onClick={adicionarItemAoPedido}
          className="bg-[#8c3b1b] text-white py-2 px-4 rounded"
        >
          ➕ Adicionar Item
        </button>

        {/* Lista de Itens do Pedido */}
        <ul className="space-y-2 mt-2">
          {itensPedido.map((item, i) => (
            <li key={i} className="bg-white border p-2 rounded shadow text-sm">
              {item.quantidade}x {item.produto} – R$ {item.valorUnitario.toFixed(2)}
            </li>
          ))}
        </ul>

        {/* Total do Pedido */}
{itensPedido.length > 0 && (
  <div className="text-right text-[#8c3b1b] font-bold text-lg mt-6">
    Total: R$ {
      (
        itensPedido.reduce(
          (acc, item) => acc + item.quantidade * item.valorUnitario,
          0
        )
      ).toFixed(2)
    }
  </div>
)}
        {/* Botões de ação */}
<div className="mt-6 flex justify-between">
          <button
            onClick={() => setTelaAtual("PCP")}
            className="bg-gray-400 text-white px-4 py-2 rounded"
          >
            ← Voltar
          </button>

          <button
            onClick={salvarPedidoRapido}
            className="bg-green-600 text-white px-4 py-2 rounded"
          >
            💾 Salvar Pedido
          </button>
        </div> {/* FIM do container de ações */}
      </div> {/* FIM do container interno */}
  </> {/* FIM do fragmento */}
); // FIM do return

export default App;

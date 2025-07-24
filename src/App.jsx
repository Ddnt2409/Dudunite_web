// === FN01 – Importações Gerais ===
import React, { useState, useEffect } from "react";
import { collection, addDoc, getDocs, query, where, serverTimestamp } from "firebase/firestore";
import db from "./firebase";
import dbFinanceiro from "./firebaseFinanceiro"; // ✅ Adicionado corretamente
// === FN02 – Cores e Logomarca ===
const corPrimaria = "#8c3b1b";
const logoPath = "/LogomarcaDDnt2025Vazado.png";

// === INÍCIO FN03 – Componente Principal: App ===
const App = () => {
  // Estados principais
  const [cidade, setCidade] = useState("");
  const [escola, setEscola] = useState("");
  const [produtoSelecionado, setProdutoSelecionado] = useState("");
  const [quantidade, setQuantidade] = useState(1);
  const [itens, setItens] = useState([]);
  const [pedidos, setPedidos] = useState([]);
  const [dataSelecionada, setDataSelecionada] = useState("");
  const [mostrarDadosMestres, setMostrarDadosMestres] = useState(false);
  const [mostrarPlanejamento, setMostrarPlanejamento] = useState(false);
  const [mostrarListaCompras, setMostrarListaCompras] = useState(false);
  const [mostrarFormularioPDV, setMostrarFormularioPDV] = useState(false);
  const [pedidosFiltrados, setPedidosFiltrados] = useState([]);
  const [modoEdicaoPDV, setModoEdicaoPDV] = useState(false);
  const [cidadeSelecionadaPDV, setCidadeSelecionadaPDV] = useState("");
  const [novoPDV, setNovoPDV] = useState("");
  const [pdvs, setPdvs] = useState([]);
  const [mostrarRT03, setMostrarRT03] = useState(false);
  const [modoAlimentarSabores, setModoAlimentarSabores] = useState(false);
  const [statusEtapa, setStatusEtapa] = useState("Lançado");
  const [filtrosData, setFiltrosData] = useState({ inicio: "", fim: "" });
  const [mostrarRT06, setMostrarRT06] = useState(false);

  // === INÍCIO useStates da FN03 – Tabela de Preço e Valor Unitário ===
  const [tabelaPreco, setTabelaPreco] = useState([]);
  const [referenciaTabela, setReferenciaTabela] = useState("");
  const [referenciasTabela, setReferenciasTabela] = useState([]);
  const [valorUnitario, setValorUnitario] = useState("");
  // === FIM useStates da FN03 ===
// === FIM FN03 ===
// === INÍCIO FN03a – Estados adicionais pendentes ===
  const [telaAtual, setTelaAtual] = useState("PCP");
  const [pedidosLancados, setPedidosLancados] = useState([]);
  const [pedidosPendentes, setPedidosPendentes] = useState([]);
  const [formasPagamento, setFormasPagamento] = useState([]);
  const [dataVencimento, setDataVencimento] = useState("");
  const [formaPagamento, setFormaPagamento] = useState("");
  const [tabelaSelecionada, setTabelaSelecionada] = useState("");
  const [itensPedido, setItensPedido] = useState([]);
  const [produtos, setProdutos] = useState([]);
  const [cidades, setCidades] = useState([]);
  const [escolasFiltradas, setEscolasFiltradas] = useState([]);
  const [saboresDisponiveis, setSaboresDisponiveis] = useState([]);
  // === FIM FN03a ===
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

// === FN11 – espaço vago
// === INÍCIO FN12 – Carregar tabela de preços do Firestore (módulo financeiro) ===
// === INÍCIO FN12 – Carregar tabela de preços do Firestore (módulo financeiro) ===
const carregarTabelaPrecos = async (setTabelaPreco, setReferenciasTabela) => {
  try {
    const ref = collection(dbFinanceiro, "tabela_precos_revenda");
    const snapshot = await getDocs(ref);

    const precos = [];
    const referencias = [];

    snapshot.forEach((doc) => {
      const data = doc.data();
      const referencia = doc.id;
      referencias.push(referencia);

      const precosMap = data.precos || {};
      Object.entries(precosMap).forEach(([produto, valores]) => {
        precos.push({
          produto,
          cidade: "", // ainda não usamos cidade na base
          referencia,
          valor: valores.rev2 || 0,
        });
      });
    });

    setTabelaPreco(precos);
    setReferenciasTabela(referencias);
  } catch (erro) {
    console.error("Erro ao carregar tabela de preços:", erro);
    setTabelaPreco([]);
    setReferenciasTabela([]);
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
  if (!produtoSelecionado || !cidade || !referenciaTabela) {
    setValorUnitario("");
    return;
  }

  const item = tabelaPreco.find(
    (p) =>
      p.produto === produtoSelecionado &&
      p.cidade === cidade &&
      p.referencia === referenciaTabela
  );

if (item && typeof item.valor === "number") {
    setValorUnitario(item.valor);
  } else {
    setValorUnitario("");
  }
}; // ✅ fecha apenas a função ajustarValorProdutoAoSelecionar

// === FIM FN13 ===

// === INÍCIO FN14 – Carregar formas de pagamento fixas ===
const carregarFormasPagamento = (setFormasPagamento) => {
  const formas = ["PIX", "Espécie", "Boleto"];
  setFormasPagamento(formas);
};
// === FIM FN14 ===
// === INÍCIO FN15 – Atualizar valor unitário ao mudar cidade/produto/tabela ===
useEffect(() => {
  ajustarValorProdutoAoSelecionar({
    produtoSelecionado,
    cidade,
    tabelaPreco,
    setValorUnitario,
    referenciaTabela,
  });
}, [produtoSelecionado, cidade, referenciaTabela, tabelaPreco]);
return (
    <>
      {/* === INÍCIO DEBUG VISUAL TEMPORÁRIO – Exibir quantidade de preços carregados === */}
      <div style={{ padding: "10px", backgroundColor: "#ffe" }}>
        <strong>Preços carregados:</strong> {tabelaPreco.length}
      </div>
      {/* === FIM DEBUG VISUAL TEMPORÁRIO === */}
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
                </div> // ✅ Fecha item individual
              ))}
            </div> {/* Fecha bloco de itens */}

            <div className="mt-4 text-right">
              <button
                onClick={() => salvarSabores(pedido, index)}
                className="bg-[#8c3b1b] hover:bg-[#6d2d14] text-white font-semibold py-2 px-4 rounded"
              >
                💾 Salvar Pedido
              </button>
            </div>
          </div> // ✅ Fecha pedido
        ))}
      </div> // ✅ Fecha lista de pedidos
    )}
  </div> // ✅ Fecha container principal de Sabores
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

      {/* Tabela */}
      <div>
        <label className="block text-sm font-medium text-gray-700">Tabela</label>
        <select
          value={referenciaTabela}
          onChange={(e) => {
            const novaRef = e.target.value;
            setReferenciaTabela(novaRef);
            ajustarValorProdutoAoSelecionar({
              produtoSelecionado,
              cidade,
              tabelaPreco,
              setValorUnitario,
              referenciaTabela: novaRef,
            });
          }}
          className="mt-1 block w-full border border-gray-300 rounded px-3 py-2"
        >
          <option value="">Selecione</option>
          {referenciasTabela.map((ref, i) => (
            <option key={i} value={ref}>{ref}</option>
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

      {/* Produto, Quantidade, Valor */}
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
          placeholder="R$"
        />
      </div>

      <button
        onClick={adicionarItemAoPedido}
        className="mt-2 bg-[#8c3b1b] text-white py-2 px-4 rounded"
      >
        ➕ Adicionar Item
      </button>

      <ul className="mt-4 space-y-2">
        {itensPedido.map((item, i) => (
          <li key={i} className="bg-white border p-2 rounded shadow text-sm">
            {item.quantidade}x {item.produto} – R$ {item.valorUnitario.toFixed(2)}
          </li>
        ))}
      </ul>

      {itensPedido.length > 0 && (
        <div className="text-right text-[#8c3b1b] font-bold text-lg mt-2">
          Total: R$ {itensPedido.reduce((acc, item) => acc + item.quantidade * item.valorUnitario, 0).toFixed(2)}
        </div>
      )}

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
  </div> {/* Fecha div dos botões */}
</div>   {/* Fecha container geral da tela */}
</>      {/* Fecha o React Fragment */}
)}       {/* Fecha a condicional telaAtual === 'Lancamento' */}
);       {/* Fecha o return */}
};       {/* Fecha a função App */}

export default App;

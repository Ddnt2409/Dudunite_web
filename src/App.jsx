// === FN01 – Importações Gerais ===
import React, { useState, useEffect } from "react";
import { collection, addDoc, getDocs, query, where, serverTimestamp } from "firebase/firestore";
import db from "./firebase";
// === FIM FN01 ===
// === FN02 – Cores e Logomarca (placeholder, não usado aqui) ===
const corPrimaria = "#8c3b1b";
const logoPath = "/LogomarcaDDnt2025Vazado.png";

// === INÍCIO FN03 – Componente App e Estados ===
function App() {
  const [telaAtual, setTelaAtual] = useState("PCP");
  const [cidade, setCidade] = useState("");
  const [escola, setEscola] = useState("");
  const [produtoSelecionado, setProdutoSelecionado] = useState("");
  const [quantidade, setQuantidade] = useState(1);
  const [dataVencimento, setDataVencimento] = useState("");
  const [formaPagamento, setFormaPagamento] = useState("");
  const [referenciaTabela, setReferenciaTabela] = useState("");
  const [anexoNota, setAnexoNota] = useState(null);
  const [anexoBoleto, setAnexoBoleto] = useState(null);

  const cidades = ["Gravatá", "Recife", "Caruaru"];
  const produtos = ["BRW 7x7", "BRW 6x6", "PKT 5x5", "PKT 6x6", "Esc", "DUDU"];

  const escolasPorCidade = {
    Gravatá: ["Pequeno Príncipe", "Salesianas", "Céu Azul", "Russas", "Bora Gastar", "Kaduh", "Society Show", "Degusty"],
    Recife: ["Tio Valter", "Vera Cruz", "Pinheiros", "Dourado", "BMQ", "CFC", "Madre de Deus", "Saber Viver"],
    Caruaru: ["Interativo", "Exato Sede", "Exato Anexo", "Sesi", "Motivo", "Jesus Salvador"],
  };

  const escolasFiltradas = cidade ? escolasPorCidade[cidade] || [] : [];

  const handleAnexoNota = (e) => setAnexoNota(e.target.files[0]);
  const handleAnexoBoleto = (e) => setAnexoBoleto(e.target.files[0]);

  const [pedidosLancados, setPedidosLancados] = useState([]);
// === FIM FN03 ===
// === INÍCIO FN04 – Carregar pedidos com status 'Lançado' ===
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
// === FIM FN04 ===
// === INÍCIO FN05 – Salvar Pedido Rápido e Retornar à Tela Inicial ===
const salvarPedidoRapido = async () => {
  try {
    const novoPedido = {
      cidade,
      escola,
      produto: produtoSelecionado,
      quantidade: Number(quantidade),
      dataVencimento,
      formaPagamento,
      referenciaTabela,
      statusEtapa: "Lançado",
      criadoEm: serverTimestamp(),
    };

    const pedidosRef = collection(db, "PEDIDOS");
    await addDoc(pedidosRef, novoPedido);

    // Resetar campos
    setCidade("");
    setEscola("");
    setProdutoSelecionado("");
    setQuantidade(1);
    setDataVencimento("");
    setFormaPagamento("");
    setReferenciaTabela("");
    setAnexoNota(null);
    setAnexoBoleto(null);

    // Voltar à tela principal
    setTelaAtual("PCP");

    // Atualizar lista de pedidos
    carregarPedidosLancados();
  } catch (error) {
    console.error("Erro ao salvar pedido:", error);
  }
};
// === FIM FN05 ===
  // === RT99 – Return mínimo apenas para teste ===
  return (
    <>
{/* === INÍCIO RT0a – PCP: Tela Inicial com Botões === */}
{telaAtual === "PCP" && (
  <div className="min-h-screen bg-[#fdf8f5] flex flex-col items-center p-4">
    <img src="/LogomarcaDDnt2025Vazado.png" alt="Logomarca Dudunitê" className="w-40 mt-4 mb-2" />
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
  </div>
)}
{/* === FIM RT0a === */}

{/* === INÍCIO RT0b – Lista de Pedidos Lançados === */}
{telaAtual === "PCP" && pedidosLancados.length > 0 && (
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
{/* === FIM RT0b === */}

{/* === INÍCIO RT01 – Lançamento de Pedido Rápido === */}
{telaAtual === "Lancamento" && (
  <div className="bg-[#FFF3E9] min-h-screen p-4 text-sm font-sans text-[#5C1D0E]">
    <div className="max-w-xl mx-auto">
      <img src="/LogomarcaDDnt2025Vazado.png" alt="Dudunitê" className="w-48 mx-auto mb-4" />
      <h1 className="text-center text-xl font-bold mb-6">Lançamento de Pedido Rápido</h1>

      <div className="mb-4">
        <label className="block font-semibold mb-1">Cidade</label>
        <select value={cidade} onChange={(e) => setCidade(e.target.value)} className="w-full p-2 border rounded">
          <option value="">Selecione</option>
          {cidades.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      <div className="mb-4">
        <label className="block font-semibold mb-1">Escola / PDV</label>
        <select value={escola} onChange={(e) => setEscola(e.target.value)} className="w-full p-2 border rounded" disabled={!cidade}>
          <option value="">Selecione</option>
          {escolasFiltradas.map((e) => (
            <option key={e} value={e}>{e}</option>
          ))}
        </select>
      </div>

      <div className="mb-4">
        <label className="block font-semibold mb-1">Produto</label>
        <select value={produtoSelecionado} onChange={(e) => setProdutoSelecionado(e.target.value)} className="w-full p-2 border rounded">
          <option value="">Selecione</option>
          {produtos.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
      </div>

      <div className="mb-4">
        <label className="block font-semibold mb-1">Quantidade</label>
        <input type="number" value={quantidade} onChange={(e) => setQuantidade(e.target.value)} className="w-full p-2 border rounded" />
      </div>

      <div className="mb-4">
        <label className="block font-semibold mb-1">Data de Vencimento</label>
        <input type="date" value={dataVencimento} onChange={(e) => setDataVencimento(e.target.value)} className="w-full p-2 border rounded" />
      </div>

      <div className="mb-4">
        <label className="block font-semibold mb-1">Forma de Pagamento</label>
        <select value={formaPagamento} onChange={(e) => setFormaPagamento(e.target.value)} className="w-full p-2 border rounded">
          <option value="">Selecione</option>
          <option value="PIX">PIX</option>
          <option value="Boleto">Boleto</option>
          <option value="Espécie">Espécie</option>
        </select>
      </div>

      {formaPagamento === "PIX" && (
        <div className="mb-4 bg-yellow-100 p-2 rounded">
          <p className="text-sm">🔑 Chave PIX padrão: <strong>chavepix@dudunite.com.br</strong></p>
        </div>
      )}

      <div className="mb-4">
        <label className="block font-semibold mb-1">Referência de Tabela</label>
        <select value={referenciaTabela} onChange={(e) => setReferenciaTabela(e.target.value)} className="w-full p-2 border rounded">
          <option value="">Selecione</option>
          <option value="Rev1">Rev1</option>
          <option value="Rev2">Rev2</option>
          <option value="Varejo1">Varejo1</option>
          <option value="Varejo2">Varejo2</option>
        </select>
      </div>

      {formaPagamento === "Boleto" && (
        <div className="mb-4">
          <label className="block font-semibold mb-1">Anexar Nota Fiscal</label>
          <input type="file" accept=".pdf" onChange={handleAnexoNota} className="mb-2 w-full" />

          <label className="block font-semibold mb-1">Anexar Boleto</label>
          <input type="file" accept=".pdf" onChange={handleAnexoBoleto} className="w-full" />
        </div>
      )}

      <button onClick={salvarPedidoRapido} className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 rounded">
        💾 Salvar Pedido
      </button>
    </div>
  </div>
)}
{/* === FIM RT01 === */}
    </>
  );
}

// === FIM RT99 ===
export default App;

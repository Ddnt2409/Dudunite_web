// src/pages/LanPed.jsx
import React, { useState, useEffect, useRef } from "react";
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  serverTimestamp,
  onSnapshot,
  orderBy,
} from "firebase/firestore";
import db from "../firebase";
import "./LanPed.css";

export default function LanPed({ setTela }) {
  // ─── STATES PARA O FORMULÁRIO ─────────────────────
  const [cidade, setCidade] = useState("");
  const [pdv, setPdv] = useState("");
  const [produto, setProduto] = useState("");
  const [quantidade, setQuantidade] = useState(1);
  const [valorUnitario, setValorUnitario] = useState("");
  const [formaPagamento, setFormaPagamento] = useState("");
  const [dataVencimento, setDataVencimento] = useState("");
  const [itens, setItens] = useState([]);
  const [pedidoExistente, setPedidoExistente] = useState(false); 

  // ─── DADOS FIXOS (podem vir do Firestore futuramente) ───────────
  const cidades = ["Gravatá", "Recife", "Caruaru"];
  const pdvsPorCidade = {
    Gravatá: ["Pequeno Príncipe", "Salesianas", "Céu Azul", "Russas", "Bora Gastar", "Kaduh", "Society Show", "Degusty"],
    Recife: ["Tio Valter", "Vera Cruz", "Pinheiros", "Dourado", "BMQ", "CFC", "Madre de Deus", "Saber Viver"],
    Caruaru: ["Interativo", "Exato Sede", "Exato Anexo", "Sesi", "Motivo", "Jesus Salvador"],
  };
  const produtos = ["BRW 7x7", "BRW 6x6", "PKT 5x5", "PKT 6x6", "Esc", "DUDU"];
  const formasPagamento = ["PIX", "Espécie", "Cartão", "Boleto"];

  // ─── CÁLCULO DE TOTAL ───────────────────────────────
  useEffect(() => {
    if (quantidade && valorUnitario) {
      const total = parseFloat(quantidade) * parseFloat(valorUnitario);
      setTotalPedido(total.toFixed(2));
    }
  }, [quantidade, valorUnitario]);

  const [totalPedido, setTotalPedido] = useState("0.00");

  // ─── FUNÇÃO ADICIONAR ITEM ──────────────────────────
  function adicionarItem() {
    if (!produto || quantidade <= 0 || !valorUnitario) {
      alert("Preencha produto, quantidade e valor unitário.");
      return;
    }
    setItens((old) => [
      ...old,
      { produto, quantidade, valorUnitario },
    ]);
    // reset
    setProduto("");
    setQuantidade(1);
    setValorUnitario("");
  }

  // ─── FUNÇÃO SALVAR PEDIDO ───────────────────────────
  async function handleSalvar() {
    if (pedidoExistente) {
      if (!window.confirm("Há pedido existente. Lançar novo?")) return;
    }
    if (!cidade || !pdv || itens.length === 0 || !formaPagamento) {
      alert("Preencha todos os campos obrigatórios.");
      return;
    }
    const novo = {
      cidade,
      escola: pdv,
      itens,
      formaPagamento,
      dataVencimento: dataVencimento || null,
      total: parseFloat(totalPedido),
      statusEtapa: "Lançado",
      criadoEm: serverTimestamp(),
    };
    try {
      await addDoc(collection(db, "PEDIDOS"), novo);
      alert("✅ Pedido salvo com sucesso!");
      // reset form
      setCidade(""); setPdv(""); setItens([]); setFormaPagamento("");
      setDataVencimento(""); setTotalPedido("0.00");
    } catch (e) {
      console.error(e);
      alert("❌ Falha ao salvar pedido.");
    }
  }

  // ─── LISTENERS PARA STATUS POR PDV ──────────────────
  const [statusPorPdv, setStatusPorPdv] = useState({});
  useEffect(() => {
    const ref = collection(db, "PEDIDOS");
    const q = query(ref, orderBy("criadoEm", "asc"));
    const unsub = onSnapshot(q, (snap) => {
      const m = {};
      snap.docs.forEach(doc => {
        const d = doc.data();
        if (d.escola) m[d.escola] = d.statusEtapa;
      });
      setStatusPorPdv(m);
    });
    return () => unsub();
  }, []);

  return (
    <div className="lanped-container">
      {/* Voltar para PCP */}
      <button className="botao-voltar" onClick={() => setTela("HomePCP")}>
        🔙 Voltar para PCP
      </button>

      <h1 className="lanped-titulo">Lançar Pedido</h1>

      <div className="lanped-formulario">
        <label>Cidade</label>
        <select value={cidade} onChange={e => { setCidade(e.target.value); setPdv(""); }}>
          <option value="">Selecione</option>
          {cidades.map(c => <option key={c} value={c}>{c}</option>)}
        </select>

        <label>Ponto de Venda</label>
        <select value={pdv} onChange={e => setPdv(e.target.value)} disabled={!cidade}>
          <option value="">Selecione</option>
          {cidade && pdvsPorCidade[cidade].map(p => <option key={p} value={p}>{p}</option>)}
        </select>

        <label>Produto</label>
        <select value={produto} onChange={e => setProduto(e.target.value)}>
          <option value="">Selecione</option>
          {produtos.map(p => <option key={p} value={p}>{p}</option>)}
        </select>

        <label>Quantidade</label>
        <input type="number" value={quantidade}
          onChange={e => setQuantidade(Number(e.target.value))} />

        <label>Valor Unitário</label>
        <input type="number" step="0.01" value={valorUnitario}
          onChange={e => setValorUnitario(e.target.value)} />

        <button className="botao-adicionar" onClick={adicionarItem}>
          ➕ Adicionar Item
        </button>

        {itens.length > 0 && (
          <ul className="lista-itens">
            {itens.map((it, i) => (
              <li key={i}>
                {it.quantidade}× {it.produto} — R$ {parseFloat(it.valorUnitario).toFixed(2)}
                <button className="botao-excluir" onClick={() => {
                  setItens(itens.filter((_, j) => j !== i));
                }}>✖</button>
              </li>
            ))}
          </ul>
        )}

        <div className="total-pedido">
          <strong>Total:</strong> R$ {totalPedido}
        </div>

        <label>Forma de Pagamento</label>
        <select value={formaPagamento} onChange={e => setFormaPagamento(e.target.value)}>
          <option value="">Selecione</option>
          {formasPagamento.map(f => <option key={f} value={f}>{f}</option>)}
        </select>

        {formaPagamento === "Boleto" && (
          <>
            <label>Anexar Nota Fiscal</label>
            <input type="file" accept=".pdf,.jpg,.png" />
            <label>Anexar Boleto</label>
            <input type="file" accept=".pdf,.jpg,.png" />
          </>
        )}

        <label>Data de Vencimento</label>
        <input type="date" value={dataVencimento}
          onChange={e => setDataVencimento(e.target.value)} />

        <button className="botao-salvar" onClick={handleSalvar}>
          💾 Salvar Pedido
        </button>
      </div>

      {/* ─── RODAPÉ FIXO ─────────────────────────────── */}
      <footer className="lanped-footer">
        <div className="lista-escolas-marquee">
          <span className="marquee-content">
            • Pequeno Príncipe • Salesianas • Céu Azul • Russas • Bora Gastar • Kaduh • Society Show • Degusty • Tio Valter • Vera Cruz
          </span>
        </div>
        <div className="status-pdvs">
          {Object.entries(statusPorPdv).map(([p, s]) => (
            <span key={p} className="status-item">{p}: <strong>{s}</strong></span>
          ))}
        </div>
      </footer>
    </div>
  );
            }

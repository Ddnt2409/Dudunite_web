// src/pages/LanPed.jsx
import React, { useState, useEffect, useRef } from "react";
import {
  collection,
  addDoc,
  onSnapshot,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";
import db from "../firebase";
import jsPDF from "jspdf";
import "./LanPed.css";

export default function LanPed({ setTela }) {
  // refs & state
  const touchStartX = useRef(null);
  const [cidade, setCidade] = useState("");
  const [pdv, setPdv] = useState("");
  const [produto, setProduto] = useState("");
  const [quantidade, setQuantidade] = useState(1);
  const [valorUnitario, setValorUnitario] = useState("");
  const [itens, setItens] = useState([]);
  const [totalPedido, setTotalPedido] = useState(0.0);
  const [formaPagamento, setFormaPagamento] = useState("");
  const [dataVencimento, setDataVencimento] = useState("");
  const [statusPorPdv, setStatusPorPdv] = useState({});

  // data sources
  const cidades = ["Gravatá", "Recife", "Caruaru"];
  const pdvsPorCidade = {
    Gravatá: ["Pequeno Príncipe", "Salesianas", "Céu Azul", "Russas", "Bora Gastar", "Kaduh", "Society Show", "Degusty"],
    Recife: ["Tio Valter", "Vera Cruz", "Pinheiros", "Dourado", "BMQ", "CFC", "Madre de Deus", "Saber Viver"],
    Caruaru: ["Interativo", "Exato Sede", "Exato Anexo", "Sesi", "Motivo", "Jesus Salvador"],
  };
  const produtos = ["BRW 7x7", "BRW 6x6", "PKT 5x5", "PKT 6x6", "Esc", "DUDU"];
  const formasPagamento = ["PIX", "Espécie", "Cartão", "Boleto"];

  // recompute total when itens change
  useEffect(() => {
    const sum = itens.reduce((acc, { quantidade, valorUnitario }) =>
      acc + quantidade * parseFloat(valorUnitario), 0);
    setTotalPedido(sum.toFixed(2));
  }, [itens]);

  // listen status updates
  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, "PEDIDOS"),
      orderBy("criadoEm", "asc"),
      snap => {
        const map = {};
        snap.docs.forEach(d => {
          const data = d.data();
          if (data.escola) map[data.escola] = data.statusEtapa;
        });
        setStatusPorPdv(map);
      }
    );
    return unsub;
  }, []);

  // add item
  function adicionarItem() {
    if (!produto || quantidade < 1 || !valorUnitario) {
      return alert("Preencha produto, quantidade e valor unitário.");
    }
    setItens(old => [...old, {
      produto,
      quantidade,
      valorUnitario: parseFloat(valorUnitario).toFixed(2),
      total: (quantidade * parseFloat(valorUnitario)).toFixed(2),
    }]);
    setProduto(""); setQuantidade(1); setValorUnitario("");
  }

  // save and generate PDF stub
  async function handleSalvar() {
    if (!cidade || !pdv || itens.length === 0 || !formaPagamento) {
      return alert("Preencha todos os campos obrigatórios.");
    }
    const novo = {
      cidade, escola: pdv, itens,
      formaPagamento,
      dataVencimento: dataVencimento || null,
      total: parseFloat(totalPedido),
      statusEtapa: "Lançado", criadoEm: serverTimestamp(),
    };
    try {
      await addDoc(collection(db, "PEDIDOS"), novo);
      alert("✅ Pedido salvo com sucesso!");
      // generate simple PDF
      const doc = new jsPDF();
      doc.text(`Recibo - ${pdv}`, 10, 10);
      itens.forEach((it, i) => {
        doc.text(
          `${i+1}. ${it.quantidade}× ${it.produto} — R$ ${it.total}`,
          10, 20 + i * 6
        );
      });
      doc.text(`Total: R$ ${totalPedido}`, 10, 20 + itens.length * 6);
      doc.save(`recibo-${pdv}-${Date.now()}.pdf`);

      // reset
      setCidade(""); setPdv(""); setItens([]); setFormaPagamento("");
      setDataVencimento(""); setTotalPedido(0);
    } catch (e) {
      console.error(e);
      alert("❌ Falha ao salvar.");
    }
  }

  return (
    <div className="lanped-container">
      {/* slim vertical back */}
      <button
        className="botao-voltar-vertical"
        onClick={() => setTela("HomePCP")}
      >
        ←<br/>Voltar
      </button>

      {/* quadrant 1 */}
      <div className="card">
        <h2>Local</h2>
        <label>Cidade<select value={cidade} onChange={e => { setCidade(e.target.value); setPdv(""); }}>
          <option value="">Selecione</option>
          {cidades.map(c => <option key={c} value={c}>{c}</option>)}
        </select></label>

        <label>Ponto de Venda<select
            value={pdv}
            onChange={e => setPdv(e.target.value)}
            disabled={!cidade}
          >
            <option value="">Selecione</option>
            {cidade && pdvsPorCidade[cidade].map(p => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select></label>
      </div>

      {/* quadrant 2 */}
      <div className="card">
        <h2>Itens</h2>
        <label>Produto<select
            value={produto}
            onChange={e => setProduto(e.target.value)}
          >
            <option value="">Selecione</option>
            {produtos.map(p => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select></label>

        <label>Quantidade<input
            type="number"
            value={quantidade}
            min="1"
            onChange={e => setQuantidade(+e.target.value)}
          /></label>

        <label>Valor Unitário<input
            type="number"
            step="0.01"
            value={valorUnitario}
            onChange={e => setValorUnitario(e.target.value)}
          /></label>

        <button className="botao-adicionar" onClick={adicionarItem}>
          ➕ Adicionar Item
        </button>

        {itens.length > 0 && (
          <ul className="lista-itens">
            {itens.map((it, i) => (
              <li key={i}>
                {it.quantidade}× {it.produto} — R$ {it.valorUnitario} (R$ {it.total})
                <button
                  className="botao-excluir"
                  onClick={() => setItens(itens.filter((_, j) => j !== i))}
                >✖</button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* quadrant 3 */}
      <div className="card">
        <h2>Condições</h2>
        <div className="total-pedido">
          Total: <strong>R$ {totalPedido}</strong>
        </div>

        <label>Forma de Pagamento<select
            value={formaPagamento}
            onChange={e => setFormaPagamento(e.target.value)}
          >
            <option value="">Selecione</option>
            {formasPagamento.map(f => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select></label>

        {formaPagamento === "Boleto" && (
          <>
            <label>Anexar Nota Fiscal<input type="file" accept=".pdf,.jpg,.png" /></label>
            <label>Anexar Boleto<input type="file" accept=".pdf,.jpg,.png" /></label>
          </>
        )}

        <label>Data de Vencimento<input
            type="date"
            value={dataVencimento}
            onChange={e => setDataVencimento(e.target.value)}
          /></label>
      </div>

      {/* quadrant 4 */}
      <div className="card card-actions">
        <button className="botao-salvar" onClick={handleSalvar}>
          💾 Salvar Pedido
        </button>
      </div>

      {/* footer */}
      <footer className="lanped-footer">
        <div className="lista-escolas-marquee">
          <span className="marquee-content">
            • Pequeno Príncipe • Salesianas • Céu Azul • Russas • Bora Gastar • Kaduh • Society Show • Degusty • Tio Valter • Vera Cruz
          </span>
        </div>
        <div className="status-pdvs">
          {Object.entries(statusPorPdv).map(([p, s]) => (
            <span key={p} className="status-item">
              {p}: <strong>{s}</strong>
            </span>
          ))}
        </div>
      </footer>
    </div>
  );
}

// src/pages/LanPed.jsx
import React, { useState, useEffect, useMemo } from "react";
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";
import db from "../firebase";
import "./LanPed.css";

// ⬇️ cria/atualiza PREVISTO (CAIXA FLUTUANTE) no fluxo
import { upsertPrevistoFromLanPed } from "../util/financeiro_store";

export default function LanPed({ setTela }) {
  // ─── STATES ───────────────────────
  const [cidade, setCidade] = useState("");
  const [pdv, setPdv] = useState("");
  const [produto, setProduto] = useState("");
  const [quantidade, setQuantidade] = useState(1);
  const [valorUnitario, setValorUnitario] = useState("");
  const [formaPagamento, setFormaPagamento] = useState("");
  const [dataVencimento, setDataVencimento] = useState("");
  const [itens, setItens] = useState([]);
  const [statusPorPdv, setStatusPorPdv] = useState({});

  // ─── DADOS FIXOS ───────────────────
  const cidades = ["Gravatá", "Recife", "Caruaru"];
  const pdvsPorCidade = {
    Gravatá: ["Pequeno Príncipe", "Salesianas", "Céu Azul", "Russas", "Bora Gastar", "Kaduh", "Society Show", "Degusty"],
    Recife: ["Tio Valter", "Vera Cruz", "Pinheiros", "Dourado", "BMQ", "CFC", "Madre de Deus", "Saber Viver"],
    Caruaru: ["Interativo", "Exato Sede", "Exato Anexo", "Sesi", "Motivo", "Jesus Salvador"],
  };
  const produtos = ["BRW 7x7", "BRW 6x6", "PKT 5x5", "PKT 6x6", "Esc", "DUDU"];
  const formasPagamento = ["PIX", "Espécie", "Cartão", "Boleto"];

  // ─── TOTAL DOS ITENS (soma do carrinho) ───────────────────
  const totalPedido = useMemo(() => {
    return itens.reduce((acc, it) => acc + (Number(it.quantidade || 0) * Number(it.valorUnitario || 0)), 0);
  }, [itens]);

  // ─── ADICIONA ITEM ──────────────────
  function adicionarItem() {
    if (!produto || Number(quantidade) <= 0 || !valorUnitario) {
      alert("Preencha todos os campos de item.");
      return;
    }
    setItens(old => [
      ...old,
      {
        produto,
        quantidade: Number(quantidade),
        valorUnitario: Number(valorUnitario),
        total: (Number(quantidade) * Number(valorUnitario)),
      },
    ]);
    setProduto("");
    setQuantidade(1);
    setValorUnitario("");
  }

  // ─── SALVA PEDIDO ───────────────────
  async function handleSalvar() {
    if (!cidade || !pdv || itens.length === 0 || !formaPagamento || !dataVencimento) {
      alert("Preencha cidade, PDV, pelo menos 1 item, forma de pagamento e vencimento.");
      return;
    }

    const novo = {
      cidade,
      escola: pdv,
      itens,
      formaPagamento,
      dataVencimento,                // string YYYY-MM-DD
      total: Number(totalPedido),    // soma de todos os itens
      statusEtapa: "Lançado",
      criadoEm: serverTimestamp(),
    };

    try {
      const ref = await addDoc(collection(db, "PEDIDOS"), novo);

      // ⬇️ Já cria o PREVISTO (CAIXA FLUTUANTE) no fluxo
      await upsertPrevistoFromLanPed(ref.id, {
        cidade,
        pdv,                   // ou escola
        itens,
        formaPagamento,
        vencimento: dataVencimento,   // string YYYY-MM-DD
        valorTotal: Number(totalPedido),
        criadoEm: new Date(),         // base pra competência (segunda 11h) — usa agora
      });

      alert("✅ Pedido salvo e previsto no Fluxo!");
      // limpa form
      setCidade("");
      setPdv("");
      setItens([]);
      setFormaPagamento("");
      setDataVencimento("");
    } catch (e) {
      console.error(e);
      alert("❌ Falha ao salvar.");
    }
  }

  // ─── MONITORA STATUS DOS PDVs ───────
  useEffect(() => {
    const ref = collection(db, "PEDIDOS");
    const q = query(ref, orderBy("criadoEm", "asc"));
    return onSnapshot(q, snap => {
      const m = {};
      snap.docs.forEach(doc => {
        const d = doc.data();
        if (d.escola) m[d.escola] = d.statusEtapa;
      });
      setStatusPorPdv(m);
    });
  }, []);

  return (
    <div className="lanped-container">
      {/* HEADER */}
      <div className="lanped-header">
        <img
          src="/LogomarcaDDnt2025Vazado.png"
          alt="Logo Dudunitê"
          className="lanped-logo"
        />
        <h1 className="lanped-titulo">Lançar Pedido</h1>
      </div>

      {/* FORMULÁRIO */}
      <div className="lanped-formulario">
        <div className="lanped-field">
          <label>Cidade</label>
          <select
            value={cidade}
            onChange={e => { setCidade(e.target.value); setPdv(""); }}
          >
            <option value="">Selecione</option>
            {cidades.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <div className="lanped-field">
          <label>Ponto de Venda</label>
          <select
            value={pdv}
            onChange={e => setPdv(e.target.value)}
            disabled={!cidade}
          >
            <option value="">Selecione</option>
            {cidade && pdvsPorCidade[cidade].map(p => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>

        <div className="lanped-field">
          <label>Produto</label>
          <select
            value={produto}
            onChange={e => setProduto(e.target.value)}
          >
            <option value="">Selecione</option>
            {produtos.map(p => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>

        <div className="lanped-field">
          <label>Quantidade</label>
          <input
            type="number"
            value={quantidade}
            onChange={e => setQuantidade(Number(e.target.value))}
          />
        </div>

        <div className="lanped-field">
          <label>Valor Unitário</label>
          <input
            type="number"
            step="0.01"
            value={valorUnitario}
            onChange={e => setValorUnitario(e.target.value)}
          />
        </div>

        <button className="botao-adicionar" onClick={adicionarItem}>
          ➕ Adicionar Item
        </button>

        {itens.length > 0 && (
          <ul className="lista-itens">
            {itens.map((it, i) => (
              <li key={i}>
                {it.quantidade}× {it.produto} — R$ {Number(it.valorUnitario).toFixed(2)} (Total: R$ {Number(it.total).toFixed(2)})
                <button
                  className="botao-excluir"
                  onClick={() => setItens(itens.filter((_, j) => j !== i))}
                >
                  ✖
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="total-pedido">
          <strong>Total:</strong> R$ {totalPedido.toFixed(2)}
        </div>

        <div className="lanped-field">
          <label>Forma de Pagamento</label>
          <select
            value={formaPagamento}
            onChange={e => setFormaPagamento(e.target.value)}
          >
            <option value="">Selecione</option>
            {formasPagamento.map(f => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>
        </div>

        {formaPagamento === "Boleto" && (
          <>
            <div className="lanped-field">
              <label>Anexar Nota Fiscal</label>
              <input type="file" accept=".pdf,.jpg,.png" />
            </div>
            <div className="lanped-field">
              <label>Anexar Boleto</label>
              <input type="file" accept=".pdf,.jpg,.png" />
            </div>
          </>
        )}

        <div className="lanped-field">
          <label>Data de Vencimento</label>
          <input
            type="date"
            value={dataVencimento}
            onChange={e => setDataVencimento(e.target.value)}
          />
        </div>

        <button className="botao-salvar" onClick={handleSalvar}>
          💾 Salvar Pedido
        </button>
      </div>

      {/* BOTÃO VOLTAR ABAIXO DO FORMULÁRIO */}
      <button
        className="botao-voltar"
        onClick={() => setTela("HomePCP")}
      >
        🔙 Voltar
      </button>

      {/* RODAPÉ */}
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

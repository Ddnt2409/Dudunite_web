// src/pages/LanPed.jsx
import React, { useState, useEffect } from "react";
import "./LanPed.css";

export default function LanPed({ setTela }) {
  // Estados
  const [cidade, setCidade] = useState("");
  const [escola, setEscola] = useState("");
  const [produto, setProduto] = useState("");
  const [sabor, setSabor] = useState("");
  const [quantidade, setQuantidade] = useState(1);
  const [valorUnitario, setValorUnitario] = useState("");
  const [total, setTotal] = useState(0);
  const [formaPagamento, setFormaPagamento] = useState("");
  const [dataVencimento, setDataVencimento] = useState("");

  // Listas fixas (puxe do README se precisar ajustar)
  const cidades = ["Gravatá", "Recife", "Caruaru"];
  const escolasPorCidade = {
    Gravatá: ["Pequeno Príncipe", "Salesianas", "Céu Azul", "Russas", "Bora Gastar", "Kaduh", "Society Show", "Degusty"],
    Recife: ["Tio Valter", "Vera Cruz", "Pinheiros", "Dourado", "BMQ", "CFC", "Madre de Deus", "Saber Viver"],
    Caruaru: ["Interativo", "Exato Sede", "Exato Anexo", "Sesi", "Motivo", "Jesus Salvador"],
  };
  const produtos = ["BRW 7x7", "BRW 6x6", "PKT 5x5", "PKT 6x6", "Esc", "DUDU"];
  const saboresPorProduto = {
    "BRW 7x7": ["Ninho", "Ninho com Nutella", "Oreo", "Ovomaltine", "Beijinho", "Brigadeiro branco", "Brigadeiro branco c confete", "Bem casado", "Paçoca", "KitKat", "Brigadeiro preto", "Brigadeiro preto c confete", "Palha italiana"],
    "BRW 6x6": ["Ninho", "Ninho com Nutella", "Oreo", "Ovomaltine", "Beijinho", "Brigadeiro branco", "Brigadeiro branco c confete", "Bem casado", "Paçoca", "KitKat", "Brigadeiro preto", "Brigadeiro preto c confete", "Palha italiana"],
    "PKT 5x5": ["Ninho", "Ninho com Nutella", "Oreo", "Ovomaltine", "Beijinho", "Brigadeiro branco", "Brigadeiro branco c confete", "Bem casado", "Paçoca", "KitKat", "Brigadeiro preto", "Brigadeiro preto c confete", "Palha italiana"],
    "PKT 6x6": ["Ninho", "Ninho com Nutella", "Oreo", "Ovomaltine", "Beijinho", "Brigadeiro branco", "Brigadeiro branco c confete", "Bem casado", "Paçoca", "KitKat", "Brigadeiro preto", "Brigadeiro preto c confete", "Palha italiana"],
    Esc: ["Ninho", "Ninho com Nutella", "Oreo", "Ovomaltine", "Beijinho", "Brigadeiro branco", "Brigadeiro branco c confete", "Bem casado", "Paçoca", "KitKat", "Brigadeiro preto", "Brigadeiro preto c confete", "Palha italiana"],
    DUDU: ["Dd Oreo", "Dd Ovomaltine", "Dd Ninho com Nutella", "Dd Creme de Maracujá", "Dd KitKat"],
  };
  const formasPagamento = ["PIX", "Espécie", "Boleto"];

  // Recalcula total sempre que qtd ou unit mudam
  useEffect(() => {
    const q = Number(quantidade) || 0;
    const v = Number(valorUnitario) || 0;
    setTotal(q * v);
  }, [quantidade, valorUnitario]);

  // Handler do botão Disparar (placeholder)
  const handleDisparar = () => {
    alert("Pedido disparado!");
  };

  // Handler do botão Salvar (placeholder)
  const handleSalvar = () => {
    alert("Pedido salvo!");
  };

  // Filtra lista de escolas e sabores
  const escolas = cidade ? escolasPorCidade[cidade] : [];
  const sabores = produto ? saboresPorProduto[produto] : [];

  return (
    <div className="lanped-container">
      {/* HEADER */}
      <header className="lanped-header">
        <button className="lanped-voltar" onClick={() => setTela("PCP")}>
          🔙 Voltar
        </button>
        <h1>Lançar Pedido – Dudunitê</h1>
      </header>

      {/* FORM */}
      <form className="lanped-form">
        <label>
          Cidade
          <select value={cidade} onChange={e => setCidade(e.target.value)}>
            <option value="">Selecione</option>
            {cidades.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </label>

        <label>
          Escola
          <select value={escola} onChange={e => setEscola(e.target.value)}>
            <option value="">Selecione</option>
            {escolas.map(e => (
              <option key={e} value={e}>{e}</option>
            ))}
          </select>
        </label>

        <label>
          Produto
          <select value={produto} onChange={e => setProduto(e.target.value)}>
            <option value="">Selecione</option>
            {produtos.map(p => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </label>

        <label>
          Sabor
          <select value={sabor} onChange={e => setSabor(e.target.value)}>
            <option value="">Selecione</option>
            {sabores.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </label>

        <label>
          Quantidade
          <input
            type="number"
            min="1"
            value={quantidade}
            onChange={e => setQuantidade(e.target.value)}
          />
        </label>

        <label>
          Valor Unitário
          <input
            type="number"
            min="0"
            step="0.01"
            value={valorUnitario}
            onChange={e => setValorUnitario(e.target.value)}
          />
        </label>

        <label>
          Total
          <input type="text" readOnly value={total.toFixed(2)} />
        </label>

        <label>
          Forma de Pagamento
          <select
            value={formaPagamento}
            onChange={e => setFormaPagamento(e.target.value)}
          >
            <option value="">Selecione</option>
            {formasPagamento.map(f => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>
        </label>

        {formaPagamento === "Boleto" && (
          <label>
            Vencimento
            <input
              type="date"
              value={dataVencimento}
              onChange={e => setDataVencimento(e.target.value)}
            />
          </label>
        )}

        {/* Ações */}
        <div className="lanped-actions">
          <button type="button" className="lanped-btn" onClick={handleDisparar}>
            Disparar Pedido
          </button>
          <button
            type="button"
            className="lanped-btn primary"
            onClick={handleSalvar}
          >
            Salvar Pedido
          </button>
        </div>
      </form>

      {/* RODAPÉ */}
      <footer className="lanped-footer">
        Dudunitê – Sistema de Pedidos
      </footer>
    </div>
  );
        }

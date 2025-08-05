import React, { useState, useEffect } from "react";
import "./LanPed.css";

const cidades = ["Gravatá", "Recife", "Caruaru"];
const escolasPorCidade = {
  Gravatá: [
    "Pequeno Príncipe",
    "Salesianas",
    "Céu Azul",
    "Russas",
    "Bora Gastar",
    "Kaduh",
    "Society Show",
    "Degusty",
  ],
  Recife: [
    "Tio Valter",
    "Vera Cruz",
    "Pinheiros",
    "Dourado",
    "BMQ",
    "CFC",
    "Madre de Deus",
    "Saber Viver",
  ],
  Caruaru: [
    "Interativo",
    "Exato Sede",
    "Exato Anexo",
    "Sesi",
    "Motivo",
    "Jesus Salvador",
  ],
};
const produtos = ["BRW 7x7", "BRW 6x6", "PKT 5x5", "PKT 6x6", "Esc", "DudU"];
const saboresPorProduto = {
  "BRW 7x7": [
    "Ninho",
    "Ninho com Nutella",
    "Brigadeiro branco",
    "Oreo",
    "Ovomaltine",
    "Paçoca",
    "Beijinho",
  ],
  "BRW 6x6": [
    "Ninho",
    "Ninho com Nutella",
    "Brigadeiro branco",
    "Oreo",
    "Ovomaltine",
    "Paçoca",
    "Beijinho",
  ],
  "PKT 5x5": [
    "Ninho",
    "Ninho com Nutella",
    "Brigadeiro branco",
    "Oreo",
    "Palha italiana",
  ],
  "PKT 6x6": [
    "Ninho",
    "Ninho com Nutella",
    "Brigadeiro branco",
    "Oreo",
    "Palha italiana",
  ],
  Esc: ["Oreo", "Beijinho", "Prestígio"],
  DudU: ["Dd Oreo", "Dd Ovomaltine", "Dd Ninho com Nutella"],
};

export default function LanPed({ setTela }) {
  const [cidade, setCidade] = useState("");
  const [escola, setEscola] = useState("");
  const [produto, setProduto] = useState("");
  const [sabor, setSabor] = useState("");
  const [quantidade, setQuantidade] = useState(1);
  const [valorUnitario, setValorUnitario] = useState("");
  const [itens, setItens] = useState([]);

  const listaEscolas = cidade ? escolasPorCidade[cidade] : [];
  const listaSabores = produto ? saboresPorProduto[produto] || [] : [];

  // quando produto muda, zera sabor e valor unitário
  useEffect(() => {
    setSabor("");
    setValorUnitario("");
  }, [produto]);

  // calcula total do pedido
  const totalPedido = itens.reduce(
    (sum, item) => sum + item.quantidade * item.valorUnitario,
    0
  );

  function adicionarItem() {
    if (!cidade || !escola || !produto || !sabor || !valorUnitario || quantidade < 1) {
      alert("Preencha todos os campos corretamente.");
      return;
    }
    setItens((a) => [
      ...a,
      {
        produto,
        sabor,
        quantidade: Number(quantidade),
        valorUnitario: Number(valorUnitario),
      },
    ]);
    setSabor("");
    setQuantidade(1);
    setValorUnitario("");
  }

  function removerItem(idx) {
    setItens((a) => a.filter((_, i) => i !== idx));
  }

  return (
    <div className="lanped-wrapper">
      <header className="erp-header">
        <img
          src="/LogomarcaDDnt2025Vazado.png"
          alt="Logo Dudunitê"
          className="erp-logo"
        />
        <h1 className="erp-titulo">Lançar Pedido – Dudunitê</h1>
      </header>

      <main className="lanped-main">
        <div className="form-group">
          <label>Cidade</label>
          <select value={cidade} onChange={(e) => setCidade(e.target.value)}>
            <option value="">Selecione</option>
            {cidades.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Escola</label>
          <select value={escola} onChange={(e) => setEscola(e.target.value)}>
            <option value="">Selecione</option>
            {listaEscolas.map((e) => (
              <option key={e} value={e}>
                {e}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Produto</label>
          <select value={produto} onChange={(e) => setProduto(e.target.value)}>
            <option value="">Selecione</option>
            {produtos.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Sabor</label>
          <select value={sabor} onChange={(e) => setSabor(e.target.value)}>
            <option value="">Selecione</option>
            {listaSabores.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        <div className="form-inline">
          <div className="form-group">
            <label>Quantidade</label>
            <div className="quantidade-group">
              <button onClick={() => setQuantidade((q) => Math.max(1, q - 1))}>
                –
              </button>
              <input
                type="number"
                min="1"
                value={quantidade}
                onChange={(e) => setQuantidade(e.target.value)}
              />
              <button onClick={() => setQuantidade((q) => q + 1)}>+</button>
            </div>
          </div>

          <div className="form-group">
            <label>Valor Unitário (R$)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={valorUnitario}
              onChange={(e) => setValorUnitario(e.target.value)}
            />
          </div>
        </div>

        <button className="botao-add" onClick={adicionarItem}>
          ➕ Adicionar Item
        </button>

        {itens.length > 0 && (
          <>
            <ul className="itens-lista">
              {itens.map((it, i) => (
                <li key={i}>
                  {it.quantidade}× {it.produto} – {it.sabor} @ R$
                  {it.valorUnitario.toFixed(2)} = R$
                  {(it.quantidade * it.valorUnitario).toFixed(2)}{" "}
                  <button className="btn-remover" onClick={() => removerItem(i)}>
                    ❌
                  </button>
                </li>
              ))}
            </ul>
            <div className="total-pedido">
              <strong>Total: R${totalPedido.toFixed(2)}</strong>
            </div>
          </>
        )}

        <button className="botao-salvar">💾 Salvar Pedido</button>
      </main>

      <footer className="erp-footer">
        <marquee behavior="scroll" direction="left">
          • Cruz • Pinheiros • Dourado • BMQ • CFC • Madre de Deus • Saber
          Viver • Interativo • Exato Sede • Exato Anexo • Society Show • Russas
          • Kaduh • Degusty • Bora Gastar • Salesianas • Céu Azul • Pequeno
          Príncipe • Tio Valter • Vera Cruz
        </marquee>
        <button className="botao-voltar" onClick={() => setTela("PCP")}>
          ⬅️ Voltar para PCP
        </button>
      </footer>
    </div>
  );
                }

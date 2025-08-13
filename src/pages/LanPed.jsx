// src/pages/LanPed.jsx
import React, { useMemo, useState } from "react";
import {
  addDoc,
  collection,
  doc,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import db from "../firebase";

import ERPHeader from "./ERPHeader";
import ERPFooter from "./ERPFooter";

import { PDVs_VALIDOS } from "../util/PDVsValidos";
import { caminhoCicloAtual } from "../util/Semana";

/* ================================
   TABELA DE PREÇOS (fallback)
   — use os mesmos rótulos do <select>
=================================== */
const PRECOS = {
  "BRW 7x7": 6.0,
  "BRW 6x6": 5.25,
  "PKT 5x5": 4.5,
  "PKT 6x6": 5.0,
  ESC: 4.65, // Escondidinho
  DUDU: 6.0,
};

const PRODUTOS = Object.keys(PRECOS); // opções do select

/* ================================
   HELPERS
=================================== */
function resolvePreco(produto, valorInput) {
  const n = Number(String(valorInput ?? "").replace(",", "."));
  if (Number.isFinite(n) && n > 0) return n; // usa o digitado
  return PRECOS[produto] || 0; // fallback da tabela
}
function formatBRL(n) {
  return Number(n || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  });
}

/* ================================
   COMPONENTE
=================================== */
export default function LanPed({ setTela }) {
  // seleção básica
  const [cidade, setCidade] = useState("");
  const [pdv, setPdv] = useState("");

  // item em edição
  const [produto, setProduto] = useState("");
  const [quantidade, setQuantidade] = useState(1);
  const [valorUnitarioInput, setValorUnitarioInput] = useState("");

  // itens do pedido
  const [itens, setItens] = useState([]);

  // extras do pedido
  const [formaPagamento, setFormaPagamento] = useState("");
  const [vencimento, setVencimento] = useState("");

  // opções dinâmicas de PDV por cidade
  const pdvsDaCidade = useMemo(() => {
    const entry = PDVs_VALIDOS.find((c) => c.cidade === cidade);
    return entry ? entry.pdvs : [];
  }, [cidade]);

  // total do pedido
  const total = useMemo(
    () =>
      itens.reduce(
        (s, i) =>
          s + Number(i.quantidade || 0) * Number(i.valorUnitario || 0),
        0
      ),
    [itens]
  );

  /* ================================
     AÇÕES
  =================================== */
  function onChangeProduto(e) {
    const p = e.target.value;
    setProduto(p);
    // sugere preço ao trocar produto (se houver na tabela)
    const sugerido = PRECOS[p];
    setValorUnitarioInput(sugerido ? String(sugerido) : "");
  }

  function addItem() {
    if (!produto) {
      alert("Selecione um produto.");
      return;
    }
    const qtd = Number(quantidade || 0);
    if (!Number.isFinite(qtd) || qtd <= 0) {
      alert("Informe uma quantidade válida.");
      return;
    }
    const preco = resolvePreco(produto, valorUnitarioInput);
    if (preco <= 0) {
      alert(
        "Preço zerado. Digite o valor unitário ou ajuste a tabela de preços."
      );
      return;
    }

    setItens((prev) => [
      ...prev,
      {
        produto,
        quantidade: qtd,
        valorUnitario: preco,
      },
    ]);

    // reset parcial
    setQuantidade(1);
    setValorUnitarioInput("");
  }

  function removeItem(index) {
    setItens((prev) => prev.filter((_, i) => i !== index));
  }

  async function salvarPedido() {
    if (!cidade) {
      alert("Selecione a cidade.");
      return;
    }
    if (!pdv) {
      alert("Selecione o ponto de venda.");
      return;
    }
    if (!itens.length) {
      alert("Adicione pelo menos um item ao pedido.");
      return;
    }
    if (total <= 0) {
      alert("Total zerado. Verifique os preços dos itens.");
      return;
    }

    const payload = {
      cidade,
      pdv, // StaPed entende 'pdv' ou 'escola'
      itens: itens.map((i) => ({
        produto: i.produto,
        quantidade: Number(i.quantidade || 0),
        valorUnitario: Number(i.valorUnitario || 0),
      })),
      formaPagamento: formaPagamento || null,
      vencimento: vencimento || null,
      statusEtapa: "Lançado",
      criadoEm: serverTimestamp(),
      atualizadoEm: serverTimestamp(),
    };

    try {
      // 1) grava na coleção base
      const ref = await addDoc(collection(db, "PEDIDOS"), payload);

      // 2) espelha no ciclo atual (lido pelo StaPed)
      await setDoc(doc(db, caminhoCicloAtual(), ref.id), payload);

      alert("Pedido salvo com sucesso!");

      // limpa o formulário
      setProduto("");
      setQuantidade(1);
      setValorUnitarioInput("");
      setItens([]);
      setFormaPagamento("");
      setVencimento("");
    } catch (err) {
      console.error(err);
      alert("Falha ao salvar no Firestore: " + (err?.message || "erro"));
    }
  }

  /* ================================
     RENDER
  =================================== */
  return (
    <>
      <ERPHeader title="Lançar Pedido" />

      <main className="lanped-main" style={{ paddingBottom: 88 }}>
        {/* Cidade */}
        <div className="field">
          <label>Cidade</label>
          <select value={cidade} onChange={(e) => setCidade(e.target.value)}>
            <option value="" disabled>
              Selecione
            </option>
            {PDVs_VALIDOS.map((c) => (
              <option key={c.cidade} value={c.cidade}>
                {c.cidade}
              </option>
            ))}
          </select>
        </div>

        {/* PDV */}
        <div className="field">
          <label>Ponto de Venda</label>
          <select
            value={pdv}
            onChange={(e) => setPdv(e.target.value)}
            disabled={!cidade}
          >
            <option value="" disabled>
              Selecione
            </option>
            {pdvsDaCidade.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>

        {/* Produto */}
        <div className="field">
          <label>Produto</label>
          <select value={produto} onChange={onChangeProduto}>
            <option value="" disabled>
              Selecione
            </option>
            {PRODUTOS.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>

        {/* Quantidade */}
        <div className="field">
          <label>Quantidade</label>
          <input
            type="number"
            min="1"
            value={quantidade}
            onChange={(e) => setQuantidade(e.target.value)}
          />
        </div>

        {/* Valor Unitário */}
        <div className="field">
          <label>Valor Unitário</label>
          <input
            type="number"
            min="0"
            step="0.01"
            placeholder={
              produto && PRECOS[produto] ? String(PRECOS[produto]) : ""
            }
            value={valorUnitarioInput}
            onChange={(e) => setValorUnitarioInput(e.target.value)}
          />
        </div>

        {/* Botão adicionar */}
        <div style={{ margin: "12px 0" }}>
          <button className="btn primary" onClick={addItem}>
            ➕ Adicionar Item
          </button>
        </div>

        {/* Lista de itens */}
        {!!itens.length && (
          <ul className="itens-list">
            {itens.map((i, idx) => (
              <li key={idx} className="item-row">
                <span>
                  {i.quantidade}× {i.produto} — {formatBRL(i.valorUnitario)}{" "}
                  <em style={{ opacity: 0.7 }}>
                    (Total: {formatBRL(i.quantidade * i.valorUnitario)})
                  </em>
                </span>
                <button className="btn ghost" onClick={() => removeItem(idx)}>
                  ✖
                </button>
              </li>
            ))}
          </ul>
        )}

        {/* Total */}
        <div
          style={{
            margin: "12px 0 18px",
            fontSize: 20,
            fontWeight: 800,
            textAlign: "right",
          }}
        >
          Total: {formatBRL(total)}
        </div>

        {/* Forma de pagamento */}
        <div className="field">
          <label>Forma de Pagamento</label>
          <select
            value={formaPagamento}
            onChange={(e) => setFormaPagamento(e.target.value)}
          >
            <option value="" disabled>
              Selecione
            </option>
            <option value="Espécie">Espécie</option>
            <option value="Pix">Pix</option>
            <option value="Cartão">Cartão</option>
            <option value="Boleto">Boleto</option>
          </select>
        </div>

        {/* Vencimento */}
        <div className="field">
          <label>Data de Vencimento</label>
          <input
            type="date"
            value={vencimento}
            onChange={(e) => setVencimento(e.target.value)}
          />
        </div>

        {/* Salvar */}
        <div style={{ margin: "14px 0 22px" }}>
          <button className="btn primary big" onClick={salvarPedido}>
            💾 Salvar Pedido
          </button>
        </div>

        {/* Voltar */}
        <div style={{ textAlign: "center" }}>
          <button className="btn" onClick={() => setTela("HomePCP")}>
            ⬅ Voltar
          </button>
        </div>
      </main>

      <ERPFooter onBack={() => setTela("HomeERP")} />
    </>
  );
}

/* =========================================
   Estilos mínimos (opcional, mantêm o visual)
   — se já houver CSS da tela, pode remover
============================================ */
const style = document.createElement("style");
style.innerHTML = `
.lanped-main { padding: 10px 12px 92px; }
.field { margin: 10px 0; display:flex; flex-direction:column; gap:6px; }
.field label { font-weight: 700; color: #7b3c21; }
.field select, .field input {
  height: 54px; border-radius: 12px; border:1px solid #e6d2c2; padding: 8px 12px;
  background: rgba(255,255,255,.88); font-size: 16px;
}
.btn { background:#8c3b1b; color:#fff; border:none; border-radius:12px; padding:12px 16px; font-weight:800; }
.btn.ghost { background:transparent; color:#8c3b1b; border:1px solid #8c3b1b; }
.btn.primary { background:#8c3b1b; }
.btn.big { width:100%; height:54px; font-size:16px; }
.itens-list { list-style:none; padding:0; margin: 8px 0 0; display:flex; flex-direction:column; gap:8px; }
.item-row { display:flex; justify-content:space-between; align-items:center; background: rgba(255,255,255,.9); border:1px dashed #e6d2c2; padding:10px 12px; border-radius:10px; }
`;
document.head.appendChild(style);

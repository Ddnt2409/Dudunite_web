// src/pages/LanPed.jsx


import React, { useState, useEffect, useRef } from "react";


import React, { useState, useEffect } from "react";

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

  const [totalPedido, setTotalPedido] = useState("0.00");

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




  // ─── CALCULA TOTAL AO MUDAR QTD OU VALOR ───


  // ─── CALCULA TOTAL ───────────────────

  useEffect(() => {

    const t = parseFloat(quantidade) * parseFloat(valorUnitario || 0);

    setTotalPedido(t.toFixed(2));

  }, [quantidade, valorUnitario]);




  // ─── ADICIONA ITEM ──────────────────────


  // ─── ADICIONA ITEM ──────────────────

  function adicionarItem() {

    if (!produto || quantidade <= 0 || !valorUnitario) {

      alert("Preencha todos os campos de item.");

      return;

    }

    setItens(old => [

      ...old,

      {

        produto,

        quantidade,

        valorUnitario,

        total: (quantidade * parseFloat(valorUnitario)).toFixed(2),

      },

    ]);

    setProduto("");

    setQuantidade(1);

    setValorUnitario("");

  }




  // ─── SALVA PEDIDO ───────────────────────


  // ─── SALVA PEDIDO ───────────────────

  async function handleSalvar() {

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

      alert("✅ Pedido salvo!");

      setCidade("");

      setPdv("");

      setItens([]);

      setFormaPagamento("");

      setDataVencimento("");

      setTotalPedido("0.00");

    } catch {

      alert("❌ Falha ao salvar.");

    }

  }




  // ─── MONITORA STATUS DOS PDVs ──────────


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


        <button className="botao-voltar" onClick={() => setTela("HomePCP")}>


          🔙


        </button>

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

                {it.quantidade}× {it.produto} — R$ {it.valorUnitario} (Total: R$ {it.total})

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

          <strong>Total:</strong> R$ {totalPedido}

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

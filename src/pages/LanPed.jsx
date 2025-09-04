// src/pages/LanPed.jsx
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
import { upsertPrevistoFromLanPed } from "../util/financeiro_store";

// PDF
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

// helpers
const money = (n) =>
  `R$ ${Number(n || 0).toFixed(2).replace(".", ",")}`;
const hojeISO = () => new Date().toISOString().slice(0, 10);
const brDate = (d) =>
  (d ? new Date(d) : new Date()).toLocaleDateString("pt-BR");

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
    Gravatá: [
      "Pequeno Príncipe",
      "Salesianas",
      "Céu Azul",
      "Russas",
      "Bora Gastar",
      "Kaduh",
      "Empório da Serra",
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
    Caruaru: ["Interativo", "Exato Sede", "Exato Anexo", "Sesi", "Motivo", "Jesus Salvador"],
  };
  const produtos = ["BRW 7x7", "BRW 6x6", "PKT 5x5", "PKT 6x6", "Esc", "DUDU"];
  const formasPagamento = ["PIX", "Espécie", "Cartão", "Boleto"];

  // ─── TOTAL = SOMA DOS ITENS ADICIONADOS ───────────────────
  useEffect(() => {
    const soma = itens.reduce((acc, it) => acc + Number(it.total || 0), 0);
    setTotalPedido(soma.toFixed(2));
  }, [itens]);

  // ─── ADICIONA ITEM ──────────────────
  function adicionarItem() {
    if (!produto || quantidade <= 0 || !valorUnitario) {
      alert("Preencha todos os campos de item.");
      return;
    }
    const totalItem = Number(quantidade) * Number(valorUnitario);
    setItens((old) => [
      ...old,
      {
        produto,
        quantidade: Number(quantidade),
        valorUnitario: Number(valorUnitario).toFixed(2),
        total: totalItem.toFixed(2),
      },
    ]);
    setProduto("");
    setQuantidade(1);
    setValorUnitario("");
  }

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
      total: Number(totalPedido),
      statusEtapa: "Lançado",
      criadoEm: serverTimestamp(),
    };
    try {
      const ref = await addDoc(collection(db, "PEDIDOS"), novo);

      // → Envia imediatamente ao financeiro como PREVISTO
      await upsertPrevistoFromLanPed(ref.id, {
        cidade,
        pdv,
        escola: pdv,
        itens,
        formaPagamento,
        dataVencimento,
        valorTotal: Number(novo.total) || undefined,
        criadoEm: new Date(),
      });

      alert("✅ Pedido salvo!");
      // reset mínimo
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

  // ─── MONITORA STATUS DOS PDVs ───────
  useEffect(() => {
    const ref = collection(db, "PEDIDOS");
    const q = query(ref, orderBy("criadoEm", "asc"));
    return onSnapshot(q, (snap) => {
      const m = {};
      snap.docs.forEach((doc) => {
        const d = doc.data();
        if (d.escola) m[d.escola] = d.statusEtapa;
      });
      setStatusPorPdv(m);
    });
  }, []);

  // ─── PDF + WHATSAPP ─────────────────
  async function gerarPdfECompartilhar() {
    if (!cidade || !pdv || itens.length === 0 || !formaPagamento) {
      alert("Preencha cidade, PDV, ao menos 1 item e a forma de pagamento.");
      return;
    }

    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const margem = 40;

    // Cabeçalho simples
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("Pedido", margem, 50);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.text(`Data: ${brDate(hojeISO())}`, margem, 70);
    doc.text(`Ponto de venda: ${pdv}`, margem, 88);
    doc.text(`Cidade: ${cidade}`, margem, 106);

    // Tabela de itens
    const body = itens.map((it) => [
      String(it.quantidade),
      it.produto,
      money(it.valorUnitario),
      money(it.total),
    ]);

    autoTable(doc, {
      startY: 130,
      head: [["Qtde", "Descrição", "Unitário", "Total"]],
      body,
      styles: { fontSize: 11 },
      headStyles: { fillColor: [240, 240, 240] },
      theme: "grid",
      margin: { left: margem, right: margem },
      columnStyles: {
        0: { cellWidth: 60, halign: "right" },
        2: { cellWidth: 120, halign: "right" },
        3: { cellWidth: 120, halign: "right" },
      },
    });

    let y = doc.lastAutoTable.finalY || 130;

    // Rodapé
    y += 18;
    doc.setFont("helvetica", "bold");
    doc.text(`Valor total: ${money(totalPedido)}`, margem, y);
    y += 18;
    doc.setFont("helvetica", "normal");
    doc.text(
      `Forma de pagamento: ${formaPagamento}${dataVencimento ? `  •  Vencimento: ${brDate(dataVencimento)}` : ""}`,
      margem,
      y
    );

    // Gera blob
    const pdfBlob = doc.output("blob");
    const file = new File([pdfBlob], `Pedido_${pdv}_${hojeISO()}.pdf`, {
      type: "application/pdf",
    });

    // Tenta compartilhar com arquivo (Android/Chrome, iOS Safari moderno, etc.)
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          title: "Pedido Dudunitê",
          text: "Segue o pedido em anexo.",
          files: [file],
        });
        return;
      } catch (err) {
        // usuário pode ter cancelado — cair no fallback não é problema
      }
    }

    // Fallback: gerar URL e abrir WhatsApp com texto + link
    const url = URL.createObjectURL(pdfBlob);
    const mensagem =
      `Segue o pedido:\nPDV: ${pdv}\nCidade: ${cidade}\n` +
      `Total: ${money(totalPedido)}\n` +
      (dataVencimento ? `Vencimento: ${brDate(dataVencimento)}\n` : "") +
      `PDF: ${url}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(mensagem)}`, "_blank");
    // liberar a URL um pouco depois
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  }

  return (
    <div className="lanped-container">
      <div className="lanped-header">
        <img
          src="/LogomarcaDDnt2025Vazado.png"
          alt="Logo Dudunitê"
          className="lanped-logo"
        />
        <h1 className="lanped-titulo">Lançar Pedido</h1>
      </div>

      <div className="lanped-formulario">
        <div className="lanped-field">
          <label>Cidade</label>
          <select
            value={cidade}
            onChange={(e) => {
              setCidade(e.target.value);
              setPdv(""); // limpa PDV ao trocar de cidade
            }}
          >
            <option value="">Selecione</option>
            {cidades.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div className="lanped-field">
          <label>Ponto de Venda</label>
          <select
            value={pdv}
            onChange={(e) => setPdv(e.target.value)}
            disabled={!cidade}
          >
            <option value="">Selecione</option>
            {cidade &&
              pdvsPorCidade[cidade].map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
          </select>
        </div>

        <div className="lanped-field">
          <label>Produto</label>
          <select
            value={produto}
            onChange={(e) => setProduto(e.target.value)}
          >
            <option value="">Selecione</option>
            {produtos.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>

        <div className="lanped-field">
          <label>Quantidade</label>
          <input
            type="number"
            value={quantidade}
            onChange={(e) => setQuantidade(Number(e.target.value))}
          />
        </div>

        <div className="lanped-field">
          <label>Valor Unitário</label>
          <input
            type="number"
            step="0.01"
            value={valorUnitario}
            onChange={(e) => setValorUnitario(e.target.value)}
          />
        </div>

        <button className="botao-adicionar" onClick={adicionarItem}>
          ➕ Adicionar Item
        </button>

        {itens.length > 0 && (
          <ul className="lista-itens">
            {itens.map((it, i) => (
              <li key={i}>
                {it.quantidade}× {it.produto} — {money(it.valorUnitario)}{" "}
                (Total: {money(it.total)})
                <button
                  className="botao-excluir"
                  onClick={() =>
                    setItens(itens.filter((_, j) => j !== i))
                  }
                >
                  ✖
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="total-pedido">
          <strong>Total:</strong> {money(totalPedido)}
        </div>

        <div className="lanped-field">
          <label>Forma de Pagamento</label>
          <select
            value={formaPagamento}
            onChange={(e) => setFormaPagamento(e.target.value)}
          >
            <option value="">Selecione</option>
            {formasPagamento.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
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
            onChange={(e) => setDataVencimento(e.target.value)}
          />
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button className="botao-salvar" onClick={handleSalvar}>
            💾 Salvar Pedido
          </button>

          <button className="botao-salvar" onClick={gerarPdfECompartilhar}>
            🧾 Gerar PDF e enviar no WhatsApp
          </button>

          <button className="botao-voltar" onClick={() => setTela("HomePCP")}>
            🔙 Voltar
          </button>
        </div>
      </div>

      <footer className="lanped-footer">
        <div className="lista-escolas-marquee">
          <span className="marquee-content">
            • Pequeno Príncipe • Salesianas • Céu Azul • Russas • Bora Gastar •
            Kaduh • Society Show • Degusty • Tio Valter • Vera Cruz
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

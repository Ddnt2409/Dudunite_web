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
const money = (n) => `R$ ${Number(n || 0).toFixed(2).replace(".", ",")}`;
const hojeISO = () => new Date().toISOString().slice(0, 10);
const brDate = (d) => (d ? new Date(d) : new Date()).toLocaleDateString("pt-BR");

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

  // ─── PDF (A5 – COMANDA) + WHATSAPP ─────────────────
  async function gerarPdfECompartilhar() {
    if (!cidade || !pdv || itens.length === 0 || !formaPagamento) {
      alert("Preencha cidade, PDV, ao menos 1 item e a forma de pagamento.");
      return;
    }

    const doc = new jsPDF({ unit: "pt", format: "a5", compress: true }); // A5 retrato
    const W = doc.internal.pageSize.getWidth();
    const M = 26;
    let y = M;

    doc.setLineWidth(0.8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(0);

    // Cabeçalho "Pedido Nº" (barra azul) + vendedor/data
    doc.setFillColor(33, 150, 243);
    doc.roundedRect(M, y, 120, 24, 4, 4, "F");
    doc.setFontSize(12);
    doc.setTextColor(255);
    doc.text("Pedido Nº", M + 10, y + 16);
    doc.setTextColor(0);
    doc.rect(M + 120, y, 90, 24);
    doc.text(String(Date.now()).slice(-5), M + 125, y + 16); // número simples

    doc.setFontSize(11);
    doc.text(`Vendedor: Dudunitê`, W - M - 200, y + 12);
    doc.text(`Data: ${brDate(hojeISO())}`, W - M - 200, y + 24);
    y += 36;

    // Linhas estilo comanda
    const drawLine = (label, value) => {
      doc.setFontSize(11);
      doc.text(label, M, y + 12);
      doc.line(M + 52, y + 14, W - M, y + 14);
      if (value) doc.text(String(value), M + 56, y + 12);
      y += 20;
    };

    drawLine("Cliente:", pdv);
    drawLine("Endereço:", "");
    // CEP | Cidade | Estado | Tel
    let x = M;
    const triple = [
      { label: "CEP:", value: "", w: 120 },
      { label: "Cidade:", value: cidade, w: 180 },
      { label: "Estado:", value: "PE", w: 80 },
      { label: "Tel:", value: "", w: 100 },
    ];
    doc.setFontSize(11);
    triple.forEach((col) => {
      doc.text(col.label, x, y + 12);
      doc.line(x + 40, y + 14, x + (col.w || 140), y + 14);
      if (col.value) doc.text(String(col.value), x + 44, y + 12);
      x += (col.w || 140) + 12;
    });
    y += 20;
    // CNPJ | IE
    x = M;
    const duo = [
      { label: "C.N.P.J.:", value: "", w: 220 },
      { label: "Inscr. Est.:", value: "", w: 160 },
    ];
    duo.forEach((col) => {
      doc.text(col.label, x, y + 12);
      doc.line(x + 58, y + 14, x + (col.w || 180), y + 14);
      if (col.value) doc.text(String(col.value), x + 62, y + 12);
      x += (col.w || 180) + 12;
    });
    y += 20;
    drawLine("E-mail:", "");

    y += 6;

    // Tabela de itens (com linhas em branco para “cara de comanda”)
    const head = [["Qtde.", "Descrição", "Unid.", "Total"]];
    const body = itens.map((it) => [
      String(it.quantidade),
      it.produto,
      "UN",
      money(it.total),
    ]);
    while (body.length < 12) body.push(["", "", "", ""]); // completa até 12 linhas

    autoTable(doc, {
      startY: y,
      head,
      body,
      margin: { left: M, right: M },
      styles: { fontSize: 11, lineWidth: 0.6 },
      headStyles: { fillColor: [230, 240, 255], textColor: 0, halign: "left" },
      columnStyles: {
        0: { cellWidth: 54 },
        1: { cellWidth: W - 2 * M - 54 - 60 - 80 },
        2: { cellWidth: 60, halign: "center" },
        3: { cellWidth: 80, halign: "right" },
      },
      theme: "grid",
    });
    y = doc.lastAutoTable.finalY + 10;

    // Rodapé: Comprador | Visto | Valor total
    const boxH = 46;
    const colW = (W - 2 * M) / 3;

    doc.text("Comprador", M + 4, y + 12);
    doc.rect(M, y, colW, boxH);

    doc.text("Visto", M + colW + 4, y + 12);
    doc.rect(M + colW, y, colW, boxH);

    doc.text("Valor total do pedido", M + 2 * colW + 4, y + 12);
    doc.setFont("helvetica", "bold");
    doc.text(money(totalPedido), M + 2 * colW + 4, y + 30);
    doc.setFont("helvetica", "normal");
    doc.rect(M + 2 * colW, y, colW, boxH);
    y += boxH + 10;

    // Forma + Vencimento
    const linhaFinal =
      `Forma de pagamento: ${formaPagamento}` +
      (dataVencimento ? `  •  Vencimento: ${brDate(dataVencimento)}` : "");
    doc.text(linhaFinal, M, y + 12);

    // Blob e compartilhamento
    const pdfBlob = doc.output("blob");
    const file = new File([pdfBlob], `Pedido_${pdv}_${hojeISO()}.pdf`, {
      type: "application/pdf",
    });

    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          title: "Pedido Dudunitê",
          text: "Segue a comanda do pedido.",
          files: [file],
        });
        return;
      } catch {
        // usuário cancelou: segue o fallback
      }
    }

    // Fallback: baixa e abre WhatsApp com mensagem
    doc.save(`Pedido_${pdv}_${hojeISO()}.pdf`);
    const msg =
      `PDV: ${pdv} • ${cidade}\n` +
      `Total: ${money(totalPedido)}\n` +
      (dataVencimento ? `Vencimento: ${brDate(dataVencimento)}\n` : "") +
      `PDF baixado no aparelho.`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank");
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
          <select value={produto} onChange={(e) => setProduto(e.target.value)}>
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
                  onClick={() => setItens(itens.filter((_, j) => j !== i))}
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
            🧾 Gerar PDF (A5) e enviar no WhatsApp
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

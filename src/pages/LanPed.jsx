// src/pages/LanPed.jsx
import React, { useState, useEffect } from "react";
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  doc,
  runTransaction,
} from "firebase/firestore";
import db from "../firebase";
import "./LanPed.css";
import { upsertPrevistoFromLanPed } from "../util/financeiro_store";

import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

// ==== helpers ====
const money = (n) => `R$ ${Number(n || 0).toFixed(2).replace(".", ",")}`;
const hojeISO = () => new Date().toISOString().slice(0, 10);
const brDate = (d) => (d ? new Date(d) : new Date()).toLocaleDateString("pt-BR");
const TERRA = { r: 166, g: 84, b: 53 }; // terracota
const EXTRA_ROWS = 8; // linhas em branco extras

// 001/AAAA — reinicia a cada ano (transação atômica)
async function getNextPedidoNumero() {
  const year = String(new Date().getFullYear());
  const ref = doc(db, "SEQUENCES", `pedido_${year}`);
  const seq = await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    let next = 1;
    if (!snap.exists()) {
      tx.set(ref, { year, next: 2 });
      next = 1;
    } else {
      const data = snap.data() || {};
      next = Number(data.next || 1);
      tx.set(ref, { year, next: next + 1 }, { merge: true });
    }
    return next;
  });
  return `${String(seq).padStart(3, "0")}/${year}`;
}

async function loadImageSafe(src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function drawFitText(doc, text, x, y, maxW, baseSize = 12, minSize = 9) {
  const prev = doc.getFontSize();
  doc.setFontSize(baseSize);
  const w = doc.getTextWidth(text);
  if (w > maxW) doc.setFontSize(Math.max(minSize, Math.floor((baseSize * maxW) / w)));
  doc.text(text, x, y);
  doc.setFontSize(prev);
}

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

    const numeroPedido = await getNextPedidoNumero();

    const doc = new jsPDF({ unit: "pt", format: "a5", orientation: "portrait" });
    const M = 32;
    doc.setFont("helvetica", "normal");
    doc.setTextColor(0, 0, 0);
    doc.setDrawColor(TERRA.r, TERRA.g, TERRA.b);

    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();

    // Logo topo direito (proporcional)
    let logoLeft = pageW - M;
    let logoW = 0, logoH = 0;
    const logo = await loadImageSafe("/LogomarcaDDnt2025Vazado.png");
    if (logo) {
      const maxW = 120;
      const ratio = Math.min(maxW / logo.width, 1);
      logoW = logo.width * ratio;
      logoH = logo.height * ratio;
      logoLeft = pageW - M - logoW;
      doc.addImage(logo, "PNG", logoLeft, M - 6, logoW, logoH);
    }

    // Cabeçalho em uma linha (não invade logo)
    const headerText = `Vendedor: Dudunitê • Data: ${brDate(hojeISO())}`;
    const headerMaxW = logoW > 0 ? logoLeft - M - 8 : pageW - 2 * M;
    drawFitText(doc, headerText, M, M + 8, headerMaxW, 12, 9);

    // "Pedido Nº" + número
    const pillH = 28;
    doc.setFillColor(247, 236, 230);
    doc.roundedRect(M, M + 22, 110, pillH, 10, 10, "FD");
    doc.setFont("helvetica", "bold");
    doc.text("Pedido Nº", M + 10, M + 22 + 19);
    doc.roundedRect(M + 120, M + 22, 120, pillH, 10, 10, "S");
    doc.text(numeroPedido, M + 130, M + 22 + 19);

    // Bloco cliente
    const yBase = M + 22 + pillH + 18;
    const linha = (y) => doc.line(M, y, pageW - M, y);

    doc.setFont("helvetica", "normal");
    doc.text("Cliente:", M, yBase);
    doc.text(pdv, M + 56, yBase);
    linha(yBase + 8);

    doc.text("Endereço:", M, yBase + 24);
    linha(yBase + 32);

    doc.text("CEP:", M, yBase + 48);
    doc.text("Cidade:", M + 120, yBase + 48);
    doc.text(cidade, M + 180, yBase + 48);
    doc.text("Estado:", M + 300, yBase + 48);
    linha(yBase + 56);

    doc.text("C.N.P.J.:", M, yBase + 72);
    doc.text("Inscr. Est.:", M + 240, yBase + 72);
    linha(yBase + 80);

    doc.text("E-mail:", M, yBase + 96);
    linha(yBase + 104);

    // ===== TABELA DE ITENS (colunas ajustadas ao espaço útil) =====
    const head = [["Qtde.", "Descrição", "Unid.", "Total"]];
    const body = [
      ...itens.map((it) => [String(it.quantidade), it.produto, "UN", money(it.total)]),
    ];
    for (let i = 0; i < EXTRA_ROWS; i++) body.push(["", "", "", ""]);

    const avail = pageW - 2 * M;                    // largura útil
    const cw = [0.14, 0.50, 0.12, 0.24].map(p => p * avail); // soma 1.0 → cabe certinho

    autoTable(doc, {
      startY: yBase + 120,
      head,
      body,
      styles: {
        fontSize: 11,
        lineColor: [TERRA.r, TERRA.g, TERRA.b],
        cellPadding: 6,
        overflow: "linebreak",
      },
      headStyles: {
        fillColor: [247, 236, 230],
        textColor: [60, 40, 30],
        lineColor: [TERRA.r, TERRA.g, TERRA.b],
      },
      theme: "grid",
      margin: { left: M, right: M },
      columnStyles: {
        0: { cellWidth: cw[0], halign: "center" },
        1: { cellWidth: cw[1] },                     // <<< Descrição menor
        2: { cellWidth: cw[2], halign: "center" },
        3: { cellWidth: cw[3], halign: "right" },    // <<< Total cabe na página
      },
    });

    let y = doc.lastAutoTable.finalY + 10;

    // Quadro resumo
    const wTotal = pageW - 2 * M;
    const colW = [wTotal * 0.35, wTotal * 0.30, wTotal * 0.35];
    autoTable(doc, {
      startY: y,
      head: [["Forma de pagamento", "Vencimento", "Valor total do pedido"]],
      body: [[formaPagamento, dataVencimento ? brDate(dataVencimento) : "-", money(totalPedido)]],
      theme: "grid",
      styles: { fontSize: 11, lineColor: [TERRA.r, TERRA.g, TERRA.b] },
      headStyles: {
        fontSize: 10,
        fillColor: [247, 236, 230],
        textColor: [60, 40, 30],
        lineColor: [TERRA.r, TERRA.g, TERRA.b],
      },
      margin: { left: M, right: M },
      columnStyles: {
        0: { cellWidth: colW[0] },
        1: { cellWidth: colW[1], halign: "left" },
        2: { cellWidth: colW[2], halign: "right" },
      },
    });

    // Marca d’água
    if (logo) {
      const maxW = pageW * 0.45;
      const ratio = Math.min(maxW / logo.width, 1);
      const w = logo.width * ratio;
      const h = logo.height * ratio;
      const x = (pageW - w) / 2;
      const yWM = (pageH - h) / 2 + 10;
      const hasG = typeof doc.GState === "function";
      if (hasG) doc.setGState(new doc.GState({ opacity: 0.08 }));
      doc.addImage(logo, "PNG", x, yWM, w, h);
      if (hasG) doc.setGState(new doc.GState({ opacity: 1 }));
    }

    // Rodapé (fonte igual à do “PIX”: 11pt normal)
    y = doc.lastAutoTable.finalY + 24;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("Dudunitê", M, y);
    doc.setFont("helvetica", "normal");

    const ig = await loadImageSafe("/ig.png");
    const wa = await loadImageSafe("/wa.png");
    const iconSize = 12;
    let y2 = y + 16;

    if (ig) {
      doc.addImage(ig, "PNG", M, y2 - iconSize + 2, iconSize, iconSize);
      doc.text("@dudunite", M + iconSize + 6, y2);
    } else {
      doc.text("Instagram: @dudunite", M, y2);
    }

    y2 += 16;
    if (wa) {
      doc.addImage(wa, "PNG", M, y2 - iconSize + 2, iconSize, iconSize);
      doc.text("81998889360", M + iconSize + 6, y2);
    } else {
      doc.text("WhatsApp: 81998889360", M, y2);
    }

    y2 += 16;
    doc.text("Janela de pedidos: toda quinta/sexta feira", M, y2);
    y2 += 14;
    doc.text("Entrega: toda segunda feira", M, y2);

    // Share / WhatsApp
    const pdfBlob = doc.output("blob");
    const file = new File([pdfBlob], `${numeroPedido}_${pdv}_${hojeISO()}.pdf`, {
      type: "application/pdf",
    });

    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          title: `Pedido ${numeroPedido} - ${pdv}`,
          text: "Segue o pedido em anexo.",
          files: [file],
        });
        return;
      } catch {}
    }

    const url = URL.createObjectURL(pdfBlob);
    const msg =
      `Pedido ${numeroPedido}\nPDV: ${pdv}\nCidade: ${cidade}\n` +
      `Total: ${money(totalPedido)}\nPDF: ${url}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank");
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  }

  return (
    <div className="lanped-container">
      <div className="lanped-header">
        <img src="/LogomarcaDDnt2025Vazado.png" alt="Logo Dudunitê" className="lanped-logo" />
        <h1 className="lanped-titulo">Lançar Pedido</h1>
      </div>

      <div className="lanped-formulario">
        <div className="lanped-field">
          <label>Cidade</label>
          <select
            value={cidade}
            onChange={(e) => {
              setCidade(e.target.value);
              setPdv("");
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
          <select value={pdv} onChange={(e) => setPdv(e.target.value)} disabled={!cidade}>
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
                {it.quantidade}× {it.produto} — {money(it.valorUnitario)} (Total: {money(it.total)})
                <button className="botao-excluir" onClick={() => setItens(itens.filter((_, j) => j !== i))}>✖</button>
              </li>
            ))}
          </ul>
        )}

        <div className="total-pedido"><strong>Total:</strong> {money(totalPedido)}</div>

        <div className="lanped-field">
          <label>Forma de Pagamento</label>
          <select value={formaPagamento} onChange={(e) => setFormaPagamento(e.target.value)}>
            <option value="">Selecione</option>
            {formasPagamento.map((f) => (
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
          <input type="date" value={dataVencimento} onChange={(e) => setDataVencimento(e.target.value)} />
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button className="botao-salvar" onClick={handleSalvar}>💾 Salvar Pedido</button>
          <button className="botao-salvar" onClick={gerarPdfECompartilhar}>🧾 Gerar PDF e enviar no WhatsApp</button>
          <button className="botao-voltar" onClick={() => setTela("HomePCP")}>🔙 Voltar</button>
        </div>
      </div>

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

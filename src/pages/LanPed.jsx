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
  setDoc,
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

// Terracota
const TERRA = { r: 166, g: 84, b: 53 };

// Sequência 001/AAAA — reinicia a cada ano (transação)
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

function loadImageSafe(src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
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

  // sequência reservada para ESTE pedido (evita “pulos”)
  const [pedidoId, setPedidoId] = useState(null);
  const [numeroPedido, setNumeroPedido] = useState(null);

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
      "Anita Garibaldi",
    ],
    Caruaru: ["Interativo", "Exato Sede", "Exato Anexo", "Sesi", "Motivo", "Jesus Salvador"],
  };
  const produtos = ["BRW 7x7", "BRW 6x6", "PKT 5x5", "PKT 6x6", "Esc", "DUDU"];
  const formasPagamento = ["PIX", "Espécie", "Cartão", "Boleto"];

  // ─── TOTAL = SOMA DOS ITENS ───────────────────
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

  // ─── RESERVA / RECUPERA NÚMERO ─────
  async function ensureNumeroPedido({ persist = false } = {}) {
    if (numeroPedido) return numeroPedido;
    const num = await getNextPedidoNumero();
    setNumeroPedido(num);
    if (persist && pedidoId) {
      await setDoc(doc(db, "PEDIDOS", pedidoId), { numeroPedido: num }, { merge: true });
    }
    return num;
  }

  // ─── SALVA PEDIDO ───────────────────
  async function handleSalvar() {
    if (!cidade || !pdv || itens.length === 0 || !formaPagamento) {
      alert("Preencha todos os campos obrigatórios.");
      return;
    }
    const num = await ensureNumeroPedido();
    const novo = {
      cidade,
      escola: pdv,
      itens,
      formaPagamento,
      dataVencimento: dataVencimento || null,
      total: Number(totalPedido),
      statusEtapa: "Lançado",
      criadoEm: serverTimestamp(),
      numeroPedido: num,
    };
    try {
      const ref = await addDoc(collection(db, "PEDIDOS"), novo);
      setPedidoId(ref.id);
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
      setNumeroPedido(null);
      setPedidoId(null);
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
      snap.docs.forEach((docu) => {
        const d = docu.data();
        if (d.escola) m[d.escola] = d.statusEtapa;
      });
      setStatusPorPdv(m);
    });
  }, []);

  // === constrói o PDF com N linhas em branco; retorna se coube na página ===
  async function buildPdf(extraBlankRows) {
    const docPdf = new jsPDF({ unit: "pt", format: "a5", orientation: "portrait" });
    const M = 32;
    const pageW = docPdf.internal.pageSize.getWidth();
    const pageH = docPdf.internal.pageSize.getHeight();
    const innerW = pageW - 2 * M;

    docPdf.setFont("helvetica", "normal");
    docPdf.setTextColor(0, 0, 0);
    docPdf.setDrawColor(TERRA.r, TERRA.g, TERRA.b);

    // topo: vendedor + data (linha única)
    docPdf.setFontSize(11);
    docPdf.text(`Vendedor: Dudunitê • Data: ${brDate(hojeISO())}`, M, M + 6);

    // logo canto superior direito (ancorado)
    const logo = await loadImageSafe("/LogomarcaDDnt2025Vazado.png");
    if (logo) {
      const maxW = 124;
      const ratio = Math.min(maxW / logo.width, 1);
      const w = logo.width * ratio;
      const h = logo.height * ratio;
      docPdf.addImage(logo, "PNG", pageW - M - w, M + 6, w, h);
    }

    // “Pedido Nº”
    const pillH = 26;
    docPdf.setFillColor(247, 236, 230);
    docPdf.roundedRect(M, M + 20, 110, pillH, 10, 10, "FD");
    docPdf.setFont("helvetica", "bold");
    docPdf.setFontSize(11);
    docPdf.text("Pedido Nº", M + 12, M + 20 + 17);

    const numero = await ensureNumeroPedido();
    docPdf.roundedRect(M + 120, M + 20, 120, pillH, 10, 10, "S");
    docPdf.text(numero, M + 130, M + 20 + 17);

    // bloco cliente
    let y = M + 20 + pillH + 18;
    const linha = (yy) => docPdf.line(M, yy, pageW - M, yy);

    docPdf.setFont("helvetica", "normal");
    docPdf.setFontSize(11);

    docPdf.text("Cliente:", M, y);
    docPdf.text(pdv, M + 56, y);
    linha(y + 8);

    docPdf.text("Endereço:", M, y + 24);
    linha(y + 32);

    docPdf.text("CEP:", M, y + 48);
    docPdf.text("Cidade:", M + 120, y + 48);
    docPdf.text(cidade, M + 180, y + 48);
    docPdf.text("Estado:", M + 300, y + 48);
    linha(y + 56);

    docPdf.text("C.N.P.J.:", M, y + 72);
    docPdf.text("Inscr. Est.:", M + 240, y + 72);
    linha(y + 80);

    docPdf.text("E-mail:", M, y + 96);
    linha(y + 104);

    // tabela de itens
    const startItemsY = y + 120;

    // larguras para caber TOTAL dentro
    const wQtde = 55;
    const wUnid = 50;
    const wTot = 75;
    const wDesc = innerW - (wQtde + wUnid + wTot);

    const head = [["Qtde.", "Descrição", "Unid.", "Total"]];
    const body = [
      ...itens.map((it) => [String(it.quantidade), it.produto, "UN", money(it.total)]),
      ...Array.from({ length: extraBlankRows }, () => ["", "", "", ""]),
    ];

    autoTable(docPdf, {
      startY: startItemsY,
      head,
      body,
      theme: "grid",
      styles: { fontSize: 11, lineColor: [TERRA.r, TERRA.g, TERRA.b], cellPadding: 6 },
      headStyles: {
        fontSize: 11,
        fillColor: [247, 236, 230],
        textColor: [60, 40, 30],
        lineColor: [TERRA.r, TERRA.g, TERRA.b],
      },
      margin: { left: M, right: M },
      columnStyles: {
        0: { cellWidth: wQtde, halign: "center" },
        1: { cellWidth: wDesc },
        2: { cellWidth: wUnid, halign: "center" },
        3: { cellWidth: wTot, halign: "right" },
      },
    });

    const afterItemsY = docPdf.lastAutoTable.finalY;

    // espaço necessário para resumo + rodapé
    const RESUMO_H_EST = 60; // cabeçalho+1 linha
    const RODAPE_H_EST = 60; // 4 linhas de texto
    const LIMITE_ITENS = pageH - (M + RESUMO_H_EST + RODAPE_H_EST + 18);

    // se passou do limite, avisar para reduzir linhas e reconstruir
    if (afterItemsY > LIMITE_ITENS) {
      return { fits: false, doc: docPdf, afterItemsY, pageH, M };
    }

    // resumo
    autoTable(docPdf, {
      startY: afterItemsY + 10,
      head: [["Forma de pagamento", "Vencimento", "Valor total do pedido"]],
      body: [[formaPagamento, dataVencimento ? brDate(dataVencimento) : "-", money(totalPedido)]],
      theme: "grid",
      styles: { fontSize: 11, lineColor: [TERRA.r, TERRA.g, TERRA.b], cellPadding: 6 },
      headStyles: {
        fontSize: 10,
        fillColor: [247, 236, 230],
        textColor: [60, 40, 30],
        lineColor: [TERRA.r, TERRA.g, TERRA.b],
      },
      margin: { left: M, right: M },
      columnStyles: {
        0: { cellWidth: Math.round(innerW * 0.36) },
        1: { cellWidth: Math.round(innerW * 0.28), halign: "left" },
        2: { cellWidth: innerW - Math.round(innerW * 0.36) - Math.round(innerW * 0.28), halign: "right" },
      },
    });

    let yAfterResumo = docPdf.lastAutoTable.finalY + 14;

    // marca d'água (central)
    if (logo) {
      const maxW = pageW * 0.46;
      const ratio = Math.min(maxW / logo.width, 1);
      const w = logo.width * ratio;
      const h = logo.height * ratio;
      const x = (pageW - w) / 2;
      const yWM = (pageH - h) / 2 + 6;
      const hasG = typeof docPdf.GState === "function";
      if (hasG) docPdf.setGState(new docPdf.GState({ opacity: 0.08 }));
      docPdf.addImage(logo, "PNG", x, yWM, w, h);
      if (hasG) docPdf.setGState(new docPdf.GState({ opacity: 1 }));
    }

    // rodapé (garante que não corte)
    const RODAPE_H = 56;
    if (yAfterResumo + RODAPE_H > pageH - M) {
      // caberá numa nova página; mas queremos 1 página → sinaliza ajuste
      return { fits: false, doc: docPdf, afterItemsY, pageH, M };
    }

    docPdf.setFont("helvetica", "bold");
    docPdf.setFontSize(11);
    docPdf.text("Dudunitê", M, yAfterResumo);
    docPdf.setFont("helvetica", "normal");
    yAfterResumo += 16;
    docPdf.text("Instagram: @dudunite", M, yAfterResumo);
    yAfterResumo += 14;
    docPdf.text("WhatsApp: 81998889360", M, yAfterResumo);
    yAfterResumo += 14;
    docPdf.text("Janela de pedidos: toda quinta/sexta feira", M, yAfterResumo);
    yAfterResumo += 14;
    docPdf.text("Entrega: toda segunda feira", M, yAfterResumo);

    return { fits: true, doc: docPdf };
  }

  // ─── PDF + WHATSAPP ─────────────────
  async function gerarPdfECompartilhar() {
    if (!cidade || !pdv || itens.length === 0 || !formaPagamento) {
      alert("Preencha cidade, PDV, ao menos 1 item e a forma de pagamento.");
      return;
    }

    // tenta com 8 linhas e ajusta se precisar
    let extra = 8;
    let attempt = 0;
    let built = await buildPdf(extra);
    while (!built.fits && attempt < 5) {
      // reduz estimando quantas linhas “sobram”
      const sobra = built.afterItemsY - (built.pageH - (built.M + 120)); // 120~ resumo+rodapé
      const porLinha = 20; // altura média de uma linha
      const tirar = Math.max(1, Math.ceil(sobra / porLinha));
      extra = Math.max(0, extra - tirar);
      attempt += 1;
      built = await buildPdf(extra);
    }

    const { doc: docPdf } = built;

    const numero = await ensureNumeroPedido();
    const pdfBlob = docPdf.output("blob");
    const file = new File([pdfBlob], `${numero}_${pdv}_${hojeISO()}.pdf`, {
      type: "application/pdf",
    });

    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          title: `Pedido ${numero} - ${pdv}`,
          text: "Segue o pedido em anexo.",
          files: [file],
        });
        return;
      } catch (_) {}
    }

    const url = URL.createObjectURL(pdfBlob);
    const mensagem =
      `Pedido ${numero}\nPDV: ${pdv}\nCidade: ${cidade}\n` +
      `Total: ${money(totalPedido)}\nPDF: ${url}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(mensagem)}`, "_blank");
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
                <button className="botao-excluir" onClick={() => setItens(itens.filter((_, j) => j !== i))}>
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
          <select value={formaPagamento} onChange={(e) => setFormaPagamento(e.target.value)}>
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

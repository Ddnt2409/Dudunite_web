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

// ───────── helpers ─────────
const money = (n) => `R$ ${Number(n || 0).toFixed(2).replace(".", ",")}`;
const hojeISO = () => new Date().toISOString().slice(0, 10);
const brDate = (d) => (d ? new Date(d) : new Date()).toLocaleDateString("pt-BR");
const UF = "PE";

// Sequência 01/AAAA (reinicia a cada ano; transação atômica)
async function getNextPedidoNumero() {
  const year = String(new Date().getFullYear());
  const ref = doc(db, "SEQUENCES", `pedido_${year}`);
  return await runTransaction(db, async (tx) => {
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
    // 2 dígitos: 01/AAAA
    return `${String(next).padStart(2, "0")}/${year}`;
  });
}

// carrega imagem e retorna {dataURL, w, h} para manter proporção
async function fetchImageInfo(path) {
  try {
    const res = await fetch(path, { cache: "no-store" });
    const blob = await res.blob();
    const dataURL = await new Promise((ok) => {
      const fr = new FileReader();
      fr.onload = () => ok(fr.result);
      fr.readAsDataURL(blob);
    });
    const img = await new Promise((ok, err) => {
      const im = new Image();
      im.onload = () => ok(im);
      im.onerror = err;
      im.src = dataURL;
    });
    return { dataURL, w: img.naturalWidth || img.width, h: img.naturalHeight || img.height };
  } catch {
    return null;
  }
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

  // total = soma dos itens
  useEffect(() => {
    const soma = itens.reduce((acc, it) => acc + Number(it.total || 0), 0);
    setTotalPedido(soma.toFixed(2));
  }, [itens]);

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

  // ─── PDF terracota A5 + WhatsApp ─────────────────
  async function gerarPdfECompartilhar() {
    if (!cidade || !pdv || itens.length === 0 || !formaPagamento) {
      alert("Preencha cidade, PDV, ao menos 1 item e a forma de pagamento.");
      return;
    }

    let numeroComanda = "00/0000";
    try {
      numeroComanda = await getNextPedidoNumero(); // 01/AAAA
    } catch {}

    // paleta terracota
    const terra = { r: 123, g: 60, b: 33 }; // #7b3c21
    const terraLight = { r: 245, g: 231, b: 222 }; // claro
    const grid = { r: 173, g: 132, b: 112 };

    const doc = new jsPDF({ unit: "pt", format: "a5", compress: true });
    const W = doc.internal.pageSize.getWidth();
    const H = doc.internal.pageSize.getHeight();
    const M = 26;
    let y = M;

    // carrega logo (para canto e para marca d'água) mantendo proporção
    const logoInfo = await fetchImageInfo("/LogomarcaDDnt2025Vazado.png");

    // Marca d’água central, translúcida e proporcional
    if (logoInfo) {
      const wmMaxW = W * 0.6;
      const wmMaxH = H * 0.35;
      const ratio = logoInfo.w / logoInfo.h;
      let wmW = wmMaxW;
      let wmH = wmW / ratio;
      if (wmH > wmMaxH) {
        wmH = wmMaxH;
        wmW = wmH * ratio;
      }
      const wmX = (W - wmW) / 2;
      const wmY = (H - wmH) / 2;
      try {
        if (doc.GState && doc.setGState) {
          const gs = new doc.GState({ opacity: 0.10 });
          doc.setGState(gs);
          doc.addImage(logoInfo.dataURL, "PNG", wmX, wmY, wmW, wmH, undefined, "FAST");
          const gs1 = new doc.GState({ opacity: 1 });
          doc.setGState(gs1);
        } else {
          // fallback sem opacidade (aceitável)
          doc.addImage(logoInfo.dataURL, "PNG", wmX, wmY, wmW, wmH, undefined, "FAST");
        }
      } catch {}
    }

    // Cabeçalho: "Pedido Nº" (pílula) + número
    doc.setDrawColor(terra.r, terra.g, terra.b);
    doc.setFillColor(terraLight.r, terraLight.g, terraLight.b);
    doc.roundedRect(M, y, 120, 28, 8, 8, "FD");
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("Pedido Nº", M + 12, y + 18);

    // Caixa do número
    doc.roundedRect(M + 120 + 8, y, 120, 28, 8, 8, "S");
    doc.text(numeroComanda, M + 120 + 8 + 12, y + 18);

    // Logo canto superior direito (sem esticar)
    let logoW = 0,
      logoH = 0;
    if (logoInfo) {
      const maxW = 110,
        maxH = 34;
      const ratio = logoInfo.w / logoInfo.h;
      logoW = maxW;
      logoH = logoW / ratio;
      if (logoH > maxH) {
        logoH = maxH;
        logoW = logoH * ratio;
      }
      const lx = W - M - logoW;
      const ly = y - 2;
      doc.addImage(logoInfo.dataURL, "PNG", lx, ly, logoW, logoH, undefined, "FAST");
    }

    // Vendedor/Data posicionados à esquerda da logo (sem sobrepor)
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    const rightLimit = W - M - (logoW ? logoW + 12 : 0);
    const vendorX = Math.max(M + 260, rightLimit - 160);
    doc.text(`Vendedor: Dudunitê`, vendorX, y + 12);
    doc.text(`Data: ${brDate(hojeISO())}`, vendorX, y + 24);

    y += 40;

    // Linhas do cadastro (tom terracota)
    doc.setDrawColor(grid.r, grid.g, grid.b);
    doc.setLineWidth(0.8);
    const drawLine = (x1, yy) => doc.line(x1, yy, W - M, yy);

    doc.text("Cliente:", M, y);
    doc.text(pdv, M + 54, y);
    drawLine(M + 50, y + 2);
    y += 18;

    doc.text("Endereço:", M, y);
    drawLine(M + 60, y + 2);
    y += 18;

    doc.text("CEP:", M, y);
    drawLine(M + 30, y + 2);
    doc.text("Cidade:", M + 160, y);
    doc.text(cidade, M + 210, y);
    drawLine(M + 200, y + 2);
    doc.text("Estado:", W - 140, y);
    doc.text(UF, W - 84, y);
    drawLine(W - 96, y + 2);
    y += 18;

    doc.text("C.N.P.J.:", M, y);
    drawLine(M + 50, y + 2);
    doc.text("Inscr. Est.:", M + 250, y);
    drawLine(M + 310, y + 2);
    y += 18;

    doc.text("E-mail:", M, y);
    drawLine(M + 40, y + 2);
    y += 10;

    // Tabela (cores terracota)
    const body = itens.map((it) => [
      String(it.quantidade),
      it.produto,
      "UN",
      money(it.total),
    ]);

    autoTable(doc, {
      startY: y,
      head: [["Qtde.", "Descrição", "Unid.", "Total"]],
      body,
      theme: "grid",
      margin: { left: M, right: M },
      styles: {
        fontSize: 11,
        lineColor: [grid.r, grid.g, grid.b],
        textColor: [0, 0, 0],
      },
      headStyles: {
        fillColor: [terraLight.r, terraLight.g, terraLight.b],
        textColor: [0, 0, 0],
        lineColor: [terra.r, terra.g, terra.b],
        halign: "center",
      },
      columnStyles: {
        0: { cellWidth: 58, halign: "right" },
        2: { cellWidth: 60, halign: "center" },
        3: { cellWidth: 86, halign: "right" },
      },
    });

    y = doc.lastAutoTable.finalY + 14;

    // Rodapé: Forma de pagamento | Vencimento | Valor total do pedido
    const hBox = 54;
    const wBox = (W - M * 2) / 3;

    doc.setDrawColor(grid.r, grid.g, grid.b);
    doc.rect(M, y, wBox, hBox);
    doc.rect(M + wBox, y, wBox, hBox);
    doc.rect(M + wBox * 2, y, wBox, hBox);

    doc.setFont("helvetica", "bold");
    doc.text("Forma de pagamento", M + 10, y + 16);
    doc.text("Vencimento", M + wBox + 10, y + 16);
    doc.text("Valor total do pedido", M + wBox * 2 + 10, y + 16);

    doc.setFont("helvetica", "normal");
    doc.text(formaPagamento || "-", M + 10, y + 36);
    doc.text(dataVencimento ? brDate(dataVencimento) : "-", M + wBox + 10, y + 36);
    doc.setFont("helvetica", "bold");
    doc.text(money(totalPedido), M + wBox * 2 + 10, y + 36);

    // Observação alinhada à esquerda
    y += hBox + 18;
    doc.setFont("helvetica", "normal");
    doc.text(
      `Forma de pagamento: ${formaPagamento}${
        dataVencimento ? `  •  Vencimento: ${brDate(dataVencimento)}` : ""
      }`,
      M,
      y
    );

    // share
    const pdfBlob = doc.output("blob");
    const fileName = `${numeroComanda.replace("/", "-")}_${pdv}_${hojeISO()}.pdf`;
    const file = new File([pdfBlob], fileName, { type: "application/pdf" });

    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          title: "Pedido Dudunitê",
          text: "Segue o pedido em anexo.",
          files: [file],
        });
        return;
      } catch {}
    }

    // Fallback: link + texto no WhatsApp
    const url = URL.createObjectURL(pdfBlob);
    const msg =
      `Pedido ${numeroComanda}\n` +
      `PDV: ${pdv} • Cidade: ${cidade}\n` +
      `Total: ${money(totalPedido)}\n` +
      (dataVencimento ? `Vencimento: ${brDate(dataVencimento)}\n` : "") +
      `PDF: ${url}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank");
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  }

  // ─── UI (layout aprovado) ─────────────────
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
            • Pequeno Príncipe • Salesianas • Céu Azul • Russas • Bora Gastar • Kaduh • Society Show • Degusty • Tio
            Valter • Vera Cruz
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

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

// PDF
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

// ───────────────── helpers ─────────────────
const money = (n) => `R$ ${Number(n || 0).toFixed(2).replace(".", ",")}`;
const hojeISO = () => new Date().toISOString().slice(0, 10);
const brDate = (d) => (d ? new Date(d) : new Date()).toLocaleDateString("pt-BR");
const UF = "PE"; // todas as cidades estão em PE

// Sequência 001/AAAA por ano (atômica, reinicia a cada ano)
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
    return `${String(next).padStart(3, "0")}/${year}`;
  });
}

// tenta carregar imagem e converter para dataURL (fallback silencioso)
async function fetchAsDataURL(path) {
  try {
    const res = await fetch(path, { cache: "no-store" });
    const blob = await res.blob();
    return await new Promise((ok) => {
      const fr = new FileReader();
      fr.onload = () => ok(fr.result);
      fr.readAsDataURL(blob);
    });
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

  // ─── PDF + WHATSAPP (COMANDA A5, TERRACOTA) ─────────────────
  async function gerarPdfECompartilhar() {
    if (!cidade || !pdv || itens.length === 0 || !formaPagamento) {
      alert("Preencha cidade, PDV, ao menos 1 item e a forma de pagamento.");
      return;
    }

    // número 001/AAAA
    let numeroComanda = "000/0000";
    try {
      numeroComanda = await getNextPedidoNumero();
    } catch {
      /* offline: segue sem bloquear */
    }

    // paleta terracota
    const terra = { r: 123, g: 60, b: 33 }; // #7b3c21
    const terraLight = { r: 240, g: 224, b: 210 };
    const grid = { r: 203, g: 168, b: 150 };

    const doc = new jsPDF({ unit: "pt", format: "a5", compress: true });
    const W = doc.internal.pageSize.getWidth();
    const H = doc.internal.pageSize.getHeight();
    const M = 26;
    let y = M;

    doc.setDrawColor(grid.r, grid.g, grid.b);
    doc.setTextColor(0, 0, 0);

    // Marca d’água
    doc.setFont("helvetica", "bold");
    doc.setFontSize(80);
    doc.setTextColor(235, 220, 210); // clarinho
    doc.text("DUDUNITÊ", W / 2, H / 2, { align: "center", angle: 20 });
    doc.setTextColor(0, 0, 0);

    // Cabeçalho: "Pedido Nº"
    doc.setFillColor(terraLight.r, terraLight.g, terraLight.b);
    doc.setDrawColor(terra.r, terra.g, terra.b);
    doc.roundedRect(M, y, 120, 28, 6, 6, "FD");
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Pedido Nº", M + 12, y + 18);

    // Caixa do número
    doc.roundedRect(M + 120 + 6, y, 110, 28, 6, 6, "S");
    doc.text(numeroComanda, M + 132, y + 18);

    // Logo (canto superior direito)
    try {
      const logo64 = await fetchAsDataURL("/LogomarcaDDnt2025Vazado.png");
      if (logo64) doc.addImage(logo64, "PNG", W - 110 - M, y - 4, 110, 34, undefined, "FAST");
    } catch {
      // se falhar, segue sem logo
    }

    // Vendedor + Data
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.text(`Vendedor: Dudunitê`, M + 120 + 6 + 120 + 10, y + 12);
    doc.text(`Data: ${brDate(hojeISO())}`, M + 120 + 6 + 120 + 10, y + 24);

    y += 40;

    // Infos do cliente (linhas terracota)
    const drawLine = (x1, yy) => doc.line(x1, yy, W - M, yy);
    doc.setDrawColor(grid.r, grid.g, grid.b);
    doc.setLineWidth(0.8);

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

    // Tabela de itens
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
      styles: { fontSize: 11, lineColor: grid, textColor: [0, 0, 0] },
      headStyles: {
        fillColor: [terraLight.r, terraLight.g, terraLight.b],
        textColor: [0, 0, 0],
        lineColor: [terra.r, terra.g, terra.b],
        halign: "center",
      },
      theme: "grid",
      margin: { left: M, right: M },
      columnStyles: {
        0: { cellWidth: 58, halign: "right" },
        2: { cellWidth: 60, halign: "center" },
        3: { cellWidth: 86, halign: "right" },
      },
      stylesAdditional: { cellPadding: 6 },
      didDrawPage: () => {},
    });

    y = doc.lastAutoTable.finalY + 14;

    // Rodapé em 3 caixas: Forma de Pagamento / Vencimento / Valor total
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

    // Observações forma/vencimento em linha extra
    y += hBox + 18;
    doc.setFont("helvetica", "normal");
    doc.text(
      `Forma de pagamento: ${formaPagamento}${
        dataVencimento ? `  •  Vencimento: ${brDate(dataVencimento)}` : ""
      }`,
      M,
      y
    );

    // Gera blob e compartilha
    const pdfBlob = doc.output("blob");
    const fileName = `Pedido_${numeroComanda}_${pdv}_${hojeISO()}.pdf`;
    const file = new File([pdfBlob], fileName, { type: "application/pdf" });

    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          title: "Pedido Dudunitê",
          text: "Segue o pedido em anexo.",
          files: [file],
        });
        return;
      } catch {
        /* usuário pode ter cancelado; cai no fallback */
      }
    }

    // Fallback: abrir WhatsApp com texto + link temporário
    const url = URL.createObjectURL(pdfBlob);
    const mensagem =
      `Pedido ${numeroComanda}\n` +
      `PDV: ${pdv} • Cidade: ${cidade}\n` +
      `Total: ${money(totalPedido)}\n` +
      (dataVencimento ? `Vencimento: ${brDate(dataVencimento)}\n` : "") +
      `PDF: ${url}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(mensagem)}`, "_blank");
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  }

  // ─── UI (mantendo seu layout aprovado) ─────────────────
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
                {it.quantidade}× {it.produto} — {money(it.valorUnitario)} (Total:{" "}
                {money(it.total)})
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

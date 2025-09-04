import React, { useMemo, useState } from "react";
import ERPHeader from "./ERPHeader";
import ERPFooter from "./ERPFooter";
import db from "../firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

// PDF
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// helpers
const fmt = (n) =>
  (Number(n) || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const dtBR = (v) =>
  (v ? new Date(v) : new Date()).toLocaleDateString("pt-BR");

export default function LancarPedido({ setTela }) {
  // campos principais (adapte aos seus sources de opções)
  const [cidade, setCidade] = useState("Gravatá");
  const [pdv, setPdv] = useState("");
  const [forma, setForma] = useState("");
  const [venc, setVenc] = useState("");

  // item em edição
  const [produto, setProduto] = useState("");
  const [qtd, setQtd] = useState(1);
  const [vlUnit, setVlUnit] = useState("");

  // lista final de itens do pedido
  const [itens, setItens] = useState([]);

  // ====== TOTAL (corrigido) ======
  const totalPedido = useMemo(
    () =>
      itens.reduce(
        (s, it) => s + (Number(it.qtd) || 0) * (Number(it.preco) || 0),
        0
      ),
    [itens]
  );

  function addItem() {
    const q = Number(qtd) || 0;
    const vu = Number(String(vlUnit).replace(",", ".")) || 0;
    if (!produto || q <= 0 || vu <= 0) return alert("Preencha produto, quantidade e valor unitário.");
    setItens((old) => [...old, { desc: produto, qtd: q, preco: vu }]);
    // limpa apenas os campos do item
    setProduto("");
    setQtd(1);
    setVlUnit("");
  }

  function removeItem(idx) {
    setItens((arr) => arr.filter((_, i) => i !== idx));
  }

  async function salvarPedido() {
    if (!pdv || !forma || itens.length === 0) {
      return alert("Preencha PDV, forma de pagamento e inclua pelo menos um item.");
    }
    try {
      const payload = {
        cidade,
        pdv,
        formaPagamento: forma,
        dataVencimento: venc || null,
        itens: itens.map((it) => ({
          produto: it.desc,
          quantidade: Number(it.qtd),
          valorUnitario: Number(it.preco),
        })),
        total: totalPedido,
        criadoEm: serverTimestamp(),
      };
      await addDoc(collection(db, "PEDIDOS"), payload);
      alert("Pedido salvo!");
      // limpa
      setItens([]);
      setForma("");
      setVenc("");
    } catch (e) {
      alert("Erro ao salvar: " + (e?.message || e));
    }
  }

  async function gerarPdfECompartilhar() {
    if (!pdv || itens.length === 0) return alert("Preencha o PDV e adicione itens.");

    // ====== PDF ======
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const margem = 40;

    // Cabeçalho
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("Pedido", margem, 40);
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text(`Data: ${dtBR()}`, margem, 60);
    doc.text(`Ponto de Venda: ${pdv}`, margem, 76);
    if (cidade) doc.text(`Cidade: ${cidade}`, margem, 92);

    // Tabela
    const body = itens.map((it) => [
      String(it.qtd),
      it.desc,
      fmt(it.preco),
      fmt(Number(it.qtd) * Number(it.preco)),
    ]);

    autoTable(doc, {
      startY: 120,
      head: [["Qtde", "Descrição", "Unit.", "Total"]],
      body,
      styles: { font: "helvetica", fontSize: 11 },
      headStyles: { fillColor: [230, 230, 230] },
      columnStyles: { 0: { halign: "right", cellWidth: 60 }, 2: { halign: "right", cellWidth: 90 }, 3: { halign: "right", cellWidth: 100 } },
      margin: { left: margem, right: margem },
    });

    const y = doc.lastAutoTable.finalY + 16;
    doc.setFont("helvetica", "bold");
    doc.text(`Valor total do pedido: ${fmt(totalPedido)}`, margem, y);
    doc.setFont("helvetica", "normal");
    doc.text(`Forma de pagamento: ${forma || "-"}`, margem, y + 18);
    doc.text(`Vencimento: ${venc ? dtBR(venc) : "-"}`, margem, y + 36);

    const blob = doc.output("blob");
    const file = new File([blob], `Pedido_${pdv}_${Date.now()}.pdf`, {
      type: "application/pdf",
    });

    // Compartilhar (WhatsApp) — Web Share API com fallback para link
    const shareText = `Pedido ${pdv} — ${dtBR()}\nTotal: ${fmt(totalPedido)}\nVenc: ${
      venc ? dtBR(venc) : "-"
    }`;
    try {
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: `Pedido ${pdv}`, text: shareText });
      } else {
        // Fallback: cria URL de download e abre WhatsApp com texto + link
        const url = URL.createObjectURL(blob);
        const wa = `https://wa.me/?text=${encodeURIComponent(`${shareText}\nPDF: ${url}`)}`;
        window.open(wa, "_blank");
      }
    } catch (e) {
      // se usuário cancelar o share, nada a fazer
      console.log("share cancel/err", e);
    }
  }

  return (
    <>
      <ERPHeader title="Lançar Pedido" />
      <main className="fluxcx-main" style={{ padding: 10 }}>
        <div className="extrato-card" style={{ maxWidth: 860, margin: "0 auto" }}>
          {/* Cabeçalho */}
          <div className="form-row">
            <label>Cidade</label>
            <select value={cidade} onChange={(e) => setCidade(e.target.value)}>
              <option>Gravatá</option>
              <option>Caruaru</option>
              <option>Recife</option>
            </select>
          </div>

          <div className="form-row">
            <label>Ponto de Venda</label>
            <select value={pdv} onChange={(e) => setPdv(e.target.value)}>
              <option value="">Selecione</option>
              <option>Vera Cruz</option>
              <option>Salesianas</option>
              <option>Russas</option>
              <option>Society Show</option>
              {/* ... */}
            </select>
          </div>

          {/* Item em edição */}
          <div className="form-row">
            <label>Produto</label>
            <input
              placeholder="Descrição do produto"
              value={produto}
              onChange={(e) => setProduto(e.target.value)}
            />
          </div>

          <div className="form-row grid-2">
            <div>
              <label>Quantidade</label>
              <input
                type="number"
                min="1"
                value={qtd}
                onChange={(e) => setQtd(e.target.value)}
              />
            </div>
            <div>
              <label>Valor Unitário</label>
              <input
                type="number"
                step="0.01"
                value={vlUnit}
                onChange={(e) => setVlUnit(e.target.value)}
              />
            </div>
          </div>

          <button className="btn-acao" onClick={addItem}>+ Adicionar Item</button>

          {/* Lista de itens */}
          <div style={{ marginTop: 12 }}>
            {itens.map((it, idx) => (
              <div key={idx} style={{ display: "flex", alignItems: "center", gap: 8, margin: "6px 0" }}>
                <div style={{ flex: 1 }}>
                  {it.qtd}× {it.desc} — {fmt(it.preco)} (Total: {fmt(it.qtd * it.preco)})
                </div>
                <button className="btn-acao btn-danger" onClick={() => removeItem(idx)}>Excluir</button>
              </div>
            ))}
          </div>

          {/* Total corrigido */}
          <h2 style={{ textAlign: "right", marginTop: 8 }}>
            Total: <span style={{ color: "#8B0000" }}>{fmt(totalPedido)}</span>
          </h2>

          {/* Pagamento / vencimento */}
          <div className="form-row">
            <label>Forma de Pagamento</label>
            <select value={forma} onChange={(e) => setForma(e.target.value)}>
              <option value="">Selecione</option>
              <option>PIX</option>
              <option>Espécie</option>
              <option>Cartão</option>
            </select>
          </div>

          <div className="form-row">
            <label>Data de Vencimento</label>
            <input type="date" value={venc} onChange={(e) => setVenc(e.target.value)} />
          </div>

          {/* Ações */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
            <button className="btn-acao" onClick={salvarPedido}>💾 Salvar Pedido</button>
            <button className="btn-acao" onClick={gerarPdfECompartilhar}>
              📄 Gerar PDF e enviar no WhatsApp
            </button>
            <button className="btn-acao" onClick={() => setTela?.("HomeERP")}>Voltar</button>
          </div>
        </div>
      </main>
      <ERPFooter onBack={() => setTela?.("HomeERP")} />
    </>
  );
    }

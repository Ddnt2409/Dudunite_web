// src/pages/StaPedActions.jsx
import React, { useMemo, useState } from "react";
import "./StaPed.css";
import { calculaPlanejamento } from "../util/MemProd"; // usa seus cálculos já existentes

export default function StaPedActions({ pedidos, semanaVazia }) {
  const [report, setReport] = useState(null); // {title, html}

  const temDados = useMemo(() => Array.isArray(pedidos) && pedidos.length > 0, [pedidos]);

  function renderEmpty(title) {
    setReport({
      title,
      html: `
        <div class="staped-empty-box">
          Nenhum dado disponível nesta semana. Volte após registrar pedidos.
        </div>
      `,
    });
  }

  function toHTML(obj) {
    return `<pre class="staped-report__pre">${escapeHtml(JSON.stringify(obj, null, 2))}</pre>`;
  }

  function gerarPDF() {
    // imprime apenas a área do relatório
    window.print();
  }

  // Botões
  function onPlanGeral() {
    if (!temDados) return renderEmpty("Planejamento de Produção – Geral");
    const plan = calculaPlanejamento(pedidos, { modo: "GERAL" });
    setReport({
      title: "Planejamento de Produção – Geral",
      html: toHTML(plan),
    });
  }

  function onPlanTempoReal() {
    if (!temDados) return renderEmpty("Planejamento de Produção – Tempo Real");
    const plan = calculaPlanejamento(pedidos, { modo: "TEMPO_REAL" });
    setReport({
      title: "Planejamento de Produção – Tempo Real",
      html: toHTML(plan),
    });
  }

  function onCompraGeral() {
    if (!temDados) return renderEmpty("Lista de Compras – Geral");
    const plan = calculaPlanejamento(pedidos, { modo: "GERAL", compras: true });
    setReport({
      title: "Lista de Compras – Geral",
      html: toHTML(plan),
    });
  }

  function onCompraTempoReal() {
    if (!temDados) return renderEmpty("Lista de Compras – Tempo Real");
    const plan = calculaPlanejamento(pedidos, { modo: "TEMPO_REAL", compras: true });
    setReport({
      title: "Lista de Compras – Tempo Real",
      html: toHTML(plan),
    });
  }

  return (
    <>
      <section className="staped-actions">
        <div className="staped-actions__grid">
          <button className="staped-btn staped-btn--dark70" onClick={onPlanGeral}>
            Planejamento de Produção – Geral
          </button>
          <button className="staped-btn staped-btn--dark60" onClick={onPlanTempoReal}>
            Planejamento de Produção – Tempo Real
          </button>
          <button className="staped-btn staped-btn--dark70" onClick={onCompraGeral}>
            Lista de Compras – Geral
          </button>
          <button className="staped-btn staped-btn--dark60" onClick={onCompraTempoReal}>
            Lista de Compras – Tempo Real
          </button>
        </div>
      </section>

      {report && (
        <section className="staped-report print-area">
          <div className="staped-report__title">{report.title}</div>
          <div dangerouslySetInnerHTML={{ __html: report.html }} />
          <div className="staped-report__actions">
            <button className="staped-btn staped-btn--dark70" onClick={gerarPDF}>
              Gerar PDF
            </button>
            <span className="staped-report__meta">
              {new Date().toLocaleString()}
            </span>
            <span className="staped-chip staped-chip--ok">OK</span>
          </div>
        </section>
      )}
    </>
  );
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// src/pages/StaPedActions.jsx
import React, { useMemo, useState } from "react";
import "./StaPed.css";
import { calculaPlanejamento } from "../util/MemProd";

/**
 * Renderização dos 4 relatórios do StaPed.
 * Não altera Firestore e não interfere nos cards do topo.
 */
export default function StaPedActions({ pedidos, semanaVazia }) {
  const [report, setReport] = useState(null); // { title, html }

  const temDados = useMemo(
    () => Array.isArray(pedidos) && pedidos.length > 0 && !semanaVazia,
    [pedidos, semanaVazia]
  );

  function renderEmpty(title) {
    setReport({
      title,
      html: wrapHTML(`
        <div class="rpt-empty">Nenhum dado disponível nesta semana. Volte após registrar pedidos.</div>
      `),
    });
  }

  // ===================== helpers de formatação ======================
  function titleize(s) {
    return String(s || "")
      .replace(/_/g, " ")
      .replace(/\b\w/g, (m) => m.toUpperCase());
  }

  function sumVals(obj = {}) {
    return Object.values(obj).reduce((a, b) => a + (Number(b) || 0), 0);
  }

  function buildKeyValTable(obj = {}, opts = {}) {
    const entries = Object.entries(obj).filter(
      ([k, v]) => v !== null && v !== undefined
    );
    if (!entries.length) return "";
    const { caption } = opts;
    return `
      <table class="rpt-table">
        ${caption ? `<caption>${caption}</caption>` : ""}
        <thead><tr><th>Item</th><th class="num">Qtde</th></tr></thead>
        <tbody>
          ${entries
            .map(
              ([k, v]) => `
            <tr>
              <td>${titleize(k)}</td>
              <td class="num">${Number(v) || 0}</td>
            </tr>`
            )
            .join("")}
        </tbody>
      </table>
    `;
  }

  // CSS embutido + body do relatório (pra não depender de StaPed.css)
  function wrapHTML(inner) {
    return `
      <style>
        :root { --terracota:#8c3b1b; --bg:#fff; --ink:#222; }
        .rpt { font: 14px/1.35 system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif; color: var(--ink); }
        .rpt h1 { font-size: 18px; margin: 0 0 10px; color: var(--terracota); }
        .rpt .rpt-grid { display: grid; gap: 10px; }
        .rpt .rpt-section { background: rgba(255,255,255,.85); border-radius: 10px; padding: 12px; box-shadow: 0 2px 8px rgba(0,0,0,.06); }
        .rpt .rpt-section h2 { font-size: 15px; margin: 0 0 8px; color: #5d2c16; }
        .rpt .rpt-kpis { display: flex; gap: 10px; flex-wrap: wrap; }
        .rpt .rpt-kpi { background:#f6f1ef; border:1px solid #eadbd5; border-radius:8px; padding:8px 10px; }
        .rpt .rpt-kpi b { color:#5d2c16; }
        .rpt-table { width: 100%; border-collapse: collapse; }
        .rpt-table caption { text-align:left; font-weight:600; margin:6px 0; color:#5d2c16; }
        .rpt-table th, .rpt-table td { border-top:1px solid #eee; padding:6px 8px; }
        .rpt-table thead th { border-top:none; background:#f9f3f1; color:#5d2c16; }
        .rpt-table td.num, .rpt-table th.num { text-align:right; font-variant-numeric: tabular-nums; }
        .rpt-empty { background:#fff3f0; border:1px dashed #f2c1b3; color:#6b2f1b; padding:14px; border-radius:10px; }
        .rpt-footer { display:flex; align-items:center; gap:10px; margin-top:10px; }
        .rpt-chip { display:inline-block; padding:3px 8px; border-radius:20px; font-weight:600; font-size:12px; }
        .rpt-chip.ok { background:#e6f6ea; color:#246b33; border:1px solid #cdebd6; }
        @media print { body { margin:0 } }
      </style>
      <div class="rpt">
        ${inner}
      </div>
    `;
  }

  function buildRelatorio(plan, titulo, legendaExtra = "") {
    // defensivo
    const p = plan?.plan || plan || {};
    const tabuleiros = p.tabuleiros || p.tabuleiro || {};
    const bacias = p.baciasPorCor || p.bacias_por_cor || {};
    const compras = p.compras || {};
    const massa = compras.massa_e_untar || compras.massa || {};
    const recheios = compras.recheios || {};

    const totalTabs = sumVals(tabuleiros);
    const totalBacias =
      (typeof p.totalBacias === "number" ? p.totalBacias : null) ??
      (typeof p.total_bacias === "number" ? p.total_bacias : null) ??
      sumVals(bacias);

    const resumoHTML = `
      <div class="rpt-section">
        <h2>Resumo</h2>
        <div class="rpt-kpis">
          <div class="rpt-kpi"><b>Modo:</b> ${titleize(p.modo || "Geral")}</div>
          <div class="rpt-kpi"><b>Total de Tabuleiros:</b> ${totalTabs}</div>
          ${
            totalBacias != null
              ? `<div class="rpt-kpi"><b>Total de Bacias:</b> ${totalBacias}</div>`
              : ""
          }
          ${legendaExtra ? `<div class="rpt-kpi"><b>Filtro:</b> ${legendaExtra}</div>` : ""}
        </div>
      </div>
    `;

    const tabuleirosHTML = Object.keys(tabuleiros).length
      ? `<div class="rpt-section">
          <h2>Tabuleiros</h2>
          ${buildKeyValTable(tabuleiros)}
        </div>`
      : "";

    const baciasHTML = Object.keys(bacias).length
      ? `<div class="rpt-section">
          <h2>Bacias</h2>
          ${buildKeyValTable(bacias)}
        </div>`
      : "";

    const comprasMassaHTML = Object.keys(massa).length
      ? `<div class="rpt-section">
          <h2>Compras – Massa e Untar</h2>
          ${buildKeyValTable(massa)}
        </div>`
      : "";

    const comprasRecheiosHTML = Object.keys(recheios).length
      ? `<div class="rpt-section">
          <h2>Compras – Recheios</h2>
          ${buildKeyValTable(recheios)}
        </div>`
      : "";

    const corpo = `
      <h1>${titulo}</h1>
      <div class="rpt-grid">
        ${resumoHTML}
        ${tabuleirosHTML}
        ${baciasHTML}
        ${comprasMassaHTML}
        ${comprasRecheiosHTML}
      </div>
      <div class="rpt-footer">
        <span>${new Date().toLocaleString()}</span>
        <span class="rpt-chip ok">OK</span>
      </div>
    `;
    return wrapHTML(corpo);
  }

  // ===================== ações dos botões ======================
  function onPlanGeral() {
    if (!temDados) return renderEmpty("Planejamento de Produção – Geral");
    const plan = calculaPlanejamento(pedidos, { modo: "GERAL" });
    setReport({
      title: "Planejamento de Produção – Geral",
      html: buildRelatorio(plan, "Planejamento de Produção – Geral"),
    });
  }

  function onPlanTempoReal() {
    if (!temDados) return renderEmpty("Planejamento de Produção – Tempo Real");
    const plan = calculaPlanejamento(pedidos, { modo: "TEMPO_REAL" });
    setReport({
      title: "Planejamento de Produção – Tempo Real",
      html: buildRelatorio(
        plan,
        "Planejamento de Produção – Tempo Real",
        "Tempo real"
      ),
    });
  }

  function onCompraGeral() {
    if (!temDados) return renderEmpty("Lista de Compras – Geral");
    const plan = calculaPlanejamento(pedidos, { modo: "GERAL", compras: true });
    setReport({
      title: "Lista de Compras – Geral",
      html: buildRelatorio(plan, "Lista de Compras – Geral"),
    });
  }

  function onCompraTempoReal() {
    if (!temDados) return renderEmpty("Lista de Compras – Tempo Real");
    const plan = calculaPlanejamento(pedidos, {
      modo: "TEMPO_REAL",
      compras: true,
    });
    setReport({
      title: "Lista de Compras – Tempo Real",
      html: buildRelatorio(
        plan,
        "Lista de Compras – Tempo Real",
        "Tempo real"
      ),
    });
  }

  // ===================== impressão ======================
  function gerarPDF() {
    if (!report?.html) return;
    const w = window.open("", "_blank", "noopener,noreferrer");
    if (!w) return;
    w.document.write(`
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>${report.title}</title>
        </head>
        <body>
          ${report.html}
          <script>
            window.addEventListener('load', () => {
              window.focus();
              window.print();
              setTimeout(() => window.close(), 300);
            });
          </script>
        </body>
      </html>
    `);
    w.document.close();
  }

  // ===================== UI ======================
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

          {/* corpo do relatório com CSS embutido */}
          <div dangerouslySetInnerHTML={{ __html: report.html }} />

          <div className="staped-report__actions">
            <button className="staped-btn staped-btn--dark70" onClick={gerarPDF}>
              Gerar PDF
            </button>
          </div>
        </section>
      )}
    </>
  );
}

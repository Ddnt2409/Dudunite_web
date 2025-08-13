// src/pages/StaPedActions.jsx
import React, { useMemo, useState } from "react";
import "./StaPed.css";

/**
 * Agrega itens por produto, com quantidade total.
 * Caso o shape do item seja { produto, quantidade } ou algo similar.
 */
function agregaItensPorProduto(pedidos) {
  const mapa = new Map();
  for (const p of pedidos) {
    const itens = Array.isArray(p.itens) ? p.itens : [];
    for (const it of itens) {
      const nome = String(it.produto || it.nome || it.label || "ITEM").trim();
      const qtd = Number(it.quantidade ?? it.qtd ?? 0);
      const prev = mapa.get(nome) || 0;
      mapa.set(nome, prev + (Number.isFinite(qtd) ? qtd : 0));
    }
  }
  // ordena por nome
  return [...mapa.entries()].sort((a, b) => a[0].localeCompare(b[0]));
}

/** Gera HTML simples imprimível a partir de um objeto qualquer */
function objetoParaHtml(obj) {
  // se veio um array de tuplas [ [produto, qtd], ... ]
  if (Array.isArray(obj)) {
    return `
      <table style="width:100%; border-collapse:collapse; font:14px system-ui">
        <thead>
          <tr>
            <th style="text-align:left; border-bottom:1px solid #ddd; padding:6px 8px">Produto</th>
            <th style="text-align:right; border-bottom:1px solid #ddd; padding:6px 8px">Quantidade</th>
          </tr>
        </thead>
        <tbody>
          ${obj
            .map(
              ([k, v]) => `
              <tr>
                <td style="border-bottom:1px solid #eee; padding:6px 8px">${k}</td>
                <td style="border-bottom:1px solid #eee; padding:6px 8px; text-align:right">${v}</td>
              </tr>`
            )
            .join("")}
        </tbody>
      </table>
    `;
  }

  // fallback genérico
  return `<pre style="white-space:pre-wrap; font:12px ui-monospace, Menlo, Consolas">${escapeHtml(
    JSON.stringify(obj, null, 2)
  )}</pre>`;
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/** Abre uma janela imprimível e chama print() (sem libs). */
function imprimirComoPDF({ titulo, conteudoHTML }) {
  const win = window.open("", "_blank");
  if (!win) return alert("Bloqueado pelo navegador. Habilite pop-ups para este site.");

  const css = `
    @media print {
      @page { size: A4 portrait; margin: 14mm; }
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
  `;
  win.document.write(`
    <html>
      <head>
        <meta charset="utf-8" />
        <title>${escapeHtml(titulo)}</title>
        <style>${css}</style>
      </head>
      <body style="font:14px system-ui, -apple-system, Segoe UI, Roboto, sans-serif; color:#222">
        <h1 style="font-size:20px; margin:0 0 12px">${escapeHtml(titulo)}</h1>
        ${conteudoHTML}
      </body>
    </html>
  `);
  win.document.close();
  win.focus();
  // pequena espera p/ renderizar antes do print
  setTimeout(() => {
    win.print();
    // win.close(); // se quiser fechar após impressão
  }, 250);
}

export default function StaPedActions({ pedidos, semanaVazia }) {
  const [painel, setPainel] = useState(null); // "planGeral" | "planTempo" | "listaGeral" | "listaTempo"
  const [dtRef, setDtRef] = useState(() => new Date().toISOString().slice(0, 10));
  const [ok, setOk] = useState(false);

  // filtros por status
  const lancados = useMemo(() => pedidos.filter((p) => p.statusEtapa === "Lançado"), [pedidos]);
  const alimentados = useMemo(() => pedidos.filter((p) => p.statusEtapa === "Alimentado"), [pedidos]);
  const todos = pedidos;

  // dados para “lista de compras” (agora 100% funcionais sem libs externas)
  const listaTempoReal = useMemo(() => agregaItensPorProduto(alimentados), [alimentados]);
  const listaGeral = useMemo(() => agregaItensPorProduto(todos), [todos]);

  function abrirPainel(code) {
    setPainel(code);
    setOk(false);
    // “validar” data — aqui só marcamos OK quando há dados no painel escolhido
    if (code === "listaTempo") setOk(listaTempoReal.length > 0);
    else if (code === "listaGeral") setOk(listaGeral.length > 0);
    else if (code === "planTempo") setOk(alimentados.length > 0);
    else if (code === "planGeral") setOk(todos.length > 0);
  }

  function gerarPDF() {
    if (!painel) return;

    let titulo = "";
    let html = "";

    if (painel === "listaTempo") {
      titulo = `Lista de Compras – Tempo Real (${dtRef})`;
      html = objetoParaHtml(listaTempoReal);
    } else if (painel === "listaGeral") {
      titulo = `Lista de Compras – Geral (${dtRef})`;
      html = objetoParaHtml(listaGeral);
    } else if (painel === "planTempo") {
      titulo = `Planejamento de Produção – Tempo Real (${dtRef})`;
      // aqui, como fallback, mostramos os PDVs alimentados + seus itens
      html = objetoParaHtml(
        alimentados.flatMap((p) =>
          (Array.isArray(p.itens) ? p.itens : []).map((it) => [
            `${p.cidade} • ${p.pdv} • ${it.produto || it.nome || "ITEM"}`,
            it.quantidade ?? it.qtd ?? 0,
          ])
        )
      );
    } else if (painel === "planGeral") {
      titulo = `Planejamento de Produção – Geral (${dtRef})`;
      html = objetoParaHtml(
        todos.flatMap((p) =>
          (Array.isArray(p.itens) ? p.itens : []).map((it) => [
            `${p.cidade} • ${p.pdv} • ${it.produto || it.nome || "ITEM"}`,
            it.quantidade ?? it.qtd ?? 0,
          ])
        )
      );
    }

    if (!html || /Nenhum dado/i.test(html)) {
      alert("Sem dados para este relatório.");
      return;
    }
    imprimirComoPDF({ titulo, conteudoHTML: html });
  }

  return (
    <>
      <section className="staped-actions">
        <div className="actions-grid">
          <button className="action-btn" onClick={() => abrirPainel("planGeral")}>
            Planejamento de Produção – Geral
          </button>
          <button className="action-btn" onClick={() => abrirPainel("planTempo")}>
            Planejamento de Produção – Tempo Real
          </button>
          <button className="action-btn" onClick={() => abrirPainel("listaGeral")}>
            Lista de Compras – Geral
          </button>
          <button className="action-btn" onClick={() => abrirPainel("listaTempo")}>
            Lista de Compras – Tempo Real
          </button>
        </div>
      </section>

      {painel && (
        <section className="staped-report">
          <div className="report-card">
            <h4 className="report-title">
              {painel === "planGeral" && "Planejamento de Produção – Geral"}
              {painel === "planTempo" && "Planejamento de Produção – Tempo Real"}
              {painel === "listaGeral" && "Lista de Compras – Geral"}
              {painel === "listaTempo" && "Lista de Compras – Tempo Real"}
            </h4>

            {/* Linha da data + status */}
            <div className="report-controls">
              <input
                type="date"
                value={dtRef}
                onChange={(e) => setDtRef(e.target.value)}
                className="report-date"
              />
              <span className={`report-ok ${ok ? "is-ok" : ""}`}>{ok ? "OK" : "–"}</span>
            </div>

            <div className="report-actions">
              <button className="btn-pdf" onClick={gerarPDF}>Gerar PDF</button>
            </div>
          </div>
        </section>
      )}
    </>
  );
}

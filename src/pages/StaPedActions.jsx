// src/pages/StaPedActions.jsx
import React, { useMemo, useState } from "react";
import "./StaPed.css";
import { calculaPlanejamento } from "../util/MemProd"; // mantém sua regra atual

export default function StaPedActions({ pedidos, semanaVazia }) {
  const [report, setReport] = useState(null); // { title, html, payload }

  const temDados = useMemo(
    () => Array.isArray(pedidos) && pedidos.length > 0,
    [pedidos]
  );

  // ===== Agregadores p/ painel lateral (robustos a estrutura) =====
  const contexto = useMemo(() => deriveContexto(pedidos), [pedidos]);

  function deriveContexto(peds = []) {
    const pdvsSet = new Set();
    const pedidosList = [];
    const porProduto = new Map();

    peds.forEach((p) => {
      const pdv =
        p?.escola ?? p?.pdv ?? p?.pontoDeVenda ?? p?.ponto ?? "—";
      if (pdv) pdvsSet.add(pdv);

      const itens =
        Array.isArray(p?.items) ? p.items :
        Array.isArray(p?.itens) ? p.itens : [];

      let total = 0;
      itens.forEach((it) => {
        const prod = it?.produto ?? it?.item ?? it?.nome ?? "";
        const q = Number(it?.quantidade ?? it?.qtd ?? it?.qtde ?? 0);
        if (prod) porProduto.set(prod, (porProduto.get(prod) || 0) + q);
        total += q;
      });

      const status = p?.dataAlimentado || p?.alimentadoEm
        ? "ALIMENTADO"
        : itens.length > 0
        ? "LANÇADO"
        : "PENDENTE";

      pedidosList.push({ pdv, total, status });
    });

    const pdvs = Array.from(pdvsSet).sort((a, b) => a.localeCompare(b));
    const totaisProdutos = Array.from(porProduto.entries())
      .map(([produto, qtd]) => ({ produto, qtd }))
      .sort((a, b) => a.produto.localeCompare(b.produto));

    return { pedidosList, pdvs, totaisProdutos };
  }

  // ===== Utilidades do relatório =====
  function renderEmpty(title) {
    setReport({
      title,
      html: `<div class="staped-empty-box">Nenhum dado disponível nesta semana. Volte após registrar pedidos.</div>`,
      payload: null,
    });
  }

  function toHTML(obj) {
    return `<pre class="staped-report__pre">${escapeHtml(
      JSON.stringify(obj, null, 2)
    )}</pre>`;
  }

  function gerarPDF() {
    window.print();
  }

  // ===== Botões =====
  function onPlanGeral() {
    if (!temDados) return renderEmpty("Planejamento de Produção – Geral");
    const plano = calculaPlanejamento(pedidos, { modo: "GERAL" });
    setReport({
      title: "Planejamento de Produção – Geral",
      html: toHTML(plano),
      payload: plano,
    });
  }

  function onPlanTempoReal() {
    if (!temDados) return renderEmpty("Planejamento de Produção – Tempo Real");
    const plano = calculaPlanejamento(pedidos, { modo: "TEMPO_REAL" });
    setReport({
      title: "Planejamento de Produção – Tempo Real",
      html: toHTML(plano),
      payload: plano,
    });
  }

  function onCompraGeral() {
    if (!temDados) return renderEmpty("Lista de Compras – Geral");
    const plano = calculaPlanejamento(pedidos, { modo: "GERAL", compras: true });
    setReport({
      title: "Lista de Compras – Geral",
      html: toHTML(plano),
      payload: plano,
    });
  }

  function onCompraTempoReal() {
    if (!temDados) return renderEmpty("Lista de Compras – Tempo Real");
    const plano = calculaPlanejamento(pedidos, { modo: "TEMPO_REAL", compras: true });
    setReport({
      title: "Lista de Compras – Tempo Real",
      html: toHTML(plano),
      payload: plano,
    });
  }

  return (
    <>
      {/* Barra de ações */}
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

      {/* Área dividida: Relatório (esq) + Painel lateral (dir) */}
      {report && (
        <section className="staped-split">
          {/* ESQUERDA: relatório */}
          <div className="staped-left print-area">
            <div className="staped-report">
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
            </div>
          </div>

          {/* DIREITA: painel de referência */}
          <aside className="staped-side no-print">
            <div className="staped-side__title">Referências deste relatório</div>

            <div className="staped-side__block">
              <div className="staped-side__subtitle">
                Pedidos ({contexto.pedidosList.length})
              </div>
              <ul className="staped-side__list">
                {contexto.pedidosList.map((p, i) => (
                  <li key={i} className={`staped-side__pill st-${p.status.toLowerCase()}`}>
                    <span className="staped-side__pill-main">{p.pdv}</span>
                    <span className="staped-side__pill-badge">{p.status}</span>
                    <span className="staped-side__pill-meta">{p.total} itens</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="staped-side__block">
              <div className="staped-side__subtitle">
                Pontos de Venda ({contexto.pdvs.length})
              </div>
              <ul className="staped-side__tags">
                {contexto.pdvs.map((n, i) => (
                  <li key={i} className="staped-tag">{n}</li>
                ))}
              </ul>
            </div>

            <div className="staped-side__block">
              <div className="staped-side__subtitle">Totais por Produto</div>
              <ul className="staped-side__list">
                {contexto.totaisProdutos.map((tp, i) => (
                  <li key={i} className="staped-side__row">
                    <span className="staped-side__row-name">{tp.produto}</span>
                    <span className="staped-side__row-qty">{tp.qtd}</span>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
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

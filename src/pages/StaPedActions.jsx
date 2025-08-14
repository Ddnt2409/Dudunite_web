// src/pages/StaPedActions.jsx
import React, { useMemo, useState } from "react";
import "./StaPed.css";
import { calculaPlanejamento } from "../util/MemProd";

export default function StaPedActions({ pedidos, semanaVazia }) {
  const [report, setReport] = useState(null); // { title, body, payload }

  const temDados = useMemo(
    () => Array.isArray(pedidos) && pedidos.length > 0,
    [pedidos]
  );

  // =========================
  // Painel lateral (referências)
  // =========================
  const contexto = useMemo(() => deriveContexto(pedidos), [pedidos]);

  function deriveContexto(peds = []) {
    const pdvsSet = new Set();
    const pedidosList = [];
    const porProduto = new Map();

    peds.forEach((p) => {
      const pdv = p?.escola ?? p?.pdv ?? p?.pontoDeVenda ?? p?.ponto ?? "—";
      if (pdv) pdvsSet.add(pdv);

      const itens = Array.isArray(p?.items) ? p.items : Array.isArray(p?.itens) ? p.itens : [];
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
        ? "LANCADO"
        : "PENDENTE";

      pedidosList.push({
        id: p?.id ?? p?.docId ?? `${pdv}-${Math.random().toString(36).slice(2)}`,
        pdv,
        total,
        status,
      });
    });

    const pdvs = Array.from(pdvsSet).sort((a, b) => a.localeCompare(b));
    const totaisProdutos = Array.from(porProduto.entries())
      .map(([produto, qtd]) => ({ produto, qtd }))
      .sort((a, b) => a.produto.localeCompare(b.produto));

    return { pedidosList, pdvs, totaisProdutos };
  }

  // =========================
  // Utilidades do relatório
  // =========================
  function renderEmpty(title) {
    setReport({
      title,
      body:
        "Nenhum dado disponível nesta semana. Volte após registrar pedidos.",
      payload: null,
    });
  }

  function stringifyBlock(obj) {
    return JSON.stringify(obj, null, 2);
  }

  function gerarPDF() {
    window.print();
  }

  // =========================
  // Ações (4 botões)
  // =========================
  function onPlanGeral() {
    if (!temDados) return renderEmpty("Planejamento de Produção – Geral");
    const plano = calculaPlanejamento(pedidos, { modo: "GERAL" });
    setReport({
      title: "Planejamento de Produção – Geral",
      body: stringifyBlock(plano),
      payload: plano,
    });
  }

  function onPlanTempoReal() {
    if (!temDados) return renderEmpty("Planejamento de Produção – Tempo Real");
    const plano = calculaPlanejamento(pedidos, { modo: "TEMPO_REAL" });
    setReport({
      title: "Planejamento de Produção – Tempo Real",
      body: stringifyBlock(plano),
      payload: plano,
    });
  }

  function onCompraGeral() {
    if (!temDados) return renderEmpty("Lista de Compras – Geral");
    const plano = calculaPlanejamento(pedidos, { modo: "GERAL", compras: true });
    setReport({
      title: "Lista de Compras – Geral",
      body: stringifyBlock(plano),
      payload: plano,
    });
  }

  function onCompraTempoReal() {
    if (!temDados) return renderEmpty("Lista de Compras – Tempo Real");
    const plano = calculaPlanejamento(pedidos, { modo: "TEMPO_REAL", compras: true });
    setReport({
      title: "Lista de Compras – Tempo Real",
      body: stringifyBlock(plano),
      payload: plano,
    });
  }

  // helper: slug sem acento p/ classe CSS
  const statusToSlug = (s) =>
    String(s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

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

              {/* mostro texto monoespaçado, sem usar <pre> */}
              <div className="staped-report__pre" role="document">
                {report.body}
              </div>

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
                {contexto.pedidosList.map((p) => (
                  <li
                    key={p.id}
                    className={`staped-side__pill st-${statusToSlug(p.status)}`}
                  >
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
                  <li key={i} className="staped-tag">
                    {n}
                  </li>
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

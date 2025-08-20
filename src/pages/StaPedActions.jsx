// src/pages/StaPedActions.jsx
import React, { useMemo, useState } from "react";
import "./StaPed.css";
import { calculaPlanejamento } from "../util/MemProd";

export default function StaPedActions({ pedidos, semanaVazia }) {
  const [report, setReport] = useState(null); // { title, html, payload, modo, tipo }
  const temDados = useMemo(() => Array.isArray(pedidos) && pedidos.length > 0, [pedidos]);

  // ---------------- Painel direito (referências) ----------------
  const contexto = useMemo(() => deriveContexto(pedidos), [pedidos]);

  function deriveContexto(peds = []) {
    const pdvsSet = new Set();
    const pedidosList = [];
    const porProduto = new Map();
    const porSabor = new Map(); // << NOVO: totais por sabor

    const addSabor = (nome, qtd) => {
      const s = String(nome ?? "").trim();
      const q = Number(qtd ?? 0);
      if (!s || q <= 0) return;
      porSabor.set(s, (porSabor.get(s) || 0) + q);
    };

    peds.forEach((p) => {
      const pdv = p?.escola ?? p?.pdv ?? p?.pontoDeVenda ?? p?.ponto ?? "—";
      if (pdv) pdvsSet.add(pdv);

      // ---- itens e totais por produto
      const itens = Array.isArray(p?.items) ? p.items : Array.isArray(p?.itens) ? p.itens : [];
      let total = 0;
      itens.forEach((it) => {
        const prod = it?.produto ?? it?.item ?? it?.nome ?? "";
        const q = Number(it?.quantidade ?? it?.qtd ?? it?.qtde ?? 0);
        if (prod) porProduto.set(prod, (porProduto.get(prod) || 0) + q);
        total += q;

        // ---- sabores no NÍVEL DO ITEM (formatos comuns)
        // Ex1: it.sabores = [{sabor, qtd}, ...]
        // Ex2: it.sabores = { "BRW 7x7": [{sabor,qtd}], ... }
        const si = it?.sabores;
        if (Array.isArray(si)) {
          si.forEach((s) => addSabor(s?.sabor ?? s?.nome ?? s?.label, s?.qtd ?? s?.quantidade));
        } else if (si && typeof si === "object") {
          Object.values(si).forEach((arr) => {
            if (Array.isArray(arr)) {
              arr.forEach((s) =>
                addSabor(s?.sabor ?? s?.nome ?? s?.label, s?.qtd ?? s?.quantidade)
              );
            }
          });
        }
      });

      // ---- sabores no NÍVEL DO PEDIDO (formato salvo pelo AliSab):
      // p.sabores = { "BRW 7x7": [{sabor,qtd}, ...], "ESC": [...] }
      if (p?.sabores && typeof p.sabores === "object") {
        Object.values(p.sabores).forEach((linhas) => {
          if (Array.isArray(linhas)) {
            linhas.forEach((s) =>
              addSabor(s?.sabor ?? s?.nome ?? s?.label, s?.qtd ?? s?.quantidade)
            );
          }
        });
      }

      const status = p?.dataAlimentado || p?.alimentadoEm ? "ALIMENTADO" : itens.length > 0 ? "LANÇADO" : "PENDENTE";
      pedidosList.push({ pdv, total, status });
    });

    const pdvs = Array.from(pdvsSet).sort((a, b) => a.localeCompare(b));
    const totaisProdutos = Array.from(porProduto.entries())
      .map(([produto, qtd]) => ({ produto, qtd }))
      .sort((a, b) => a.produto.localeCompare(b.produto));

    const totaisSabores = Array.from(porSabor.entries())
      .map(([sabor, qtd]) => ({ sabor, qtd }))
      .sort((a, b) => b.qtd - a.qtd || a.sabor.localeCompare(b.sabor)); // mais relevantes primeiro

    return { pedidosList, pdvs, totaisProdutos, totaisSabores };
  }

  // ---------------- Helpers gerais ----------------
  const n = (v) => Number(v || 0).toLocaleString("pt-BR");
  const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const sumObj = (obj = {}) => Object.values(obj).reduce((a, b) => a + Number(b || 0), 0);

  // normaliza string p/ busca acento-insensível (avisos sabores)
  const norm = (s) => String(s ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

  function coletarAvisosSaboresTempoReal() {
    // Pega só os pedidos ALIMENTADO e faz uma busca “texto” por termos
    const alimentados = pedidos.filter((p) => p?.dataAlimentado || p?.alimentadoEm);
    const blob = norm(JSON.stringify(alimentados));
    const avisos = [];

    if (/(confet[iy]|confet|confete)/.test(blob)) avisos.push("Precisará de confeti");
    if (/prestigio/.test(blob)) avisos.push("Precisará de coco ralado");
    if (/palha\s*italiana/.test(blob)) avisos.push("Precisará de biscoito maizena");
    if (/p[aã]coca/.test(blob)) avisos.push("Precisará de paçoca");
    if (/brigadeiro\s*preto/.test(blob)) avisos.push("Precisará de granulado");

    return avisos;
  }

  // ---------------- Construção do HTML do relatório ----------------
  function blocoResumo({ modo, totalTabs, b }) {
    return `
      <div class="staped-block">
        <div class="staped-block-title">Resumo</div>
        <div class="staped-kpis">
          <span class="kpi"><small>Modo:</small> ${esc(modo)}</span>
          <span class="kpi"><small>Total de Tabuleiros:</small> ${n(totalTabs)}</span>
          <span class="kpi"><small>Total de Bacias:</small> ${n(b.total ?? (b.branco||0)+(b.preto||0))}</span>
          ${modo === "TEMPO_REAL"
            ? `<span class="kpi"><small>Branco:</small> ${n(b.branco || 0)}</span>
               <span class="kpi"><small>Preto:</small> ${n(b.preto || 0)}</span>`
            : ""}
        </div>
      </div>`;
  }

  function blocoTabuleiros(tabuleiros = {}) {
    const linhas =
      Object.entries(tabuleiros)
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([nome, q]) => `<tr><td>${esc(nome)}</td><td class="num">${n(q)}</td></tr>`)
        .join("") || `<tr><td>—</td><td class="num">0</td></tr>`;

    return `
      <div class="staped-block">
        <div class="staped-block-title">Tabuleiros</div>
        <table class="staped-table">
          <thead><tr><th>Produto</th><th>Qtde</th></tr></thead>
          <tbody>${linhas}</tbody>
        </table>
      </div>`;
  }

  function blocoBacias(modo, b = {}) {
    if (modo === "TEMPO_REAL") {
      return `
      <div class="staped-block">
        <div class="staped-block-title">Bacias</div>
        <table class="staped-table">
          <thead><tr><th>Bacias por cor</th><th>Qtde</th></tr></thead>
          <tbody>
            <tr><td>Branco</td><td class="num">${n(b.branco || 0)}</td></tr>
            <tr><td>Preto</td><td class="num">${n(b.preto || 0)}</td></tr>
            <tr><td><strong>Total</strong></td><td class="num"><strong>${n(b.total ?? (b.branco||0)+(b.preto||0))}</strong></td></tr>
          </tbody>
        </table>
      </div>`;
    }
    return `
      <div class="staped-block">
        <div class="staped-block-title">Bacias</div>
        <table class="staped-table">
          <thead><tr><th>Bacias (neutras)</th><th>Qtde</th></tr></thead>
          <tbody><tr><td>Total</td><td class="num">${n(b.total ?? 0)}</td></tr></tbody>
        </table>
      </div>`;
  }

  function labelInsumo(k) {
    if (k.endsWith("_g")) return k.replace(/_/g, " ").replace(/ g$/, " (g)");
    if (k.endsWith("_kg")) return k.replace(/_/g, " ").replace(/ kg$/, " (kg)");
    if (k.endsWith("_un")) return k.replace(/_/g, " ").replace(/ un$/, " (un)");
    if (k.endsWith("_pacotes")) return k.replace(/_/g, " ").replace(/ pacotes$/, " (pacotes)");
    if (k.includes("bandejas_30")) return k.replace(/_/g, " ").replace(" 30", " (30 un)");
    return k.replace(/_/g, " ");
  }

  function linhasInsumos(obj = {}) {
    const entries = Object.entries(obj).filter(([k]) => !["tabuleiros", "total_bacias_aprox"].includes(k));
    const withValues = entries.filter(([, v]) => Number(v || 0) > 0);
    const list = (withValues.length ? withValues : entries).map(
      ([k, v]) => `<tr><td>${esc(labelInsumo(k))}</td><td class="num">${n(v)}</td></tr>`
    );
    return list.join("") || `<tr><td>—</td><td class="num">0</td></tr>`;
  }

  function blocoInsumos(compras = {}) {
    const mu = compras.massa_e_untar || compras.massa_untar || {};
    const rc = compras.recheios || {};
    return `
      <div class="staped-block">
        <div class="staped-block-title">Insumos — Massa e Untar</div>
        <table class="staped-table">
          <thead><tr><th>Item</th><th>Qtde</th></tr></thead>
          <tbody>${linhasInsumos(mu)}</tbody>
        </table>
      </div>

      <div class="staped-block">
        <div class="staped-block-title">Insumos — Recheios</div>
        <table class="staped-table">
          <thead><tr><th>Item</th><th>Qtde</th></tr></thead>
          <tbody>${linhasInsumos(rc)}</tbody>
        </table>
      </div>`;
  }

  function blocoAvisosTempoReal(avisos = []) {
    if (!avisos.length) return "";
    const lis = avisos.map((t) => `<li>${esc(t)}</li>`).join("");
    return `
      <div class="staped-block">
        <div class="staped-block-title">Avisos de sabores</div>
        <ul class="staped-notes">${lis}</ul>
      </div>`;
  }

  function htmlPlanejamento(plano, modo) {
    const p = plano?.plan || {};
    const tabuleiros = p.tabuleiros || plano?.tabuleiros || {};
    const totalTabs = Number(
      p.totalTabuleiros ?? (Object.keys(tabuleiros).length ? sumObj(tabuleiros) : 0)
    );
    const b = p.bacias || { total: p.totalBacias };

    return (
      blocoResumo({ modo, totalTabs, b }) +
      blocoTabuleiros(tabuleiros) +
      blocoBacias(modo, b)
    );
  }

  function htmlCompras(plano, modo) {
    const p = plano?.plan || {};
    const tabuleiros = p.tabuleiros || plano?.tabuleiros || {};
    const totalTabs = Number(
      p.totalTabuleiros ?? (Object.keys(tabuleiros).length ? sumObj(tabuleiros) : 0)
    );
    const b = p.bacias || { total: p.totalBacias };
    const avisos = modo === "TEMPO_REAL" ? coletarAvisosSaboresTempoReal() : [];

    return (
      blocoResumo({ modo, totalTabs, b }) +
      blocoTabuleiros(tabuleiros) +
      blocoBacias(modo, b) +
      blocoInsumos(plano?.compras || {}) +
      blocoAvisosTempoReal(avisos)
    );
  }

  // ---------------- Render empty ----------------
  function renderEmpty(title) {
    setReport({
      title,
      html: '<div class="staped-empty-box">Nenhum dado disponível nesta semana. Volte após registrar pedidos.</div>',
      payload: null,
      modo: null,
      tipo: null,
    });
  }

  function gerarPDF() { window.print(); }

  // ---------------- Ações dos botões ----------------
  function onPlanGeral() {
    if (!temDados) return renderEmpty("Planejamento de Produção – Geral");
    const plano = calculaPlanejamento(pedidos, { modo: "GERAL" });
    setReport({
      title: "Planejamento de Produção – Geral",
      html: htmlPlanejamento(plano, "GERAL"),
      payload: plano,
      modo: "GERAL",
      tipo: "PLANEJAMENTO",
    });
  }
  function onPlanTempoReal() {
    if (!temDados) return renderEmpty("Planejamento de Produção – Tempo Real");
    const plano = calculaPlanejamento(pedidos, { modo: "TEMPO_REAL" });
    setReport({
      title: "Planejamento de Produção – Tempo Real",
      html: htmlPlanejamento(plano, "TEMPO_REAL"),
      payload: plano,
      modo: "TEMPO_REAL",
      tipo: "PLANEJAMENTO",
    });
  }
  function onCompraGeral() {
    if (!temDados) return renderEmpty("Lista de Compras – Geral");
    const plano = calculaPlanejamento(pedidos, { modo: "GERAL", compras: true });
    setReport({
      title: "Lista de Compras – Geral",
      html: htmlCompras(plano, "GERAL"),
      payload: plano,
      modo: "GERAL",
      tipo: "COMPRAS",
    });
  }
  function onCompraTempoReal() {
    if (!temDados) return renderEmpty("Lista de Compras – Tempo Real");
    const plano = calculaPlanejamento(pedidos, { modo: "TEMPO_REAL", compras: true });
    setReport({
      title: "Lista de Compras – Tempo Real",
      html: htmlCompras(plano, "TEMPO_REAL"),
      payload: plano,
      modo: "TEMPO_REAL",
      tipo: "COMPRAS",
    });
  }

  // ---------------- JSX ----------------
  return (
    <>
      <section className="staped-actions">
        <div className="staped-actions__grid">
          <button className="staped-btn staped-btn--dark70" onClick={onPlanGeral}>Planejamento de Produção – Geral</button>
          <button className="staped-btn staped-btn--dark60" onClick={onPlanTempoReal}>Planejamento de Produção – Tempo Real</button>
          <button className="staped-btn staped-btn--dark70" onClick={onCompraGeral}>Lista de Compras – Geral</button>
          <button className="staped-btn staped-btn--dark60" onClick={onCompraTempoReal}>Lista de Compras – Tempo Real</button>
        </div>
      </section>

      {report && (
        <section className="staped-split">
          <div className="staped-left print-area">
            <div className="staped-report">
              <div className="staped-report__title">{report.title}</div>
              <div dangerouslySetInnerHTML={{ __html: report.html }} />
              <div className="staped-report__actions">
                <button className="staped-btn staped-btn--dark70" onClick={gerarPDF}>Gerar PDF</button>
                <span className="staped-report__meta">{new Date().toLocaleString()}</span>
                <span className="staped-chip staped-chip--ok">OK</span>
              </div>
            </div>
          </div>

          <aside className="staped-side no-print">
            <div className="staped-side__title">Referências deste relatório</div>

            <div className="staped-side__block">
              <div className="staped-side__subtitle">Pedidos ({contexto.pedidosList.length})</div>
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
              <div className="staped-side__subtitle">Pontos de Venda ({contexto.pdvs.length})</div>
              <ul className="staped-side__tags">
                {contexto.pdvs.map((n, i) => (<li key={i} className="staped-tag">{n}</li>))}
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

            {/* NOVO BLOCO: Totais por Sabor */}
            <div className="staped-side__block">
              <div className="staped-side__subtitle">Totais por Sabor</div>
              <ul className="staped-side__list">
                {contexto.totaisSabores.map((ts, i) => (
                  <li key={i} className="staped-side__row">
                    <span className="staped-side__row-name">{ts.sabor}</span>
                    <span className="staped-side__row-qty">{ts.qtd}</span>
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

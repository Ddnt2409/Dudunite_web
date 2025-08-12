// src/pages/StaPedActions.jsx
import React, { useState } from "react";
import {
  filtrarPorStatus,
  montarPlanejamento,
  montarListaCompras,
} from "../util/MemProd";

/*
Props:
pedidos: Array<{
  cidade: string;
  pdv: string;
  itens: Array<{ produto: string; qtd: number }>;
  sabores?: Record<string, Array<{ sabor: string; qtd: number }>>;
  statusEtapa: "Lançado" | "Alimentado" | "Produzido";
}>
*/

export default function StaPedActions({ pedidos = [] }) {
  const [relatorioTipo, setRelatorioTipo] = useState(null);
  const [relatorioDados, setRelatorioDados] = useState(null);

  function gerarPlanejamentoGeral() {
    const filtrados = filtrarPorStatus(pedidos, "PLAN_GERAL");
    const plan = montarPlanejamento(filtrados, "GERAL");
    const compras = montarListaCompras(filtrados, plan);
    setRelatorioTipo("Planejamento de Produção – Geral");
    setRelatorioDados({ plan, compras });
  }

  function gerarPlanejamentoTempoReal() {
    const filtrados = filtrarPorStatus(pedidos, "PLAN_TEMPO_REAL");
    const plan = montarPlanejamento(filtrados, "TEMPO_REAL");
    const compras = montarListaCompras(filtrados, plan);
    setRelatorioTipo("Planejamento de Produção – Tempo Real");
    setRelatorioDados({ plan, compras });
  }

  function gerarListaComprasGeral() {
    const filtrados = filtrarPorStatus(pedidos, "COMPRAS_GERAL");
    const plan = montarPlanejamento(filtrados, "GERAL");
    const compras = montarListaCompras(filtrados, plan);
    setRelatorioTipo("Lista de Compras – Geral");
    setRelatorioDados({ plan, compras });
  }

  function gerarListaComprasTempoReal() {
    const filtrados = filtrarPorStatus(pedidos, "COMPRAS_TEMPO_REAL");
    const plan = montarPlanejamento(filtrados, "TEMPO_REAL");
    const compras = montarListaCompras(filtrados, plan);
    setRelatorioTipo("Lista de Compras – Tempo Real");
    setRelatorioDados({ plan, compras });
  }

  return (
    <>
      {/* Botões */}
      <section className="staped-actions">
        <div className="staped-actions__grid">
          <button onClick={gerarPlanejamentoGeral} className="staped-btn staped-btn--dark70">
            Planejamento de Produção – Geral
          </button>

          <button onClick={gerarPlanejamentoTempoReal} className="staped-btn staped-btn--dark60">
            Planejamento de Produção – Tempo Real
          </button>

          <button onClick={gerarListaComprasGeral} className="staped-btn staped-btn--dark70">
            Lista de Compras – Geral
          </button>

          <button onClick={gerarListaComprasTempoReal} className="staped-btn staped-btn--dark60">
            Lista de Compras – Tempo Real
          </button>
        </div>
      </section>

      {/* Prévia */}
      {relatorioDados && (
        <section className="staped-report">
          <div className="staped-report__title">{relatorioTipo}</div>
          <pre className="staped-report__pre">
            {JSON.stringify(relatorioDados, null, 2)}
          </pre>
          <div className="staped-report__actions">
            <button
              className="staped-chip staped-chip--ok"
              onClick={() => { /* TODO: PDF */ }}
            >
              Gerar PDF
            </button>
            <button
              className="staped-chip"
              onClick={() => { setRelatorioTipo(null); setRelatorioDados(null); }}
            >
              Fechar
            </button>
          </div>
        </section>
      )}
    </>
  );
}

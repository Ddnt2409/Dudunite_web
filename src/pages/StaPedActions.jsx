// src/pages/StaPedActions.jsx
import React, { useState } from "react";
import {
  filtrarPorStatus,
  montarPlanejamento,
  montarListaCompras,
} from "../util/MemProd";

/*
Props:
- pedidos: Array<Pedido>
- semanaVazia: boolean
*/

export default function StaPedActions({ pedidos = [], semanaVazia = false }) {
  const [relatorioTipo, setRelatorioTipo] = useState(null);
  const [relatorioDados, setRelatorioDados] = useState(null);
  const [mensagemVazia, setMensagemVazia] = useState("");

  function abrirMensagemAmigavel(titulo) {
    setRelatorioDados(null);
    setRelatorioTipo(titulo);
    setMensagemVazia(
      "Nenhum dado disponível nesta semana. Volte após registrar pedidos."
    );
  }

  function gerarPlanejamentoGeral() {
    if (semanaVazia) return abrirMensagemAmigavel("Planejamento de Produção – Geral");
    const filtrados = filtrarPorStatus(pedidos, "PLAN_GERAL");
    const plan = montarPlanejamento(filtrados, "GERAL");
    const compras = montarListaCompras(filtrados, plan);
    setMensagemVazia("");
    setRelatorioTipo("Planejamento de Produção – Geral");
    setRelatorioDados({ plan, compras });
  }

  function gerarPlanejamentoTempoReal() {
    if (semanaVazia) return abrirMensagemAmigavel("Planejamento de Produção – Tempo Real");
    const filtrados = filtrarPorStatus(pedidos, "PLAN_TEMPO_REAL");
    const plan = montarPlanejamento(filtrados, "TEMPO_REAL");
    const compras = montarListaCompras(filtrados, plan);
    setMensagemVazia("");
    setRelatorioTipo("Planejamento de Produção – Tempo Real");
    setRelatorioDados({ plan, compras });
  }

  function gerarListaComprasGeral() {
    if (semanaVazia) return abrirMensagemAmigavel("Lista de Compras – Geral");
    const filtrados = filtrarPorStatus(pedidos, "COMPRAS_GERAL");
    const plan = montarPlanejamento(filtrados, "GERAL");
    const compras = montarListaCompras(filtrados, plan);
    setMensagemVazia("");
    setRelatorioTipo("Lista de Compras – Geral");
    setRelatorioDados({ plan, compras });
  }

  function gerarListaComprasTempoReal() {
    if (semanaVazia) return abrirMensagemAmigavel("Lista de Compras – Tempo Real");
    const filtrados = filtrarPorStatus(pedidos, "COMPRAS_TEMPO_REAL");
    const plan = montarPlanejamento(filtrados, "TEMPO_REAL");
    const compras = montarListaCompras(filtrados, plan);
    setMensagemVazia("");
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

      {/* Prévia (dados ou mensagem amigável) */}
      {(relatorioDados || mensagemVazia) && (
        <section className="staped-report">
          <div className="staped-report__title">{relatorioTipo}</div>

          {mensagemVazia ? (
            <div className="staped-empty-box">
              {mensagemVazia}
            </div>
          ) : (
            <pre className="staped-report__pre">
              {JSON.stringify(relatorioDados, null, 2)}
            </pre>
          )}

          <div className="staped-report__actions">
            {!mensagemVazia && (
              <button
                className="staped-chip staped-chip--ok"
                onClick={() => { /* TODO: PDF */ }}
              >
                Gerar PDF
              </button>
            )}
            <button
              className="staped-chip"
              onClick={() => {
                setRelatorioTipo(null);
                setRelatorioDados(null);
                setMensagemVazia("");
              }}
            >
              Fechar
            </button>
          </div>
        </section>
      )}
    </>
  );
}

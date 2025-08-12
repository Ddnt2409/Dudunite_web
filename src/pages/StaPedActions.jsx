// src/pages/StaPedActions.jsx
import React, { useRef, useState } from "react";
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

function tsString(d = new Date()) {
  const pad = (n) => String(n).padStart(2, "0");
  const yyyy = d.getFullYear();
  const mm = pad(d.getMonth() + 1);
  const dd = pad(d.getDate());
  const hh = pad(d.getHours());
  const mi = pad(d.getMinutes());
  const ss = pad(d.getSeconds());
  return `${yyyy}-${mm}-${dd}_${hh}-${mi}-${ss}`;
}

export default function StaPedActions({ pedidos = [], semanaVazia = false }) {
  const [relatorioTipo, setRelatorioTipo] = useState(null);
  const [relatorioDados, setRelatorioDados] = useState(null);
  const [mensagemVazia, setMensagemVazia] = useState("");
  const [geradoEm, setGeradoEm] = useState(null);

  const reportRef = useRef(null);

  function abrirMensagemAmigavel(titulo) {
    setRelatorioTipo(titulo);
    setRelatorioDados(null);
    setGeradoEm(new Date());
    setMensagemVazia("Nenhum dado disponível nesta semana. Volte após registrar pedidos.");
  }

  function gerar(tipoFiltro, titulo, modo) {
    if (semanaVazia) return abrirMensagemAmigavel(titulo);
    const filtrados = filtrarPorStatus(pedidos, tipoFiltro);
    const plan = montarPlanejamento(filtrados, modo);
    const compras = montarListaCompras(filtrados, plan);
    setMensagemVazia("");
    setRelatorioTipo(titulo);
    setRelatorioDados({ plan, compras });
    setGeradoEm(new Date());
  }

  function gerarPlanejamentoGeral() {
    gerar("PLAN_GERAL", "Planejamento de Produção – Geral", "GERAL");
  }
  function gerarPlanejamentoTempoReal() {
    gerar("PLAN_TEMPO_REAL", "Planejamento de Produção – Tempo Real", "TEMPO_REAL");
  }
  function gerarListaComprasGeral() {
    gerar("COMPRAS_GERAL", "Lista de Compras – Geral", "GERAL");
  }
  function gerarListaComprasTempoReal() {
    gerar("COMPRAS_TEMPO_REAL", "Lista de Compras – Tempo Real", "TEMPO_REAL");
  }

  // Gera PDF via print: muda temporariamente o título p/ virar nome do arquivo
  function handleGerarPDF() {
    const base = relatorioTipo || "Relatorio";
    const stamp = tsString(geradoEm || new Date());
    const oldTitle = document.title;
    document.title = `${base} - ${stamp}`;
    window.print();
    document.title = oldTitle;
  }

  return (
    <>
      {/* Botões (área compacta e rolável) */}
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
        <section className="staped-report print-area" ref={reportRef}>
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

          <div className="staped-report__meta">
            {geradoEm && (
              <span>
                Gerado em:&nbsp;
                {new Date(geradoEm).toLocaleString()}
              </span>
            )}
          </div>

          <div className="staped-report__actions">
            <button className="staped-chip staped-chip--ok" onClick={handleGerarPDF}>
              Gerar PDF
            </button>
            <button
              className="staped-chip"
              onClick={() => {
                setRelatorioTipo(null);
                setRelatorioDados(null);
                setMensagemVazia("");
                setGeradoEm(null);
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

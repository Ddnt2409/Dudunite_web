import React from "react";

/**
 * Rodapé padrão + botão flutuante “Voltar ao PCP”
 * Props:
 *  - onBack: () => void
 *  - pdvs?: string[]  (opcional – lista mostrada na faixa do rodapé)
 */
const DEFAULT_PDVS = [
  "Cruz","Pinheiros","Dourado","BMQ","CFC","Madre de Deus",
  "Saber Viver","Interativo","Exato Sede","Exato Anexo",
  "Society Show","Russas","Kaduh","Degusty","Bora Gastar","Salesianas"
];

export default function ERPFooter({ onBack, pdvs = DEFAULT_PDVS }) {
  return (
    <>
      <button
        type="button"
        className="btn-voltar-foot"
        onClick={onBack}
        aria-label="Voltar ao PCP"
      >
        ↩ Voltar ao PCP
      </button>

      <footer className="erp-footer" role="contentinfo">
        <div className="erp-footer-track">
          {pdvs.join(" • ")}
        </div>
      </footer>
    </>
  );
}

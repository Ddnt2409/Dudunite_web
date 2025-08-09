import React from "react";

/** Rodapé padrão Dudunitê — barra marrom fixa + botão flutuante “Voltar ao PCP” */
export default function ERPFooter({ onBack }) {
  return (
    <>
      {/* Botão flutuante acima do rodapé (como no PCP) */}
      <button type="button" className="btn-voltar-foot" onClick={onBack}>
        ↩ Voltar ao PCP
      </button>

      {/* Barra marrom fixa inferior com a “marquee” de PDVs */}
      <footer className="erp-footer">
        <div className="erp-footer-inner">
          <div className="marquee">
            • Cruz • Pinheiros • Dourado • BMQ • CFC • Madre de Deus • Saber
            Viver • Interativo • Exato Sede • Exato Anexo • Society Show •
            Russas • Kaduh • Degusty • Bora Gastar • Salesianas
          </div>
        </div>
      </footer>
    </>
  );
}

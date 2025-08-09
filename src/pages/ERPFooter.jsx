import React from "react";

/** Rodapé padrão (botão voltar + marquee de PDVs) */
export default function ERPFooter({ onBack }) {
  return (
    <footer className="alisab-footer">
      <button type="button" className="btn-voltar-foot" onClick={onBack}>
        ↩ Voltar ao PCP
      </button>

      <div className="marquee">
        • Cruz • Pinheiros • Dourado • BMQ • CFC • Madre de Deus • Saber Viver •
        Interativo • Exato Sede • Exato Anexo • Society Show • Russas • Kaduh •
        Degusty • Bora Gastar • Salesianas
      </div>
    </footer>
  );
}

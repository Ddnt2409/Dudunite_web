// src/pages/ERPFooter.jsx
import React from "react";

export default function ERPFooter({ onBack }) {
  return (
    <>
      {onBack && (
        <button className="btn-voltar-foot" onClick={onBack}>
          🔙 Voltar
        </button>
      )}

      <footer className="erp-footer">
        <div className="erp-footer-track">
          • Cruz • Pinheiros • Dourado • BMQ • CFC • Madre de Deus • Saber Viver •
          Interativo • Exato Sede • Exato Anexo • Society Show • Russas • Kaduh •
          Degusty • Bora Gastar • Salesianas • Céu Azul • Pequeno Príncipe •
          Tio Valter • Vera Cruz
        </div>
      </footer>
    </>
  );
}

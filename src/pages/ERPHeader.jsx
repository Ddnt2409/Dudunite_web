import React from "react";

/**
 * Cabeçalho padrão das telas PCP/ERP
 * Props:
 *  - title: string (ex.: "PCP – Alimentar Sabores")
 */
export default function ERPHeader({ title = "" }) {
  return (
    <header className="pcp-header">
      <div className="pcp-header-inner">
        <img
          src="/LogomarcaDDnt2025Vazado.png"
          alt="Dudunitê"
          className="pcp-logo"
        />
        <h1 className="pcp-title">{title}</h1>
        {/* Espaçador para centralizar o título no mobile */}
        <div className="pcp-logo-spacer" />
      </div>
    </header>
  );
}

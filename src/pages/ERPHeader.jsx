import React from "react";

/** Cabeçalho padrão Dudunitê — igual ao PCP (logo à esquerda e título centralizado) */
export default function ERPHeader({ title }) {
  return (
    <header className="pcp-header">
      <div className="pcp-header-inner">
        <img
          src="/LogomarcaDDnt2025Vazado.png"
          alt="Dudunitê"
          className="pcp-logo"
        />
        <h1 className="pcp-title">{title}</h1>
      </div>
    </header>
  );
}

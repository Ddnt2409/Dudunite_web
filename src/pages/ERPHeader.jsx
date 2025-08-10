// src/pages/ERPHeader.jsx
import React from "react";
import "./AliSab.css"; // usa as classes abaixo

export default function ERPHeader({ title = "PCP – Alimentar Sabores" }) {
  return (
    <header className="erp-header">
      <div className="erp-header__logo">
        <img src="/LogomarcaDDnt2025Vazado.png" alt="Dudunitê" />
      </div>

      <div className="erp-header__title">
        {title}
      </div>
    </header>
  );
}

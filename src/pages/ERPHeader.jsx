// src/pages/ERPHeader.jsx
import React from "react";

export default function ERPHeader({ title = "" }) {
  return (
    <header className="erp-header">
      {/* Logo “flutuante”: 180px e não aumenta a tarja */}
      <div className="erp-header__logo">
        <img src="/LogomarcaDDnt2025Vazado.png" alt="Dudunitê" />
      </div>

      {/* Título martelado no lado direito, 12px BOLD */}
      <div className="erp-header__title">{title}</div>
    </header>
  );
}

// src/pages/ERPHeader.jsx
export default function ERPHeader({ title }) {
  return (
    <header className="erp-header" role="banner">
      <div className="erp-header__inner">
        <div className="erp-header__logo">
          <img src="/LogomarcaDDnt2025Vazado.png" alt="Dudunitê" />
        </div>
        <h1 className="erp-header__title">{title}</h1>
      </div>
    </header>
  );
}

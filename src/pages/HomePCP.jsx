import React, { useState } from 'react';
import './HomePCP.css';

export default function HomePCP({ setTela }) {
  const [active, setActive] = useState('LanPed');

  function selecionar(screen) {
    setActive(screen);
    setTimeout(() => setTela(screen), 200);
  }

  return (
    <div className="homepcp-container">
      <header className="homepcp-header">
        <img src="/LogomarcaDDnt2025Vazado.png" alt="Logo Dudunitê" />
        <h1>PCP – Planejamento de Produção</h1>
      </header>

      <main className="homepcp-main">
        <button
          className={`botao-principal ${active==='LanPed'?'botao-ativo':'botao-inativo'}`}
          onClick={() => selecionar('LanPed')}
        >
          📝<br/>Lançar Pedido
        </button>

        <button
          className={`botao-principal ${active==='AlimSab'?'botao-ativo':'botao-inativo'}`}
          onClick={() => selecionar('AlimSab')}
        >
          🍫<br/>Alimentar Sabores
        </button>
      </main>

      <footer className="homepcp-footer">
        <marquee>
          Cruz • Pinheiros • Dourado • BMQ • CFC • Madre de Deus • …
        </marquee>
        <button className="botao-voltar" onClick={() => setTela('Home')}>
          🔙 Voltar ao ERP
        </button>
      </footer>
    </div>
  );
}

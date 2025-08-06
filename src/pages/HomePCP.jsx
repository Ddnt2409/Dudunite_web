import React from "react";
import "./HomeERP.css"; // reaproveita o mesmo CSS de botões, cabeçalho e rodapé

export default function HomePCP({ setTela }) {
  return (
    <div
      style={{
        backgroundImage: "url('/bg002.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* === HEADER === */}
      <header className="homeerp-header">
        <img
          src="/LogomarcaDDnt2025Vazado.png"
          alt="Logo Dudunitê"
          className="homeerp-logo"
        />
        <h1 className="homeerp-titulo">PCP – Planejamento de Produção</h1>
      </header>

      {/* === BOTÃO DE LANÇAR PEDIDO === */}
      <main>
        <div className="botoes-erp" style={{ justifyContent: "center" }}>
          <button
            className="botao-principal botao-ativo"
            onClick={() => setTela("LanPed")}
          >
            📝<br />
            Lançar Pedido
          </button>
        </div>
      </main>

      {/* === BOTÃO VOLTAR === */}
      <button
        className="botao-voltar"
        onClick={() => setTela("Home")}
        style={{ alignSelf: "center", margin: "1rem 0" }}
      >
        🔙 Voltar ao ERP
      </button>

      {/* === RODAPÉ === */}
      <footer>
        <marquee behavior="scroll" direction="left">
          • Pequeno Príncipe • Salesianas • Céu Azul • Russas • Bora Gastar • Kaduh •
          Society Show • Degusty • Tio Valter • Vera Cruz • Pinheiros • Dourado • BMQ •
          CFC • Madre de Deus • Saber Viver • Interativo • Exato Sede • Exato Anexo • Motivo •
          Jesus Salvador
        </marquee>
      </footer>
    </div>
  );
}

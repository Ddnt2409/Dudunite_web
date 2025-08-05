import React from "react";
import "./HomePCP.css";

const HomePCP = ({ voltar }) => {
  return (
    <div
      style={{
        backgroundImage: "url('/bg002.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-start",
        overflowY: "auto",
      }}
    >
      {/* === INÍCIO HEADER === */}
      <header
        style={{
          height: "100px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "0 1rem",
          backgroundColor: "rgba(255,255,255,0.5)",
          backdropFilter: "blur(6px)",
        }}
      >
        <img
          src="/LogomarcaDDnt2025Vazado.png"
          alt="Logo"
          style={{ width: "200px", marginTop: "2%" }}
        />
        <h1
          style={{
            fontSize: "2rem",
            fontWeight: "bold",
            color: "#8c3b1b",
            marginRight: "2ch",
          }}
        >
          PCP – Planejamento de Produção
        </h1>
      </header>
      {/* === FIM HEADER === */}

      {/* === INÍCIO CONTEÚDO PRINCIPAL === */}
      <main style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <div
          style={{
            flexGrow: 1,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            overflowX: "auto",
            scrollSnapType: "x mandatory",
            gap: "3rem",
            padding: "2rem 1rem 0",
            width: "100%",
          }}
        >
          {/* Botão 1 – Lançar Pedido */}
{/* Botão 1 – Lançar Pedido */}
<div
  style={{
    flex: "0 0 auto",
    scrollSnapAlign: "center",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  }}
>
  <button
    className="botao-principal botao-ativo"
    onClick={() => setTela("LanPed")}
  >
    📝
    <br />
    Lançar Pedido
  </button>
</div>

{/* Botão 2 – Alimentar Sabores */}
<div
  style={{
    flex: "0 0 auto",
    scrollSnapAlign: "center",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  }}
>
  <button
    className="botao-principal botao-ativo"
    onClick={() => setTela("AlimSab")}
  >
    🍫
    <br />
    Alimentar Sabores
  </button>
</div>

          {/* Botão 3 – Voltar */}
          <div
            style={{
              flex: "0 0 auto",
              scrollSnapAlign: "center",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <button
              className="botao-principal botao-inativo"
              onClick={voltar}
            >
              🔙
              <br />
              Voltar ao ERP
            </button>
          </div>
        </div>
      </main>
      {/* === FIM CONTEÚDO PRINCIPAL === */}

      {/* === INÍCIO RODAPÉ === */}
      <footer
        style={{
          backgroundColor: "rgba(140, 59, 27, 0.4)",
          color: "#ffffff",
          padding: "1rem",
          fontSize: "1.2rem",
          textAlign: "center",
          marginTop: "2rem",
        }}
      >
        <marquee behavior="scroll" direction="left">
          • Pequeno Príncipe • Salesianas • Céu Azul • Russas • Bora Gastar •
          Kaduh • Society Show • Degusty • Tio Valter • Vera Cruz • Pinheiros •
          Dourado • BMQ • CFC • Madre de Deus • Saber Viver • Interativo •
          Exato Sede • Exato Anexo • Sesi • Motivo • Jesus Salvador
        </marquee>
      </footer>
      {/* === FIM RODAPÉ === */}
    </div>
  );
};

export default HomePCP;

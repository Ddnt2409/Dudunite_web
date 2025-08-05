import React from "react";
import "./HomePCP.css";

const HomePCP = (props) => {
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
          Planejamento de Produção
        </h1>
      </header>
      {/* === FIM HEADER === */}

      {/* === INÍCIO CONTEÚDO PRINCIPAL === */}
      <main style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "3rem",
            marginTop: "4rem",
            flexWrap: "wrap",
          }}
        >
          <button
  className="botao-principal"
  onClick={() => {
    alert("Botão clicado");
    props.setTela("LanPed");
  }}
>
  📝
  <br />
  Lançar Pedido
</button>

          <button
            className="botao-principal"
            onClick={() => props.setTela("HomePCP")}
          >
            🍫
            <br />
            Alimentar Sabores
          </button>
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
          marginTop: "4rem",
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

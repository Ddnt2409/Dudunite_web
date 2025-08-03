import React, { useState } from "react";
import "./HomeERP.css";

const HomePCP = () => {
  const [zoomIndex, setZoomIndex] = useState(null);

  const botoes = [
    {
      nome: "Lançar Pedido",
      emoji: "📝",
      acao: () => {
        window.location.href = "/LancamentoPedido";
      },
    },
    {
      nome: "Alimentar Sabores",
      emoji: "🍫",
      acao: () => {
        window.location.href = "/AlimentarSabores";
      },
    },
  ];

  const handleClick = (index, acao) => {
    if (zoomIndex === index) {
      acao();
    } else {
      setZoomIndex(index);
    }
  };

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

      {/* === INÍCIO BOTÕES PRINCIPAIS === */}
      <main
        style={{
          flexGrow: 1,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          flexDirection: "column",
          gap: "3rem",
          paddingTop: "3rem",
        }}
      >
        <div
          style={{
            display: "flex",
            gap: "3rem",
            flexWrap: "wrap",
            justifyContent: "center",
          }}
        >
          {botoes.map((btn, index) => {
            const isZoomed = zoomIndex === index;
            return (
              <button
                key={index}
                className={`botao-principal ${isZoomed ? "botao-ativo" : "botao-inativo"}`}
                onClick={() => handleClick(index, btn.acao)}
              >
                {btn.emoji}
                <br />
                {btn.nome}
              </button>
            );
          })}
        </div>
      </main>
      {/* === FIM BOTÕES PRINCIPAIS === */}

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

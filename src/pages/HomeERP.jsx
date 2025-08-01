// === FN01 – Importações Gerais ===
import React, { useState } from "react";

// === FN02 – Componente Principal ===
const HomeERP = () => {
  const [tela, setTela] = useState("Home");

  const renderizarTela = () => {
    if (tela === "Producao") {
      return (
        <div style={{ padding: "2rem", textAlign: "center", color: "#8c3b1b" }}>
          <h2>PRODUÇÃO (PCP)</h2>
          <p>[Futura tela de Produção]</p>
          <button onClick={() => setTela("Home")}>Voltar</button>
        </div>
      );
    }

    if (tela === "Financeiro") {
      return (
        <div style={{ padding: "2rem", textAlign: "center", color: "#8c3b1b" }}>
          <h2>FINANCEIRO (FinFlux)</h2>
          <p>[Futura tela do Financeiro]</p>
          <button onClick={() => setTela("Home")}>Voltar</button>
        </div>
      );
    }

    if (tela === "Custos") {
      return (
        <div style={{ padding: "2rem", textAlign: "center", color: "#8c3b1b" }}>
          <h2>ANÁLISE DE CUSTOS</h2>
          <p>[Futura tela de Análise de Custos]</p>
          <button onClick={() => setTela("Home")}>Voltar</button>
        </div>
      );
    }

    return (
      <>
        {/* === INÍCIO RT00 – Home ERP === */}
        <div
          style={{
            backgroundImage: "url('/bg002.png')",
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
          }}
        >
          {/* === Cabeçalho AJUSTADO === */}
          <header
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              zIndex: 10,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              height: "140px",
              padding: "0 1rem",
              backgroundColor: "rgba(255, 255, 255, 0.5)",
              backdropFilter: "blur(6px)",
              WebkitBackdropFilter: "blur(6px)",
            }}
          >
            {/* === Logomarca com subida de 1.5% === */}
            <img
              src="/LogomarcaDDnt2025Vazado.png"
              alt="Logo Dudunitê"
              style={{
                width: "300px",
                height: "auto",
                marginTop: "8.5%", // antes 10%
              }}
            />
            <h1
              style={{
                color: "#8c3b1b",
                fontSize: "2.6rem",
                fontWeight: "bold",
                marginRight: "2ch",
              }}
            >
              ERP DUDUNITÊ
            </h1>
          </header>

          {/* === Bloco Central – Carrossel horizontal === */}
          <div
            style={{
              position: "absolute",
              top: "25%",
              width: "100%",
              overflowX: "auto",
              padding: "1rem 0",
            }}
          >
            <div
              style={{
                display: "flex",
                gap: "2rem",
                padding: "1rem",
                width: "max-content",
              }}
            >
              {[
                { label: "Produção (PCP)", action: () => setTela("Producao") },
                {
                  label: "Financeiro (FinFlux)",
                  action: () => setTela("Financeiro"),
                },
                {
                  label: "Análise de Custos",
                  action: () => setTela("Custos"),
                },
              ].map((btn, idx) => (
                <button
                  key={idx}
                  onClick={btn.action}
                  style={{
                    backgroundColor: "#8c3b1b",
                    color: "white",
                    width: "200px",
                    height: "200px", // quadrado
                    borderRadius: "1rem",
                    border: "none",
                    fontSize: "1.6rem",
                    fontWeight: "bold",
                    boxShadow: "6px 6px 12px rgba(0, 0, 0, 0.6)",
                    flexShrink: 0,
                  }}
                >
                  {btn.label}
                </button>
              ))}
            </div>
          </div>

          {/* === Rodapé com todos os pontos de venda === */}
          <footer
            style={{
              position: "absolute",
              bottom: "75px",
              width: "100%",
              backgroundColor: "rgba(140, 59, 27, 0.4)",
              color: "white",
              padding: "1.6rem",
              fontSize: "1.8rem",
              textAlign: "center",
            }}
          >
            <marquee behavior="scroll" direction="left">
              • Pequeno Príncipe • Salesianas • Céu Azul • Russas • Bora Gastar • Kaduh • Society Show • Degusty • Tio Valter • Vera Cruz • Pinheiros • Dourado • BMQ • CFC • Madre de Deus • Saber Viver • Interativo • Exato Sede • Exato Anexo • Sesi • Motivo • Jesus Salvador
            </marquee>
          </footer>
        </div>
        {/* === FIM RT00 === */}
      </>
    );
  };

  return renderizarTela();
};

export default HomeERP;

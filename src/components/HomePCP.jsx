// === FN01 – Importações Gerais ===
import React, { useState } from "react";

// === FN02 – Componente Principal: App ===
const App = () => {
  const [tela, setTela] = useState("Home");

  // === FN03 – Renderização por Tela ===
  const renderizarTela = () => {
    if (tela === "Lancamento") {
      return (
        <div style={{ padding: "2rem", textAlign: "center", color: "#8c3b1b" }}>
          <h2>LANÇAMENTO DE PEDIDO</h2>
          <p>[Futura tela de Lançamento]</p>
          <button onClick={() => setTela("Home")}>Voltar</button>
        </div>
      );
    }

    if (tela === "Complemento") {
      return (
        <div style={{ padding: "2rem", textAlign: "center", color: "#8c3b1b" }}>
          <h2>ALIMENTAR SABORES</h2>
          <p>[Futura tela de Complemento]</p>
          <button onClick={() => setTela("Home")}>Voltar</button>
        </div>
      );
    }

    return (
      <>
        {/* === INÍCIO RT00 – Home PCP === */}
        <div
          style={{
            backgroundImage: "url('/bg001.png')",
            backgroundSize: "cover",
            backgroundPosition: "center",
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            backgroundRepeat: "no-repeat",
          }}
        >
          <header
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "1rem",
              backgroundColor: "rgba(255, 255, 255, 0.4)",
              height: "4rem",
            }}
          >
            <img
              src="/LogomarcaDDnt2025Vazado.png"
              alt="Logo Dudunitê"
              style={{ width: "84px", height: "auto" }}
            />
            <h1 style={{ color: "#8c3b1b", fontSize: "1.2rem" }}>ERP DUDUNITÊ</h1>
          </header>

          <main style={{ padding: "1rem", textAlign: "center", marginTop: "6rem" }}>
            <h1 style={{ color: "white", fontSize: "2rem", fontWeight: "bold" }}>PCP</h1>
            <p style={{ marginBottom: "1.5rem", marginTop: "0.5rem", color: "#8c3b1b", fontWeight: "bold" }}>
              PLANEJAMENTO E CONTROLE DE PRODUÇÃO
            </p>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "1.5rem",
                alignItems: "center",
              }}
            >
              <button
                onClick={() => setTela("Lancamento")}
                style={{
                  backgroundColor: "#8c3b1b",
                  color: "white",
                  padding: "1rem 2rem",
                  borderRadius: "0.5rem",
                  border: "none",
                  fontSize: "1rem",
                  boxShadow: "6px 6px 12px rgba(0, 0, 0, 0.4)",
                }}
              >
                LANÇAR PEDIDO
              </button>
              <button
                onClick={() => setTela("Complemento")}
                style={{
                  backgroundColor: "#8c3b1b",
                  color: "white",
                  padding: "1rem 2rem",
                  borderRadius: "0.5rem",
                  border: "none",
                  fontSize: "1rem",
                  boxShadow: "6px 6px 12px rgba(0, 0, 0, 0.4)",
                }}
              >
                ALIMENTAR SABORES
              </button>
            </div>
          </main>

          <footer
            style={{
              backgroundColor: "rgba(140, 59, 27, 0.4)",
              color: "white",
              padding: "0.8rem",
              fontSize: "0.9rem",
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

// === FN99 – Exportação Principal ===
export default App;

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
              style={{ width: "117.6px", height: "auto" }} // 84 * 1.4 = +40%
            />
            <h1 style={{ color: "#8c3b1b", fontSize: "0.96rem" }}>ERP DUDUNITÊ</h1> {/* -20% */}
          </header>

          <main style={{ padding: "1rem", textAlign: "center", marginTop: "6rem" }}>
            <h1 style={{ color: "white", fontSize: "2rem", fontWeight: "bold" }}>PCP</h1>

            <div
              style={{
                margin: "0.5rem auto 1.5rem auto",
                backgroundColor: "rgba(255,255,255,0.4)",
                width: "fit-content",
                padding: "0.3rem 1rem",
                borderRadius: "0.4rem",
              }}
            >
              <p
                style={{
                  color: "#8c3b1b",
                  fontWeight: "bold",
                  fontSize: "0.8rem",
                  margin: 0,
                }}
              >
                PLANEJAMENTO E CONTROLE DE PRODUÇÃO
              </p>
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "1.5rem",
                alignItems: "center",
                marginTop: "-2rem", // sobe os botões 50% da altura deles (~4rem de altura → sobe 2rem)
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
                  boxShadow: "8px 8px 16px rgba(0, 0, 0, 0.4)", // +40% de sombra
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
                  boxShadow: "8px 8px 16px rgba(0, 0, 0, 0.4)", // +40% de sombra
                }}
              >
                ALIMENTAR SABORES
              </button>
              <button
                disabled
                style={{
                  backgroundColor: "#8c3b1b",
                  color: "white",
                  padding: "1rem 2rem",
                  borderRadius: "0.5rem",
                  border: "none",
                  fontSize: "1rem",
                  boxShadow: "8px 8px 16px rgba(0, 0, 0, 0.4)", // +40% de sombra
                  opacity: 0.7,
                }}
              >
                PCP
              </button>
            </div>
          </main>

          <footer
            style={{
              backgroundColor: "rgba(140, 59, 27, 0.4)",
              color: "white",
              padding: "0.8rem",
              fontSize: "0.9rem",
              marginTop: "1.6rem", // sobe o rodapé 1x altura (~1.6rem aprox)
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

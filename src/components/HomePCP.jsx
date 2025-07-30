// === FN01 – Importações Gerais ===
import React, { useState } from "react";

// === FN02 – Componente Principal ===
const HomePCP = () => {
  const [tela, setTela] = useState("Home");

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
          {/* === Cabeçalho === */}
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
              style={{ width: "112px", height: "auto" }}
            />
            <h1 style={{ color: "#8c3b1b", fontSize: "1.2rem" }}>ERP DUDUNITÊ</h1>
          </header>

          {/* === Corpo Principal === */}
          <main style={{ padding: "1rem", textAlign: "center", marginTop: "4rem" }}>
            <div
              style={{
                backgroundColor: "rgba(255, 255, 255, 0.4)",
                marginBottom: "2rem",
                marginTop: "2rem",
                display: "inline-block",
                padding: "0.6rem 1.2rem",
                borderRadius: "8px",
              }}
            >
              <h1
                style={{
                  color: "#8c3b1b",
                  fontSize: "2rem",
                  fontWeight: "bold",
                  margin: 0,
                }}
              >
                PCP
              </h1>
              <p
                style={{
                  color: "#8c3b1b",
                  fontWeight: "bold",
                  fontSize: "1rem",
                  marginTop: "0.3rem",
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
                  boxShadow: "6px 6px 12px rgba(0, 0, 0, 0.6)",
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
                  boxShadow: "6px 6px 12px rgba(0, 0, 0, 0.6)",
                }}
              >
                ALIMENTAR SABORES
              </button>
            </div>
          </main>

          {/* === Rodapé === */}
          <footer
            style={{
              backgroundColor: "rgba(140, 59, 27, 0.4)",
              color: "white",
              padding: "0.8rem",
              fontSize: "0.9rem",
              marginTop: "3rem",
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

// === Exportação ===
export default HomePCP;

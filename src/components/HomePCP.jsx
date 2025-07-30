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
            backgroundImage: "url('/bg001.png')", // Caminho correto para o BG
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
              backgroundColor: "rgba(255, 255, 255, 0.4)", // 40% translucidez
              height: "4rem",
            }}
          >
            <img
              src="/LogomarcaDDnt2025Vazado.png"
              alt="Logo Dudunitê"
              style={{ width: "117px", height: "auto" }} // 40% aumento na logomarca
            />
            <h1 style={{ color: "#8c3b1b", fontSize: "1.2rem" }}>ERP DUDUNITÊ</h1>
          </header>

          <main
            style={{
              flexGrow: 1,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              gap: "1.5rem",
              padding: "1rem",
            }}
          >
            <button
              disabled
              style={{
                backgroundColor: "#8c3b1b",
                color: "white",
                padding: "0.85rem 2rem",
                borderRadius: "0.5rem",
                border: "none",
                fontSize: "1.5rem",
                fontWeight: "bold",
                boxShadow: "6px 6px 12px rgba(0, 0, 0, 0.4)",
                marginBottom: "0.7rem",
              }}
            >
              PCP
            </button>

            <div
              style={{
                backgroundColor: "rgba(255, 255, 255, 0.4)",
                padding: "0.3rem 1.2rem",
                color: "#8c3b1b",
                fontWeight: "bold",
                fontSize: "1rem",
                marginTop: "0.3rem",
                width: "auto",
              }}
            >
              PLANEJAMENTO E CONTROLE DE PRODUÇÃO
            </div>
          </main>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "1.5rem",
              alignItems: "center",
              marginTop: "-0.2rem",
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

          <footer
            style={{
              backgroundColor: "rgba(140, 59, 27, 0.4)", // 40% translucidez no rodapé
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

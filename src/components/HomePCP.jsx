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
          {/* === Cabeçalho Translúcido === */}
          <header
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "1rem",
              backgroundColor: "rgba(255, 255, 255, 0.4)", // 40%
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
            {/* === Botão PCP (Desabilitado) === */}
            <button
              style={{
                backgroundColor: "#8c3b1b",
                color: "white",
                padding: "1rem 2rem",
                borderRadius: "0.5rem",
                border: "none",
                fontSize: "2.25rem", // 50% maior que 1.5rem
                marginBottom: "0.5rem",
                boxShadow: "6px 6px 12px rgba(0, 0, 0, 0.6)",
              }}
              disabled
            >
              PCP
            </button>

            {/* === Texto Planejamento e Controle === */}
            <div
              style={{
                backgroundColor: "rgba(255, 255, 255, 0.4)",
                margin: "0 auto 1.5rem auto",
                padding: "0.4rem 1rem",
                borderRadius: "8px",
                maxWidth: "95%", // Aumentado
                width: "95%",
              }}
            >
              <p
                style={{
                  color: "#8c3b1b",
                  fontWeight: "bold",
                  fontSize: "1rem",
                  margin: 0,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  textTransform: "capitalize", // Apenas primeiras letras maiúsculas
                }}
              >
                Planejamento e controle de produção
              </p>
            </div>

            {/* === Botões === */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "1rem",
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
                  fontSize: "1.5rem",
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
                  fontSize: "1.5rem",
                  boxShadow: "6px 6px 12px rgba(0, 0, 0, 0.6)",
                }}
              >
                ALIMENTAR SABORES
              </button>
            </div>
          </main>

          {/* === Rodapé Subido === */}
          <footer
            style={{
              backgroundColor: "rgba(140, 59, 27, 0.4)",
              color: "white",
              padding: "0.8rem",
              fontSize: "0.9rem",
              marginTop: "-0.8rem", // sobe a própria altura
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

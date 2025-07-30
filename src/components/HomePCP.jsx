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
            backgroundRepeat: "no-repeat",
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
          }}
        >
          {/* === Cabeçalho (reduzido 30%) === */}
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
              padding: "0.7rem", // reduzido
              backgroundColor: "rgba(255, 255, 255, 0.5)",
              backdropFilter: "blur(6px)",
              WebkitBackdropFilter: "blur(6px)",
            }}
          >
            <img
              src="/LogomarcaDDnt2025Vazado.png"
              alt="Logo Dudunitê"
              style={{ width: "96px", height: "auto" }} // menor também
            />
            <h1 style={{ color: "#8c3b1b", fontSize: "1rem" }}>ERP DUDUNITÊ</h1>
          </header>

          {/* === Bloco Central (subido 20%) === */}
          <div
            style={{
              position: "absolute",
              top: "15%", // estava 25%
              width: "100%",
              textAlign: "center",
              padding: "1rem",
            }}
          >
            {/* === Botão PCP === */}
            <button
              style={{
                backgroundColor: "#8c3b1b",
                color: "white",
                padding: "0.8rem 2rem",
                borderRadius: "0.5rem",
                border: "none",
                fontSize: "2.25rem",
                marginBottom: "0.3rem",
                boxShadow: "6px 6px 12px rgba(0, 0, 0, 0.6)",
              }}
              disabled
            >
              PCP
            </button>

            {/* === Subtítulo === */}
            <div
              style={{
                backgroundColor: "rgba(255, 255, 255, 0.6)",
                margin: "0 auto 1.5rem auto",
                padding: "0.4rem 1rem",
                borderRadius: "8px",
                maxWidth: "95%",
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
                  textTransform: "capitalize",
                }}
              >
                Planejamento e Controle de Produção
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
          </div>

          {/* === Rodapé (subido 50%) === */}
          <footer
            style={{
              position: "absolute",
              bottom: "50px", // subido 50% em relação ao rodapé colado
              width: "100%",
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

export default HomePCP;

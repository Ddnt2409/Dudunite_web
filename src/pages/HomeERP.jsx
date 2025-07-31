// src/pages/HomeERP.jsx

import React, { useState } from "react";

// === FN02 – Componente Principal ===
const HomeERP = () => {
  const [tela, setTela] = useState("Home");

  const renderizarTela = () => {
    return (
      <>
        {/* === INÍCIO RT00 – Home ERP === */}
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
          {/* === Cabeçalho === */}
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
              height: "70px",
              padding: "0 0.5rem",
              backgroundColor: "rgba(255, 255, 255, 0.5)",
              backdropFilter: "blur(6px)",
              WebkitBackdropFilter: "blur(6px)",
            }}
          >
            <img
              src="/LogomarcaDDnt2025Vazado.png"
              alt="Logo Dudunitê"
              style={{ width: "100px", height: "auto" }}
            />
            <h1 style={{ color: "#8c3b1b", fontSize: "0.85rem" }}>ERP DUDUNITÊ</h1>
          </header>

          {/* === Bloco Central === */}
          <div
            style={{
              position: "absolute",
              top: "15%",
              width: "100%",
              textAlign: "center",
              padding: "1rem",
            }}
          >
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
              ERP
            </button>

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
                Sistema de Gestão Dudunitê
              </p>
            </div>

            {/* === Botões macrogrupos === */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "1rem",
                alignItems: "center",
              }}
            >
              <button
                onClick={() => setTela("HomePCP")}
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
                Produção
              </button>

              <button
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
                Financeiro
              </button>

              <button
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
                Resultados
              </button>
            </div>
          </div>

          {/* === Rodapé === */}
          <footer
            style={{
              position: "absolute",
              bottom: "50px",
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

export default HomeERP;

// === INÍCIO TELA PCP – Ajustada com base nas instruções do usuário ===
import React from "react";

const TelaPCP = () => {
  const listaEscolas = [
    "Degusty", "Tio Valter", "Vera Cruz", "Pinheiros", "Dourado",
    "BMQ", "CFC", "Madre de Deus", "Saber Viver", "Pequeno Príncipe",
    "Salesianas", "Céu Azul", "Russas", "Bora Gastar", "Kaduh",
    "Society Show", "Interativo", "Exato Sede", "Exato Anexo",
    "Sesi", "Motivo", "Jesus Salvador"
  ];

  return (
    <div
      style={{
        backgroundImage: "url('/backPCP.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        minHeight: "100vh",
        fontFamily: "sans-serif",
        position: "relative",
      }}
    >
      {/* === INÍCIO CABEÇALHO === */}
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "20px",
          backgroundColor: "rgba(255, 245, 236, 0.5)", // translúcido
          backdropFilter: "blur(8px)",
        }}
      >
        <img src="/LogomarcaDDnt2025Vazado.png" alt="Logomarca" style={{ height: "40px" }} />
        <h2 style={{ margin: 0, color: "#8c3b1b" }}>ERP DUDUNITÊ</h2>
      </header>
      {/* === FIM CABEÇALHO === */}

      {/* === INÍCIO CONTEÚDO PRINCIPAL === */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "80vh",
          gap: "20px",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <button
            style={{
              backgroundColor: "#8c3b1b",
              color: "white",
              padding: "14px 40px",
              fontSize: "26px",
              fontWeight: "bold",
              border: "none",
              borderRadius: "10px",
              marginBottom: "5px",
              boxShadow: "2px 2px 5px rgba(0,0,0,0.3)",
            }}
          >
            PCP
          </button>
          <div
            style={{
              backgroundColor: "rgba(255, 255, 255, 0.6)",
              color: "#8c3b1b",
              fontWeight: "bold",
              padding: "4px 16px",
              borderRadius: "8px",
              marginTop: "5px",
              fontSize: "16px",
              maxWidth: "260px",
              marginLeft: "auto",
              marginRight: "auto",
            }}
          >
            Planejamento E Controle De Produção
          </div>
        </div>

        <button
          style={{
            backgroundColor: "#8c3b1b",
            color: "white",
            padding: "14px 50px",
            fontSize: "20px",
            border: "none",
            borderRadius: "10px",
            boxShadow: "2px 2px 5px rgba(0,0,0,0.3)",
          }}
        >
          LANÇAR PEDIDO
        </button>

        <button
          style={{
            backgroundColor: "#8c3b1b",
            color: "white",
            padding: "14px 30px",
            fontSize: "20px",
            border: "none",
            borderRadius: "10px",
            boxShadow: "2px 2px 5px rgba(0,0,0,0.3)",
          }}
        >
          ALIMENTAR SABORES
        </button>
      </div>
      {/* === FIM CONTEÚDO PRINCIPAL === */}

      {/* === INÍCIO RODAPÉ – Status em tempo real === */}
      <footer
        style={{
          position: "fixed",
          bottom: 0,
          width: "100%",
          backgroundColor: "rgba(255, 245, 236, 0.8)",
          color: "#8c3b1b",
          padding: "10px",
          textAlign: "center",
          fontSize: "14px",
          whiteSpace: "nowrap",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            display: "inline-block",
            animation: "scroll 20s linear infinite",
          }}
        >
          {listaEscolas.join(" • ")}
        </div>
        <style>
          {`
            @keyframes scroll {
              0% { transform: translateX(100%); }
              100% { transform: translateX(-100%); }
            }
          `}
        </style>
      </footer>
      {/* === FIM RODAPÉ === */}
    </div>
  );
};

export default TelaPCP;
// === FIM TELA PCP ===

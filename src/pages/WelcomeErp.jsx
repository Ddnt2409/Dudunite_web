import React from "react";

/**
 * WelcomeERP.jsx – Tela de Boas‑Vindas do ERP Dudunitê
 * Animação estilo desenho animado (squash & stretch):
 * 1) Logomarca sobe, "bate" no topo (achatando),
 * 2) estica e desce, 3) repousa no centro.
 * Em seguida, título e botão aparecem com fade‑in.
 *
 * Dependências: nenhuma externa. (Somente React)
 * Tailwind NÃO é obrigatório. Estilos estão embutidos abaixo.
 *
 * Uso esperado no App.jsx:
 *   <WelcomeERP onEnter={() => setTela("HomeERP")} />
 * e renderizar esta tela ANTES do HomeERP.
 */

const LOGO_SRC = "/LogomarcaDDnt2025Vazado.png"; // coloque a arte em /public

export default function WelcomeERP({ onEnter }) {
  const handleEnter = () => {
    if (typeof onEnter === "function") onEnter();
  };

  return (
    <div style={styles.root}>
      {/* === INÍCIO RT98 – Tela de Boas‑Vindas (WelcomeERP) === */}
      <style>{css}</style>

      <div className="wel-stage" style={styles.stage}>
        {/* LOGO com animação squash & stretch */}
        <img
          src={LOGO_SRC}
          alt="Logomarca Dudunitê"
          className="wel-logo"
          style={styles.logo}
        />

        {/* Bloco de texto: título + botão (aparecem após a animação da logo) */}
        <div className="wel-copy" style={styles.copy}>
          <h1 className="wel-title" style={styles.title}>
            Bem‑vindo ao ERP Dudunitê
          </h1>

          <button
            className="wel-cta"
            style={styles.cta}
            onClick={handleEnter}
            aria-label="Ir para o HomeERP"
          >
            Ir para o HomeERP
          </button>
        </div>
      </div>
      {/* === FIM RT98 === */}
    </div>
  );
}

// ------------------------ Estilos inline ------------------------
const TERRACOTA = "#8c3b1b";
const CREME = "#fff5ec";

const styles = {
  root: {
    minHeight: "100dvh",
    width: "100%",
    margin: 0,
    background: `radial-gradient(1200px 600px at 50% 20%, ${CREME} 0%, #fde9d9 60%, #f9dcc8 100%)`,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  stage: {
    position: "relative",
    width: "min(92vw, 720px)",
    height: "min(92vh, 720px)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
  },
  logo: {
    width: "min(62vw, 360px)",
    height: "auto",
    filter: "drop-shadow(0 20px 30px rgba(0,0,0,.15))",
    willChange: "transform",
    animation: "logoEntrance 1650ms cubic-bezier(.22,1,.36,1) 120ms both",
  },
  copy: {
    textAlign: "center",
    marginTop: 24,
    opacity: 0,
    animation: "copyFade 680ms ease-out 1700ms both",
  },
  title: {
    fontSize: "clamp(20px, 4.5vw, 36px)",
    lineHeight: 1.1,
    color: TERRACOTA,
    fontWeight: 800,
    letterSpacing: ".2px",
    margin: 0,
  },
  cta: {
    marginTop: 16,
    padding: "12px 20px",
    fontSize: "clamp(14px, 3.6vw, 16px)",
    fontWeight: 700,
    color: "#fff",
    backgroundColor: TERRACOTA,
    border: "none",
    borderRadius: 12,
    boxShadow: "0 8px 16px rgba(140,59,27,.25)",
    cursor: "pointer",
    transform: "translateZ(0)",
    transition: "transform 160ms ease, box-shadow 160ms ease, background-color 160ms ease",
  },
};

// ------------------------ CSS em string (keyframes) ------------------------
const css = `
  /* A cena central mantém logo e cópia centralizados */
  .wel-stage { overflow: hidden; }

  /* A LOGO executa uma sequência de keyframes simulando batida no topo e 
     squash & stretch (estilo desenho animado). */
  @keyframes logoEntrance {
    0% { transform: translateY(80vh) scale(1,1) rotate(0deg); }
    36% { transform: translateY(-44vh) scale(1,1); } /* chega ao topo */
    42% { transform: translateY(-44vh) scale(1.22,.65); } /* squash */
    58% { transform: translateY(0) scale(.88,1.18); } /* stretch descendo */
    72% { transform: translateY(-6vh) scale(1.06,.96); } /* 1º quique */
    86% { transform: translateY(0) scale(.98,1.02); }  /* assenta */
    100% { transform: translateY(0) scale(1,1); }
  }

  @keyframes copyFade {
    from { opacity: 0; transform: translateY(10px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  /* Interações do botão */
  .wel-cta:focus { outline: 3px solid rgba(140,59,27,.35); outline-offset: 2px; }
  .wel-cta:hover { transform: translateY(-1px); box-shadow: 0 10px 18px rgba(140,59,27,.28); }
  .wel-cta:active { transform: translateY(0); box-shadow: 0 6px 12px rgba(140,59,27,.22); }

  /* Acessibilidade: reduz movimento se o usuário preferir */
  @media (prefers-reduced-motion: reduce) {
    .wel-logo { animation: none !important; }
    .wel-copy { animation: none !important; opacity: 1 !important; }
  }
`;

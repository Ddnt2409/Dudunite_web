import React, { useEffect, useRef, useState } from "react";

const HomeERP = () => {
  const [tela, setTela] = useState("Home");
  const carrosselRef = useRef(null);
  const [focusIndex, setFocusIndex] = useState(1);

  const botoes = [
    { label: "Produção (PCP)", action: () => setTela("Producao") },
    { label: "Financeiro (FinFlux)", action: () => setTela("Financeiro") },
    { label: "Análise de Custos", action: () => setTela("Custos") },
  ];

  // === FN – Detectar botão mais central com base no centro da tela
  useEffect(() => {
    const container = carrosselRef.current;
    if (!container) return;

    const handleScroll = () => {
      const buttons = container.querySelectorAll(".carousel-button");
      const containerRect = container.getBoundingClientRect();
      const centerX = containerRect.left + containerRect.width / 2;

      let closestIdx = 0;
      let minDistance = Infinity;

      buttons.forEach((btn, idx) => {
        const rect = btn.getBoundingClientRect();
        const btnCenterX = rect.left + rect.width / 2;
        const distance = Math.abs(centerX - btnCenterX);

        if (distance < minDistance) {
          minDistance = distance;
          closestIdx = idx;
        }
      });

      setFocusIndex(closestIdx);

      buttons.forEach((btn, idx) => {
        let scale = 1;
        if (idx === closestIdx) {
          scale = 2.0; // botão central 100%
        } else {
          scale = 1.2; // laterais 20%
        }
        btn.style.transform = `scale(${scale})`;
        btn.style.transition = "transform 0.3s ease";
        btn.style.zIndex = idx === closestIdx ? 2 : 1;
      });
    };

    container.addEventListener("scroll", handleScroll);
    handleScroll();

    return () => {
      container.removeEventListener("scroll", handleScroll);
    };
  }, []);

  // === FN – Ao voltar para tela inicial, centralizar botão do meio
  useEffect(() => {
    if (tela === "Home" && carrosselRef.current) {
      const centralBtn = carrosselRef.current.querySelectorAll(".carousel-button")[1];
      if (centralBtn) {
        const container = carrosselRef.current;
        const scrollLeft =
          centralBtn.offsetLeft -
          container.offsetWidth / 2 +
          centralBtn.offsetWidth / 2;

        container.scrollTo({
          left: scrollLeft,
          behavior: "smooth",
        });
      }
    }
  }, [tela]);

  // === FN – Render principal
  const renderizarTela = () => {
    if (tela === "Producao") return <Tela titulo="PRODUÇÃO (PCP)" />;
    if (tela === "Financeiro") return <Tela titulo="FINANCEIRO (FinFlux)" />;
    if (tela === "Custos") return <Tela titulo="ANÁLISE DE CUSTOS" />;

    return (
      <>
        {/* === INÍCIO RT00 – Tela Inicial com Carrossel === */}
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
            position: "relative",
          }}
        >
          {/* Cabeçalho */}
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
            <img
              src="/LogomarcaDDnt2025Vazado.png"
              alt="Logo Dudunitê"
              style={{ width: "300px", marginTop: "8.5%" }}
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

          {/* Carrossel */}
          <div
            ref={carrosselRef}
            style={{
              position: "absolute",
              top: "25%",
              width: "100%",
              overflowX: "auto",
              padding: "2rem 0",
              display: "flex",
              justifyContent: "center",
              scrollSnapType: "x mandatory",
              touchAction: "pan-x",
              WebkitOverflowScrolling: "touch",
            }}
          >
            <div
              style={{
                display: "flex",
                gap: "2rem",
                padding: "1rem",
                minWidth: "max-content",
              }}
            >
              {botoes.map((btn, idx) => (
                <button
                  key={idx}
                  className="carousel-button"
                  onClick={btn.action}
                  style={{
                    backgroundColor: focusIndex === idx ? "#8c3b1b" : "#dcbba3",
                    color: "white",
                    width: "200px",
                    height: "200px",
                    borderRadius: "1rem",
                    border: "none",
                    fontSize: "1.5rem",
                    fontWeight: "bold",
                    boxShadow: "6px 6px 12px rgba(0, 0, 0, 0.5)",
                    flexShrink: 0,
                    transition: "background-color 0.3s",
                  }}
                >
                  {btn.label}
                </button>
              ))}
            </div>
          </div>

          {/* Rodapé */}
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
              • Pequeno Príncipe • Salesianas • Céu Azul • Russas • Bora Gastar
              • Kaduh • Society Show • Degusty • Tio Valter • Vera Cruz •
              Pinheiros • Dourado • BMQ • CFC • Madre de Deus • Saber Viver •
              Interativo • Exato Sede • Exato Anexo • Sesi • Motivo • Jesus
              Salvador
            </marquee>
          </footer>
        </div>
        {/* === FIM RT00 === */}
      </>
    );
  };

  // === FN – Tela de placeholder
  const Tela = ({ titulo }) => (
    <div style={{ padding: "2rem", textAlign: "center", color: "#8c3b1b" }}>
      <h2>{titulo}</h2>
      <p>[Futura tela funcional]</p>
      <button onClick={() => setTela("Home")}>Voltar</button>
    </div>
  );

  return renderizarTela();
};

export default HomeERP;

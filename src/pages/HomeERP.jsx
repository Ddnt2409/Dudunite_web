import React, { useEffect, useRef, useState } from "react";

const HomeERP = () => {
  const [tela, setTela] = useState("Home");
  const carrosselRef = useRef(null);
  const [focusIndex, setFocusIndex] = useState(1); // começa com botão central em foco

  const botoes = [
    { label: "Produção (PCP)", action: () => setTela("Producao") },
    { label: "Financeiro (FinFlux)", action: () => setTela("Financeiro") },
    { label: "Análise de Custos", action: () => setTela("Custos") },
  ];

  // === FN – Aplica Zoom e Cor ao Botão Central ===
  useEffect(() => {
    const container = carrosselRef.current;
    if (!container) return;

    const handleScroll = () => {
      const buttons = container.querySelectorAll(".carousel-button");
      const containerCenter = container.scrollLeft + container.offsetWidth / 2;

      let minDist = Infinity;
      let newFocus = 0;

      buttons.forEach((btn, idx) => {
        const btnCenter =
          btn.offsetLeft + btn.offsetWidth / 2 - container.scrollLeft;
        const distance = Math.abs(container.offsetWidth / 2 - btnCenter);

        if (distance < minDist) {
          minDist = distance;
          newFocus = idx;
        }

        const scale = Math.max(1, 1.2 - distance / 400);
        btn.style.transform = `scale(${scale})`;
        btn.style.transition = "transform 0.3s ease-out";
        btn.style.zIndex = scale > 1.05 ? 2 : 1;
      });

      setFocusIndex(newFocus);
    };

    container.addEventListener("scroll", handleScroll);
    handleScroll(); // aplica ao abrir

    return () => {
      container.removeEventListener("scroll", handleScroll);
    };
  }, []);

  // === FN – Recentra botão central ao voltar ===
  useEffect(() => {
    if (tela === "Home" && carrosselRef.current) {
      const centralBtn = carrosselRef.current.querySelectorAll(
        ".carousel-button"
      )[1];
      if (centralBtn) {
        const container = carrosselRef.current;
        container.scrollTo({
          left:
            centralBtn.offsetLeft -
            container.offsetWidth / 2 +
            centralBtn.offsetWidth / 2,
          behavior: "smooth",
        });
      }
    }
  }, [tela]);

  // === FN – Tela Inicial ===
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

          {/* Carrossel com Movimento Real */}
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
                    backgroundColor:
                      focusIndex === idx ? "#8c3b1b" : "#dcbba3", // foco: terracota escuro, fora: bege claro
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

          {/* Rodapé com PDVs */}
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

  // === FN – Tela Intermediária ===
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

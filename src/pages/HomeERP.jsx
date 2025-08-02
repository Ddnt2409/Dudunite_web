// === INÍCIO HomeERP.jsx ===
import React, { useRef, useState, useEffect } from "react";
import HomePCP from "./HomePCP";
import "../styles/HomeERP.css"; // Certifique-se de que o caminho está correto

const HomeERP = () => {
  const [tela, setTela] = useState("Home");
  const [focusIndex, setFocusIndex] = useState(1);
  const carrosselRef = useRef(null);

  const botoes = [
    {
      label: "Produção (PCP)",
      action: () => setTela("PCP"),
      dropdown: [{ nome: "Ir para Produção", acao: () => setTela("PCP") }],
    },
    {
      label: "Financeiro (FinFlux)",
      action: () => {},
      dropdown: [
        { nome: "Contas a Receber", acao: () => alert("Em breve") },
        { nome: "Contas a Pagar", acao: () => alert("Em breve") },
        { nome: "Fluxo de Caixa", acao: () => alert("Em breve") },
      ],
    },
    {
      label: "Análise de Custos",
      action: () => {},
      dropdown: [
        { nome: "Custos por Produto", acao: () => alert("Em breve") },
        { nome: "Custos Fixos", acao: () => alert("Em breve") },
        { nome: "Custos Variáveis", acao: () => alert("Em breve") },
      ],
    },
  ];

  useEffect(() => {
    const container = carrosselRef.current;
    if (!container) return;

    const handleScroll = () => {
      const buttons = container.querySelectorAll(".botao-wrapper");
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
    };

    container.addEventListener("scroll", handleScroll);
    handleScroll();
    return () => container.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (tela === "Home" && carrosselRef.current) {
      const centralBtn = carrosselRef.current.querySelectorAll(".botao-wrapper")[1];
      if (centralBtn) {
        const container = carrosselRef.current;
        const scrollLeft =
          centralBtn.offsetLeft -
          container.offsetWidth / 2 +
          centralBtn.offsetWidth / 2;

        container.scrollTo({ left: scrollLeft, behavior: "smooth" });
      }
    }
  }, [tela]);

  if (tela === "PCP") {
    return (
      <div style={{ animation: "fadein 0.8s ease-in-out" }}>
        <HomePCP />
      </div>
    );
  }

  return (
    <div className="fundo-home">
      {/* Cabeçalho */}
      <header className="cabecalho">
        <img
          src="/LogomarcaDDnt2025Vazado.png"
          alt="Logo Dudunitê"
          className="logo-home"
        />
        <h1 className="titulo-erp"><strong>ERP DUDUNITÊ</strong></h1>
      </header>

      {/* Carrossel */}
      <div className="carrossel" ref={carrosselRef}>
        <div className="carrossel-interno">
          {botoes.map((btn, idx) => {
            const isCentral = idx === focusIndex;
            const wrapperClass = isCentral ? "central" : "lateral";

            return (
              <div className={`botao-wrapper ${wrapperClass}`} key={idx}>
                <button className="botao" onClick={btn.action}>
                  {btn.label}
                </button>

                {isCentral && (
                  <div className="bloco-opcoes">
                    {btn.dropdown.map((item, i) => (
                      <button key={i} className="botao-interno" onClick={item.acao}>
                        {item.nome}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Rodapé */}
      <footer className="rodape">
        <marquee behavior="scroll" direction="left">
          • Pequeno Príncipe • Salesianas • Céu Azul • Russas • Bora Gastar • Kaduh •
          Society Show • Degusty • Tio Valter • Vera Cruz • Pinheiros • Dourado •
          BMQ • CFC • Madre de Deus • Saber Viver • Interativo • Exato Sede •
          Exato Anexo • Sesi • Motivo • Jesus Salvador
        </marquee>
      </footer>
    </div>
  );
};

export default HomeERP;
// === FIM HomeERP.jsx ===

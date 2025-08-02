import React, { useEffect, useRef, useState } from "react";
import HomePCP from "./HomePCP";
import "./HomeERP.css";

const HomeERP = () => {
  const [tela, setTela] = useState("Home");
  const carrosselRef = useRef(null);
  const [focusIndex, setFocusIndex] = useState(1);

  const botoes = [
    {
      label: "Produção (PCP)",
      action: () => setTela("PCP"),
      dropdown: [
        { nome: "Ir para Produção", acao: () => {} },
      ],
    },
    {
      label: "Financeiro (FinFlux)",
      action: () => {},
      dropdown: [
        { nome: "Contas a Receber", acao: () => {} },
        { nome: "Contas a Pagar", acao: () => {} },
        { nome: "Fluxo de Caixa", acao: () => {} },
      ],
    },
    {
      label: "Análise de Custos",
      action: () => {},
      dropdown: [
        { nome: "Custos por Produto", acao: () => {} },
        { nome: "Custos Fixos", acao: () => {} },
        { nome: "Custos Variáveis", acao: () => {} },
      ],
    },
  ];

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
    };

    container.addEventListener("scroll", handleScroll);
    handleScroll();

    return () => {
      container.removeEventListener("scroll", handleScroll);
    };
  }, []);

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

  const renderizarTela = () => {
    if (tela === "PCP") {
      return (
        <div className="tela-fade">
          <HomePCP />
        </div>
      );
    }

    return (
      <>
        {/* === INÍCIO RT00 – Tela Inicial ERP === */}
        <div className="fundo-home">
          {/* Cabeçalho */}
          <header className="cabecalho">
            <img
              src="/LogomarcaDDnt2025Vazado.png"
              alt="Logo Dudunitê"
              className="logo-home"
            />
            <h1 className="titulo-erp">
              <strong>ERP DUDUNITÊ</strong>
            </h1>
          </header>

          {/* Carrossel */}
          <div ref={carrosselRef} className="carrossel">
            <div className="carrossel-interno">
              {botoes.map((btn, idx) => {
                const isCentral = idx === focusIndex;
                return (
                  <div
                    key={idx}
                    className={`botao-wrapper ${isCentral ? "central" : "lateral"}`}
                  >
                    <button
                      className="botao carousel-button"
                      onClick={btn.action}
                    >
                      {btn.label}
                    </button>

                    {isCentral && (
                      <div className="bloco-opcoes">
                        {btn.dropdown.map((item, i) => (
                          <button
                            key={i}
                            onClick={item.acao}
                            className="botao-interno"
                          >
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

  return renderizarTela();
};

export default HomeERP;

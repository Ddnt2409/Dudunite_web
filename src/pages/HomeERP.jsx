import React, { useState, useRef } from "react";
import HomePCP from "./HomePCP";
import "./HomeERP.css";

export default function HomeERP({ setTela: propSetTela }) {
  // estado local de tela: "Home" ou "PCP" (lançamento sabore virá depois)
  const [tela, setTela] = useState("Home");
  const [zoomIndex, setZoomIndex] = useState(0);
  const touchStartX = useRef(null);
  const [mostrarDropdown, setMostrarDropdown] = useState(false);

  // lista de grupos de botões + dropdown
  const botoes = [
    {
      label: "📦\nProdução (PCP)",
      action: () => setTela("PCP"),
      dropdown: [
        { nome: "Lançar Pedido", acao: () => setTela("PCP") },
        { nome: "Alimentar Sabores", acao: () => alert("Em breve") },
      ],
    },
    {
      label: "💰\nFinanceiro (FinFlux)",
      action: () => {},
      dropdown: [
        { nome: "Contas a Receber", acao: () => alert("Em breve") },
        { nome: "Contas a Pagar", acao: () => alert("Em breve") },
      ],
    },
    {
      label: "📊\nAnálise de Custos",
      action: () => {},
      dropdown: [
        { nome: "Custos por Produto", acao: () => alert("Em breve") },
        { nome: "Custos Fixos", acao: () => alert("Em breve") },
        { nome: "Custos Variáveis", acao: () => alert("Em breve") },
      ],
    },
    {
      label: "👨‍🍳\nCozinha",
      action: () => alert("Em breve"),
      dropdown: [],
    },
  ];

  function handleClick(idx, acao) {
    if (zoomIndex === idx) {
      // se já está zoomed e tem dropdown, executa ação
      if (mostrarDropdown) acao();
      else setMostrarDropdown(true);
    } else {
      // apenas muda o zoom
      setZoomIndex(idx);
      setMostrarDropdown(false);
    }
  }

  function deslizar(direcao) {
    setZoomIndex((prev) => {
      const total = botoes.length;
      const novo = direcao === "esquerda"
        ? (prev - 1 + total) % total
        : (prev + 1) % total;
      setMostrarDropdown(false);
      return novo;
    });
  }

  // se estiver em PCP, renderiza o sub-componente
  if (tela === "PCP") {
    // encaminha propSetTela para o HomePCP, para voltar depois
    return <HomePCP setTela={propSetTela} />;
  }

  return (
    <div
      style={{
        backgroundImage: "url('/bg002.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* === HEADER === */}
      <header className="homeerp-header">
        <img
          src="/LogomarcaDDnt2025Vazado.png"
          alt="Logo Dudunitê"
          className="homeerp-logo"
        />
        <h1 className="homeerp-titulo">ERP DUDUNITÊ</h1>
      </header>

      {/* === BOTÕES PRINCIPAIS === */}
      <main>
        <div
          className="botoes-erp"
          onTouchStart={(e) => (touchStartX.current = e.changedTouches[0].clientX)}
          onTouchEnd={(e) => {
            const diff = e.changedTouches[0].clientX - touchStartX.current;
            if (diff > 50) deslizar("esquerda");
            else if (diff < -50) deslizar("direita");
          }}
        >
          {botoes.map((btn, idx) => {
            const zoomed = idx === zoomIndex;
            return (
              <div key={idx} className="item-erp">
                <button
                  className={`botao-principal ${zoomed ? "botao-ativo" : "botao-inativo"}`}
                  onClick={() => handleClick(idx, btn.action)}
                >
                  {btn.label}
                </button>

                {zoomed && mostrarDropdown && btn.dropdown.length > 0 && (
                  <div className="dropdown-interno">
                    {btn.dropdown.map((op, i) => (
                      <button key={i} onClick={op.acao}>
                        {op.nome}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </main>

      {/* === RODAPÉ === */}
      <footer>
        <marquee behavior="scroll" direction="left">
          • Pequeno Príncipe • Salesianas • Céu Azul • Russas • Bora Gastar • Kaduh •
          Society Show • Degusty • Tio Valter • Vera Cruz • Pinheiros • Dourado • BMQ •
          CFC • Madre de Deus • Saber Viver • Interativo • Exato Sede • Exato Anexo • Motivo •
          Jesus Salvador
        </marquee>
      </footer>
    </div>
  );
}

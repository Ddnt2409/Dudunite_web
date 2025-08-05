import React, { useState, useRef } from "react";
import HomePCP from "./HomePCP";
import "./HomeERP.css";

const HomeERP = () => {
  const [tela, setTela] = useState("Home");
  const [zoomIndex, setZoomIndex] = useState(null);
  const [mostrarDropdown, setMostrarDropdown] = useState(false);

  const touchStartX = useRef(null);

  const botoes = [
    {
      label: "📦\nProdução (PCP)",
      dropdown: [
        {
          nome: "Lançar Pedido",
          acao: () => setTela("LanPed"),
        },
        {
          nome: "Alimentar Sabores",
          acao: () => alert("Em construção"),
        },
      ],
    },
    {
      label: "💰\nFinanceiro (FinFlux)",
      dropdown: [
        { nome: "Contas a Receber", acao: () => alert("Em construção") },
        { nome: "Contas a Pagar", acao: () => alert("Em construção") },
      ],
    },
    {
      label: "📊\nAnálise de Custos",
      dropdown: [
        { nome: "Custos por Produto", acao: () => alert("Em construção") },
        { nome: "Custos Fixos", acao: () => alert("Em construção") },
        { nome: "Custos Variáveis", acao: () => alert("Em construção") },
      ],
    },
    {
      label: "👨‍🍳\nCozinha",
      dropdown: [{ nome: "Em breve", acao: () => alert("Em construção") }],
    },
  ];

  const handleClick = (idx) => {
    if (zoomIndex === idx) {
      // já está ampliado → só alterna dropdown
      setMostrarDropdown((v) => !v);
    } else {
      setZoomIndex(idx);
      setMostrarDropdown(true);
    }
  };

  // roteamento interno
  if (tela === "PCP") return <HomePCP setTela={setTela} />;
  if (tela === "LanPed") return <HomePCP setTela={setTela} lan=true />;

  return (
    <div className="home-erp-wrapper">
      <header className="erp-header">
        <img
          src="/LogomarcaDDnt2025Vazado.png"
          alt="Logo Dudunitê"
          className="erp-logo"
        />
        <h1 className="erp-titulo">ERP DUDUNITÊ</h1>
      </header>

      <main>
        <div
          className="botoes-erp"
          onTouchStart={(e) =>
            (touchStartX.current = e.changedTouches[0].clientX)
          }
          onTouchEnd={(e) => {
            const diff = e.changedTouches[0].clientX - touchStartX.current;
            if (Math.abs(diff) > 50) {
              const passo = diff > 0 ? -1 : +1;
              const novo = (zoomIndex + passo + botoes.length) % botoes.length;
              setZoomIndex(novo);
              setMostrarDropdown(false);
            }
          }}
        >
          {botoes.map((btn, idx) => {
            const ativo = idx === zoomIndex;
            return (
              <div key={idx}>
                <button
                  className={`botao-principal ${
                    ativo ? "botao-ativo" : "botao-inativo"
                  }`}
                  onClick={() => handleClick(idx)}
                >
                  {btn.label}
                </button>

                {ativo && mostrarDropdown && btn.dropdown.length > 0 && (
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

      <footer className="erp-footer">
        <marquee behavior="scroll" direction="left">
          • Pequeno Príncipe • Salesianas • Céu Azul • Russas • Bora Gastar •
          Kaduh • Society Show • Degusty • Tio Valter • Vera Cruz • Pinheiros •
          Dourado • BMQ • CFC • Madre de Deus • Saber Viver • Interativo •
          Exato Sede • Exato Anexo • Sesi • Motivo • Jesus Salvador
        </marquee>
      </footer>
    </div>
  );
};

export default HomeERP;

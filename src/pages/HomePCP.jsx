import React from "react";
import "./HomePCP.css";

const HomePCP = ({ setTela, lan = false }) => {
  // se lan=true, já abre LanPed
  React.useEffect(() => {
    if (lan) setTela("LanPed");
  }, [lan]);

  return (
    <div className="home-pcp-wrapper">
      <header className="erp-header">
        <img
          src="/LogomarcaDDnt2025Vazado.png"
          alt="Logo Dudunitê"
          className="erp-logo"
        />
        <h1 className="erp-titulo">PCP – Planejamento de Produção</h1>
      </header>

      <main>
        <div className="botoes-pcp">
          <button
            className="botao-principal-erp"
            onClick={() => setTela("LanPed")}
          >
            📋{" "}
            <span className="texto-botao">
              Lançar Pedido
            </span>
          </button>
          <button
            className="botao-principal-erp botao-inativo"
            onClick={() => alert("Em construção")}
          >
            🍫{" "}
            <span className="texto-botao">
              Alimentar Sabores
            </span>
          </button>
        </div>
      </main>

      <footer className="erp-footer">
        <marquee behavior="scroll" direction="left">
          • Cruz • Pinheiros • Dourado • BMQ • CFC • Madre de Deus • Saber
          Viver • Interativo • Exato Sede • Exato Anexo • Society Show • Russas
          • Kaduh • Degusty • Bora Gastar • Salesianas • Céu Azul • Pequeno
          Príncipe • Tio Valter • Vera Cruz
        </marquee>
      </footer>
    </div>
  );
};

export default HomePCP;

// === INÍCIO HomePCP.jsx ===
import React from "react";
import { useNavigate } from "react-router-dom";
import "./HomeERP.css";

const HomePCP = () => {
  const navigate = useNavigate();

  const botoes = [
    { id: 1, titulo: "Lançar Pedido", destino: "/lancar-pedido" },
    { id: 2, titulo: "Alimentar Sabores", destino: "/alimentar-sabores" },
    { id: 3, titulo: "Planejamento de Produção", destino: "/planejamento" },
    { id: 4, titulo: "Lista de Compras", destino: "/lista-compras" },
    { id: 5, titulo: "Cozinha", destino: "/cozinha" },
  ];

  const [botaoAtivo, setBotaoAtivo] = React.useState(3); // default: botão do meio

  const handleScroll = (event) => {
    const container = event.target;
    const larguraBotao = 220;
    const scrollPosition = container.scrollLeft + container.offsetWidth / 2;
    const index = Math.round(scrollPosition / larguraBotao);
    setBotaoAtivo(index);
  };

  return (
    <div className="tela-pcp">
      <h1 className="titulo-pcp">PCP – Planejamento e Controle de Produção</h1>

      <div
        className="container-botoes"
        onScroll={handleScroll}
      >
        {botoes.map((botao, index) => (
          <button
            key={botao.id}
            className={`botao-principal ${
              index === botaoAtivo ? "botao-ativo" : ""
            }`}
            onClick={() => navigate(botao.destino)}
          >
            {botao.titulo}
          </button>
        ))}
      </div>
    </div>
  );
};

export default HomePCP;
// === FIM HomePCP.jsx ===

// === INÍCIO HomeERP.jsx ===
import { useState, useEffect } from "react";
import "./HomeERP.css";

export default function HomeERP({ navegarPara }) {
  const [posicao, setPosicao] = useState(1); // botão central inicialmente no meio

  const botoes = [
    {
      id: 0,
      titulo: "Finanças",
      subtitulos: ["Contas", "Caixa", "Relatórios"],
      cor: "secundario",
    },
    {
      id: 1,
      titulo: "PCP",
      subtitulos: ["Lançar Pedido", "Alimentar Sabores"],
      cor: "primario",
    },
    {
      id: 2,
      titulo: "Custos",
      subtitulos: ["Matéria-prima", "Produção", "Rentabilidade"],
      cor: "secundario",
    },
  ];

  const moverCarrossel = (direcao) => {
    setPosicao((prev) => {
      if (direcao === "esquerda") {
        return prev === 0 ? botoes.length - 1 : prev - 1;
      } else {
        return prev === botoes.length - 1 ? 0 : prev + 1;
      }
    });
  };

  const handleClickPrincipal = () => {
    const item = botoes[posicao];
    if (item.titulo === "PCP") {
      const fundo = document.querySelector(".container-geral");
      fundo.classList.add("fade-out");
      setTimeout(() => navegarPara("HomePCP"), 300);
    }
  };

  return (
    <div className="container-geral">
      <img
        src="/LogomarcaDDnt2025Vazado.png"
        alt="Logo"
        className="logo-erp"
      />
      <div className="carrossel">
        <button className="seta" onClick={() => moverCarrossel("esquerda")}>
          ◀
        </button>

        <div className="botoes-centrais">
          {botoes.map((btn, index) => {
            const isCentral = index === posicao;
            return (
              <div
                key={btn.id}
                className={`botao-erp ${isCentral ? "central" : "lateral"} ${btn.cor}`}
                onClick={isCentral ? handleClickPrincipal : null}
              >
                <div className="titulo-principal">{btn.titulo}</div>
                {isCentral && (
                  <div className="subitens">
                    {btn.subtitulos.map((sub, i) => (
                      <div key={i} className="subitem">{sub}</div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <button className="seta" onClick={() => moverCarrossel("direita")}>
          ▶
        </button>
      </div>
    </div>
  );
}
// === FIM HomeERP.jsx ===

import React, { useState } from 'react';
import './HomeERP.css';

function HomeERP() {
  const modulos = [
    {
      id: 0,
      nome: 'Produção (PCP)',
      botao: 'PCP',
      opcoes: ['Lançar Pedido', 'Alimentar Sabores'],
    },
    {
      id: 1,
      nome: 'Financeiro (FinFlux)',
      botao: 'Finanças',
      opcoes: ['Contas a Pagar', 'Fluxo de Caixa'],
    },
    {
      id: 2,
      nome: 'Análise de Custos',
      botao: 'Custos',
      opcoes: ['Mão de Obra', 'Matéria-prima'],
    },
  ];

  const [indiceAtivo, setIndiceAtivo] = useState(0);

  const moverEsquerda = () => {
    setIndiceAtivo((prev) => (prev - 1 + modulos.length) % modulos.length);
  };

  const moverDireita = () => {
    setIndiceAtivo((prev) => (prev + 1) % modulos.length);
  };

  const getModulo = (index) => modulos[index % modulos.length];

  const anterior = getModulo(indiceAtivo - 1 + modulos.length);
  const atual = getModulo(indiceAtivo);
  const proximo = getModulo(indiceAtivo + 1);

  return (
    <div className="homeerp-container">
      {/* === INÍCIO RT01 – Cabeçalho com logo e título === */}
      <div className="homeerp-header">
        <img
          src="LogomarcaDDnt2025Vazado.png"
          alt="Logo Dudunitê"
          className="homeerp-logo"
        />
        <h1 className="homeerp-titulo">ERP DUDUNITÊ</h1>
      </div>
      {/* === FIM RT01 === */}

      {/* === INÍCIO RT02 – Carrossel Central === */}
      <div className="homeerp-carrossel">
        <button className="seta" onClick={moverEsquerda}>
          ◀
        </button>

        <div className="modulo modulo-anterior">
          <div className="modulo-botao">{anterior.botao}</div>
        </div>

        <div className="modulo modulo-central">
          <div className="modulo-botao ativo">{atual.botao}</div>
          <div className="modulo-opcoes">
            {atual.opcoes.map((opcao, index) => (
              <div key={index} className="modulo-opcao">
                {opcao}
              </div>
            ))}
          </div>
        </div>

        <div className="modulo modulo-posterior">
          <div className="modulo-botao">{proximo.botao}</div>
        </div>

        <button className="seta" onClick={moverDireita}>
          ▶
        </button>
      </div>
      {/* === FIM RT02 === */}

      {/* === INÍCIO RT03 – Rodapé com escolas === */}
      <div className="homeerp-rodape">
        Salesianas • Céu Azul • Russas • Bora Gastar • Kaduh • Society Show • Degusty
      </div>
      {/* === FIM RT03 === */}
    </div>
  );
}

export default HomeERP;

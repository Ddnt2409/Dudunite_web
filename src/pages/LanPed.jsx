import React, { useState } from 'react';
import './LanPed.css';

export default function LanPed({ setTela }) {
  const [cidade, setCidade] = useState('');
  const [escola, setEscola] = useState('');
  const [produto, setProduto] = useState('');
  const [sabor, setSabor] = useState('');
  const [quantidade, setQuantidade] = useState(1);

  const cidades = ['Gravatá','Recife','Caruaru','Petrolina','Garanhuns'];
  const escolasPorCidade = {
    Gravatá: ['Pequeno Príncipe','Salesianas','Céu Azul','Russas'],
    Recife: ['Tio Valter','Vera Cruz','Pinheiros','Dourado','BMQ','CFC'],
    Caruaru: ['Interativo','Exato Sede','Exato Anexo','Sesi','Motivo'],
    Petrolina: ['Sol','Vale','Juazeiro'],
    Garanhuns: ['Alvorada','São João'],
  };
  const produtos = ['BRW 7x7','BRW 6x6','PKT 5x5','PKT 6x6','Esc','DUDU'];
  const saboresPorProduto = {
    'BRW 7x7': ['Ninho','Oreo','Paçoca','Nutella'],
    'BRW 6x6': ['Brigadeiro branco','Brigadeiro preto','Ovomaltine'],
    'PKT 5x5': ['Beijinho','KitKat','Palha italiana'],
    'PKT 6x6': ['Oreo','Brigadeiro preto','Paçoca'],
    Esc: ['Ninho','Prestígio','Paçoca'],
    DUDU: ['Dd Oreo','Dd Nutella','Dd Maracujá'],
  };

  const escolas = cidade ? (escolasPorCidade[cidade] || []) : [];
  const sabores = produto ? (saboresPorProduto[produto] || []) : [];

  function salvar() {
    // aqui você envia para o Firestore
    alert(`Enviado: ${cidade} > ${escola} > ${produto} > ${sabor} x${quantidade}`);
  }

  return (
    <div className="lanped-container">
      <header className="lanped-header">
        <img src="/LogomarcaDDnt2025Vazado.png" alt="Logo" />
        <h1>Lançar Pedido – Dudunitê</h1>
      </header>

      <div className="lanped-formulario">
        <label>Cidade</label>
        <select value={cidade} onChange={e => setCidade(e.target.value)}>
          <option value="">Selecione</option>
          {cidades.map(c => <option key={c} value={c}>{c}</option>)}
        </select>

        <label>Escola</label>
        <select
          value={escola}
          onChange={e => setEscola(e.target.value)}
          disabled={!cidade}
        >
          <option value="">Selecione</option>
          {escolas.map(e => <option key={e} value={e}>{e}</option>)}
        </select>

        <label>Produto</label>
        <select value={produto} onChange={e => setProduto(e.target.value)}>
          <option value="">Selecione</option>
          {produtos.map(p => <option key={p} value={p}>{p}</option>)}
        </select>

        <label>Sabor</label>
        <select
          value={sabor}
          onChange={e => setSabor(e.target.value)}
          disabled={!produto}
        >
          <option value="">Selecione</option>
          {sabores.map(s => <option key={s} value={s}>{s}</option>)}
        </select>

        <label>Quantidade</label>
        <input
          type="number"
          min="1"
          value={quantidade}
          onChange={e => setQuantidade(Number(e.target.value))}
        />

        <button className="botao-salvar" onClick={salvar}>
          💾 Salvar Pedido
        </button>
      </div>

      <footer className="lanped-footer">
        <marquee>
          Cruz • Pinheiros • Dourado • BMQ • CFC • Madre de Deus • Saber Viver • …
        </marquee>
        <button className="botao-voltar" onClick={() => setTela('PCP')}>
          🔙 Voltar para PCP
        </button>
      </footer>
    </div>
  );
}

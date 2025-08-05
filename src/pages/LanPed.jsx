import React, { useState, useEffect } from 'react';
import './LanPed.css';

export default function LanPed({ setTela }) {
  // estados do formulário
  const [cidade, setCidade] = useState('');
  const [escola, setEscola] = useState('');
  const [produto, setProduto] = useState('');
  const [sabor, setSabor] = useState('');
  const [quantidade, setQuantidade] = useState(1);

  // opções fixas (você pode puxar do Firestore depois)
  const cidades = ['Gravatá', 'Recife', 'Caruaru'];
  const escolasPorCidade = {
    Gravatá: ['Pequeno Príncipe', 'Salesianas', 'Céu Azul'],
    Recife: ['Tio Valter', 'Vera Cruz', 'Pinheiros'],
    Caruaru: ['Interativo', 'Exato Sede', 'Sesi'],
  };
  const produtos = ['BRW 7x7', 'BRW 6x6', 'PKT 5x5'];
  const saboresPorProduto = {
    'BRW 7x7': ['Ninho', 'Oreo', 'Paçoca'],
    'BRW 6x6': ['Brigadeiro branco', 'Brigadeiro preto'],
    'PKT 5x5': ['Ovomaltine', 'Beijinho'],
  };

  // filtra escolas e sabores
  const escolasFiltradas = cidade ? escolasPorCidade[cidade] || [] : [];
  const saboresFiltrados = produto ? saboresPorProduto[produto] || [] : [];

  // salvar (ainda só faz console.log)
  function salvar() {
    console.log({ cidade, escola, produto, sabor, quantidade });
    alert('Pedido simulado: ' + cidade + ' - ' + escola);
  }

  return (
    <div className="lanped-container">
      {/* HEADER */}
      <header className="lanped-header">
        <img src="/LogomarcaDDnt2025Vazado.png" alt="Logo Dudunitê" className="lanped-logo" />
        <h1 className="lanped-titulo">Lançar Pedido – Dudunitê</h1>
      </header>

      {/* FORMULÁRIO */}
      <div className="lanped-formulario">
        <label>Cidade</label>
        <select value={cidade} onChange={e => setCidade(e.target.value)}>
          <option value="">Selecione</option>
          {cidades.map(c => <option key={c} value={c}>{c}</option>)}
        </select>

        <label>Escola</label>
        <select value={escola} onChange={e => setEscola(e.target.value)} disabled={!cidade}>
          <option value="">Selecione</option>
          {escolasFiltradas.map(e => <option key={e} value={e}>{e}</option>)}
        </select>

        <label>Produto</label>
        <select value={produto} onChange={e => setProduto(e.target.value)}>
          <option value="">Selecione</option>
          {produtos.map(p => <option key={p} value={p}>{p}</option>)}
        </select>

        <label>Sabor</label>
        <select value={sabor} onChange={e => setSabor(e.target.value)} disabled={!produto}>
          <option value="">Selecione</option>
          {saboresFiltrados.map(s => <option key={s} value={s}>{s}</option>)}
        </select>

        <label>Quantidade</label>
        <input
          type="number"
          min="1"
          value={quantidade}
          onChange={e => setQuantidade(Number(e.target.value))}
        />

        <button onClick={salvar}>💾 Salvar Pedido</button>
      </div>

      {/* VOLTAR */}
      <div className="lanped-footer">
        <button className="botao-voltar" onClick={() => setTela('HomePCP')}>
          🔙 Voltar para PCP
        </button>
      </div>
    </div>
  );
}

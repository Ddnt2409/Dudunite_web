import React, { useState } from 'react'
import './LanPed.css'

export default function LanPed({ setTela }) {
  // exemplo de selects funcionais
  const [cidade, setCidade] = useState('')
  const [escola, setEscola] = useState('')
  const [produto, setProduto] = useState('')
  const [sabor, setSabor] = useState('')
  const [quantidade, setQuantidade] = useState(1)
  const [itens, setItens] = useState([])

  function adicionarItem() {
    if (!produto || !sabor) {
      alert('Preencha produto e sabor')
      return
    }
    setItens([...itens, { produto, sabor, quantidade }])
    setSabor('')
    setQuantidade(1)
  }

  function salvarPedido() {
    if (!cidade || !escola || itens.length === 0) {
      alert('Preencha tudo antes de salvar.')
      return
    }
    // TODO: enviar ao Firestore
    alert('Pedido salvo!')
    setTela('HomePCP')
  }

  return (
    <div className="lanped-bg">
      {/* HEADER */}
      <header className="lanped-header">
        <img
          src="/LogomarcaDDnt2025Vazado.png"
          alt="Logo"
          className="lanped-logo"
        />
        <h1 className="lanped-titulo">Lançar Pedido</h1>
      </header>

      {/* FORM */}
      <main className="lanped-formulario">
        <label>Cidade</label>
        <select onChange={(e) => setCidade(e.target.value)} value={cidade}>
          <option value="">Selecione</option>
          <option>Gravatá</option>
          <option>Recife</option>
          <option>Caruaru</option>
        </select>

        <label>Escola</label>
        <select onChange={(e) => setEscola(e.target.value)} value={escola}>
          <option value="">Selecione</option>
          <option>Pequeno Príncipe</option>
          <option>Salesianas</option>
          <option>Céu Azul</option>
        </select>

        <label>Produto</label>
        <select onChange={(e) => setProduto(e.target.value)} value={produto}>
          <option value="">Selecione</option>
          <option>BRW 7x7</option>
          <option>BRW 6x6</option>
          <option>PKT 5x5</option>
        </select>

        <label>Sabor</label>
        <select onChange={(e) => setSabor(e.target.value)} value={sabor}>
          <option value="">Selecione</option>
          <option>Ninho</option>
          <option>Brigadeiro</option>
          <option>Oreo</option>
        </select>

        <label>Quantidade</label>
        <input
          type="number"
          min="1"
          value={quantidade}
          onChange={(e) => setQuantidade(Number(e.target.value))}
        />

        <button onClick={adicionarItem}>➕ Adicionar Item</button>

        {itens.length > 0 && (
          <ul className="lanped-list">
            {itens.map((it, i) => (
              <li key={i}>
                {it.quantidade}× {it.produto} – {it.sabor}
              </li>
            ))}
          </ul>
        )}

        <button onClick={salvarPedido} className="lanped-salvar">
          💾 Salvar Pedido
        </button>

        <button
          className="botao-voltar"
          onClick={() => setTela('HomePCP')}
        >
          🔙 Voltar para PCP
        </button>
      </main>

      {/* FOOTER */}
      <footer className="lanped-footer">
        <marquee behavior="scroll" direction="left">
          • Pequeno Príncipe • Salesianas • Céu Azul • Russas • Bora Gastar •
          Kaduh • Society Show • Degusty • Tio Valter • Vera Cruz • Pinheiros •
          Dourado • BMQ • CFC • Madre de Deus • Saber Viver • Interativo •
          Exato Sede • Exato Anexo • Sesi • Motivo • Jesus Salvador
        </marquee>
      </footer>
    </div>
  )
      }

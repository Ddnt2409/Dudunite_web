import React, { useState, useRef } from 'react'
import './HomeERP.css'

export default function HomeERP({ setTela }) {
  const botoes = [
    {
      label: '📦\nProdução (PCP)',
      action: () => setTela('HomePCP'),
    },
    {
      label: '💰\nFinanceiro (FinFlux)',
      action: () => alert('Em construção'),
    },
    {
      label: '📊\nAnálise de Custos',
      action: () => alert('Em construção'),
    },
    {
      label: '👨‍🍳\nCozinha',
      action: () => alert('Em construção'),
    },
  ]

  const [zoomIndex, setZoomIndex] = useState(0)
  const touchStartX = useRef(0)

  function handleClick(i, action) {
    // Produção (índice 0) sempre dispara de primeira
    if (i === 0) {
      return action()
    }
    // para os demais, apenas muda o zoom
    setZoomIndex(i)
  }

  function swipe(dir) {
    const total = botoes.length
    setZoomIndex((z) =>
      dir === 'left' ? (z - 1 + total) % total : (z + 1) % total
    )
  }

  return (
    <div className="erp-container">
      {/* HEADER */}
      <header className="erp-header">
        <img
          src="/LogomarcaDDnt2025Vazado.png"
          alt="Logo Dudunitê"
          className="erp-logo"
        />
        <h1 className="erp-title">ERP DUDUNITÊ</h1>
      </header>

      {/* MAIN CAROUSEL */}
      <main
        className="erp-main"
        onTouchStart={(e) =>
          (touchStartX.current = e.changedTouches[0].clientX)
        }
        onTouchEnd={(e) => {
          const diff = e.changedTouches[0].clientX - touchStartX.current
          if (diff > 50) swipe('left')
          if (diff < -50) swipe('right')
        }}
      >
        {botoes.map((b, i) => {
          const active = i === zoomIndex
          return (
            <div key={i} className="erp-item">
              <button
                className={`botao-principal ${
                  active ? 'botao-ativo' : 'botao-inativo'
                }`}
                onClick={() => handleClick(i, b.action)}
              >
                {b.label}
              </button>
            </div>
          )
        })}
      </main>

      {/* FOOTER */}
      <footer className="erp-footer">
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

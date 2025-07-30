// === INÍCIO HomePCP.jsx ===

import React from 'react'; import './HomePCP.css';

const HomePCP = () => { return ( <div className="home-pcp" style={{ backgroundImage: 'url(/bg001.png)', backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat', height: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', }} > {/* === INÍCIO CABEÇALHO === /} <header style={{ backgroundColor: 'rgba(255, 255, 255, 0.4)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 20px', }} > <img src="/LogomarcaDDnt2025Vazado.png" alt="Logo Dudunitê" style={{ height: '84px' }} /> <h2 style={{ margin: 0, color: '#8c3b1b' }}>ERP DUDUNITÊ</h2> </header> {/ === FIM CABEÇALHO === */}

{/* === INÍCIO CONTEÚDO CENTRAL === */}
  <main
    style={{
      textAlign: 'center',
      color: '#8c3b1b',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      flexGrow: 1,
    }}
  >
    <button
      style={{
        backgroundColor: '#8c3b1b',
        color: 'white',
        fontWeight: 'bold',
        border: 'none',
        borderRadius: '8px',
        padding: '16px 32px',
        fontSize: '24px',
        boxShadow: '0px 8px 16px rgba(0,0,0,0.4)',
        marginBottom: '32px',
      }}
    >
      PCP
    </button>

    <div
      style={{
        backgroundColor: 'rgba(255,255,255,0.4)',
        padding: '12px 24px',
        borderRadius: '6px',
        fontWeight: 'bold',
        fontSize: '18px',
      }}
    >
      PLANEJAMENTO E CONTROLE DE PRODUÇÃO
    </div>
  </main>
  {/* === FIM CONTEÚDO CENTRAL === */}

  {/* === INÍCIO BOTOES AÇÕES === */}
  <div
    style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '20px',
      marginBottom: '36px',
    }}
  >
    <button
      style={{
        backgroundColor: '#8c3b1b',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        padding: '14px 28px',
        fontSize: '18px',
        boxShadow: '0px 8px 16px rgba(0,0,0,0.4)',
      }}
    >
      LANÇAR PEDIDO
    </button>
    <button
      style={{
        backgroundColor: '#8c3b1b',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        padding: '14px 28px',
        fontSize: '18px',
        boxShadow: '0px 8px 16px rgba(0,0,0,0.4)',
      }}
    >
      ALIMENTAR SABORES
    </button>
  </div>
  {/* === FIM BOTOES AÇÕES === */}

  {/* === INÍCIO RODAPÉ === */}
  <footer
    style={{
      overflow: 'hidden',
      whiteSpace: 'nowrap',
      width: '100%',
      backgroundColor: 'rgba(255, 255, 255, 0.5)',
    }}
  >
    <div
      style={{
        display: 'inline-block',
        paddingLeft: '100%',
        animation: 'marquee 30s linear infinite',
        fontWeight: 'bold',
        color: '#8c3b1b',
        fontSize: '16px',
      }}
    >
      Russas • Bora Gastar • Kaduh • Society Show • Degusty • Pequeno Príncipe • Salesianas • Céu Azul • Tio Valter • Vera Cruz • Pinheiros • Dourado • BMQ • CFC • Madre de Deus • Saber Viver • Interativo • Exato Sede • Exato Anexo • Sesi • Motivo • Jesus Salvador
    </div>
  </footer>
  <style>{`
    @keyframes marquee {
      0% { transform: translateX(0); }
      100% { transform: translateX(-100%); }
    }
  `}</style>
  {/* === FIM RODAPÉ === */}
</div>

); };

export default HomePCP;

// === FIM HomePCP.jsx ===


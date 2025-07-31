// src/pages/HomeERP.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import './HomeERP.css';

const HomeERP = () => {
  const navigate = useNavigate();

  return (
    <div
      className="homeerp-container"
      style={{
        backgroundImage: 'url("/BG002.png")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        minHeight: '100vh',
      }}
    >
      {/* === CABEÇALHO TRANSLÚCIDO === */}
      <header
        style={{
          backgroundColor: 'rgba(255, 255, 255, 0.5)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '10px 20px',
        }}
      >
        <img
          src="/LogomarcaDDnt2025Vazado.png"
          alt="Logomarca"
          style={{ height: '40px' }}
        />
        <h1 style={{ color: '#8C3B1B', fontSize: '14px' }}>ERP DUDUNITÊ</h1>
      </header>

      {/* === CENTRO === */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          paddingTop: '40px',
        }}
      >
        <button style={estiloBotaoTitulo}>ERP</button>
        <div style={{ fontSize: '12px', margin: '10px', color: '#8C3B1B' }}>
          Sistema De Gestão Dudunitê
        </div>

        <button style={estiloBotao} onClick={() => navigate('/pcp')}>
          Produção
        </button>
        <button style={estiloBotao} onClick={() => navigate('/receber')}>
          Financeiro
        </button>
        <button style={estiloBotao} onClick={() => navigate('/custos')}>
          Resultados
        </button>
      </div>

      {/* === RODAPÉ COM MARQUEE === */}
      <footer
        style={{
          backgroundColor: 'rgba(140, 59, 27, 0.4)',
          position: 'fixed',
          bottom: 0,
          width: '100%',
          padding: '6px 0',
          textAlign: 'center',
          color: '#fff',
          fontSize: '11px',
        }}
      >
        <marquee behavior="scroll" direction="left" scrollamount="4">
          Pequeno Príncipe • Salesianas • Céu Azul • Russas • Bora Gastar • Kaduh • Society Show • Degusty • Tio Valter • Vera Cruz • Pinheiros • Dourado • BMQ • CFC • Madre de Deus • Saber Viver • Interativo • Exato Sede • Exato Anexo • Sesi • Motivo • Jesus Salvador
        </marquee>
      </footer>
    </div>
  );
};

const estiloBotaoTitulo = {
  backgroundColor: '#8C3B1B',
  color: 'white',
  padding: '10px 24px',
  margin: '6px',
  borderRadius: '8px',
  border: 'none',
  fontSize: '18px',
  fontWeight: 'bold',
  boxShadow: '2px 2px 4px rgba(0,0,0,0.3)',
};

const estiloBotao = {
  backgroundColor: '#8C3B1B',
  color: 'white',
  padding: '10px 24px',
  margin: '6px',
  borderRadius: '8px',
  border: 'none',
  fontSize: '16px',
  fontWeight: 'bold',
  width: '160px',
  boxShadow: '2px 2px 4px rgba(0,0,0,0.3)',
};

export default HomeERP;

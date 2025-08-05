import React, { useState } from 'react';
import HomeERP from './pages/HomeERP';
import HomePCP from './pages/HomePCP';
import LanPed from './pages/LanPed';

function App() {
  const [telaAtual, setTelaAtual] = useState('HomeERP'); // 👈 VOLTA A SER A TELA PRINCIPAL

  if (telaAtual === 'HomeERP') return <HomeERP setTela={setTelaAtual} />;
  if (telaAtual === 'HomePCP') return <HomePCP setTela={setTelaAtual} />;
  if (telaAtual === 'LanPed') return <LanPed setTela={setTelaAtual} />;

  return null;
}

export default App;

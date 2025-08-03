// App.jsx
import React, { useState } from 'react';
import HomeERP from './pages/HomeERP';
import HomePCP from './pages/HomePCP';

function App() {
  const [telaAtual, setTelaAtual] = useState('HomeERP');

  if (telaAtual === 'HomeERP') return <HomeERP setTela={setTelaAtual} />;
  if (telaAtual === 'HomePCP') return <HomePCP setTela={setTelaAtual} />;
  return null;
}

export default App;

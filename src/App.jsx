// src/App.jsx
import React, { useState } from 'react';
import HomeERP   from './pages/HomeERP';
import HomePCP   from './pages/HomePCP';
import LanPed    from './pages/LanPed';
import AliSab    from './pages/AliSab';

export default function App() {
  const [tela, setTela] = useState('HomeERP');

  return (
    <>
      {tela === 'HomeERP' && <HomeERP setTela={setTela} />}
      {tela === 'HomePCP' && <HomePCP  setTela={setTela} />}
      {tela === 'LanPed'  && <LanPed   setTela={setTela} />}
      {tela === 'AliSab'  && <AliSab   setTela={setTela} />}
    </>
  );
}

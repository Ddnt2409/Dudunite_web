// === BLOCO 1 – Início ===
// FN01 – Importações Gerais
import React, { useState } from 'react';
import HomeERP from './pages/HomeERP';
import HomePCP from './pages/HomePCP'; // Corrigido: antes estava apontando para components

// === FN02 – Componente Principal ===
function App() {
  const [telaAtual, setTelaAtual] = useState('HomeERP');

  const navegarPara = (novaTela) => {
    setTelaAtual(novaTela);
  };

  return (
    <>
      {/* === INÍCIO RT00 – HomeERP === */}
      {telaAtual === 'HomeERP' && (
        <HomeERP navegarPara={navegarPara} />
      )}
      {/* === FIM RT00 === */}

      {/* === INÍCIO RT01 – HomePCP === */}
      {telaAtual === 'HomePCP' && (
        <HomePCP navegarPara={navegarPara} />
      )}
      {/* === FIM RT01 === */}
    </>
  );
}

export default App;

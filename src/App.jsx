// === FN01 – Importações Gerais ===
import React, { useState } from "react";
import HomeERP from "./pages/HomeERP";
import HomePCP from "./pages/HomePCP";

// === FN02 – Componente Principal ===
function App() {
  const [telaAtual, setTelaAtual] = useState("Home");

  // Redirecionamento interno entre telas
  if (telaAtual === "PCP") return <HomePCP voltar={() => setTelaAtual("Home")} />;

  return <HomeERP irParaPCP={() => setTelaAtual("PCP")} />;
}

// === FIM DO COMPONENTE ===
export default App;

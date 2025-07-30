// === FN01 – Importações Gerais === import React, { useState } from "react"; import HomePCP from "./pages/HomePCP"; import HomeERP from "./pages/HomeERP";

// === FN02 – Componente Principal === const App = () => { const [telaAtual, setTelaAtual] = useState("HomeERP");

const renderizarTela = () => { if (telaAtual === "PCP") return <HomePCP />; if (telaAtual === "HomeERP") return <HomeERP />; return null; };

return ( <> {/* === INÍCIO RT00 – HomePCP === /} {telaAtual === "PCP" && <HomePCP />} {/ === FIM RT00 === */}

{/* === INÍCIO RT01 – HomeERP (Macro Módulos) === */}
  {telaAtual === "HomeERP" && <HomeERP />}
  {/* === FIM RT01 === */}
</>

); };

export default App;


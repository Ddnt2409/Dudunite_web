// === FN01 – Importações Gerais ===
import React, { useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import { collection, addDoc, getDocs, serverTimestamp, Timestamp } from 'firebase/firestore';
import db from './firebase';

// === FN02 – Logomarca e Cores ===
const logoPath = "/LogomarcaDDnt2025Vazado.png";
const corPrimaria = "#8c3b1b";
const corFundo = "#fff5ec";

// === FN03 – Importações de Páginas ===
import HomeERP from './pages/HomeERP';
import HomePCP from './pages/HomePCP';

// === FN04 – Componente Principal ===
const App = () => {
  return (
    <div style={{ backgroundColor: corFundo, minHeight: '100vh' }}>

      {/* === INÍCIO RT00 – HomeERP === */}
      <HomeERP />
      {/* === FIM RT00 === */}

      {/* === INÍCIO RT01 – HomePCP === */}
      {/* <HomePCP /> */}
      {/* === FIM RT01 === */}

    </div>
  );
};

// === RT99 – Exportação Final ===
export default App;

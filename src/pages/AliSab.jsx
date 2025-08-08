// src/pages/AliSab.jsx
import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import db from '../firebase';                 // ajuste o caminho se for diferente
import './AliSab.css';                        // importe o CSS

export default function AliSab({ setTela }) {
  const [pedidos, setPedidos] = useState([]);

  useEffect(() => {
    async function load() {
      try {
        const ref = collection(db, "PEDIDOS");
        const q = query(ref, where("statusEtapa", "==", "Lançado"));
        const snap = await getDocs(q);
        const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        console.log("Pedidos lançados:", list);
        setPedidos(list);
      } catch (err) {
        console.error("Erro ao buscar pedidos:", err);
      }
    }
    load();
  }, []);

  return (
    <div className="alisab-container">
      <header className="alisab-header">
        <h1>🍫 Alimentar Sabores</h1>
        <button onClick={() => setTela('HomePCP')}>
          🔙 Voltar ao PCP
        </button>
      </header>

      {pedidos.length === 0
        ? <p>Carregando pedidos (ou nenhum pedido lançado)...</p>
        : (
          <pre style={{ background: '#f5f5f5', padding: '1rem' }}>
            {JSON.stringify(pedidos, null, 2)}
          </pre>
        )
      }
    </div>
  );
}

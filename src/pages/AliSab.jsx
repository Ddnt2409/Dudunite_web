// src/pages/AliSab.jsx
import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import db from '../firebase';

export default function AliSab({ setTela }) {
  const [pedidos, setPedidos] = useState(null);
  const [erro, setErro] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const ref = collection(db, "PEDIDOS");
        const q = query(ref, where("statusEtapa", "==", "Lançado"));
        const snap = await getDocs(q);
        setPedidos(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (e) {
        setErro(e.message);
      }
    })();
  }, []);

  if (erro) {
    return (
      <div style={{ padding: 20, color: 'red' }}>
        <h1>❌ Erro ao carregar pedidos</h1>
        <pre>{erro}</pre>
        <button onClick={() => setTela('HomePCP')}>🔙 Voltar ao PCP</button>
      </div>
    );
  }

  if (pedidos === null) {
    return <div style={{ padding: 20 }}>🔄 Carregando pedidos…</div>;
  }

  return (
    <div style={{ padding: 20 }}>
      <h1>🍫 Alimentar Sabores</h1>
      <button onClick={() => setTela('HomePCP')}>🔙 Voltar ao PCP</button>
      <h2>Dados brutos:</h2>
      <pre style={{ whiteSpace: 'pre-wrap', background: '#eee', padding: 10 }}>
        {JSON.stringify(pedidos, null, 2)}
      </pre>
    </div>
  );
}

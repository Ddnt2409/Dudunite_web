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

  return (
    <div style={{ padding: 20, background: '#fff', color: '#000' }}>
      <h1>🍫 Alimentar Sabores</h1>
      <button onClick={() => setTela('HomePCP')}>
        🔙 Voltar ao PCP
      </button>

      {erro && (
        <p style={{ color: 'red' }}>Erro: {erro}</p>
      )}

      {pedidos === null ? (
        <p>Carregando pedidos...</p>
      ) : pedidos.length === 0 ? (
        <p>Não há pedidos com status “Lançado”.</p>
      ) : (
        <pre style={{
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-all',
          background: '#eee',
          padding: '1rem',
          marginTop: '1rem'
        }}>
          {JSON.stringify(pedidos, null, 2)}
        </pre>
      )}
    </div>
  );
}

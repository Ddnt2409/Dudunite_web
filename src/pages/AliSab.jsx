// src/pages/AliSab.jsx
import React, { useEffect, useState } from 'react';
import './AliSab.css';
import { collection, query, where, getDocs } from 'firebase/firestore';
import db from '../firebase';

export default function AliSab({ setTela }) {
  const [pedidos, setPedidos] = useState(null);
  const [erro, setErro] = useState(null);

  useEffect(() => {
    async function loadPedidos() {
      try {
        const q = query(
          collection(db, 'PEDIDOS'),
          where('statusEtapa', '==', 'Lançado')
        );
        const snap = await getDocs(q);
        const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setPedidos(list);
      } catch (err) {
        console.error(err);
        setErro(err.message || 'Erro desconhecido');
      }
    }
    loadPedidos();
  }, []);

  return (
    <div className="alisab-container">
      <header className="alisab-header">
        <h1>🍫 Alimentar Sabores</h1>
        <button className="botao-voltar" onClick={() => setTela('HomePCP')}>
          🔙 Voltar ao PCP
        </button>
      </header>

      <main className="alisab-main">
        {erro && (
          <div className="alisab-erro">
            <strong>Falha ao carregar:</strong><br />
            {erro}
          </div>
        )}

        {!erro && pedidos === null && <p>Carregando pedidos...</p>}

        {!erro && pedidos && pedidos.length === 0 && (
          <p>Nenhum pedido com status “Lançado” encontrado.</p>
        )}

        {!erro && pedidos && pedidos.length > 0 && (
          <pre className="alisab-json">
            {JSON.stringify(pedidos, null, 2)}
          </pre>
        )}
      </main>
    </div>
  );
}

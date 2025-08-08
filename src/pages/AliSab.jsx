import React, { useState, useEffect } from 'react';
import {
  collection,
  query,
  where,
  onSnapshot,
} from 'firebase/firestore';
import db from '../firebase';
import './AliSab.css';

export default function AliSab({ setTela }) {
  const [pedidos, setPedidos] = useState([]);

  useEffect(() => {
    // busca todos os pedidos com status "Lançado" (ainda sem sabores)
    const q = query(
      collection(db, 'PEDIDOS'),
      where('statusEtapa', '==', 'Lançado')
    );
    const unsub = onSnapshot(q, (snapshot) => {
      setPedidos(
        snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      );
    });
    return () => unsub();
  }, []);

  return (
    <div className="alisab-container">
      <div className="alisab-header">
        <h1>🍫 Alimentar Sabores</h1>
        <button
          className="botao-voltar-alisab"
          onClick={() => setTela('HomePCP')}
        >
          🔙 Voltar ao PCP
        </button>
      </div>

      <div className="postits-list">
        {pedidos.map(pedido => (
          <div key={pedido.id} className="postit">
            <div className="postit-cabecalho">
              <strong>{pedido.escola}</strong>
            </div>
            <ul className="postit-itens">
              {pedido.itens.map((item, i) => (
                <li key={i}>
                  {item.quantidade}× {item.produto}
                </li>
              ))}
            </ul>
          </div>
        ))}
        {pedidos.length === 0 && (
          <p className="nenhum-pedido">Nenhum pedido pendente.</p>
        )}
      </div>
    </div>
  );
}

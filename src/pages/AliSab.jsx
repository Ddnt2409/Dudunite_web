// src/pages/AliSab.jsx
import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, serverTimestamp } from 'firebase/firestore';
import db from '../firebase';
import './AliSab.css';  // próximo passo: crie este CSS

export default function AliSab({ setTela }) {
  const [pedidos, setPedidos] = useState([]);
  const [ativo, setAtivo] = useState(null);
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

  const toggle = id => {
    setAtivo(prev => (prev === id ? null : id));
  };

  return (
    <div className="alisab-container">
      <header className="alisab-header">
        <h1>🍫 Alimentar Sabores</h1>
        <button className="botao-voltar" onClick={() => setTela('HomePCP')}>
          🔙 Voltar ao PCP
        </button>
      </header>

      {erro && <p className="erro">Erro: {erro}</p>}

      <div className="postits-list">
        {pedidos.map(p => (
          <div
            key={p.id}
            className={`postit ${ativo === p.id ? 'ativo' : ''}`}
            onClick={() => toggle(p.id)}
          >
            <div className="postit-cabecalho">
              <strong>{p.escola}</strong>
            </div>
            <ul className="postit-itens">
              <li><em>Qtd:</em> {p.itens.reduce((sum,i) => sum + (i.quantidade||0), 0)}</li>
              {p.itens.map((it, i) => (
                <li key={i}>
                  {it.quantidade}× {it.produto}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

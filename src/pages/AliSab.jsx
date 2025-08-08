// src/pages/AliSab.jsx
import React, { useState, useEffect, useRef } from 'react';
import {
  collection,
  query,
  where,
  onSnapshot,
  updateDoc,
  doc,
  serverTimestamp,
} from 'firebase/firestore';
import db from '../firebase';
import './AliSab.css';

export default function AliSab({ setTela }) {
  const [pedidos, setPedidos] = useState([]);
  const [ativo, setAtivo] = useState(null);           // id do post-it ativo
  const [saboresEscolhidos, setSaboresEscolhidos] = useState({}); // { pedidoId: { itemIndex: [sabores] } }
  const dblClickRef = useRef({});                     // controle de duplo clique

  // 1) Carrega pedidos com status "Lançado"
  useEffect(() => {
    const q = query(
      collection(db, 'PEDIDOS'),
      where('statusEtapa', '==', 'Lançado')
    );
    return onSnapshot(q, snap => {
      const lista = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setPedidos(lista);
    });
  }, []);

  // 2) Handler de clique simples / duplo
  const handleClick = id => {
    const now = Date.now();
    const last = dblClickRef.current[id] || 0;
    if (now - last < 300) {
      // duplo clique
      setAtivo(id);
    } else {
      // clique simples (zoom)
      setAtivo(prev => (prev === id ? null : id));
    }
    dblClickRef.current[id] = now;
  };

  // 3) Toggle de sabor
  const toggleSabor = (pedidoId, idx, sabor) => {
    setSaboresEscolhidos(prev => {
      const porPedido = { ...(prev[pedidoId] || {}) };
      const arr = new Set(porPedido[idx] || []);
      if (arr.has(sabor)) arr.delete(sabor);
      else arr.add(sabor);
      porPedido[idx] = Array.from(arr);
      return { ...prev, [pedidoId]: porPedido };
    });
  };

  // 4) Salvar sabores e carimbar
  const salvarSabores = async pedido => {
    const atual = saboresEscolhidos[pedido.id] || {};
    const itensAtualizados = pedido.itens.map((it, i) => ({
      ...it,
      sabores: atual[i] || [],
    }));
    const ref = doc(db, 'PEDIDOS', pedido.id);
    await updateDoc(ref, {
      itens: itensAtualizados,
      statusEtapa: 'Sabores Preenchidos',
      atualizadoEm: serverTimestamp(),
    });
    setAtivo(null);
  };

  return (
    <div className="alisab-container">
      <header className="alisab-header">
        <h1>🍫 Alimentar Sabores</h1>
        <button className="botao-voltar" onClick={() => setTela('HomePCP')}>
          🔙 Voltar
        </button>
      </header>

      <div className="postits-list">
        {pedidos.map(pedido => (
          <div
            key={pedido.id}
            className={`postit ${ativo === pedido.id ? 'ativo' : ''}`}
            onClick={() => handleClick(pedido.id)}
          >
            {/* Carimbo */}
            {pedido.statusEtapa === 'Sabores Preenchidos' && (
              <div className="stamp">ALIMENTADO</div>
            )}

            {/* Cabeçalho */}
            <div className="postit-cabecalho">
              <strong>{pedido.escola}</strong>
            </div>

            {/* Itens */}
            <ul className="postit-itens">
              {pedido.itens.map((it, i) => (
                <li key={i}>
                  <span className="qtd">{it.quantidade}×</span>
                  <span className="prod">{it.produto}</span>
                </li>
              ))}
            </ul>

            {/* Form de sabores (apenas quando ativo e duplo clicado) */}
            {ativo === pedido.id && (
              <div className="sabores-form">
                {pedido.itens.map((it, i) => (
                  <div key={i} className="sabores-checkboxes">
                    <label>{it.produto}:</label>
                    { (it.saboresDisponiveis || []).map(sabor => (
                      <label key={sabor} className="sabor-item">
                        <input
                          type="checkbox"
                          checked={
                            (saboresEscolhidos[pedido.id]?.[i] || []).includes(sabor)
                          }
                          onChange={() => toggleSabor(pedido.id, i, sabor)}
                        />
                        {sabor}
                      </label>
                    ))}
                  </div>
                ))}
                <button
                  className="btn-salvar"
                  onClick={() => salvarSabores(pedido)}
                >
                  💾 Salvar
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
                  }

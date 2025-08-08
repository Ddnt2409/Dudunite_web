import React, { useState, useEffect } from 'react';
import {
  collection,
  getDocs,
  query,
  where,
} from 'firebase/firestore';
import db from '../firebase';
import './AliSab.css';

export default function AliSab({ setTela }) {
  const [pedidos, setPedidos] = useState([]);
  const [abertoId, setAbertoId] = useState(null);

  // 1) Carrega pedidos com status "Lançado"
  useEffect(() => {
    async function fetchPedidos() {
      const ref = collection(db, 'PEDIDOS');
      const q = query(ref, where('statusEtapa', '==', 'Lançado'));
      const snap = await getDocs(q);
      setPedidos(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }
    fetchPedidos();
  }, []);

  return (
    <div className="alisab-container">
      <header className="alisab-header">
        <h2>🍫 Alimentar Sabores</h2>
        <button
          className="botao-voltar-alisab"
          onClick={() => setTela('HomePCP')}
        >
          🔙 Voltar ao PCP
        </button>
      </header>

      <div className="postits-list">
        {pedidos.map(pedido => {
          const isAtivo = abertoId === pedido.id;
          const totalUnidades = pedido.itens
            .reduce((sum, i) => sum + (i.quantidade || 0), 0);
          return (
            <div
              key={pedido.id}
              className={`postit ${isAtivo ? 'ativo' : ''}`}
              onClick={() =>
                setAbertoId(isAtivo ? null : pedido.id)
              }
            >
              <div className="postit-cabecalho">
                <strong>
                  {pedido.escola} – {totalUnidades}× {pedido.itens[0]?.produto}
                </strong>
                {/* aqui mais produtos se quiser */}
              </div>

              {isAtivo && (
                <div className="postit-conteudo">
                  <p><strong>Total:</strong> {totalUnidades} un.</p>
                  <div className="sabores-checkboxes">
                    {/* Exemplo fixo; depois puxe de seu estado */}
                    <label><input type="number" min="0" defaultValue="0" /> Ninho</label>
                    <label><input type="number" min="0" defaultValue="0" /> Nutella</label>
                    <label><input type="number" min="0" defaultValue="0" /> Oreo</label>
                  </div>
                  <button className="btn-salvar">
                    💾 Salvar Sabores
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
);
}

// src/pages/AliSab.jsx
import React, { useState, useEffect } from "react";
import { collection, query, where, getDocs, updateDoc, doc } from "firebase/firestore";
import db from "../firebase";
import "./AliSab.css";

export default function AliSab({ setTela }) {
  const [pedidos, setPedidos] = useState([]);
  const [expandedId, setExpandedId] = useState(null);

  // 1) carrega apenas pedidos "Lançado"
  useEffect(() => {
    (async () => {
      const q = query(collection(db, "PEDIDOS"), where("statusEtapa", "==", "Lançado"));
      const snap = await getDocs(q);
      setPedidos(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    })();
  }, []);

  // 2) ao salvar, adiciona campo sabores e marca como Alimentado
  const handleSalvar = async (pedidoId, selecionados) => {
    const ref = doc(db, "PEDIDOS", pedidoId);
    await updateDoc(ref, {
      sabores: selecionados,
      statusEtapa: "Alimentado",
      atualizadoEm: new Date()
    });
    // remove o post-it dessa lista
    setPedidos(pedidos.filter(p => p.id !== pedidoId));
    setExpandedId(null);
  };

  return (
    <div className="alisab-container">
      <header className="alisab-header">
        <h2>🍫 Alimentar Sabores</h2>
        <button onClick={() => setTela("HomePCP")} className="btn-voltar">
          🔙 Voltar ao PCP
        </button>
      </header>

      <div className="postits-list">
        {pedidos.map(p => (
          <div
            key={p.id}
            className={`postit ${expandedId === p.id ? "ativo" : ""}`}
            onClick={() => setExpandedId(expandedId === p.id ? null : p.id)}
          >
            {/* cabeçalho do post-it */}
            <div className="postit-cabecalho">
              <strong>{p.escola}</strong> – {p.itens.reduce((sum, i) => sum + i.quantidade, 0)}×{" "}
              {p.itens.map(i => i.produto).join(", ")}
            </div>

            {/* corpo expandido */}
            {expandedId === p.id && (
              <>
                <ul className="postit-itens">
                  {p.itens.map((it, i) => (
                    <li key={i}>
                      {it.quantidade}× {it.produto}
                    </li>
                  ))}
                </ul>
                <div className="sabores-checkboxes">
                  {/* TODO: busque os sabores reais por p.produto */}
                  {["Ninho", "Brigadeiro", "Oreo"].map(s => (
                    <label key={s}>
                      <input type="checkbox" value={s} /> {s}
                    </label>
                  ))}
                </div>
                <button
                  className="btn-salvar"
                  onClick={e => {
                    e.stopPropagation();
                    const selecionados = Array.from(
                      e.currentTarget
                        .previousSibling.querySelectorAll("input:checked")
                    ).map(i => i.value);
                    handleSalvar(p.id, selecionados);
                  }}
                >
                  💾 Salvar Sabores
                </button>
              </>
            )}
          </div>
        ))}

        {pedidos.length === 0 && <p>Não há pedidos pendentes.</p>}
      </div>
    </div>
  );
}

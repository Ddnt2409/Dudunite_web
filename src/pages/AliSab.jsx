import React, { useState, useEffect } from "react";
import { collection, query, where, getDocs, updateDoc, doc } from "firebase/firestore";
import db from "../firebase";
import "./AliSab.css";

export default function AliSab({ setTela }) {
  const [pedidos, setPedidos] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const saboresFixos = ["Sabor A", "Sabor B"]; // placeholder

  // carrega pedidos com status "Lançado"
  useEffect(() => {
    async function load() {
      const q = query(collection(db, "PEDIDOS"), where("statusEtapa", "==", "Lançado"));
      const snap = await getDocs(q);
      setPedidos(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }
    load();
  }, []);

  // salva sabores e atualiza statusEtapa
  async function handleSalvar(id, selecionados) {
    const ref = doc(db, "PEDIDOS", id);
    await updateDoc(ref, {
      sabores: selecionados,
      statusEtapa: "Alimentado",
      atualizadoEm: new Date()
    });
    setPedidos(pedidos.filter(p => p.id !== id));
    setExpandedId(null);
  }

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
            <div className="postit-cabecalho">
              <strong>{p.escola}</strong> – {p.quantidade}× {p.produto}
            </div>

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
                  {saboresFixos.map(s => (
                    <label key={s}>
                      <input type="checkbox" value={s} /> {s}
                    </label>
                  ))}
                </div>

                <button
                  className="btn-salvar"
                  onClick={e => {
                    e.stopPropagation();
                    // pega checados
                    const form = e.currentTarget.previousSibling;
                    const selecionados = Array.from(
                      form.querySelectorAll("input:checked")
                    ).map(inp => inp.value);
                    handleSalvar(p.id, selecionados);
                  }}
                >
                  💾 Salvar Sabores
                </button>
              </>
            )}
          </div>
        ))}

        {pedidos.length === 0 && (
          <p>Nenhum pedido pendente para alimentar.</p>
        )}
      </div>
    </div>
  );
}

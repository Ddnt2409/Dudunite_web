import React, { useState, useEffect } from "react";
import {
  collection,
  query,
  where,
  onSnapshot,
  updateDoc,
  doc,
} from "firebase/firestore";
import db from "../firebase";
import "./AliSab.css";

export default function AliSab({ setTela }) {
  const [pedidos, setPedidos] = useState([]);
  const [pedidoSelecionado, setPedidoSelecionado] = useState(null);
  const [saboresEscolhidos, setSaboresEscolhidos] = useState({});

  // Carrega pedidos com status "Lançado"
  useEffect(() => {
    const ref = collection(db, "PEDIDOS");
    const q = query(ref, where("statusEtapa", "==", "Lançado"));
    return onSnapshot(q, snap => {
      setPedidos(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
  }, []);

  function abrirPedido(p) {
    setPedidoSelecionado(p);
    setSaboresEscolhidos({});
  }

  function toggleSabor(itemIndex, sabor) {
    setSaboresEscolhidos(prev => {
      const lista = prev[itemIndex] || [];
      const já = lista.includes(sabor);
      return {
        ...prev,
        [itemIndex]: já
          ? lista.filter(s => s !== sabor)
          : [...lista, sabor],
      };
    });
  }

  async function salvarSabores() {
    if (!pedidoSelecionado) return;
    // atualiza no Firestore
    const ref = doc(db, "PEDIDOS", pedidoSelecionado.id);
    await updateDoc(ref, {
      itens: pedidoSelecionado.itens.map((it, i) => ({
        ...it,
        sabores: saboresEscolhidos[i] || [],
      })),
      statusEtapa: "Alimentado",
    });
    setPedidoSelecionado(null);
  }

  return (
    <div className="alisab-container">
      <header className="alisab-header">
        <h1>Alimentar Sabores</h1>
        <button onClick={() => setTela("HomeERP")}>🔙 Voltar</button>
      </header>

      <section className="postits-list">
        {pedidos.map((p, idx) => (
          <div
            key={p.id}
            className={`postit ${pedidoSelecionado?.id === p.id ? "ativo" : ""}`}
            onClick={() => abrirPedido(p)}
          >
            <div className="postit-cabecalho">
              <strong>{p.escola}</strong>
            </div>
            <ul className="postit-itens">
              {p.itens.map((it, i) => (
                <li key={i}>
                  {it.quantidade}× {it.produto}
                  {pedidoSelecionado?.id === p.id && (
                    <div className="sabores-checkboxes">
                      {/* exemplo de sabores fixos, você pode trocar */}
                      {["Ninho", "Brigadeiro", "Oreo"].map(s => (
                        <label key={s}>
                          <input
                            type="checkbox"
                            checked={(saboresEscolhidos[i] || []).includes(s)}
                            onChange={() => toggleSabor(i, s)}
                          />
                          {s}
                        </label>
                      ))}
                    </div>
                  )}
                </li>
              ))}
            </ul>
            {pedidoSelecionado?.id === p.id && (
              <button className="btn-salvar" onClick={salvarSabores}>
                💾 Salvar Sabores
              </button>
            )}
          </div>
        ))}
      </section>
    </div>
  );
}

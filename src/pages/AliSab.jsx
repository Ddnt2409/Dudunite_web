import React, { useState, useEffect } from "react";
import {
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  doc,
} from "firebase/firestore";
import db from "../firebase";
import "./AliSab.css";

export default function AliSab({ setTela }) {
  const [pedidos, setPedidos] = useState([]);
  const [expandedId, setExpandedId] = useState(null);

  // 1) Carrega pedidos com status "Lançado"
  useEffect(() => {
    (async () => {
      const q = query(
        collection(db, "PEDIDOS"),
        where("statusEtapa", "==", "Lançado")
      );
      const snap = await getDocs(q);
      setPedidos(
        snap.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            ...data,
            itens: Array.isArray(data.itens) ? data.itens : [],
          };
        })
      );
    })();
  }, []);

  // 2) Salva sabores e remove o post-it da lista
  const handleSalvar = async (pedidoId, selecionados) => {
    const ref = doc(db, "PEDIDOS", pedidoId);
    await updateDoc(ref, {
      sabores: selecionados,
      statusEtapa: "Alimentado",
      atualizadoEm: new Date(),
    });
    setPedidos((prev) => prev.filter((p) => p.id !== pedidoId));
    setExpandedId(null);
  };

  return (
    <div className="alisab-container">
      <header className="alisab-header">
        <h2>🍫 Alimentar Sabores</h2>
        <button
          className="btn-voltar-alisab"
          onClick={() => setTela("HomePCP")}
        >
          🔙 Voltar ao PCP
        </button>
      </header>

      <div className="postits-list">
        {pedidos.length === 0 && (
          <p className="nenhum-pedido">Nenhum pedido pendente.</p>
        )}

        {pedidos.map((p) => {
          // total de unidades
          const totalUnidades = p.itens.reduce(
            (sum, i) => sum + (i.quantidade || 0),
            0
          );
          return (
            <div
              key={p.id}
              className={`postit ${expandedId === p.id ? "ativo" : ""}`}
              onClick={() =>
                setExpandedId(expandedId === p.id ? null : p.id)
              }
            >
              <div className="postit-cabecalho">
                <strong>{p.escola || "—"}</strong> – {totalUnidades}×
                {p.itens.map((i) => i.produto).join(", ")}
              </div>

              {expandedId === p.id && (
                <div className="postit-expansao">
                  <ul className="postit-itens">
                    {p.itens.map((it, i) => (
                      <li key={i}>
                        {it.quantidade}× {it.produto}
                      </li>
                    ))}
                  </ul>

                  <div className="sabores-checkboxes">
                    {/* TODO: trocar lista fixa por fetch de sabores por produto */}
                    {["Ninho", "Ninho com Nutella", "Brigadeiro", "Oreo"].map(
                      (s) => (
                        <label key={s}>
                          <input type="checkbox" value={s} /> {s}
                        </label>
                      )
                    )}
                  </div>

                  <button
                    className="btn-salvar"
                    onClick={(e) => {
                      e.stopPropagation();
                      // coletar valores checados
                      const form = e.currentTarget.parentElement;
                      const selecionados = Array.from(
                        form.querySelectorAll("input:checked")
                      ).map((i) => i.value);
                      handleSalvar(p.id, selecionados);
                    }}
                  >
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

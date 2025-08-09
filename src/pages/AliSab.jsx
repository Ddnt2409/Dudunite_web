// src/pages/AliSab.jsx
import React, { useEffect, useMemo, useState } from "react";
import { collection, query, where, getDocs, updateDoc, doc, serverTimestamp } from "firebase/firestore";
import db from "../firebase";
import "./AliSab.css";

// mapa de sabores por produto (ajuste quando quiser)
const SABORES = {
  "BROWNIE 7X7": ["Ninho", "Ninho com Nutella", "Brigadeiro", "Oreo", "Bem casado"],
  "BROWNIE 6X6": ["Ninho", "Ninho com Nutella", "Brigadeiro", "Oreo", "Bem casado"],
  "POCKET 5X5": ["Ninho", "Ninho com Nutella", "Brigadeiro", "Oreo", "Bem casado"],
  "POCKET 6X6": ["Ninho", "Ninho com Nutella", "Brigadeiro", "Oreo", "Bem casado"],
  "ESCONDIDINHO": ["Branco", "Preto", "Bem casado"],
  "DUDU": ["Dd Oreo", "Dd Ovomaltine", "Dd Ninho c/ Nutella", "Dd Maracujá", "Dd KitKat"],
};

// converte nomes antigos para os nomes “bonitos”
const normalizaProduto = (p) => {
  const t = (p || "").toUpperCase();
  if (t.includes("BRW 7")) return "BROWNIE 7X7";
  if (t.includes("BRW 6")) return "BROWNIE 6X6";
  if (t.includes("PKT 5")) return "POCKET 5X5";
  if (t.includes("PKT 6")) return "POCKET 6X6";
  if (t.startsWith("ESC")) return "ESCONDIDINHO";
  if (t.startsWith("DUDU")) return "DUDU";
  return p || "—";
};

export default function AliSab({ setTela }) {
  const [pedidos, setPedidos] = useState([]);
  const [expandedId, setExpandedId] = useState(null);

  // estado do formulário de sabores por pedido/produto
  // draft = { [pedidoId]: { [produtoBonito]: {linhas:[{sabor,qtd}], usados:number} } }
  const [draft, setDraft] = useState({});

  useEffect(() => {
    (async () => {
      const qy = query(collection(db, "PEDIDOS"), where("statusEtapa", "==", "Lançado"));
      const snap = await getDocs(qy);
      const lista = snap.docs.map(d => {
        const data = d.data() || {};
        const itens = Array.isArray(data.itens) ? data.itens : [];
        return { id: d.id, ...data, itens };
      });
      setPedidos(lista);
    })();
  }, []);

  // quando abrir um post-it, inicializa o draft daquele pedido
  useEffect(() => {
    if (!expandedId) return;

    const pedido = pedidos.find(p => p.id === expandedId);
    if (!pedido) return;

    setDraft(prev => {
      if (prev[expandedId]) return prev; // já inicializado
      const base = {};
      pedido.itens.forEach((it) => {
        const produto = normalizaProduto(it.produto);
        base[produto] = { linhas: [], usados: 0, total: Number(it.quantidade || 0) };
      });
      return { ...prev, [expandedId]: base };
    });
  }, [expandedId, pedidos]);

  const pedidosOrdenados = useMemo(() => {
    // ordena por escola para ficar mais previsível
    return [...pedidos].sort((a, b) => (a.escola || "").localeCompare(b.escola || ""));
  }, [pedidos]);

  const handleAddLinha = (pedidoId, produto, sabor, qtd) => {
    if (!sabor || !qtd) return;
    setDraft(prev => {
      const atual = prev[pedidoId]?.[produto];
      if (!atual) return prev;

      const usados = atual.usados + Number(qtd);
      if (usados > atual.total) return prev; // não deixa passar do total

      const linhas = [...atual.linhas, { sabor, qtd: Number(qtd) }];
      return {
        ...prev,
        [pedidoId]: {
          ...prev[pedidoId],
          [produto]: { ...atual, linhas, usados }
        }
      };
    });
  };

  const handleExcluirLinha = (pedidoId, produto, index) => {
    setDraft(prev => {
      const atual = prev[pedidoId]?.[produto];
      if (!atual) return prev;

      const linhas = [...atual.linhas];
      const removida = linhas.splice(index, 1)[0];
      const usados = atual.usados - (removida?.qtd || 0);

      return {
        ...prev,
        [pedidoId]: {
          ...prev[pedidoId],
          [produto]: { ...atual, linhas, usados }
        }
      };
    });
  };

  const handleSalvar = async (pedido) => {
    const dadosPedido = draft[pedido.id];
    if (!dadosPedido) return;

    // monta um payload simples: { produtoBonito: [{sabor,qtd}, ...], ... }
    const saboresPayload = {};
    Object.entries(dadosPedido).forEach(([produto, bloco]) => {
      saboresPayload[produto] = bloco.linhas;
    });

    // grava no mesmo doc
    await updateDoc(doc(db, "PEDIDOS", pedido.id), {
      sabores: saboresPayload,
      statusEtapa: "Alimentado",
      atualizadoEm: serverTimestamp(),
    });

    // “carimba” no front e mantém no grid
    setPedidos(prev => prev.map(p => (
      p.id === pedido.id ? { ...p, statusEtapa: "Alimentado" } : p
    )));
    setExpandedId(null);
  };

  return (
    <div className="alisab-container">
      <header className="alisab-header">
        <h2>🍫 Alimentar Sabores</h2>
        <button className="btn-voltar" onClick={() => setTela("HomePCP")}>🔙 Voltar ao PCP</button>
      </header>

      <div className="postits-list">
        {pedidosOrdenados.map((p, i) => {
          const total = p.itens.reduce((s, it) => s + Number(it.quantidade || 0), 0);
          const resumo = p.itens.map(it => `${Number(it.quantidade || 0)}× ${normalizaProduto(it.produto)}`).join(", ");

          const ativo = expandedId === p.id;
          const tilt = i % 2 ? "tilt-l" : "tilt-r";

          return (
            <article
              key={p.id}
              className={`postit ${tilt} ${ativo ? "ativo" : ""} ${p.statusEtapa === "Alimentado" ? "carimbado" : ""}`}
              onClick={() => setExpandedId(ativo ? null : p.id)}
            >
              {/* ====== CABEÇALHO DO POST-IT (onde você perguntou “onde trocar o JSX”) ====== */}
              <div className="postit-header">
                <div className="pdv">{p.escola || "—"}</div>
                <div className="resumo">{total}× — {resumo}</div>
              </div>

              {/* carimbo “ALIMENTADO” */}
              {p.statusEtapa === "Alimentado" && (
                <span className="carimbo">ALIMENTADO</span>
              )}

              {/* ====== CORPO EXPANDIDO ====== */}
              {ativo && (
                <div className="postit-body" onClick={(e) => e.stopPropagation()}>
                  {p.itens.map((it, idx) => {
                    const produto = normalizaProduto(it.produto);
                    const bloco = draft[p.id]?.[produto] || { linhas: [], usados: 0, total: Number(it.quantidade || 0) };
                    const restantes = Math.max(0, bloco.total - bloco.usados);

                    let inputQtdRef;
                    let selectRef;

                    return (
                      <div key={idx} className="produto-bloco">
                        <div className="produto-titulo">
                          <strong>{bloco.total}× {produto}</strong>
                          <span>Restantes: {restantes}</span>
                        </div>

                        <div className="linha-add">
                          <select ref={(r) => (selectRef = r)} defaultValue="">
                            <option value="" disabled>Sabor…</option>
                            {(SABORES[produto] || []).map(sb => (
                              <option key={sb} value={sb}>{sb}</option>
                            ))}
                          </select>
                          <input
                            ref={(r) => (inputQtdRef = r)}
                            type="number"
                            min="1"
                            inputMode="numeric"
                            placeholder="Qtd"
                            className="qtd"
                          />
                          <button
                            type="button"
                            className="btn-add"
                            onClick={() => {
                              const sabor = selectRef?.value;
                              const qtd = Number(inputQtdRef?.value || 0);
                              if (!sabor || !qtd) return;
                              handleAddLinha(p.id, produto, sabor, qtd);
                              if (inputQtdRef) inputQtdRef.value = "";
                              if (selectRef) selectRef.value = "";
                            }}
                          >
                            ➕ Adicionar
                          </button>
                        </div>

                        {bloco.linhas.length > 0 && (
                          <ul className="linhas-list">
                            {bloco.linhas.map((ln, li) => (
                              <li key={li}>
                                <span>{ln.qtd}× {ln.sabor}</span>
                                <button
                                  type="button"
                                  className="btn-x"
                                  onClick={() => handleExcluirLinha(p.id, produto, li)}
                                >
                                  ✖
                                </button>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    );
                  })}

                  <div className="acoes">
                    <button className="btn-salvar" onClick={() => handleSalvar(p)}>💾 Salvar Sabores</button>
                    <button className="btn-cancelar" onClick={() => setExpandedId(null)}>✖ Cancelar</button>
                  </div>
                </div>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}

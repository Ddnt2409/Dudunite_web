// src/pages/AliSab.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
  collection, query, where, getDocs, updateDoc, doc,
  serverTimestamp, Timestamp
} from "firebase/firestore";
import db from "../firebase";
import "./AliSab.css";

/* =========================================================
   SABORES – lista ampliada por tipo de produto
   (pode ajustar/ordenar como quiser)
========================================================= */
const SABORES = {
  "BROWNIE 7X7": [
    "Ninho", "Ninho com Nutella", "Brigadeiro branco",
    "Brigadeiro branco com confete", "Beijinho", "Oreo",
    "Ovomaltine", "Paçoca", "Bem casado", "Brigadeiro preto",
    "Brigadeiro preto com confete", "Palha italiana", "Prestígio",
    "KitKat", "Dois Amores"
  ],
  "BROWNIE 6X6": [
    "Ninho", "Ninho com Nutella", "Brigadeiro branco",
    "Brigadeiro branco com confete", "Beijinho", "Oreo",
    "Ovomaltine", "Paçoca", "Bem casado", "Brigadeiro preto",
    "Brigadeiro preto com confete", "Palha italiana", "Prestígio",
    "KitKat", "Dois Amores"
  ],
  "POCKET 5X5": [
    "Ninho", "Ninho com Nutella", "Brigadeiro branco",
    "Brigadeiro branco com confete", "Beijinho", "Oreo",
    "Ovomaltine", "Paçoca", "Bem casado", "Brigadeiro preto",
    "Brigadeiro preto com confete", "Palha italiana", "Prestígio",
    "KitKat", "Dois Amores"
  ],
  "POCKET 6X6": [
    "Ninho", "Ninho com Nutella", "Brigadeiro branco",
    "Brigadeiro branco com confete", "Beijinho", "Oreo",
    "Ovomaltine", "Paçoca", "Bem casado", "Brigadeiro preto",
    "Brigadeiro preto com confete", "Palha italiana", "Prestígio",
    "KitKat", "Dois Amores"
  ],
  "ESCONDIDINHO": [
    "Branco", "Preto", "Bem casado", "Ninho",
    "Ninho com Nutella", "Oreo", "Ovomaltine"
  ],
  "DUDU": [
    "Dd Oreo", "Dd Ovomaltine", "Dd Ninho com Nutella",
    "Dd Creme de Maracujá", "Dd KitKat", "Dd Paçoca"
  ],
};

/* =========================================================
   Normalização de nomes de produto do banco → chaves acima
========================================================= */
const normalizaProduto = (p) => {
  const t = (p || "").toUpperCase();
  if (t.includes("BRW 7")) return "BROWNIE 7X7";
  if (t.includes("BRW 6")) return "BROWNIE 6X6";
  if (t.includes("PKT 5")) return "POCKET 5X5";
  if (t.includes("PKT 6")) return "POCKET 6X6";
  if (t.startsWith("ESC")) return "ESCONDIDINHO";
  if (t.startsWith("DUDU")) return "DUDU";
  // se já vier “BROWNIE 7X7” etc, mantém
  if (t.includes("BROWNIE 7X7")) return "BROWNIE 7X7";
  if (t.includes("BROWNIE 6X6")) return "BROWNIE 6X6";
  if (t.includes("POCKET 5X5")) return "POCKET 5X5";
  if (t.includes("POCKET 6X6")) return "POCKET 6X6";
  return p || "—";
};

/* Próxima segunda às 23:59 (para esconder o carimbo) */
const proxSegunda = () => {
  const d = new Date();
  const dow = d.getDay(); // 0=Dom ... 1=Seg
  let add = (1 - dow + 7) % 7;
  if (add === 0) add = 7;
  d.setDate(d.getDate() + add);
  d.setHours(23, 59, 0, 0);
  return d;
};

export default function AliSab({ setTela }) {
  const [pedidos, setPedidos] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  // draft[pedidoId][produto] = {total, usados, linhas:[{sabor,qtd}]}
  const [draft, setDraft] = useState({});

  /* =======================
     Carrega pedidos
     (duas queries para evitar índice “IN”)
  ======================== */
  useEffect(() => {
    (async () => {
      const col = collection(db, "PEDIDOS");
      const q1 = query(col, where("statusEtapa", "==", "Lançado"));
      const q2 = query(col, where("statusEtapa", "==", "Alimentado"));
      const [s1, s2] = await Promise.all([getDocs(q1), getDocs(q2)]);
      const map = new Map();
      [...s1.docs, ...s2.docs].forEach(d => {
        const data = d.data() || {};
        map.set(d.id, { id: d.id, ...data, itens: Array.isArray(data.itens) ? data.itens : [] });
      });
      setPedidos(Array.from(map.values()));
    })();
  }, []);

  // quando abre um post-it, inicializa o draft dele
  useEffect(() => {
    if (!expandedId) return;
    const p = pedidos.find(x => x.id === expandedId);
    if (!p) return;

    setDraft(prev => {
      if (prev[expandedId]) return prev;
      const base = {};
      (p.itens || []).forEach(it => {
        const produto = normalizaProduto(it.produto);
        base[produto] = {
          linhas: [],
          usados: 0,
          total: Number(it.quantidade || 0),
        };
      });
      return { ...prev, [expandedId]: base };
    });
  }, [expandedId, pedidos]);

  const pedidosOrdenados = useMemo(
    () => [...pedidos].sort((a, b) => (a.escola || "").localeCompare(b.escola || "")),
    [pedidos]
  );

  /* =======================
     Draft helpers
  ======================== */
  const addLinha = (pid, produto, sabor, qtd) => {
    if (!sabor || !qtd) return;
    setDraft(prev => {
      const bloco = prev[pid]?.[produto];
      if (!bloco) return prev;
      const novosUsados = bloco.usados + Number(qtd);
      if (novosUsados > bloco.total) return prev;
      return {
        ...prev,
        [pid]: {
          ...prev[pid],
          [produto]: {
            ...bloco,
            usados: novosUsados,
            linhas: [...bloco.linhas, { sabor, qtd: Number(qtd) }]
          }
        }
      };
    });
  };

  const remLinha = (pid, produto, index) => {
    setDraft(prev => {
      const bloco = prev[pid]?.[produto];
      if (!bloco) return prev;
      const linhas = [...bloco.linhas];
      const removed = linhas.splice(index, 1)[0];
      const usados = bloco.usados - (removed?.qtd || 0);
      return {
        ...prev,
        [pid]: { ...prev[pid], [produto]: { ...bloco, usados, linhas } }
      };
    });
  };

  const mostraCarimbo = (p) => {
    if (p.statusEtapa !== "Alimentado") return false;
    const exp = p.carimboExpiraEm?.toDate?.();
    if (!exp) return true;         // sem data, mostra carimbo
    return new Date() < exp;       // antes da próxima segunda → mostra
  };

  const salvar = async (pedido) => {
    const dados = draft[pedido.id] || {};
    const sabores = {};
    Object.entries(dados).forEach(([produto, bloco]) => {
      sabores[produto] = bloco.linhas;
    });

    const exp = Timestamp.fromDate(proxSegunda());

    await updateDoc(doc(db, "PEDIDOS", pedido.id), {
      sabores,
      statusEtapa: "Alimentado",
      atualizadoEm: serverTimestamp(),
      carimboExpiraEm: exp,
    });

    setPedidos(prev =>
      prev.map(p => p.id === pedido.id ? { ...p, statusEtapa: "Alimentado", carimboExpiraEm: exp } : p)
    );
    setExpandedId(null);
  };

  return (
    <div className="alisab-container">
      <header className="alisab-header">
        <h2>🍫 Alimentar Sabores</h2>
        <button className="btn-voltar" onClick={() => setTela("HomePCP")}>
          🔙 Voltar ao PCP
        </button>
      </header>

      <div className="postits-list">
        {pedidosOrdenados.map((p, idx) => {
          const total = (p.itens || []).reduce((s, it) => s + Number(it.quantidade || 0), 0);
          const resumo = (p.itens || [])
            .map(it => `${Number(it.quantidade || 0)}× ${normalizaProduto(it.produto)}`)
            .join(", ");

          const ativo = expandedId === p.id;

          return (
            <article
              key={p.id}
              className={`postit ${idx % 2 ? "tilt-l" : "tilt-r"} ${ativo ? "ativo" : ""} ${mostraCarimbo(p) ? "carimbado" : ""}`}
              onClick={() => setExpandedId(ativo ? null : p.id)}
            >
              <span className="pin" aria-hidden="true" />
              <div className="postit-header">
                <div className="pdv">{p.escola || "—"}</div>
                <div className="resumo">{total}× — {resumo || "—"}</div>
              </div>

              {mostraCarimbo(p) && <span className="carimbo">ALIMENTADO</span>}

              {ativo && (
                <div className="postit-body" onClick={(e) => e.stopPropagation()}>
                  {(p.itens || []).map((it, i) => {
                    const produto = normalizaProduto(it.produto);
                    const bloco = draft[p.id]?.[produto] || { linhas: [], usados: 0, total: Number(it.quantidade || 0) };
                    const restantes = Math.max(0, bloco.total - bloco.usados);

                    let selectRef, qtdRef;

                    return (
                      <div key={i} className="produto-bloco">
                        <div className="produto-titulo">
                          <strong>{bloco.total}× {produto}</strong>
                          <span>Restantes: {restantes}</span>
                        </div>

                        <div className="linha-add">
                          <select ref={(r) => (selectRef = r)} defaultValue="">
                            <option value="" disabled>Sabor…</option>
                            {(SABORES[produto] || []).map(s => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </select>

                          <input
                            ref={(r) => (qtdRef = r)}
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
                              const qtd = Number(qtdRef?.value || 0);
                              if (!sabor || !qtd) return;
                              addLinha(p.id, produto, sabor, qtd);
                              if (qtdRef) qtdRef.value = "";
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
                                <button className="btn-x" onClick={() => remLinha(p.id, produto, li)}>✖</button>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    );
                  })}

                  <div className="acoes">
                    <button className="btn-salvar" onClick={() => salvar(p)}>💾 Salvar Sabores</button>
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

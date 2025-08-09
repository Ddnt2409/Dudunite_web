import React, { useEffect, useMemo, useState } from "react";
import {
  collection,
  getDocs,
  query,
  where,
  updateDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";
import db from "../firebase";
import "./AliSab.css";
import ERPHeader from "./ERPHeader";
import ERPFooter from "./ERPFooter";

/* ===========================
   Mapeamentos e constantes
=========================== */

// Normalização dos nomes de produtos (aceita códigos antigos)
const normalizeProduto = (p) => {
  const s = String(p || "").toLowerCase();
  if (s.includes("7x7")) return "BROWNIE 7X7";
  if (s.includes("6x6") && s.includes("brw")) return "BROWNIE 6X6";
  if (s.includes("pkt") && s.includes("5x5")) return "POCKET 5X5";
  if (s.includes("pkt") && s.includes("6x6")) return "POCKET 6X6";
  if (s.startsWith("esc") || s.includes("escond")) return "ESCONDIDINHO";
  if (s.includes("dudu")) return "DUDU";
  // já no padrão?
  const up = String(p || "").toUpperCase();
  return up;
};

// Lista de sabores por tipo de produto
const SABORES = {
  "BROWNIE 7X7": [
    "Ninho",
    "Ninho com Nutella",
    "Oreo",
    "Ovomaltine",
    "Beijinho",
    "Brigadeiro branco",
    "Brigadeiro branco com confete",
    "Bem casado",
    "Paçoca",
    "KitKat",
    "Brigadeiro preto",
    "Brigadeiro preto com confete",
    "Palha italiana",
  ],
  "BROWNIE 6X6": [
    "Ninho",
    "Ninho com Nutella",
    "Oreo",
    "Ovomaltine",
    "Beijinho",
    "Brigadeiro branco",
    "Brigadeiro branco com confete",
    "Bem casado",
    "Paçoca",
    "KitKat",
    "Brigadeiro preto",
    "Brigadeiro preto com confete",
    "Palha italiana",
  ],
  "POCKET 5X5": [
    "Ninho",
    "Ninho com Nutella",
    "Oreo",
    "Ovomaltine",
    "Beijinho",
    "Brigadeiro branco",
    "Brigadeiro branco com confete",
    "Bem casado",
    "Paçoca",
    "KitKat",
    "Brigadeiro preto",
    "Brigadeiro preto com confete",
    "Palha italiana",
  ],
  "POCKET 6X6": [
    "Ninho",
    "Ninho com Nutella",
    "Oreo",
    "Ovomaltine",
    "Beijinho",
    "Brigadeiro branco",
    "Brigadeiro branco com confete",
    "Bem casado",
    "Paçoca",
    "KitKat",
    "Brigadeiro preto",
    "Brigadeiro preto com confete",
    "Palha italiana",
  ],
  ESCONDIDINHO: [
    "Ninho",
    "Ninho com Nutella",
    "Oreo",
    "Ovomaltine",
    "Beijinho",
    "Brigadeiro branco",
    "Brigadeiro branco com confete",
    "Bem casado",
    "Paçoca",
    "KitKat",
    "Brigadeiro preto",
    "Brigadeiro preto com confete",
    "Palha italiana",
  ],
  DUDU: ["Dd Oreo", "Dd Ovomaltine", "Dd Ninho com Nutella", "Dd Creme de Maracujá", "Dd KitKat"],
};

// retorna um resumo "100× — 100× POCKET 6X6"
const resumoDosItens = (itens = []) => {
  if (!Array.isArray(itens)) return "—";
  const parts = itens.map((i) => {
    const qtd = Number(i?.quantidade || 0);
    const tipo = normalizeProduto(i?.produto);
    return `${qtd}× ${tipo}`;
  });
  return parts.join(", ");
};

// soma quantidades por produto normalizado
const totaisPorProduto = (itens = []) => {
  const acc = {};
  (itens || []).forEach((it) => {
    const tipo = normalizeProduto(it?.produto);
    const qtd = Number(it?.quantidade || 0);
    acc[tipo] = (acc[tipo] || 0) + qtd;
  });
  return acc;
};

/* ===========================
   Componente principal
=========================== */

export default function AliSab({ setTela }) {
  const [pedidos, setPedidos] = useState([]);
  const [expandedId, setExpandedId] = useState(null);

  // rascunho da linha por produto dentro do post-it aberto
  // { "BROWNIE 7X7": [{sabor,qtd}], "POCKET 5X5": [...] }
  const [linhas, setLinhas] = useState({});
  // selects/inputs atuais (draft) por produto
  const [draft, setDraft] = useState({}); // { [produto]: { sabor: "", qtd: "" } }

  // Carrega pedidos com status Lançado ou Alimentado
  useEffect(() => {
    (async () => {
      try {
        const pedidosRef = collection(db, "PEDIDOS");
        const q = query(
          pedidosRef,
          where("statusEtapa", "in", ["Lançado", "Alimentado"])
        );
        const snap = await getDocs(q);
        const list = snap.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            ...data,
            itens: Array.isArray(data.itens) ? data.itens : [],
          };
        });
        setPedidos(list);
      } catch (e) {
        console.error("Erro ao carregar pedidos:", e);
      }
    })();
  }, []);

  const abrirPostIt = (p) => {
    setExpandedId(p.id);
    // prepara estruturas locais
    const totals = totaisPorProduto(p.itens);
    const initialLinhas = {};
    const initialDraft = {};
    Object.keys(totals).forEach((prod) => {
      initialLinhas[prod] = []; // começa vazio
      initialDraft[prod] = { sabor: "", qtd: "" };
    });
    setLinhas(initialLinhas);
    setDraft(initialDraft);
  };

  const fecharPostIt = () => {
    setExpandedId(null);
    setLinhas({});
    setDraft({});
  };

  const pedidoAberto = useMemo(
    () => pedidos.find((x) => x.id === expandedId) || null,
    [expandedId, pedidos]
  );

  // calcula restantes por produto baseado nas linhas inseridas
  const restantes = (produto) => {
    if (!pedidoAberto) return 0;
    const totals = totaisPorProduto(pedidoAberto.itens);
    const usado = (linhas[produto] || []).reduce(
      (s, l) => s + Number(l.qtd || 0),
      0
    );
    return (totals[produto] || 0) - usado;
  };

  const onChangeDraft = (produto, campo, valor) => {
    setDraft((prev) => ({
      ...prev,
      [produto]: { ...(prev[produto] || {}), [campo]: valor },
    }));
  };

  const addLinha = (produto) => {
    const d = draft[produto] || {};
    const qtd = Number(d.qtd || 0);
    const sabor = (d.sabor || "").trim();
    if (!sabor || !qtd || qtd <= 0) return;
    const rest = restantes(produto);
    if (qtd > rest) {
      alert(`Quantidade excede o restante (${rest}).`);
      return;
    }
    setLinhas((prev) => ({
      ...prev,
      [produto]: [...(prev[produto] || []), { sabor, qtd }],
    }));
    // zera rascunho
    setDraft((prev) => ({ ...prev, [produto]: { sabor: "", qtd: "" } }));
  };

  const delLinha = (produto, idx) => {
    setLinhas((prev) => {
      const novo = { ...(prev || {}) };
      novo[produto] = (novo[produto] || []).filter((_, i) => i !== idx);
      return novo;
    });
  };

  const salvarSabores = async () => {
    if (!pedidoAberto) return;

    // valida: todos os produtos com suas somas <= total
    const totals = totaisPorProduto(pedidoAberto.itens);
    for (const produto of Object.keys(totals)) {
      const soma = (linhas[produto] || []).reduce(
        (s, l) => s + Number(l.qtd || 0),
        0
      );
      if (soma !== totals[produto]) {
        const rest = totals[produto] - soma;
        const msg =
          rest > 0
            ? `Faltam ${rest} para ${produto}.`
            : `Excedeu em ${Math.abs(rest)} para ${produto}.`;
        alert(
          `As quantidades de sabores precisam fechar o total do produto.\n${msg}`
        );
        return;
      }
    }

    // monta payload
    const payload = {
      saboresDetalhados: linhas, // { "BROWNIE 7X7": [{sabor,qtd}], ... }
      statusEtapa: "Alimentado",
      atualizadoEm: serverTimestamp(),
    };

    try {
      const ref = doc(db, "PEDIDOS", pedidoAberto.id);
      await updateDoc(ref, payload);

      // atualiza tela (mantém card, agora com carimbo)
      setPedidos((prev) =>
        prev.map((p) =>
          p.id === pedidoAberto.id ? { ...p, ...payload } : p
        )
      );

      fecharPostIt();
      alert("Sabores salvos com sucesso!");
    } catch (e) {
      console.error(e);
      alert("Erro ao salvar sabores.");
    }
  };

  return (
    <div className="alisab-container">
      {/* CABEÇALHO PADRÃO */}
      <ERPHeader title="PCP – Alimentar Sabores" />

      {/* Título pequeno/linha de status */}
      <div className="alisab-header">
        <h2>🍫 Alimentar Sabores <span className="versao-inline">– v-inline</span></h2>
        <button className="btn-voltar" onClick={() => setTela("HomePCP")}>
          Voltar ao PCP
        </button>
      </div>

      {/* LISTA DE POST-ITS (3 colunas via CSS) */}
      <div className="postits-list">
        {pedidos.map((p, idx) => {
          const resumo = resumoDosItens(p.itens);
          const totals = totaisPorProduto(p.itens);
          const tiltClass = idx % 2 === 0 ? "tilt-l" : "tilt-r";

          const isAtivo = expandedId === p.id;
          const isAlimentado = String(p.statusEtapa).toLowerCase() === "alimentado";

          return (
            <div
              key={p.id}
              className={`postit ${tiltClass} ${isAtivo ? "ativo" : ""}`}
              onClick={() => !isAtivo && abrirPostIt(p)}
            >
              {/* alfinete */}
              <span className="pin" />

              {/* dobra */}
              {/* (pseudo-elemento ::after no CSS) */}

              {/* carimbo ALIMENTADO */}
              {isAlimentado && <span className="carimbo">ALIMENTADO</span>}

              {/* cabeçalho do card */}
              <div className="postit-header">
                <div className="pdv">{p.escola || "—"}</div>
                <div className="resumo">{resumo || "—"}</div>
              </div>

              {/* corpo/expansão */}
              {isAtivo && (
                <div
                  className="postit-body"
                  onClick={(e) => e.stopPropagation()}
                >
                  {Object.keys(totals).map((produto) => {
                    const sabores = SABORES[produto] || [];
                    const rest = restantes(produto);
                    const d = draft[produto] || { sabor: "", qtd: "" };

                    return (
                      <div className="produto-bloco" key={produto}>
                        <div className="produto-titulo">
                          <div>
                            <strong>{totals[produto]}× {produto}</strong>
                            <span style={{ marginLeft: 8, opacity: 0.8 }}>
                              Restantes: {rest}
                            </span>
                          </div>
                        </div>

                        <div className="linha-add">
                          <select
                            value={d.sabor}
                            onChange={(e) =>
                              onChangeDraft(produto, "sabor", e.target.value)
                            }
                          >
                            <option value="">Sabor...</option>
                            {sabores.map((s) => (
                              <option key={s} value={s}>
                                {s}
                              </option>
                            ))}
                          </select>

                          <input
                            className="qtd"
                            type="number"
                            inputMode="numeric"
                            min="1"
                            placeholder="Qtd"
                            value={d.qtd}
                            onChange={(e) =>
                              onChangeDraft(produto, "qtd", e.target.value)
                            }
                          />

                          <button
                            type="button"
                            className="btn-add"
                            onClick={() => addLinha(produto)}
                          >
                            ➕ Adicionar
                          </button>
                        </div>

                        {/* linhas adicionadas */}
                        <ul className="linhas-list">
                          {(linhas[produto] || []).map((l, i) => (
                            <li key={i}>
                              <span>
                                {l.qtd}× {l.sabor}
                              </span>
                              <button
                                type="button"
                                className="btn-x"
                                aria-label="Remover"
                                onClick={() => delLinha(produto, i)}
                              >
                                ✕
                              </button>
                            </li>
                          ))}
                        </ul>
                      </div>
                    );
                  })}

                  <div className="acoes">
                    <button type="button" className="btn-salvar" onClick={salvarSabores}>
                      💾 Salvar Sabores
                    </button>
                    <button type="button" className="btn-cancelar" onClick={fecharPostIt}>
                      ✖ Cancelar
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* RODAPÉ PADRÃO */}
      <ERPFooter onBack={() => setTela("HomePCP")} />
    </div>
  );
        }

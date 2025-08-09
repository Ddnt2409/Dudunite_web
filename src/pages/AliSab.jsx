// src/pages/AliSab.jsx
import React, { useEffect, useMemo, useState } from "react";
import { collection, query, where, getDocs, updateDoc, doc } from "firebase/firestore";
import db from "../firebase";
import "./AliSab.css";

/** Sabores por tipo de produto — pode ajustar depois se quiser */
const SABORES_POR_PRODUTO = {
  "BRW 7x7": [
    "Ninho", "Ninho com Nutella", "Brigadeiro branco",
    "Oreo", "Ovomaltine", "Beijinho", "Paçoca",
    "Bem casado", "Brigadeiro preto", "Brigadeiro c confete",
    "Palha italiana", "Prestigio"
  ],
  "BRW 6x6": [
    "Ninho", "Ninho com Nutella", "Brigadeiro branco",
    "Oreo", "Ovomaltine", "Beijinho", "Paçoca",
    "Bem casado", "Brigadeiro preto", "Brigadeiro c confete",
    "Palha italiana", "Prestigio"
  ],
  "PKT 5x5": [
    "Ninho", "Ninho com Nutella", "Brigadeiro branco",
    "Oreo", "Ovomaltine", "Beijinho", "Paçoca",
    "Bem casado", "Brigadeiro preto", "Brigadeiro c confete",
    "Palha italiana", "Prestigio"
  ],
  "PKT 6x6": [
    "Ninho", "Ninho com Nutella", "Brigadeiro branco",
    "Oreo", "Ovomaltine", "Beijinho", "Paçoca",
    "Bem casado", "Brigadeiro preto", "Brigadeiro c confete",
    "Palha italiana", "Prestigio"
  ],
  "Esc": [
    "Ninho", "Ninho com Nutella", "Brigadeiro branco",
    "Oreo", "Ovomaltine", "Beijinho", "Paçoca",
    "Bem casado", "Brigadeiro preto", "Brigadeiro c confete",
    "Palha italiana", "Prestigio"
  ],
  "DUDU": [
    "Dd Oreo", "Dd Ovomaltine", "Dd Ninho com Nutella",
    "Dd Creme de Maracujá", "Dd KitKat"
  ],
};

/** normaliza rótulos de produto que vêm com variações de escrita */
function normalizaProduto(prod) {
  const t = String(prod || "").toUpperCase();
  if (t.includes("DUDU")) return "DUDU";
  if (t.includes("BRW") && t.includes("7X7")) return "BRW 7x7";
  if (t.includes("BRW") && t.includes("6X6")) return "BRW 6x6";
  if (t.includes("PKT") && t.includes("5X5")) return "PKT 5x5";
  if (t.includes("PKT") && t.includes("6X6")) return "PKT 6x6";
  if (t.includes("ESC")) return "Esc";
  return prod || "Outros";
}

/** soma utilitária */
const soma = (arr, sel = (x) => x) => arr.reduce((a, b) => a + sel(b), 0);

export default function AliSab({ setTela }) {
  const [pedidos, setPedidos] = useState([]);
  const [expandedId, setExpandedId] = useState(null);

  /** estado de distribuição para o pedido expandido
   * form: array por item do pedido -> { linhas: [{sabor, quantidade}], addSabor, addQtd }
   */
  const [dist, setDist] = useState([]); // uma entrada por item do pedido expandido

  useEffect(() => {
    (async () => {
      const q = query(collection(db, "PEDIDOS"), where("statusEtapa", "==", "Lançado"));
      const snap = await getDocs(q);
      const lista = snap.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          ...data,
          itens: Array.isArray(data.itens) ? data.itens : [],
        };
      });
      setPedidos(lista);
    })();
  }, []);

  /** quando abre um post-it, inicializa a estrutura de distribuição */
  function abrirPedido(p) {
    setExpandedId(p.id);
    // monta estrutura com uma "caixa" por item
    const novo = p.itens.map((it) => ({
      linhas: [],           // { sabor, quantidade }
      addSabor: "",         // select “temporário”
      addQtd: "",           // input “temporário”
    }));
    setDist(novo);
  }

  function fecharPedido() {
    setExpandedId(null);
    setDist([]);
  }

  /** helpers de totais/validações */
  function restanteDoItem(pedido, itemIdx) {
    const item = pedido.itens[itemIdx];
    const total = item?.quantidade || 0;
    const usado = soma(dist[itemIdx]?.linhas || [], (l) => Number(l.quantidade || 0));
    return Math.max(0, total - usado);
  }

  function addLinha(pedido, itemIdx) {
    const d = dist[itemIdx];
    const sabor = d.addSabor;
    const qtd = Number(d.addQtd);

    if (!sabor) return alert("Selecione um sabor.");
    if (!qtd || qtd <= 0) return alert("Informe uma quantidade válida.");
    const rest = restanteDoItem(pedido, itemIdx);
    if (qtd > rest) return alert(`Excede o restante (${rest}).`);

    // se já existe o sabor, acumula
    const ja = d.linhas.find((l) => l.sabor === sabor);
    let novas;
    if (ja) {
      ja.quantidade = Number(ja.quantidade) + qtd;
      novas = [...d.linhas];
    } else {
      novas = [...d.linhas, { sabor, quantidade: qtd }];
    }

    const copia = [...dist];
    copia[itemIdx] = { ...d, linhas: novas, addQtd: "", addSabor: "" };
    setDist(copia);
  }

  function removerLinha(itemIdx, sabor) {
    const d = dist[itemIdx];
    const novas = d.linhas.filter((l) => l.sabor !== sabor);
    const copia = [...dist];
    copia[itemIdx] = { ...d, linhas: novas };
    setDist(copia);
  }

  async function salvarDistribuicao(pedido) {
    // valida: cada item precisa somar exatamente a quantidade lançada
    for (let i = 0; i < pedido.itens.length; i++) {
      const totalItem = Number(pedido.itens[i]?.quantidade || 0);
      const usado = soma(dist[i]?.linhas || [], (l) => Number(l.quantidade || 0));
      if (usado !== totalItem) {
        return alert(
          `O item ${i + 1} (${pedido.itens[i].produto}) precisa fechar ${totalItem}. Atual: ${usado}.`
        );
      }
    }

    // agrega no formato {produto, quantidade, distribuicaoSabores:[{sabor, quantidade}]}
    const itensAtualizados = pedido.itens.map((it, i) => {
      const linhas = dist[i]?.linhas || [];
      // garante números
      const clean = linhas.map((l) => ({
        sabor: l.sabor,
        quantidade: Number(l.quantidade),
      }));
      return {
        ...it,
        distribuicaoSabores: clean,
      };
    });

    try {
      const ref = doc(db, "PEDIDOS", pedido.id);
      await updateDoc(ref, {
        itens: itensAtualizados,
        statusEtapa: "Alimentado",
        atualizadoEm: new Date(),
      });
      alert("Sabores salvos! ✅");
      // remove da tela (sumiu da fila)
      setPedidos((prev) => prev.filter((p) => p.id !== pedido.id));
      fecharPedido();
    } catch (e) {
      console.error(e);
      alert("Falha ao salvar sabores.");
    }
  }

  /** rótulo do cabeçalho do post-it */
  function cabecalhoPedido(p) {
    const total = soma(p.itens || [], (i) => Number(i.quantidade || 0));
    const produtos = (p.itens || []).map((i) => i.produto).join(", ");
    return `${p.escola || "—"} – ${total}× ${produtos}`;
  }

  /** classe extra pra desfocar os demais cards */
  const listClass = useMemo(
    () => `postits-list ${expandedId ? "has-active" : ""}`,
    [expandedId]
  );

  return (
    <div className="alisab-container">
      <header className="alisab-header">
        <h2>🍫 Alimentar Sabores</h2>
        <button onClick={() => setTela("HomePCP")} className="btn-voltar">
          🔙 Voltar ao PCP
        </button>
      </header>

      <div className={listClass}>
        {pedidos.length === 0 && <p>Nenhum pedido pendente.</p>}

        {pedidos.map((p) => {
          const ativo = expandedId === p.id;
          return (
            <div
              key={p.id}
              className={`postit ${ativo ? "ativo" : ""}`}
              onClick={!ativo ? () => abrirPedido(p) : undefined}
            >
              <div className="postit-cabecalho">{cabecalhoPedido(p)}</div>

              {/* Conteúdo quando expandido */}
              {ativo && (
                <div className="dist-wrapper" onClick={(e) => e.stopPropagation()}>
                  {(p.itens || []).map((item, idx) => {
                    const key = normalizaProduto(item.produto);
                    const opcoes = SABORES_POR_PRODUTO[key] || [];
                    const restante = restanteDoItem(p, idx);

                    return (
                      <div className="dist-card" key={`${p.id}-${idx}`}>
                        <div className="dist-titulo">
                          <strong>
                            {item.quantidade}× {item.produto}
                          </strong>
                          <span className={`restante ${restante === 0 ? "ok" : ""}`}>
                            Restantes: {restante}
                          </span>
                        </div>

                        {/* linhas já adicionadas */}
                        {dist[idx]?.linhas?.length > 0 && (
                          <ul className="linhas">
                            {dist[idx].linhas.map((l) => (
                              <li key={l.sabor}>
                                <span className="pill">
                                  {l.sabor} — <b>{l.quantidade}</b>
                                </span>
                                <button
                                  className="x"
                                  onClick={() => removerLinha(idx, l.sabor)}
                                  title="remover"
                                >
                                  ×
                                </button>
                              </li>
                            ))}
                          </ul>
                        )}

                        {/* formulário: sabor + qtd + adicionar */}
                        <div className="dist-form">
                          <select
                            value={dist[idx]?.addSabor || ""}
                            onChange={(e) => {
                              const c = [...dist];
                              c[idx] = { ...c[idx], addSabor: e.target.value };
                              setDist(c);
                            }}
                          >
                            <option value="">Sabor…</option>
                            {opcoes.map((s) => (
                              <option key={s} value={s}>
                                {s}
                              </option>
                            ))}
                          </select>

                          <input
                            type="number"
                            min="1"
                            inputMode="numeric"
                            placeholder="Qtd"
                            value={dist[idx]?.addQtd ?? ""}
                            onChange={(e) => {
                              const v = e.target.value;
                              const c = [...dist];
                              c[idx] = { ...c[idx], addQtd: v };
                              setDist(c);
                            }}
                          />

                          <button
                            className="btn-add"
                            onClick={() => addLinha(p, idx)}
                            disabled={restante === 0}
                          >
                            ➕ Adicionar
                          </button>
                        </div>
                      </div>
                    );
                  })}

                  <div className="acoes">
                    <button className="btn-salvar" onClick={() => salvarDistribuicao(p)}>
                      💾 Salvar Sabores
                    </button>
                    <button className="btn-cancelar" onClick={fecharPedido}>
                      ✖ Cancelar
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

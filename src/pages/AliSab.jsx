// src/pages/AliSab.jsx
import React, { useEffect, useState, useMemo } from "react";
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import db from "../firebase";
import "./AliSab.css";

const BG_URL = "/bg004.png"; // use uma das suas imagens de /public
const LOGO_URL = "/LogomarcaDDnt2025Vazado.png";

export default function AliSab({ setTela }) {
  const [pedidos, setPedidos] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [loading, setLoading] = useState(true);

  // sabores por produto (pode ampliar depois; mantive nomes “bonitos”)
  const saboresPorProduto = useMemo(
    () => ({
      "BROWNIE 7X7": [
        "Ninho",
        "Ninho com Nutella",
        "Brigadeiro branco",
        "Oreo",
        "Ovomaltine",
        "Beijinho",
        "Paçoca",
        "Bem casado",
      ],
      "BROWNIE 6X6": [
        "Ninho",
        "Ninho com Nutella",
        "Brigadeiro branco",
        "Oreo",
        "Ovomaltine",
        "Beijinho",
        "Paçoca",
        "Bem casado",
      ],
      "POCKET 5X5": [
        "Ninho",
        "Ninho com Nutella",
        "Brigadeiro",
        "Oreo",
        "Ovomaltine",
        "Beijinho",
        "Paçoca",
        "Bem casado",
      ],
      "POCKET 6X6": [
        "Ninho",
        "Ninho com Nutella",
        "Brigadeiro",
        "Oreo",
        "Ovomaltine",
        "Beijinho",
        "Paçoca",
        "Bem casado",
      ],
      ESCONDIDINHO: ["Ninho", "Ninho com Nutella", "Oreo", "Ovomaltine"],
      DUDU: ["Oreo", "Ovomaltine", "Ninho com Nutella", "Creme de Maracujá"],
    }),
    []
  );

  // mapeia siglas antigas => nomes novos exibidos
  const nomeProduto = (p) => {
    const map = {
      BRW: "BROWNIE",
      "BRW 7x7": "BROWNIE 7X7",
      "BRW 6x6": "BROWNIE 6X6",
      "PKT 5x5": "POCKET 5X5",
      "PKT 6x6": "POCKET 6X6",
      Esc: "ESCONDIDINHO",
      ESC: "ESCONDIDINHO",
      DUDU: "DUDU",
    };
    return map[p] || p;
  };

  // carrega pedidos (mantém Lançado e também os já Alimentados visíveis)
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const snap = await getDocs(collection(db, "PEDIDOS"));
        const lista = snap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .filter((p) =>
            ["Lançado", "Alimentado"].includes(p.statusEtapa || "Lançado")
          )
          .map((p) => ({
            ...p,
            itens: Array.isArray(p.itens) ? p.itens : [],
          }));
        setPedidos(lista);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // salva sabores no mesmo doc (sem remover da lista; apenas carimba)
  const salvarSabores = async (pedidoId, saboresSelecionadosPorProduto) => {
    const ref = doc(db, "PEDIDOS", pedidoId);
    await updateDoc(ref, {
      saboresSelecionados: saboresSelecionadosPorProduto,
      statusEtapa: "Alimentado",
      atualizadoEm: serverTimestamp(),
    });

    setPedidos((prev) =>
      prev.map((p) =>
        p.id === pedidoId
          ? {
              ...p,
              saboresSelecionados: saboresSelecionadosPorProduto,
              statusEtapa: "Alimentado",
            }
          : p
      )
    );
    setExpandedId(null);
  };

  // estado local para o formulário de um pedido expandido
  const [linhas, setLinhas] = useState({});
  useEffect(() => {
    if (!expandedId) return;
    const ped = pedidos.find((p) => p.id === expandedId);
    if (!ped) return;

    // cria estrutura inicial: uma entrada por produto do pedido
    const base = {};
    ped.itens.forEach((it, idx) => {
      const chave = `${idx}`;
      base[chave] = {
        produto: nomeProduto(it.produto),
        restantes: Number(it.quantidade || 0),
        entradas: [], // { sabor, qtd }
      };
    });
    setLinhas(base);
  }, [expandedId]); // eslint-disable-line

  const adicionarEntrada = (key) => {
    setLinhas((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        entradas: [...prev[key].entradas, { sabor: "", qtd: "" }],
      },
    }));
  };

  const atualizarEntrada = (key, idx, campo, valor) => {
    setLinhas((prev) => {
      const novo = { ...prev };
      novo[key].entradas[idx] = {
        ...novo[key].entradas[idx],
        [campo]: campo === "qtd" ? valor.replace(/\D/g, "") : valor,
      };
      return novo;
    });
  };

  const removerEntrada = (key, idx) => {
    setLinhas((prev) => {
      const novo = { ...prev };
      novo[key].entradas.splice(idx, 1);
      return novo;
    });
  };

  const restantesDoKey = (key) => {
    const bloco = linhas[key];
    if (!bloco) return 0;
    const usados = bloco.entradas.reduce(
      (s, e) => s + Number(e.qtd || 0),
      0
    );
    return Math.max(0, Number(bloco.restantes || 0) - usados);
  };

  const handleSalvarClick = () => {
    const payload = {};
    Object.entries(linhas).forEach(([k, bloco]) => {
      payload[bloco.produto] = bloco.entradas
        .filter((e) => e.sabor && Number(e.qtd) > 0)
        .map((e) => ({ sabor: e.sabor, qtd: Number(e.qtd) }));
    });
    salvarSabores(expandedId, payload);
  };

  return (
    <div
      className="alisab-page"
      style={{
        backgroundImage: `linear-gradient(180deg, rgba(255,245,230,.92), rgba(255,238,210,.92)), url('${BG_URL}')`,
      }}
    >
      {/* CABEÇALHO PADRÃO */}
      <header className="alisab-topbar">
        <div className="topbar-left">
          <img src={LOGO_URL} alt="Dudunitê" className="alisab-logo" />
          <span className="titulo-app">ERP DUDUNITÊ</span>
        </div>
        <h1 className="topbar-title">🍫 Alimentar Sabores</h1>
        <div className="topbar-right">
          <button className="btn-voltar" onClick={() => setTela("HomePCP")}>
            🔙 Voltar ao PCP
          </button>
        </div>
      </header>

      <main className="alisab-main">
        {loading && <p className="muted">Carregando…</p>}

        <div className="postits-grid">
          {pedidos.map((p) => {
            const total = p.itens.reduce(
              (s, it) => s + Number(it.quantidade || 0),
              0
            );
            const resumo = p.itens
              .map(
                (it) =>
                  `${Number(it.quantidade || 0)}x ${
                    nomeProduto(it.produto) || "-"
                  }`
              )
              .join(", ");

            const alimentado = p.statusEtapa === "Alimentado";

            return (
              <div
                key={p.id}
                className={`postit ${expandedId === p.id ? "ativo" : ""}`}
                onClick={() =>
                  setExpandedId(expandedId === p.id ? null : p.id)
                }
              >
                <span className="postit-pin" />
                <span className="orelha" />
                {alimentado && <span className="stamp">ALIMENTADO</span>}

                <div className="postit-head">
                  <h3 className="pdv">{p.escola || "—"}</h3>
                  <div className="resumo">
                    {total}× — {resumo || "—"}
                  </div>
                </div>

                {expandedId === p.id && (
                  <div
                    className="overlay"
                    onClick={(e) => {
                      // clique fora fecha
                      if (e.target.classList.contains("overlay")) {
                        setExpandedId(null);
                      }
                    }}
                  >
                    <div
                      className="modal-postit"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="modal-head">
                        <h2 className="pdv">{p.escola}</h2>
                        <div className="resumo">{resumo}</div>
                      </div>

                      {Object.entries(linhas).map(([key, bloco], idx) => {
                        const sabores =
                          saboresPorProduto[bloco.produto] || [];
                        return (
                          <div className="produto-bloco" key={key}>
                            <div className="produto-titulo">
                              <strong>
                                {bloco.restantes}× {bloco.produto}
                              </strong>
                              <span className="restantes">
                                Restantes: {restantesDoKey(key)}
                              </span>
                            </div>

                            <div className="entradas">
                              {bloco.entradas.map((e, i) => (
                                <div className="linha" key={i}>
                                  <select
                                    className="sel"
                                    value={e.sabor}
                                    onChange={(ev) =>
                                      atualizarEntrada(
                                        key,
                                        i,
                                        "sabor",
                                        ev.target.value
                                      )
                                    }
                                  >
                                    <option value="">Sabor…</option>
                                    {sabores.map((s) => (
                                      <option key={s} value={s}>
                                        {s}
                                      </option>
                                    ))}
                                  </select>
                                  <input
                                    className="qtd"
                                    inputMode="numeric"
                                    placeholder="Qtd"
                                    value={e.qtd}
                                    onChange={(ev) =>
                                      atualizarEntrada(
                                        key,
                                        i,
                                        "qtd",
                                        ev.target.value
                                      )
                                    }
                                  />
                                  <button
                                    className="btn-icon"
                                    onClick={() => removerEntrada(key, i)}
                                    title="Remover"
                                  >
                                    ✖
                                  </button>
                                </div>
                              ))}

                              <button
                                className="btn-add"
                                onClick={() => adicionarEntrada(key)}
                              >
                                ➕ Adicionar
                              </button>
                            </div>
                          </div>
                        );
                      })}

                      <div className="modal-actions">
                        <button className="btn-primary" onClick={handleSalvarClick}>
                          💾 Salvar Sabores
                        </button>
                        <button
                          className="btn-secondary"
                          onClick={() => setExpandedId(null)}
                        >
                          ✖ Cancelar
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </main>

      {/* RODAPÉ COM BOTÃO VOLTAR + MARQUEE */}
      <footer className="alisab-footer">
        <button className="btn-voltar large" onClick={() => setTela("HomePCP")}>
          🔙 Voltar ao PCP
        </button>

        <div className="lista-escolas">
          <span className="marquee-content">
            • Cruz • Pinheiros • Dourado • BMQ • CFC • Madre de Deus • Saber
            Viver • Interativo • Exato Sede • Exato Anexo • Society Show •
            Russas • Kaduh • Degusty • Bora Gastar • Salesianas • Céu Azul •
            Pequeno Príncipe • Tio Valter • Vera Cruz •
          </span>
        </div>
      </footer>
    </div>
  );
      }

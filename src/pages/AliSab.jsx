import React, { useEffect, useMemo, useState } from "react";
import {
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";
import db from "../firebase";

import ERPHeader from "./ERPHeader";
import ERPFooter from "./ERPFooter";
import "./AliSab.css";

/* =====================
 * MAPEAMENTOS / DADOS
 * ===================== */
const PRODUTO_NOMES = {
  "BRW 7x7": "BROWNIE 7X7",
  "BRW 6x6": "BROWNIE 6X6",
  "BRW 6X6": "BROWNIE 6X6",
  "PKT 5x5": "POCKET 5X5",
  "PKT 6x6": "POCKET 6X6",
  "ESC": "ESCONDIDINHO",
  "Esc": "ESCONDIDINHO",
  "ESCONDIDINHO": "ESCONDIDINHO",
  "DUDU": "DUDU",
};

const SABORES_POR_PRODUTO = {
  "BROWNIE 7X7": [
    "Ninho","Ninho com Nutella","Oreo","Ovomaltine","Beijinho",
    "Brigadeiro branco","Brigadeiro branco com confete",
    "Bem casado","Paçoca","KitKat","Brigadeiro preto",
    "Brigadeiro preto com confete","Palha italiana","Prestigio"
  ],
  "BROWNIE 6X6": [
    "Ninho","Ninho com Nutella","Oreo","Ovomaltine","Beijinho",
    "Brigadeiro branco","Brigadeiro branco com confete",
    "Bem casado","Paçoca","KitKat","Brigadeiro preto",
    "Brigadeiro preto com confete","Palha italiana","Prestigio"
  ],
  "POCKET 5X5": [
    "Ninho","Ninho com Nutella","Oreo","Ovomaltine","Beijinho",
    "Brigadeiro branco","Brigadeiro branco com confete",
    "Bem casado","Paçoca","KitKat","Brigadeiro preto",
    "Brigadeiro preto com confete","Palha italiana","Prestigio"
  ],
  "POCKET 6X6": [
    "Ninho","Ninho com Nutella","Oreo","Ovomaltine","Beijinho",
    "Brigadeiro branco","Brigadeiro branco com confete",
    "Bem casado","Paçoca","KitKat","Brigadeiro preto",
    "Brigadeiro preto com confete","Palha italiana","Prestigio"
  ],
  "ESCONDIDINHO": [
    "Ninho","Ninho com Nutella","Oreo","Ovomaltine","Beijinho",
    "Brigadeiro branco","Brigadeiro branco com confete",
    "Bem casado","Paçoca","KitKat","Brigadeiro preto",
    "Brigadeiro preto com confete","Palha italiana","Prestigio"
  ],
  "DUDU": ["Dd Oreo","Dd Ovomaltine","Dd Ninho com Nutella","Dd Creme de Maracujá","Dd KitKat"]
};

/* ================ */
function normalizaProduto(p) {
  if (!p) return p;
  return PRODUTO_NOMES[p] || PRODUTO_NOMES[p.toUpperCase()] || p;
}

function proximaSegunda(d) {
  // retorna a 00:00 da próxima segunda a partir de 'd'
  const base = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const day = base.getDay(); // 0 = dom, 1 = seg, ...
  const add = (8 - day) % 7 || 7;
  const target = new Date(base);
  target.setDate(base.getDate() + add);
  return target;
}

export default function AliSab({ setTela }) {
  const [pedidos, setPedidos] = useState([]);
  const [expandedId, setExpandedId] = useState(null);

  // formState[pedidoId] = { [produtoDisplay]: { linhas:[{sabor,qtd}], restante:number } }
  const [formState, setFormState] = useState({});

  /* =====================
   * CARREGAR PEDIDOS
   * ===================== */
  useEffect(() => {
    (async () => {
      const col = collection(db, "PEDIDOS");

      // “Lançado”
      const qA = query(col, where("statusEtapa", "==", "Lançado"));
      const snapA = await getDocs(qA);

      // “Alimentado” também aparece (com carimbo)
      const qB = query(col, where("statusEtapa", "==", "Alimentado"));
      const snapB = await getDocs(qB);

      const parse = (docSnap) => {
        const data = docSnap.data();
        const itens = Array.isArray(data.itens) ? data.itens : [];
        const itensFmt = itens.map((it) => ({
          produtoRaw: it.produto,
          produto: normalizaProduto(it.produto),
          quantidade: Number(it.quantidade || 0),
        }));
        return {
          id: docSnap.id,
          escola: data.escola || "—",
          cidade: data.cidade || "",
          criadoEm: data.criadoEm?.toDate?.() || new Date(),
          statusEtapa: data.statusEtapa || "Lançado",
          dataAlimentado: data.dataAlimentado?.toDate?.() || null,
          sabores: data.sabores || null, // estrutura salva anteriormente
          itens: itensFmt,
        };
      };

      const lista = [...snapA.docs.map(parse), ...snapB.docs.map(parse)]
        // ordena por nome da escola (dentro da linha)
        .sort((a, b) => a.escola.localeCompare(b.escola));

      setPedidos(lista);

      // prepara estado de formulário (restantes)
      const initial = {};
      lista.forEach((p) => {
        const st = {};
        p.itens.forEach((it) => {
          const key = it.produto;
          st[key] = st[key] || { linhas: [], restante: it.quantidade };
        });

        // se já possui sabores alimentados no banco, carrega para exibição/edição
        if (p.sabores && typeof p.sabores === "object") {
          Object.entries(p.sabores).forEach(([prod, linhas]) => {
            const soma = linhas.reduce((acc, l) => acc + Number(l.qtd || 0), 0);
            if (!st[prod]) st[prod] = { linhas: [], restante: 0 };
            st[prod].linhas = linhas.map((l) => ({ sabor: l.sabor, qtd: Number(l.qtd || 0) }));
            const pedido = p.itens.find((x) => x.produto === prod);
            const total = pedido?.quantidade || soma;
            st[prod].restante = Math.max(0, total - soma);
          });
        }

        initial[p.id] = st;
      });
      setFormState(initial);
    })();
  }, []);

  /* =====================
   * REGRAS DE CARIMBO
   * ===================== */
  const agora = useMemo(() => new Date(), []);
  function mostrarCarimbo(p) {
    if (p.statusEtapa !== "Alimentado") return false;
    const base = p.dataAlimentado || p.criadoEm;
    const limite = proximaSegunda(base);
    return agora < limite;
  }

  /* =====================
   * FORM: adicionar / remover linhas
   * ===================== */
  function addLinha(pedidoId, prod, sabor, qtd) {
    if (!sabor || !qtd) return;
    qtd = Number(qtd);
    if (qtd <= 0) return;

    setFormState((prev) => {
      const novo = { ...prev };
      const st = { ...(novo[pedidoId] || {}) };
      const bloco = { ...(st[prod] || { linhas: [], restante: 0 }) };

      const permitido = Math.max(0, Math.min(qtd, bloco.restante));
      if (permitido === 0) return prev;

      bloco.linhas = [...bloco.linhas, { sabor, qtd: permitido }];
      bloco.restante = Math.max(0, bloco.restante - permitido);

      st[prod] = bloco;
      novo[pedidoId] = st;
      return novo;
    });
  }

  function removeLinha(pedidoId, prod, index) {
    setFormState((prev) => {
      const novo = { ...prev };
      const st = { ...(novo[pedidoId] || {}) };
      const bloco = { ...(st[prod] || { linhas: [], restante: 0 }) };
      const linha = bloco.linhas[index];
      if (!linha) return prev;

      bloco.linhas = bloco.linhas.filter((_, i) => i !== index);
      bloco.restante += Number(linha.qtd || 0);

      st[prod] = bloco;
      novo[pedidoId] = st;
      return novo;
    });
  }

  /* =====================
   * SALVAR NO FIRESTORE
   * ===================== */
  async function salvarSabores(pedido) {
    const st = formState[pedido.id] || {};
    // monta objeto compacto: { "BROWNIE 6X6": [{sabor,qtd}, ...], ... }
    const payload = {};
    Object.entries(st).forEach(([prod, dados]) => {
      if (dados.linhas.length) payload[prod] = dados.linhas;
    });

    const ref = doc(db, "PEDIDOS", pedido.id);
    await updateDoc(ref, {
      sabores: payload,
      statusEtapa: "Alimentado",
      dataAlimentado: serverTimestamp(),
      atualizadoEm: serverTimestamp(),
    });

    // marca localmente (mantém na grade com carimbo)
    setPedidos((prev) =>
      prev.map((p) =>
        p.id === pedido.id
          ? {
              ...p,
              statusEtapa: "Alimentado",
              sabores: payload,
              dataAlimentado: new Date(),
            }
          : p
      )
    );

    setExpandedId(null);
  }

  /* =====================
   * RENDER
   * ===================== */
  return (
    <>
      <ERPHeader title="PCP – Alimentar Sabores" />

      <main className="alisab-main">
        <div className="alisab-header">
          <div className="alisab-title">
            <span role="img" aria-label="chocolate">🍫</span> Alimentar Sabores
          </div>
          {/* (o rodapé já tem o botão Voltar) */}
        </div>

        <section className="postits-list">
          {pedidos.map((p, idx) => {
            const ativo = expandedId === p.id;
            const tilt = idx % 2 ? "tilt-r" : "tilt-l";
            const totalUn = p.itens.reduce((s, i) => s + (i.quantidade || 0), 0);

            return (
              <article
                key={p.id}
                className={`postit ${tilt} ${ativo ? "ativo" : ""}`}
                onClick={() => setExpandedId(ativo ? null : p.id)}
              >
                <i className="pin" aria-hidden />
                <div className="postit-header">
                  <div className="pdv">{p.escola}</div>
                  <div className="resumo">
                    {totalUn}× —{" "}
                    {p.itens.map((it, i) => (
                      <span key={i}>
                        {it.quantidade}× {it.produto}
                        {i < p.itens.length - 1 ? ", " : ""}
                      </span>
                    ))}
                  </div>
                </div>

                {mostrarCarimbo(p) && <div className="carimbo">ALIMENTADO</div>}

                {ativo && (
                  <div className="postit-body" onClick={(e) => e.stopPropagation()}>
                    {p.itens.map((it, i) => {
                      const prod = it.produto;
                      const sabores = SABORES_POR_PRODUTO[prod] || [];
                      const bloco = (formState[p.id] && formState[p.id][prod]) || {
                        linhas: [],
                        restante: it.quantidade,
                      };

                      // local controls (sem state global para inputs)
                      let selectRef, qtdRef;

                      return (
                        <div className="produto-bloco" key={i}>
                          <div className="produto-titulo">
                            <div>
                              <strong>{it.quantidade}× {prod}</strong>
                              <span className="restantes">
                                &nbsp;Restantes: {bloco.restante}
                              </span>
                            </div>
                          </div>

                          <div className="linha-add">
                            <select
                              ref={(r) => (selectRef = r)}
                              defaultValue=""
                            >
                              <option value="" disabled>
                                Sabor...
                              </option>
                              {sabores.map((s) => (
                                <option key={s} value={s}>{s}</option>
                              ))}
                            </select>
                            <input
                              ref={(r) => (qtdRef = r)}
                              type="number"
                              min="1"
                              className="qtd"
                              placeholder="Qtd"
                            />
                            <button
                              type="button"
                              className="btn-add"
                              onClick={() =>
                                addLinha(
                                  p.id,
                                  prod,
                                  selectRef?.value || "",
                                  qtdRef?.value || ""
                                )
                              }
                            >
                              ＋ Adicionar
                            </button>
                          </div>

                          {!!bloco.linhas.length && (
                            <ul className="linhas-list">
                              {bloco.linhas.map((ln, j) => (
                                <li key={j}>
                                  <span>
                                    {ln.qtd}× {ln.sabor}
                                  </span>
                                  <button
                                    type="button"
                                    className="btn-x"
                                    onClick={() => removeLinha(p.id, prod, j)}
                                  >
                                    ×
                                  </button>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      );
                    })}

                    <div className="acoes">
                      <button
                        type="button"
                        className="btn-salvar"
                        onClick={() => salvarSabores(p)}
                      >
                        💾 Salvar Sabores
                      </button>
                      <button
                        type="button"
                        className="btn-cancelar"
                        onClick={() => setExpandedId(null)}
                      >
                        ✖ Cancelar
                      </button>
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </section>
      </main>

      <ERPFooter onBack={() => setTela("HomePCP")} />
    </>
  );
              }

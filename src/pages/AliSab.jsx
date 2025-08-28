// src/pages/AliSab.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
  collection, query, where, getDocs,
  updateDoc, doc, serverTimestamp, deleteDoc
} from "firebase/firestore";
import db from "../firebase";

import ERPHeader from "./ERPHeader";
import ERPFooter from "./ERPFooter";
import "./AliSab.css";

import {
  upsertPedidoInCiclo,
  deletePedidoInCiclo,
  semanaRefFromDate
} from "../util/Ciclo";

// espelho para a coleção usada pela Cozinha
import { upsertAlimentadoCozinha } from "../util/cozinha_store";

/* ====== MAPEAMENTOS ====== */
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
  "BROWNIE 7X7": ["Ninho","Ninho com Nutella","Oreo","Ovomaltine","Beijinho","Brigadeiro branco","Brigadeiro branco com confete","Bem casado","Paçoca","KitKat","Brigadeiro preto","Brigadeiro preto com confete","Palha italiana","Prestigio"],
  "BROWNIE 6X6": ["Ninho","Ninho com Nutella","Oreo","Ovomaltine","Beijinho","Brigadeiro branco","Brigadeiro branco com confete","Bem casado","Paçoca","KitKat","Brigadeiro preto","Brigadeiro preto com confete","Palha italiana","Prestigio"],
  "POCKET 5X5":  ["Ninho","Ninho com Nutella","Oreo","Ovomaltine","Beijinho","Brigadeiro branco","Brigadeiro branco com confete","Bem casado","Paçoca","KitKat","Brigadeiro preto","Brigadeiro preto com confete","Palha italiana","Prestigio"],
  "POCKET 6X6":  ["Ninho","Ninho com Nutella","Oreo","Ovomaltine","Beijinho","Brigadeiro branco","Brigadeiro branco com confete","Bem casado","Paçoca","KitKat","Brigadeiro preto","Brigadeiro preto com confete","Palha italiana","Prestigio"],
  "ESCONDIDINHO":["Ninho","Ninho com Nutella","Oreo","Ovomaltine","Beijinho","Brigadeiro branco","Brigadeiro branco com confete","Bem casado","Paçoca","KitKat","Brigadeiro preto","Brigadeiro preto com confete","Palha italiana","Prestigio"],
  "DUDU": ["Dd Oreo","Dd Ovomaltine","Dd Ninho com Nutella","Dd Creme de Maracujá","Dd KitKat"]
};

/* ====== JANELA SEMANAL ====== */
function intervaloSemanaBase(ref = new Date()) {
  const d = new Date(ref);
  const dow = (d.getDay() + 6) % 7; // seg=0
  d.setHours(11, 0, 0, 0);
  d.setDate(d.getDate() - dow);
  const ini = new Date(d);
  const fim = new Date(d);
  fim.setDate(fim.getDate() + 7);
  return { ini, fim };
}
function dentroDaSemanaDoc(d, ini, fim) {
  const cand =
    d?.createdEm?.toDate?.() ||
    d?.criadoEm?.toDate?.() ||
    d?.atualizadoEm?.toDate?.() ||
    d?.dataAlimentado?.toDate?.();
  if (!cand) return false;
  return cand >= ini && cand < fim;
}
function normalizaProduto(p) {
  if (!p) return p;
  return PRODUTO_NOMES[p] || PRODUTO_NOMES[p.toUpperCase()] || p;
}
function proximaSegunda(d) {
  const base = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const day = base.getDay();
  const add = (8 - day) % 7 || 7;
  const target = new Date(base);
  target.setDate(base.getDate() + add);
  return target;
}

/* ====== COMPONENTE ====== */
export default function AliSab({ setTela }) {
  const [pedidos, setPedidos] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  // formState[pedidoId] = { [produto]: { linhas:[{sabor,qtd}], restante } }
  const [formState, setFormState] = useState({});

  // carregar pedidos da semana
  useEffect(() => {
    (async () => {
      const { ini, fim } = intervaloSemanaBase(new Date());

      const col = collection(db, "PEDIDOS");
      const qA = query(col, where("statusEtapa", "==", "Lançado"));
      const qB = query(col, where("statusEtapa", "==", "Alimentado"));
      const [snapA, snapB] = await Promise.all([getDocs(qA), getDocs(qB)]);

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
          criadoEm: data.criadoEm?.toDate?.() || data.createdEm?.toDate?.() || null,
          statusEtapa: data.statusEtapa || "Lançado",
          dataAlimentado: data.dataAlimentado?.toDate?.() || null,
          sabores: data.sabores || null,
          itens: itensFmt,
        };
      };

      const docsSemana = [...snapA.docs, ...snapB.docs]
        .filter((d) => dentroDaSemanaDoc(d.data(), ini, fim));

      const lista = docsSemana.map(parse).sort((a, b) => a.escola.localeCompare(b.escola));
      setPedidos(lista);

      const initial = {};
      lista.forEach((p) => {
        const st = {};
        p.itens.forEach((it) => {
          const key = it.produto;
          st[key] = st[key] || { linhas: [], restante: it.quantidade };
        });
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

  /* carimbo ALIMENTADO válido até a próxima segunda do carimbo */
  const agora = useMemo(() => new Date(), []);
  function mostrarCarimbo(p) {
    if (p.statusEtapa !== "Alimentado") return false;
    const base = p.dataAlimentado || p.criadoEm || new Date();
    const limite = proximaSegunda(base);
    return agora < limite;
  }

  /* linhas de sabor */
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

  /* salvar / reabrir / excluir */
  async function salvarSabores(pedido) {
    try {
      const st = formState[pedido.id] || {};
      const payload = {};
      Object.entries(st).forEach(([prod, dados]) => {
        if (dados.linhas.length) payload[prod] = dados.linhas;
      });

      // 1) Atualiza raiz
      const ref = doc(db, "PEDIDOS", pedido.id);
      await updateDoc(ref, {
        sabores: payload,
        statusEtapa: "Alimentado",
        dataAlimentado: serverTimestamp(),
        atualizadoEm: serverTimestamp(),
        semanaPath: semanaRefFromDate(pedido.criadoEm || new Date()).path,
      });

      // 2) Espelha no ciclo semanal
      await upsertPedidoInCiclo(
        pedido.id,
        {
          ...pedido,
          sabores: payload,
          statusEtapa: "Alimentado",
          dataAlimentado: new Date(),
        },
        pedido.criadoEm || new Date()
      );

      // 3) Espelha na coleção da Cozinha (pcp_pedidos)
      const dataPrev = (pedido.criadoEm instanceof Date)
        ? toYMD(pedido.criadoEm)
        : toYMD(new Date());

      await upsertAlimentadoCozinha(pedido.id, {
        cidade: pedido.cidade || "Gravatá",
        pdv: pedido.escola,
        itens: (pedido.itens || []).map(it => ({
          produto: it.produto,
          qtd: Number(it.quantidade || 0),
        })),
        sabores: payload,
        dataPrevista: dataPrev,
      });

      // estado local
      setPedidos((prev) =>
        prev.map((p) =>
          p.id === pedido.id
            ? { ...p, statusEtapa: "Alimentado", sabores: payload, dataAlimentado: new Date() }
            : p
        )
      );
      setExpandedId(null);
    } catch (err) {
      console.error("Erro ao salvar sabores:", err);
      alert("Erro ao salvar sabores: " + (err?.message || err));
    }
  }

  async function reabrirPedido(pedido) {
    if (!confirm("Reabrir este pedido? Ele voltará para 'Lançado'.")) return;

    const ref = doc(db, "PEDIDOS", pedido.id);
    await updateDoc(ref, {
      statusEtapa: "Lançado",
      atualizadoEm: serverTimestamp(),
    });

    await upsertPedidoInCiclo(
      pedido.id,
      { ...pedido, statusEtapa: "Lançado" },
      pedido.criadoEm || new Date()
    );

    setPedidos((prev) => prev.map((p) => (p.id === pedido.id ? { ...p, statusEtapa: "Lançado" } : p)));
    setExpandedId(null);
  }

  async function excluirPedido(pedido) {
    if (!confirm("Excluir este pedido? Esta ação não pode ser desfeita.")) return;

    await deleteDoc(doc(db, "PEDIDOS", pedido.id));
    await deletePedidoInCiclo(pedido.id, pedido.criadoEm || new Date());

    setPedidos((prev) => prev.filter((p) => p.id !== pedido.id));
    setExpandedId(null);
  }

  /* ====== RENDER ====== */
  return (
    <>
      <ERPHeader title="PCP – Alimentar Sabores" />

      <main className="alisab-main">
        <div className="alisab-header">
          <div className="alisab-title">
            <span role="img" aria-label="chocolate">🍫</span> Alimentar Sabores
          </div>
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
                            <select ref={(r) => (selectRef = r)} defaultValue="">
                              <option value="" disabled>Sabor...</option>
                              {sabores.map((s) => (<option key={s} value={s}>{s}</option>))}
                            </select>
                            <input ref={(r) => (qtdRef = r)} type="number" min="1" className="qtd" placeholder="Qtd" />
                            <button
                              type="button"
                              className="btn-add"
                              onClick={() => addLinha(p.id, prod, selectRef?.value || "", qtdRef?.value || "")}
                            >
                              ＋ Adicionar
                            </button>
                          </div>

                          {!!bloco.linhas.length && (
                            <ul className="linhas-list">
                              {bloco.linhas.map((ln, j) => (
                                <li key={j}>
                                  <span>{ln.qtd}× {ln.sabor}</span>
                                  <button type="button" className="btn-x" onClick={() => removeLinha(p.id, prod, j)}>×</button>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      );
                    })}

                    <div className="acoes">
                      <button type="button" className="btn-salvar" onClick={() => salvarSabores(p)}>
                        💾 Salvar Sabores
                      </button>
                      <button type="button" className="btn-outline" onClick={() => reabrirPedido(p)}>
                        ↩ Reabrir
                      </button>
                      <button type="button" className="btn-danger" onClick={() => excluirPedido(p)}>
                        🗑 Excluir
                      </button>
                      <button type="button" className="btn-cancelar" onClick={() => setExpandedId(null)}>
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

/* util local */
function toYMD(d) {
  const x = new Date(d);
  const m = String(x.getMonth() + 1).padStart(2, "0");
  const day = String(x.getDate()).padStart(2, "0");
  return `${x.getFullYear()}-${m}-${day}`;
          }

// src/pages/StaPed.jsx
import React, { useEffect, useRef, useState } from "react";
import { collection, onSnapshot, query, where, Timestamp } from "firebase/firestore";
import db from "../firebase";

import ERPHeader from "./ERPHeader";
import ERPFooter from "./ERPFooter";
import "./StaPed.css";

import StaPedActions from "./StaPedActions";
import { PDVs_VALIDOS, totalPDVsValidos } from "../util/PDVsValidos";
import { caminhoCicloFromDate } from "../util/Ciclo";

/* ===== Helpers ===== */
const rmAcc = (s) => String(s || "")
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .trim()
  .toUpperCase();

const keyPDV = (cidade, pdv) => `${rmAcc(cidade)}::${rmAcc(pdv)}`;

function normStatus(raw) {
  const s = String(raw || "").toLowerCase();
  if (s.includes("produz")) return "Produzido";
  if (s.includes("aliment")) return "Alimentado";
  if (s.includes("lanç") || s.includes("lanc") || s === "pendente") return "Lançado";
  return "Lançado";
}

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

function dentroDaSemana(docData, ini, fim) {
  const cand =
    docData?.createdEm?.toDate?.() ||
    docData?.criadoEm?.toDate?.() ||
    docData?.atualizadoEm?.toDate?.() ||
    docData?.dataAlimentado?.toDate?.() ||
    null;
  if (!cand) return true;
  return cand >= ini && cand < fim;
}

/** Marca como produzido considerando várias formas que a Cozinha pode usar */
function isProduzidoCozinha(d = {}) {
  const s = String(d.statusEtapa || d?.pcp?.status || d.status || "").toLowerCase();
  if (s.includes("produz")) return true;

  if (d.produzido === true || d?.pcp?.produzido === true) return true;

  const badge = String(d.badge || d.selo || d.etiqueta || "").toLowerCase();
  if (badge.includes("produz")) return true;

  return false;
}
/* ==================== */

export default function StaPed({ setTela }) {
  const [counts, setCounts]   = useState({ Pendente: 0, Lançado: 0, Alimentado: 0, Produzido: 0 });
  const [pedidos, setPedidos] = useState([]);
  const [semanaVazia, setSemanaVazia] = useState(false);

  const [listaPendentes, setListaPendentes]     = useState([]);
  const [listaLancados, setListaLancados]       = useState([]);
  const [listaAlimentados, setListaAlimentados] = useState([]);
  const [listaProduzidos, setListaProduzidos]   = useState([]);

  // set de PDVs produzidos vindos da coleção da Cozinha
  const cozinhaProdSetRef = useRef(new Set());

  // snapshot e metadados mais recentes da semana/raiz
  const lastDocsRef = useRef([]);   // [{ data }]
  const lastMetaRef = useRef(null); // { ini, fim, from }

  const unsubRootRef    = useRef(null);
  const unsubRootAllRef = useRef(null);

  /* ---------- Reprocessa tudo quando muda Cozinha ou Semana/Raiz ---------- */
  const recompute = () => {
    const meta = lastMetaRef.current;
    const docs = lastDocsRef.current;
    if (!meta || !Array.isArray(docs)) return;

    const { ini, fim, from } = meta;
    const cozinhaSet = cozinhaProdSetRef.current || new Set();

    // Mapa por PDV com prioridade de status
    const pri = { "Lançado": 1, "Alimentado": 2, "Produzido": 3 };
    const byKey = new Map();

    docs.forEach(({ data: d }) => {
      if ((from?.startsWith("root") || from === "weekly-root") && !dentroDaSemana(d, ini, fim)) return;

      const cidade = d.cidade || d.city || "";
      const pdv    = d.pdv || d.escola || "";
      if (!cidade || !pdv) return;

      const k   = keyPDV(cidade, pdv);
      let stat  = normStatus(d.statusEtapa);

      // sobreposição da Cozinha
      if (cozinhaSet.has(k)) stat = "Produzido";

      const cur = byKey.get(k);
      if (!cur || pri[stat] > pri[cur.status]) {
        byKey.set(k, {
          cidade,
          pdv,
          status: stat,
          itens: Array.isArray(d.itens) ? d.itens : (Array.isArray(d.items) ? d.items : []),
          sabores: d.sabores || null
        });
      }
    });

    // Listas finais
    const lancados    = [];
    const alimentados = [];
    const produzidos  = [];
    byKey.forEach((v) => {
      if (v.status === "Lançado")    lancados.push({ cidade: v.cidade, pdv: v.pdv });
      if (v.status === "Alimentado") alimentados.push({ cidade: v.cidade, pdv: v.pdv });
      if (v.status === "Produzido")  produzidos.push({ cidade: v.cidade, pdv: v.pdv });
    });

    // Pendentes com base no mestre
    const presentes = new Set([...byKey.keys()]);
    const pend = [];
    PDVs_VALIDOS.forEach(({ cidade, pdvs }) => {
      pdvs.forEach((p) => {
        const k = keyPDV(cidade, p);
        if (!presentes.has(k)) pend.push({ cidade, pdv: p });
      });
    });

    const ord = (a, b) => (a.cidade === b.cidade ? a.pdv.localeCompare(b.pdv) : a.cidade.localeCompare(b.cidade));
    setListaPendentes(pend);
    setListaLancados(lancados.sort(ord));
    setListaAlimentados(alimentados.sort(ord));
    setListaProduzidos(produzidos.sort(ord));

    setCounts({
      Pendente: pend.length || Math.max(totalPDVsValidos() - presentes.size, 0),
      Lançado: lancados.length,
      Alimentado: alimentados.length,
      Produzido: produzidos.length,
    });

    // para exportações/ações
    setPedidos(
      Array.from(byKey.values()).map(({ cidade, pdv, itens, sabores, status }) => ({ cidade, pdv, itens, sabores, statusEtapa: status }))
    );
    setSemanaVazia(byKey.size === 0);
  };

  /* ---------- 1) Assina COZINHA (pcp_pedidos) ---------- */
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "pcp_pedidos"), (snap) => {
      const set = new Set();
      snap.forEach((docu) => {
        const d = docu.data() || {};
        if (!isProduzidoCozinha(d)) return;

        // aceita múltiplas formas de armazenar cidade/pdv
        const cidade = d.cidade || d.city || d?.local?.cidade || "";
        const pdv    = d.pdv    || d.escola || d?.local?.pdv    || "";
        if (cidade && pdv) set.add(keyPDV(cidade, pdv));
      });
      cozinhaProdSetRef.current = set;
      recompute();
    });
    return () => unsub();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---------- 2) Assina SEMANA (fallback raiz) ---------- */
  useEffect(() => {
    const { ini, fim } = intervaloSemanaBase(new Date());
    const weeklyPath = caminhoCicloFromDate(new Date());
    const weeklyRef  = collection(db, weeklyPath);
    const weeklyIsRoot = weeklyPath === "PEDIDOS";

    const unsubWeekly = onSnapshot(
      weeklyRef,
      (snap) => {
        if (!snap.empty) {
          cleanupRoot();
          lastDocsRef.current = snap.docs.map((d) => ({ data: d.data() || {} }));
          lastMetaRef.current = { ini, fim, from: weeklyIsRoot ? "weekly-root" : "weekly" };
          recompute();
        } else {
          assinarRootFiltrado(ini, fim);
        }
      },
      () => assinarRootFiltrado(ini, fim)
    );

    return () => {
      unsubWeekly();
      cleanupRoot();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function assinarRootFiltrado(ini, fim) {
    if (unsubRootRef.current || unsubRootAllRef.current) return;
    try {
      const rootRef = collection(db, "PEDIDOS");
      const qA = query(
        rootRef,
        where("createdEm", ">=", Timestamp.fromDate(ini)),
        where("createdEm", "<",   Timestamp.fromDate(fim))
      );
      const qB = query(
        rootRef,
        where("criadoEm",  ">=", Timestamp.fromDate(ini)),
        where("criadoEm",  "<",   Timestamp.fromDate(fim))
      );
      const unsubA = onSnapshot(qA, (sA) => {
        lastDocsRef.current = sA.docs.map((d) => ({ data: d.data() || {} }));
        lastMetaRef.current = { ini, fim, from: "root-created" };
        recompute();
      });
      const unsubB = onSnapshot(qB, (sB) => {
        lastDocsRef.current = sB.docs.map((d) => ({ data: d.data() || {} }));
        lastMetaRef.current = { ini, fim, from: "root-criado" };
        recompute();
      });
      unsubRootRef.current = () => { unsubA(); unsubB(); };
    } catch {
      assinarRootSemFiltro(ini, fim);
    }
  }

  function assinarRootSemFiltro(ini, fim) {
    if (unsubRootAllRef.current) return;
    const rootRef = collection(db, "PEDIDOS");
    unsubRootAllRef.current = onSnapshot(
      rootRef,
      (sAll) => {
        lastDocsRef.current = sAll.docs.map((d) => ({ data: d.data() || {} }));
        lastMetaRef.current = { ini, fim, from: "root-all" };
        recompute();
      },
      (e) => console.error("StaPed root-all:", e)
    );
  }

  function cleanupRoot() {
    if (unsubRootRef.current)    { unsubRootRef.current();    unsubRootRef.current = null; }
    if (unsubRootAllRef.current) { unsubRootAllRef.current(); unsubRootAllRef.current = null; }
  }

  return (
    <>
      <ERPHeader title="PCP – Status dos Pedidos" />
      <div className="staped-page">
        <main className="staped-main">
          <div className="staped-headline">
            <span role="img" aria-label="status">📊</span> Status dos Pedidos
          </div>

          {semanaVazia && (
            <div className="semana-sem-pedidos">
              <h2>SEMANA AINDA SEM PEDIDOS</h2>
            </div>
          )}

          <section className="staped-grid">
            {/* PENDENTE */}
            <article className="staped-card card--pendente">
              <div className="staped-card__content">
                <h3>Pendente</h3>
                <p className="staped-count">{counts.Pendente}</p>
                <small>PDVs sem pedidos lançados.</small>
                {listaPendentes.length > 0 && (
                  <div className="staped-pendentes-list">
                    {listaPendentes.map((it, idx) => (
                      <div className="staped-pendentes-item" key={`${it.cidade}-${it.pdv}-${idx}`}>
                        <span className="badge-cidade"><b>{it.cidade}</b></span>
                        <span className="pdv-nome">{it.pdv}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </article>

            {/* LANÇADO */}
            <article className="staped-card card--lancado">
              <div className="staped-card__content">
                <h3>Lançado</h3>
                <p className="staped-count">{counts.Lançado}</p>
                <small>Aguardando sabores.</small>
                {listaLancados.length > 0 && (
                  <div className="staped-pendentes-list">
                    {listaLancados.map((it, idx) => (
                      <div className="staped-pendentes-item" key={`l-${it.cidade}-${it.pdv}-${idx}`}>
                        <span className="badge-cidade"><b>{it.cidade}</b></span>
                        <span className="pdv-nome">{it.pdv}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </article>

            {/* ALIMENTADO */}
            <article className="staped-card card--alimentado">
              <div className="staped-card__content">
                <h3>Alimentado</h3>
                <p className="staped-count">{counts.Alimentado}</p>
                <small>Prontos para produção.</small>
                {listaAlimentados.length > 0 && (
                  <div className="staped-pendentes-list">
                    {listaAlimentados.map((it, idx) => (
                      <div className="staped-pendentes-item" key={`a-${it.cidade}-${it.pdv}-${idx}`}>
                        <span className="badge-cidade"><b>{it.cidade}</b></span>
                        <span className="pdv-nome">{it.pdv}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </article>

            {/* PRODUZIDO */}
            <article className="staped-card card--produzido">
              <div className="staped-card__content">
                <h3>Produzido</h3>
                <p className="staped-count">{counts.Produzido}</p>
                <small>Concluídos em cozinha.</small>
                {listaProduzidos.length > 0 && (
                  <div className="staped-pendentes-list">
                    {listaProduzidos.map((it, idx) => (
                      <div className="staped-pendentes-item" key={`p-${it.cidade}-${it.pdv}-${idx}`}>
                        <span className="badge-cidade"><b>{it.cidade}</b></span>
                        <span className="pdv-nome">{it.pdv}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </article>
          </section>

          <StaPedActions pedidos={pedidos} semanaVazia={semanaVazia} />
        </main>
      </div>
      <ERPFooter onBack={() => setTela("HomePCP")} />
    </>
  );
}

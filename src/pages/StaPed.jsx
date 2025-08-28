// src/pages/StaPed.jsx
import React, { useEffect, useRef, useState } from "react";
import { collection, onSnapshot, query, where, Timestamp } from "firebase/firestore";
import db from "../firebase";

import ERPHeader from "./ERPHeader";
import ERPFooter from "./ERPFooter";
import "./StaPed.css";

import StaPedActions from "./StaPedActions";
import { PDVs_VALIDOS, chavePDV, totalPDVsValidos } from "../util/PDVsValidos";
import { caminhoCicloFromDate } from "../util/Ciclo";

/* =================== helpers =================== */
function normalizaStatus(raw) {
  const s = String(raw || "").toLowerCase();
  if (s.includes("produz")) return "Produzido";
  if (s.includes("aliment")) return "Alimentado";
  if (s.includes("lanç") || s.includes("lanc") || s === "pendente") return "Lançado";
  return "Lançado";
}
// janela da semana (seg 11:00 → próxima seg 11:00)
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
/* ================================================ */

export default function StaPed({ setTela }) {
  const [counts, setCounts]   = useState({ Pendente: 0, Lançado: 0, Alimentado: 0, Produzido: 0 });
  const [pedidos, setPedidos] = useState([]);
  const [semanaVazia, setSemanaVazia] = useState(false);

  const [listaPendentes,  setListaPendentes]  = useState([]);
  const [listaLancados,   setListaLancados]   = useState([]);
  const [listaAlimentados,setListaAlimentados]= useState([]);
  const [listaProduzidos, setListaProduzidos] = useState([]);

  // status vindos da COZINHA (pcp_pedidos) — usado para sobrepor
  const cozinhaStatusRef = useRef(new Map());

  const unsubRootRef    = useRef(null);
  const unsubRootAllRef = useRef(null);

  // Assina pcp_pedidos (Cozinha) e guarda o status por ID
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "pcp_pedidos"), (snap) => {
      const map = new Map();
      snap.forEach((d) => map.set(d.id, normalizaStatus(d.data()?.statusEtapa)));
      cozinhaStatusRef.current = map; // usado durante o processamento do snapshot semanal/raiz
    });
    return () => unsub();
  }, []);

  // Assinatura principal: semanal → fallback raiz
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
          processaSnapshot(snap, { ini, fim, from: weeklyIsRoot ? "weekly-root" : "weekly" });
          setSemanaVazia(false);
        } else {
          setSemanaVazia(true);
          assinarRootFiltrado(ini, fim);
        }
      },
      (_) => {
        setSemanaVazia(true);
        assinarRootFiltrado(ini, fim);
      }
    );

    return () => {
      unsubWeekly();
      cleanupRoot();
    };
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
      const unsubA = onSnapshot(qA, (sA) => processaSnapshot(sA, { ini, fim, from: "root-created" }));
      const unsubB = onSnapshot(qB, (sB) => processaSnapshot(sB, { ini, fim, from: "root-criado"  }));
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
      (sAll) => processaSnapshot(sAll, { ini, fim, from: "root-all" }),
      (e) => console.error("StaPed root-all:", e)
    );
  }

  function cleanupRoot() {
    if (unsubRootRef.current)    { unsubRootRef.current();    unsubRootRef.current = null; }
    if (unsubRootAllRef.current) { unsubRootAllRef.current(); unsubRootAllRef.current = null; }
  }

  function processaSnapshot(snap, { ini, fim, from }) {
    const acc = { Lançado: 0, Alimentado: 0, Produzido: 0 };
    const pdvsComPedido = new Set();
    const lista = [];
    const vistos = new Set();

    const lancados   = [];
    const alimentados= [];
    const produzidos = [];
    const seenLanc = new Set();
    const seenAli  = new Set();
    const seenProd = new Set();

    const cozinhaMap = cozinhaStatusRef.current || new Map();

    snap.forEach((docu) => {
      if (vistos.has(docu.id)) return;
      const d = docu.data() || {};

      if ((from?.startsWith("root") || from === "weekly-root") && !dentroDaSemana(d, ini, fim)) return;

      vistos.add(docu.id);

      // status original do documento
      let core = normalizaStatus(d.statusEtapa);
      // sobreposição pelo que a COZINHA já marcou (se "Produzido", sobrepõe)
      const coz = cozinhaMap.get(docu.id);
      if (coz === "Produzido") core = "Produzido";

      // para o contador visual usamos o mesmo "core"
      const vis = core;
      if (acc[vis] !== undefined) acc[vis] += 1;

      const cidade = d.cidade || d.city || "";
      const pdv    = d.pdv || d.escola || "";
      const key    = (cidade && pdv) ? chavePDV(cidade, pdv) : null;
      if (key) pdvsComPedido.add(key);

      const itens = Array.isArray(d.itens) ? d.itens : Array.isArray(d.items) ? d.items : [];
      lista.push({ cidade, pdv, itens, sabores: d.sabores || null, statusEtapa: core });

      if (key) {
        if (core === "Lançado"   && !seenLanc.has(key)) { seenLanc.add(key);   lancados.push({ cidade, pdv }); }
        if (core === "Alimentado"&& !seenAli.has(key))  { seenAli.add(key);    alimentados.push({ cidade, pdv }); }
        if (core === "Produzido" && !seenProd.has(key)) { seenProd.add(key);   produzidos.push({ cidade, pdv }); }
      }
    });

    // pendentes vs. mestre
    const todos = [];
    PDVs_VALIDOS.forEach(({ cidade, pdvs }) => {
      pdvs.forEach((p) => {
        const key = chavePDV(cidade, p);
        if (!pdvsComPedido.has(key)) todos.push({ cidade, pdv: p });
      });
    });
    setListaPendentes(todos);

    const ord = (a, b) => (a.cidade === b.cidade ? a.pdv.localeCompare(b.pdv) : a.cidade.localeCompare(b.cidade));
    setListaLancados(lancados.sort(ord));
    setListaAlimentados(alimentados.sort(ord));
    setListaProduzidos(produzidos.sort(ord));

    const pendentesCount = todos.length || Math.max(totalPDVsValidos() - pdvsComPedido.size, 0);
    setCounts({ Pendente: pendentesCount, Lançado: acc.Lançado, Alimentado: acc.Alimentado, Produzido: acc.Produzido });
    setPedidos(lista);
    setSemanaVazia(lista.length === 0);
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

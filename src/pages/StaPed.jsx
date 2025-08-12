// src/pages/StaPed.jsx
import React, { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import db from "../firebase";

import ERPHeader from "./ERPHeader";
import ERPFooter from "./ERPFooter";
import "./StaPed.css";

import StaPedActions from "./StaPedActions";
import { PDVs_VALIDOS, chavePDV, totalPDVsValidos } from "../util/PDVsValidos";
import { caminhoCicloAtual } from "../util/Semana";

// Normalizações de status
function normalizaStatusVisual(raw) {
  const s = (raw || "").toLowerCase();
  if (s.includes("produz")) return "Produzido";
  if (s.includes("aliment")) return "Alimentado";
  if (s.includes("lanç") || s.includes("lanc") || s === "pendente") return "Lançado";
  return "Lançado";
}
function normalizaStatusCore(raw) {
  const s = (raw || "").toLowerCase();
  if (s.includes("produz")) return "Produzido";
  if (s.includes("aliment")) return "Alimentado";
  if (s.includes("lanç") || s.includes("lanc") || s === "pendente") return "Lançado";
  return "Lançado";
}

export default function StaPed({ setTela }) {
  const [counts, setCounts] = useState({
    Pendente: 0,
    Lançado: 0,
    Alimentado: 0,
    Produzido: 0,
  });
  const [pedidos, setPedidos] = useState([]);
  const [semanaVazia, setSemanaVazia] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        // Lê a coleção da semana atual (segunda 11h)
        const snap = await getDocs(collection(db, caminhoCicloAtual()));

        if (snap.empty) {
          // Semana sem pedidos → banner + todos PDVs como Pendente
          setSemanaVazia(true);
          setCounts({
            Pendente: totalPDVsValidos(),
            Lançado: 0,
            Alimentado: 0,
            Produzido: 0,
          });
          setPedidos([]);
          return;
        } else {
          setSemanaVazia(false);
        }

        const acc = { Lançado: 0, Alimentado: 0, Produzido: 0 };
        const pdvsComPedido = new Set();
        const lista = [];

        snap.forEach((doc) => {
          const d = doc.data() || {};
          const vis = normalizaStatusVisual(d.statusEtapa);
          const core = normalizaStatusCore(d.statusEtapa);

          if (acc[vis] !== undefined) acc[vis] += 1;

          const cidade = d.cidade || d.city || "";
          const pdv = d.pdv || d.escola || "";
          if (cidade && pdv) pdvsComPedido.add(chavePDV(cidade, pdv));

          const itens = Array.isArray(d.itens)
            ? d.itens
            : Array.isArray(d.items)
            ? d.items
            : [];

          lista.push({
            cidade,
            pdv,
            itens,
            sabores: d.sabores || null,
            statusEtapa: core, // Lançado | Alimentado | Produzido
          });
        });

        const pendentes = Math.max(totalPDVsValidos() - pdvsComPedido.size, 0);

        setCounts({
          Pendente: pendentes,
          Lançado: acc.Lançado,
          Alimentado: acc.Alimentado,
          Produzido: acc.Produzido,
        });
        setPedidos(lista);
      } catch (e) {
        console.error("Erro ao carregar status:", e);
      }
    })();
  }, []);

  return (
    <>
      <ERPHeader title="PCP – Status dos Pedidos" />

      <main className="staped-main">
        <div className="staped-headline">
          <span role="img" aria-label="status">📊</span> Status dos Pedidos
        </div>

        {semanaVazia && (
          <div className="semana-sem-pedidos">
            <h2>SEMANA AINDA SEM PEDIDOS</h2>
          </div>
        )}

        {/* Quadrantes */}
        <section className="staped-grid">
          <article className="staped-card card--pendente">
            <div className="staped-card__content">
              <h3>Pendente</h3>
              <p className="staped-count">{counts.Pendente}</p>
              <small>PDVs sem pedidos lançados.</small>
            </div>
          </article>

          <article className="staped-card card--lancado">
            <div className="staped-card__content">
              <h3>Lançado</h3>
              <p className="staped-count">{counts.Lançado}</p>
              <small>Aguardando sabores.</small>
            </div>
          </article>

          <article className="staped-card card--alimentado">
            <div className="staped-card__content">
              <h3>Alimentado</h3>
              <p className="staped-count">{counts.Alimentado}</p>
              <small>Prontos para produção.</small>
            </div>
          </article>

          <article className="staped-card card--produzido">
            <div className="staped-card__content">
              <h3>Produzido</h3>
              <p className="staped-count">{counts.Produzido}</p>
              <small>Concluídos em cozinha.</small>
            </div>
          </article>
        </section>

        {/* Ações (mesma tela) */}
        <StaPedActions pedidos={pedidos} />
      </main>

      <ERPFooter onBack={() => setTela("HomePCP")} />
    </>
  );
}

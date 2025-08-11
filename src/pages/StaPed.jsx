// src/pages/StaPed.jsx
import React, { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import db from "../firebase";

import ERPHeader from "./ERPHeader";
import ERPFooter from "./ERPFooter";
import "./StaPed.css";

// mapeia variantes antigas para os status atuais da tela
function normalizaStatus(raw) {
  const s = (raw || "").toLowerCase();
  if (s === "pendente") return "Lançado";
  if (s.includes("preenchido")) return "Alimentado";
  if (s.includes("produc")) return "Em Produção";
  if (s.includes("entreg") || s.includes("final")) return "Finalizado";
  // status padrão que já usamos hoje
  if (s.includes("lanç") || s.includes("lanc")) return "Lançado";
  if (s.includes("aliment")) return "Alimentado";
  return "Lançado";
}

export default function StaPed({ setTela }) {
  const [counts, setCounts] = useState({
    "Lançado": 0,
    "Alimentado": 0,
    "Em Produção": 0,
    "Finalizado": 0,
  });

  useEffect(() => {
    (async () => {
      try {
        const snap = await getDocs(collection(db, "PEDIDOS"));
        const acc = {
          "Lançado": 0,
          "Alimentado": 0,
          "Em Produção": 0,
          "Finalizado": 0,
        };

        snap.forEach((doc) => {
          const data = doc.data() || {};
          const norm = normalizaStatus(data.statusEtapa);
          if (acc[norm] === undefined) acc[norm] = 0;
          acc[norm] += 1;
        });

        setCounts(acc);
      } catch (e) {
        console.error("Erro ao carregar pedidos para status:", e);
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

        <section className="staped-grid">
          {/* Lançado */}
          <article className="staped-card card--lancado">
            <div className="staped-card__content">
              <h3>Lançado</h3>
              <p className="staped-count">{counts["Lançado"]}</p>
              <small>Pedidos criados e aguardando sabores.</small>
            </div>
          </article>

          {/* Alimentado */}
          <article className="staped-card card--alimentado">
            <div className="staped-card__content">
              <h3>Alimentado</h3>
              <p className="staped-count">{counts["Alimentado"]}</p>
              <small>Sabores definidos, prontos para produção.</small>
            </div>
          </article>

          {/* Em Produção */}
          <article className="staped-card card--producao">
            <div className="staped-card__content">
              <h3>Em Produção</h3>
              <p className="staped-count">{counts["Em Produção"]}</p>
              <small>Em preparo/fabricação.</small>
            </div>
          </article>

          {/* Finalizado */}
          <article className="staped-card card--finalizado">
            <div className="staped-card__content">
              <h3>Finalizado</h3>
              <p className="staped-count">{counts["Finalizado"]}</p>
              <small>Concluídos/entregues.</small>
            </div>
          </article>
        </section>
      </main>

      <ERPFooter onBack={() => setTela("HomePCP")} />
    </>
  );
}

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
function normalizaStatus(raw) {
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

  // Listas para exibir dentro dos cards
  const [listaPendentes, setListaPendentes] = useState([]); // [{cidade, pdv}]
  const [listaLancados, setListaLancados] = useState([]);   // [{cidade, pdv}]
  const [listaAlimentados, setListaAlimentados] = useState([]);
  const [listaProduzidos, setListaProduzidos] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        // Lê coleção da SEMANA ATUAL
        const snap = await getDocs(collection(db, caminhoCicloAtual()));

        const acc = { Lançado: 0, Alimentado: 0, Produzido: 0 };
        const pdvsComPedido = new Set();
        const lista = [];

        // listas por status para exibir nos cards
        const _lanc = [];
        const _alim = [];
        const _prod = [];

        if (snap.empty) {
          setSemanaVazia(true);
        } else {
          setSemanaVazia(false);
          snap.forEach((doc) => {
            const d = doc.data() || {};
            const status = normalizaStatus(d.statusEtapa);

            if (acc[status] !== undefined) acc[status] += 1;

            const cidade = d.cidade || d.city || "";
            const pdv = d.pdv || d.escola || "";

            if (cidade && pdv) {
              pdvsComPedido.add(chavePDV(cidade, pdv));
              // distribui nas listas visuais
              const item = { cidade, pdv };
              if (status === "Lançado") _lanc.push(item);
              else if (status === "Alimentado") _alim.push(item);
              else if (status === "Produzido") _prod.push(item);
            }

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
              statusEtapa: status, // Lançado | Alimentado | Produzido
            });
          });
        }

        // monta lista de pendentes comparando com a lista mestre
        const pend = [];
        PDVs_VALIDOS.forEach(({ cidade, pdvs }) => {
          pdvs.forEach((p) => {
            const key = chavePDV(cidade, p);
            if (!pdvsComPedido.has(key)) {
              pend.push({ cidade, pdv: p });
            }
          });
        });

        // contagens (pendentes = total válidos - com pedido)
        const pendentesCount = pend.length || Math.max(totalPDVsValidos() - pdvsComPedido.size, 0);
        setCounts({
          Pendente: pendentesCount,
          Lançado: acc.Lançado,
          Alimentado: acc.Alimentado,
          Produzido: acc.Produzido,
        });

        setListaPendentes(pend);
        setListaLancados(_lanc);
        setListaAlimentados(_alim);
        setListaProduzidos(_prod);

        setPedidos(lista);
      } catch (e) {
        console.error("Erro ao carregar status:", e);
      }
    })();
  }, []);

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

          {/* Quadrantes */}
          <section className="staped-grid">
            {/* Pendente */}
            <article className="staped-card card--pendente">
              <div className="staped-card__content">
                <h3>Pendente</h3>
                <p className="staped-count">{counts.Pendente}</p>
                <small>PDVs sem pedidos lançados.</small>

                {listaPendentes.length > 0 && (
                  <div className="staped-pendentes-list">
                    {listaPendentes.map((it, idx) => (
                      <div className="staped-pendentes-item" key={`${it.cidade}-${it.pdv}-${idx}`}>
                        <span className="badge-cidade">{it.cidade}</span>
                        <span className="pdv-nome">{it.pdv}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </article>

            {/* Lançado */}
            <article className="staped-card card--lancado">
              <div className="staped-card__content">
                <h3>Lançado</h3>
                <p className="staped-count">{counts.Lançado}</p>
                <small>Aguardando sabores.</small>

                {listaLancados.length > 0 && (
                  <div className="staped-pendentes-list">
                    {listaLancados.map((it, idx) => (
                      <div className="staped-pendentes-item" key={`l-${it.cidade}-${it.pdv}-${idx}`}>
                        <span className="badge-cidade">{it.cidade}</span>
                        <span className="pdv-nome">{it.pdv}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </article>

            {/* Alimentado */}
            <article className="staped-card card--alimentado">
              <div className="staped-card__content">
                <h3>Alimentado</h3>
                <p className="staped-count">{counts.Alimentado}</p>
                <small>Prontos para produção.</small>

                {listaAlimentados.length > 0 && (
                  <div className="staped-pendentes-list">
                    {listaAlimentados.map((it, idx) => (
                      <div className="staped-pendentes-item" key={`a-${it.cidade}-${it.pdv}-${idx}`}>
                        <span className="badge-cidade">{it.cidade}</span>
                        <span className="pdv-nome">{it.pdv}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </article>

            {/* Produzido */}
            <article className="staped-card card--produzido">
              <div className="staped-card__content">
                <h3>Produzido</h3>
                <p className="staped-count">{counts.Produzido}</p>
                <small>Concluídos em cozinha.</small>

                {listaProduzidos.length > 0 && (
                  <div className="staped-pendentes-list">
                    {listaProduzidos.map((it, idx) => (
                      <div className="staped-pendentes-item" key={`p-${it.cidade}-${it.pdv}-${idx}`}>
                        <span className="badge-cidade">{it.cidade}</span>
                        <span className="pdv-nome">{it.pdv}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </article>
          </section>

          {/* Ações (relatórios) */}
          <StaPedActions pedidos={pedidos} semanaVazia={semanaVazia} />
        </main>
      </div>

      <ERPFooter onBack={() => setTela("HomePCP")} />
    </>
  );
}

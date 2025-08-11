// src/pages/StaPed.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
  collection,
  getDocs,
} from "firebase/firestore";
import db from "../firebase";

import ERPHeader from "./ERPHeader";
import ERPFooter from "./ERPFooter";
import "./AliSab.css"; // reaproveita .alisab-main, tipografia etc.

const STATUS_OPCOES = ["Todos", "Lançado", "Alimentado", "Pendente", "Entregue"];

function formatarData(dt) {
  if (!dt) return "—";
  try {
    return dt.toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
}

export default function StaPed({ setTela }) {
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusSel, setStatusSel] = useState("Todos");
  const [busca, setBusca] = useState("");

  // cores dos "chips" de status (inline pra evitar CSS novo)
  const corStatus = useMemo(
    () => ({
      Lançado:   { bg: "#fff6e0", fg: "#7b3c21", b: "#f0d6b8" },
      Alimentado:{ bg: "#eaffea", fg: "#1f7a41", b: "#bfe7c8" },
      Pendente:  { bg: "#fff4f4", fg: "#a22",   b: "#f0caca" },
      Entregue:  { bg: "#eef4ff", fg: "#214f9b", b: "#cddaf7" },
      Todos:     { bg: "#f7f7f7", fg: "#444",    b: "#e5e5e5" },
    }),
    []
  );

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const snap = await getDocs(collection(db, "PEDIDOS"));
        const list = snap.docs.map((d) => {
          const data = d.data() || {};
          const criado =
            data.criadoEm?.toDate?.() ||
            data.dataServidor?.toDate?.?.() ||
            data.timestamp?.toDate?.() ||
            null;

          return {
            id: d.id,
            escola: data.escola || "—",
            cidade: data.cidade || "—",
            status: data.statusEtapa || "—",
            criadoEm: criado,
            total: Array.isArray(data.itens)
              ? data.itens.reduce((s, it) => s + Number(it.quantidade || 0), 0)
              : 0,
          };
        });

        // ordena por data desc, com fallback
        list.sort((a, b) => {
          const ta = a.criadoEm ? a.criadoEm.getTime() : 0;
          const tb = b.criadoEm ? b.criadoEm.getTime() : 0;
          return tb - ta;
        });

        setPedidos(list);
      } catch (e) {
        console.error("Erro ao carregar PEDIDOS:", e);
        setPedidos([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // contadores por status (pra mostrar nos chips)
  const contadores = useMemo(() => {
    const base = { Todos: pedidos.length };
    STATUS_OPCOES.forEach((s) => s !== "Todos" && (base[s] = 0));
    pedidos.forEach((p) => {
      if (base[p.status] != null) base[p.status] += 1;
    });
    return base;
  }, [pedidos]);

  // aplica filtros
  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return pedidos.filter((p) => {
      const okStatus = statusSel === "Todos" ? true : p.status === statusSel;
      const okBusca =
        !termo ||
        p.escola.toLowerCase().includes(termo) ||
        p.cidade.toLowerCase().includes(termo);
      return okStatus && okBusca;
    });
  }, [pedidos, statusSel, busca]);

  return (
    <>
      <ERPHeader title="PCP – Status dos Pedidos" />

      <main className="alisab-main">
        {/* Título local + filtros */}
        <div className="alisab-header" style={{ justifyContent: "space-between", flexWrap: "wrap" }}>
          <div className="alisab-title">📋 Status dos Pedidos</div>

          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            {/* Chips de status */}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {STATUS_OPCOES.map((s) => {
                const isOn = statusSel === s;
                const pal = corStatus[s];
                return (
                  <button
                    key={s}
                    onClick={() => setStatusSel(s)}
                    style={{
                      border: `1px solid ${pal.b}`,
                      background: isOn ? pal.bg : "#ffffff",
                      color: pal.fg,
                      fontWeight: 800,
                      padding: "6px 10px",
                      borderRadius: 999,
                      fontSize: 12,
                      boxShadow: isOn ? "0 2px 6px rgba(0,0,0,.08)" : "none",
                    }}
                    title={`Filtrar por ${s}`}
                  >
                    {s} {contadores[s] != null ? `(${contadores[s]})` : ""}
                  </button>
                );
              })}
            </div>

            {/* Busca */}
            <input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar escola ou cidade…"
              style={{
                height: 36,
                borderRadius: 10,
                border: "1px solid #e0c9b7",
                padding: "0 10px",
                fontSize: 14,
                background: "#fff",
              }}
            />
          </div>
        </div>

        {/* Tabela/lista */}
        <div
          style={{
            background: "rgba(255,255,255,.75)",
            border: "1px solid #e6d2c2",
            borderRadius: 12,
            padding: 12,
            maxWidth: 960,
            margin: "0 auto",
            boxShadow: "0 8px 20px rgba(0,0,0,.12)",
          }}
        >
          {loading ? (
            <div style={{ padding: 16, color: "#7b3c21", fontWeight: 700 }}>
              Carregando…
            </div>
          ) : filtrados.length === 0 ? (
            <div style={{ padding: 16, color: "#7b3c21", fontWeight: 700 }}>
              Nenhum pedido encontrado.
            </div>
          ) : (
            <table
              style={{
                width: "100%",
                borderCollapse: "separate",
                borderSpacing: "0 8px",
                fontSize: 14,
                color: "#5C1D0E",
              }}
            >
              <thead>
                <tr style={{ textAlign: "left", fontWeight: 800 }}>
                  <th style={{ padding: "6px 8px" }}>Escola</th>
                  <th style={{ padding: "6px 8px" }}>Cidade</th>
                  <th style={{ padding: "6px 8px", width: 140 }}>Status</th>
                  <th style={{ padding: "6px 8px", width: 160 }}>Criado em</th>
                  <th style={{ padding: "6px 8px", width: 80, textAlign: "right" }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {filtrados.map((r) => {
                  const pal = corStatus[r.status] || corStatus.Todos;
                  return (
                    <tr
                      key={r.id}
                      style={{
                        background: "#fff7ef",
                        border: "1px solid #f0dccd",
                        boxShadow: "0 2px 6px rgba(0,0,0,.05)",
                      }}
                    >
                      <td style={{ padding: "10px 8px", borderRadius: "8px 0 0 8px", fontWeight: 700 }}>
                        {r.escola}
                      </td>
                      <td style={{ padding: "10px 8px" }}>{r.cidade}</td>
                      <td style={{ padding: "10px 8px" }}>
                        <span
                          style={{
                            border: `1px solid ${pal.b}`,
                            background: pal.bg,
                            color: pal.fg,
                            fontWeight: 800,
                            padding: "4px 8px",
                            borderRadius: 999,
                            fontSize: 12,
                          }}
                        >
                          {r.status}
                        </span>
                      </td>
                      <td style={{ padding: "10px 8px" }}>{formatarData(r.criadoEm)}</td>
                      <td style={{ padding: "10px 8px", textAlign: "right", borderRadius: "0 8px 8px 0" }}>
                        {r.total}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </main>

      <ERPFooter onBack={() => setTela("HomePCP")} />
    </>
  );
}

// src/pages/cozinha.jsx
import React, { useEffect, useMemo, useState, useCallback } from "react";
import "../util/cozinha.css";

import ERPHeader from "./ERPHeader";
import ERPFooter from "./ERPFooter";

import {
  subscribePedidosAlimentados,
  resumoPedido,
  atualizarParcial,
  marcarProduzido,
} from "../util/cozinha_store";

/* ---------- helpers ---------- */
const norm = (s) => String(s || "").trim().toUpperCase();
const aliasTipo = (s) => {
  const x = norm(s);
  if (x === "BROWNIE 7X7" || x === "BRW 7X7") return "BRW 7X7";
  if (x === "BROWNIE 6X6" || x === "BRW 6X6") return "BRW 6X6";
  if (x === "POCKET 5X5" || x === "PKT 5X5") return "POCKET 5X5";
  if (x === "POCKET 6X6" || x === "PKT 6X6") return "POCKET 6X6";
  if (x.includes("ESC")) return "ESCONDIDINHO";
  if (x.includes("DUDU")) return "DUDU";
  return x;
};

// janela da semana: segunda 11:00 → próxima segunda 11:00
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
function dentroDaSemana(p, ini, fim) {
  const cand =
    p?.produzidoEm?.toDate?.() ||
    p?.atualizadoEm?.toDate?.() ||
    p?.criadoEm?.toDate?.() ||
    p?.createdEm?.toDate?.();
  if (!cand) return true;
  return cand >= ini && cand < fim;
}

/** Calcula quais linhas (sabores) ficam “checadas” pelo parcial total do produto. */
function computeChecks(pedido) {
  const checks = {};
  const sab = pedido?.sabores || {};
  const par = pedido?.parciais || {};
  Object.keys(sab).forEach((prod) => {
    let restante = Number(par[prod] || 0);
    checks[prod] = (sab[prod] || []).map((ln) => {
      const q = Number(ln.qtd || ln.quantidade || 0);
      if (restante >= q) {
        restante -= q;
        return true;
      }
      return false;
    });
  });
  return checks;
}

export default function Cozinha({ setTela }) {
  // filtros
  const [cidade, setCidade] = useState("Todos");
  const [pdv, setPdv] = useState("Todos");
  const [tipo, setTipo] = useState("Todos");

  // dados / erro
  const [pedidos, setPedidos] = useState([]);
  const [erro, setErro] = useState("");

  // tick para recalcular a janela semanal automaticamente
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 60 * 1000);
    return () => clearInterval(t);
  }, []);
  const { ini, fim } = useMemo(() => intervaloSemanaBase(new Date(now)), [now]);

  // assinatura em tempo real (ALIMENTADO + PRODUZIDO)
  useEffect(() => {
    setErro("");
    const unsub = subscribePedidosAlimentados(
      (docs) => setPedidos(docs),
      (err) => setErro(err?.message || String(err))
    );
    return () => unsub && unsub();
  }, []);

  // mantém só a semana corrente
  const pedidosSemana = useMemo(
    () => (pedidos || []).filter((p) => dentroDaSemana(p, ini, fim)),
    [pedidos, ini.getTime(), fim.getTime()]
  );

  // opções dos selects
  const { cidadesOpt, pdvsOpt, tiposOpt } = useMemo(() => {
    const cs = new Set(["Todos"]);
    const ps = new Set(["Todos"]);
    const ts = new Set(["Todos"]);
    (pedidosSemana || []).forEach((p) => {
      if (p.cidade) cs.add(p.cidade);
      if (p.pdv || p.escola) ps.add(p.pdv || p.escola);
      (p.itens || []).forEach((it) => ts.add(aliasTipo(it.produto)));
    });
    return {
      cidadesOpt: Array.from(cs),
      pdvsOpt: Array.from(ps),
      tiposOpt: Array.from(ts),
    };
  }, [pedidosSemana]);

  // filtro no cliente
  const pedidosFiltrados = useMemo(() => {
    return (pedidosSemana || []).filter((p) => {
      const okCidade = cidade === "Todos" || norm(p.cidade) === norm(cidade);
      const pPdv = p.pdv || p.escola;
      const okPdv = pdv === "Todos" || norm(pPdv) === norm(pdv);

      let okTipo = true;
      if (tipo !== "Todos") {
        const alvo = aliasTipo(tipo);
        okTipo = (p.itens || []).some((it) => aliasTipo(it.produto) === alvo);
      }
      return okCidade && okPdv && okTipo;
    });
  }, [pedidosSemana, cidade, pdv, tipo]);

  // handlers
  const toggleLinha = useCallback(async (pedido, prod, linhaQtd, checked) => {
    try {
      const delta = checked ? +linhaQtd : -linhaQtd;
      await atualizarParcial(pedido.id, prod, delta);
    } catch (e) {
      alert("Erro ao atualizar produção: " + (e?.message || e));
    }
  }, []);

  const confirmaProduzido = useCallback(async (pedido) => {
    try {
      await marcarProduzido(pedido.id);
    } catch (e) {
      alert("Erro ao marcar como produzido: " + (e?.message || e));
    }
  }, []);

  return (
    <>
      <ERPHeader title="PCP — Cozinha" />

      <main className="alisab-main">
        {/* filtros */}
        <div className="alisab-header">
          <div className="alisab-title">Filtrar</div>
        </div>
        <div className="cozinha-filtros">
          <label>
            <div style={{ fontSize: 12, color: "#7a5a2a", marginBottom: 4 }}>
              Cidade
            </div>
            <select value={cidade} onChange={(e) => setCidade(e.target.value)}>
              {cidadesOpt.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>

          <label>
            <div style={{ fontSize: 12, color: "#7a5a2a", marginBottom: 4 }}>
              PDV
            </div>
            <select value={pdv} onChange={(e) => setPdv(e.target.value)}>
              {pdvsOpt.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </label>

          <label>
            <div style={{ fontSize: 12, color: "#7a5a2a", marginBottom: 4 }}>
              Tipo de produto
            </div>
            <select value={tipo} onChange={(e) => setTipo(e.target.value)}>
              {tiposOpt.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>

          <button className="btn-filtrar" onClick={() => {}}>
            Filtrar
          </button>
        </div>

        {erro && (
          <div
            style={{
              background: "#fff",
              border: "1px solid #e6d2c2",
              borderRadius: 10,
              padding: 10,
              color: "#8c3b1b",
              marginBottom: 8,
            }}
          >
            {erro}
          </div>
        )}

        {/* vazio */}
        {pedidosFiltrados.length === 0 && (
          <div className="postit tilt-l" style={{ maxWidth: 360 }}>
            <i className="pin" />
            <div className="postit-header">
              <div className="pdv">Sem pedidos</div>
              <div className="resumo">
                Somente pedidos com status <b>ALIMENTADO</b> aparecem aqui.
              </div>
            </div>
          </div>
        )}

        {/* lista */}
        <section className="postits-list">
          {pedidosFiltrados.map((p, idx) => {
            const tilt = idx % 2 ? "tilt-r" : "tilt-l";
            const resumo = resumoPedido(p);
            const checks = computeChecks(p);
            const isProduzido = p.statusEtapa === "Produzido" || resumo.completo;

            const prods = Object.keys(p?.sabores || {});
            prods.sort((a, b) => aliasTipo(a).localeCompare(aliasTipo(b)));

            return (
              <article
                key={p.id}
                className={`postit ${tilt}`}
                data-status={isProduzido ? "Produzido" : "Alimentado"}
              >
                <i className="pin" aria-hidden />
                <div className="postit-header">
                  <div className="pdv">{(p.pdv || p.escola) ?? "—"} — {p.cidade ?? "—"}</div>
                  <div className="resumo">
                    {prods.length ? (
                      <span>
                        {prods.map((nm, i) => (
                          <span key={nm}>
                            {aliasTipo(nm)}
                            {i < prods.length - 1 ? ", " : ""}
                          </span>
                        ))}
                      </span>
                    ) : (
                      <span>Sem sabores definidos</span>
                    )}
                  </div>
                </div>

                <div className={`carimbo ${isProduzido ? "is-prod" : "is-ali"}`}>
                  {isProduzido ? "PRODUZIDO" : "ALIMENTADO"}
                </div>

                <div className="postit-body">
                  {prods.map((prod) => {
                    const linhas = p.sabores[prod] || [];
                    const chk = checks[prod] || [];
                    return (
                      <div className="produto-bloco" key={prod}>
                        <div className="produto-titulo">
                          <div style={{ fontWeight: 800 }}>{aliasTipo(prod)}</div>
                        </div>

                        {linhas.map((ln, i) => {
                          const qtd = Number(ln.qtd || ln.quantidade || 0);
                          const marcado = !!chk[i];
                          return (
                            <div className="prod-item" key={prod + "-" + i}>
                              <div className="restantes">{qtd}</div>
                              <div style={{ gridColumn: "span 2" }}>{ln.sabor}</div>
                              <input
                                type="checkbox"
                                checked={marcado}
                                onChange={(e) =>
                                  toggleLinha(p, prod, qtd, e.target.checked)
                                }
                              />
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}

                  <div className="actions">
                    {!isProduzido && (
                      <button
                        className="btn-finalizar"
                        onClick={() => confirmaProduzido(p)}
                      >
                        Produzido
                      </button>
                    )}
                    <div style={{ marginLeft: "auto", fontWeight: 800, color: "#7a5a2a" }}>
                      Solicitado: {resumo.total} • Produzido: {resumo.produzido} • Restam: {resumo.restam}
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      </main>

      <ERPFooter onBack={() => setTela?.("HomePCP")} />
    </>
  );
                                        }

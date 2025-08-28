// src/pages/Cozinha.jsx
import React, { useEffect, useMemo, useState } from "react";
import "../util/cozinha.css";
import ERPHeader from "./ERPHeader";
import ERPFooter from "./ERPFooter";
import {
  subscribePedidosAlimentados,
  toggleChecklistLine,
  resumoDoPedido,
} from "../util/cozinha_store";

// opções simples para os filtros (ajuste se quiser carregar de fonte externa)
const CIDADES = ["Todos", "Gravatá"];
const TIPOS   = ["Todos", "BROWNIE 7X7", "BROWNIE 6X6", "POCKET 5X5", "POCKET 6X6", "ESCONDIDINHO", "DUDU"];

export default function Cozinha({ setTela }) {
  const [cidade, setCidade] = useState("Todos");
  const [pdv,    setPdv]    = useState("Todos");
  const [tipo,   setTipo]   = useState("Todos");
  const [lista,  setLista]  = useState([]);
  const [unsub,  setUnsub]  = useState(null);

  // (re)assina no Firestore quando clicar em "Filtrar"
  function assinar() {
    if (unsub) unsub();
    const un = subscribePedidosAlimentados({ cidade, pdv }, setLista);
    setUnsub(() => un);
  }
  useEffect(() => { assinar(); return () => unsub?.(); /* 1ª carga */ }, []);

  // filtro por tipo de produto aplicado no cliente
  const exibidos = useMemo(() => {
    if (tipo === "Todos") return lista;
    return lista.filter(p => {
      const sabores = p.sabores || {};
      return Object.keys(sabores).some(prod => prod === tipo);
    });
  }, [lista, tipo]);

  return (
    <>
      <ERPHeader title="PCP — Cozinha" />
      <main className="alisab-main">
        {/* Filtros */}
        <div className="cozinha-filtros">
          <div>
            <div style={{ fontSize:12, color:"#8b6a4a", marginBottom:4 }}>Cidade</div>
            <select value={cidade} onChange={e=>setCidade(e.target.value)}>
              {CIDADES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <div style={{ fontSize:12, color:"#8b6a4a", marginBottom:4 }}>PDV</div>
            <select value={pdv} onChange={e=>setPdv(e.target.value)}>
              {/* Dinamiza com os PDVs que vierem da assinatura */}
              <option>Todos</option>
              {[...new Set(lista.map(p=>p.pdv))].filter(Boolean).map(n =>
                <option key={n} value={n}>{n}</option>
              )}
            </select>
          </div>
          <div>
            <div style={{ fontSize:12, color:"#8b6a4a", marginBottom:4 }}>Tipo de produto</div>
            <select value={tipo} onChange={e=>setTipo(e.target.value)}>
              {TIPOS.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <button className="btn-filtrar" onClick={assinar}>Filtrar</button>
        </div>

        {/* Lista de post-its */}
        <section className="postits-list">
          {exibidos.length === 0 && (
            <article className="postit tilt-l" style={{ cursor:"default" }}>
              <i className="pin" aria-hidden />
              <div className="postit-header">
                <div className="pdv">Sem pedidos</div>
                <div className="resumo">Somente pedidos com status <b>ALIMENTADO</b> aparecem aqui.</div>
              </div>
            </article>
          )}

          {exibidos.map((p, idx) => {
            const tilt = idx % 2 ? "tilt-r" : "tilt-l";
            const sabores = p.sabores || {};                 // { [produto]: [{sabor,qtd}] }
            const ticks   = p.producedChecklist || {};       // { [produto]: { [idx]: true } }
            const resumo  = resumoDoPedido(p);

            return (
              <article key={p.id} className={`postit ${tilt}`}>
                <i className="pin" aria-hidden />
                <div className="postit-header">
                  <div className="pdv">{p.pdv} — {p.cidade}</div>
                  <div className="resumo">
                    {Object.keys(sabores).length ? "Itens:" : "Sem itens"}
                  </div>
                </div>

                {resumo.completo && <div className="carimbo">PRODUZIDO</div>}

                <div className="postit-body">
                  {Object.entries(sabores).map(([produto, linhas]) => {
                    const marcados = ticks[produto] || {};
                    return (
                      <div key={produto} className="produto-bloco">
                        <div className="produto-titulo">
                          <div style={{ fontWeight:800 }}>{produto}</div>
                        </div>

                        {/* Checklist: Qtd | Sabor | checkbox */}
                        <div className="checklist">
                          {linhas.map((ln, i) => (
                            <div key={i} className="check-row">
                              <div className="qtd-box">{Number(ln.qtd || 0)}</div>
                              <div className="sabor-box">{ln.sabor}</div>
                              <input
                                type="checkbox"
                                checked={!!marcados[i]}
                                onChange={e =>
                                  toggleChecklistLine({
                                    pedidoId: p.id,
                                    produto,
                                    index: i,
                                    checked: e.target.checked
                                  })
                                }
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}

                  {/* Resumo no rodapé do post-it */}
                  <div style={{ marginTop:8, fontWeight:800, color:"#5C1D0E" }}>
                    Pedida: {resumo.pedida} • Produzida: {resumo.produzida} • Restam: {resumo.restam}
                  </div>

                  <div className="actions">
                    <button className="btn-parcial" onClick={() => setTela?.("HomePCP")}>Voltar</button>
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      </main>

      <ERPFooter onBack={() => setTela("HomePCP")} />
    </>
  );
}

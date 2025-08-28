import React, { useEffect, useMemo, useState } from "react";
import "../util/cozinha.css";

import {
  subscribePedidosAlimentados,
  salvarParcial,
  marcarProduzido,
  resumoPedido,
} from "../util/cozinha_store";

export default function Cozinha({ setTela }) {
  const [cidade, setCidade] = useState("Todos");
  const [pdv, setPdv] = useState("Todos");
  const [tipo, setTipo] = useState("Todos");

  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");

  // Assina Firestore (apenas ALIMENTADO). Reassina ao trocar cidade/PDV.
  useEffect(() => {
    setLoading(true);
    setErro("");
    const off = subscribePedidosAlimentados({ cidade, pdv }, (arr, err) => {
      if (err) setErro(err.message || String(err));
      setTodos(arr || []);
      setLoading(false);
    });
    return off;
  }, [cidade, pdv]);

  // Opções dos selects
  const cidades = useMemo(
    () => ["Todos", ...uniq(todos.map(p => p.cidade).filter(Boolean))],
    [todos]
  );
  const pdvs = useMemo(
    () => ["Todos", ...uniq(todos.map(p => p.pdv).filter(Boolean))],
    [todos]
  );
  const tipos = useMemo(() => {
    const s = new Set();
    todos.forEach(p => (p.itens || []).forEach(it => it.tipo && s.add(it.tipo)));
    return ["Todos", ...Array.from(s)];
  }, [todos]);

  // Filtro por tipo (opcional)
  const pedidosFiltrados = useMemo(() => {
    if (tipo === "Todos") return todos;
    return todos.filter(p => (p.itens || []).some(it => it.tipo === tipo));
  }, [todos, tipo]);

  async function onSalvarParcial(p, produto, qtd) {
    const n = Number(qtd || 0);
    if (n <= 0) return alert("Informe uma quantidade válida.");
    try {
      await salvarParcial(p.id, produto, n);
    } catch (e) {
      alert("Erro ao salvar parcial: " + (e.message || e));
    }
  }

  async function onProduzido(p) {
    const r = resumoPedido(p);
    if (!r.completo) {
      const ok = confirm("Ainda há itens pendentes. Marcar como PRODUZIDO assim mesmo?");
      if (!ok) return;
    }
    try {
      await marcarProduzido(p.id);
    } catch (e) {
      alert("Erro ao marcar produzido: " + (e.message || e));
    }
  }

  return (
    <div className="alisab-main">
      {/* HEADER padrão (classes já vêm do CtsReceber.css importado por cozinha.css) */}
      <header className="erp-header">
        <div className="erp-header__inner">
          <div className="erp-header__logo">
            <img src="/LogomarcaDDnt2025Vazado.png" alt="Dudunitê" />
          </div>
          <div className="erp-header__title">PCP — Cozinha</div>
        </div>
      </header>

      {/* FILTROS */}
      <div className="cozinha-filtros">
        <div>
          <div style={{fontSize:12,fontWeight:800,color:"#5C1D0E"}}>Cidade</div>
          <select value={cidade} onChange={e=>setCidade(e.target.value)}>
            {cidades.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <div style={{fontSize:12,fontWeight:800,color:"#5C1D0E"}}>PDV</div>
          <select value={pdv} onChange={e=>setPdv(e.target.value)}>
            {pdvs.map(v => <option key={v} value={v}>{v}</option>)}
          </select>
        </div>
        <div>
          <div style={{fontSize:12,fontWeight:800,color:"#5C1D0E"}}>Tipo de produto</div>
          <select value={tipo} onChange={e=>setTipo(e.target.value)}>
            {tipos.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <button className="btn-filtrar" onClick={()=>setTipo(t => t)}>Filtrar</button>
      </div>

      {/* ESTADOS */}
      {loading && <div style={{padding:10}}>Carregando pedidos…</div>}
      {erro && <div style={{padding:10,color:"#b71c1c",fontWeight:800}}>Erro: {erro}</div>}
      {!loading && !erro && pedidosFiltrados.length === 0 && (
        <div className="postit" style={{maxWidth:360}}>
          <div className="pin" />
          <div className="postit-header">
            <div className="pdv">Sem pedidos</div>
            <div className="resumo">
              <span>Somente pedidos com status <b>ALIMENTADO</b> aparecem aqui.</span>
            </div>
          </div>
        </div>
      )}

      {/* LISTA DE POST-ITS */}
      <div className="postits-list" style={{marginTop:8}}>
        {pedidosFiltrados.map(p => {
          const r = resumoPedido(p);
          return (
            <div key={p.id} className="postit tilt-l">
              <div className="pin" />
              <span className="badge-status">ALIMENTADO</span>

              <div className="postit-header">
                <div className="pdv">{p.pdv} — {p.cidade}</div>
                <div className="resumo">
                  <span>Previsto: <b>{p.dataPrevista || "-"}</b></span>
                  <span>Progresso: <b>{r.produzido}</b> / <b>{r.total}</b></span>
                </div>
              </div>

              <div className="postit-body">
                {(p.itens || []).map((it, i) => {
                  const feito = Number((p.parciais || {})[it.produto] || 0);
                  return (
                    <div key={i} className="prod-item">
                      <div><b>{it.produto}</b> — Solicitado: {it.qtd}</div>
                      <input type="number" min="1" id={`q_${p.id}_${i}`} placeholder="Qtd" />
                      <div className="restantes">{feito}/{it.qtd}</div>
                      <button
                        className="btn-parcial"
                        onClick={()=>{
                          const el = document.getElementById(`q_${p.id}_${i}`);
                          const val = el?.value || "0";
                          onSalvarParcial(p, it.produto, val);
                          if (el) el.value = "";
                        }}
                      >
                        Parcial
                      </button>
                    </div>
                  );
                })}

                <div className="actions">
                  <button className="btn-finalizar" onClick={()=>onProduzido(p)}>Produzido</button>
                  <button className="btn-parcial" onClick={()=>setTela?.("HomeERP")}>Voltar</button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* RODAPÉ */}
      <button className="btn-voltar-foot" onClick={() => setTela?.("HomeERP")}>🔙 Voltar</button>
      <footer className="erp-footer">
        <div className="erp-footer-track">• Cozinha exibe apenas pedidos ALIMENTADO •</div>
      </footer>
    </div>
  );
}

function uniq(a){ return Array.from(new Set(a)); }

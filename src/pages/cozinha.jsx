// src/pages/cozinha.jsx
import React, { useEffect, useMemo, useState } from "react";
import "../util/cozinha.css"; // usa BG/header/footer/post-it via CtsReceber.css

// Chave padrão onde o LanPed grava os pedidos
const ACUMULADOS_KEYS = [
  "lanped_pedidos", "LanPed_pedidos", "LanPedPedidos", "lanpedPedidos", "lan_pedidos"
];
const PROGRESS_KEY = "cozinha_progress";

const getLS  = (k) => { try { const r = localStorage.getItem(k); return r ? JSON.parse(r) : null; } catch { return null; } };
const setLS  = (k,v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };
const fmtQ   = (n) => Number(n || 0);
const hojeISO= () => new Date().toISOString().slice(0,10);

function loadPedidosLanPed() {
  for (const k of ACUMULADOS_KEYS) {
    const v = getLS(k);
    if (Array.isArray(v) && v.length) return v;
  }
  return [];
}
function savePedidosLanPed(arr){ setLS("lanped_pedidos", Array.isArray(arr) ? arr : []); }

// Normaliza estrutura
function normalizePedido(p) {
  const base = {
    id: p.id || `lp_${Math.random()}`,
    cidade: p.cidade || "",
    pdv: p.pdv || "",
    statusEtapa: p.statusEtapa || p.status || "",
    dataPrevista: p.dataPrevista || p.vencimento || null,
  };
  if (Array.isArray(p.itens) && p.itens.length) {
    return { ...base, itens: p.itens.map(it => ({ produto: it.produto || "-", qtd: fmtQ(it.quantidade) })) };
  }
  return { ...base, itens: [{ produto: p.produto || "-", qtd: fmtQ(p.quantidade) }] };
}

function loadProgress(){ return getLS(PROGRESS_KEY) || {}; }
function saveProgress(m){ setLS(PROGRESS_KEY, m || {}); }

export default function Cozinha({ setTela }) {
  const [raw, setRaw] = useState([]);
  const [progress, setProgress] = useState({});

  const [fCidade, setFCidade] = useState("Todos");
  const [fPdv,    setFPdv]    = useState("Todos");
  const [fTipo,   setFTipo]   = useState("Todos");

  useEffect(() => {
    setRaw(loadPedidosLanPed());
    setProgress(loadProgress());
  }, []);

  const pedidos = useMemo(() => raw.map(normalizePedido), [raw]);

  // opções de filtros
  const cidades = useMemo(() => ["Todos", ...new Set(pedidos.map(p => p.cidade).filter(Boolean))], [pedidos]);
  const pdvs    = useMemo(() => ["Todos", ...new Set(pedidos.map(p => p.pdv).filter(Boolean))], [pedidos]);
  const tipos   = useMemo(() => {
    const s = new Set(); pedidos.forEach(p => p.itens.forEach(it => s.add(it.produto || "-")));
    return ["Todos", ...Array.from(s)];
  }, [pedidos]);

  // ====== FILTRA APENAS ALIMENTADO ======
  const filtrados = useMemo(() => {
    return pedidos.filter(p => {
      const st = String(p.statusEtapa ?? p.status ?? "").toLowerCase();
      if (st !== "alimentado") return false;              // << requisito
      if (fCidade !== "Todos" && p.cidade !== fCidade) return false;
      if (fPdv    !== "Todos" && p.pdv    !== fPdv)    return false;
      if (fTipo   !== "Todos" && !p.itens.some(it => (it.produto || "-") === fTipo)) return false;
      return true;
    });
  }, [pedidos, fCidade, fPdv, fTipo]);

  // progresso por pedido/produto
  const getProd = (id, prod) => fmtQ(progress?.[id]?.[prod] || 0);
  const setProd = (id, prod, qtd) => {
    const next = { ...(progress || {}) };
    next[id] = next[id] ? { ...next[id] } : {};
    next[id][prod] = Math.max(0, fmtQ(qtd));
    setProgress(next); saveProgress(next);
  };
  const restante = (id, prod, qtdSolic) => Math.max(0, fmtQ(qtdSolic) - getProd(id, prod));
  const finalizavel = (p) => p.itens.every(it => getProd(p.id, it.produto) >= fmtQ(it.qtd));

  const salvarParcial = () => alert("Progresso salvo.");
  const finalizarPedido = (pedido) => {
    if (!finalizavel(pedido)) { alert("Ainda há itens pendentes."); return; }
    const updated = (raw || []).map(p => (p.id === pedido.id ? { ...p, statusEtapa: "Produzido", dataProduzido: hojeISO() } : p));
    setRaw(updated); savePedidosLanPed(updated);
    const next = { ...(progress || {}) }; delete next[pedido.id]; setProgress(next); saveProgress(next);
  };

  return (
    <div className="alisab-main">
      <header className="erp-header">
        <div className="erp-header__inner">
          <div className="erp-header__logo"><img src="/LogomarcaDDnt2025Vazado.png" alt="Dudunitê" /></div>
          <div className="erp-header__title">PCP – Cozinha</div>
        </div>
      </header>

      {/* Filtros */}
      <div className="cozinha-filtros">
        <select value={fCidade} onChange={e=>setFCidade(e.target.value)}>{cidades.map(c => <option key={c}>{c}</option>)}</select>
        <select value={fPdv}    onChange={e=>setFPdv(e.target.value)}   >{pdvs.map(c => <option key={c}>{c}</option>)}</select>
        <select value={fTipo}   onChange={e=>setFTipo(e.target.value)}  >{tipos.map(c => <option key={c}>{c}</option>)}</select>
        <button className="btn-filtrar" onClick={()=>{}}>Filtrar</button>
      </div>

      {/* Post-its */}
      <div className="postits-list">
        {filtrados.map((p, idx) => (
          <div key={p.id || idx} className={`postit ${idx%2 ? "tilt-r" : "tilt-l"}`}>
            <div className="pin" />
            <div className="postit-header">
              <div className="pdv">{p.pdv || "-"} <span className="badge-status">{p.cidade || "-"}</span></div>
              <div className="resumo">
                <span>Status: <b>{p.statusEtapa || "—"}</b></span>
                {p.dataPrevista && <span>Previsto: <b>{String(p.dataPrevista).slice(0,10)}</b></span>}
              </div>
            </div>

            <div className="postit-body">
              {p.itens.map((it, i) => {
                const prod = getProd(p.id, it.produto);
                const rest = restante(p.id, it.produto, it.qtd);
                return (
                  <div key={i} className="produto-bloco">
                    <div className="produto-titulo">
                      <div><b>{it.produto}</b></div>
                      <div className="restantes">Restantes: {rest}</div>
                    </div>
                    <div className="prod-item">
                      <div>Solicitado: <b>{fmtQ(it.qtd)}</b></div>
                      <input type="number" min={0} value={prod}
                             onChange={(e)=>setProd(p.id, it.produto, e.target.value)} title="Quantidade produzida" />
                      <div className="restantes">Produzidos</div>
                      <div />
                    </div>
                  </div>
                );
              })}
              <div className="actions">
                <button className="btn-parcial"  onClick={salvarParcial}>Salvar parcial</button>
                <button className="btn-finalizar" onClick={()=>finalizarPedido(p)} disabled={!finalizavel(p)}>Produzido</button>
              </div>
            </div>
          </div>
        ))}

        {filtrados.length === 0 && (
          <div className="postit" style={{ rotate:"0deg" }}>
            <div className="pin" />
            <div className="postit-header">
              <div className="pdv">Sem pedidos</div>
              <div className="resumo">Somente pedidos com status <b>ALIMENTADO</b> aparecem aqui.</div>
            </div>
          </div>
        )}
      </div>

      <button className="btn-voltar-foot" onClick={() => setTela?.("HomeERP")}>🔙 Voltar</button>
      <footer className="erp-footer"><div className="erp-footer-track">• Cozinha exibe apenas pedidos ALIMENTADO •</div></footer>
    </div>
  );
}

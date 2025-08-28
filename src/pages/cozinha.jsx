// src/pages/cozinha.jsx
import React, { useEffect, useMemo, useState } from "react";
import "../util/cozinha.css";

// === util localStorage ===
const getJSON = (k) => {
  try { const r = localStorage.getItem(k); return r ? JSON.parse(r) : null; }
  catch { return null; }
};
const setJSON = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };

// === heurística: possíveis chaves que podem ter os pedidos ===
const CAND_KEYS = [
  "lanped_pedidos", "LanPed_pedidos", "LanPedPedidos", "lanpedPedidos", "lan_pedidos",
  "alisab_pedidos", "AliSab_pedidos", "alisab_mem", "alimentado_pedidos",
  "staped_pedidos", "pcp_pedidos"
];

// normalização de um pedido
function normPedido(p) {
  const base = {
    id: p.id || p.uuid || p._id || `p_${Math.random().toString(36).slice(2)}`,
    cidade: p.cidade || p.city || "",
    pdv: p.pdv || p.cliente || p.loja || p.nomePDV || "",
    statusEtapa: p.statusEtapa || p.status || (p.alimentado ? "Alimentado" : ""),
    dataPrevista: p.dataPrevista || p.vencimento || p.data || null,
  };

  // itens podem vir em várias formas
  if (Array.isArray(p.itens) && p.itens.length) {
    return {
      ...base,
      itens: p.itens.map(it => ({
        produto: it.produto || it.nome || "-",
        qtd: Number(it.quantidade ?? it.qtd ?? 0)
      })),
    };
  }
  if (p.produto && (p.quantidade ?? p.qtd) != null) {
    return {
      ...base,
      itens: [{ produto: p.produto, qtd: Number(p.quantidade ?? p.qtd ?? 0) }],
    };
  }
  // forma desconhecida -> ignora
  return null;
}

// varre todas as chaves do localStorage buscando arrays de pedidos com “Alimentado”
function scanStorageForAlimentado() {
  const found = [];

  // 1) tentar chaves conhecidas
  for (const k of CAND_KEYS) {
    const v = getJSON(k);
    if (Array.isArray(v)) {
      v.forEach((raw) => {
        const s = String(raw?.statusEtapa ?? raw?.status ?? (raw?.alimentado ? "Alimentado" : "")).toLowerCase();
        if (s === "alimentado") {
          const n = normPedido(raw);
          if (n) found.push(n);
        }
      });
    }
  }

  // 2) varrer todas as chaves (fallback)
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    // já checadas acima
    if (CAND_KEYS.includes(k)) continue;

    const v = getJSON(k);
    if (!Array.isArray(v)) continue;

    v.forEach((raw) => {
      const s = String(raw?.statusEtapa ?? raw?.status ?? (raw?.alimentado ? "Alimentado" : "")).toLowerCase();
      if (s === "alimentado") {
        const n = normPedido(raw);
        if (n) found.push(n);
      }
    });
  }

  // eliminar duplicados por id
  const uniq = new Map();
  for (const p of found) uniq.set(p.id, p);
  return Array.from(uniq.values());
}

// progresso local (parcial/produzido) – chave única
const PROGRESS_KEY = "cozinha_progress";
const loadProgress = () => getJSON(PROGRESS_KEY) || {};
const saveProgress = (m) => setJSON(PROGRESS_KEY, m || {});

// helpers
const qn = (n) => Number(n || 0);
const hojeISO = () => new Date().toISOString().slice(0, 10);

export default function Cozinha({ setTela }) {
  const [lista, setLista] = useState([]);
  const [progress, setProgress] = useState({});

  const [fCidade, setFCidade] = useState("Todos");
  const [fPdv,    setFPdv]    = useState("Todos");
  const [fTipo,   setFTipo]   = useState("Todos");

  useEffect(() => {
    // carrega pedidos “Alimentado” de onde estiverem
    setLista(scanStorageForAlimentado());
    setProgress(loadProgress());
  }, []);

  // opções de filtros
  const cidades = useMemo(
    () => ["Todos", ...new Set(lista.map(p => p.cidade).filter(Boolean))],
    [lista]
  );
  const pdvs = useMemo(
    () => ["Todos", ...new Set(lista.map(p => p.pdv).filter(Boolean))],
    [lista]
  );
  const tipos = useMemo(() => {
    const s = new Set();
    lista.forEach(p => p.itens?.forEach(it => s.add(it.produto || "-")));
    return ["Todos", ...Array.from(s)];
  }, [lista]);

  // aplica filtros
  const filtrados = useMemo(() => {
    return lista.filter(p => {
      if (String(p.statusEtapa || "").toLowerCase() !== "alimentado") return false;
      if (fCidade !== "Todos" && p.cidade !== fCidade) return false;
      if (fPdv    !== "Todos" && p.pdv    !== fPdv)    return false;
      if (fTipo   !== "Todos" && !p.itens?.some(it => (it.produto || "-") === fTipo)) return false;
      return true;
    });
  }, [lista, fCidade, fPdv, fTipo]);

  // controle de produção parcial
  const getProd = (id, prod) => qn(progress?.[id]?.[prod] || 0);
  const setProd = (id, prod, qtd) => {
    const next = { ...(progress || {}) };
    next[id] = next[id] ? { ...next[id] } : {};
    next[id][prod] = Math.max(0, qn(qtd));
    setProgress(next); saveProgress(next);
  };
  const restante = (id, prod, qtdSolic) => Math.max(0, qn(qtdSolic) - getProd(id, prod));
  const finalizavel = (p) => p.itens?.every(it => getProd(p.id, it.produto) >= qn(it.qtd));

  const salvarParcial = () => alert("Progresso salvo.");
  const finalizarPedido = (pedido) => {
    if (!finalizavel(pedido)) { alert("Ainda há itens pendentes."); return; }

    // marca como Produzido dentro da própria lista local (não altera fonte do AliSab)
    const updated = (lista || []).map(p => (
      p.id === pedido.id ? { ...p, statusEtapa: "Produzido", dataProduzido: hojeISO() } : p
    ));
    setLista(updated);

    const next = { ...(progress || {}) };
    delete next[pedido.id];
    setProgress(next); saveProgress(next);

    alert("Pedido marcado como PRODUZIDO.");
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
        <button className="btn-filtrar" onClick={()=>{ /* filtros já são reativos */ }}>Filtrar</button>
      </div>

      {/* Post-its */}
      <div className="postits-list">
        {filtrados.map((p, idx) => (
          <div key={p.id} className={`postit ${idx%2 ? "tilt-r" : "tilt-l"}`}>
            <div className="pin" />
            <div className="postit-header">
              <div className="pdv">{p.pdv || "-"} <span className="badge-status">{p.cidade || "-"}</span></div>
              <div className="resumo">
                <span>Status: <b>{p.statusEtapa || "—"}</b></span>
                {p.dataPrevista && <span>Previsto: <b>{String(p.dataPrevista).slice(0,10)}</b></span>}
              </div>
            </div>

            <div className="postit-body">
              {(p.itens || []).map((it, i) => {
                const prod = getProd(p.id, it.produto);
                const rest = restante(p.id, it.produto, it.qtd);
                return (
                  <div key={i} className="produto-bloco">
                    <div className="produto-titulo">
                      <div><b>{it.produto}</b></div>
                      <div className="restantes">Restantes: {rest}</div>
                    </div>
                    <div className="prod-item">
                      <div>Solicitado: <b>{qn(it.qtd)}</b></div>
                      <input
                        type="number" min={0} value={prod}
                        onChange={(e)=>setProd(p.id, it.produto, e.target.value)}
                        title="Quantidade produzida"
                      />
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

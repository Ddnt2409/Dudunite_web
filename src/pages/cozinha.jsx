// src/pages/cozinha.jsx
import React, { useEffect, useMemo, useState } from "react";
import "../util/cozinha.css"; // importa BG, header/footer e estilos (via CtsReceber.css)

/**
 * Fonte de dados:
 * - Pedidos vêm do LanPed salvos no localStorage na chave "lanped_pedidos"
 *   (ou chaves legadas). Cada pedido pode ter "itens" [{produto, quantidade}], ou
 *   um único produto/quantidade no próprio objeto.
 *
 * Comportamento:
 * - Filtros: Cidade, PDV, Tipo de Produto
 * - Atendimento parcial: guarda progresso por item na chave "cozinha_progress"
 * - Ao finalizar: marca statusEtapa = "Produzido", grava data e carimba "FINALIZADO"
 */

const ACUMULADOS_KEYS = [
  "lanped_pedidos", "LanPed_pedidos", "LanPedPedidos", "lanpedPedidos", "lan_pedidos"
];
const PROGRESS_KEY = "cozinha_progress";

const getLS = (k) => { try { const r = localStorage.getItem(k); return r ? JSON.parse(r) : null; } catch { return null; } };
const setLS = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };

const fmtQ = (n) => Number(n || 0);
const hojeISO = () => new Date().toISOString().slice(0,10);

function loadPedidosLanPed() {
  for (const k of ACUMULADOS_KEYS) {
    const v = getLS(k);
    if (Array.isArray(v) && v.length) return v;
  }
  return [];
}
function savePedidosLanPed(arr) {
  // persiste sempre na chave oficial
  setLS("lanped_pedidos", Array.isArray(arr) ? arr : []);
}

function normalizePedido(p) {
  // Normaliza para { id, cidade, pdv, itens: [{produto, qtd}], statusEtapa }
  const base = {
    id: p.id || `lp_${Math.random()}`,
    cidade: p.cidade || "",
    pdv: p.pdv || "",
    statusEtapa: p.statusEtapa || p.status || "",
    dataPrevista: p.dataPrevista || p.vencimento || null,
  };

  if (Array.isArray(p.itens) && p.itens.length) {
    const itens = p.itens.map(it => ({
      produto: it.produto || "-",
      qtd: fmtQ(it.quantidade),
    }));
    return { ...base, itens };
  }
  // fallback: single produto/quantidade no próprio objeto
  return {
    ...base,
    itens: [{
      produto: p.produto || "-",
      qtd: fmtQ(p.quantidade),
    }]
  };
}

function loadProgress() {
  return getLS(PROGRESS_KEY) || {}; // { [pedidoId]: { [produto]: qtdProduzida } }
}
function saveProgress(map) {
  setLS(PROGRESS_KEY, map || {});
}

export default function Cozinha({ setTela }) {
  const [raw, setRaw] = useState([]);
  const [progress, setProgress] = useState({});
  const [fCidade, setFCidade] = useState("Todos");
  const [fPdv, setFPdv] = useState("Todos");
  const [fTipo, setFTipo] = useState("Todos");

  // carrega pedidos + progresso
  useEffect(() => {
    setRaw(loadPedidosLanPed());
    setProgress(loadProgress());
  }, []);

  const pedidos = useMemo(() => raw.map(normalizePedido), [raw]);

  // opções dos selects
  const cidades = useMemo(() => {
    const s = new Set(pedidos.map(p => p.cidade || "").filter(Boolean));
    return ["Todos", ...Array.from(s)];
  }, [pedidos]);

  const pdvs = useMemo(() => {
    const s = new Set(pedidos.map(p => p.pdv || "").filter(Boolean));
    return ["Todos", ...Array.from(s)];
  }, [pedidos]);

  const tipos = useMemo(() => {
    const s = new Set();
    pedidos.forEach(p => p.itens.forEach(it => s.add(it.produto || "-")));
    return ["Todos", ...Array.from(s)];
  }, [pedidos]);

  // aplica filtros: por padrão esconde os Produzidos
  const filtrados = useMemo(() => {
    return pedidos.filter(p => {
      if (String(p.statusEtapa || "").toLowerCase() === "produzido") return false;
      if (fCidade !== "Todos" && p.cidade !== fCidade) return false;
      if (fPdv !== "Todos" && p.pdv !== fPdv) return false;
      if (fTipo !== "Todos") {
        const temTipo = p.itens.some(it => (it.produto || "-") === fTipo);
        if (!temTipo) return false;
      }
      return true;
    });
  }, [pedidos, fCidade, fPdv, fTipo]);

  // helpers de progresso
  const getProd = (pedidoId, produto) =>
    fmtQ(progress?.[pedidoId]?.[produto] || 0);

  const setProd = (pedidoId, produto, qtd) => {
    const next = { ...(progress || {}) };
    next[pedidoId] = next[pedidoId] ? { ...next[pedidoId] } : {};
    next[pedidoId][produto] = Math.max(0, fmtQ(qtd));
    setProgress(next);
    saveProgress(next);
  };

  const restante = (pedidoId, produto, qtdSolic) =>
    Math.max(0, fmtQ(qtdSolic) - getProd(pedidoId, produto));

  const pedidoFinalizavel = (p) =>
    p.itens.every(it => getProd(p.id, it.produto) >= fmtQ(it.qtd));

  // salva parcial = só persiste o map de progresso (já salvo onChange)
  const salvarParcial = () => {
    // nada extra — progress já é persistido a cada ajuste
    alert("Progresso salvo.");
  };

  const finalizarPedido = (pedido) => {
    if (!pedidoFinalizavel(pedido)) {
      alert("Ainda existem itens com quantidade restante.");
      return;
    }
    // Atualiza status no array de pedidos e persiste
    const updated = (raw || []).map(p => {
      if ((p.id || "") === pedido.id) {
        return {
          ...p,
          statusEtapa: "Produzido",
          dataProduzido: hojeISO(),
        };
      }
      return p;
    });
    setRaw(updated);
    savePedidosLanPed(updated);

    // limpa progresso desse pedido
    const next = { ...(progress || {}) };
    delete next[pedido.id];
    setProgress(next);
    saveProgress(next);
  };

  return (
    <div className="alisab-main">
      {/* Header padrão */}
      <header className="erp-header">
        <div className="erp-header__inner">
          <div className="erp-header__logo">
            <img src="/LogomarcaDDnt2025Vazado.png" alt="Dudunitê" />
          </div>
          <div className="erp-header__title">PCP – Cozinha</div>
        </div>
      </header>

      {/* Filtros */}
      <div className="cozinha-filtros">
        <select value={fCidade} onChange={(e)=>setFCidade(e.target.value)}>
          {cidades.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={fPdv} onChange={(e)=>setFPdv(e.target.value)}>
          {pdvs.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={fTipo} onChange={(e)=>setFTipo(e.target.value)}>
          {tipos.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <button className="btn-filtrar" onClick={()=>{ /* filtros já reagem ao state */ }}>
          Filtrar
        </button>
      </div>

      {/* Lista de post-its */}
      <div className="postits-list">
        {filtrados.map((p, idx) => {
          const finalizado = String(p.statusEtapa || "").toLowerCase() === "produzido";
          return (
            <div key={p.id || idx} className={`postit ${idx%2 ? "tilt-r" : "tilt-l"}`}>
              <div className="pin" />
              {finalizado && <div className="carimbo">FINALIZADO</div>}

              <div className="postit-header">
                <div className="pdv">
                  {p.pdv || "-"} &nbsp;
                  <span className="badge-status">{p.cidade || "-"}</span>
                </div>
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
                        <input
                          type="number"
                          min={0}
                          value={prod}
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
                  <button className="btn-parcial" onClick={salvarParcial}>
                    Salvar parcial
                  </button>
                  <button
                    className="btn-finalizar"
                    onClick={()=>finalizarPedido(p)}
                    disabled={!pedidoFinalizavel(p)}
                  >
                    Produzido
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {filtrados.length === 0 && (
          <div className="postit" style={{ rotate:"0deg" }}>
            <div className="pin" />
            <div className="postit-header">
              <div className="pdv">Sem pedidos</div>
              <div className="resumo">Ajuste os filtros para visualizar.</div>
            </div>
          </div>
        )}
      </div>

      {/* Rodapé + Voltar */}
      <button className="btn-voltar-foot" onClick={() => setTela?.("HomeERP")}>🔙 Voltar</button>
      <footer className="erp-footer">
        <div className="erp-footer-track">
          • Filtre por Cidade / PDV / Tipo • Atenda parcialmente • Finalize com “Produzido” •
        </div>
      </footer>
    </div>
  );
          }

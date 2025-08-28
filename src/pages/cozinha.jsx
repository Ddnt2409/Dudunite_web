import React, { useEffect, useMemo, useState } from 'react';
import '../util/cozinha.css';

import {
  subscribePedidosAlimentados,
  salvarParcial,
  marcarProduzido,
  resumoPedido
} from '../util/cozinha_store';

export default function Cozinha({ setTela }) {
  const [cidade, setCidade] = useState('Todos');
  const [pdv,    setPdv]    = useState('Todos');
  const [tipo,   setTipo]   = useState('Todos');

  const [todosPedidos, setTodosPedidos] = useState([]);
  const [carregando, setCarregando]     = useState(true);

  // Assinatura em tempo real (somente statusEtapa = "Alimentado")
  useEffect(() => {
    setCarregando(true);
    const off = subscribePedidosAlimentados({ cidade, pdv }, (arr) => {
      setTodosPedidos(arr);
      setCarregando(false);
    });
    return off;
  }, [cidade, pdv]);

  const cidades = useMemo(
    () => ['Todos', ...uniq(todosPedidos.map(p => p.cidade).filter(Boolean))],
    [todosPedidos]
  );
  const pdvs = useMemo(
    () => ['Todos', ...uniq(todosPedidos.map(p => p.pdv).filter(Boolean))],
    [todosPedidos]
  );
  const tipos = useMemo(() => {
    const s = new Set();
    todosPedidos.forEach(p => (p.itens || []).forEach(it => it.tipo && s.add(it.tipo)));
    return ['Todos', ...Array.from(s)];
  }, [todosPedidos]);

  const pedidos = useMemo(() => {
    if (tipo === 'Todos') return todosPedidos;
    return todosPedidos.filter(p => (p.itens || []).some(it => it.tipo === tipo));
  }, [todosPedidos, tipo]);

  async function onSalvarParcial(p, produto, qtd) {
    const n = Number(qtd || 0);
    if (n <= 0) return alert('Informe uma quantidade válida.');
    try { await salvarParcial(p.id, produto, n); }
    catch (e) { alert('Erro ao salvar parcial: ' + e.message); }
  }

  async function onProduzido(p) {
    const r = resumoPedido(p);
    if (!r.completo) {
      const ok = confirm('Ainda há itens pendentes. Marcar como PRODUZIDO assim mesmo?');
      if (!ok) return;
    }
    try { await marcarProduzido(p.id); }
    catch (e) { alert('Erro ao marcar produzido: ' + e.message); }
  }

  return (
    <div className="alisab-main">
      {/* Cabeçalho padrão */}
      <header className="erp-header">
        <div className="erp-header__inner">
          <div className="erp-header__logo">
            <img src="/LogomarcaDDnt2025Vazado.png" alt="Dudunitê" />
          </div>
          <div className="erp-header__title">PCP — Cozinha</div>
        </div>
      </header>

      {/* Filtros */}
      <div className="alisab-header" style={{ gap: 8 }}>
        <div>
          <div style={{ fontSize:12, fontWeight:800, color:'#5C1D0E' }}>Cidade</div>
          <select value={cidade} onChange={e=>setCidade(e.target.value)}>
            {cidades.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <div style={{ fontSize:12, fontWeight:800, color:'#5C1D0E' }}>PDV</div>
          <select value={pdv} onChange={e=>setPdv(e.target.value)}>
            {pdvs.map(v => <option key={v} value={v}>{v}</option>)}
          </select>
        </div>
        <div>
          <div style={{ fontSize:12, fontWeight:800, color:'#5C1D0E' }}>Tipo de produto</div>
          <select value={tipo} onChange={e=>setTipo(e.target.value)}>
            {tipos.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
      </div>

      {/* Sem dados */}
      {carregando && <div style={{ padding:10 }}>Carregando pedidos…</div>}
      {!carregando && pedidos.length === 0 && (
        <div className="postit" style={{ maxWidth:360 }}>
          <div className="pin" />
          <div className="postit-header">
            <div className="pdv">Sem pedidos</div>
            <div className="resumo">
              <span>Somente pedidos com status <b>ALIMENTADO</b> aparecem aqui.</span>
            </div>
          </div>
        </div>
      )}

      {/* Lista de post-its */}
      <div className="postits-list" style={{ marginTop:8 }}>
        {pedidos.map((p) => {
          const r = resumoPedido(p);
          return (
            <div key={p.id} className="postit tilt-l">
              <div className="pin" />
              {r.parcial && <div className="carimbo">PARCIAL</div>}

              <div className="postit-header">
                <div className="pdv">{p.pdv} — {p.cidade}</div>
                <div className="resumo">
                  <span>Previsto: <b>{p.dataPrevista || '-'}</b></span>
                  <span>Progresso: <b>{r.produzido}</b> / <b>{r.total}</b></span>
                </div>
              </div>

              <div className="postit-body">
                {(p.itens || []).map((it, idx) => {
                  const prod = Number((p.parciais || {})[it.produto] || 0);
                  return (
                    <div key={idx} className="produto-bloco">
                      <div className="produto-titulo">
                        <div><b>{it.produto}</b> — Solicitado: {it.qtd}</div>
                        <div className="restantes">Produzido: {prod}</div>
                      </div>

                      <div style={{ display:'grid', gridTemplateColumns:'120px auto', gap:8 }}>
                        <input
                          type="number" min="1" placeholder="Qtd"
                          id={`q_${p.id}_${idx}`}
                          style={{ height:40, borderRadius:10, padding:'0 10px' }}
                        />
                        <button
                          className="btn-add"
                          onClick={() => {
                            const val = document.getElementById(`q_${p.id}_${idx}`)?.value || '0';
                            onSalvarParcial(p, it.produto, val);
                            const el = document.getElementById(`q_${p.id}_${idx}`);
                            if (el) el.value = '';
                          }}
                        >
                          Salvar parcial
                        </button>
                      </div>
                    </div>
                  );
                })}

                <div className="acoes">
                  <button className="btn-salvar" onClick={() => onProduzido(p)}>
                    Produzido
                  </button>
                  <button className="btn-cancelar" onClick={() => setTela?.('HomeERP')}>
                    Voltar
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Rodapé padrão */}
      <button className="btn-voltar-foot" onClick={() => setTela?.('HomeERP')}>🔙 Voltar</button>
      <footer className="erp-footer">
        <div className="erp-footer-track">• Cozinha exibe apenas pedidos ALIMENTADO •</div>
      </footer>
    </div>
  );
}

function uniq(a){ return Array.from(new Set(a)); }

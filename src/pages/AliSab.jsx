// src/pages/AliSab.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
  collection, query, where, getDocs, updateDoc, doc,
  serverTimestamp, Timestamp
} from "firebase/firestore";
import db from "../firebase";

// ===== Sabores (ampliado) =====
const SABORES = {
  "BROWNIE 7X7": [
    "Ninho","Ninho com Nutella","Brigadeiro branco","Brigadeiro branco com confete",
    "Beijinho","Oreo","Ovomaltine","Paçoca","Bem casado","Brigadeiro preto",
    "Brigadeiro preto com confete","Palha italiana","Prestígio","KitKat","Dois Amores"
  ],
  "BROWNIE 6X6": [
    "Ninho","Ninho com Nutella","Brigadeiro branco","Brigadeiro branco com confete",
    "Beijinho","Oreo","Ovomaltine","Paçoca","Bem casado","Brigadeiro preto",
    "Brigadeiro preto com confete","Palha italiana","Prestígio","KitKat","Dois Amores"
  ],
  "POCKET 5X5": [
    "Ninho","Ninho com Nutella","Brigadeiro branco","Brigadeiro branco com confete",
    "Beijinho","Oreo","Ovomaltine","Paçoca","Bem casado","Brigadeiro preto",
    "Brigadeiro preto com confete","Palha italiana","Prestígio","KitKat","Dois Amores"
  ],
  "POCKET 6X6": [
    "Ninho","Ninho com Nutella","Brigadeiro branco","Brigadeiro branco com confete",
    "Beijinho","Oreo","Ovomaltine","Paçoca","Bem casado","Brigadeiro preto",
    "Brigadeiro preto com confete","Palha italiana","Prestígio","KitKat","Dois Amores"
  ],
  "ESCONDIDINHO": [
    "Branco","Preto","Bem casado","Ninho","Ninho com Nutella","Oreo","Ovomaltine"
  ],
  "DUDU": [
    "Dd Oreo","Dd Ovomaltine","Dd Ninho com Nutella","Dd Creme de Maracujá","Dd KitKat","Dd Paçoca"
  ],
};

// ===== Normalização nomes do banco → chaves de cima =====
const normalizaProduto = (p) => {
  const t = (p || "").toUpperCase();
  if (t.includes("BRW 7")) return "BROWNIE 7X7";
  if (t.includes("BRW 6")) return "BROWNIE 6X6";
  if (t.includes("PKT 5")) return "POCKET 5X5";
  if (t.includes("PKT 6")) return "POCKET 6X6";
  if (t.startsWith("ESC"))  return "ESCONDIDINHO";
  if (t.startsWith("DUDU")) return "DUDU";
  if (t.includes("BROWNIE 7X7")) return "BROWNIE 7X7";
  if (t.includes("BROWNIE 6X6")) return "BROWNIE 6X6";
  if (t.includes("POCKET 5X5")) return "POCKET 5X5";
  if (t.includes("POCKET 6X6")) return "POCKET 6X6";
  return p || "—";
};

// ===== Próxima segunda às 23:59 (para esconder o carimbo depois) =====
const proxSegunda = () => {
  const d = new Date();
  const dow = d.getDay(); // 0=Dom, 1=Seg
  let add = (1 - dow + 7) % 7;
  if (add === 0) add = 7;
  d.setDate(d.getDate() + add);
  d.setHours(23, 59, 0, 0);
  return d;
};

// ===== estilos inline (para garantir) =====
const S = {
  page: {
    minHeight: "100vh",
    padding: "12px 10px 40px",
    background: "radial-gradient(ellipse at center, rgba(255,240,200,.35), rgba(255,200,120,.15))",
  },
  headerRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  h2: { fontSize: 18, fontWeight: 700, color: "#5C1D0E" },
  back: {
    border: 0, background: "#8c3b1b", color: "#fff", padding: "8px 12px",
    borderRadius: 10, boxShadow: "0 2px 0 #5a1206", fontWeight: 700
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)", // 3 por linha sempre
    gap: 12,
  },
  card: {
    position: "relative",
    background: "linear-gradient(180deg,#fff7b1,#ffe986)",
    borderRadius: 14,
    padding: "14px 14px 22px",
    minHeight: 120,
    boxShadow: "0 16px 24px rgba(0,0,0,.18), 0 2px 0 rgba(165,120,20,.35) inset",
    transform: "rotate(-1deg)",
    transition: "transform .15s ease, box-shadow .15s ease",
    overflow: "hidden",
  },
  cardTiltR: { transform: "rotate(1.2deg)" },
  fold: {
    position: "absolute", right: 10, top: 10, width: 0, height: 0,
    borderLeft: "16px solid transparent", borderTop: "16px solid rgba(255,255,255,.85)",
    filter: "drop-shadow(0 2px 2px rgba(0,0,0,.25))"
  },
  pin: {
    position: "absolute", top: -8, left: "50%", transform: "translateX(-50%)",
    width: 18, height: 18, background: "#e53935", borderRadius: "50%",
    boxShadow: "0 2px 0 #b71c1c, 0 6px 10px rgba(0,0,0,.35)"
  },
  pdv: { fontWeight: 800, fontSize: 18, color: "#5C1D0E", marginBottom: 6 },
  resumo: { color: "#6b4b12", opacity: .9, fontSize: 13 },
  stamp: {
    position: "absolute", right: -24, top: 10, transform: "rotate(-22deg)",
    border: "3px solid #b71c1c", color: "#b71c1c", fontWeight: 900,
    padding: "4px 10px", borderRadius: 6, background: "rgba(255,255,255,.6)",
    letterSpacing: 2
  },
  // painel central grande
  overlay: {
    position: "fixed", inset: 0, background: "rgba(0,0,0,.35)", zIndex: 50
  },
  panel: {
    position: "fixed", left: "50%", top: "52%", transform: "translate(-50%,-50%)",
    width: "92vw", maxWidth: 620, // bem maior no celular
    background: "linear-gradient(180deg,#fff7b1,#ffe986)",
    borderRadius: 16, boxShadow: "0 20px 40px rgba(0,0,0,.45)",
    padding: 16, zIndex: 60
  },
  tituloPanel: { fontSize: 20, fontWeight: 800, color: "#5C1D0E", marginBottom: 10 },
  blocoProd: {
    background: "rgba(255,255,255,.55)", borderRadius: 12, padding: 12, marginBottom: 12,
    boxShadow: "inset 0 1px 0 rgba(255,255,255,.8)"
  },
  linhaAdd: { display: "flex", gap: 8, marginTop: 8 },
  select: { flex: 1, padding: "10px 12px", borderRadius: 10, border: "1px solid #cdbb77", fontSize: 16 },
  qtd: { width: 90, padding: "10px 12px", borderRadius: 10, border: "1px solid #cdbb77", fontSize: 16, textAlign: "center" },
  btnAdd: {
    border: 0, background: "#6b4b12", color: "#fff", padding: "10px 12px",
    borderRadius: 10, fontWeight: 700
  },
  linhas: { listStyle: "none", padding: 0, marginTop: 8 },
  li: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    padding: "8px 10px", background: "rgba(255,255,255,.8)", borderRadius: 8, marginTop: 6
  },
  btnX: { border: 0, background: "#b71c1c", color: "#fff", borderRadius: 8, padding: "4px 8px" },
  acoes: { display: "flex", gap: 10, marginTop: 12 },
  salvar: { flex: 1, border: 0, background: "#8c3b1b", color: "#fff", padding: "12px", borderRadius: 12, fontWeight: 800 },
  cancelar: { width: 120, border: 0, background: "#e2e2e2", color: "#222", padding: "12px", borderRadius: 12, fontWeight: 700 },
};

// =================================================================================

export default function AliSab({ setTela }) {
  const [pedidos, setPedidos] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  // draft[pedidoId][produto] = {total, usados, linhas:[{sabor,qtd}]}
  const [draft, setDraft] = useState({});

  // carrega Lançado + Alimentado (para manter carimbo)
  useEffect(() => {
    (async () => {
      const col = collection(db, "PEDIDOS");
      const q1 = query(col, where("statusEtapa", "==", "Lançado"));
      const q2 = query(col, where("statusEtapa", "==", "Alimentado"));
      const [s1, s2] = await Promise.all([getDocs(q1), getDocs(q2)]);
      const map = new Map();
      [...s1.docs, ...s2.docs].forEach(d => {
        const data = d.data() || {};
        map.set(d.id, { id: d.id, ...data, itens: Array.isArray(data.itens) ? data.itens : [] });
      });
      setPedidos(Array.from(map.values()));
    })();
  }, []);

  // inicia draft ao expandir
  useEffect(() => {
    if (!expandedId) return;
    const p = pedidos.find(x => x.id === expandedId);
    if (!p) return;
    setDraft(prev => {
      if (prev[expandedId]) return prev;
      const base = {};
      (p.itens || []).forEach(it => {
        const produto = normalizaProduto(it.produto);
        base[produto] = { linhas: [], usados: 0, total: Number(it.quantidade || 0) };
      });
      return { ...prev, [expandedId]: base };
    });
  }, [expandedId, pedidos]);

  const pedidosOrdenados = useMemo(
    () => [...pedidos].sort((a, b) => (a.escola || "").localeCompare(b.escola || "")),
    [pedidos]
  );

  const mostraCarimbo = (p) => {
    if (p.statusEtapa !== "Alimentado") return false;
    const exp = p.carimboExpiraEm?.toDate?.();
    if (!exp) return true;
    return new Date() < exp;
  };

  const addLinha = (pid, produto, sabor, qtd) => {
    if (!sabor || !qtd) return;
    setDraft(prev => {
      const bloco = prev[pid]?.[produto];
      if (!bloco) return prev;
      const usados = bloco.usados + Number(qtd);
      if (usados > bloco.total) return prev;
      return {
        ...prev,
        [pid]: {
          ...prev[pid],
          [produto]: { ...bloco, usados, linhas: [...bloco.linhas, { sabor, qtd: Number(qtd) }] }
        }
      };
    });
  };

  const remLinha = (pid, produto, idx) => {
    setDraft(prev => {
      const bloco = prev[pid]?.[produto];
      if (!bloco) return prev;
      const linhas = [...bloco.linhas];
      const removed = linhas.splice(idx, 1)[0];
      return {
        ...prev,
        [pid]: {
          ...prev[pid],
          [produto]: { ...bloco, linhas, usados: bloco.usados - (removed?.qtd || 0) }
        }
      };
    });
  };

  const salvar = async (pedido) => {
    const dados = draft[pedido.id] || {};
    const sabores = {};
    Object.entries(dados).forEach(([produto, bloco]) => {
      sabores[produto] = bloco.linhas;
    });
    const exp = Timestamp.fromDate(proxSegunda());
    await updateDoc(doc(db, "PEDIDOS", pedido.id), {
      sabores,
      statusEtapa: "Alimentado",
      atualizadoEm: serverTimestamp(),
      carimboExpiraEm: exp,
    });
    setPedidos(prev => prev.map(p => p.id === pedido.id
      ? { ...p, statusEtapa: "Alimentado", carimboExpiraEm: exp }
      : p));
    setExpandedId(null);
  };

  return (
    <div style={S.page}>
      <div style={S.headerRow}>
        <h2 style={S.h2}>🍫 Alimentar Sabores — <span style={{opacity:.6}}>v-inline</span></h2>
        <button style={S.back} onClick={() => setTela("HomePCP")}>🔙 Voltar ao PCP</button>
      </div>

      <div style={S.grid}>
        {pedidosOrdenados.map((p, idx) => {
          const total = (p.itens || []).reduce((s, it) => s + Number(it.quantidade || 0), 0);
          const resumo = (p.itens || [])
            .map(it => `${Number(it.quantidade || 0)}× ${normalizaProduto(it.produto)}`).join(", ");
          const ativo = expandedId === p.id;

          return (
            <div
              key={p.id}
              style={{ ...S.card, ...(idx%2?S.cardTiltR:{}), ...(ativo?{transform:"scale(1.02)"}:{}) }}
              onClick={() => setExpandedId(ativo ? null : p.id)}
            >
              <div style={S.pin} />
              <div style={S.fold} />
              {mostraCarimbo(p) && <span style={S.stamp}>ALIMENTADO</span>}

              <div style={S.pdv}>{p.escola || "—"}</div>
              <div style={S.resumo}>{total}× — {resumo || "—"}</div>

              {ativo && (
                <>
                  <div style={S.overlay} onClick={() => setExpandedId(null)} />
                  <div style={S.panel} onClick={e => e.stopPropagation()}>
                    <div style={S.tituloPanel}>{p.escola || "—"}</div>

                    {(p.itens || []).map((it, i) => {
                      const produto = normalizaProduto(it.produto);
                      const bloco = draft[p.id]?.[produto] || { total: Number(it.quantidade||0), usados: 0, linhas: [] };
                      const restantes = Math.max(0, bloco.total - bloco.usados);

                      let selRef, qtdRef;

                      return (
                        <div key={i} style={S.blocoProd}>
                          <div style={{display:"flex",justifyContent:"space-between",fontWeight:800,color:"#5C1D0E"}}>
                            <span>{bloco.total}× {produto}</span>
                            <span>Restantes: {restantes}</span>
                          </div>

                          <div style={S.linhaAdd}>
                            <select ref={r=>selRef=r} defaultValue="" style={S.select}>
                              <option value="" disabled>Sabor…</option>
                              {(SABORES[produto]||[]).map(s=><option key={s} value={s}>{s}</option>)}
                            </select>
                            <input ref={r=>qtdRef=r} type="number" min="1" placeholder="Qtd" style={S.qtd}/>
                            <button style={S.btnAdd} onClick={()=>{
                              const sabor = selRef?.value;
                              const qtd = Number(qtdRef?.value||0);
                              if(!sabor||!qtd) return;
                              addLinha(p.id, produto, sabor, qtd);
                              if(qtdRef) qtdRef.value="";
                              if(selRef) selRef.value="";
                            }}>➕ Adicionar</button>
                          </div>

                          {bloco.linhas.length>0 && (
                            <ul style={S.linhas}>
                              {bloco.linhas.map((ln, li)=>(
                                <li key={li} style={S.li}>
                                  <span>{ln.qtd}× {ln.sabor}</span>
                                  <button style={S.btnX} onClick={()=>remLinha(p.id, produto, li)}>✖</button>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      );
                    })}

                    <div style={S.acoes}>
                      <button style={S.salvar} onClick={()=>salvar(p)}>💾 Salvar Sabores</button>
                      <button style={S.cancelar} onClick={()=>setExpandedId(null)}>✖ Cancelar</button>
                    </div>
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

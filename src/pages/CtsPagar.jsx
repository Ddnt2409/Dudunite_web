// src/pages/CtsPagar.jsx
import React, { useEffect, useMemo, useState } from "react";
import "./CtsPagar.css";
import { criarPrevistosPagar, atualizarFluxo } from "../util/financeiro_store";

/* ===================== CONSTANTES / HELPERS ===================== */
const FORMAS = ["PIX", "Débito", "Crédito", "Boleto", "Transferência", "Dinheiro"];
const PERIODOS = [
  "Único","Semanal","Quinzenal","Mensal","Bimestral","Trimestral","Semestral","Anual",
];
const fmtBRL = (v) => (Number(v || 0)).toLocaleString("pt-BR",{style:"currency",currency:"BRL"});

/** Plano de Contas (pagar) — opções completas */
const PLANOS_PAGAR = [
  // 1. Pessoal
  { v: "1", t: "1 Pessoal" },
  { v: "1.01", t: "1.01 casa" },
  { v: "1.01.01", t: "1.01.01 desp fixas casa" },
  { v: "1.01.01.001", t: "1.01.01.001 água casa" },
  { v: "1.01.01.002", t: "1.01.01.002 celpe casa" },
  { v: "1.01.01.003", t: "1.01.01.003 aluguel casa" },
  { v: "1.01.01.004", t: "1.01.01.004 Internet casa" },
  { v: "1.01.01.005", t: "1.01.01.005 cuidados casa" },

  { v: "1.01.02", t: "1.01.02 desp variaveis pessoal" },
  { v: "1.01.02.001", t: "1.01.02.001 feira" },
  { v: "1.01.02.002", t: "1.01.02.002 lanches" },
  { v: "1.01.02.003", t: "1.01.02.003 eventos casa" },
  { v: "1.01.02.004", t: "1.01.02.004 suplementos" },

  { v: "1.01.03", t: "1.01.03 desp fixas pessoal" },
  { v: "1.01.03.001", t: "1.01.03.001 escolas" },
  { v: "1.01.03.002", t: "1.01.03.002 academia" },
  { v: "1.01.03.003", t: "1.01.03.003 personal" },
  { v: "1.01.03.004", t: "1.01.03.004 gasolina" },
  { v: "1.01.03.005", t: "1.01.03.005 farmácia" },
  { v: "1.01.03.006", t: "1.01.03.006 consultas e exames" },

  { v: "1.01.04", t: "1.01.04 assinaturas" },
  { v: "1.01.04.001", t: "1.01.04.001 Internet casa" },
  { v: "1.01.04.002", t: "1.01.04.002 TV box" },
  { v: "1.01.04.003", t: "1.01.04.003 celular" },
  { v: "1.01.04.004", t: "1.01.04.004 futuro 1" },
  { v: "1.01.04.005", t: "1.01.04.005 futuro 2" },

  { v: "1.01.05", t: "1.01.05 cuidados casa" },
  { v: "1.01.05.001", t: "1.01.05.001 pintura casa" },
  { v: "1.01.05.002", t: "1.01.05.002 elétrica casa" },
  { v: "1.01.05.003", t: "1.01.05.003 hidráulica casa" },
  { v: "1.01.05.004", t: "1.01.05.004 decoração casa" },
  { v: "1.01.05.005", t: "1.01.05.005 gás casa" },

  { v: "1.01.06", t: "1.01.06 pessoais" },
  { v: "1.01.06.001", t: "1.01.06.001 cabelo" },
  { v: "1.01.06.003", t: "1.01.06.003 manicure" },
  { v: "1.01.06.004", t: "1.01.06.004 unha" },
  { v: "1.01.06.005", t: "1.01.06.005 sobrancelha" },
  { v: "1.01.06.006", t: "1.01.06.006 maquiagem" },
  { v: "1.01.06.007", t: "1.01.06.007 buço" },
  { v: "1.01.06.008", t: "1.01.06.008 massagem" },
  { v: "1.01.06.009", t: "1.01.06.009 vestuário" },
  { v: "1.01.06.010", t: "1.01.06.010 futuro 2" },

  { v: "1.01.07", t: "1.01.07 diversão" },
  { v: "1.01.07.001", t: "1.01.07.001 locação" },
  { v: "1.01.07.002", t: "1.01.07.002 alimentação" },
  { v: "1.01.07.003", t: "1.01.07.003 deslocamento" },

  // 2. Dudunitê
  { v: "2", t: "2 Dudunitê" },
  { v: "2.01", t: "2.01 empresa" },
  { v: "2.01.01", t: "2.01.01 desp fixas emp" },
  { v: "2.01.01.001", t: "2.01.01.001 água emp" },
  { v: "2.01.01.002", t: "2.01.01.002 celpe emp" },
  { v: "2.01.01.003", t: "2.01.01.003 aluguel emp" },
  { v: "2.01.01.004", t: "2.01.01.004 Internet emp" },
  { v: "2.01.01.005", t: "2.01.01.005 ferramentas" },
  { v: "2.01.01.006", t: "2.01.01.006 manutenção serviço emp" },

  { v: "2.01.02", t: "2.01.02 desp variaveis emp" },
  { v: "2.01.02.001", t: "2.01.02.001 gas emp" },
  { v: "2.01.02.002", t: "2.01.02.002 manutenção emp" },
  { v: "2.01.02.003", t: "2.01.02.003 pintura emp" },
  { v: "2.01.02.004", t: "2.01.02.004 hidráulica emp" },
  { v: "2.01.02.005", t: "2.01.02.005 futuro 1" },
  { v: "2.01.02.006", t: "2.01.02.006 futuro 2"},
  { v: "2.01.02.007", t: "2.01.02.007 seguros"},
  { v: "2.01.03", t: "2.01.03 insumos" },
  { v: "2.01.03.001", t: "2.01.03.001 produção emp" },
  { v: "2.01.03.002", t: "2.01.03.002 embalagem emp" },
  { v: "2.01.03.003", t: "2.01.03.003 recheio emp" },
  { v: "2.01.03.004", t: "2.01.03.004 terceiros emp" },
  { v: "2.01.03.005", t: "2.01.03.005 papelaria emp" },
  { v: "2.01.03.006", t: "2.01.03.006 equipamentos" },
  { v: "2.01.04", t: "2.01.04 custos financeiros"},
  { v: "2.01.04.001", t: "2.01.04.001 juros" },
  { v: "2.01.04.002", t: "2.01.04.002 empréstimos" },
  { v: "2.01.04.003", t: "2.01.04.003 imposto" },
  { v: "2.01.04.004", t: "2.01.04.004 taxas bancarias" },
];

/* ===================== COMPONENTE ===================== */
export default function CtsPagar({ setTela }) {
  // estados básicos
  const [periodicidade, setPeriodicidade] = useState("Único");
  // Ocorrências como string: permite "" no mobile
  const [ocorrencias, setOcorrencias] = useState("1");
  // linhas de vencimento (data/valor)
  const [vencs, setVencs] = useState([{ data: new Date().toISOString().slice(0, 10), valor: "" }]);
  const [forma, setForma] = useState("PIX");
  const [plano, setPlano] = useState("");
  const [descricao, setDescricao] = useState("");
  // modo edição
  const [editId, setEditId] = useState(null);
  // debug
  const [dbgOpen, setDbgOpen] = useState(false);
  const [dbgDump, setDbgDump] = useState("");

  // total do lote (saída negativa)
  const totalLote = useMemo(
    () => -1 * vencs.reduce((s, v) => s + Math.abs(Number(v.valor || 0)), 0),
    [vencs]
  );

  /* ---------- Pré-preencher quando vem de "editar_financeiro" ---------- */
  useEffect(() => {
    try {
      const raw = localStorage.getItem("editar_financeiro");
      if (!raw) return;
      const info = JSON.parse(raw);
      if (info && String(info.origem).toUpperCase() === "PAGAR") {
        setEditId(info.id || null);
        setPeriodicidade("Único");
        setOcorrencias("1");

        const d = info.data
          ? typeof info.data === "string"
            ? info.data.slice(0, 10)
            : new Date(info.data).toISOString().slice(0, 10)
          : new Date().toISOString().slice(0, 10);
        setVencs([{ data: d, valor: Math.abs(Number(info.valor || 0)) || "" }]);

        if (info.formaPagamento && FORMAS.includes(info.formaPagamento)) setForma(info.formaPagamento);
        if (info.planoContas) setPlano(info.planoContas);
        if (info.descricao) setDescricao(info.descricao);
      }
    } catch {}
    finally {
      localStorage.removeItem("editar_financeiro");
    }
  }, []);

  /* ----------------------------- Helpers UI ---------------------------- */
  function aplicarOcorrencias(n) {
    const num = Math.max(1, Number(n || 1));
    setOcorrencias(String(num));
    setVencs((prev) => {
      const base = prev[0] || { data: new Date().toISOString().slice(0, 10), valor: "" };
      const arr = Array.from({ length: num }, (_, i) =>
        i === 0 ? base : { data: base.data, valor: "" }
      );
      return arr;
    });
  }

  function preencherDatasAuto() {
    setVencs((prev) => {
      const base = prev[0]?.data ? new Date(prev[0].data) : new Date();
      const arr = prev.map((v, i) => {
        if (i === 0) return v;
        const d = new Date(base);
        switch (periodicidade) {
          case "Semanal":   d.setDate(base.getDate() + 7 * i); break;
          case "Quinzenal": d.setDate(base.getDate() + 15 * i); break;
          case "Mensal":    d.setMonth(base.getMonth() + i); break;
          case "Bimestral": d.setMonth(base.getMonth() + 2 * i); break;
          case "Trimestral":d.setMonth(base.getMonth() + 3 * i); break;
          case "Semestral": d.setMonth(base.getMonth() + 6 * i); break;
          case "Anual":     d.setFullYear(base.getFullYear() + i); break;
          default: break;
        }
        return { ...v, data: d.toISOString().slice(0, 10) };
      });
      return arr;
    });
  }

  function setVencField(i, field, value) {
    setVencs((prev) => {
      const arr = [...prev];
      arr[i] = { ...arr[i], [field]: value };
      return arr;
    });
  }

  function dumpUltimos() {
    try {
      const arr = JSON.parse(localStorage.getItem("financeiro_fluxo") || "[]");
      const ult = arr.slice(-10);
      setDbgDump(JSON.stringify(ult, null, 2));
      setDbgOpen(true);
    } catch (e) {
      setDbgDump("Erro lendo localStorage: " + (e?.message || e));
      setDbgOpen(true);
    }
  }

  /* ----------------------------- Salvar ----------------------------- */
  async function salvarPrevisto() {
    // validações
    if (!plano) return alert("Selecione o Plano de Contas.");
    if (!forma) return alert("Informe a Forma de pagamento.");
    for (const [i, v] of vencs.entries()) {
      if (!v.data) return alert(`Informe a data da ocorrência #${i + 1}.`);
      if (!v.valor || Number(v.valor) <= 0)
        return alert(`Informe o valor da ocorrência #${i + 1}.`);
    }

    // ===== MODO EDIÇÃO =====
    if (editId) {
      try {
        const v = Math.abs(Number(vencs[0].valor || 0));
        await atualizarFluxo(editId, {
          conta: "EXTRATO BANCARIO",
          statusFinanceiro: "Previsto",
          origem: "PAGAR",
          lado: "SAIDA",
          tipo: "PAGAR",
          dataPrevista: vencs[0].data,
          valorPrevisto: -v,
          dataRealizado: null,
          valorRealizado: null,
          formaPagamento: forma,
          planoContas: plano,
          descricao: descricao || "PAGAMENTO",
        });
        alert("Lançamento atualizado com sucesso.");
        setTela?.("FluxCx");
        return;
      } catch (e) {
        alert("Falha ao atualizar: " + (e?.message || e));
        return;
      }
    }

    // ===== NOVOS LANÇAMENTOS =====
    try {
      const docs = vencs.map((v, idx) => ({
        dataPrevista: v.data,
        valor: Number(v.valor || 0), // a função no store transforma em negativo
        forma,
        planoContas: plano,
        descricao: descricao || "PAGAMENTO",
        meta: { periodicidade, ocorrencias: Number(ocorrencias || 1), ordem: idx + 1 },
      }));

      await criarPrevistosPagar(docs);

      alert(
        `Previsto salvo. Ocorrências: ${vencs.length}. Total do lote: ${fmtBRL(
          Math.abs(totalLote)
        )}.`
      );

      // limpar
      setDescricao("");
      setPlano("");
      setForma("PIX");
      setPeriodicidade("Único");
      setOcorrencias("1");
      setVencs([{ data: new Date().toISOString().slice(0, 10), valor: "" }]);
    } catch (e) {
      alert("Erro ao salvar previsto: " + (e?.message || e));
    }
  }

  /* ------------------------------ RENDER ------------------------------ */
  return (
    <div className="ctspagar-main">
      {/* HEADER padrão */}
      <header className="erp-header">
        <div className="erp-header__inner">
          <div className="erp-header__logo">
            <img src="/LogomarcaDDnt2025Vazado.png" alt="Dudunitê" />
          </div>
          <div className="erp-header__title">
            ERP DUDUNITÊ<br/>Financeiro
          </div>
        </div>
      </header>

      {/* CARD */}
      <div className="ctspagar-card">
        <h2>Lançar Pagamento (Previsto)</h2>

        <div className="cp-rodape-note" style={{ marginBottom: 8 }}>
          Conta: EXTRATO BANCARIO • Status: PREVISTO • Valores gravados como SAÍDA (negativos)
        </div>

        {/* Periodicidade / Ocorrências / Auto */}
        <div className="cp-top">
          <label className="lbl">
            <span>Periodicidade</span>
            <select value={periodicidade} onChange={(e)=>setPeriodicidade(e.target.value)}>
              {PERIODOS.map((p)=> <option key={p} value={p}>{p}</option>)}
            </select>
          </label>

          <label className="lbl">
            <span>Ocorrências</span>
            <input
              inputMode="numeric"
              pattern="[0-9]*"
              value={String(ocorrencias)}
              onChange={(e)=>{
                const raw = e.target.value.replace(/\D/g,"");
                setOcorrencias(raw === "" ? "" : raw);
              }}
              onBlur={()=> setOcorrencias(v => (v === "" || Number(v)<1 ? "1" : String(Number(v))))}
              placeholder="Ocorrências"
            />
          </label>

          <button className="btn-auto" onClick={()=>aplicarOcorrencias(ocorrencias)}>
            Preencher datas automaticamente
          </button>
        </div>

        {/* Vencimentos */}
        <div className="cp-rows">
          {vencs.map((v,i)=>(
            <div className="cp-row" key={i}>
              <div className="cp-row-n">#{i+1}</div>
              <input className="cp-row-date" type="date" value={v.data}
                     onChange={(e)=>setVencField(i,"data",e.target.value)} />
              <input className="cp-row-val" type="number" step="0.01" placeholder="Valor" value={v.valor}
                     onChange={(e)=>setVencField(i,"valor",e.target.value)} />
            </div>
          ))}
        </div>

        {/* Forma / Plano / Descrição */}
        <div className="cp-mid">
          <label className="lbl">
            <span>Forma</span>
            <select value={forma} onChange={(e)=>setForma(e.target.value)}>
              {FORMAS.map((f)=> <option key={f} value={f}>{f}</option>)}
            </select>
          </label>

          <label className="lbl">
            <span>Plano de Contas (pagar)</span>
            <select value={plano} onChange={(e)=>setPlano(e.target.value)}>
              <option value="">Selecione...</option>
              {PLANOS_PAGAR.map((p)=> <option key={p.v} value={p.v}>{p.t}</option>)}
            </select>
          </label>

          <label className="lbl">
            <span>Descrição (opcional)</span>
            <input placeholder="ex.: assinatura, manutenção, etc."
                   value={descricao} onChange={(e)=>setDescricao(e.target.value)} />
          </label>
        </div>

        <div className="cp-totais">
          Total do lote: <strong>{fmtBRL(Math.abs(totalLote))}</strong>
        </div>

        {/* Ações */}
        <div className="cp-acoes">
          <button className="btn-salvar" onClick={salvarPrevisto}>
            {editId ? "Salvar ALTERAÇÃO" : "Salvar PREVISTO"}
          </button>
          <button className="btn-cancelar" onClick={()=>{
            setDescricao(""); setPlano(""); setForma("PIX");
            setPeriodicidade("Único"); setOcorrencias("1");
            setVencs([{ data: new Date().toISOString().slice(0,10), valor:"" }]);
            setEditId(null);
          }}>
            Limpar
          </button>
        </div>

        {/* Utilidades para celular */}
        <div style={{ display:"flex", gap:8, marginTop:8, flexWrap:"wrap" }}>
          <button className="cp-btn" style={{ background:"#eee", color:"#333", borderRadius:10, padding:"10px 12px", fontWeight:800 }}
                  onClick={dumpUltimos}>
            Ver lançamentos (últimos 10)
          </button>
          <button className="cp-btn" style={{ background:"#d3c1a9", color:"#4a2b13", borderRadius:10, padding:"10px 12px", fontWeight:800 }}
                  onClick={()=>setTela?.("FluxCx")}>
            Ir para Fluxo
          </button>
        </div>

        {dbgOpen && (
          <pre
            style={{ marginTop:8, maxHeight:260, overflow:"auto", background:"#fffdf6",
                     border:"1px solid #e6d2c2", borderRadius:10, padding:10, fontSize:12,
                     lineHeight:1.3, color:"#3b2a1d", whiteSpace:"pre-wrap", wordBreak:"break-word" }}
            onClick={()=>setDbgOpen(false)} title="Toque para fechar">
            {dbgDump || "Sem registros."}
          </pre>
        )}

        <div className="cp-rodape-note">
          Conta: EXTRATO BANCARIO • Status: PREVISTO • Valores gravados como SAÍDA (negativos).
        </div>
      </div>

      <button className="btn-voltar-foot" onClick={()=>setTela?.("CtsReceber")}>◀ Menu Financeiro</button>
      <footer className="erp-footer"><div className="erp-footer-track">• Pagamentos •</div></footer>
    </div>
  );
        }

// src/pages/CtsPagar.jsx
import React, { useEffect, useMemo, useState } from "react";
import "./LanPed.css";       // <<< reaproveita o MESMO estilo do LanPed
import "./CtsPagar.css";     // ajustes mínimos desta tela

// ===== persistência mínima (mesma chave do FluxCx) =====
const LS_KEY = "financeiro_fluxo";
const getAll  = () => JSON.parse(localStorage.getItem(LS_KEY) || "[]");
const saveAll = (arr) => localStorage.setItem(LS_KEY, JSON.stringify(arr));
const randId  = () => `bk_${Date.now().toString(36)}${Math.random().toString(36).slice(2,7)}`;
const updateById = (id, mut) => {
  const arr = getAll();
  const idx = arr.findIndex((x) => x.id === id);
  if (idx < 0) throw new Error("Lançamento não encontrado.");
  arr[idx] = mut({ ...arr[idx] });
  saveAll(arr);
  return arr[idx];
};

const FORMAS   = ["PIX","Débito","Crédito","Boleto","Transferência","Dinheiro"];
const PERIODOS = ["Único","Semanal","Quinzenal","Mensal","Bimestral","Trimestral","Semestral","Anual"];
const fmtBRL   = (v)=> (Number(v||0)).toLocaleString("pt-BR",{style:"currency",currency:"BRL"});

// Plano de Contas (folhas)
const PLANO_PAGAR = [
  // 1. Pessoal
  { code: "1.01.01.001", label: "água casa" },
  { code: "1.01.01.002", label: "celpe casa" },
  { code: "1.01.01.003", label: "aluguel casa" },
  { code: "1.01.01.004", label: "Internet casa" },
  { code: "1.01.01.005", label: "cuidados casa" },
  { code: "1.01.02.001", label: "feira" },
  { code: "1.01.02.002", label: "lanches" },
  { code: "1.01.02.003", label: "eventos casa" },
  { code: "1.01.02.004", label: "suplementos" },
  { code: "1.01.03.001", label: "escolas" },
  { code: "1.01.03.002", label: "academia" },
  { code: "1.01.03.003", label: "personal" },
  { code: "1.01.03.004", label: "futuro 1" },
  { code: "1.01.03.005", label: "futuro 2" },
  { code: "1.01.03.006", label: "futuro 3" },
  { code: "1.01.04.001", label: "Internet casa (assinaturas)" },
  { code: "1.01.04.002", label: "TV box" },
  { code: "1.01.04.003", label: "celular" },
  { code: "1.01.04.004", label: "futuro 1" },
  { code: "1.01.04.005", label: "futuro 2" },
  { code: "1.01.05.001", label: "pintura casa" },
  { code: "1.01.05.002", label: "elétrica casa" },
  { code: "1.01.05.003", label: "hidráulica casa" },
  { code: "1.01.05.004", label: "decoração casa" },
  { code: "1.01.05.005", label: "gás casa" },
  { code: "1.01.06.001", label: "cabelo" },
  { code: "1.01.06.002", label: "manicure" },
  { code: "1.01.06.003", label: "unha" },
  { code: "1.01.06.004", label: "sobrancelha" },
  { code: "1.01.06.005", label: "maquiagem" },
  { code: "1.01.06.006", label: "buço" },
  { code: "1.01.06.007", label: "massagem" },
  { code: "1.01.06.008", label: "futuro 1" },
  { code: "1.01.06.009", label: "futuro 2" },
  { code: "1.01.07.001", label: "diversão locação" },
  { code: "1.01.07.002", label: "diversão alimentação" },
  { code: "1.01.07.003", label: "diversão deslocamento" },
  // 2. Dudunitê
  { code: "2.01.01.001", label: "água emp" },
  { code: "2.01.01.002", label: "celpe emp" },
  { code: "2.01.01.003", label: "aluguel emp" },
  { code: "2.01.01.004", label: "Internet emp" },
  { code: "2.01.01.005", label: "ferramentas" },
  { code: "2.01.01.006", label: "manutenção serviço emp" },
  { code: "2.01.02.001", label: "gás emp" },
  { code: "2.01.02.002", label: "manutenção emp" },
  { code: "2.01.02.003", label: "pintura emp" },
  { code: "2.01.02.004", label: "hidráulica emp" },
  { code: "2.01.02.005", label: "diversos emp" },
  { code: "2.01.03.001", label: "produção emp (insumos)" },
  { code: "2.01.03.002", label: "embalagem emp" },
  { code: "2.01.03.003", label: "recheio emp" },
  { code: "2.01.03.004", label: "terceiros emp" },
  { code: "2.01.03.005", label: "papelaria emp" },
  { code: "2.01.03.006", label: "equipamentos" },
  { code: "2.01.03.007", label: "gasolina emp"},
];

export default function CtsPagar({ setTela }) {
  // ===== estado =====
  const [periodicidade, setPeriodicidade] = useState("Único");
  const [ocorrencias, setOcorrencias]   = useState("1"); // string -> permite apagar
  const [vencs, setVencs] = useState([{ data: new Date().toISOString().slice(0,10), valor: "" }]);
  const [forma, setForma] = useState("PIX");
  const [plano, setPlano] = useState("");
  const [descricao, setDescricao] = useState("");
  const [editId, setEditId] = useState(null);

  const totalDoLoteAbs = useMemo(
    () => vencs.reduce((s,v)=> s + Math.abs(Number(v.valor || 0)), 0),
    [vencs]
  );

  // ===== pré-preencher (editar) =====
  useEffect(() => {
    try{
      const raw = localStorage.getItem("editar_financeiro");
      if (!raw) return;
      const info = JSON.parse(raw);
      if (info && String(info.origem).toUpperCase() === "PAGAR") {
        setEditId(info.id || null);
        setPeriodicidade("Único");
        setOcorrencias("1");

        const d = info.data
          ? (typeof info.data === "string" ? info.data.slice(0,10) : new Date(info.data).toISOString().slice(0,10))
          : new Date().toISOString().slice(0,10);
        setVencs([{ data: d, valor: Math.abs(Number(info.valor||0)) || "" }]);

        if (info.formaPagamento && FORMAS.includes(info.formaPagamento)) setForma(info.formaPagamento);
        if (info.planoContas) setPlano(info.planoContas);
        if (info.descricao) setDescricao(info.descricao);
      }
    } finally {
      localStorage.removeItem("editar_financeiro");
    }
  }, []);

  // ===== helpers =====
  function aplicarOcorrencias(n){
    const parsed = parseInt(n, 10);
    const num = Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
    setOcorrencias(String(num));
    setVencs(prev=>{
      const base = prev[0] || { data: new Date().toISOString().slice(0,10), valor:"" };
      return Array.from({length:num}, (_,i)=> i===0 ? base : { data: base.data, valor:"" });
    });
  }

  function preencherDatasAuto(){
    setVencs(prev=>{
      const base = prev[0]?.data ? new Date(prev[0].data) : new Date();
      return prev.map((v,i)=>{
        if (i===0) return v;
        const d = new Date(base);
        switch (periodicidade){
          case "Semanal":   d.setDate(base.getDate() + 7*i); break;
          case "Quinzenal": d.setDate(base.getDate() + 15*i); break;
          case "Mensal":    d.setMonth(base.getMonth() + i); break;
          case "Bimestral": d.setMonth(base.getMonth() + 2*i); break;
          case "Trimestral":d.setMonth(base.getMonth() + 3*i); break;
          case "Semestral": d.setMonth(base.getMonth() + 6*i); break;
          case "Anual":     d.setFullYear(base.getFullYear() + i); break;
          default: break;
        }
        return { ...v, data: d.toISOString().slice(0,10) };
      });
    });
  }

  function setVencField(i, field, value){
    setVencs(prev=>{
      const arr = [...prev];
      arr[i] = { ...arr[i], [field]: value };
      return arr;
    });
  }

  // ===== salvar =====
  function salvarPrevisto(){
    if (!plano) return alert("Selecione o Plano de Contas.");
    if (!forma) return alert("Informe a Forma de pagamento.");
    for (const [i,v] of vencs.entries()){
      if (!v.data) return alert(`Informe a data da ocorrência #${i+1}.`);
      if (!v.valor || Number(v.valor)<=0) return alert(`Informe o valor da ocorrência #${i+1}.`);
    }

    if (editId){
      try{
        updateById(editId, (doc)=>{
          const v = Math.abs(Number(vencs[0].valor||0));
          doc.data = new Date(vencs[0].data).toISOString();
          doc.forma = forma;
          doc.planoContas = plano;
          doc.descricao = descricao || doc.descricao || "PAGAMENTO";
          doc.origem = "Previsto";
          doc.statusFinanceiro = "Previsto";
          doc.valor = -v;
          return doc;
        });
        alert("Lançamento atualizado com sucesso.");
        setTela?.("FluxCx");
        return;
      }catch(e){
        alert("Falha ao atualizar: "+(e?.message||e));
        return;
      }
    }

    const arr = getAll();
    vencs.forEach((v, idx)=>{
      arr.push({
        id: randId(),
        data: new Date(v.data).toISOString(),
        origem: "Previsto",
        statusFinanceiro: "Previsto",
        descricao: descricao || "PAGAMENTO",
        forma,
        planoContas: plano,
        valor: -Math.abs(Number(v.valor||0)),
        meta: { periodicidade, ocorrencias: parseInt(ocorrencias,10)||1, ordem: idx+1 }
      });
    });
    saveAll(arr);

    alert(`Previsto salvo. Ocorrências: ${vencs.length}. Total do lote: ${fmtBRL(totalDoLoteAbs)}.`);
    // limpar
    setDescricao(""); setPlano(""); setForma("PIX");
    setPeriodicidade("Único"); setOcorrencias("1");
    setVencs([{ data: new Date().toISOString().slice(0,10), valor:"" }]);
  }

  // ===== UI =====
  return (
    <div className="lanped-container">
      {/* Header igual ao LanPed */}
      <div className="lanped-header">
        <img src="/LogomarcaDDnt2025Vazado.png" alt="Logo Dudunitê" className="lanped-logo" />
        <h1 className="lanped-titulo">Lançar Pagamento (Previsto)</h1>
      </div>

      <div className="lanped-formulario">

        {/* Linha info de conta/status */}
        <div className="cp-info">
          Conta: EXTRATO BANCARIO • Status: <b>PREVISTO</b> • Valores gravados como <b>SAÍDA (negativos)</b>
        </div>

        {/* Periodicidade */}
        <div className="lanped-field">
          <label>Periodicidade</label>
          <select value={periodicidade} onChange={(e)=>setPeriodicidade(e.target.value)}>
            {PERIODOS.map(p=> <option key={p} value={p}>{p}</option>)}
          </select>
        </div>

        {/* Ocorrências */}
        <div className="lanped-field">
          <label>Ocorrências</label>
          <input
            type="number"
            min={1}
            inputMode="numeric"
            value={ocorrencias}
            onChange={(e)=>setOcorrencias(e.target.value)}   // permite apagar
            onBlur={(e)=>aplicarOcorrencias(e.target.value)} // normaliza e replica
            placeholder="Ocorrências"
          />
        </div>

        {/* Botão preencher datas */}
        <button className="botao-adicionar" onClick={preencherDatasAuto}>
          📅 Preencher datas automaticamente
        </button>

        {/* Bloco de ocorrências */}
        {vencs.map((v,i)=>(
          <div key={i} className="cp-oc-row">
            <div className="cp-oc-chip">#{i+1}</div>
            <div className="lanped-field">
              <label>Data</label>
              <input type="date" value={v.data} onChange={(e)=>setVencField(i,"data",e.target.value)} />
            </div>
            <div className="lanped-field">
              <label>Valor</label>
              <input type="number" step="0.01" inputMode="decimal"
                     value={v.valor} onChange={(e)=>setVencField(i,"valor",e.target.value)} />
            </div>
          </div>
        ))}

        {/* Forma / Plano */}
        <div className="lanped-field">
          <label>Forma</label>
          <select value={forma} onChange={(e)=>setForma(e.target.value)}>
            {FORMAS.map(f=> <option key={f} value={f}>{f}</option>)}
          </select>
        </div>

        <div className="lanped-field">
          <label>Plano de Contas (pagar)</label>
          <select value={plano} onChange={(e)=>setPlano(e.target.value)}>
            <option value="">Selecione…</option>
            <optgroup label="1. Pessoal">
              {PLANO_PAGAR.filter(p=>p.code.startsWith("1.")).map(p=>(
                <option key={p.code} value={p.code}>{p.code} {p.label}</option>
              ))}
            </optgroup>
            <optgroup label="2. Dudunitê">
              {PLANO_PAGAR.filter(p=>p.code.startsWith("2.")).map(p=>(
                <option key={p.code} value={p.code}>{p.code} {p.label}</option>
              ))}
            </optgroup>
          </select>
        </div>

        {/* Descrição */}
        <div className="lanped-field">
          <label>Descrição (opcional)</label>
          <input placeholder="ex.: assinatura, manutenção, etc."
                 value={descricao} onChange={(e)=>setDescricao(e.target.value)} />
        </div>

        {/* Total */}
        <div className="total-pedido"><strong>Total do lote:</strong> {fmtBRL(totalDoLoteAbs)}</div>

        {/* Ações */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button className="botao-salvar" onClick={salvarPrevisto}>
            {editId ? "Salvar ALTERAÇÃO" : "💾 Salvar PREVISTO"}
          </button>
          <button className="botao-voltar" onClick={()=>{
            setDescricao(""); setPlano(""); setForma("PIX");
            setPeriodicidade("Único"); setOcorrencias("1");
            setVencs([{ data: new Date().toISOString().slice(0,10), valor:"" }]);
            setEditId(null);
          }}>
            Limpar
          </button>
          <button className="botao-voltar" onClick={()=>setTela?.("CtsReceber")}>
            ◀ Menu Financeiro
          </button>
        </div>

      </div>

      <footer className="erp-footer">
        <div className="erp-footer-track">• Pagamentos •</div>
      </footer>
    </div>
  );
             }

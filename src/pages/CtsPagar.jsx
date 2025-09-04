// src/pages/CtsPagar.jsx
import React, { useEffect, useMemo, useState } from "react";
import "./CtsPagar.css";

/* ===== store (LocalStorage) — mesma chave do FluxCx ===== */
const LS_KEY = "financeiro_fluxo";
const getAll = () => JSON.parse(localStorage.getItem(LS_KEY) || "[]");
const saveAll = (arr) => localStorage.setItem(LS_KEY, JSON.stringify(arr));
const randId = () =>
  `bk_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
const updateById = (id, mut) => {
  const arr = getAll();
  const idx = arr.findIndex((x) => x.id === id);
  if (idx < 0) throw new Error("Lançamento não encontrado.");
  arr[idx] = mut({ ...arr[idx] });
  saveAll(arr);
  return arr[idx];
};

/* ===== constantes ===== */
const FORMAS = ["PIX", "Débito", "Crédito", "Boleto", "Transferência", "Dinheiro"];
const PERIODOS = ["Único","Semanal","Quinzenal","Mensal","Bimestral","Trimestral","Semestral","Anual"];
const CONTA_PADRAO = "EXTRATO BANCARIO";

/* helper monetário */
const fmtBRL = (v) =>
  (Number(v || 0)).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

/* ===== compatibilidade: deixa o objeto no formato que o FluxCx espera ===== */
function shapeFluxPagar({
  id,
  dataISO,
  valorAbs,
  forma,
  plano,
  descricao,
  ordem = 1,
  periodicidade = "Único",
  ocorrencias = 1,
}) {
  return {
    id: id || randId(),
    data: dataISO,                           // ISO
    conta: CONTA_PADRAO,                     // usado em filtros do FluxCx
    origem: "PAGAR",                         // identifica a fonte
    lado: "SAIDA",                           // saída
    status: "Previsto",                      // <- campo que o FluxCx costuma ler
    statusFinanceiro: "Previsto",            // espelho para compat
    descricao: descricao || "PAGAMENTO",
    formaPagamento: forma,                   // nome esperado pelo FluxCx
    forma: forma,                            // espelho
    planoContas: plano,
    valor: -Math.abs(Number(valorAbs || 0)), // SAÍDA negativa
    meta: { periodicidade, ocorrencias, ordem },
    createdAt: new Date().toISOString(),
  };
}

export default function CtsPagar({ setTela }) {
  /* ===== estado base ===== */
  const [periodicidade, setPeriodicidade] = useState("Único");
  const [ocorrencias, setOcorrencias] = useState(1);

  /* vencimentos (data/valor) */
  const [vencs, setVencs] = useState([
    { data: new Date().toISOString().slice(0, 10), valor: "" },
  ]);

  /* demais campos */
  const [forma, setForma] = useState("PIX");
  const [plano, setPlano] = useState("");
  const [descricao, setDescricao] = useState("");

  /* modo edição (quando vem de Alterar no FluxCx) */
  const [editId, setEditId] = useState(null);

  const totalLote = useMemo(
    () => -1 * vencs.reduce((s, v) => s + Math.abs(Number(v.valor || 0)), 0),
    [vencs]
  );

  /* ===== pré-preencher vindo do FluxCx (editar_financeiro) ===== */
  useEffect(() => {
    try {
      const raw = localStorage.getItem("editar_financeiro");
      if (!raw) return;
      const info = JSON.parse(raw);
      if (info && String(info.origem).toUpperCase().includes("PAGAR")) {
        setEditId(info.id || null);
        setPeriodicidade("Único");
        setOcorrencias(1);

        const d = info.data
          ? (typeof info.data === "string"
              ? info.data.slice(0, 10)
              : new Date(info.data).toISOString().slice(0, 10))
          : new Date().toISOString().slice(0, 10);

        setVencs([{ data: d, valor: Math.abs(Number(info.valor || 0)) || "" }]);

        if (info.formaPagamento && FORMAS.includes(info.formaPagamento))
          setForma(info.formaPagamento);
        if (info.planoContas) setPlano(info.planoContas);
        if (info.descricao) setDescricao(info.descricao);
      }
    } catch {}
    finally {
      localStorage.removeItem("editar_financeiro");
    }
  }, []);

  /* ===== helpers UI ===== */
  function aplicarOcorrencias(n) {
    const num = Math.max(1, Number(n || 1));
    setOcorrencias(num);
    setVencs((prev) => {
      const base = prev[0] || {
        data: new Date().toISOString().slice(0, 10),
        valor: "",
      };
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
          case "Semanal":
            d.setDate(base.getDate() + 7 * i);
            break;
          case "Quinzenal":
            d.setDate(base.getDate() + 15 * i);
            break;
          case "Mensal":
            d.setMonth(base.getMonth() + i);
            break;
          case "Bimestral":
            d.setMonth(base.getMonth() + 2 * i);
            break;
          case "Trimestral":
            d.setMonth(base.getMonth() + 3 * i);
            break;
          case "Semestral":
            d.setMonth(base.getMonth() + 6 * i);
            break;
          case "Anual":
            d.setFullYear(base.getFullYear() + i);
            break;
          default:
            break;
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

  /* ===== salvar ===== */
  function salvarPrevisto() {
    if (!plano) return alert("Selecione o Plano de Contas.");
    if (!forma) return alert("Informe a Forma de pagamento.");
    for (const [i, v] of vencs.entries()) {
      if (!v.data) return alert(`Informe a data da ocorrência #${i + 1}.`);
      if (!v.valor || Number(v.valor) <= 0)
        return alert(`Informe o valor da ocorrência #${i + 1}.`);
    }

    /* EDIÇÃO: atualiza apenas o registro original */
    if (editId) {
      try {
        updateById(editId, (doc) => {
          const v = Math.abs(Number(vencs[0].valor || 0));
          const dataISO = new Date(vencs[0].data).toISOString();
          const shaped = shapeFluxPagar({
            id: editId,
            dataISO,
            valorAbs: v,
            forma,
            plano,
            descricao: descricao || doc.descricao || "PAGAMENTO",
            ordem: 1,
            periodicidade: "Único",
            ocorrencias: 1,
          });
          return { ...doc, ...shaped };
        });
        alert("Lançamento atualizado com sucesso.");
        setTela?.("FluxCx");
        return;
      } catch (e) {
        alert("Falha ao atualizar: " + (e?.message || e));
        return;
      }
    }

    /* NOVOS lançamentos (repete conforme ocorrências) */
    const arr = getAll();
    vencs.forEach((v, idx) => {
      const dataISO = new Date(v.data).toISOString();
      arr.push(
        shapeFluxPagar({
          dataISO,
          valorAbs: v.valor,
          forma,
          plano,
          descricao,
          ordem: idx + 1,
          periodicidade,
          ocorrencias,
        })
      );
    });
    saveAll(arr);

    alert(
      `Previsto salvo. Ocorrências: ${vencs.length}. Total do lote: ${fmtBRL(
        Math.abs(totalLote)
      )}.`
    );

    /* limpa formulário */
    setDescricao("");
    setPlano("");
    setForma("PIX");
    setPeriodicidade("Único");
    setOcorrencias(1);
    setVencs([{ data: new Date().toISOString().slice(0, 10), valor: "" }]);
  }

  return (
    <div className="ctspagar-main">
      <header className="erp-header">
        <div className="erp-header__inner">
          <div className="erp-header__logo">
            <img src="/LogomarcaDDnt2025Vazado.png" alt="Dudunitê" />
          </div>
          <div className="erp-header__title">
            ERP DUDUNITÊ
            <br />
            Financeiro
          </div>
        </div>
      </header>

      <div className="ctspagar-card">
        <h2>Lançar Pagamento (Previsto)</h2>

        {/* Linha de contexto (igual ao Avulso/Receber) */}
        <div className="cp-rodape-note" style={{ marginBottom: 10 }}>
          Conta: {CONTA_PADRAO} • Status: PREVISTO • Valores gravados como SAÍDA (negativos)
        </div>

        {/* Topo: periodicidade / ocorrências / auto-preencher */}
        <div className="cp-top">
          <div className="lbl">
            <span>Periodicidade</span>
            <select
              value={periodicidade}
              onChange={(e) => setPeriodicidade(e.target.value)}
            >
              {PERIODOS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          <div className="lbl">
            <span>Ocorrências</span>
            <input
              type="number"
              min={1}
              inputMode="numeric"
              value={ocorrencias}
              onChange={(e) => aplicarOcorrencias(e.target.value)}
              onFocus={(e) => e.target.select()}
              placeholder="1"
            />
          </div>

          <button className="btn-auto" onClick={preencherDatasAuto}>
            Preencher datas automaticamente
          </button>
        </div>

        {/* Ocorrência 1 (única linha visível — segue o layout enxuto) */}
        <div className="cp-rows">
          <div className="cp-row">
            <div className="cp-row-n">#1</div>
            <input
              className="cp-row-date"
              type="date"
              value={vencs[0].data}
              onChange={(e) => setVencField(0, "data", e.target.value)}
            />
            <input
              className="cp-row-val"
              type="number"
              step="0.01"
              placeholder="Valor"
              value={vencs[0].valor}
              onChange={(e) => setVencField(0, "valor", e.target.value)}
            />
          </div>
        </div>

        {/* Forma / Plano / Descrição */}
        <div className="cp-mid">
          <div className="lbl">
            <span>Forma</span>
            <select value={forma} onChange={(e) => setForma(e.target.value)}>
              {FORMAS.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </div>

          <div className="lbl">
            <span>Plano de Contas (pagar)</span>
            <select
              value={plano}
              onChange={(e) => setPlano(e.target.value)}
            >
              <option value="">Selecione...</option>
              {/* Pessoal */}
              <option value="1">1 Pessoal</option>
              <option value="1.01">1.01 casa</option>
              <option value="1.01.01">1.01.01 desp fixas casa</option>
              <option value="1.01.01.001">1.01.01.001 água casa</option>
              <option value="1.01.01.002">1.01.01.002 celpe casa</option>
              <option value="1.01.01.003">1.01.01.003 aluguel casa</option>
              <option value="1.01.01.004">1.01.01.004 Internet casa</option>
              <option value="1.01.01.005">1.01.01.005 cuidados casa</option>
              <option value="1.01.02">1.01.02 desp variaveis pessoal</option>
              <option value="1.01.02.001">1.01.02.001 feira</option>
              <option value="1.01.02.002">1.01.02.002 lanches</option>
              <option value="1.01.02.003">1.01.02.003 eventos casa</option>
              <option value="1.01.02.004">1.01.02.004 suplementos</option>
              <option value="1.01.03">1.01.03 desp fixas pessoal</option>
              <option value="1.01.03.001">1.01.03.001 escolas</option>
              <option value="1.01.03.002">1.01.03.002 academia</option>
              <option value="1.01.03.003">1.01.03.003 personal</option>
              <option value="1.01.03.004">1.01.03.004 futuro 1</option>
              <option value="1.01.03.005">1.01.03.005 futuro 2</option>
              <option value="1.01.03.006">1.01.03.006 futuro 3</option>
              <option value="1.01.04">1.01.04 assinaturas</option>
              <option value="1.01.04.001">1.01.04.001 Internet casa</option>
              <option value="1.01.04.002">1.01.04.002 TV box</option>
              <option value="1.01.04.003">1.01.04.003 celular</option>
              <option value="1.01.04.004">1.01.04.004 futuro 1</option>
              <option value="1.01.04.005">1.01.04.005 futuro 2</option>
              <option value="1.01.05">1.01.05 cuidados casa</option>
              <option value="1.01.05.001">1.01.05.001 pintura casa</option>
              <option value="1.01.05.002">1.01.05.002 elétrica casa</option>
              <option value="1.01.05.003">1.01.05.003 hidráulica casa</option>
              <option value="1.01.05.004">1.01.05.004 decoração casa</option>
              <option value="1.01.05.005">1.01.05.005 gás casa</option>
              <option value="1.01.06">1.01.06  pessoais</option>
              <option value="1.01.06.001">1.01.06.001 cabelo</option>
              <option value="1.01.06.003">1.01.05.003 manicure</option>
              <option value="1.01.06.004">1.01.06.004 unha</option>
              <option value="1.01.06.005">1.01.06.005 sobrancelha</option>
              <option value="1.01.06.006">1.01.06.006 maquiagem</option>
              <option value="1.01.06.007">1.01.06.007 buço</option>
              <option value="1.01.06.008">1.01.06.008 massagem</option>
              <option value="1.01.06.009">1.01.06.009 futuro 1</option>
              <option value="1.01.06.010">1.01.06.010 futuro 2</option>
              <option value="1.01.07">1.01.07 diversão</option>
              <option value="1.01.07.001">1.01.07.001 locação</option>
              <option value="1.01.07.002">1.01.07.002 alimentação</option>
              <option value="1.01.07.003">1.01.07.003 deslocamento</option>
              {/* Dudunite */}
              <option value="2">2 Dudunite</option>
              <option value="2.01">2.01 empresa</option>
              <option value="2.01.01">2.01.01 desp fixas emp</option>
              <option value="2.01.01.001">2.01.01.001 água emp</option>
              <option value="2.01.01.002">2.01.01.002 celpe emp</option>
              <option value="2.01.01.003">2.01.01.003 aluguel emp</option>
              <option value="2.01.01.004">2.01.01.004 Internet emp</option>
              <option value="2.01.01.005">2.01.01.005 ferramentas</option>
              <option value="2.01.01.006">2.01.01.006 manutenção serviço emp</option>
              <option value="2.01.02">2.01.02 desp variaveis emp</option>
              <option value="2.01.02.001">2.01.02.001 gas emp</option>
              <option value="2.01.02.002">2.01.02.002 manutenção emp</option>
              <option value="2.01.02.003">2.01.02.003 pintura emp</option>
              <option value="2.01.02.004">2.01.02.004 hidráulica emp</option>
              <option value="2.01.02.005">2.01.02.005</option>
              <option value="2.01.03">2.01.03 insumos</option>
              <option value="2.01.03.001">2.01.03.001 produção emp</option>
              <option value="2.01.03.002">2.01.03.002 embalagem emp</option>
              <option value="2.01.03.003">2.01.03.003 recheio emp</option>
              <option value="2.01.03.004">2.01.03.004 terceiros emp</option>
              <option value="2.01.03.005">2.01.03.005 papelaria emp</option>
              <option value="2.01.03.006">2.01.03.006 equipamentos</option>
            </select>
          </div>

          <div className="lbl">
            <span>Descrição (opcional)</span>
            <input
              placeholder="ex.: assinatura, manutenção, etc."
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
            />
          </div>
        </div>

        <div className="cp-totais">Total do lote: {fmtBRL(totalLote)}</div>

        <div className="cp-acoes">
          <button className="btn-salvar" onClick={salvarPrevisto}>
            {editId ? "Salvar ALTERAÇÃO" : "Salvar PREVISTO"}
          </button>
          <button
            className="btn-cancelar"
            onClick={() => {
              setDescricao("");
              setPlano("");
              setForma("PIX");
              setPeriodicidade("Único");
              setOcorrencias(1);
              setVencs([
                { data: new Date().toISOString().slice(0, 10), valor: "" },
              ]);
              setEditId(null);
            }}
          >
            Limpar
          </button>
        </div>

        <div className="cp-rodape-note">
          Conta: {CONTA_PADRAO} • Status: PREVISTO • Valores gravados como SAÍDA (negativos).
        </div>
      </div>

      <button className="btn-voltar-foot" onClick={() => setTela?.("CtsReceber")}>
        ◀ Menu Financeiro
      </button>
      <footer className="erp-footer">
        <div className="erp-footer-track">• Pagamentos •</div>
      </footer>
    </div>
  );
                                            }

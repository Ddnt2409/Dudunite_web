// src/pages/CtsPagar.jsx
import React, { useEffect, useMemo, useState } from "react";
import "./CtsPagar.css";

/* =========================
   Persistência mínima (mesma do FluxCx)
   ========================= */
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

/* =========================
   Constantes
   ========================= */
const FORMAS = [
  "PIX",
  "Débito",
  "Crédito",
  "Boleto",
  "Transferência",
  "Dinheiro",
];
const PERIODOS = [
  "Único",
  "Semanal",
  "Quinzenal",
  "Mensal",
  "Bimestral",
  "Trimestral",
  "Semestral",
  "Anual",
];

const fmtBRL = (v) =>
  (Number(v || 0)).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

/* =========================
   Plano de contas (pagar)
   — apenas folhas com código final
   ========================= */
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
];

export default function CtsPagar({ setTela }) {
  /* ===== estado base ===== */
  const [periodicidade, setPeriodicidade] = useState("Único");
  const [ocorrencias, setOcorrencias] = useState("1"); // <- string, permite apagar
  const [vencs, setVencs] = useState([
    { data: new Date().toISOString().slice(0, 10), valor: "" },
  ]);

  const [forma, setForma] = useState("PIX");
  const [plano, setPlano] = useState("");
  const [descricao, setDescricao] = useState("");

  const [editId, setEditId] = useState(null);

  const totalDoLoteAbs = useMemo(
    () => vencs.reduce((s, v) => s + Math.abs(Number(v.valor || 0)), 0),
    [vencs]
  );

  /* ===== Pré-preencher a partir do localStorage("editar_financeiro") ===== */
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
        setVencs([
          { data: d, valor: Math.abs(Number(info.valor || 0)) || "" },
        ]);

        if (info.formaPagamento && FORMAS.includes(info.formaPagamento))
          setForma(info.formaPagamento);
        if (info.planoContas) setPlano(info.planoContas);
        if (info.descricao) setDescricao(info.descricao);
      }
    } catch {
      /* ignore */
    } finally {
      localStorage.removeItem("editar_financeiro");
    }
  }, []);

  /* ===== helpers UI ===== */
  function aplicarOcorrencias(n) {
    const parsed = parseInt(n, 10);
    const num = Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
    setOcorrencias(String(num));
    setVencs((prev) => {
      const base =
        prev[0] || { data: new Date().toISOString().slice(0, 10), valor: "" };
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
    // valida
    if (!plano) return alert("Selecione o Plano de Contas.");
    if (!forma) return alert("Informe a Forma de pagamento.");
    for (const [i, v] of vencs.entries()) {
      if (!v.data) return alert(`Informe a data da ocorrência #${i + 1}.`);
      if (!v.valor || Number(v.valor) <= 0)
        return alert(`Informe o valor da ocorrência #${i + 1}.`);
    }

    // MODO EDIÇÃO
    if (editId) {
      try {
        updateById(editId, (doc) => {
          const v = Math.abs(Number(vencs[0].valor || 0));
          doc.data = new Date(vencs[0].data).toISOString();
          doc.forma = forma;
          doc.planoContas = plano;
          doc.descricao = descricao || doc.descricao || "PAGAMENTO";
          doc.origem = "Previsto";
          doc.statusFinanceiro = "Previsto";
          doc.valor = -v; // saída negativa
          return doc;
        });
        alert("Lançamento atualizado com sucesso.");
        setTela?.("FluxCx");
        return;
      } catch (e) {
        alert("Falha ao atualizar: " + (e?.message || e));
        return;
      }
    }

    // NOVOS lançamentos
    const arr = getAll();
    vencs.forEach((v, idx) => {
      const doc = {
        id: randId(),
        data: new Date(v.data).toISOString(),
        origem: "Previsto",
        statusFinanceiro: "Previsto",
        descricao: descricao || "PAGAMENTO",
        forma,
        planoContas: plano,
        valor: -Math.abs(Number(v.valor || 0)), // saída é negativa
        meta: {
          periodicidade,
          ocorrencias: parseInt(ocorrencias, 10) || 1,
          ordem: idx + 1,
        },
      };
      arr.push(doc);
    });
    saveAll(arr);

    alert(
      `Previsto salvo. Ocorrências: ${vencs.length}. Total do lote: ${fmtBRL(
        totalDoLoteAbs
      )}.`
    );

    // limpar
    setDescricao("");
    setPlano("");
    setForma("PIX");
    setPeriodicidade("Único");
    setOcorrencias("1");
    setVencs([{ data: new Date().toISOString().slice(0, 10), valor: "" }]);
  }

  return (
    <div className="ctspagar-main">
      {/* HEADER padrão */}
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

      {/* CARD */}
      <div className="ctspagar-card">
        <h2>Lançar Pagamento (Previsto)</h2>
        <div className="cp-rodape-note" style={{ marginBottom: 10 }}>
          Conta: EXTRATO BANCARIO • Status: PREVISTO • Valores gravados como
          SAÍDA (negativos)
        </div>

        {/* Topo: periodicidade + ocorrências + auto */}
        <div className="cp-top">
          <label className="lbl">
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
          </label>

          <label className="lbl">
            <span>Ocorrências</span>
            <input
              type="number"
              min={1}
              inputMode="numeric"
              value={ocorrencias}
              onChange={(e) => setOcorrencias(e.target.value)} // permite apagar
              onBlur={(e) => aplicarOcorrencias(e.target.value)} // normaliza e replica
              placeholder="Ocorrências"
            />
          </label>

          <button className="btn-auto" onClick={preencherDatasAuto}>
            Preencher datas automaticamente
          </button>
        </div>

        {/* Linhas de vencimento */}
        <div className="cp-rows">
          {vencs.map((v, i) => (
            <div key={i} className="cp-row">
              <div className="cp-row-n">#{i + 1}</div>
              <input
                className="cp-row-date"
                type="date"
                value={v.data}
                onChange={(e) => setVencField(i, "data", e.target.value)}
              />
              <input
                className="cp-row-val"
                type="number"
                step="0.01"
                inputMode="decimal"
                placeholder="Valor"
                value={v.valor}
                onChange={(e) => setVencField(i, "valor", e.target.value)}
              />
            </div>
          ))}
        </div>

        {/* Forma / Plano */}
        <div className="cp-end">
          <label className="lbl">
            <span>Forma</span>
            <select value={forma} onChange={(e) => setForma(e.target.value)}>
              {FORMAS.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </label>

          <label className="lbl">
            <span>Plano de Contas (pagar)</span>
            <select value={plano} onChange={(e) => setPlano(e.target.value)}>
              <option value="">Selecione…</option>
              <optgroup label="1. Pessoal">
                {PLANO_PAGAR.filter((p) => p.code.startsWith("1.")).map((p) => (
                  <option key={p.code} value={p.code}>
                    {p.code} {p.label}
                  </option>
                ))}
              </optgroup>
              <optgroup label="2. Dudunitê">
                {PLANO_PAGAR.filter((p) => p.code.startsWith("2.")).map((p) => (
                  <option key={p.code} value={p.code}>
                    {p.code} {p.label}
                  </option>
                ))}
              </optgroup>
            </select>
          </label>
        </div>

        {/* Descrição */}
        <div className="cp-mid">
          <label className="lbl">
            <span>Descrição (opcional)</span>
            <input
              placeholder="ex.: assinatura, manutenção, etc."
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
            />
          </label>
        </div>

        {/* Totais */}
        <div className="cp-totais">Total do lote: {fmtBRL(totalDoLoteAbs)}</div>

        {/* Ações */}
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
              setOcorrencias("1");
              setVencs([
                {
                  data: new Date().toISOString().slice(0, 10),
                  valor: "",
                },
              ]);
              setEditId(null);
            }}
          >
            Limpar
          </button>
        </div>

        <div className="cp-rodape-note">
          Conta: EXTRATO BANCARIO • Status: PREVISTO • Valores gravados como
          SAÍDA (negativos).
        </div>
      </div>

      {/* FOOTER padrão */}
      <button
        className="btn-voltar-foot"
        onClick={() => setTela?.("CtsReceber")}
      >
        ◀ Menu Financeiro
      </button>
      <footer className="erp-footer">
        <div className="erp-footer-track">• Pagamentos •</div>
      </footer>
    </div>
  );
            }

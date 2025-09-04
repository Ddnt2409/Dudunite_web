// src/pages/CtsPagar.jsx
import React, { useEffect, useMemo, useState } from "react";
import "./CtsPagar.css";

// ===== persistência via LocalStorage (mesma chave do FluxCx) =====
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

// util
const fmtBRL = (v) =>
  Number(v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

// ===== Plano de Contas fixo (com grupos) =====
const FIXED_PLANOS_GROUPED = [
  {
    group: "1. Pessoal",
    items: [
      { codigo: "1.01.01.001", descricao: "água casa" },
      { codigo: "1.01.01.002", descricao: "celpe casa" },
      { codigo: "1.01.01.003", descricao: "aluguel casa" },
      { codigo: "1.01.01.004", descricao: "internet casa" },
      { codigo: "1.01.01.005", descricao: "cuidados casa (fixas)" },
      { codigo: "1.01.02.001", descricao: "feira" },
      { codigo: "1.01.02.002", descricao: "lanches" },
      { codigo: "1.01.02.003", descricao: "eventos casa" },
      { codigo: "1.01.02.004", descricao: "suplementos" },
      { codigo: "1.01.03.001", descricao: "escolas" },
      { codigo: "1.01.03.002", descricao: "academia" },
      { codigo: "1.01.03.003", descricao: "personal" },
      { codigo: "1.01.03.004", descricao: "futuro 1" },
      { codigo: "1.01.03.005", descricao: "futuro 2" },
      { codigo: "1.01.03.006", descricao: "futuro 3" },
      { codigo: "1.01.04.001", descricao: "internet casa (assinatura)" },
      { codigo: "1.01.04.002", descricao: "tv box" },
      { codigo: "1.01.04.003", descricao: "celular" },
      { codigo: "1.01.04.004", descricao: "futuro 1" },
      { codigo: "1.01.04.005", descricao: "futuro 2" },
      { codigo: "1.01.05.001", descricao: "pintura casa" },
      { codigo: "1.01.05.002", descricao: "elétrica casa" },
      { codigo: "1.01.05.003", descricao: "hidráulica casa" },
      { codigo: "1.01.05.004", descricao: "decoração casa" },
      { codigo: "1.01.05.005", descricao: "gás casa" },
      { codigo: "1.01.06.001", descricao: "cabelo" },
      { codigo: "1.01.06.002", descricao: "manicure" }, // corrigido conflito
      { codigo: "1.01.06.004", descricao: "unha" },
      { codigo: "1.01.06.005", descricao: "sobrancelha" },
      { codigo: "1.01.06.006", descricao: "maquiagem" },
      { codigo: "1.01.06.007", descricao: "buço" },
      { codigo: "1.01.06.008", descricao: "massagem" },
      { codigo: "1.01.06.009", descricao: "futuro 1" },
      { codigo: "1.01.06.010", descricao: "futuro 2" },
      { codigo: "1.01.07.001", descricao: "locação" },
      { codigo: "1.01.07.002", descricao: "alimentação" },
      { codigo: "1.01.07.003", descricao: "deslocamento" },
    ],
  },
  {
    group: "2. Dudunitê",
    items: [
      { codigo: "2.01.01.001", descricao: "água emp" },
      { codigo: "2.01.01.002", descricao: "celpe emp" },
      { codigo: "2.01.01.003", descricao: "aluguel emp" },
      { codigo: "2.01.01.004", descricao: "internet emp" },
      { codigo: "2.01.01.005", descricao: "ferramentas" },
      { codigo: "2.01.01.006", descricao: "manutenção serviço emp" },
      { codigo: "2.01.02.001", descricao: "gás emp" },
      { codigo: "2.01.02.002", descricao: "manutenção emp" },
      { codigo: "2.01.02.003", descricao: "pintura emp" },
      { codigo: "2.01.02.004", descricao: "hidráulica emp" },
      { codigo: "2.01.02.005", descricao: "futuro" },
      { codigo: "2.01.03.001", descricao: "produção emp" },
      { codigo: "2.01.03.002", descricao: "embalagem emp" },
      { codigo: "2.01.03.003", descricao: "recheio emp" },
      { codigo: "2.01.03.004", descricao: "terceiros emp" },
      { codigo: "2.01.03.005", descricao: "papelaria emp" },
      { codigo: "2.01.03.006", descricao: "equipamentos" },
    ],
  },
];

const FIXED_FLAT = FIXED_PLANOS_GROUPED.flatMap((g) =>
  g.items.map((i) => ({ ...i, label: `${i.codigo} ${i.descricao}`, group: g.group }))
);

// ==== suporte a LocalStorage com outras chaves ====
const PLANO_KEYS = [
  "financeiro_plano_pagar",
  "plano_contas_pagar",
  "financeiro_plano_contas_pagar",
  "financeiro_plano_contas",
];

function normalizePlanos(raw) {
  if (!raw) return [];
  const out = [];
  for (const item of raw) {
    if (typeof item === "string") {
      const parts = item.trim().split(/\s+/);
      if (parts.length) {
        const codigo = parts.shift();
        const descricao = parts.join(" ");
        out.push({ codigo, descricao, label: `${codigo} ${descricao}`.trim() });
      }
    } else if (item && typeof item === "object") {
      const codigo = item.codigo || item.code || item.id || "";
      const descricao = item.descricao || item.desc || item.nome || "";
      if (codigo || descricao)
        out.push({
          codigo: String(codigo),
          descricao: String(descricao),
          label: `${codigo} ${descricao}`.trim(),
        });
    }
  }
  const seen = new Set();
  return out.filter((p) => {
    const k = p.codigo || p.label;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

function loadPlanosFromLS() {
  for (const k of PLANO_KEYS) {
    try {
      const raw = localStorage.getItem(k);
      if (!raw) continue;
      const parsed = JSON.parse(raw);
      const planos = normalizePlanos(parsed);
      if (planos.length) return planos;
    } catch {}
  }
  return [];
}

function mergeByCodigo(a = [], b = []) {
  const map = new Map();
  [...a, ...b].forEach((p) => map.set(p.codigo || p.label, p));
  return Array.from(map.values());
}

export default function CtsPagar({ setTela }) {
  // ===== estado base =====
  const [periodicidade, setPeriodicidade] = useState("Único");
  const [ocorrencias, setOcorrencias] = useState(1);
  const [vencs, setVencs] = useState([
    { data: new Date().toISOString().slice(0, 10), valor: "" },
  ]);
  const [forma, setForma] = useState("PIX");
  const [plano, setPlano] = useState("");
  const [descricao, setDescricao] = useState("");

  const [planosLS, setPlanosLS] = useState([]);
  const [editId, setEditId] = useState(null);

  const totalLote = useMemo(
    () => -1 * vencs.reduce((s, v) => s + Math.abs(Number(v.valor || 0)), 0),
    [vencs]
  );

  // carrega planos LS
  useEffect(() => {
    setPlanosLS(loadPlanosFromLS());
  }, []);

  // pré-preencher ao editar
  useEffect(() => {
    try {
      const raw = localStorage.getItem("editar_financeiro");
      if (!raw) return;
      const info = JSON.parse(raw);
      if (info && String(info.origem).toUpperCase() === "PAGAR") {
        setEditId(info.id || null);
        setPeriodicidade("Único");
        setOcorrencias(1);

        const d = info.data
          ? typeof info.data === "string"
            ? info.data.slice(0, 10)
            : new Date(info.data).toISOString().slice(0, 10)
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

  // helpers UI
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

  // salvar
  function salvarPrevisto() {
    if (!plano) return alert("Selecione o Plano de Contas.");
    if (!forma) return alert("Informe a Forma de pagamento.");
    for (const [i, v] of vencs.entries()) {
      if (!v.data) return alert(`Informe a data da ocorrência #${i + 1}.`);
      if (!v.valor || Number(v.valor) <= 0)
        return alert(`Informe o valor da ocorrência #${i + 1}.`);
    }

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
          doc.valor = -v;
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
        valor: -Math.abs(Number(v.valor || 0)),
        meta: { periodicidade, ocorrencias, ordem: idx + 1 },
      };
      arr.push(doc);
    });
    saveAll(arr);

    alert(
      `Previsto salvo. Ocorrências: ${vencs.length}. Total do lote: ${fmtBRL(
        Math.abs(totalLote)
      )}.`
    );
    setDescricao("");
    setPlano("");
    setForma("PIX");
    setPeriodicidade("Único");
    setOcorrencias(1);
    setVencs([{ data: new Date().toISOString().slice(0, 10), valor: "" }]);
  }

  const extrasLS = mergeByCodigo(planosLS, []).filter(
    (p) => !FIXED_FLAT.some((f) => f.codigo === p.codigo)
  );

  return (
    <div className="ctspagar-main">
      {/* Cabeçalho no padrão LanPed */}
      <header className="lp-header">
        <img
          src="/LogomarcaDDnt2025Vazado.png"
          alt="Dudunitê"
          className="lp-logo"
        />
        <h1>Lançar Pagamento (Previsto)</h1>
      </header>

      <div className="fin-card ctspagar-card">
        <div className="cp-linha cp-topnote">
          <span>Conta: EXTRATO BANCARIO</span>
          <span>•</span>
          <span>Status: PREVISTO</span>
          <span>•</span>
          <span>Valores gravados como SAÍDA (negativos)</span>
        </div>

        {/* Linha 1 — periodicidade e ocorrências */}
        <div className="cp-linha cp-grid-3">
          <div className="cp-field">
            <label>Periodicidade</label>
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

          <div className="cp-field">
            <label>Ocorrências</label>
            <input
              type="number"
              min={1}
              value={ocorrencias}
              onChange={(e) => aplicarOcorrencias(e.target.value)}
            />
          </div>

          <div className="cp-field">
            <label>&nbsp;</label>
            <button className="cp-btn" onClick={preencherDatasAuto}>
              Preencher datas automaticamente
            </button>
          </div>
        </div>

        {/* Ocorrências (data/valor) */}
        {vencs.map((v, i) => (
          <div key={i} className="cp-linha cp-grid-3">
            <div className="cp-field">
              <label>Ocorrência</label>
              <div className="cp-chip">#{i + 1}</div>
            </div>
            <div className="cp-field">
              <label>Data</label>
              <input
                type="date"
                value={v.data}
                onChange={(e) => setVencField(i, "data", e.target.value)}
              />
            </div>
            <div className="cp-field">
              <label>Valor</label>
              <input
                type="number"
                step="0.01"
                placeholder="0,00"
                value={v.valor}
                onChange={(e) => setVencField(i, "valor", e.target.value)}
              />
            </div>
          </div>
        ))}

        {/* Forma / Plano / Descrição */}
        <div className="cp-linha cp-grid-3">
          <div className="cp-field">
            <label>Forma</label>
            <select value={forma} onChange={(e) => setForma(e.target.value)}>
              {FORMAS.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </div>

          <div className="cp-field">
            <label>Plano de Contas (pagar)</label>
            <select value={plano} onChange={(e) => setPlano(e.target.value)}>
              <option value="">Selecione…</option>

              {FIXED_PLANOS_GROUPED.map((g) => (
                <optgroup key={g.group} label={g.group}>
                  {g.items.map((p) => (
                    <option key={p.codigo} value={p.codigo}>
                      {p.codigo} {p.descricao}
                    </option>
                  ))}
                </optgroup>
              ))}

              {extrasLS.length > 0 && (
                <optgroup label="Outros (LS)">
                  {extrasLS.map((p) => (
                    <option key={p.codigo || p.label} value={p.codigo || p.label}>
                      {(p.codigo || p.label) + (p.descricao ? " " + p.descricao : "")}
                    </option>
                  ))}
                </optgroup>
              )}

              {/* Se estiver editando e o código não existir em nenhuma lista */}
              {plano &&
                ![...FIXED_FLAT, ...extrasLS].some(
                  (p) => p.codigo === plano || p.label === plano
                ) && <option value={plano}>{plano}</option>}
            </select>
          </div>

          <div className="cp-field">
            <label>Descrição (opcional)</label>
            <input
              placeholder="Ex.: assinatura, manutenção, etc."
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
            />
          </div>
        </div>

        <div className="cp-total">
          <strong>Total do lote:</strong> {fmtBRL(totalLote)}
        </div>

        <div className="cp-acoes">
          <button className="cp-btn salvar" onClick={salvarPrevisto}>
            {editId ? "Salvar ALTERAÇÃO" : "Salvar PREVISTO"}
          </button>
          <button
            className="cp-btn limpar"
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
      </div>

      <button
        className="btn-voltar-foot"
        onClick={() => setTela?.("CtsReceber")}
      >
        ◀ Menu Financeiro
      </button>
    </div>
  );
       }

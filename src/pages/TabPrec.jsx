// src/pages/TabPrec.jsx
import React, { useEffect, useMemo, useState } from "react";
import { db } from "../firebase";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";

const PRODUTOS = [
  { key: "brw7x7", nome: "BRW 7x7" },
  { key: "brw6x6", nome: "BRW 6x6" },
  { key: "pkt5x5", nome: "PKT 5x5" },
  { key: "pkt6x6", nome: "PKT 6x6" },
  { key: "esc", nome: "Escondidinho" },
];

const VAZIO = () =>
  PRODUTOS.reduce((acc, p) => {
    acc[p.key] = { rev1: 0, rev2: 0, rev3: 0 };
    return acc;
  }, {});

const fmt = (n) => (isFinite(n) ? n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "0,00");
const toNum = (v) => {
  if (typeof v === "number") return v;
  if (!v) return 0;
  const s = String(v).replace(/\./g, "").replace(",", ".");
  const n = Number(s);
  return isNaN(n) ? 0 : n;
};

export default function TabPrec({ setTela }) {
  const [vigencia, setVigencia] = useState(() => {
    const d = new Date();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${d.getFullYear()}-${mm}-${dd}`;
  });
  const [docAtual, setDocAtual] = useState("-");
  const [itens, setItens] = useState(VAZIO);
  const [msg, setMsg] = useState("");
  const [tipoMsg, setTipoMsg] = useState("info"); // info | ok | erro
  const [salvando, setSalvando] = useState(false);
  const [carregando, setCarregando] = useState(false);

  const colRef = useMemo(() => collection(db, "tabela_precos_revenda"), []);

  useEffect(() => {
    // carrega última vigente ao abrir
    handleCarregarUltima();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function setBanner(t, tipo = "info") {
    setTipoMsg(tipo);
    setMsg(t);
    if (tipo !== "erro") {
      setTimeout(() => setMsg(""), 2500);
    }
  }

  function handleChange(prodKey, revKey, val) {
    setItens((old) => ({
      ...old,
      [prodKey]: { ...old[prodKey], [revKey]: toNum(val) },
    }));
  }

  async function handleCarregarUltima() {
    setCarregando(true);
    setBanner("Carregando...", "info");
    try {
      const q = query(colRef, orderBy("data", "desc"), limit(1));
      const snap = await getDocs(q);
      if (snap.empty) {
        setItens(VAZIO());
        setDocAtual("-");
        setBanner("Sem registros ainda.");
      } else {
        const d = snap.docs[0];
        const dados = d.data();
        setDocAtual(dados?.data || d.id);
        setVigencia(dados?.data || d.id);
        const precos = dados?.precos || {};
        // normaliza
        const base = VAZIO();
        for (const p of PRODUTOS) {
          const linha = precos[p.key] || {};
          base[p.key] = {
            rev1: toNum(linha.rev1),
            rev2: toNum(linha.rev2),
            rev3: toNum(linha.rev3),
          };
        }
        setItens(base);
        setBanner("Última tabela carregada.", "ok");
      }
    } catch (e) {
      setBanner(`Falha ao carregar: ${e.message}`, "erro");
    } finally {
      setCarregando(false);
    }
  }

  async function handleSalvar() {
    if (!vigencia || !/^\d{4}-\d{2}-\d{2}$/.test(vigencia)) {
      setBanner("Informe a vigência no formato YYYY-MM-DD.", "erro");
      return;
    }
    setSalvando(true);
    setBanner("Salvando...", "info");
    try {
      // monta payload
      const precos = {};
      for (const p of PRODUTOS) {
        const row = itens[p.key] || {};
        precos[p.key] = {
          rev1: toNum(row.rev1),
          rev2: toNum(row.rev2),
          rev3: toNum(row.rev3),
        };
      }
      const ref = doc(colRef, vigencia);
      await setDoc(
        ref,
        {
          data: vigencia,
          precos,
          updatedAt: serverTimestamp(),
        },
        { merge: false }
      );
      setDocAtual(vigencia);
      setBanner("Salvo com sucesso.", "ok");
    } catch (e) {
      setBanner(`Erro ao salvar: ${e.message}`, "erro");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div style={{ background: "#ffeede", minHeight: "100vh", padding: 12 }}>
      <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
        <button
          onClick={() => setTela?.("HomeERP")}
          style={btn("ghost")}
        >
          ← Voltar
        </button>
        <button onClick={handleCarregarUltima} disabled={carregando} style={btn("brown")}>
          {carregando ? "Carregando..." : "Carregar última"}
        </button>
        <button onClick={handleSalvar} disabled={salvando} style={btn("green")}>
          {salvando ? "Salvando..." : "Salvar nova vigência"}
        </button>
      </div>

      <div style={{ fontWeight: 700, color: "#5C1D0E", fontSize: 18 }}>Tabela de Preços (Revenda)</div>
      <div style={{ marginTop: 6, marginBottom: 6 }}>Doc atual: <strong>{docAtual}</strong></div>

      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
        <label>Vigência (YYYY-MM-DD):</label>
        <input
          value={vigencia}
          onChange={(e) => setVigencia(e.target.value)}
          style={inp({ width: 180 })}
          placeholder="YYYY-MM-DD"
        />
      </div>

      {!!msg && (
        <div
          style={{
            background: tipoMsg === "erro" ? "#ffd5d5" : tipoMsg === "ok" ? "#dcf5d8" : "#fde4c8",
            border: "1px solid #c9b9a7",
            color: "#5C1D0E",
            borderRadius: 8,
            padding: "8px 10px",
            marginBottom: 10,
            fontSize: 16,
          }}
        >
          {msg}
        </div>
      )}

      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0 }}>
          <thead>
            <tr>
              <Th>Produto</Th>
              <Th>rev1</Th>
              <Th>rev2</Th>
              <Th>rev3</Th>
            </tr>
          </thead>
          <tbody>
            {PRODUTOS.map((p) => (
              <tr key={p.key}>
                <Td rotulo>{p.nome}</Td>
                {["rev1", "rev2", "rev3"].map((rev) => (
                  <Td key={rev}>
                    <input
                      inputMode="decimal"
                      value={fmt(itens[p.key]?.[rev] ?? 0)}
                      onChange={(e) =>
                        handleChange(p.key, rev, e.target.value)
                      }
                      onFocus={(e) => e.target.select()}
                      style={inp()}
                    />
                  </Td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* navegação simples */}
      <div style={{ display: "flex", gap: 10, marginTop: 14, flexWrap: "wrap" }}>
        <button style={btn()} onClick={() => setTela?.("CtsReceber")}>→ Contas a Receber</button>
        <button style={btn()} onClick={() => setTela?.("CtsPagar")}>→ Contas a Pagar</button>
        <button style={btn()} onClick={() => setTela?.("FluxCx")}>→ Fluxo de Caixa</button>
      </div>
    </div>
  );
}

function Th({ children }) {
  return (
    <th
      style={{
        textAlign: "left",
        padding: "10px 8px",
        fontSize: 18,
        color: "#5C1D0E",
      }}
    >
      {children}
    </th>
  );
}

function Td({ children, rotulo = false }) {
  return (
    <td
      style={{
        padding: "8px 6px",
        verticalAlign: "middle",
        fontSize: rotulo ? 18 : 18,
        color: "#5C1D0E",
      }}
    >
      {children}
    </td>
  );
}

function inp(extra = {}) {
  return {
    width: "110px",
    fontSize: 20,
    padding: "8px 10px",
    borderRadius: 8,
    border: "1px solid #d3c1b2",
    outline: "none",
    background: "#fff",
    color: "#5C1D0E",
    textAlign: "right",
    ...extra,
  };
}

function btn(kind = "gray") {
  const base = {
    fontSize: 16,
    padding: "8px 12px",
    borderRadius: 10,
    border: "none",
    cursor: "pointer",
    color: "#fff",
    background: "#b8b1ab",
  };
  if (kind === "green") base.background = "#2e7d32";
  if (kind === "brown") base.background = "#8c3b1b";
  if (kind === "ghost") {
    base.background = "#e0d7cf";
    base.color = "#3b2a22";
  }
  return base;
}

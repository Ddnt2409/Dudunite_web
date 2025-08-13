// src/pages/TabPrec.jsx
import React, { useEffect, useState } from "react";
import {
  collection,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  setDoc,
  serverTimestamp,
  documentId,
} from "firebase/firestore";
import db from "../firebase";

const PRODUTOS = [
  { key: "brw7x7", nome: "BRW 7x7" },
  { key: "brw6x6", nome: "BRW 6x6" },
  { key: "pkt5x5", nome: "PKT 5x5" },
  { key: "pkt6x6", nome: "PKT 6x6" },
  { key: "esc", nome: "Escondidinho" },
];

const estiloInput = {
  width: "110px",
  fontSize: "18px",
  padding: "6px 8px",
  textAlign: "right",
  borderRadius: 6,
  border: "1px solid #d2b7a0",
  background: "#fff",
};

const estiloTh = { fontWeight: 700, fontSize: 18, padding: "8px" };
const estiloTd = { padding: "6px 8px", fontSize: 18 };

function formatView(n) {
  if (n == null || isNaN(n)) return "0,00";
  const v = Number(n);
  return v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function parseToNumber(txt) {
  if (txt == null) return 0;
  const s = String(txt).replace(/\./g, "").replace(",", ".");
  const v = Number(s);
  return isNaN(v) ? 0 : v;
}

export default function TabPrec({ setTela }) {
  const [vigencia, setVigencia] = useState(() => {
    const hoje = new Date();
    const yyyy = hoje.getFullYear();
    const mm = String(hoje.getMonth() + 1).padStart(2, "0");
    const dd = String(hoje.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  });

  const [docAtual, setDocAtual] = useState("-");
  const [msg, setMsg] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [salvando, setSalvando] = useState(false);

  const [precos, setPrecos] = useState({
    brw7x7: { rev1: 0, rev2: 0, rev3: 0 },
    brw6x6: { rev1: 0, rev2: 0, rev3: 0 },
    pkt5x5: { rev1: 0, rev2: 0, rev3: 0 },
    pkt6x6: { rev1: 0, rev2: 0, rev3: 0 },
    esc: { rev1: 0, rev2: 0, rev3: 0 },
  });

  // == CARGA RESILIENTE ======================================================
  async function carregarUltima() {
    setMsg("Carregando última...");
    setCarregando(true);
    try {
      const col = collection(db, "tabela_precos_revenda");
      let chosenDoc = null;

      // 1) tentar por campo 'data'
      try {
        const q1 = query(col, orderBy("data", "desc"), limit(1));
        const s1 = await getDocs(q1);
        if (!s1.empty) chosenDoc = s1.docs[0];
      } catch (_) {}

      // 2) se não deu, tentar por documentId()
      if (!chosenDoc) {
        try {
          const q2 = query(col, orderBy(documentId(), "desc"), limit(1));
          const s2 = await getDocs(q2);
          if (!s2.empty) chosenDoc = s2.docs[0];
        } catch (_) {}
      }

      // 3) fallback: lê tudo e pega maior ID
      if (!chosenDoc) {
        const all = await getDocs(col);
        if (!all.empty) {
          const arr = all.docs.slice().sort((a, b) => (a.id > b.id ? -1 : 1));
          chosenDoc = arr[0];
        }
      }

      if (!chosenDoc) {
        setDocAtual("-");
        setMsg("Sem registros. Preencha e salve uma nova vigência.");
        return;
      }

      const data = chosenDoc.data() || {};
      setDocAtual(chosenDoc.id);

      // normalização (map 'precos' OU chaves na raiz)
      let novo = {};
      if (data.precos && typeof data.precos === "object") {
        PRODUTOS.forEach((p) => {
          const m = data.precos[p.key] || {};
          novo[p.key] = {
            rev1: Number(m.rev1 || 0),
            rev2: Number(m.rev2 || 0),
            rev3: Number(m.rev3 || 0),
          };
        });
      } else {
        PRODUTOS.forEach((p) => {
          const m = data[p.key] || {};
          novo[p.key] = {
            rev1: Number(m.rev1 || 0),
            rev2: Number(m.rev2 || 0),
            rev3: Number(m.rev3 || 0),
          };
        });
      }

      setPrecos(novo);
      setMsg("Última tabela carregada.");
    } catch (err) {
      console.error("Falha ao carregar:", err);
      setMsg("Falha ao carregar a última vigência.");
    } finally {
      setCarregando(false);
    }
  }

  // == SALVAR (raiz + mapa 'precos' p/ retrocompatibilidade) =================
  async function salvarNova() {
    const id = vigencia?.trim() || docAtual || "0000-00-00";
    if (!/^\d{4}-\d{2}-\d{2}$/.test(id)) {
      setMsg("Vigência inválida. Use YYYY-MM-DD.");
      return;
    }

    setMsg("Salvando...");
    setSalvando(true);
    try {
      const payloadRaiz = {};
      const payloadPrecos = {};

      PRODUTOS.forEach((p) => {
        payloadRaiz[p.key] = {
          rev1: parseToNumber(precos[p.key]?.rev1),
          rev2: parseToNumber(precos[p.key]?.rev2),
          rev3: parseToNumber(precos[p.key]?.rev3),
        };
        payloadPrecos[p.key] = { ...payloadRaiz[p.key] };
      });

      const ref = doc(db, "tabela_precos_revenda", id);
      await setDoc(
        ref,
        {
          data: id,
          updatedAt: serverTimestamp(),
          precos: payloadPrecos, // padrão novo
          ...payloadRaiz,        // padrão antigo (raiz)
        },
        { merge: true }
      );

      setDocAtual(id);
      setMsg("Vigência salva com sucesso.");
    } catch (err) {
      console.error("Falha ao salvar:", err);
      setMsg("Falha ao salvar. Verifique as regras do Firestore.");
    } finally {
      setSalvando(false);
    }
  }

  useEffect(() => {
    carregarUltima();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={{ background: "#FCE8D8", minHeight: "100vh", padding: 12, color: "#5C1D0E" }}>
      <div style={{ marginBottom: 10, display: "flex", gap: 10, flexWrap: "wrap" }}>
        <button
          onClick={() => (setTela ? setTela("HomeERP") : window.history.back())}
          disabled={carregando || salvando}
        >
          ← Voltar
        </button>
        <button onClick={carregarUltima} disabled={carregando || salvando}>
          {carregando ? "Carregando..." : "Carregar última"}
        </button>
        <button onClick={salvarNova} disabled={carregando || salvando}>
          {salvando ? "Salvando..." : "Salvar nova vigência"}
        </button>
      </div>

      <div style={{ marginBottom: 4, fontWeight: 700, fontSize: 18 }}>Tabela de Preços (Revenda)</div>
      <div style={{ marginBottom: 6, fontSize: 16 }}>Doc atual: {docAtual}</div>

      <div style={{ marginBottom: 10, fontSize: 16 }}>
        Vigência (YYYY-MM-DD):{" "}
        <input
          type="text"
          value={vigencia}
          onChange={(e) => setVigencia(e.target.value)}
          style={{ fontSize: 18, padding: "6px 8px", width: 160 }}
        />
      </div>

      {msg && (
        <div
          style={{
            marginBottom: 12,
            background: msg.startsWith("Falha") ? "#ffd6d6" : "#d6f5d6",
            padding: 8,
            borderRadius: 6,
            fontSize: 16,
          }}
        >
          {msg}
        </div>
      )}

      <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: "0 6px" }}>
        <thead>
          <tr>
            <th style={{ ...estiloTh, textAlign: "left" }}>Produto</th>
            <th style={estiloTh}>rev1</th>
            <th style={estiloTh}>rev2</th>
            <th style={estiloTh}>rev3</th>
          </tr>
        </thead>
        <tbody>
          {PRODUTOS.map((p) => (
            <tr key={p.key}>
              <td style={{ ...estiloTd, fontWeight: 600 }}>{p.nome}</td>
              {["rev1", "rev2", "rev3"].map((rev) => (
                <td key={rev} style={estiloTd}>
                  <input
                    inputMode="decimal"
                    style={estiloInput}
                    value={formatView(precos[p.key]?.[rev])}
                    onChange={(e) => {
                      const v = parseToNumber(e.target.value);
                      setPrecos((old) => ({
                        ...old,
                        [p.key]: { ...old[p.key], [rev]: v },
                      }));
                    }}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ display: "flex", gap: 8, marginTop: 16, flexWrap: "wrap" }}>
        <button onClick={() => setTela && setTela("CtsReceber")}>→ Contas a Receber</button>
        <button onClick={() => setTela && setTela("CtsPagar")}>→ Contas a Pagar</button>
        <button onClick={() => setTela && setTela("FluxoCaixa")}>→ Fluxo de Caixa</button>
      </div>
    </div>
  );
}

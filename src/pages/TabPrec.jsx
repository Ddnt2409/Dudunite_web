// src/pages/TabPrec.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  setDoc,
  updateDoc,
  FieldPath,
} from "firebase/firestore";
import { db } from "../firebase";

const PRODUTOS = [
  { key: "brw7x7", label: "BRW 7x7" },
  { key: "brw6x6", label: "BRW 6x6" },
  { key: "pkt5x5", label: "PKT 5x5" },
  { key: "pkt6x6", label: "PKT 6x6" },
  { key: "esc", label: "Escondidinho" },
];

const CAMPOS_IGNORAR = new Set(["data", "updatedAt", "_seed"]);

const sanitizeMoneyStr = (v) => {
  if (typeof v !== "string") v = String(v ?? "");
  return v.replace(/[^\d,.\-]/g, "").replace(",", ".");
};
const toNumberBR = (v) => {
  const s = sanitizeMoneyStr(v);
  const n = Number(s);
  return Number.isFinite(n) ? n : 0;
};
const toStrBR = (n) =>
  Number(n).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const buildEmptyState = () => ({
  brw7x7: { rev1: "0,00", rev2: "0,00", rev3: "0,00" },
  brw6x6: { rev1: "0,00", rev2: "0,00", rev3: "0,00" },
  pkt5x5: { rev1: "0,00", rev2: "0,00", rev3: "0,00" },
  pkt6x6: { rev1: "0,00", rev2: "0,00", rev3: "0,00" },
  esc: { rev1: "0,00", rev2: "0,00", rev3: "0,00" },
});

export default function TabPrec({ setTela }) {
  const [vigencia, setVigencia] = useState(() => {
    const d = new Date();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${d.getFullYear()}-${m}-${day}`;
  });
  const [docAtual, setDocAtual] = useState("-");
  const [form, setForm] = useState(buildEmptyState());
  const [status, setStatus] = useState("");
  const [salvando, setSalvando] = useState(false);

  const tabelaCol = useMemo(() => collection(db, "tabela_precos_revenda"), []);

  // === mapeia um documento em qualquer formato (com 'precos' ou na raiz) ===
  const mapDocToForm = (id, dataObj) => {
    const novo = buildEmptyState();

    // 1) Padrão novo: data.precos.{produto}.{rev}
    if (dataObj?.precos && typeof dataObj.precos === "object") {
      for (const p of PRODUTOS) {
        const linha = dataObj.precos[p.key] || {};
        novo[p.key] = {
          rev1: toStrBR(linha.rev1 ?? 0),
          rev2: toStrBR(linha.rev2 ?? 0),
          rev3: toStrBR(linha.rev3 ?? 0),
        };
      }
      return { docIdOuData: dataObj.data || id, form: novo };
    }

    // 2) Padrão antigo: campos na raiz (brw7x7, brw6x6, ...)
    for (const [k, v] of Object.entries(dataObj || {})) {
      if (CAMPOS_IGNORAR.has(k)) continue;
      if (!novo[k]) continue; // ignora chaves desconhecidas
      novo[k] = {
        rev1: toStrBR(v?.rev1 ?? 0),
        rev2: toStrBR(v?.rev2 ?? 0),
        rev3: toStrBR(v?.rev3 ?? 0),
      };
    }
    return { docIdOuData: dataObj?.data || id, form: novo };
  };

  const carregarUltima = async () => {
    try {
      setStatus("Carregando última...");
      // 1) Tenta pelo campo 'data'
      let snap = await getDocs(query(tabelaCol, orderBy("data", "desc"), limit(1)));
      // 2) Fallback: se não tiver 'data', pega pelo ID do doc (YYYY-MM-DD)
      if (snap.empty) {
        snap = await getDocs(
          query(tabelaCol, orderBy(FieldPath.documentId(), "desc"), limit(1))
        );
      }

      if (snap.empty) {
        setDocAtual("-");
        setForm(buildEmptyState());
        setStatus("Sem registros. Preencha e salve uma nova vigência.");
        return;
      }

      const ref = snap.docs[0];
      const data = ref.data();
      const { docIdOuData, form } = mapDocToForm(ref.id, data);
      setDocAtual(docIdOuData || ref.id);
      setVigencia(docIdOuData || ref.id);
      setForm(form);
      setStatus("Última tabela carregada.");
    } catch (err) {
      console.error(err);
      setStatus("Falha ao carregar a última vigência.");
    }
  };

  useEffect(() => {
    carregarUltima();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onChangeValor = (prodKey, revKey, value) => {
    setForm((prev) => ({
      ...prev,
      [prodKey]: { ...prev[prodKey], [revKey]: value },
    }));
  };

  const salvar = async () => {
    if (salvando) return;
    setSalvando(true);
    setStatus("Salvando...");

    try {
      const id = String(vigencia || "").trim();
      if (!/^\d{4}-\d{2}-\d{2}$/.test(id)) {
        setStatus("Data inválida. Use YYYY-MM-DD.");
        return;
      }

      // monta payload em número e valida soma
      let soma = 0;
      const payloadPrecos = {};
      for (const p of PRODUTOS) {
        const f = form[p.key] || {};
        const n1 = toNumberBR(f.rev1);
        const n2 = toNumberBR(f.rev2);
        const n3 = toNumberBR(f.rev3);
        payloadPrecos[p.key] = { rev1: n1, rev2: n2, rev3: n3 };
        soma += (n1 || 0) + (n2 || 0) + (n3 || 0);
      }
      if (soma === 0) {
        setStatus("Tabela está toda com 0,00. Preencha antes de salvar.");
        return;
      }

      const ref = doc(tabelaCol, id);
      const exist = await getDoc(ref);

      if (exist.exists()) {
        // Atualização compatível:
        // - novo:  precos.<produto>.revX
        // - legado: <produto>.revX
        const updates = { updatedAt: new Date().toISOString() };
        for (const p of PRODUTOS) {
          const { rev1, rev2, rev3 } = payloadPrecos[p.key];
          updates[`precos.${p.key}.rev1`] = rev1;
          updates[`precos.${p.key}.rev2`] = rev2;
          updates[`precos.${p.key}.rev3`] = rev3;
          updates[`${p.key}.rev1`] = rev1;
          updates[`${p.key}.rev2`] = rev2;
          updates[`${p.key}.rev3`] = rev3;
        }
        await updateDoc(ref, updates);
      } else {
        await setDoc(ref, {
          data: id,
          updatedAt: new Date().toISOString(),
          precos: payloadPrecos,
        });
      }

      await carregarUltima();
      setStatus("Salvo com sucesso e conferido.");
    } catch (err) {
      console.error(err);
      setStatus("Erro ao salvar tabela.");
    } finally {
      setSalvando(false);
    }
  };

  const baseInput =
    "w-[110px] px-3 py-2 rounded border border-[#d9b8a8] bg-white focus:outline-none focus:ring-2 focus:ring-[#c96f4a]";
  const tdCls = "py-2 px-2 border-b border-[#efd6c9]";
  const thCls =
    "py-2 px-2 text-left border-b border-[#dcb7a4] text-[#5C1D0E] font-semibold";

  return (
    <div className="min-h-screen bg-[#FDEBDF] text-[#5C1D0E] p-3 sm:p-6">
      <div className="flex items-center gap-2 mb-3">
        <button
          onClick={() => setTela?.("HomeERP")}
          className="bg-[#d0b9ae] text-[#5C1D0E] px-3 py-2 rounded"
          style={{ fontSize: 18, fontWeight: 600 }}
        >
          ← Voltar
        </button>
        <button
          onClick={carregarUltima}
          className="bg-[#8c3b1b] text-white px-3 py-2 rounded"
          style={{ fontSize: 18, fontWeight: 700 }}
        >
          Carregar última
        </button>
        <button
          onClick={salvar}
          disabled={salvando}
          className={`${
            salvando ? "bg-[#3e7f4f]/70" : "bg-[#3e7f4f]"
          } text-white px-3 py-2 rounded`}
          style={{ fontSize: 18, fontWeight: 700 }}
        >
          {salvando ? "Salvando..." : "Salvar nova vigência"}
        </button>
      </div>

      <div className="mb-2" style={{ fontSize: 22, fontWeight: 800 }}>
        Tabela de Preços (Revenda)
      </div>

      <div className="mb-2" style={{ fontSize: 18 }}>
        <strong>Doc atual:</strong> {docAtual || "-"}
      </div>

      <div className="flex items-center gap-2 mb-4">
        <label style={{ fontSize: 18 }}>Vigência (YYYY-MM-DD):</label>
        <input
          type="text"
          value={vigencia}
          onChange={(e) => setVigencia(e.target.value)}
          className="px-3 py-2 rounded border border-[#d9b8a8] bg-white"
          style={{ fontSize: 20, width: 180 }}
          placeholder="YYYY-MM-DD"
        />
      </div>

      {status && (
        <div
          className="mb-3 px-3 py-2 rounded"
          style={{
            background: status.includes("sucesso") ? "#c6f6d5" : "#fdebd3",
            fontSize: 18,
          }}
        >
          {status}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-[680px] w-full bg-[#fde6d9] rounded">
          <thead>
            <tr className="bg-[#f3d1bf]">
              <th className={thCls} style={{ fontSize: 20 }}>
                Produto
              </th>
              <th className={thCls} style={{ fontSize: 20 }}>
                rev1
              </th>
              <th className={thCls} style={{ fontSize: 20 }}>
                rev2
              </th>
              <th className={thCls} style={{ fontSize: 20 }}>
                rev3
              </th>
            </tr>
          </thead>
          <tbody>
            {PRODUTOS.map((p) => (
              <tr key={p.key}>
                <td className={tdCls} style={{ fontSize: 20 }}>
                  {p.label}
                </td>
                {["rev1", "rev2", "rev3"].map((rev) => (
                  <td key={rev} className={tdCls}>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={form[p.key][rev]}
                      onChange={(e) => onChangeValor(p.key, rev, e.target.value)}
                      className={baseInput}
                      style={{ fontSize: 20, textAlign: "right" }}
                      placeholder="0,00"
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        <button
          onClick={() => setTela?.("CtsReceber")}
          className="bg-[#cbbdb7] px-3 py-2 rounded"
          style={{ fontSize: 18 }}
        >
          → Contas a Receber
        </button>
        <button
          onClick={() => setTela?.("CtsPagar")}
          className="bg-[#cbbdb7] px-3 py-2 rounded"
          style={{ fontSize: 18 }}
        >
          → Contas a Pagar
        </button>
        <button
          onClick={() => setTela?.("FluxCx")}
          className="bg-[#cbbdb7] px-3 py-2 rounded"
          style={{ fontSize: 18 }}
        >
          → Fluxo de Caixa
        </button>
      </div>
    </div>
  );
          }

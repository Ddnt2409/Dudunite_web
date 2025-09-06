// src/pages/SuprComprasLista.jsx
import React, { useEffect, useMemo, useState } from "react";
import ERPHeader from "./ERPHeader";
import ERPFooter from "./ERPFooter";
import db from "../firebase";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";

/* ========================= Catálogo A–Z ========================= */
const CATALOGO = [
  // Embalagem
  "Base mini naked (un)",
  "Copo bolha 400ml (fileira c/100)",
  "Emb 640 (cx c/300)",
  "Emb 640 (pct c/10)",
  "Emb 650 (cx c/300)",
  "Emb 650 (pct c/10)",
  "Emb D135ml (cx c/100)",
  "Emb D135ml (pct c/10)",
  "Emb D135ml (un)",
  "Emb triplo (un)",
  "Paleta (pct c/100un)",
  "Paleta (pct c/500un)",
  "Papel filme 28cmx100m (un)",
  "Papel filme 28cmx300m (un)",
  "Pote de Biscoito (pct c/10)",
  "Pote de Biscoito (un)",
  "Pote de creme (pct c/10)",
  "Pote de creme (pct c/50)",
  "Saco 10x10cm (sc c/100)",
  "Saco 5x30cm (sc c/100)",
  "Saco 6x22cm (sc c/100)",
  "Saco 8.5x8.5cm (sc c/100)",
  "Saco de confeitar (un)",

  // Gráfica
  "Etiqueta brownie (A3)",
  "Etiqueta brownie (m²)",
  "Escondidinho (m²)",
  "Etiq dudu (m²)",
  "Validade/fabricação (A3)",

  // Recheios
  "Biscoito oreo (90g)",
  "Chocolate fracionado (kg)",
  "Coloretti (500g)",
  "Cx Creme de leite (1 litro)",
  "Cx Creme de leite (200g)",
  "Cx Leite condensado (395g)",
  "Cx mistura láctea (395g)",
  "Glucose (Pote 5 litros)",
  "Glucose (Pote 500g)",
  "Granulado flocos (500g)",
  "Leite de vaca (1 litro)",
  "Leite em pó (200g)",
  "Leite em pó (750g)",
  "Maracujá (un)",
  "Morango (un)",
  "Nescau (2kg)",
  "Nutella (Pote 650g)",
  "Ovomaltine (300g)",
  "Ovomaltine (700g)",

  // Massas
  "Farinha de trigo (kg)",
  "Margarina (200ml)",
  "Margarina (3kg)",
  "Mistura brownie (pct 400g)",
  "Ovos (bdj 30)",
].sort((a, b) => a.localeCompare(b, "pt-BR"));

/* ========================= helpers ========================= */
const ymd = (d) => {
  const x = new Date(d);
  const mm = String(x.getMonth() + 1).padStart(2, "0");
  const dd = String(x.getDate()).padStart(2, "0");
  return `${x.getFullYear()}-${mm}-${dd}`;
};
const fmtBRL = (n) =>
  `R$ ${(Number(n) || 0).toFixed(2).replace(".", ",")}`;

/* ========================= Componente ========================= */
export default function SuprComprasLista({ setTela }) {
  const [data, setData] = useState(ymd(new Date()));
  const [busca, setBusca] = useState("");
  const [linhas, setLinhas] = useState([]);

  // carrega do Firestore e sempre mescla com o catálogo (garante a lista cheia)
  useEffect(() => {
    (async () => {
      try {
        const ref = doc(db, "supr_compras", data);
        const snap = await getDoc(ref);
        const salvas = snap.exists() ? (snap.data()?.itens || []) : [];
        const map = new Map(salvas.map((i) => [i.produto, i]));
        const merged = CATALOGO.map((produto) => ({
          produto,
          qtd: Number(map.get(produto)?.qtd || 0),
          vlr: Number(map.get(produto)?.vlr || 0),
          ok: !!map.get(produto)?.ok,
        }));
        setLinhas(merged);
      } catch (e) {
        console.error("Falha ao carregar compras:", e);
        setLinhas(CATALOGO.map((produto) => ({ produto, qtd: 0, vlr: 0, ok: false })));
      }
    })();
  }, [data]);

  function setCampo(i, campo, valor) {
    setLinhas((prev) => {
      const arr = [...prev];
      arr[i] = { ...arr[i], [campo]: campo === "ok" ? !!valor : valor };
      return arr;
    });
  }

  const linhasFiltradas = useMemo(() => {
    const q = busca.trim().toLowerCase();
    if (!q) return linhas;
    return linhas.filter((l) => l.produto.toLowerCase().includes(q));
  }, [linhas, busca]);

  const totalDia = useMemo(
    () => linhas.reduce((s, l) => s + (Number(l.qtd) * Number(l.vlr) || 0), 0),
    [linhas]
  );

  async function salvar() {
    const itens = linhas
      .filter((l) => Number(l.qtd) > 0 || Number(l.vlr) > 0 || l.ok)
      .map((l) => ({
        produto: l.produto,
        qtd: Number(l.qtd) || 0,
        vlr: Number(l.vlr) || 0,
        ok: !!l.ok,
        total: (Number(l.qtd) || 0) * (Number(l.vlr) || 0),
      }));
    await setDoc(
      doc(db, "supr_compras", data),
      {
        data,
        itens,
        total: itens.reduce((s, i) => s + i.total, 0),
        atualizadoEm: serverTimestamp(),
        criadoEm: serverTimestamp(),
      },
      { merge: true }
    );
    alert("Compras salvas para " + data.split("-").reverse().join("/"));
  }

  return (
    <>
      <ERPHeader title="ERP DUDUNITÊ — Compras por Lista (A–Z)" />

      <main
        style={{
          minHeight: "100vh",
          padding: "10px 10px 80px",
          background: 'url("/bg001.png") center 140px / cover no-repeat, #fcf4e9',
          boxSizing: "border-box",
        }}
      >
        {/* Barra superior: data, busca, total e salvar */}
        <div
          className="extrato-card"
          style={{
            maxWidth: 980, margin: "10px auto",
            background: "linear-gradient(180deg, #fffdfa 0%, #fef3d6 100%)",
            border: "1px solid #e6d2c2", borderRadius: 14, padding: 10,
            boxShadow: "0 14px 28px rgba(0,0,0,.18), inset 0 -6px 10px rgba(0,0,0,.06)",
          }}
        >
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <label>Data:
              <input
                type="date"
                value={data}
                onChange={(e) => setData(e.target.value)}
                style={{ marginLeft: 8 }}
              />
            </label>

            <input
              placeholder="Buscar produto..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              style={{
                flex: 1, minWidth: 180, height: 34, padding: "6px 10px",
                borderRadius: 10, border: "1px solid #d2b44b", background: "#fff"
              }}
            />

            <div style={{ marginLeft: "auto", fontWeight: 800 }}>
              Total do dia: {fmtBRL(totalDia)}
            </div>

            <button className="btn-acao" onClick={salvar}>Salvar</button>
          </div>
        </div>

        {/* Lista com rolagem (50% da tela) */}
        <div
          className="extrato-card"
          style={{
            maxWidth: 980, margin: "10px auto",
            background: "linear-gradient(180deg, #fffdfa 0%, #fef3d6 100%)",
            border: "1px solid #e6d2c2", borderRadius: 14, padding: 12,
            boxShadow: "0 14px 28px rgba(0,0,0,.18), inset 0 -6px 10px rgba(0,0,0,.06)",
          }}
        >
          <h3 style={{ margin: "0 0 6px", color: "#7b3c21" }}>Lista de Compras</h3>

          <div style={{ maxHeight: "50vh", overflow: "auto" }}>
            <table className="extrato" style={{ width: "100%" }}>
              <thead>
                <tr>
                  <th style={{ minWidth: 260, textAlign: "left" }}>Produto</th>
                  <th style={{ minWidth: 80 }}>Qtd</th>
                  <th style={{ minWidth: 110 }}>Vlr unit</th>
                  <th className="th-right" style={{ minWidth: 120 }}>Vlr total</th>
                  <th style={{ minWidth: 70, textAlign: "center" }}>OK ✓</th>
                  <th style={{ minWidth: 110 }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {linhasFiltradas.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: 10, color: "#7a5a2a" }}>
                      Nenhum produto.
                    </td>
                  </tr>
                ) : (
                  linhasFiltradas.map((l, i) => (
                    <tr key={l.produto}>
                      <td>{l.produto}</td>
                      <td>
                        <input
                          type="number"
                          step="0.01"
                          value={l.qtd}
                          onChange={(e) => setCampo(i, "qtd", e.target.value)}
                          style={{ width: 90 }}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          step="0.01"
                          value={l.vlr}
                          onChange={(e) => setCampo(i, "vlr", e.target.value)}
                          style={{ width: 110 }}
                        />
                      </td>
                      <td className="valor-cell">
                        {fmtBRL((Number(l.qtd) || 0) * (Number(l.vlr) || 0))}
                      </td>
                      <td style={{ textAlign: "center" }}>
                        <input
                          type="checkbox"
                          checked={!!l.ok}
                          onChange={(e) => setCampo(i, "ok", e.target.checked)}
                        />
                      </td>
                      <td>
                        <button
                          className="btn-acao"
                          onClick={() => setCampo(i, "qtd", 0) || setCampo(i, "vlr", 0)}
                        >
                          Limpar
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>

              {/* totalizador fixo da grade */}
              <tfoot>
                <tr>
                  <td colSpan={3} style={{ textAlign: "right", fontWeight: 800 }}>TOTAL</td>
                  <td className="valor-cell" style={{ fontWeight: 900 }}>
                    {fmtBRL(totalDia)}
                  </td>
                  <td colSpan={2}></td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div style={{ fontSize: 12, color: "#6b331c", marginTop: 8, lineHeight: 1.3 }}>
            • A lista é salva automaticamente por <b>data</b>. • O ✓ lança a <b>Entrada no Estoque</b> (qtd × fator da unidade de compra) e atualiza o <b>custo médio</b>.
            • Você pode mudar a data a qualquer momento para ver/lançar outro dia.
          </div>
        </div>

        <button className="btn-voltar" onClick={() => setTela("HomePCP")}>Voltar</button>
      </main>

      <ERPFooter onBack={() => setTela("HomeERP")} />
    </>
  );
                                  }

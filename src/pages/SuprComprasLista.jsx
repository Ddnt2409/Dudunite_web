// src/pages/SuprComprasLista.jsx
import React, { useEffect, useMemo, useState } from "react";
import ERPHeader from "./ERPHeader";
import ERPFooter from "./ERPFooter";
import {
  listarProdutosAZ,
  listenListaComprasDia,
  upsertItemCompra,
  marcarItemCompra,
  removerItemCompra,
} from "../util/suprimentos_store";

const money = (n) => `R$ ${Number(n||0).toFixed(2).replace(".", ",")}`;

export default function SuprComprasLista({ setTela }){
  const [data, setData] = useState(new Date().toISOString().slice(0,10));
  const [produtos, setProdutos] = useState([]);     // catálogo A–Z
  const [itens, setItens] = useState([]);          // itens do dia (aqui 1 por produto)
  const [busca, setBusca] = useState("");

  // carregar catálogo A–Z
  useEffect(()=>{
    listarProdutosAZ().then(setProdutos).catch(()=>setProdutos([]));
  }, []);

  // assinar lista do dia
  useEffect(()=>{
    const off = listenListaComprasDia(data, ({ itens, total }) => setItens(itens));
    return () => off && off();
  }, [data]);

  // index rápido dos itens já digitados (para preencher inputs)
  const mapItens = useMemo(()=>{
    const m = new Map(); itens.forEach(i => m.set(i.produtoId, i)); return m;
  }, [itens]);

  const filtrados = useMemo(()=>{
    const q = (busca||"").trim().toLowerCase();
    const base = q ? produtos.filter(p=> String(p.descricao).toLowerCase().includes(q)) : produtos;
    return base; // já vem A–Z do util
  }, [produtos, busca]);

  async function onChangeQtd(prod, qtdStr){
    const qtd = qtdStr === "" ? "" : Number(qtdStr);
    await upsertItemCompra(data, prod, {
      qtd: qtd === "" ? 0 : Math.max(0, qtd),
      precoUnit: mapItens.get(prod.id)?.precoUnit ?? 0,
      marcado: mapItens.get(prod.id)?.marcado ?? false,
    });
  }
  async function onChangePreco(prod, precoStr){
    const preco = precoStr === "" ? "" : Number(precoStr);
    await upsertItemCompra(data, prod, {
      qtd: mapItens.get(prod.id)?.qtd ?? 0,
      precoUnit: preco === "" ? 0 : Math.max(0, preco),
      marcado: mapItens.get(prod.id)?.marcado ?? false,
    });
  }
  async function onToggleCheck(prod, checked){
    const itemId = prod.id;
    await marcarItemCompra(data, itemId, checked);
  }

  async function onLimparItem(prod){
    await removerItemCompra(data, prod.id);
  }

  const totalGeral = useMemo(()=>{
    return itens.reduce((s,i)=> s + Number(i.total || 0), 0);
  }, [itens]);

  return (
    <>
      <ERPHeader title="ERP DUDUNITÊ — Compras por Lista (A–Z)" />
      <main style={{ padding: 10 }}>
        {/* Filtros topo */}
        <div className="extrato-card" style={{ marginBottom: 10 }}>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
            <label>Data:
              <input type="date" value={data} onChange={(e)=>setData(e.target.value)} style={{ marginLeft: 6 }} />
            </label>
            <input
              placeholder="Buscar produto..."
              value={busca}
              onChange={(e)=>setBusca(e.target.value)}
              style={{ flex: 1, minWidth: 240 }}
            />
            <div style={{ marginLeft: "auto", fontWeight: 800 }}>
              Total do dia: {money(totalGeral)}
            </div>
          </div>
        </div>

        {/* Tabela lista A–Z */}
        <section className="extrato-card">
          <h2 style={{ marginTop: 0 }}>Lista de Compras</h2>

          {/* container com rolagem (mantém até metade da tela) */}
          <div style={{
            maxHeight: "50vh",
            overflow: "auto",
            border: "1px solid #e6d2c2",
            borderRadius: 10
          }}>
            <table className="extrato">
              <thead>
                <tr>
                  <th style={{ minWidth: 220 }}>Produto</th>
                  <th style={{ minWidth: 100 }}>Qtd</th>
                  <th style={{ minWidth: 120 }}>Vlr unit</th>
                  <th className="th-right" style={{ minWidth: 120 }}>Vlr total</th>
                  <th style={{ minWidth: 80, textAlign: "center" }}>OK ✓</th>
                  <th style={{ minWidth: 90 }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtrados.map((p)=> {
                  const it = mapItens.get(p.id) || { qtd: 0, precoUnit: 0, total: 0, marcado: false };
                  return (
                    <tr key={p.id}>
                      <td>
                        <div style={{ fontWeight: 700 }}>{p.descricao}</div>
                        <div style={{ fontSize: 12, color: "#7a5a2a" }}>
                          Compra: {p.unidadeCompraPadrao} × {p.fatorCompraPadrao} • Estoque: {p.unidadeBase}
                        </div>
                      </td>
                      <td>
                        <input
                          type="number" min="0" step="0.01"
                          value={it.qtd || ""}
                          onChange={(e)=>onChangeQtd(p, e.target.value)}
                          style={{ width: 100 }}
                          inputMode="decimal"
                        />
                      </td>
                      <td>
                        <input
                          type="number" min="0" step="0.01"
                          value={it.precoUnit || ""}
                          onChange={(e)=>onChangePreco(p, e.target.value)}
                          style={{ width: 120 }}
                          inputMode="decimal"
                        />
                      </td>
                      <td className="valor-cell">{money(it.total || 0)}</td>
                      <td style={{ textAlign: "center" }}>
                        <input
                          type="checkbox"
                          checked={!!it.marcado}
                          onChange={(e)=>onToggleCheck(p, e.target.checked)}
                          title="Ao marcar ✓, lança ENTRADA no estoque (converte pela unidade/fator)"
                        />
                      </td>
                      <td>
                        <button className="btn-acao btn-danger" onClick={()=>onLimparItem(p)}>Limpar</button>
                      </td>
                    </tr>
                  );
                })}
                {filtrados.length === 0 && (
                  <tr><td colSpan={6} style={{ padding: 12, color: "#7a5a2a" }}>Nenhum produto.</td></tr>
                )}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={3} style={{ textAlign: "right", fontWeight: 800 }}>TOTAL</td>
                  <td className="valor-cell" style={{ fontWeight: 900 }}>{money(totalGeral)}</td>
                  <td colSpan={2}></td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div style={{ marginTop: 10, color: "#7a5a2a" }}>
            • A lista é salva automaticamente por <b>data</b>.  
            • O ✓ lança a <b>Entrada no Estoque</b> (qtd × fator da unidade de compra) e atualiza o <b>custo médio</b>.  
            • Você pode mudar a data a qualquer momento para ver/lançar outro dia.
          </div>
        </section>

        <button className="btn-voltar" onClick={() => setTela?.("HomeERP")}>Voltar</button>
      </main>
      <ERPFooter onBack={() => setTela?.("HomeERP")} />
    </>
  );
                    }

import React, { useState, useEffect } from "react";
import {
  collection,
  addDoc,
  query,
  serverTimestamp,
  onSnapshot,
  orderBy,
} from "firebase/firestore";
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";
import db from "../firebase";
import "./LanPed.css";

export default function LanPed({ setTela }) {
  // ─── STATES PARA O FORMULÁRIO ─────────────────────
  const [cidade, setCidade] = useState("");
  const [pdv, setPdv] = useState("");
  const [produto, setProduto] = useState("");
  const [quantidade, setQuantidade] = useState(1);
  const [valorUnitario, setValorUnitario] = useState("");
  const [formaPagamento, setFormaPagamento] = useState("");
  const [dataVencimento, setDataVencimento] = useState("");
  const [itens, setItens] = useState([]);
  const [totalPedido, setTotalPedido] = useState("0.00");
  const [arquivoNF, setArquivoNF] = useState(null);
  const [arquivoBoleto, setArquivoBoleto] = useState(null);

  // ─── DADOS FIXOS ───────────────────────────────────
  const cidades = ["Gravatá", "Recife", "Caruaru"];
  const pdvsPorCidade = {
    Gravatá: ["Pequeno Príncipe", "Salesianas", "Céu Azul", "Russas", "Bora Gastar", "Kaduh", "Society Show", "Degusty"],
    Recife: ["Tio Valter", "Vera Cruz", "Pinheiros", "Dourado", "BMQ", "CFC", "Madre de Deus", "Saber Viver"],
    Caruaru: ["Interativo", "Exato Sede", "Exato Anexo", "Sesi", "Motivo", "Jesus Salvador"],
  };
  const produtos = ["BRW 7x7", "BRW 6x6", "PKT 5x5", "PKT 6x6", "Esc", "DUDU"];
  const formasPagamento = ["PIX", "Espécie", "Cartão", "Boleto"];

  // ─── CÁLCULO DE TOTAL ───────────────────────────────
  useEffect(() => {
    const total = quantidade * parseFloat(valorUnitario || 0);
    setTotalPedido(total.toFixed(2));
  }, [quantidade, valorUnitario]);

  // ─── ADICIONAR ITEM ────────────────────────────────
  function adicionarItem() {
    if (!produto || quantidade <= 0 || !valorUnitario) {
      alert("Preencha produto, quantidade e valor unitário.");
      return;
    }
    setItens(old => [
      ...old,
      {
        produto,
        quantidade,
        valorUnitario,
        totalItem: (quantidade * parseFloat(valorUnitario)).toFixed(2)
      },
    ]);
    setProduto("");
    setQuantidade(1);
    setValorUnitario("");
  }

  // ─── UPLOAD DE ARQUIVOS ────────────────────────────
  const storage = getStorage();
  async function uploadArquivo(file, pasta) {
    if (!file) return null;
    const ext = file.name.split(".").pop();
    const name = `${pasta}/${Date.now()}.${ext}`;
    const ref = storageRef(storage, name);
    await uploadBytes(ref, file);
    return getDownloadURL(ref);
  }

  // ─── SALVAR NO FIRESTORE ──────────────────────────
  async function handleSalvar() {
    if (!cidade || !pdv || itens.length === 0 || !formaPagamento) {
      alert("Preencha todos os campos obrigatórios.");
      return;
    }

    const urlNF = await uploadArquivo(arquivoNF, "notas");
    const urlBoleto = await uploadArquivo(arquivoBoleto, "boletos");

    const novo = {
      cidade,
      escola: pdv,
      itens,
      formaPagamento,
      dataVencimento: dataVencimento || null,
      total: parseFloat(totalPedido),
      statusEtapa: "Lançado",
      criadoEm: serverTimestamp(),
      notaFiscalUrl: urlNF,
      boletoUrl: urlBoleto,
    };

    try {
      await addDoc(collection(db, "PEDIDOS"), novo);
      alert("✅ Pedido salvo com sucesso!");
      // reset
      setCidade("");
      setPdv("");
      setItens([]);
      setFormaPagamento("");
      setDataVencimento("");
      setTotalPedido("0.00");
      setArquivoNF(null);
      setArquivoBoleto(null);
    } catch (e) {
      console.error(e);
      alert("❌ Falha ao salvar pedido.");
    }
  }

  // ─── LISTENERS PARA STATUS POR PDV ──────────────────
  const [statusPorPdv, setStatusPorPdv] = useState({});
  useEffect(() => {
    const ref = collection(db, "PEDIDOS");
    const q = query(ref, orderBy("criadoEm", "asc"));
    const unsub = onSnapshot(q, snap => {
      const m = {};
      snap.docs.forEach(doc => {
        const d = doc.data();
        if (d.escola) m[d.escola] = d.statusEtapa;
      });
      setStatusPorPdv(m);
    });
    return () => unsub();
  }, []);

  return (
    <div className="lanped-container">
      {/* Voltar em tamanho reduzido */}
      <button className="botao-voltar" onClick={() => setTela("HomePCP")}>
        🔙<br/>Voltar
      </button>

      {/* Cabeçalho copiado de ERP/PCP */}
      <header className="homepcp-header">
        <img src="/LogomarcaDDnt2025Vazado.png" alt="Logo Dudunitê" className="logo-pcp" />
        <h1 className="homepcp-titulo">Lançar Pedido</h1>
      </header>

      {/* Formulário dividido em quadrantes translúcidos */}
      <div className="lanped-formulario">
        <div className="quadrante">
          <label>Cidade</label>
          <select value={cidade} onChange={e => { setCidade(e.target.value); setPdv(""); }}>
            <option value="">Selecione</option>
            {cidades.map(c => <option key={c} value={c}>{c}</option>)}
          </select>

          <label>Ponto de Venda</label>
          <select value={pdv} onChange={e => setPdv(e.target.value)} disabled={!cidade}>
            <option value="">Selecione</option>
            {cidade && pdvsPorCidade[cidade].map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>

        <div className="quadrante">
          <label>Produto</label>
          <select value={produto} onChange={e => setProduto(e.target.value)}>
            <option value="">Selecione</option>
            {produtos.map(p => <option key={p} value={p}>{p}</option>)}
          </select>

          <label>Quantidade</label>
          <input type="number" value={quantidade} onChange={e => setQuantidade(Number(e.target.value))} />

          <label>Valor Unitário</label>
          <input type="number" step="0.01" value={valorUnitario} onChange={e => setValorUnitario(e.target.value)} />

          <button className="botao-adicionar" onClick={adicionarItem}>➕ Adicionar Item</button>
        </div>

        <div className="quadrante">
          {itens.length > 0 && (
            <ul className="lista-itens">
              {itens.map((it, i) => (
                <li key={i}>
                  {it.quantidade}× {it.produto} — R$ {it.valorUnitario} (R$ {it.totalItem})
                  <button className="botao-excluir" onClick={() => setItens(itens.filter((_, j) => j !== i))}>✖</button>
                </li>
              ))}
            </ul>
          )}

          <div className="total-pedido">
            <strong>Total:</strong> R$ {totalPedido}
          </div>
        </div>

        <div className="quadrante">
          <label>Forma de Pagamento</label>
          <select value={formaPagamento} onChange={e => setFormaPagamento(e.target.value)}>
            <option value="">Selecione</option>
            {formasPagamento.map(f => <option key={f} value={f}>{f}</option>)}
          </select>

          {formaPagamento === "Boleto" && (
            <>
              <label>Anexar Nota Fiscal</label>
              <input type="file" accept=".pdf,.jpg,.png" onChange={e => setArquivoNF(e.target.files[0])} />

              <label>Anexar Boleto</label>
              <input type="file" accept=".pdf,.jpg,.png" onChange={e => setArquivoBoleto(e.target.files[0])} />
            </>
          )}

          <label>Data de Vencimento</label>
          <input type="date" value={dataVencimento} onChange={e => setDataVencimento(e.target.value)} />

          <button className="botao-salvar" onClick={handleSalvar}>💾 Salvar Pedido</button>
        </div>
      </div>

      {/* Rodapé dinâmico com todos os PDVs e seus status */}
      <footer className="lanped-footer">
        <div className="lista-escolas-marquee">
          <span className="marquee-content">
            {Object.values(pdvsPorCidade).flat().map((p, i, arr) => (
              <React.Fragment key={p}>
                • {p}{i < arr.length - 1 ? " " : ""}
              </React.Fragment>
            ))}
          </span>
        </div>
        <div className="status-pdvs">
          {Object.entries(statusPorPdv).map(([p, s]) => (
            <span key={p} className="status-item">{p}: <strong>{s}</strong></span>
          ))}
        </div>
      </footer>
    </div>
  );
}

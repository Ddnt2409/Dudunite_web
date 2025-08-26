// Lançamento AVULSO => nasce REALIZADO em CAIXA DIARIO
import React, { useState } from "react";
import { lancamentoAvulso } from "../util/cr_dataStub";

export default function CtsReceberAvulso({ planoContas }) {
  const [cidade, setCidade] = useState("Gravatá");   // <- padrão
  const [pdv, setPdv] = useState("");
  const [produto, setProduto] = useState("");
  const [quantidade, setQuantidade] = useState(1);
  const [plano, setPlano] = useState("");
  const [forma, setForma] = useState("PIX");
  const [data, setData] = useState(() => new Date().toISOString().slice(0,10));
  const [valor, setValor] = useState("");
  const [okMsg, setOkMsg] = useState("");
  const [loading, setLoading] = useState(false);

  async function salvar() {
    if (!valor || !plano || !forma) {
      alert("Informe Valor, Plano de Contas e Forma de Pagamento.");
      return;
    }
    setLoading(true);
    setOkMsg("");
    try {
      await lancamentoAvulso({
        cidade, pdv, produto, quantidade,
        canal: "varejo",
        planoContas: plano,
        formaPagamento: forma,
        situacao: "Realizado",               // AVULSO nasce REALIZADO
        dataLancamento: new Date(data),
        dataPrevista: new Date(data),        // aparece no extrato geral
        valorUnit: Number(valor || 0)
      });
      setOkMsg("Avulso lançado (stub) como Realizado em CAIXA DIARIO.");
      setPdv(""); setProduto(""); setQuantidade(1);
      setPlano(""); setForma("PIX"); setValor("");
      // cidade mantém "Gravatá"
    } catch (e) {
      alert("Erro ao salvar: " + (e?.message || e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ display:"grid", gap:12 }}>
      {/* Linha 1 */}
      <div className="linha-add">
        <input placeholder="Cidade" value={cidade} onChange={e=>setCidade(e.target.value)} />
        <input className="qtd" placeholder="PDV (nome)" value={pdv} onChange={e=>setPdv(e.target.value)} />
        <input className="qtd" placeholder="Produto/Descrição" value={produto} onChange={e=>setProduto(e.target.value)} />
      </div>

      {/* Linha 2 */}
      <div className="linha-add">
        <select value={plano} onChange={e=>setPlano(e.target.value)}>
          <option value="">-- selecione plano de contas --</option>
          {planoContas.map(pc => (
            <option key={pc.id} value={pc.codigo || pc.id}>
              {(pc.codigo || pc.id) + " – " + (pc.descricao || "")}
            </option>
          ))}
        </select>

        <select className="qtd" value={forma} onChange={e=>setForma(e.target.value)}>
          <option>PIX</option><option>Especie</option>
          <option>Cartao</option><option>Link</option>
          <option>PDVDireto</option>
        </select>

        <input className="qtd" type="date" value={data} onChange={e=>setData(e.target.value)} />
      </div>

      {/* Linha 3 */}
      <div className="linha-add">
        <input className="qtd" type="number" min={1} placeholder="Quantidade" value={quantidade} onChange={e=>setQuantidade(e.target.value)} />
        <input className="qtd" type="number" step="0.01" placeholder="Valor" value={valor} onChange={e=>setValor(e.target.value)} />
        <div></div>
      </div>

      {/* Ações */}
      <div className="acoes">
        <button onClick={salvar} disabled={loading} className="btn-salvar">
          {loading ? "Salvando..." : "Salvar Avulso (Realizado)"}
        </button>
        <button className="btn-cancelar" onClick={()=>{
          setPdv(""); setProduto(""); setQuantidade(1);
          setPlano(""); setForma("PIX"); setValor("");
        }}>
          Limpar
        </button>
      </div>

      {okMsg && <div style={{ color:"green", fontWeight:800 }}>{okMsg}</div>}

      <div style={{ marginTop:8, color:"#7b3c21", fontWeight:700 }}>
        Conta: CAIXA DIARIO • Status: REALIZADO
      </div>
    </div>
  );
}

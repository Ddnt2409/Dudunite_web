// src/pages/CtsReceberAvulso.jsx
import React, { useState } from "react";
import { corFundo, corTerracota, CANAIS, SITUACAO, RECUR, toNumber } from "../util/cr_helpers";

export default function CtsReceberAvulso({ onVoltar, planoContas }) {
  const [cidade, setCidade] = useState("");
  const [pdv, setPdv] = useState("Varejo");
  const [produto, setProduto] = useState("");
  const [quantidade, setQuantidade] = useState(1);
  const [canal, setCanal] = useState(CANAIS.VAREJO);
  const [plano, setPlano] = useState("");
  const [forma, setForma] = useState("PIX");
  const [situacao, setSituacao] = useState(SITUACAO.REALIZADO);
  const [recorrencia, setRecorrencia] = useState(RECUR.ISOLADO);
  const [repeticoes, setRepeticoes] = useState(1);
  const [dataLanc, setDataLanc] = useState(() => new Date().toISOString().slice(0, 10));
  const [dataPrev, setDataPrev] = useState(() => new Date().toISOString().slice(0, 10));
  const [valorUnit, setValorUnit] = useState(0);

  function handleSalvar() {
    alert("Stub: salvar será habilitado na etapa Firestore.");
  }

  return (
    <div style={{ minHeight: "100vh", background: corFundo, padding: 16 }}>
      <h2 style={{ color: corTerracota, fontWeight: 800, marginBottom: 8 }}>Lançamento Avulso</h2>

      <div style={{ display: "grid", gap: 8 }}>
        <input placeholder="Cidade" value={cidade} onChange={e => setCidade(e.target.value)} />
        <input placeholder="PDV (nome)" value={pdv} onChange={e => setPdv(e.target.value)} />
        <input placeholder="Produto" value={produto} onChange={e => setProduto(e.target.value)} />
        <input type="number" placeholder="Quantidade" value={quantidade} onChange={e => setQuantidade(e.target.value)} />

        <label>Canal:&nbsp;
          <select value={canal} onChange={e => setCanal(e.target.value)}>
            <option value={CANAIS.REVENDA}>Revenda</option>
            <option value={CANAIS.VAREJO}>Varejo</option>
          </select>
        </label>

        <label>Plano de Contas:&nbsp;
          <select value={plano} onChange={e => setPlano(e.target.value)}>
            <option value="">-- selecione --</option>
            {planoContas.map(pc => (
              <option key={pc.id} value={pc.codigo || pc.id}>
                {(pc.codigo || pc.id) + " – " + (pc.descricao || "")}
              </option>
            ))}
          </select>
        </label>

        <label>Forma de pagamento:&nbsp;
          <select value={forma} onChange={e => setForma(e.target.value)}>
            <option>PIX</option><option>Especie</option>
            <option>Cartao</option><option>Link</option>
            <option>PDVDireto</option>
          </select>
        </label>

        <label>Situação:&nbsp;
          <select value={situacao} onChange={e => setSituacao(e.target.value)}>
            <option>{SITUACAO.REALIZADO}</option>
            <option>{SITUACAO.PREVISTO}</option>
          </select>
        </label>

        <label>Recorrência:&nbsp;
          <select value={recorrencia} onChange={e => setRecorrencia(e.target.value)}>
            <option>{RECUR.ISOLADO}</option>
            <option>{RECUR.SEMANAL}</option>
            <option>{RECUR.QUINZENAL}</option>
            <option>{RECUR.MENSAL}</option>
          </select>
        </label>

        <input type="number" min={1} value={repeticoes} onChange={e => setRepeticoes(e.target.value)} placeholder="Repetições (>=1)" />

        <label>Data de Lançamento:&nbsp;
          <input type="date" value={dataLanc} onChange={e => setDataLanc(e.target.value)} />
        </label>

        <label>Data Prevista:&nbsp;
          <input type="date" value={dataPrev} onChange={e => setDataPrev(e.target.value)} />
        </label>

        <label>Valor Unitário:&nbsp;
          <input type="number" value={valorUnit} onChange={e => setValorUnit(e.target.value)} />
        </label>

        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={onVoltar}>Voltar</button>
          <button onClick={handleSalvar}>Salvar (stub)</button>
        </div>
      </div>
    </div>
  );
}

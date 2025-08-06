import React, { useState, useEffect } from 'react';
import './LanPed.css';

const cidades = {
  Gravatá: ['Pequeno Príncipe','Salesianas','Céu Azul','Russas','Bora Gastar','Kaduh','Society Show','Degusty'],
  Recife:  ['Tio Valter','Vera Cruz','Pinheiros','Dourado','BMQ','CFC','Madre de Deus','Saber Viver'],
  Caruaru:['Interativo','Exato Sede','Exato Anexo','Sesi','Motivo','Jesus Salvador']
};
const produtos = ['BRW 7x7','BRW 6x6','PKT 5x5','PKT 6x6','Esc','Dudu'];

export default function LanPed({ setTela }) {
  const [cidade, setCidade] = useState('');
  const [escola, setEscola] = useState('');
  const [dataV, setDataV] = useState('');
  const [forma, setForma] = useState('');
  const [produto, setProduto] = useState('');
  const [quant, setQuant] = useState(1);
  const [valor, setValor] = useState('');
  const [itens, setItens] = useState([]);

  function adicionarItem() {
    if (!produto||!quant||!valor) return alert('Preencha produto, quantidade e valor.');
    setItens(prev => [...prev,{produto,quant,valor}]);
    setProduto(''); setQuant(1); setValor('');
  }

  function salvarPedido() {
    // aqui você envia ao Firestore...
    alert('✅ Pedido salvo!');
    setItens([]);
  }

  return (
    <div className="lanped-container">
      {/* HEADER */}
      <header className="lanped-header">
        <img src="/LogomarcaDDnt2025Vazado.png" alt="Logo" className="lanped-logo" />
        <h1 className="lanped-title">Lançar Pedido</h1>
      </header>

      {/* FORMULÁRIO */}
      <div className="lanped-form">
        <label>Cidade</label>
        <select value={cidade} onChange={e=>{setCidade(e.target.value); setEscola('');}}>
          <option value="">Selecione</option>
          {Object.keys(cidades).map(c=> <option key={c} value={c}>{c}</option>)}
        </select>

        <label>Escola</label>
        <select value={escola} onChange={e=>setEscola(e.target.value)} disabled={!cidade}>
          <option value="">Selecione</option>
          {cidade && cidades[cidade].map(e=> <option key={e} value={e}>{e}</option>)}
        </select>

        <label>Vencimento</label>
        <input type="date" value={dataV} onChange={e=>setDataV(e.target.value)} />

        <label>Forma de Pagamento</label>
        <select value={forma} onChange={e=>setForma(e.target.value)}>
          <option value="">Selecione</option>
          <option>PIX</option><option>Espécie</option><option>Boleto</option>
        </select>

        <label>Produto</label>
        <select value={produto} onChange={e=>setProduto(e.target.value)}>
          <option value="">Selecione</option>
          {produtos.map(p=> <option key={p} value={p}>{p}</option>)}
        </select>

        <label>Quantidade</label>
        <input type="number" min="1" value={quant} onChange={e=>setQuant(Number(e.target.value))} />

        <label>Valor Unit.</label>
        <input type="number" min="0" step="0.01" value={valor} onChange={e=>setValor(e.target.value)} />

        <button onClick={adicionarItem}>➕ Adicionar Item</button>
      </div>

      {/* LISTA DE ITENS */}
      {itens.length > 0 && (
        <div className="lanped-itens">
          <h2>Itens do Pedido</h2>
          <ul>
            {itens.map((it,i)=>(
              <li key={i}>{it.quant}x {it.produto} – R$ {Number(it.valor).toFixed(2)}</li>
            ))}
          </ul>
          <button className="lanped-save" onClick={salvarPedido}>
            💾 Salvar Pedido
          </button>
        </div>
      )}

      {/* BOTÃO VOLTAR */}
      <button className="botao-voltar" onClick={()=>setTela('PCP')}>
        🔙 Voltar para PCP
      </button>

      {/* RODAPÉ */}
      <footer className="lanped-footer">
        <marquee behavior="scroll" direction="left">
          • Pequeno Príncipe • Salesianas • Céu Azul • Russas • Bora Gastar • Kaduh • Society Show •
          Degusty • Tio Valter • Vera Cruz • Pinheiros • Dourado • BMQ • CFC • Madre de Deus • Saber Viver •
          Interativo • Exato Sede • Exato Anexo • Sesi • Motivo • Jesus Salvador
        </marquee>
      </footer>
    </div>
    }

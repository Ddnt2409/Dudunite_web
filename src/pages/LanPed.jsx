import React, { useState, useEffect } from 'react';
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  serverTimestamp
} from 'firebase/firestore';
import db from '../firebase';
import './LanPed.css';

export default function LanPed({ setTela }) {
  const [cidade, setCidade] = useState('');
  const [escola, setEscola] = useState('');
  const [produto, setProduto] = useState('');
  const [sabor, setSabor] = useState('');
  const [quantidade, setQuantidade] = useState(1);
  const [itens, setItens] = useState([]);
  const [pedidosLancados, setPedidosLancados] = useState([]);
  const [tabelaPreco, setTabelaPreco] = useState([]);
  const [formasPagamento, setFormasPagamento] = useState([]);

  const cidades = ['Gravatá', 'Recife', 'Caruaru'];
  const escolasPorCidade = {
    Gravatá: ['Pequeno Príncipe','Salesianas','Céu Azul','Russas','Bora Gastar','Kaduh','Society Show','Degusty'],
    Recife:  ['Tio Valter','Vera Cruz','Pinheiros','Dourado','BMQ','CFC','Madre de Deus','Saber Viver'],
    Caruaru:['Interativo','Exato Sede','Exato Anexo','Sesi','Motivo','Jesus Salvador']
  };
  const produtos = ['BRW 7x7','BRW 6x6','PKT 5x5','PKT 6x6','Esc','Dudu'];

  useEffect(() => {
    carregarPedidos();
    carregarTabelaPreco();
    setFormasPagamento(['PIX','Espécie','Boleto']);
  }, []);

  const carregarPedidos = async () => {
    const q = query(collection(db, 'PEDIDOS'), where('statusEtapa','==','Lançado'));
    const snap = await getDocs(q);
    setPedidosLancados(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  };

  const carregarTabelaPreco = async () => {
    const snap = await getDocs(collection(db, 'tabela_precos'));
    const precos = {};
    snap.forEach(d => {
      const data = d.data();
      precos[data.produto] = data.valorRevenda;
    });
    setTabelaPreco(precos);
  };

  const adicionarItem = () => {
    if (!produto || !quantidade) {
      alert('Preencha produto e quantidade');
      return;
    }
    setItens(prev => [
      ...prev,
      { produto, sabor, quantidade: Number(quantidade) }
    ]);
    setProduto(''); setSabor(''); setQuantidade(1);
  };

  const salvarPedido = async () => {
    if (!cidade || !escola || itens.length === 0) {
      alert('Preencha todos os campos antes de salvar.');
      return;
    }
    const total = itens.reduce((acc,i)=> acc + i.quantidade * (tabelaPreco[i.produto]||0),0);
    const novo = { cidade, escola, itens, total, statusEtapa:'Lançado', criadoEm: serverTimestamp() };
    await addDoc(collection(db,'PEDIDOS'), novo);
    alert('Pedido salvo com sucesso!');
    setTela('PCP');
  };

  const escolasFiltradas = cidade ? escolasPorCidade[cidade] : [];

  return (
    <div className="lanped-container">
      <header className="lanped-header">
        <img
          src="/LogomarcaDDnt2025Vazado.png"
          alt="Logo Dudunitê"
          className="lanped-logo"
        />
        <h1 className="lanped-titulo">Lançar Pedido – Dudunitê</h1>
      </header>

      <main className="lanped-main">
        <div className="form-group">
          <label>Cidade</label>
          <select value={cidade} onChange={e => setCidade(e.target.value)}>
            <option value="">Selecione</option>
            {cidades.map(c=> <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div className="form-group">
          <label>Escola</label>
          <select value={escola} onChange={e => setEscola(e.target.value)}>
            <option value="">Selecione</option>
            {escolasFiltradas.map(s=> <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <div className="form-group">
          <label>Produto</label>
          <select value={produto} onChange={e => setProduto(e.target.value)}>
            <option value="">Selecione</option>
            {produtos.map(p=> <option key={p} value={p}>{p}</option>)}
          </select>
        </div>

        <div className="form-group">
          <label>Sabor</label>
          <input
            type="text"
            value={sabor}
            onChange={e => setSabor(e.target.value)}
            placeholder="Digite o sabor"
          />
        </div>

        <div className="form-group quantidade-group">
          <label>Quantidade</label>
          <input
            type="number"
            min="1"
            value={quantidade}
            onChange={e => setQuantidade(e.target.value)}
          />
        </div>

        <button className="botao-adicionar" onClick={adicionarItem}>
          ➕ Adicionar Item
        </button>

        {itens.length > 0 && (
          <ul className="lista-itens">
            {itens.map((item,i)=>(
              <li key={i}>
                {item.quantidade}x {item.produto} – {item.sabor}
              </li>
            ))}
          </ul>
        )}

        <button className="botao-salvar" onClick={salvarPedido}>
          💾 Salvar Pedido
        </button>
      </main>

      <button className="botao-voltar" onClick={() => setTela('PCP')}>
        🔙 Voltar para PCP
      </button>

      <footer className="lanped-footer">
        <marquee behavior="scroll" direction="left">
          • Pequeno Príncipe • Salesianas • Céu Azul • Russas • Bora Gastar •
          Kaduh • Society Show • Degusty • Tio Valter • Vera Cruz • Pinheiros •
          Dourado • BMQ • CFC • Madre de Deus • Saber Viver • Interativo •
          Exato Sede • Exato Anexo • Sesi • Motivo • Jesus Salvador
        </marquee>
      </footer>
    </div>
  );
}

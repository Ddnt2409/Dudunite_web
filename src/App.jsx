import React, { useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import { collection, addDoc, serverTimestamp, getDocs, query, where, Timestamp } from "firebase/firestore";
import db from './firebase';

const App = () => {
  const [cidade, setCidade] = useState('');
  const [escola, setEscola] = useState('');
  const [produto, setProduto] = useState('');
  const [sabor, setSabor] = useState('');
  const [quantidade, setQuantidade] = useState(1);
  const [itens, setItens] = useState([]);
  const [pedidos, setPedidos] = useState([]);
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');

  const dados = {
    "Recife": ["Tio Valter", "Vera Cruz", "Pinheiros", "BMQ", "Dourado", "CFC", "Madre de Deus", "Saber Viver", "Anita Garibaldi"],
    "Caruaru": ["Interativo", "Exato 1", "Exato 2", "SESI", "Motivo"],
    "Gravatá": ["Russas", "Salesianas", "Pequeno Príncipe", "Céu Azul"]
  };

  const saboresPadrao = [
    "Ninho com nutella",
    "Ninho",
    "Brig bco",
    "Brig pto",
    "Brig pto confete",
    "Brig bco confete",
    "Oreo",
    "Ovomaltine",
    "Bem casado",
    "Palha italiana",
    "Cr maracujá"
  ];

  const produtos = {
    "BRW 7x7": saboresPadrao,
    "BRW 6x6": saboresPadrao,
    "ESC": saboresPadrao,
    "PKT 5x5": saboresPadrao,
    "PKT 6x6": saboresPadrao,
    "DUDU": saboresPadrao
  };

  const adicionarItem = () => {
    if (produto && sabor && quantidade > 0) {
      setItens([...itens, { produto, sabor, quantidade: Number(quantidade) }]);
      setSabor('');
      setQuantidade(1);
    }
  };

  const salvarPedido = async () => {
    if (!cidade || !escola || itens.length === 0) {
      alert('Preencha todos os campos antes de salvar.');
      return;
    }

    const agora = new Date();

    const novoPedido = {
      cidade,
      escola,
      itens,
      data: agora.toISOString(),
      dataServidor: serverTimestamp()
    };

    try {
      await addDoc(collection(db, "pedidos"), novoPedido);
      setPedidos([...pedidos, novoPedido]);

      setCidade('');
      setEscola('');
      setProduto('');
      setSabor('');
      setQuantidade(1);
      setItens([]);
      alert('✅ Pedido salvo no Firestore!');
    } catch (error) {
      console.error("Erro ao salvar no Firestore:", error);
      alert('❌ Falha ao salvar no Firestore. Verifique o console.');
    }
  };

  const carregarPedidos = async () => {
    try {
      const pedidosRef = collection(db, "pedidos");
      let q = pedidosRef;

      if (dataInicio && dataFim) {
        const inicio = Timestamp.fromDate(new Date(dataInicio + "T00:00:00"));
        const fim = Timestamp.fromDate(new Date(dataFim + "T23:59:59"));
        q = query(pedidosRef, where("dataServidor", ">=", inicio), where("dataServidor", "<=", fim));
      }

      const snapshot = await getDocs(q);
      const lista = snapshot.docs.map(doc => doc.data());
      setPedidos(lista);
    } catch (e) {
      console.error("Erro ao carregar pedidos:", e);
    }
  };

  const gerarPDF = () => {
    const doc = new jsPDF();
    let y = 10;

    const agora = new Date();
    const dia = String(agora.getDate()).padStart(2, '0');
    const mes = String(agora.getMonth() + 1).padStart(2, '0');
    const ano = agora.getFullYear();
    const hora = String(agora.getHours()).padStart(2, '0');
    const minuto = String(agora.getMinutes()).padStart(2, '0');
    const nomePDF = `planejamento-${dia}-${mes}-${ano}-${hora}h${minuto}.pdf`;

    doc.setFont('courier', 'normal');
    doc.setFontSize(10);
    doc.text('Planejamento de Produção - Dudunitê', 10, y);
    y += 10;

    if (dataInicio && dataFim) {
      doc.text(`📆 Período: ${dataInicio.split('-').reverse().join('/')} a ${dataFim.split('-').reverse().join('/')}`, 10, y);
      y += 10;
    }

    const agrupado = {};
    const totalPorCidade = {};
    const totalGeral = {};

    pedidos.forEach(({ cidade, escola, itens }) => {
      if (!agrupado[cidade]) agrupado[cidade] = {};
      if (!agrupado[cidade][escola]) agrupado[cidade][escola] = {};

      itens.forEach(({ produto, sabor, quantidade }) => {
        if (!agrupado[cidade][escola][produto]) agrupado[cidade][escola][produto] = {};
        if (!agrupado[cidade][escola][produto][sabor]) agrupado[cidade][escola][produto][sabor] = 0;
        agrupado[cidade][escola][produto][sabor] += quantidade;

        totalPorCidade[cidade] = totalPorCidade[cidade] || {};
        totalPorCidade[cidade][produto] = (totalPorCidade[cidade][produto] || 0) + quantidade;
        totalGeral[produto] = (totalGeral[produto] || 0) + quantidade;
      });
    });

    const addLine = (text) => {
      if (y > 270) {
        doc.addPage();
        y = 10;
      }
      doc.text(text, 10, y);
      y += 6;
    };

    Object.entries(agrupado).forEach(([cidade, escolas]) => {
      addLine(`Cidade: ${cidade}`);
      Object.entries(escolas).forEach(([escola, produtos]) => {
        addLine(` Escola: ${escola}`);
        let totalEscola = 0;

        Object.entries(produtos).forEach(([produto, sabores]) => {
          const totalProduto = Object.values(sabores).reduce((a, b) => a + b, 0);
          addLine(`\n ${produto} — Total: ${totalProduto} un`);
          totalEscola += totalProduto;

          addLine(` Sabor             | Quantidade`);
          addLine(` ------------------|-----------`);
          Object.entries(sabores).forEach(([sabor, qtd]) => {
            const linha = ` ${sabor.padEnd(18)}| ${String(qtd).padStart(3)} un`;
            addLine(linha);
          });
          addLine('');
        });

        addLine(`➡️ Total da escola: ${totalEscola} un\n`);
      });

      addLine(` Total da cidade ${cidade}:`);
      Object.entries(totalPorCidade[cidade]).forEach(([produto, qtd]) => {
        addLine(` ${produto.padEnd(10)}: ${qtd} un`);
      });

      addLine('\n');
    });

    addLine(`TOTAL GERAL DE TODOS OS PRODUTOS:`);
    Object.entries(totalGeral).forEach(([produto, qtd]) => {
      addLine(` ${produto.padEnd(10)}: ${qtd} un`);
    });

    y += 10;
    addLine(`📄 Gerado em ${dia}/${mes}/${ano} às ${hora}h${minuto}`);

    doc.save(nomePDF);
  };

  const totalItens = itens.reduce((soma, item) => soma + item.quantidade, 0);

  return (
    <div className="max-w-3xl mx-auto p-4 bg-[#fff5ec] min-h-screen">
      <h1 className="text-xl font-bold mb-4 text-center text-[#8c3b1b]">Lançamento de Pedidos - Dudunitê</h1>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label>Cidade</label>
          <select className="w-full border p-1" value={cidade} onChange={e => { setCidade(e.target.value); setEscola(''); }}>
            <option value="">Selecione</option>
            {Object.keys(dados).map(c => <option key={c}>{c}</option>)}
          </select>
        </div>

        <div>
          <label>Escola</label>
          <select className="w-full border p-1" value={escola} onChange={e => setEscola(e.target.value)} disabled={!cidade}>
            <option value="">Selecione</option>
            {cidade && dados[cidade].map(e => <option key={e}>{e}</option>)}
          </select>
        </div>

        <div>
          <label>Produto</label>
          <select className="w-full border p-1" value={produto} onChange={e => { setProduto(e.target.value); setSabor(''); }}>
            <option value="">Selecione</option>
            {Object.keys(produtos).map(p => <option key={p}>{p}</option>)}
          </select>
        </div>

        <div>
          <label>Sabor</label>
          <select className="w-full border p-1" value={sabor} onChange={e => setSabor(e.target.value)} disabled={!produto}>
            <option value="">Selecione</option>
            {produto && produtos[produto].map(s => <option key={s}>{s}</option>)}
          </select>
        </div>

        <div>
          <label>Quantidade</label>
          <input type="number" min="1" className="w-full border p-1" value={quantidade} onChange={e => setQuantidade(e.target.value)} />
        </div>

        <div className="flex items-end">
          <button onClick={adicionarItem} className="bg-[#a84d2a] text-white px-4 py-2 rounded">+ Adicionar</button>
        </div>
      </div>

      <div className="mt-4">
        <h2 className="font-bold">Itens do Pedido (Total: {totalItens} un):</h2>
        {itens.length === 0 ? (
          <p className="text-sm text-gray-500">Nenhum item adicionado.</p>
        ) : (
          <ul className="list-disc pl-5">
            {itens.map((item, i) => (
              <li key={i}>{item.produto} - {item.sabor} - {item.quantidade} un</li>
            ))}
          </ul>
        )}
      </div>

      <div className="mt-4 flex gap-4">
        <button onClick={salvarPedido} className="bg-blue-600 text-white px-4 py-2 rounded">Salvar Pedido</button>
        <button onClick={gerarPDF} disabled={pedidos.length === 0} className="bg-purple-600 text-white px-4 py-2 rounded">Gerar PDF Produção</button>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4">
        <div>
          <label>Data início</label>
          <input type="date" className="w-full border p-1" value={dataInicio} onChange={e => setDataInicio(e.target.value)} />
        </div>

        <div>
          <label>Data fim</label>
          <input type="date" className="w-full border p-1" value={dataFim} onChange={e => setDataFim(e.target.value)} />
        </div>

        <div className="col-span-2">
          <button onClick={carregarPedidos} className="bg-green-600 text-white px-4 py-2 rounded w-full">🔍 Filtrar Pedidos</button>
        </div>
      </div>

      <div className="mt-6">
        <h2 className="font-bold">Pedidos Filtrados:</h2>
        <ul className="text-sm text-gray-700">
          {pedidos.map((p, i) => (
            <li key={i}>📌 {p.cidade} - {p.escola} ({p.itens.length} itens)</li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default App;

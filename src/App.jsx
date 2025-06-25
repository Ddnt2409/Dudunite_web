import React, { useState } from 'react';
import jsPDF from 'jspdf';

const App = () => {
  const [cidade, setCidade] = useState('');
  const [escola, setEscola] = useState('');
  const [produto, setProduto] = useState('');
  const [sabor, setSabor] = useState('');
  const [quantidade, setQuantidade] = useState(1);
  const [itens, setItens] = useState([]);
  const [pedidos, setPedidos] = useState([]);

  const dados = {
    'Gravatá': ['Escola Estadual A', 'Escola Estadual B'],
    'Bezerros': ['Escola Municipal X', 'Escola Municipal Y']
  };

  const produtos = {
    Brownie: ['Chocolate', 'Doce de Leite', 'Morango'],
    Pocket: ['Frango', 'Carne', 'Queijo'],
    Escondidinho: ['Carne Seca', 'Frango', 'Vegetariano']
  };

  const adicionarItem = () => {
    if (produto && sabor && quantidade > 0) {
      setItens([...itens, { produto, sabor, quantidade: Number(quantidade) }]);
      setProduto('');
      setSabor('');
      setQuantidade(1);
    }
  };

  const salvarPedido = () => {
    if (!cidade || !escola || itens.length === 0) return alert('Preencha todos os campos.');

    const hoje = new Date();
    const cincoDiasAtras = new Date();
    cincoDiasAtras.setDate(hoje.getDate() - 5);

    const indice = pedidos.findIndex(
      p =>
        p.cidade === cidade &&
        p.escola === escola &&
        new Date(p.data) >= cincoDiasAtras
    );

    if (indice !== -1) {
      const pedidosAtualizados = [...pedidos];
      pedidosAtualizados[indice].itens.push(...itens);
      setPedidos(pedidosAtualizados);
    } else {
      setPedidos([...pedidos, { cidade, escola, itens, data: hoje.toISOString() }]);
    }

    setItens([]);
    setProduto('');
    setSabor('');
    setQuantidade(1);
    setCidade('');
    setEscola('');
    alert('Pedido salvo com sucesso!');
  };

  const gerarPDF = () => {
    const doc = new jsPDF();
    let y = 10;

    doc.setFontSize(16);
    doc.text('Planejamento da Produção - Dudunitê', 10, y);
    y += 10;

    const agrupado = {};

    pedidos.forEach(({ cidade, escola, itens }) => {
      if (!agrupado[cidade]) agrupado[cidade] = {};
      if (!agrupado[cidade][escola]) agrupado[cidade][escola] = {};

      itens.forEach(({ produto, sabor, quantidade }) => {
        if (!agrupado[cidade][escola][produto]) agrupado[cidade][escola][produto] = {};
        if (!agrupado[cidade][escola][produto][sabor]) agrupado[cidade][escola][produto][sabor] = 0;
        agrupado[cidade][escola][produto][sabor] += quantidade;
      });
    });

    const totalPorCidade = {};
    const totalGeral = {};

    const addLine = (text) => {
      if (y > 280) {
        doc.addPage();
        y = 10;
      }
      doc.text(text, 10, y);
      y += 7;
    };

    Object.keys(agrupado).forEach(cidade => {
      addLine(`Cidade: ${cidade}`);
      totalPorCidade[cidade] = {};

      Object.keys(agrupado[cidade]).forEach(escola => {
        addLine(`  Escola: ${escola}`);
        let totalEscola = 0;

        Object.keys(agrupado[cidade][escola]).forEach(produto => {
          addLine(`    Produto: ${produto}`);
          let totalProdutoEscola = 0;

          Object.keys(agrupado[cidade][escola][produto]).forEach(sabor => {
            const qtd = agrupado[cidade][escola][produto][sabor];
            addLine(`      ${sabor}: ${qtd} un`);
            totalProdutoEscola += qtd;

            totalPorCidade[cidade][produto] = (totalPorCidade[cidade][produto] || 0) + qtd;
            totalGeral[produto] = (totalGeral[produto] || 0) + qtd;
          });

          addLine(`    Total ${produto} na escola: ${totalProdutoEscola} un`);
          totalEscola += totalProdutoEscola;
        });

        addLine(`  Total geral da escola ${escola}: ${totalEscola} un`);
        addLine('');
      });

      addLine(`Total da cidade ${cidade}:`);
      Object.entries(totalPorCidade[cidade]).forEach(([produto, qtd]) => {
        addLine(`  ${produto}: ${qtd} un`);
      });
      addLine('');
    });

    addLine('Total geral de todos os produtos:');
    Object.entries(totalGeral).forEach(([produto, qtd]) => {
      addLine(`  ${produto}: ${qtd} un`);
    });

    const agora = new Date();
    const nomePDF = `planejamento-producao-${agora.getDate()}-${agora.getMonth() + 1}-${agora.getFullYear()}-${agora.getHours()}h${agora.getMinutes()}.pdf`;

    const pdfBlob = doc.output('blob');
    const blobURL = URL.createObjectURL(pdfBlob);
    const link = document.createElement('a');
    link.href = blobURL;
    link.download = nomePDF;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(blobURL);
  };

  return (
    <div className="max-w-2xl mx-auto p-4 font-sans">
      <h1 className="text-2xl font-bold mb-4">Dudunitê - Lançamento de Pedidos</h1>

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
          <button onClick={adicionarItem} className="bg-green-600 text-white px-4 py-2 rounded">Adicionar Item</button>
        </div>
      </div>

      <div className="mt-4">
        <h2 className="font-bold">Itens do Pedido:</h2>
        {itens.length === 0 && <p className="text-sm text-gray-500">Nenhum item adicionado.</p>}
        <ul className="list-disc pl-5">
          {itens.map((item, i) => (
            <li key={i}>{item.produto} - {item.sabor} - {item.quantidade} un</li>
          ))}
        </ul>
      </div>

      <div className="mt-4 flex gap-4">
        <button onClick={salvarPedido} className="bg-blue-600 text-white px-4 py-2 rounded">Salvar Pedido</button>
        <button onClick={gerarPDF} disabled={pedidos.length === 0} className="bg-purple-600 text-white px-4 py-2 rounded">Gerar PDF Produção</button>
      </div>

      <div className="mt-6">
        <h2 className="font-bold">Pedidos Salvos:</h2>
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

import React, { useState } from 'react';
import jsPDF from 'jspdf';

const cidadesData = [
  { nome: 'Cidade A', escolas: ['Escola A1', 'Escola A2'] },
  { nome: 'Cidade B', escolas: ['Escola B1', 'Escola B2'] },
];

const produtosData = [
  { nome: 'Brownie', sabores: ['Chocolate', 'Nozes', 'Doce de Leite'] },
  { nome: 'Pocket', sabores: ['Carne', 'Frango', 'Vegetariano'] },
  { nome: 'Escondidinho', sabores: ['Carne', 'Frango', 'Vegetariano'] },
];

export default function App() {
  const [cidade, setCidade] = useState('');
  const [escola, setEscola] = useState('');
  const [produto, setProduto] = useState('');
  const [sabor, setSabor] = useState('');
  const [quantidade, setQuantidade] = useState(1);

  const [itens, setItens] = useState([]);
  const [pedidos, setPedidos] = useState([]);

  const adicionarItem = () => {
    if (!produto || !sabor || quantidade < 1) return;
    setItens([...itens, { produto, sabor, quantidade: Number(quantidade) }]);
    setProduto('');
    setSabor('');
    setQuantidade(1);
  };

  const salvarPedido = () => {
    if (!cidade || !escola || itens.length === 0) return;

    const hoje = new Date();
    const cincoDiasAtras = new Date(hoje);
    cincoDiasAtras.setDate(hoje.getDate() - 5);

    const indiceExistente = pedidos.findIndex(p =>
      p.escola === escola &&
      p.cidade === cidade &&
      new Date(p.data) >= cincoDiasAtras
    );

    const novoPedido = {
      cidade,
      escola,
      itens,
      data: hoje.toISOString()
    };

    if (indiceExistente !== -1) {
      const pedidosAtualizados = [...pedidos];
      pedidosAtualizados[indiceExistente].itens.push(...itens);
      setPedidos(pedidosAtualizados);
    } else {
      setPedidos([...pedidos, novoPedido]);
    }

    setItens([]);
    setCidade('');
    setEscola('');
    alert("Pedido salvo com sucesso!");
  };

  const gerarPDF = () => {
    const doc = new jsPDF();
    let y = 10;

    doc.setFontSize(14);
    doc.text("Planejamento da Produção - Dudunitê", 10, y);
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
            addLine(`      Sabor: ${sabor} - ${qtd} un`);
            totalProdutoEscola += qtd;

            if (!totalPorCidade[cidade][produto]) totalPorCidade[cidade][produto] = 0;
            totalPorCidade[cidade][produto] += qtd;

            if (!totalGeral[produto]) totalGeral[produto] = 0;
            totalGeral[produto] += qtd;
          });

          addLine(`    Total ${produto} na escola: ${totalProdutoEscola} un`);
          totalEscola += totalProdutoEscola;
        });

        addLine(`  Total geral da escola ${escola}: ${totalEscola} un`);
        addLine('');
      });

      addLine(`Total da cidade ${cidade}:`);
      Object.keys(totalPorCidade[cidade]).forEach(produto => {
        addLine(`  ${produto}: ${totalPorCidade[cidade][produto]} un`);
      });

      addLine('');
    });

    addLine('Total geral de todos os produtos:');
    Object.keys(totalGeral).forEach(produto => {
      addLine(`  ${produto}: ${totalGeral[produto]} un`);
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
    <div style={{ maxWidth: 600, margin: 'auto', padding: 20, fontFamily: 'Arial, sans-serif' }}>
      <h1>Dudunitê - ERP de Pedidos</h1>

      <div style={{ marginBottom: 10 }}>
        <label>Cidade:</label>
        <select value={cidade} onChange={e => { setCidade(e.target.value); setEscola(''); }}>
          <option value="">Selecione a cidade</option>
          {cidadesData.map(c => (
            <option key={c.nome} value={c.nome}>{c.nome}</option>
          ))}
        </select>
      </div>

      <div style={{ marginBottom: 10 }}>
        <label>Escola:</label>
        <select value={escola} onChange={e => setEscola(e.target.value)} disabled={!cidade}>
          <option value="">Selecione a escola</option>
          {cidade && cidadesData.find(c => c.nome === cidade).escolas.map(escola => (
            <option key={escola} value={escola}>{escola}</option>
          ))}
        </select>
      </div>

      <div style={{ marginBottom: 10 }}>
        <label>Produto:</label>
        <select value={produto} onChange={e => { setProduto(e.target.value); setSabor(''); }}>
          <option value="">Selecione o produto</option>
          {produtosData.map(p => (
            <option key={p.nome} value={p.nome}>{p.nome}</option>
          ))}
        </select>
      </div>

      <div style={{ marginBottom: 10 }}>
        <label>Sabor:</label>
        <select value={sabor} onChange={e => setSabor(e.target.value)} disabled={!produto}>
          <option value="">Selecione o sabor</option>
          {produto && produtosData.find(p => p.nome === produto).sabores.map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      <div style={{ marginBottom: 10 }}>
        <label>Quantidade:</label>
        <input
          type="number"
          min="1"
          value={quantidade}
          onChange={e => setQuantidade(e.target.value)}
          style={{ width: 60 }}
        />
      </div>

      <button onClick={adicionarItem} disabled={!produto || !sabor || quantidade < 1}>Adicionar Item</button>

      <div style={{ marginTop: 20 }}>
        <h3>Itens adicionados:</h3>
        {itens.length === 0 && <p>Nenhum item adicionado.</p>}
        <ul>
          {itens.map((item, idx) => (
            <li key={idx}>{item.produto} | {item.sabor} | {item.quantidade} un</li>
          ))}
        </ul>
      </div>

      <button
        onClick={salvarPedido}
        disabled={!cidade || !escola || itens.length === 0}
        style={{ marginTop: 20, backgroundColor: '#4CAF50', color: 'white', padding: '10px 15px', border: 'none', cursor: 'pointer' }}
      >
        Salvar Pedido da Escola
      </button>

      <div style={{ marginTop: 40 }}>
        <button
          onClick={gerarPDF}
          disabled={pedidos.length === 0}
          style={{ backgroundColor: '#2196F3', color: 'white', padding: '10px 15px', border: 'none', cursor: 'pointer' }}
        >
          Gerar PDF do Planejamento da Produção
        </button>
      </div>

      <div style={{ marginTop: 20 }}>
        <h3>Pedidos Salvos:</h3>
        {pedidos.length === 0 && <p>Nenhum pedido salvo.</p>}
        <ul>
          {pedidos.map((pedido, idx) => (
            <li key={idx}>
              {pedido.cidade} - {pedido.escola} - {pedido.itens.length} itens
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
      }

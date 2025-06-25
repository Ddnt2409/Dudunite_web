import React, { useState } from 'react'; import jsPDF from 'jspdf'; import logo from './logo-preta.png'; // ⚠️ Substitua pelo caminho correto da logomarca preta

const App = () => { const [cidade, setCidade] = useState(''); const [escola, setEscola] = useState(''); const [produto, setProduto] = useState(''); const [sabor, setSabor] = useState(''); const [quantidade, setQuantidade] = useState(1); const [itens, setItens] = useState([]); const [pedidos, setPedidos] = useState([]);

const dados = { 'Recife': ['Tio Valter', 'Vera Cruz', 'Pinheiros', 'BMQ', 'Dourado', 'Cfc', 'Madre de Deus', 'Saber viver', 'Anita Garibaldi'], 'Caruaru': ['Interativo', 'Exato 1', 'Exato 2', 'Sesi', 'Motivo'], 'Gravatá': ['Russas', 'Salesianas', 'Pequeno Príncipe', 'Ceu azul'] };

const sabores = [ 'Ninho com Nutella', 'Ninho', 'Brig Bco', 'Brig Pto', 'Brig Pto Confete', 'Brig Bco Confete', 'Oreo', 'Ovomaltine', 'Bem Casado', 'Palha Italiana', 'Cr Maracujá' ];

const produtos = { 'BRW7x7': sabores, 'BRW6x6': sabores, 'PKT5x5': sabores, 'PKT6x6': sabores, 'ESC': sabores, 'DUDU': sabores };

const adicionarItem = () => { if (produto && sabor && quantidade > 0) { setItens([...itens, { produto, sabor, quantidade: Number(quantidade) }]); setProduto(''); setSabor(''); setQuantidade(1); } };

const salvarPedido = () => { if (!cidade || !escola || itens.length === 0) { alert('Preencha todos os campos antes de salvar.'); return; }

const hoje = new Date();
const cincoDiasAtras = new Date();
cincoDiasAtras.setDate(hoje.getDate() - 5);

const indice = pedidos.findIndex(
  p => p.cidade === cidade && p.escola === escola && new Date(p.data) >= cincoDiasAtras
);

if (indice !== -1) {
  const atualizado = [...pedidos];
  atualizado[indice].itens.push(...itens);
  setPedidos(atualizado);
} else {
  setPedidos([...pedidos, { cidade, escola, itens, data: hoje.toISOString() }]);
}

setCidade('');
setEscola('');
setProduto('');
setSabor('');
setQuantidade(1);
setItens([]);
alert('Pedido salvo com sucesso!');

};

const gerarPDF = () => { const doc = new jsPDF(); let y = 10;

// Logomarca
doc.addImage(logo, 'PNG', 10, y, 40, 15);
y += 20;

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

doc.setFont('courier', 'normal');
doc.setFontSize(10);
addLine('Planejamento da Produção - Dudunitê');
y += 4;

Object.entries(agrupado).forEach(([cidade, escolas]) => {
  addLine(`Cidade: ${cidade}`);
  Object.entries(escolas).forEach(([escola, produtos]) => {
    addLine(` Escola: ${escola}`);
    let totalEscola = 0;

    Object.entries(produtos).forEach(([produto, sabores]) => {
      const totalProduto = Object.values(sabores).reduce((a, b) => a + b, 0);
      addLine(` ${produto} — Total: ${totalProduto} un`);
      totalEscola += totalProduto;

      addLine(` Sabor                 | Quantidade`);
      addLine(` ----------------------|-----------`);
      Object.entries(sabores).forEach(([sabor, qtd]) => {
        const linha = ` ${sabor.padEnd(22)}| ${String(qtd).padStart(3)} un`;
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

const agora = new Date();
const nomePDF = `planejamento-${agora.getFullYear()}-${String(agora.getMonth() + 1).padStart(2, '0')}-${String(agora.getDate()).padStart(2, '0')}_${String(agora.getHours()).padStart(2, '0')}-${String(agora.getMinutes()).padStart(2, '0')}-${String(agora.getSeconds()).padStart(2, '0')}.pdf`;
doc.save(nomePDF);

};

const totalItens = itens.reduce((soma, item) => soma + item.quantidade, 0);

return ( <div className="max-w-3xl mx-auto p-4"> <img src="/logo-preta.png" alt="Logo" className="w-32 mb-4" /> <h1 className="text-2xl font-bold mb-4">Dudunitê - Lançamento de Pedidos</h1>

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
      <button onClick={adicionarItem} className="bg-green-600 text-white px-4 py-2 rounded">+ Adicionar</button>
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

  <div className="mt-6">
    <h2 className="font-bold">Pedidos Salvos:</h2>
    <ul className="text-sm text-gray-700">
      {pedidos.map((p, i) => (
        <li key={i}>📌 {p.cidade} - {p.escola} ({p.itens.length} itens)</li>
      ))}
    </ul>
  </div>
</div>

); };

export default App;


import React, { useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import {
  collection,
  addDoc,
  serverTimestamp,
  getDocs,
  query,
  where,
  Timestamp
} from "firebase/firestore";
import db from './firebase';

const App = () => {
  // Estados principais
  const [cidade, setCidade] = useState('');
  const [escola, setEscola] = useState('');
  const [produto, setProduto] = useState('');
  const [sabor, setSabor] = useState('');
  const [quantidade, setQuantidade] = useState(1);
  const [itens, setItens] = useState([]);
  const [pedidos, setPedidos] = useState([]);
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');

  // Dados fixos para seleção
  const dados = {
    "Recife": ["Tio Valter", "Vera Cruz", "Pinheiros", "BMQ", "Dourado", "CFC", "Madre de Deus", "Saber Viver", "Anita Garibaldi"],
    "Caruaru": ["Interativo", "Exato 1", "Exato 2", "SESI", "Motivo"],
    "Gravatá": ["Russas", "Salesianas", "Pequeno Príncipe", "Céu Azul"]
  };

  const saboresPadrao = [
    "Ninho com nutella", "Ninho", "Brig bco", "Brig pto",
    "Brig pto confete", "Brig bco confete", "Oreo", "Ovomaltine",
    "Bem casado", "Palha italiana", "Cr maracujá"
  ];

  const produtos = {
    "BRW 7x7": saboresPadrao,
    "BRW 6x6": saboresPadrao,
    "ESC": saboresPadrao,
    "PKT 5x5": saboresPadrao,
    "PKT 6x6": saboresPadrao,
    "DUDU": saboresPadrao
  };

  // Função para adicionar item ao pedido
  const adicionarItem = () => {
    if (!produto || !sabor || quantidade < 1) {
      alert('Preencha Produto, Sabor e Quantidade válidos.');
      return;
    }
    setItens([...itens, { produto, sabor, quantidade: Number(quantidade) }]);
    setSabor('');
    setQuantidade(1);
  };

  // Salvar pedido no Firestore
  const salvarPedido = async () => {
    if (!cidade || !escola) {
      alert('Selecione Cidade e Escola.');
      return;
    }
    if (itens.length === 0) {
      alert('Adicione ao menos 1 item no pedido.');
      return;
    }

    const novoPedido = {
      cidade,
      escola,
      itens,
      data: new Date().toISOString(),
      dataServidor: serverTimestamp()
    };

    try {
      await addDoc(collection(db, "pedidos"), novoPedido);
      alert('✅ Pedido salvo no Firestore!');
      setPedidos([...pedidos, novoPedido]);
      setCidade('');
      setEscola('');
      setProduto('');
      setSabor('');
      setQuantidade(1);
      setItens([]);
    } catch (error) {
      console.error('Erro ao salvar pedido:', error);
      alert('❌ Falha ao salvar no Firestore.');
    }
  };

  // Carregar pedidos filtrados por data
  const carregarPedidos = async () => {
    try {
      const pedidosRef = collection(db, "pedidos");
      let q = pedidosRef;

      if (dataInicio && dataFim) {
        const inicio = Timestamp.fromDate(new Date(`${dataInicio}T00:00:00`));
        const fim = Timestamp.fromDate(new Date(`${dataFim}T23:59:59`));
        q = query(pedidosRef, where("dataServidor", ">=", inicio), where("dataServidor", "<=", fim));
      }

      const snapshot = await getDocs(q);
      const lista = snapshot.docs.map(doc => doc.data());
      setPedidos(lista);
    } catch (e) {
      console.error("Erro ao carregar pedidos:", e);
    }
  };

  useEffect(() => {
    carregarPedidos();
  }, [dataInicio, dataFim]);

  // Gerar PDF de Planejamento de Produção
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
    doc.text('Planejamento de Produção - Dudunitê', 10, y); y += 10;

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
      if (y > 270) { doc.addPage(); y = 10; }
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
    addLine(`-----------------------------`);
    addLine(`📦 RESUMO FINAL DE PRODUÇÃO:`);

    const totalTabuleiros =
      (totalGeral["BRW 7x7"] || 0) / 12 +
      (totalGeral["BRW 6x6"] || 0) / 17 +
      (totalGeral["PKT 5x5"] || 0) / 20 +
      (totalGeral["PKT 6x6"] || 0) / 15 +
      (totalGeral["ESC"] || 0) / 26;

    addLine(`🧾 Total de tabuleiros: ${Math.ceil(totalTabuleiros)} un`);

    const saboresBrancos = [
      "Ninho com nutella", "Ninho", "Brig bco", "Brig bco confete",
      "Oreo", "Ovomaltine", "Palha italiana"
    ];
    const saboresPretos = [
      "Brig pto", "Brig pto confete"
    ];

    let bBranco = 0;
    let bPreto = 0;

    pedidos.forEach(pedido => {
      pedido.itens.forEach(({ produto, sabor, quantidade }) => {
        const qtd = Number(quantidade);
        const bacia = (q, r) => q / r;

        if (saboresBrancos.includes(sabor)) {
          if (produto === "BRW 7x7") bBranco += bacia(qtd, 25);
          if (produto === "BRW 6x6") bBranco += bacia(qtd, 35);
          if (produto === "ESC")     bBranco += bacia(qtd, 26);
          if (produto === "PKT 5x5") bBranco += (qtd * 20) / 1350;
          if (produto === "PKT 6x6") bBranco += (qtd * 30) / 1350;
        }

        if (saboresPretos.includes(sabor)) {
          if (produto === "BRW 7x7") bPreto += bacia(qtd, 25);
          if (produto === "BRW 6x6") bPreto += bacia(qtd, 35);
          if (produto === "ESC")     bPreto += bacia(qtd, 26);
          if (produto === "PKT 5x5") bPreto += (qtd * 20) / 1350;
          if (produto === "PKT 6x6") bPreto += (qtd * 30) / 1350;
        }
      });
    });

    addLine(`🥛 Bacias de recheio branco: ${Math.ceil(bBranco)} un`);
    addLine(`🍫 Bacias de recheio preto: ${Math.ceil(bPreto)} un`);
    addLine(`-----------------------------`);
    addLine(`📄 Gerado em ${dia}/${mes}/${ano} às ${hora}h${minuto}`);

    doc.save(nomePDF);
  };

  // Função para gerar Lista de Compras e Excel (CSV)
  const gerarListaCompras = () => {
    const doc = new jsPDF();
    let y = 10;

    const insumos = {
      margarina: 0,
      ovos: 0,
      farinha: 0,
      massas: 0,
      nutella: 0,
      recheiosBrancos: 0,
      recheiosPretos: 0,
      recheiosMistos: 0
    };

    const embalagens = {
      G650: 0,
      G640: 0,
      SQ5x5: 0,
      SQ6x6: 0,
      D135: 0,
      EtiqBrw: 0,
      EtiqDD: 0,
      EtiqEsc: 0
    };

    const saboresBrancos = [
      "Ninho com nutella", "Ninho", "Brig bco", "Brig bco confete", "Oreo", "Ovomaltine", "Palha italiana"
    ];

    const saboresPretos = [
      "Brig pto", "Brig pto confete"
    ];

    const saboresMistos = [
      "Bem casado"
    ];

    pedidos.forEach(({ itens }) => {
      itens.forEach(({ produto, sabor, quantidade }) => {
        const qtd = Number(quantidade);

        if (produto === "BRW 7x7") {
          insumos.margarina += qtd * 76 / 12;
          insumos.ovos += qtd * 190 / 12;
          insumos.farinha += qtd * 900 / 12;

          embalagens.G650 += qtd;
          embalagens.EtiqBrw += qtd;
        }

        if (produto === "BRW 6x6") {
          insumos.margarina += qtd * 76 / 17;
          insumos.ovos += qtd * 190 / 17;
          insumos.farinha += qtd * 900 / 17;

          embalagens.G640 += qtd;
          embalagens.EtiqBrw += qtd;
        }

        if (produto === "PKT 5x5") {
          embalagens.SQ5x5 += qtd;
          embalagens.EtiqBrw += qtd; // etiqueta = embalagem
        }

        if (produto === "PKT 6x6") {
          embalagens.SQ6x6 += qtd;
          embalagens.EtiqBrw += qtd;
        }

        if (produto === "DUDU") {
          embalagens.SQ30x5 += qtd;
          embalagens.SQ22x6 += qtd;
          embalagens.EtiqDD += qtd;
        }

        if (produto === "ESC") {
          embalagens.D135 += qtd;
          embalagens.EtiqEsc += qtd;
        }

        // Nutella
        if (sabor === "Ninho com nutella") {
          if (produto === "BRW 7x7") insumos.nutella += qtd / 60;
          if (produto === "BRW 6x6") insumos.nutella += qtd / 85;
        }

        const bacia = (q, r) => q / r;

        // Recheio Branco
        if (saboresBrancos.includes(sabor)) {
          if (produto === "BRW 7x7
              if (produto === "BRW 7x7") insumos.recheiosBrancos += bacia(qtd, 25);
          if (produto === "BRW 6x6") insumos.recheiosBrancos += bacia(qtd, 35);
          if (produto === "ESC")     insumos.recheiosBrancos += bacia(qtd, 26);
          if (produto === "PKT 5x5") insumos.recheiosBrancos += (qtd * 20) / 1350;
          if (produto === "PKT 6x6") insumos.recheiosBrancos += (qtd * 25) / 1350;
        }

        // Recheio Preto
        if (saboresPretos.includes(sabor)) {
          if (produto === "BRW 7x7") insumos.recheiosPretos += bacia(qtd, 25);
          if (produto === "BRW 6x6") insumos.recheiosPretos += bacia(qtd, 35);
          if (produto === "ESC")     insumos.recheiosPretos += bacia(qtd, 26);
          if (produto === "PKT 5x5") insumos.recheiosPretos += (qtd * 20) / 1350;
          if (produto === "PKT 6x6") insumos.recheiosPretos += (qtd * 25) / 1350;
        }

        // Recheio Misto
        if (saboresMistos.includes(sabor)) {
          if (produto === "BRW 7x7") insumos.recheiosMistos += bacia(qtd, 25);
          if (produto === "BRW 6x6") insumos.recheiosMistos += bacia(qtd, 35);
          if (produto === "ESC")     insumos.recheiosMistos += bacia(qtd, 26);
          if (produto === "PKT 5x5") insumos.recheiosMistos += (qtd * 20) / 1350;
          if (produto === "PKT 6x6") insumos.recheiosMistos += (qtd * 25) / 1350;
        }
      });
    });

    insumos.massas = insumos.farinha / 400;

    // RESUMO PDF
    doc.setFont('courier', 'normal');
    doc.setFontSize(10);
    doc.text('--- INSUMOS ---', 10, y); y += 8;
    doc.text(`Margarina: ${insumos.margarina.toFixed(0)}g`, 10, y); y += 6;

    const ovosTotal = insumos.ovos;
    const ovosBandejas = Math.ceil(ovosTotal / 60);
    doc.text(`Ovos: ${ovosBandejas} bandeja(s) (${ovosTotal.toFixed(0)}g)`, 10, y); y += 6;

    doc.text(`Massas (400g): ${Math.ceil(insumos.massas)} un`, 10, y); y += 6;
    doc.text(`Nutella (650g): ${Math.ceil(insumos.nutella)} un`, 10, y); y += 6;

    doc.text(`Bacias recheio branco: ${Math.ceil(insumos.recheiosBrancos)} un`, 10, y); y += 6;
    doc.text(`Bacias recheio preto: ${Math.ceil(insumos.recheiosPretos)} un`, 10, y); y += 6;
    doc.text(`Bacias recheio misto: ${Math.ceil(insumos.recheiosMistos)} un`, 10, y); y += 10;

    doc.addPage();
    y = 10;

    doc.text('--- EMBALAGENS ---', 10, y); y += 8;
    Object.entries(embalagens).forEach(([codigo, qtd]) => {
      doc.text(`${codigo}: ${Math.ceil(qtd)} un`, 10, y);
      y += 6;
    });

    const agora = new Date();
    const dia = String(agora.getDate()).padStart(2, '0');
    const mes = String(agora.getMonth() + 1).padStart(2, '0');
    const ano = agora.getFullYear();
    const hora = String(agora.getHours()).padStart(2, '0');
    const minuto = String(agora.getMinutes()).padStart(2, '0');
    const nomePDF = `lista-compras-${dia}-${mes}-${ano}-${hora}h${minuto}.pdf`;

    doc.save(nomePDF);

    // Exportar para Excel (CSV)
    const csv = [
      ["Insumo", "Quantidade"],
      ["Margarina (g)", insumos.margarina.toFixed(0)],
      ["Ovos (g)", ovosTotal.toFixed(0)],
      ["Ovos (bandejas)", ovosBandejas],
      ["Massas (400g)", Math.ceil(insumos.massas)],
      ["Nutella (un)", Math.ceil(insumos.nutella)],
      ["Bacias Recheio Branco", Math.ceil(insumos.recheiosBrancos)],
      ["Bacias Recheio Preto", Math.ceil(insumos.recheiosPretos)],
      ["Bacias Recheio Misto", Math.ceil(insumos.recheiosMistos)],
      ...Object.entries(embalagens).map(([k, v]) => [k, Math.ceil(v)])
    ];

    const csvContent = csv.map(linha => linha.join(";")).join("\n");
    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `lista-compras-${dia}-${mes}-${ano}-${hora}h${minuto}.csv`;
    link.click();
  };

  // Total de itens no pedido
  const totalItens = itens.reduce((acc, item) => acc + item.quantidade, 0);

  // JSX do componente
  return (
    <div className="max-w-3xl mx-auto p-4 bg-[#fff5ec] min-h-screen">
      <h1 className="text-xl font-bold mb-4 text-center text-[#8c3b1b]">
        Lançamento de Pedidos - Dudunitê
      </h1>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label>Cidade</label>
          <select
            className="w-full border p-1"
            value={cidade}
            onChange={e => { setCidade(e.target.value); setEscola(''); }}
          >
            <option value="">Selecione</option>
            {Object.keys(dados).map(c => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </div>

        <div>
          <label>Escola</label>
          <select
            className="w-full border p-1"
            value={escola}
            onChange={e => setEscola(e.target.value)}
            disabled={!cidade}
          >
            <option value="">Selecione</option>
            {cidade && dados[cidade].map(e => (
              <option key={e}>{e}</option>
            ))}
          </select>
        </div>

        <div>
          <label>Produto</label>
          <select
            className="w-full border p-1"
            value={produto}
            onChange={e => { setProduto(e.target.value); setSabor(''); }}
          >
            <option value="">Selecione</option>
            {Object.keys(produtos).map(p => (
              <option key={p}>{p}</option>
            ))}
          </select>
        </div>

        <div>
          <label>Sabor</label>
          <select
            className="w-full border p-1"
            value={sabor}
            onChange={e => setSabor(e.target.value)}
            disabled={!produto}
          >
            <option value="">Selecione</option>
            {produto && produtos[produto].map(s => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </div>

        <div>
          <label>Quantidade</label>
          <input
            type="number"
            min="1"
            className="w-full border p-1"
            value={quantidade}
            onChange={e => setQuantidade(e.target.value)}
          />
        </div>

        <div className="flex items-end">
          <button
            onClick={adicionarItem}
            className="bg-[#a84d2a] text-white px-4 py-2 rounded"
          >
            + Adicionar
          </button>
        </div>
      </div>

      <div className="mt-4">
        <h2 className="font-bold">
          Itens do Pedido (Total: {totalItens} un):
        </h2>
        {itens.length === 0 ? (
          <p className="text-sm text-gray-500">Nenhum item adicionado.</p>
        ) : (
          <ul className="list-disc pl-5">
            {itens.map((item, i) => (
              <li key={i}>
                {item.produto} - {item.sabor} - {item.quantidade} un
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        <button
          onClick={salvarPedido}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          💾 Salvar Pedido
        </button>
        <button
          onClick={gerarPDF}
          className="bg-purple-600 text-white px-4 py-2 rounded"
        >
          📄 Gerar PDF Produção
        </button>
        <button
          onClick={gerarListaCompras}
          className="bg-green-700 text-white px-4 py-2 rounded"
        >
          🛒 Gerar Lista de Compras + Excel
        </button>
      </div>

      <div className="mt-6">
        <h2 className="font-bold">Pedidos Filtrados:</h2>
        {pedidos.length === 0 ? (
          <p className="text-sm text-gray-500">Nenhum pedido disponível.</p>
        ) : (
          <ul className="text-sm text-gray-700">
            {pedidos.map((p, i) => (
              <li key={i}>
                📌 {p.cidade} - {p.escola} ({p.itens.length} itens)
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default App;

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

    let baciasBranco = 0;
    let baciasPreto = 0;

    pedidos.forEach(pedido => {
      pedido.itens.forEach(({ produto, sabor, quantidade }) => {
        const qtd = Number(quantidade);

        const bacia = (qtd, rendimento) => qtd / rendimento;

        if (saboresBrancos.includes(sabor)) {
          if (produto === "BRW 7x7") baciasBranco += bacia(qtd, 25);
          if (produto === "BRW 6x6") baciasBranco += bacia(qtd, 35);
          if (produto === "ESC")     baciasBranco += bacia(qtd, 26);
          if (produto === "PKT 5x5") baciasBranco += (qtd * 20) / 1350;
          if (produto === "PKT 6x6") baciasBranco += (qtd * 30) / 1350;
        }

        if (saboresPretos.includes(sabor)) {
          if (produto === "BRW 7x7") baciasPreto += bacia(qtd, 25);
          if (produto === "BRW 6x6") baciasPreto += bacia(qtd, 35);
          if (produto === "ESC")     baciasPreto += bacia(qtd, 26);
          if (produto === "PKT 5x5") baciasPreto += (qtd * 20) / 1350;
          if (produto === "PKT 6x6") baciasPreto += (qtd * 30) / 1350;
        }
      });
    });

    addLine(`🥛 Bacias de recheio branco: ${Math.ceil(baciasBranco)} un`);
    addLine(`🍫 Bacias de recheio preto: ${Math.ceil(baciasPreto)} un`);
    addLine(`-----------------------------`);
    addLine(`📄 Gerado em ${dia}/${mes}/${ano} às ${hora}h${minuto}`);

    doc.save(nomePDF);
  };

  const gerarListaCompras = () => {
    const doc = new jsPDF();
    let y = 10;

    doc.setFont('courier', 'normal');
    doc.setFontSize(10);
    doc.text('Lista de Compras - Dudunitê', 10, y);
    y += 10;

    // Inicializa insumos e embalagens
    const insumos = {
      margarina: 0,
      ovos: 0,
      massas: 0,
      recheiosPretos: 0,
      recheiosBrancos: 0,
      nutella: 0,
      dudus: 0
    };

    const embalagens = {
      G650: 0,   // Embalagem BRW 7x7
      G640: 0,   // Embalagem BRW 6x6
      SQ5x5: 0,  // Embalagem PKT 5x5
      SQ6x6: 0,  // Embalagem PKT 6x6
      SQ30x5: 0, // Embalagem DUDU 30x5 (2 sacos por dudu)
      SQ22x6: 0, // Embalagem DUDU 22x6 (2 sacos por dudu)
      D135: 0,   // Embalagem ESC
      EtiqBrw: 0,
      EtiqDD: 0,
      EtiqEsc: 0
    };

    // Sabores agrupados para recheios
    const saboresBrancos = [
      "Ninho com nutella", "Ninho", "Brig bco", "Brig bco confete",
      "Oreo", "Ovomaltine", "Palha italiana"
    ];

    const saboresPretos = [
      "Brig pto", "Brig pto confete"
    ];

    pedidos.forEach(pedido => {
      pedido.itens.forEach(({ produto, sabor, quantidade }) => {
        const qtd = Number(quantidade);

        // Massa e insumos por produto
        if (produto === "BRW 7x7") {
          insumos.margarina += 76 * (qtd / 12);
          insumos.ovos += 190 * (qtd / 12);
          insumos.massas += 2 * (qtd / 12);
          embalagens.G650 += qtd;
          embalagens.EtiqBrw += qtd;
        }

        if (produto === "BRW 6x6") {
          insumos.margarina += 76 * (qtd / 17);
          insumos.ovos += 190 * (qtd / 17);
          insumos.massas += 2 * (qtd / 17);
          embalagens.G640 += qtd;
          embalagens.EtiqBrw += qtd;
        }

        if (produto === "ESC") {
          insumos.margarina += 76 * (qtd / 26);
          insumos.ovos += 190 * (qtd / 26);
          insumos.massas += 2 * (qtd / 26);
          embalagens.D135 += qtd;
          embalagens.EtiqEsc += qtd;
        }

        if (produto === "PKT 5x5") {
          insumos.margarina += 76 * (qtd / 20);
          insumos.ovos += 190 * (qtd / 20);
          insumos.massas += 2 * (qtd / 20);
          embalagens.SQ5x5 += qtd;
          embalagens.EtiqBrw += qtd;
        }

        if (produto === "PKT 6x6") {
          insumos.margarina += 76 * (qtd / 15);
          insumos.ovos += 190 * (qtd / 15);
          insumos.massas += 2 * (qtd / 15);
          embalagens.SQ6x6 += qtd;
          embalagens.EtiqBrw += qtd;
        }

        if (produto === "DUDU") {
          // Dudus usam leite, mistura láctea, leite em pó, Nutella conforme receita
          insumos.dudus += qtd;
          embalagens.SQ30x5 += qtd * 2;
          embalagens.SQ22x6 += qtd * 2;
          embalagens.EtiqDD += qtd;
        }

        // Cálculo recheios (em bacias, considerando rendimento 1350g/bacia)
        if (saboresBrancos.includes(sabor)) {
          if (produto === "BRW 7x7") insumos.recheiosBrancos += qtd / 25;
          if (produto === "BRW 6x6") insumos.recheiosBrancos += qtd / 35;
          if (produto === "ESC")     insumos.recheiosBrancos += qtd / 26;
          if (produto === "PKT 5x5") insumos.recheiosBrancos += (qtd * 20) / 1350;
          if (produto === "PKT 6x6") insumos.recheiosBrancos += (qtd * 30) / 1350;
        }

        if (saboresPretos.includes(sabor)) {
          if (produto === "BRW 7x7") insumos.recheiosPretos += qtd / 25;
          if (produto === "BRW 6x6") insumos.recheiosPretos += qtd / 35;
          if (produto === "ESC")     insumos.recheiosPretos += qtd / 26;
          if (produto === "PKT 5x5") insumos.recheiosPretos += (qtd * 20) / 1350;
          if (produto === "PKT 6x6") insumos.recheiosPretos += (qtd * 30) / 1350;
        }

        // Nutella (contabiliza só sabores que contenham nutella)
        if (sabor.toLowerCase().includes("nutella")) {
          insumos.nutella += qtd;
        }
      });
    });

    // Arredondar valores para cima
    for (let key in insumos) {
      insumos[key] = Math.ceil(insumos[key]);
    }
    for (let key in embalagens) {
      embalagens[key] = Math.ceil(embalagens[key]);
    }

    // Exibe no PDF
    doc.text('--- INSUMOS ---', 10, y); y += 8;
    doc.text(`Margarina (g): ${insumos.margarina}`, 10, y); y += 6;
    doc.text(`Ovos (g): ${insumos.ovos}`, 10, y); y += 6;
    doc.text(`Massas (unidades): ${insumos.massas}`, 10, y); y += 6;
    doc.text(`Recheios Brancos (bacias): ${insumos.recheiosBrancos}`, 10, y); y += 6;
    doc.text(`Recheios Pretos (bacias): ${insumos.recheiosPretos}`, 10, y); y += 6;
    doc.text(`Nutella (potinhos): ${insumos.nutella}`, 10, y); y += 10;

    doc.text('--- EMBALAGENS ---', 10, y); y += 8;
    doc.text(`BRW 7x7 (G650): ${embalagens.G650}`, 10, y); y += 6;
    doc.text(`BRW 6x6 (G640): ${embalagens.G640}`, 10, y); y += 6;
    doc.text(`PKT 5x5 (SQ5x5): ${embalagens.SQ5x5}`, 10, y); y += 6;
    doc.text(`PKT 6x6 (SQ6x6): ${embalagens.SQ6x6}`, 10, y); y += 6;
    doc.text(`DUDU 30x5 (SQ30x5): ${embalagens.SQ30x5}`, 10, y); y += 6;
    doc.text(`DUDU 22x6 (SQ22x6): ${embalagens.SQ22x6}`, 10, y); y += 6;
    doc.text(`ESC (D135): ${embalagens.D135}`, 10, y); y += 6;

    doc.text(`Etiquetas BRW (EtiqBrw): ${embalagens.EtiqBrw}`, 10, y); y += 6;
    doc.text(`Etiquetas DUDU (EtiqDD): ${embalagens.EtiqDD}`, 10, y); y += 6;
    doc.text(`Etiquetas ESC (EtiqEsc): ${embalagens.EtiqEsc}`, 10, y); y += 10;

    doc.save('lista-de-compras.pdf');
  };

  return (
    <div className="max-w-3xl mx-auto p-4 bg-[#fff5ec] min-h-screen">
      <h1 className="text-xl font-bold mb-4 text-center text-[#8c3b1b]">Lançamento de Pedidos - Dudunitê</h1>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label>Cidade</label>
          <select
            className="w-full border p-1"
            value={cidade}
            onChange={e => {
              setCidade(e.target.value);
              setEscola('');
            }}
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
            onChange={e => {
              setProduto(e.target.value);
              setSabor('');
            }}
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
          Itens do Pedido (Total: {itens.reduce((sum, item) => sum + item.quantidade, 0)} un):
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

      <div className="mt-4 flex gap-4 flex-wrap">
        <button
          onClick={salvarPedido}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          Salvar Pedido
        </button>

        <button
          onClick={gerarPDF}
          className="bg-purple-600 text-white px-4 py-2 rounded"
        >
          Gerar PDF Produção
        </button>

        <button
          onClick={gerarListaCompras}
          className="bg-green-700 text-white px-4 py-2 rounded"
        >
          🛒 Gerar Lista de Compras
        </button>
      </div>

      <div className="mt-6">
        <h2 className="font-bold">Pedidos Filtrados:</h2>
        <ul className="text-sm text-gray-700">
          {pedidos.map((p, i) => (
            <li key={i}>
              📌 {p.cidade} - {p.escola} ({p.itens.length} itens)
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default App;

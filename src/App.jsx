// FN01 – gerarPDF (Planejamento de Produção)
const gerarPDF = () => {
  const pedidosFiltrados = filtrarPedidosPorData();

  if (!pedidosFiltrados.length) {
    alert('Nenhum pedido encontrado para o período selecionado.');
    return;
  }

  const doc = new jsPDF();
  let y = 10;

  doc.setFont('courier', 'normal');
  doc.setFontSize(10);
  doc.text('Planejamento de Produção - Dudunitê', 10, y);
  y += 10;

  const rendimentoPorProduto = {
    "BRW 7x7": { tabuleiro: 12, bacia: { branco: 25, preto: 25 } },
    "BRW 6x6": { tabuleiro: 17, bacia: { branco: 35, preto: 35 } },
    "PKT 5x5": { tabuleiro: 20, bacia: { branco: 650 / 20, preto: 650 / 20 } },
    "PKT 6x6": { tabuleiro: 15, bacia: { branco: 650 / 30, preto: 650 / 30 } },
    "ESC":     { tabuleiro: 26, bacia: { branco: 26, preto: 26 } },
    "DUDU":    { tabuleiro: 100, bacia: { branco: 100, preto: 100 } }
  };

  const saboresBrancos = [
    "Ninho", "Ninho com nutella", "Brigadeiro branco", "Oreo",
    "Ovomaltine", "Paçoca", "Brigadeiro branco c confete", "Beijinho"
  ];
  const saboresPretos = [
    "Brigadeiro preto", "Brigadeiro c confete", "Palha italiana", "Prestigio"
  ];

  const tabuleiros = {};
  const bacias = { branco: 0, preto: 0 };

  pedidosFiltrados.forEach((pedido) => {
    try {
      const dataFormatada = pedido.timestamp?.toDate?.()?.toLocaleDateString?.("pt-BR") || "Data inválida";

      doc.text(`Escola: ${pedido.escola || '---'}`, 10, y); y += 6;
      doc.text(`Cidade: ${pedido.cidade || '---'}`, 10, y); y += 6;
      doc.text(`Data: ${dataFormatada}`, 10, y); y += 6;
      doc.text('Itens:', 10, y); y += 6;

      pedido.itens.forEach(({ produto, sabor, quantidade }) => {
        const qtd = Number(quantidade);
        doc.text(`${produto} - ${sabor} - ${qtd} un`, 12, y); y += 6;

        const rend = rendimentoPorProduto[produto];
        if (!rend) return;

        if (!tabuleiros[produto]) tabuleiros[produto] = 0;
        tabuleiros[produto] += qtd / rend.tabuleiro;

        if (sabor === "Bem casado") {
          bacias.branco += qtd / (rend.bacia.branco * 2);
          bacias.preto += qtd / (rend.bacia.preto * 2);
        } else if (saboresBrancos.includes(sabor)) {
          bacias.branco += qtd / rend.bacia.branco;
        } else if (saboresPretos.includes(sabor)) {
          bacias.preto += qtd / rend.bacia.preto;
        }
      });

      y += 4;
      if (y >= 270) {
        doc.addPage();
        y = 10;
      }
    } catch (erro) {
      console.error('Erro ao processar pedido:', pedido, erro);
    }
  });

  doc.addPage(); y = 10;
  doc.text('--- RESUMO DE PRODUÇÃO ---', 10, y); y += 8;

  doc.text('TABULEIROS:', 10, y); y += 6;
  Object.entries(tabuleiros).forEach(([produto, qtd]) => {
    doc.text(`${produto}: ${qtd.toFixed(2)} tabuleiros`, 12, y); y += 6;
  });

  y += 4;
  doc.text('RECHEIOS:', 10, y); y += 6;
  doc.text(`Branco: ${bacias.branco.toFixed(2)} bacias`, 12, y); y += 6;
  doc.text(`Preto: ${bacias.preto.toFixed(2)} bacias`, 12, y); y += 6;

  const agora = new Date();
  const dia = String(agora.getDate()).padStart(2, '0');
  const mes = String(agora.getMonth() + 1).padStart(2, '0');
  const ano = agora.getFullYear();
  const hora = String(agora.getHours()).padStart(2, '0');
  const minuto = String(agora.getMinutes()).padStart(2, '0');
  const nomePDF = `producao-${dia}-${mes}-${ano}-${hora}h${minuto}.pdf`;

  try {
    doc.save(nomePDF);
  } catch (erro) {
    alert('Erro ao tentar salvar o PDF. Experimente usar um navegador em modo desktop.');
    console.error(erro);
  }
};
// === FIM FN01 ===

// FN02 – formatarData (formata data em DD/MM/AAAA)
const formatarData = (isoString) => {
  const data = new Date(isoString);
  return data.toLocaleDateString('pt-BR');
};
// === FIM FN02 ===

// FN03 – filtrarPedidosPorData
const filtrarPedidosPorData = () => {
  let inicio = new Date(0);
  let fim = new Date(8640000000000000);

  if (dataInicio) {
    const dInicio = new Date(`${dataInicio}T00:00:00`);
    if (!isNaN(dInicio.getTime())) {
      inicio = dInicio;
    }
  }

  if (dataFim) {
    const dFim = new Date(`${dataFim}T23:59:59.999`);
    if (!isNaN(dFim.getTime())) {
      fim = dFim;
    }
  }

  return pedidos.filter((p) => {
    if (!p.timestamp || typeof p.timestamp.toDate !== 'function') return false;
    const dataPedido = p.timestamp.toDate();
    return dataPedido >= inicio && dataPedido <= fim;
  });
};
// === FIM FN03 ===

// FN04 – toggleMostrarDadosMestres
const toggleMostrarDadosMestres = () => {
  setMostrarDadosMestres((prev) => !prev);
};
// === FIM FN04 ===

// FN05 – toggleDadosMestres (sinônimo para compatibilidade)
const toggleDadosMestres = () => {
  setMostrarDadosMestres(!mostrarDadosMestres);
};
// === FIM FN05 ===

// FN06 – adicionarItem (botão de adicionar item ao pedido)
const adicionarItem = () => {
  if (!produto || !sabor || !quantidade) {
    alert("Preencha produto, sabor e quantidade.");
    return;
  }

  const novoItem = { produto, sabor, quantidade: Number(quantidade) };
  setItens([...itens, novoItem]);

  setProduto('');
  setSabor('');
  setQuantidade(1);
};
// === FIM FN06 ===

// FN07 – salvarPedido (envia os dados para o Firebase)
const salvarPedido = async () => {
  if (!cidade || !escola || itens.length === 0) {
    alert("Preencha cidade, escola e pelo menos um item.");
    return;
  }

  const novoPedido = {
    cidade,
    escola,
    itens,
    timestamp: serverTimestamp()
  };

  try {
    await addDoc(collection(db, "pedidos"), novoPedido);
    alert("Pedido salvo com sucesso!");
    setCidade('');
    setEscola('');
    setItens([]);
    setProduto('');
    setSabor('');
    setQuantidade(1);
  } catch (error) {
    console.error("Erro ao salvar pedido:", error);
    alert("Erro ao salvar pedido. Tente novamente.");
  }
};
// === FIM FN07 ===

// FN08 – carregarPedidos (traz todos os pedidos do banco)
const carregarPedidos = async () => {
  try {
    const q = query(collection(db, "pedidos"));
    const snapshot = await getDocs(q);
    const listaPedidos = snapshot.docs.map((doc) => doc.data());
    setPedidos(listaPedidos);
  } catch (erro) {
    console.error("Erro ao carregar pedidos:", erro);
  }
};
// === FIM FN08 ===

// FN09 – obterSaboresPorProduto
const obterSaboresPorProduto = (produtoSelecionado) => {
  return dadosProdutos[produtoSelecionado] || [];
};
// === FIM FN09 ===

// FN10 – obterEscolasPorCidade
const obterEscolasPorCidade = (cidadeSelecionada) => {
  return dadosEscolas[cidadeSelecionada] || [];
};
// === FIM FN10 ===

// === INÍCIO FN11 – totalItens (soma as quantidades dos itens adicionados) ===
const totalItens = itens.reduce((acc, item) => acc + Number(item.quantidade), 0);
// === FIM FN11 ===

// === INÍCIO FN12 – formatarData (DD/MM/AAAA a partir de objeto Date ou ISO) ===
const formatarData = (dataInput) => {
  if (!dataInput) return '';
  const data = new Date(dataInput);
  if (isNaN(data)) return '';
  return data.toLocaleDateString('pt-BR');
};
// === FIM FN12 ===

// === INÍCIO FN13 – toggleMostrarDadosMestres ===
const toggleMostrarDadosMestres = () => {
  setMostrarDadosMestres((prev) => !prev);
};
// === FIM FN13 ===

// === INÍCIO FN14 – salvarDadosMestres (grava novos produtos/escolas/sabores) ===
const salvarDadosMestres = async () => {
  const novoItem = {
    cidade,
    escola,
    produto,
    sabor,
    timestamp: serverTimestamp()
  };

  try {
    await addDoc(collection(db, "dadosMestres"), novoItem);
    alert("Item salvo nos Dados Mestres!");
    setCidade('');
    setEscola('');
    setProduto('');
    setSabor('');
  } catch (erro) {
    console.error("Erro ao salvar dados mestres:", erro);
    alert("Erro ao salvar dados mestres.");
  }
};
// === FIM FN14 ===

// === INÍCIO FN15 – filtrarPedidosPorData (com fallback se sem filtro) ===
const filtrarPedidosPorData = () => {
  let inicio = new Date(0); // data muito antiga
  let fim = new Date(8640000000000000); // data muito futura

  if (dataInicio) {
    const dInicio = new Date(`${dataInicio}T00:00:00`);
    if (!isNaN(dInicio)) inicio = dInicio;
  }

  if (dataFim) {
    const dFim = new Date(`${dataFim}T23:59:59.999`);
    if (!isNaN(dFim)) fim = dFim;
  }

  return pedidos.filter((p) => {
    if (!p.timestamp || typeof p.timestamp.toDate !== 'function') return false;
    const dataPedido = p.timestamp.toDate();
    return dataPedido >= inicio && dataPedido <= fim;
  });
};
// === FIM FN15 ===

// === INÍCIO FN16 – carregarPedidos (busca pedidos + compatibilidade de data) ===
const carregarPedidos = async () => {
  try {
    const snapshot = await getDocs(collection(db, "pedidos"));
    const lista = snapshot.docs.map(doc => {
      const data = doc.data();

      let timestamp = data.timestamp;

      // Compatibilidade com registros antigos
      if (!timestamp && data.dataServidor?.seconds) {
        timestamp = new Timestamp(
          data.dataServidor.seconds,
          data.dataServidor.nanoseconds || 0
        );
      }

      if (!timestamp && typeof data.data === 'string') {
        const d = new Date(data.data);
        if (!isNaN(d.getTime()) && d.getFullYear() > 2000 && d.getFullYear() < 2100) {
          timestamp = Timestamp.fromDate(d);
        }
      }

      return {
        id: doc.id,
        ...data,
        timestamp
      };
    }).filter(p => p.timestamp && typeof p.timestamp.toDate === 'function');

    setPedidos(lista);

    const filtrados = filtrarPedidosPorData(lista, dataInicio, dataFim);
    setPedidosFiltrados(filtrados);
  } catch (err) {
    console.error("Erro ao carregar pedidos:", err);
    alert("Erro ao carregar pedidos do banco de dados.");
  }
};
// === FIM FN16 ===

// === INÍCIO FN17 – useEffect (carrega pedidos quando intervalo definido) ===
useEffect(() => {
  if (dataInicio && dataFim) {
    carregarPedidos();
  }
}, [dataInicio, dataFim]);
// === FIM FN17 ===

// === INÍCIO FN18 – useEffect (carrega todos os pedidos se sem filtro) ===
useEffect(() => {
  if (!dataInicio && !dataFim) {
    carregarPedidos();
  }
}, []);
// === FIM FN18 ===

// === INÍCIO FN19 – adicionarItem (validação e inclusão do item na lista) ===
const adicionarItem = () => {
  if (!produto || !sabor || !quantidade || quantidade <= 0) {
    alert("Preencha todos os campos corretamente.");
    return;
  }

  const itemNovo = { produto, sabor, quantidade: Number(quantidade) };
  setItens([...itens, itemNovo]);
  setSabor('');
  setQuantidade(1);
};
// === FIM FN19 ===

// === INÍCIO FN20 – salvarPedido (envia pedido completo ao Firestore) ===
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

    alert('✅ Pedido salvo com sucesso!');
  } catch (error) {
    console.error("Erro ao salvar:", error);
    alert('❌ Falha ao salvar pedido.');
  }
};
// === FIM FN20 ===

// === INÍCIO FN21 – totalItens (soma da quantidade atual do pedido) ===
const totalItens = itens.reduce((soma, item) => soma + item.quantidade, 0);
// === FIM FN21 ===

// === INÍCIO FN22 – filtrarPedidosPorData (usa dataInicio e dataFim para filtrar) ===
const filtrarPedidosPorData = (lista = pedidos, inicioStr = dataInicio, fimStr = dataFim) => {
  let inicio = new Date(0);
  let fim = new Date(8640000000000000);

  if (inicioStr) {
    const dInicio = new Date(`${inicioStr}T00:00:00`);
    if (!isNaN(dInicio.getTime())) {
      inicio = dInicio;
    }
  }

  if (fimStr) {
    const dFim = new Date(`${fimStr}T23:59:59.999`);
    if (!isNaN(dFim.getTime())) {
      fim = dFim;
    }
  }

  return lista.filter((p) => {
    if (!p.timestamp || typeof p.timestamp.toDate !== 'function') return false;
    const dataPedido = p.timestamp.toDate();
    return dataPedido >= inicio && dataPedido <= fim;
  });
};
// === FIM FN22 ===

// === INÍCIO FN23 – salvarDadosMestres (grava cidade, escola, produto, sabor) ===
const salvarDadosMestres = async () => {
  const novoItem = {
    cidade,
    escola,
    produto,
    sabor,
    data: serverTimestamp()
  };
  await addDoc(collection(db, "dadosMestres"), novoItem);
  alert("Item salvo nos Dados Mestres!");
};
// === FIM FN23 ===

// === INÍCIO FN24 – toggleMostrarDadosMestres (alterna exibição) ===
const toggleMostrarDadosMestres = () => {
  setMostrarDadosMestres((prev) => !prev);
};
// === FIM FN24 ===

// === INÍCIO FN25 – formatarData (converte ISO em dd/mm/aaaa) ===
const formatarData = (isoString) => {
  const data = new Date(isoString);
  return data.toLocaleDateString('pt-BR');
};
// === FIM FN25 ===

// === INÍCIO FN26 – PainelDadosMestres (com botões e delegação para editores) ===
const PainelDadosMestres = ({
  tipoSelecionado,
  setTipoSelecionado,
  dadosEscolas,
  setDadosEscolas,
  dadosProdutos,
  setDadosProdutos,
}) => {
  return (
    <div className="mt-6 p-4 border rounded bg-white">
      <h2 className="text-lg font-bold mb-4">🛠️ Dados Mestres</h2>
      <div className="flex gap-4 mb-4">
        <button
          onClick={() => setTipoSelecionado('escolas')}
          className="px-4 py-2 bg-blue-600 text-white rounded"
        >
          Ponto de Venda
        </button>
        <button
          onClick={() => setTipoSelecionado('produtos')}
          className="px-4 py-2 bg-green-600 text-white rounded"
        >
          Produtos
        </button>
      </div>

      {tipoSelecionado === 'escolas' && (
        <EditorEscolas
          dadosEscolas={dadosEscolas}
          setDadosEscolas={setDadosEscolas}
        />
      )}
      {tipoSelecionado === 'produtos' && (
        <EditorProdutos
          dadosProdutos={dadosProdutos}
          setDadosProdutos={setDadosProdutos}
        />
      )}
    </div>
  );
};
// === FIM FN26 ===

// === INÍCIO FN27 – EditorEscolas (painel de edição de escolas) ===
const EditorEscolas = ({ dadosEscolas, setDadosEscolas }) => {
  return (
    <div>
      <h3 className="font-semibold mb-2">Pontos de Venda</h3>
      <p className="text-sm text-gray-600">
        🔧 Área em desenvolvimento: incluir edição, inativação e exclusão de escolas
      </p>
    </div>
  );
};
// === FIM FN27 ===

// === INÍCIO FN28 – EditorProdutos (painel de edição de produtos e sabores) ===
const EditorProdutos = ({ dadosProdutos, setDadosProdutos }) => {
  return (
    <div>
      <h3 className="font-semibold mb-2">Produtos</h3>
      <p className="text-sm text-gray-600">
        🔧 Área em desenvolvimento: incluir edição, inativação e exclusão de produtos e sabores
      </p>
    </div>
  );
};
// === FIM FN28 ===

// === INÍCIO FN29 – toggleMostrarDadosMestres ===
const toggleMostrarDadosMestres = () => {
  setMostrarDadosMestres((prev) => !prev);
};
// === FIM FN29 ===

// === INÍCIO RT99 – Bloco final de interface ===
return (
  <div className="bg-[#FFF3E9] min-h-screen p-4 text-sm font-sans text-[#5C1D0E]">
    <div className="max-w-xl mx-auto">
      <img src="/logo.png" alt="Dudunitê" className="w-48 mx-auto mb-4" />
      <h1 className="text-center text-xl font-bold mb-6">Lançamento de Pedidos - Dudunitê</h1>

      {/* === RT02 – Filtro por período === */}
      <div className="mb-6">
        <label className="font-semibold block mb-1">📆 Período:</label>
        <div className="flex items-center gap-2">
          <input type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} className="p-2 border rounded" />
          <span>até</span>
          <input type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)} className="p-2 border rounded" />
        </div>
      </div>

      {/* === RT03 – Campos do pedido === */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label>Cidade</label>
          <select value={cidade} onChange={(e) => setCidade(e.target.value)} className="w-full p-2 rounded border">
            <option value="">Selecione</option>
            {Object.keys(dadosEscolas).map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <div>
          <label>Escola</label>
          <select value={escola} onChange={(e) => setEscola(e.target.value)} className="w-full p-2 rounded border">
            <option value="">Selecione</option>
            {dadosEscolas[cidade]?.map((e) => (
              <option key={e} value={e}>{e}</option>
            ))}
          </select>
        </div>
        <div>
          <label>Produto</label>
          <select value={produto} onChange={(e) => setProduto(e.target.value)} className="w-full p-2 rounded border">
            <option value="">Selecione</option>
            {Object.keys(dadosProdutos).map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>
        <div>
          <label>Sabor</label>
          <select value={sabor} onChange={(e) => setSabor(e.target.value)} className="w-full p-2 rounded border">
            <option value="">Selecione</option>
            {dadosProdutos[produto]?.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        <div>
          <label>Qtd</label>
          <input
            type="number"
            min="1"
            value={quantidade}
            onChange={(e) => setQuantidade(Number(e.target.value))}
            className="w-full p-2 rounded border"
          />
        </div>
        <div className="flex items-end">
          <button
            onClick={() => {
              if (!produto || !sabor || quantidade <= 0) {
                alert("Preencha produto, sabor e quantidade.");
                return;
              }
              setItens([...itens, { produto, sabor, quantidade }]);
              setSabor('');
              setQuantidade(1);
            }}
            className="w-full bg-amber-600 text-white p-2 rounded hover:bg-amber-700"
          >
            ➕ Adicionar
          </button>
        </div>
      </div>

      {/* === RT04 – Lista de itens do pedido === */}
      {itens.length > 0 && (
        <div className="mb-6">
          <h2 className="font-semibold text-lg mb-2">Itens do Pedido:</h2>
          <ul className="list-disc pl-5">
            {itens.map((item, index) => (
              <li key={index}>{item.produto} - {item.sabor} - {item.quantidade} un</li>
            ))}
          </ul>
        </div>
      )}

      <button onClick={salvarPedido} className="bg-green-700 text-white px-4 py-2 rounded hover:bg-green-800 w-full mb-4">
        💾 Salvar Pedido
      </button>

      {/* === RT05 – Ações adicionais === */}
      <div className="flex flex-wrap justify-center gap-4 mt-6 mb-6">
        <button onClick={gerarPDF} className="bg-purple-700 text-white px-4 py-2 rounded hover:bg-purple-800">
          📋 Planejamento de Produção
        </button>
        <button onClick={gerarListaCompras} className="bg-blue-700 text-white px-4 py-2 rounded hover:bg-blue-800">
          🧾 Lista de Compras
        </button>
      </div>

      <div className="flex justify-center">
        <button onClick={toggleMostrarDadosMestres} className="bg-zinc-700 text-white px-4 py-2 rounded hover:bg-zinc-800">
          ⚙️ Dados Mestres
        </button>
      </div>

      {/* === RT06 – Painel de Dados Mestres === */}
      {mostrarDadosMestres && (
        <div className="mt-6">
          <PainelDadosMestres
            tipoSelecionado={tipoSelecionado}
            setTipoSelecionado={setTipoSelecionado}
            dadosEscolas={dadosEscolas}
            setDadosEscolas={setDadosEscolas}
            dadosProdutos={dadosProdutos}
            setDadosProdutos={setDadosProdutos}
          />
        </div>
      )}
    </div>
  </div>
);
};
// === FIM RT99 ===

export default App;

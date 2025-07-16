// === BLOCO 1 – Início ===
// FN01 – Importações Gerais
import React, { useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import {
  collection,
  addDoc,
  getDocs,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import db from './firebase';

// FN02 – Logomarca e Cores
const logoPath = "/LogomarcaDDnt2025Vazado.png";
const corPrimaria = "#8c3b1b";  // Terracota escuro
const corFundo = "#fff5ec";     // Terracota claro

// FN03 – Componente Principal: App
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
  const [pedidosFiltrados, setPedidosFiltrados] = useState([]);
  const [mostrarDadosMestres, setMostrarDadosMestres] = useState(false);
  const [novaEscola, setNovaEscola] = useState('');
  const [novoProduto, setNovoProduto] = useState('');
  const [novoSabor, setNovoSabor] = useState('');
  const [dadosEscolas, setDadosEscolas] = useState({});
  const [dadosProdutos, setDadosProdutos] = useState({});
  const [tipoSelecionado, setTipoSelecionado] = useState('');

  // Carregamento inicial de dados fixos (escolas e produtos)
  useEffect(() => {
    const escolasFixas = {
      "RECIFE": [
        "Tio Valter", "Vera Cruz", "Pinheiros", "Dourado",
        "BMQ", "CFC", "Madre de Deus", "Saber Viver"
      ],
      "CARUARU": [
        "Interativo", "Exato Sede", "Exato Anexo", "Sesi", "Motivo", "Jesus Salvador"
      ],
      "GRAVATÁ": [
        "Pequeno Príncipe", "Salesianas", "Céu Azul", "Russas",
        "Bora Gastar", "Kaduh", "Society Show", "Degusty"
      ]
    };

    const produtosFixos = {
      "BRW 7x7": [
        "Brigadeiro preto", "Brigadeiro c confete", "Ninho", "Ninho com nutella",
        "Beijinho", "Palha italiana", "Prestigio", "Oreo", "Paçoca",
        "Ovomaltine", "Bem casado"
      ],
      "BRW 6x6": [
        "Brigadeiro branco", "Brigadeiro branco c confete", "Brigadeiro preto",
        "Palha italiana", "Ninho", "Bem casado"
      ],
      "ESC": ["Brigadeiro branco", "Ninho com nutella", "Brigadeiro preto"],
      "PKT 5x5": ["Oreo", "Beijinho", "Brigadeiro preto"],
      "PKT 6x6": ["Prestigio", "Paçoca", "Brigadeiro branco"],
      "DUDU": ["Ninho com nutella", "Brigadeiro preto", "Beijinho"]
    };

    setDadosEscolas(escolasFixas);
    setDadosProdutos(produtosFixos);
  }, []);

// // FN04 – Carregar Pedidos do Firestore (com fallback de dataServidor e validação de Timestamp)
const fn04_carregarPedidos = async () => {
  try {
    const snapshot = await getDocs(collection(db, "pedidos"));

    const totalDocs = snapshot.docs.length;
    alert(`Total de documentos encontrados na coleção: ${totalDocs}`);

    if (totalDocs === 0) {
      alert("Nenhum pedido carregado.");
      setPedidos([]);
      setPedidosFiltrados([]);
      return;
    }

    const lista = snapshot.docs.map(doc => {
      const data = doc.data();
      let timestamp = data.timestamp;

      if (!timestamp && data.dataServidor?.seconds) {
        timestamp = new Timestamp(
          data.dataServidor.seconds,
          data.dataServidor.nanoseconds || 0
        );
      }

      if (!timestamp && typeof data.data === 'string') {
        const d = new Date(data.data);
        if (!isNaN(d.getTime()) && d.getFullYear() > 2000) {
          timestamp = Timestamp.fromDate(d);
        }
      }

      return {
        id: doc.id,
        ...data,
        timestamp,
      };
    }).filter(p => p.timestamp && typeof p.timestamp.toDate === 'function');

    setPedidos(lista);
    const filtrados = fn05_filtrarPedidos(lista, dataInicio, dataFim);
    setPedidosFiltrados(filtrados);
  } catch (err) {
    console.error("Erro ao carregar pedidos:", err);
    alert("Erro ao carregar pedidos do banco de dados.");
  }
};
  // FN05 – inicio
const fn05_filtrarPedidos = (lista, dataInicio, dataFim) => {
  let inicio = new Date(0); // 01/01/1970
  let fim = new Date(8640000000000000); // data máxima possível no JS (ano 275760)

  if (dataInicio) {
    const dInicio = new Date(`${dataInicio}T00:00:00`);
    if (!isNaN(dInicio.getTime())) inicio = dInicio;
  }

  if (dataFim) {
    const dFim = new Date(`${dataFim}T23:59:59.999`);
    if (!isNaN(dFim.getTime())) fim = dFim;
  }

  return lista.filter((p) => {
    if (!p.timestamp || typeof p.timestamp.toDate !== 'function') return false;

    const dataPedido = p.timestamp.toDate(); // Transforma timestamp Firebase em Date JS
    return dataPedido >= inicio && dataPedido <= fim;
  });
};
// FN06 – Adicionar Item ao Pedido
const fn06_adicionarItem = () => {
  if (!produto || !sabor || quantidade < 1) {
    alert("Preencha produto, sabor e uma quantidade válida.");
    return;
  }

  const novoItem = { produto, sabor, quantidade };
  setItens([...itens, novoItem]);

  // Limpa os campos para novo item
  setProduto('');
  setSabor('');
  setQuantidade(1);
};
// === FN07 – salvarPedido ===
const fn07_salvarPedido = async () => {
  if (!cidade || !escola || !produto || !sabor || quantidade <= 0) {
    alert("Preencha todos os campos e adicione pelo menos 1 item.");
    return;
  }

  try {
    const dataAtual = new Date();
    const itemAtual = {
      produto,
      sabor,
      quantidade: Number(quantidade)
    };

    const novoPedido = {
      cidade,
      escola,
      produto,
      data: dataAtual.toISOString(),
      dataServidor: dataAtual.toLocaleString("pt-BR", {
        timeZone: "America/Recife",
      }),
      itens: [itemAtual],
    };

    await addDoc(collection(db, "pedidos"), novoPedido);

    alert("Pedido salvo com sucesso!");
    setItens([]);
    setQuantidade(1);
  } catch (erro) {
    console.error("Erro ao salvar pedido:", erro);
    alert("Erro ao salvar pedido. Tente novamente.");
  }
};
// FN08 – Gerar Planejamento de Produção (PDF)
const fn08_gerarPlanejamentoProducao = () => {
  if (!pedidos.length) {
    alert("Nenhum pedido carregado.");
    return;
  }

  const pedidosFiltrados = fn05_filtrarPedidos(pedidos, dataInicio, dataFim);

  if (!pedidosFiltrados.length) {
    alert("Nenhum pedido encontrado para o período selecionado.");
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
    "DUDU":    null
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
  const nomePDF = `producao-${agora.toLocaleString("pt-BR").replace(/[^\d]/g, "-")}.pdf`;

  try {
    doc.save(nomePDF);
  } catch (erro) {
    alert('Erro ao tentar salvar o PDF. Use um navegador compatível.');
    console.error(erro);
  }
};

// FN09 – Gerar Lista de Compras (PDF)
const fn09_gerarListaCompras = () => {
  if (!pedidos.length) {
    alert("Nenhum pedido carregado.");
    return;
  }

  const pedidosFiltrados = fn05_filtrarPedidos(pedidos, dataInicio, dataFim);

  if (!pedidosFiltrados.length) {
    alert("Nenhum pedido encontrado para o período selecionado.");
    return;
  }

  const doc = new jsPDF();
  let y = 10;

  doc.setFont('courier', 'normal');
  doc.setFontSize(10);
  doc.text('Lista de Compras - Dudunitê', 10, y);
  y += 10;

  const insumos = {
    margarina: 0,
    ovos: 0,
    massas: 0,
    recheiosBrancos: 0,
    recheiosPretos: 0
  };

  const rendimentoPorProduto = {
    "BRW 7x7": 12,
    "BRW 6x6": 17,
    "PKT 5x5": 20,
    "PKT 6x6": 15,
    "ESC": 26
  };

  const rendimentoRecheio = {
    "BRW 7x7": { branco: 25, preto: 25 },
    "BRW 6x6": { branco: 35, preto: 35 },
    "PKT 5x5": { branco: 650 / 20, preto: 650 / 20 },
    "PKT 6x6": { branco: 650 / 30, preto: 650 / 30 },
    "ESC": { branco: 26, preto: 26 }
  };

  const saboresBrancos = [
    "Ninho", "Ninho com nutella", "Brigadeiro branco", "Oreo",
    "Ovomaltine", "Paçoca", "Brigadeiro branco c confete", "Beijinho"
  ];
  const saboresPretos = [
    "Brigadeiro preto", "Brigadeiro c confete", "Palha italiana", "Prestigio"
  ];

  pedidosFiltrados.forEach((pedido) => {
    pedido.itens.forEach(({ produto, sabor, quantidade }) => {
      const qtd = Number(quantidade);
      const rendimento = rendimentoPorProduto[produto];

      if (rendimento) {
        const tabuleiros = qtd / rendimento;
        insumos.margarina += tabuleiros * 76;
        insumos.ovos += tabuleiros * 190;
        insumos.massas += tabuleiros * 900;
      }

      const recheio = rendimentoRecheio[produto];
      if (recheio) {
        if (sabor === "Bem casado") {
          insumos.recheiosBrancos += qtd / (recheio.branco * 2);
          insumos.recheiosPretos += qtd / (recheio.preto * 2);
        } else if (saboresBrancos.includes(sabor)) {
          insumos.recheiosBrancos += qtd / recheio.branco;
        } else if (saboresPretos.includes(sabor)) {
          insumos.recheiosPretos += qtd / recheio.preto;
        }
      }
    });
  });

  doc.text('Insumos Básicos:', 10, y); y += 8;
  doc.text(`Margarina: ${insumos.margarina.toFixed(0)} g`, 12, y); y += 6;
  doc.text(`Ovos: ${Math.ceil(insumos.ovos / 60)} ovos (aprox. ${insumos.ovos.toFixed(0)} g)`, 12, y); y += 6;
  doc.text(`Massas (900g cada): ${Math.ceil(insumos.massas / 900)} massas`, 12, y); y += 8;

  doc.text('Recheios:', 10, y); y += 6;
  doc.text(`Bacias Branco: ${insumos.recheiosBrancos.toFixed(2)}`, 12, y); y += 6;
  doc.text(`Bacias Preto: ${insumos.recheiosPretos.toFixed(2)}`, 12, y); y += 6;

  const agora = new Date();
  const nomePDF = `lista-compras-${agora.toLocaleString("pt-BR").replace(/[^\d]/g, "-")}.pdf`;

  try {
    doc.save(nomePDF);
  } catch (erro) {
    alert('Erro ao tentar salvar o PDF.');
    console.error(erro);
  }
};
  // FN10 – Salvar Dados Mestres no Firestore
  const fn10_salvarDadosMestres = async () => {
    if (!cidade || !escola || !produto || !sabor) {
      alert("Preencha cidade, escola, produto e sabor.");
      return;
    }

    const novoItem = {
      cidade,
      escola,
      produto,
      sabor,
      data: serverTimestamp()
    };

    try {
      await addDoc(collection(db, "dadosMestres"), novoItem);
      alert("Item salvo nos Dados Mestres!");
    } catch (erro) {
      console.error("Erro ao salvar dados mestres:", erro);
      alert("Erro ao salvar item. Tente novamente.");
    }
  };

  // FN11 – Painel Dados Mestres
  const fn11_PainelDadosMestres = ({
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
          <fn12_EditorEscolas
            dadosEscolas={dadosEscolas}
            setDadosEscolas={setDadosEscolas}
          />
        )}
        {tipoSelecionado === 'produtos' && (
          <fn13_EditorProdutos
            dadosProdutos={dadosProdutos}
            setDadosProdutos={setDadosProdutos}
          />
        )}
      </div>
    );
  };

  // FN12 – Editor de Escolas
  const fn12_EditorEscolas = ({ dadosEscolas, setDadosEscolas }) => {
    return (
      <div>
        <h3 className="font-semibold mb-2">Pontos de Venda</h3>
        <p className="text-sm text-gray-600">
          🔧 Área em desenvolvimento: incluir edição, inativação e exclusão de escolas
        </p>
      </div>
    );
  };

  // FN13 – Editor de Produtos
  const fn13_EditorProdutos = ({ dadosProdutos, setDadosProdutos }) => {
    return (
      <div>
        <h3 className="font-semibold mb-2">Produtos</h3>
        <p className="text-sm text-gray-600">
          🔧 Área em desenvolvimento: incluir edição, inativação e exclusão de produtos e sabores
        </p>
      </div>
    );
  };

  // FN14 – Alternar Painel de Dados Mestres
  const fn14_toggleDadosMestres = () => {
    setMostrarDadosMestres(!mostrarDadosMestres);
  };

// FN15 – Calcular Total de Itens do Pedido
const fn15_totalItens = itens.reduce((total, item) => total + Number(item.quantidade), 0);
// FN16 – Reconstruir Dados Mestres a partir dos Pedidos (desativado por padrão)
  const fn16_reconstruirDadosMestresViaPedidos = async () => {
    try {
      const snapshot = await getDocs(collection(db, "pedidos"));
      const lista = snapshot.docs.map(doc => doc.data());

      const escolasMapeadas = {};
      const produtosMapeados = {};

      lista.forEach((pedido) => {
        const cidade = pedido.cidade;
        const escola = pedido.escola;

        if (cidade && escola) {
          if (!escolasMapeadas[cidade]) escolasMapeadas[cidade] = [];
          if (!escolasMapeadas[cidade].includes(escola)) {
            escolasMapeadas[cidade].push(escola);
          }
        }

        if (Array.isArray(pedido.itens)) {
          pedido.itens.forEach(({ produto, sabor }) => {
            if (produto && sabor) {
              if (!produtosMapeados[produto]) produtosMapeados[produto] = [];
              if (!produtosMapeados[produto].includes(sabor)) {
                produtosMapeados[produto].push(sabor);
              }
            }
          });
        }
      });

      setDadosEscolas(prev => ({ ...prev, ...escolasMapeadas }));
      setDadosProdutos(prev => ({ ...prev, ...produtosMapeados }));
    } catch (err) {
      console.error("Erro ao reconstruir dados mestres via pedidos:", err);
    }
  };

  // FN17 – Carregar Dados Mestres via Firestore
  const fn17_carregarDadosMestres = async () => {
    try {
      const snapshot = await getDocs(collection(db, "dadosMestres"));
      const lista = snapshot.docs
        .map((doc) => doc.data())
        .filter((item) =>
          item.cidade && item.escola && item.produto && item.sabor
        );

      if (lista.length === 0) {
        console.warn("⚠️ Nenhum dado válido encontrado na coleção dadosMestres.");
        fn16_reconstruirDadosMestresViaPedidos(); // fallback
        return;
      }

      const escolasMapeadas = {};
      const produtosMapeados = {};

      lista.forEach((item) => {
        if (!escolasMapeadas[item.cidade]) escolasMapeadas[item.cidade] = [];
        if (!escolasMapeadas[item.cidade].includes(item.escola)) {
          escolasMapeadas[item.cidade].push(item.escola);
        }

        if (!produtosMapeados[item.produto]) produtosMapeados[item.produto] = [];
        if (!produtosMapeados[item.produto].includes(item.sabor)) {
          produtosMapeados[item.produto].push(item.sabor);
        }
      });

      setDadosEscolas(prev => ({ ...prev, ...escolasMapeadas }));
      setDadosProdutos(prev => ({ ...prev, ...produtosMapeados }));
    } catch (error) {
      alert("❌ Erro ao carregar dados mestres");
      console.error("Erro Firebase:", error);
      fn16_reconstruirDadosMestresViaPedidos(); // fallback
    }
  };

  // FN18 – Limpar Formulário de Pedido
  const fn18_limparFormulario = () => {
    setCidade('');
    setEscola('');
    setProduto('');
    setSabor('');
    setQuantidade(1);
    setItens([]);
  };

  // FN19 – Calcular Quantidade Total por Produto (usado em relatórios)
  const fn19_agruparPorProduto = (pedidos) => {
    const agrupado = {};
    pedidos.forEach(pedido => {
      pedido.itens.forEach(({ produto, quantidade }) => {
        if (!agrupado[produto]) agrupado[produto] = 0;
        agrupado[produto] += Number(quantidade);
      });
    });
    return agrupado;
  };

  // FN20 – Calcular Quantidade Total por Sabor
  const fn20_agruparPorSabor = (pedidos) => {
    const agrupado = {};
    pedidos.forEach(pedido => {
      pedido.itens.forEach(({ sabor, quantidade }) => {
        if (!agrupado[sabor]) agrupado[sabor] = 0;
        agrupado[sabor] += Number(quantidade);
      });
    });
    return agrupado;
  };

  // FN21 – Agrupar por Escola
  const fn21_agruparPorEscola = (pedidos) => {
    const agrupado = {};
    pedidos.forEach(pedido => {
      if (!agrupado[pedido.escola]) agrupado[pedido.escola] = 0;
      pedido.itens.forEach(item => {
        agrupado[pedido.escola] += Number(item.quantidade);
      });
    });
    return agrupado;
  };

  // FN22 – Agrupar por Cidade
  const fn22_agruparPorCidade = (pedidos) => {
    const agrupado = {};
    pedidos.forEach(pedido => {
      if (!agrupado[pedido.cidade]) agrupado[pedido.cidade] = 0;
      pedido.itens.forEach(item => {
        agrupado[pedido.cidade] += Number(item.quantidade);
      });
    });
    return agrupado;
  };
  
  return (
    <div className="bg-[#FFF3E9] min-h-screen p-4 text-sm font-sans text-[#5C1D0E]">
      <div className="max-w-xl mx-auto">
        <img src="/logo.png" alt="Dudunitê" className="w-48 mx-auto mb-4" />
        <h1 className="text-center text-xl font-bold mb-6">Lançamento de Pedidos - Dudunitê</h1>

        {/* === RT02 – Filtro por período === */}
        <div className="mb-6">
          <label className="font-semibold block mb-1">📆 Período:</label>
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={dataInicio}
              onChange={(e) => setDataInicio(e.target.value)}
              className="p-2 border rounded"
            />
            <span>até</span>
            <input
              type="date"
              value={dataFim}
              onChange={(e) => setDataFim(e.target.value)}
              className="p-2 border rounded"
            />
          </div>
        </div>

{/* === RT03 – Campos do Pedido === */}
<div className="grid grid-cols-2 gap-4 mb-4">
  <div>
    <label>Cidade</label>
    <select
      value={cidade}
      onChange={(e) => setCidade(e.target.value)}
      className="w-full p-2 rounded border"
    >
      <option value="">Selecione</option>
      {Object.keys(dadosEscolas).map((c) => (
        <option key={c} value={c}>{c}</option>
      ))}
    </select>
  </div>
  <div>
    <label>Escola</label>
    <select
      value={escola}
      onChange={(e) => setEscola(e.target.value)}
      className="w-full p-2 rounded border"
    >
      <option value="">Selecione</option>
      {dadosEscolas[cidade]?.map((e) => (
        <option key={e} value={e}>{e}</option>
      ))}
    </select>
  </div>
  <div>
    <label>Produto</label>
    <select
      value={produto}
      onChange={(e) => setProduto(e.target.value)}
      className="w-full p-2 rounded border"
    >
      <option value="">Selecione</option>
      {Object.keys(dadosProdutos).map((p) => (
        <option key={p} value={p}>{p}</option>
      ))}
    </select>
  </div>
  <div>
    <label>Sabor</label>
    <select
      value={sabor}
      onChange={(e) => setSabor(e.target.value)}
      className="w-full p-2 rounded border"
    >
      <option value="">Selecione</option>
      {dadosProdutos[produto]?.map((s) => (
        <option key={s} value={s}>{s}</option>
      ))}
    </select>
  </div>
  <div>
    <label>Quantidade</label>
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
      onClick={fn06_adicionarItem}
      className="bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700 w-full"
    >
      ➕ Adicionar Item
    </button>
  </div>
</div>
{/* === Final da RT03 === */}

{/* === RT04 – Lista de Itens e botão Salvar Pedido === */}
{itens.length > 0 && (
  <div className="mb-6">
    <h2 className="font-semibold text-lg mb-2">Itens do Pedido ({fn15_totalItens} un):</h2>
    <ul className="list-disc pl-5">
      {itens.map((item, index) => (
        <li key={index}>
          {item.produto} - {item.sabor} - {item.quantidade} un
        </li>
      ))}
    </ul>
  </div>
)}

<button
  onClick={fn07_salvarPedido}
  className="bg-green-700 text-white px-4 py-2 rounded hover:bg-green-800 w-full mb-4"
>
  💾 Salvar Pedido
</button>
{/* === Final da RT04 === */}

        {/* === RT05 – Ações adicionais === */}
        <div className="flex flex-wrap justify-center gap-4 mt-6 mb-6">
          <button
            onClick={fn08_gerarPlanejamentoProducao}
            className="bg-purple-700 text-white px-4 py-2 rounded hover:bg-purple-800"
          >
            📋 Planejamento de Produção
          </button>
          <button
            onClick={fn09_gerarListaCompras}
            className="bg-blue-700 text-white px-4 py-2 rounded hover:bg-blue-800"
          >
            🧾 Lista de Compras
          </button>
          <button
            onClick={fn14_toggleDadosMestres}
            className="bg-gray-700 text-white px-4 py-2 rounded hover:bg-gray-800"
          >
            ⚙️ Dados Mestres
          </button>
        </div>

        {/* === RT06 – Painel Dados Mestres === */}
        {mostrarDadosMestres && (
          <div className="mt-6">
            <fn11_PainelDadosMestres
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

export default App;

// Bloco 1 – Importações e Constantes Globais



// Fn01 – Importações Gerais

Import React, { useState, useEffect } from ‘react’;

Import jsPDF from ‘jspdf’;

Import {

  Collection,

  addDoc,

  getDocs,

  serverTimestamp,

  query,

  where,

  Timestamp,

} from “firebase/firestore”;

Import db from ‘./firebase’;



// Fn02 – Logomarca e Cores

Const logoPath = “/LogomarcaDDnt2025Vazado.png”;

Const corPrimaria = “#8c3b1b”;  // Terracota escuro

Const corFundo = “#fff5ec”;     // Terracota claro

// FN02 – FINAL//

// ✅ FN03 – gerarPDF (Planejamento de Produção) – AJUSTE PARA CELULAR E ERROS SILENCIOSOS

Const gerarPDF = () => {

  Const pedidosFiltrados = filtrarPedidosPorData();



  If (!pedidosFiltrados.length) {

    Alert(‘Nenhum pedido encontrado para o período selecionado.’);

    Return;

  }



  Const doc = new jsPDF();

  Let y = 10;



  Doc.setFont(‘courier’, ‘normal’);

  Doc.setFontSize(10);

  Doc.text(‘Planejamento de Produção – Dudunitê’, 10, y);

  Y += 10;



  Const rendimentoPorProduto = {

    “BRW 7x7”: { tabuleiro: 12, bacia: { branco: 25, preto: 25 } },

    “BRW 6x6”: { tabuleiro: 17, bacia: { branco: 35, preto: 35 } },

    “PKT 5x5”: { tabuleiro: 20, bacia: { branco: 650 / 20, preto: 650 / 20 } },

    “PKT 6x6”: { tabuleiro: 15, bacia: { branco: 650 / 30, preto: 650 / 30 } },

    “ESC”:     { tabuleiro: 26, bacia: { branco: 26, preto: 26 } },

    “DUDU”:    { tabuleiro: 100, bacia: { branco: 100, preto: 100 } }

  };



  Const saboresBrancos = [

    “Ninho”, “Ninho com nutella”, “Brigadeiro branco”, “Oreo”,

    “Ovomaltine”, “Paçoca”, “Brigadeiro branco c confete”, “Beijinho”

  ];

  Const saboresPretos = [

    “Brigadeiro preto”, “Brigadeiro c confete”, “Palha italiana”, “Prestigio”

  ];



  Const tabuleiros = {};

  Const bacias = { branco: 0, preto: 0 };



  pedidosFiltrados.forEach((pedido) => {

    try {

      const dataFormatada = pedido.timestamp?.toDate?.()?.toLocaleDateString?.(“pt-BR”) || “Data inválida”;



      doc.text(`Escola: ${pedido.escola || ‘---‘}`, 10, y); y += 6;

      doc.text(`Cidade: ${pedido.cidade || ‘---‘}`, 10, y); y += 6;

      doc.text(`Data: ${dataFormatada}`, 10, y); y += 6;

      doc.text(‘Itens:’, 10, y); y += 6;



      pedido.itens.forEach(({ produto, sabor, quantidade }) => {

        const qtd = Number(quantidade);

        doc.text(`${produto} - ${sabor} - ${qtd} um`, 12, y); y += 6;



        const rend = rendimentoPorProduto[produto];

        if (!rend) return;



        if (!tabuleiros[produto]) tabuleiros[produto] = 0;

        tabuleiros[produto] += qtd / rend.tabuleiro;



        if (sabor === “Bem casado”) {

          bacias.branco += qtd / (rend.bacia.branco * 2);

          bacias.preto += qtd / (rend.bacia.preto * 2);

        } else if (saboresBrancos.includes(sabor)) {

          Bacias.branco += qtd / rend.bacia.branco;

        } else if (saboresPretos.includes(sabor)) {

          Bacias.preto += qtd / rend.bacia.preto;

        }

      });



      Y += 4;

      If (y >= 270) {

        Doc.addPage();

        Y = 10;

      }

    } catch (erro) {

      Console.error(‘Erro ao processar pedido:’, pedido, erro);

    }

  });



  Doc.addPage(); y = 10;

  Doc.text(‘--- RESUMO DE PRODUÇÃO ---‘, 10, y); y += 8;



  Doc.text(‘TABULEIROS:’, 10, y); y += 6;

  Object.entries(tabuleiros).forEach(([produto, qtd]) => {

    Doc.text(`${produto}: ${qtd.toFixed(2)} tabuleiros`, 12, y); y += 6;

  });



  Y += 4;

  Doc.text(‘RECHEIOS:’, 10, y); y += 6;

  Doc.text(`Branco: ${bacias.branco.toFixed(2)} bacias`, 12, y); y += 6;

  Doc.text(`Preto: ${bacias.preto.toFixed(2)} bacias`, 12, y); y += 6;



  Const agora = new Date();

  Const dia = String(agora.getDate()).padStart(2, ‘0’);

  Const mês = String(agora.getMonth() + 1).padStart(2, ‘0’);

  Const ano = agora.getFullYear();

  Const hora = String(agora.getHours()).padStart(2, ‘0’);

  Const minuto = String(agora.getMinutes()).padStart(2, ‘0’);

  Const nomePDF = `producao-${dia}-${mês}-${ano}-${hora}h${minuto}.pdf`;



  Try {

    Doc.save(nomePDF);

  } catch (erro) {

    Alert(‘Erro ao tentar salvar o PDF. Experimente usar um navegador em modo desktop.’);

    Console.error(erro);

  }

};

// === FIM FN03 ===

// Bloco 2 – Estados e Funções Iniciais

// Fn04 – Estados Gerais do App

Const App = () => {

  Const [cidade, setCidade] = useState(‘’);

  Const [escola, setEscola] = useState(‘’);

  Const [produto, setProduto] = useState(‘’);

  Const [sabor, setSabor] = useState(‘’);

  Const [quantidade, setQuantidade] = useState(1);

  Const [itens, setItens] = useState([]);

  Const [pedidos, setPedidos] = useState([]);

  Const [dataInicio, setDataInicio] = useState(‘’);

  Const [dataFim, setDataFim] = useState(‘’);

  Const [filtroDia, setFiltroDia] = useState(‘’);

  Const [filtroMes, setFiltroMes] = useState(‘’);

  Const [pedidosFiltrados, setPedidosFiltrados] = useState([]);

  Const [mostrarDadosMestres, setMostrarDadosMestres] = useState(false);

  Const [novaEscola, setNovaEscola] = useState(‘’);

  Const [novoProduto, setNovoProduto] = useState(‘’);

  Const [novoSabor, setNovoSabor] = useState(‘’);



// ✅ FN04b – carregarPedidos: busca pedidos e aplica filtro com compatibilidade retroativa

// ✅ FN04b – carregarPedidos: valida timestamps e exclui pedidos malformados

Const carregarPedidos = async () => {

  Try {

    Const snapshot = await getDocs(collection(db, “pedidos”));

    Const lista = snapshot.docs.map(doc => {

      Const data = doc.data();



      Let timestamp = data.timestamp;



      // Compatibilidade com pedidos antigos

      If (!timestamp && data.dataServidor?.seconds) {

        Timestamp = new Timestamp(

          Data.dataServidor.seconds,

          Data.dataServidor.nanoseconds || 0

        );

      }



      If (!timestamp && typeof data.data === ‘string’) {

        Const d = new Date(data.data);

        If (!isNaN(d.getTime()) && d.getFullYear() > 2000 && d.getFullYear() < 2100) {

          Timestamp = Timestamp.fromDate(d);

        }

      }



      Return {

        Id: doc.id,

        ...data,

        Timestamp // pode ainda ser null se inválido

      };

    })

    // 🔍 EXCLUI explicitamente os pedidos sem timestamp válido

    .filter(p => p.timestamp && typeof p.timestamp.toDate === ‘function’);



    setPedidos(lista);



    const filtrados = fn05_filtrarPedidos(lista, dataInicio, dataFim);

    setPedidosFiltrados(filtrados);

  } catch (err) {

    Console.error(“Erro ao carregar pedidos:”, err);

    Alert(“Erro ao carregar pedidos do banco de dados.”);

  }

};

// ✅ FN04b – FIM (atualizada com filtro forte)

  // 👇 A partir daqui seguem os useEffect, funções etc., tudo dentro do App



// === INÍCIO FN05 – Filtrar Pedidos com Intervalo Seguro (1900–2050) ===

Function fn05_filtrarPedidos(pedidos, dataInicio, dataFim) {

  If (!Array.isArray(pedidos)) return [];



  Const parseData = (data, isInicio) => {

    If (!data) {

      Return isInicio

        ? new Date(‘1900-01-01T00:00:00’)

        : new Date(‘2050-12-31T23:59:59.999’);

    }



    Const parsed = new Date(data);

    If (isNaN(parsed)) {

      Return isInicio

        ? new Date(‘1900-01-01T00:00:00’)

        : new Date(‘2050-12-31T23:59:59.999’);

    }



    Parsed.setHours(isInicio ? 0 : 23, isInicio ? 0 : 59, isInicio ? 0 : 59, isInicio ? 0 : 999);

    Return parsed;

  };



  Const dataLimiteInicio = parseData(dataInicio, true);

  Const dataLimiteFim = parseData(dataFim, false);



  Return pedidos.filter((pedido) => {

    If (!pedido.timestamp || typeof pedido.timestamp.toDate !== ‘function’) return false;

    Const dataPedido = pedido.timestamp.toDate();

    Return dataPedido >= dataLimiteInicio && dataPedido <= dataLimiteFim;

  });

}

// === FIM FN05 ===

// Fn06 – Formata data ISSO para DD/MM/AAAA

Const formatarData = (isoString) => {

  Const data = new Date(isoString);

  Return data.toLocaleDateString(‘pt-BR’);

};



// Bloco 3 – Effects e Lógica Visual de Dados Mestres



// Fn07 – useEffect: Carrega pedidos ao selecionar intervalo de datas

useEffect(() => {

  if (dataInicio && dataFim) {

    carregarPedidos();

  }

}, [dataInicio, dataFim]);



// Fn08 – useEffect: Carrega todos os pedidos na carga inicial se sem filtro

useEffect(() => {

  if (!dataInicio && !dataFim) {

    carregarPedidos();

  }

}, []);



// Fn09 – toggleDadosMestres: exibe ou oculta seção de dados mestres

Const toggleDadosMestres = () => {

  setMostrarDadosMestres(!mostrarDadosMestres);

};



// Bloco 4 – Adicionar e Salvar Pedidos



// Fn10 – adicionarItem: adiciona item ao pedido com validação

Const adicionarItem = () => {

  If (!produto || !sabor || !quantidade || quantidade <= 0) {

    Alert(“Preencha todos os campos corretamente.”);

    Return;

  }

  setItens([...itens, { produto, sabor, quantidade: Number(quantidade) }]);

  setSabor(‘’);

  setQuantidade(1);

};



// Fn11 – salvarPedido: envia pedido ao Firestore com validações

Const salvarPedido = async () => {

  If (!cidade || !escola || itens.length === 0) {

    Alert(‘Preencha todos os campos antes de salvar.’);

    Return;

  }



  Const agora = new Date();



  Const novoPedido = {

    Cidade,

    Escola,

    Itens,

    Data: agora.toISOString(),

    dataServidor: serverTimestamp()

  };



  Try {

    Await addDoc(collection(db, “pedidos”), novoPedido);

    setPedidos([...pedidos, novoPedido]);



    setCidade(‘’);

    setEscola(‘’);

    setProduto(‘’);

    setSabor(‘’);

    setQuantidade(1);

    setItens([]);



    alert(‘✅ Pedido salvo com sucesso!’);

  } catch (error) {

    Console.error(“Erro ao salvar:”, error);

    Alert(‘❌ Falha ao salvar pedido.’);

  }

};



// Fn12 – totalItens: totaliza a quantidade atual do pedido em andamento

Const totalItens = itens.reduce((soma, item) => soma + item.quantidade, 0);



// Bloco 5 – Estrutura para cálculo de insumos e embalagens



// Fn13 – Estruturas iniciais para PDF, insumos e embalagens

Const insumos = {

  Margarina: 0,

  Ovos: 0,

  Massas: 0,

  recheiosPretos: 0,

  recheiosBrancos: 0,

  nutella: 0,

  dudus: 0

};



Const embalagens = {

  G650: 0,

  G640: 0,

  SQ5x5: 0,

  SQ6x6: 0,

  SQ30x5: 0,

  SQ22x6: 0,

  D135: 0,

  EtiqBrw: 0,

  EtiqDD: 0,

  EtiqEsc: 0

};



// Bloco 6 – Geração do PDF de Planejamento de Produção

// Bloco 9 – Funções auxiliares: filtros, dados mestres, toggle

// === INÍCIO FN15 – gerarListaCompras (com recheios) ===

Const gerarListaCompras = () => {

  Const pedidosFiltrados = filtrarPedidosPorData();

  Const doc = new jsPDF();

  Let y = 10;



  Doc.setFont(‘courier’, ‘normal’);

  Doc.setFontSize(10);

  Doc.text(‘Lista de Compras – Dudunitê’, 10, y);

  Y += 10;



  Const insumos = {

    Margarina: 0,

    Ovos: 0,

    Massas: 0,

    Nutella: 0,

    Leite: 0,

    misturaLactea: 0,

    leiteEmPo: 0,

    leiteCondensado: 0,

    cremeDeLeite: 0,

    glucose: 0,

    nescau: 0

  };



  Const embalagens = {

    G650: 0, G640: 0, SQ5x5: 0, SQ6x6: 0, D135: 0,

    SQ30x5: 0, SQ22x6: 0,

    EtiqBrw: 0, EtiqEsc: 0, EtiqDD: 0

  };



  Const saboresRecheioBranco = [

    “Ninho”, “Ninho com nutella”, “Brigadeiro branco”, “Oreo”, “Ovomaltine”,

    “Paçoca”, “Brigadeiro branco c confete”, “Beijinho”

  ];

  Const saboresRecheioPreto = [

    “Brigadeiro preto”, “Brigadeiro c confete”, “Palha italiana”, “Prestigio”

  ];



  Const alertaExtras = new Set();



  Let baciasBranco = 0;

  Let baciasPreto = 0;



  pedidosFiltrados.forEach(p => {

    p.itens.forEach(({ produto, sabor, quantidade }) => {

      const qtd = Number(quantidade);



      // === Produção base ===

      Const add = (m, o, f, bem, etiq) => {

        Insumos.margarina += 76 * (qtd / m);

        Insumos.ovos += 190 * (qtd / o);

        Insumos.massas += 2 * (qtd / f);

        If (bem) embalagens[bem] += qtd;

        If (etiq) embalagens[etiq] += qtd;

      };



      If (produto === “BRW 7x7”) add(12, 12, 12, “G650”, “EtiqBrw”);

      If (produto === “BRW 6x6”) add(17, 17, 17, “G640”, “EtiqBrw”);

      If (produto === “PKT 5x5”) add(20, 20, 20, “SQ5x5”, “EtiqBrw”);

      If (produto === “PKT 6x6”) add(15, 15, 15, “SQ6x6”, “EtiqBrw”);

      If (produto === “ESC”)     add(26, 26, 26, “D135”, “EtiqEsc”);



      If (produto === “DUDU”) {

        Embalagens.SQ30x5 += qtd;

        Embalagens.SQ22x6 += qtd;

        Embalagens.EtiqDD += qtd;

        Insumos.leite += qtd / 10;

        Insumos.misturaLactea += qtd / 10;

        Insumos.leiteEmPo += qtd / 20;

      }



      // === Nutella ===

      If (sabor === “Ninho com nutella”) {

        If (produto === “BRW 7x7”) insumos.nutella += qtd / 60;

        If (produto === “BRW 6x6”) insumos.nutella += qtd / 85;

        If (produto === “ESC”)     insumos.nutella += qtd / 70;

        If (produto === “DUDU”)    insumos.nutella += qtd / 100;

      }



      // === Recheios ===

      Let unidadesPorBacia = 1;

      If (produto === “BRW 7x7”) unidadesPorBacia = 25;

      If (produto === “BRW 6x6”) unidadesPorBacia = 35;

      If (produto === “ESC”)     unidadesPorBacia = 26;

      If (produto === “PKT 5x5”) unidadesPorBacia = 650 / 20;

      If (produto === “PKT 6x6”) unidadesPorBacia = 650 / 30;

      If (produto === “DUDU”)    unidadesPorBacia = 1e6; // ignorar



      Const bacias = qtd / unidadesPorBacia;



      If (saboresRecheioBranco.includes(sabor)) {

        baciasBranco += bacias;

      } else if (saboresRecheioPreto.includes(sabor)) {

        baciasPreto += bacias;

      } else if (sabor === “Bem casado”) {

        baciasBranco += bacias / 2;

        baciasPreto += bacias / 2;

      }



      // === Ingredientes adicionais ===

      Const saborLower = sabor.toLowerCase();

      If (saborLower.includes(“confete”)) alertaExtras.add(“coloreti”);

      If (saborLower.includes(“beijinho”) || saborLower.includes(“prestigio”)) alertaExtras.add(“coco ralado”);

      If (saborLower.includes(“palha”)) alertaExtras.add(“biscoito maisena”);

    });

  });



  // === Insumos de recheios ===

  Const baciasTotais = Math.ceil(baciasBranco + baciasPreto);

  Insumos.leiteCondensado += Math.ceil((baciasTotais * 4));

  Insumos.cremeDeLeite += Math.ceil((baciasTotais * 650));

  Insumos.glucose += Math.ceil((baciasTotais / 6) * 500);

  Insumos.nescau += Math.ceil(baciasPreto * 361);



  // === Página 1 – Insumos ===

  Doc.text(‘--- INSUMOS ---‘, 10, y); y += 8;

  Doc.text(`Margarina: ${insumos.margarina.toFixed(0)}g`, 10, y); y += 6;

  Doc.text(`Ovos: ${(insumos.ovos / 60).toFixed(0)} um`, 10, y); y += 6;

  Doc.text(`Massas (450g): ${insumos.massas.toFixed(0)} um`, 10, y); y += 6;

  Doc.text(`Nutella (650g): ${Math.ceil(insumos.nutella)} um`, 10, y); y += 6;



  Doc.text(`Leite (L): ${insumos.leite.toFixed(1)} L`, 10, y); y += 6;

  Doc.text(`Mistura Láctea: ${Math.ceil(insumos.misturaLactea)} um`, 10, y); y += 6;

  Doc.text(`Leite em Pó: ${Math.ceil(insumos.leiteEmPo)} um`, 10, y); y += 6;



  Doc.text(`Leite Condensado: ${insumos.leiteCondensado} um`, 10, y); y += 6;

  Doc.text(`Creme de Leite: ${insumos.cremeDeLeite} g`, 10, y); y += 6;

  Doc.text(`Glucose: ${insumos.glucose} g`, 10, y); y += 6;

  Doc.text(`Nescau: ${insumos.nescau} g`, 10, y); y += 10;



  Doc.addPage(); y = 10;

  Doc.text(‘--- EMBALAGENS ---‘, 10, y); y += 8;

  Object.entries(embalagens).forEach(([codigo, qtd]) => {

    Doc.text(`${codigo}: ${Math.ceil(qtd)} um`, 10, y);

    Y += 6;

  });



  // === Mensagem extra ===

  If (alertaExtras.size > 0) {

    Y += 10;

    Doc.text(‘⚠️ Itens adicionais necessários:’, 10, y); y += 6;

    alertaExtras.forEach(item => {

      doc.text(`- ${item}`, 10, y);

      y += 6;

    });

  }



  Const agora = new Date();

  Const dia = String(agora.getDate()).padStart(2, ‘0’);

  Const mês = String(agora.getMonth() + 1).padStart(2, ‘0’);

  Const ano = agora.getFullYear();

  Const hora = String(agora.getHours()).padStart(2, ‘0’);

  Const minuto = String(agora.getMinutes()).padStart(2, ‘0’);

  Const nomePDF = `lista-compras-${dia}-${mês}-${ano}-${hora}h${minuto}.pdf`;



  Doc.save(nomePDF);

};

// === FIM FN15 ===

// ✅ FN16 – filtrarPedidosPorData (VERSÃO AJUSTADA PARA PEGAR TODOS OS PEDIDOS QUANDO DATAS VAZIAS)

Const filtrarPedidosPorData = () => {

  Let inicio = new Date(0); // início muito antigo

  Let fim = new Date(8640000000000000); // fim muito distante



  If (dataInicio) {

    Const dInicio = new Date(`${dataInicio}T00:00:00`);

    If (!isNaN(dInicio.getTime())) {

      Inicio = dInicio;

    }

  }



  If (dataFim) {

    Const dFim = new Date(`${dataFim}T23:59:59.999`);

    If (!isNaN(dFim.getTime())) {

      Fim = dFim;

    }

  }



  Return pedidos.filter((p) => {

    If (!p.timestamp || typeof p.timestamp.toDate !== ‘function’) return false;

    Const dataPedido = p.timestamp.toDate();

    Return dataPedido >= inicio && dataPedido <= fim;

  });

};

// === FIM FN16 ===

// Fn17 – salvarDadosMestres: grava dados manuais como cidade, escola, produto, sabor

Const salvarDadosMestres = async () => {

  Const novoItem = {

    Cidade,

    Escola,

    Produto,

    Sabor,

    Data: serverTimestamp()

  };

  Await addDoc(collection(db, “dadosMestres”), novoItem);

  Alert(“Item salvo nos Dados Mestres!”);

};

//FN17 – FINAL//

// === INÍCIO FN18 – toggleMostrarDadosMestres ===

Const toggleMostrarDadosMestres = () => {

  setMostrarDadosMestres((prev) => !prev);

};

// === FIM FN18 ===



// === INÍCIO FN19 – PainelDadosMestres ===

Const PainelDadosMestres = ({

  tipoSelecionado,

  setTipoSelecionado,

  dadosEscolas,

  setDadosEscolas,

  dadosProdutos,

  setDadosProdutos,

}) => {

  Return (

    <div className=”mt-6 p-4 border rounded bg-white”>

      <h2 className=”text-lg font-bold mb-4”>🛠️ Dados Mestres</h2>

      <div className=”flex gap-4 mb-4”>

        <button

          onClick={() => setTipoSelecionado(‘escolas’)}

          className=”px-4 py-2 bg-blue-600 text-white rounded”

        >

          Ponto de Venda

        </button>

        <button

          onClick={() => setTipoSelecionado(‘produtos’)}

          className=”px-4 py-2 bg-green-600 text-white rounded”

        >

          Produtos

        </button>

      </div>



      {tipoSelecionado === ‘escolas’ && (

        <EditorEscolas

          dadosEscolas={dadosEscolas}

          setDadosEscolas={setDadosEscolas}

        />

      )}

      {tipoSelecionado === ‘produtos’ && (

        <EditorProdutos

          dadosProdutos={dadosProdutos}

          setDadosProdutos={setDadosProdutos}

        />

      )}

    </div>

  );

};

// === FIM FN19 ===



// === INÍCIO FN20 – EditorEscolas ===

Const EditorEscolas = ({ dadosEscolas, setDadosEscolas }) => {

  Return (

    <div>

      <h3 className=”font-semibold mb-2”>Pontos de Venda</h3>

      <p className=”text-sm text-gray-600”>

        🔧 Área em desenvolvimento: incluir edição, inativação e exclusão de escolas

      </p>

    </div>

  );

};

// === FIM FN20 ===



// === INÍCIO FN21 – EditorProdutos ===

Const EditorProdutos = ({ dadosProdutos, setDadosProdutos }) => {

  Return (

    <div>

      <h3 className=”font-semibold mb-2”>Produtos</h3>

      <p className=”text-sm text-gray-600”>

        🔧 Área em desenvolvimento: incluir edição, inativação e exclusão de produtos e sabores

      </p>

    </div>

  );

};

// === FIM FN21 ===



// === INÍCIO FN22 – Buscar dados mestres (DESATIVADA) ===

// useEffect(() => {

//   const buscarDadosMestres = async () => {

//     const colRef = collection(db, “dados_mestres”);

//     const snapshot = await getDocs(colRef);

//     const dadosFirestore = {};

//     snapshot.forEach(doc => {

//       const data = doc.data();

//       if (data.cidade && data.escolas) {

//         dadosFirestore[data.cidade] = data.escolas;

//       }

//     });

//     setDadosEscolas(dadosFirestore);

//   };



//   buscarDadosMestres();

// }, []);

// === FIM FN22 ===



  // === INÍCIO FN22a – Carga estática dos dados dos selects ===

useEffect(() => {

  const escolas = {

    “Gravatá”: [

      “Pequeno Príncipe”, “Salesianas”, “Céu Azul”, “Russas”, “Bora Gastar”, “Kaduh”, “Society Show”, “Degusty”

    ],

    “Recife”: [

      “Tio Valter”, “Vera Cruz”, “Pinheiros”, “Dourado”, “BMQ”, “CFC”, “Madre de Deus”, “Saber Viver”, “Anita Garib”

    ],

    “Caruaru”: [

      “Interativo”, “Exato Sede”, “Exato Anexo”, “Sesi”, “Motivo”, “Jesus Salvador”

    ]

  };



  Const sabores = {

    “BRW 7x7”: [

      “Ninho”, “Ninho com Nutella”, “Oreo”, “Ovomaltine”, “Beijinho”, “Brigadeiro branco”, “Brigadeiro branco com confete”,

      “Bem casado”, “Paçoca”, “KitKat”, “Brigadeiro preto”, “Brigadeiro preto com confete”, “Palha italiana”

    ],

    “BRW 6x6”: [

      “Ninho”, “Ninho com Nutella”, “Oreo”, “Ovomaltine”, “Beijinho”, “Brigadeiro branco”, “Brigadeiro branco com confete”,

      “Bem casado”, “Paçoca”, “KitKat”, “Brigadeiro preto”, “Brigadeiro preto com confete”, “Palha italiana”

    ],

    “PKT 5x5”: [

      “Ninho”, “Ninho com Nutella”, “Oreo”, “Ovomaltine”, “Beijinho”, “Brigadeiro branco”, “Brigadeiro branco com confete”,

      “Bem casado”, “Paçoca”, “KitKat”, “Brigadeiro preto”, “Brigadeiro preto com confete”, “Palha italiana”

    ],

    “PKT 6x6”: [

      “Ninho”, “Ninho com Nutella”, “Oreo”, “Ovomaltine”, “Beijinho”, “Brigadeiro branco”, “Brigadeiro branco com confete”,

      “Bem casado”, “Paçoca”, “KitKat”, “Brigadeiro preto”, “Brigadeiro preto com confete”, “Palha italiana”

    ],

    “Esc”: [

      “Ninho”, “Ninho com Nutella”, “Oreo”, “Ovomaltine”, “Beijinho”, “Brigadeiro branco”, “Brigadeiro branco com confete”,

      “Bem casado”, “Paçoca”, “KitKat”, “Brigadeiro preto”, “Brigadeiro preto com confete”, “Palha italiana”

    ],

    “Dudu”: [

      “Dd Oreo”, “Dd Ovomaltine”, “Dd Ninho com Nutella”, “Dd Creme de Maracujá”, “Dd KitKat”

    ]

  };



  setDadosEscolas(escolas);

  setDadosProdutos(sabores);

}, []);

// === FIM FN22a ===



// === INÍCIO FN23 ===

Const [tipoSelecionado, setTipoSelecionado] = useState(‘’);

Const [dadosEscolas, setDadosEscolas] = useState({});

Const [dadosProdutos, setDadosProdutos] = useState({});

// === FIM FN23 ===



Return (

  <div className=”bg-[#FFF3E9] min-h-screen p-4 text-sm font-sans text-[#5C1D0E]”>

    <div className=”max-w-xl mx-auto”>

      <img src=”/logo.png” alt=”Dudunitê” className=”w-48 mx-auto mb-4” />

      <h1 className=”text-center text-xl font-bold mb-6”>Lançamento de Pedidos – Dudunitê</h1>



      {/* === FIM RT01 === */}



      {/* === INÍCIO RT02 – Filtro por período === */}

      <div className=”mb-6”>

        <label className=”font-semibold block mb-1”>📆 Período:</label>

        <div className=”flex items-center gap-2”>

          <input type=”date” value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} className=”p-2 border rounded” />

          <span>até</span>

          <input type=”date” value={dataFim} onChange={(e) => setDataFim(e.target.value)} className=”p-2 border rounded” />

        </div>

      </div>

      {/* === FIM RT02 === */}



{/* === INÍCIO RT03 – Campos do pedido === */}

<div className=”grid grid-cols-2 gap-4 mb-4”>

  <div>

    <label>Cidade</label>

    <select value={cidade} onChange={(e) => setCidade(e.target.value)} className=”w-full p-2 rounded border”>

      <option value=””>Selecione</option>

      {Object.keys(dadosEscolas).map(© => (

        <option key={c} value={c}>{c}</option>

      ))}

    </select>

  </div>



  <div>

    <label>Escola</label>

    <select value={escola} onChange={(e) => setEscola(e.target.value)} className=”w-full p-2 rounded border”>

      <option value=””>Selecione</option>

      {dadosEscolas[cidade]?.map((e) => (

        <option key={e} value={e}>{e}</option>

      ))}

    </select>

  </div>



  <div>

    <label>Produto</label>

    <select value={produto} onChange={(e) => setProduto(e.target.value)} className=”w-full p-2 rounded border”>

      <option value=””>Selecione</option>

      {Object.keys(dadosProdutos).map((p) => (

        <option key={p} value={p}>{p}</option>

      ))}

    </select>

  </div>



  <div>

    <label>Sabor</label>

    <select value={sabor} onChange={(e) => setSabor(e.target.value)} className=”w-full p-2 rounded border”>

      <option value=””>Selecione</option>

      {dadosProdutos[produto]?.map((s) => (

        <option key={s} value={s}>{s}</option>

      ))}

    </select>

  </div>



  <div className=”col-span-2”>

    <label>Quantidade</label>

    <div className=”flex items-center gap-2”>

      <button

        Type=”button”

        onClick={() => setQuantidade(prev => Math.max(1, prev – 1))}

        className=”px-3 py-1 bg-red-600 text-white rounded”

      >

        -

      </button>



      <input

        Type=”number”

        Min=”1”

        Value={quantidade}

        onChange={(e) => setQuantidade(Number(e.target.value))}

        className=”w-20 p-2 border rounded text-center”

      />



      <button

        Type=”button”

        onClick={() => setQuantidade(prev => prev + 1)}

        className=”px-3 py-1 bg-green-600 text-white rounded”

      >

        +

      </button>



      <button

        Type=”button”

        onClick={adicionarItem}

        className=”ml-4 bg-[#8c3b1b] hover:bg-[#732f16] text-white font-semibold py-2 px-3 rounded flex items-center gap-1 text-sm”

      >

        <span className=”text-lg”>➕</span> <span>Adicionar</span>

      </button>

    </div>

  </div>

</div>

{/* === FIM RT03 === */}

      

      {/* === INÍCIO RT04 – Lista de Itens e botão Salvar Pedido === */}

      {itens.length > 0 && (

        <div className=”mb-6”>

          <h2 className=”font-semibold text-lg mb-2”>Itens do Pedido ({totalItens} um):</h2>

          <ul className=”list-disc pl-5”>

            {itens.map((item, index) => (

              <li key={index}>{item.produto} – {item.sabor} – {item.quantidade} um</li>

            ))}

          </ul>

        </div>

      )}



      <button onClick={salvarPedido} className=”bg-green-700 text-white px-4 py-2 rounded hover:bg-green-800 w-full mb-4”>

        💾 Salvar Pedido

      </button>

      {/* === FIM RT04 === */}



      {/* === INÍCIO RT05 – Ações adicionais === */}

      <div className=”flex flex-wrap justify-center gap-4 mt-6 mb-6”>

        <button onClick={gerarPDF} className=”bg-purple-700 text-white px-4 py-2 rounded hover:bg-purple-800”>

          📋 Planejamento de Produção

        </button>

        <button onClick={gerarListaCompras} className=”bg-blue-700 text-white px-4 py-2 rounded hover:bg-blue-800”>

          🧾 Lista de Compras

        </button>

      </div>



      <div className=”flex justify-center”>

        <button onClick={toggleMostrarDadosMestres} className=”bg-zinc-700 text-white px-4 py-2 rounded hover:bg-zinc-800”>

          ⚙️ Dados Mestres

        </button>

      </div>

      {/* === FIM RT05 === */}



      {/* === INÍCIO RT06 – Painel de Dados Mestres (corrigido) */}

      {mostrarDadosMestres && (

        <div className=”mt-6”>

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

      {/* === FIM RT06 === */}

    </div>

  </div>

);

};

Export default App;

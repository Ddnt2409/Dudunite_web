// src/util/suprimentos_store.js
import db from "../firebase";
import {
  collection, doc, addDoc, setDoc, getDoc, getDocs, updateDoc, deleteDoc,
  onSnapshot, query, where, orderBy, serverTimestamp, Timestamp, writeBatch
} from "firebase/firestore";

/* ================== CONST & HELPERS ================== */
const COL_PROD   = "supr_produtos";
const COL_MOV    = "supr_movtos";               // kardex
const COL_COMPRAS= "supr_compras";             // lista por dia (doc = YYYY-MM-DD), subcol "itens"
const COL_INV    = "supr_inventario";          // contagens por data (opcional p/ diferença)

const toYMD = (d) => {
  const x = d instanceof Date ? d : new Date(d);
  if (Number.isNaN(x.getTime())) return "";
  const mm = String(x.getMonth()+1).padStart(2,"0");
  const dd = String(x.getDate()).padStart(2,"0");
  return `${x.getFullYear()}-${mm}-${dd}`;
};
const n = (v, f=0) => {
  const num = Number(v); return Number.isFinite(num) ? num : f;
};

/* ============== PRODUTOS (seed + CRUD básico) ============== */

/** cadastro/atualização (com compra/estoque base em UN; compra por “pacote” via fator) */
export async function upsertProduto(id, data){
  const payload = {
    descricao: String(data.descricao||"").trim(),
    grupo: data.grupo || "",
    // unidade base do estoque (sugestão: "UN", "KG", "L")
    unidadeBase: data.unidadeBase || "UN",
    // unidade/fator padrão de compra (ex.: pct ×10, cx ×300)
    unidadeCompraPadrao: data.unidadeCompraPadrao || data.unCompra || "UN",
    fatorCompraPadrao: n(data.fatorCompraPadrao ?? data.fatorCompra ?? 1, 1),
    // custo médio (CMP) e saldo atual (armazenado para acelerar leitura)
    custoMedio: n(data.custoMedio, 0),
    saldoAtual: n(data.saldoAtual, 0),
    ativo: data.ativo ?? true,
    createdAt: data.createdAt || serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  await setDoc(doc(db, COL_PROD, id || crypto.randomUUID()), payload, { merge: true });
}

/** lista ordenada A–Z (apenas ativos) */
export async function listarProdutosAZ(){
  const snap = await getDocs(collection(db, COL_PROD));
  const arr = snap.docs
    .map(d=>({ id:d.id, ...d.data() }))
    .filter(p=>p.ativo!==false)
    .sort((a,b)=> String(a.descricao).localeCompare(String(b.descricao), "pt-BR"));
  return arr;
}

/** carga inicial (SEED) com a lista enviada */
export async function seedProdutosBasicos(){
  const seed = [
    // ==== Embalagem ====
    ["Emb 640 (cx c/300)"      , "Embalagem", "UN", "CX", 300],
    ["Emb 640 (pct c/10)"      , "Embalagem", "UN", "PCT", 10],
    ["Emb 650 (cx c/300)"      , "Embalagem", "UN", "CX", 300],
    ["Emb 650 (pct c/10)"      , "Embalagem", "UN", "PCT", 10],
    ["Paleta (pct c/500un)"    , "Embalagem", "UN", "PCT", 500],
    ["Paleta (pct c/100un)"    , "Embalagem", "UN", "PCT", 100],
    ["Papel filme 28cmx100m (un)", "Embalagem","UN","UN",1],
    ["Papel filme 28cmx300m (un)", "Embalagem","UN","UN",1],
    ["Saco 5x30cm (sc c/100)"  , "Embalagem", "UN", "SC", 100],
    ["Saco 6x22cm (sc c/100)"  , "Embalagem", "UN", "SC", 100],
    ["Saco 8.5x8.5cm (sc c/100)","Embalagem","UN","SC", 100],
    ["Saco 10x10cm (sc c/100)" , "Embalagem", "UN", "SC", 100],
    ["Copo bolha 400ml (fileira c/100)","Embalagem","UN","FIL",100],
    ["Pote de creme (pct c/50)","Embalagem","UN","PCT",50],
    ["Pote de creme (pct c/10)","Embalagem","UN","PCT",10],
    ["Pote de Biscoito (un)"   , "Embalagem", "UN","UN",1],
    ["Pote de Biscoito (pct c/10)","Embalagem","UN","PCT",10],
    ["Base mini naked (un)"    , "Embalagem","UN","UN",1],
    ["Emb triplo (un)"         , "Embalagem","UN","UN",1],
    ["Saco de confeitar (un)"  , "Embalagem","UN","UN",1],
    ["Emb D135ml (pct c/10)"   , "Embalagem","UN","PCT",10],
    ["Emb D135ml (un)"         , "Embalagem","UN","UN",1],
    ["Emb D135ml (cx c/100)"   , "Embalagem","UN","CX",100],
    // ==== Gráfica ====
    ["Etiqueta brownie (A3)"   , "Gráfica","UN","UN",1],
    ["Etiqueta brownie (m²)"   , "Gráfica","M2","M2",1],
    ["Validade/fabricação (A3)","Gráfica","UN","UN",1],
    ["Escondidinho (m²)"       , "Gráfica","M2","M2",1],
    ["Etiq dudu (m²)"          , "Gráfica","M2","M2",1],
    // ==== Recheios ====
    ["Cx Leite condensado (395g)","Recheios","UN","CX",1],
    ["Cx Creme de leite (200g)"  ,"Recheios","UN","CX",1],
    ["Cx Creme de leite (1 litro)","Recheios","UN","CX",1],
    ["Cx mistura láctea (395g)" ,"Recheios","UN","CX",1],
    ["Nescau (2kg)"             , "Recheios","KG","UN",2],
    ["Glucose (Pote 500g)"      , "Recheios","KG","UN",0.5],
    ["Glucose (Pote 5 litros)"  , "Recheios","L" ,"UN",5],
    ["Coloretti (500g)"         , "Recheios","KG","UN",0.5],
    ["Granulado flocos (500g)"  , "Recheios","KG","UN",0.5],
    ["Leite em pó (750g)"       , "Recheios","KG","UN",0.75],
    ["Leite em pó (200g)"       , "Recheios","KG","UN",0.2],
    ["Ovomaltine (300g)"        , "Recheios","KG","UN",0.3],
    ["Ovomaltine (700g)"        , "Recheios","KG","UN",0.7],
    ["Biscoito oreo (90g)"      , "Recheios","KG","UN",0.09],
    ["Maracujá (un)"            , "Recheios","UN","UN",1],
    ["Nutella (Pote 650g)"      , "Recheios","KG","UN",0.65],
    ["Leite de vaca (1 litro)"  , "Recheios","L" ,"UN",1],
    ["Chocolate fracionado (kg)","Recheios","KG","KG",1],
    ["Morango (un)"             , "Recheios","UN","UN",1],
    // ==== Massas ====
    ["Mistura brownie (pct 400g)","Massas","KG","PCT",0.4],
    ["Margarina (200ml)"         ,"Massas","L" ,"UN",0.2],
    ["Margarina (3kg)"           ,"Massas","KG","UN",3],
    ["Ovos (bdj 30)"             ,"Massas","UN","BDJ",30],
    ["Farinha de trigo (kg)"     ,"Massas","KG","KG",1],
  ];

  const batch = writeBatch(db);
  seed.forEach(([descricao, grupo, unidadeBase, unidadeCompraPadrao, fatorCompraPadrao])=>{
    const ref = doc(collection(db, COL_PROD));
    batch.set(ref, {
      descricao, grupo, unidadeBase, unidadeCompraPadrao,
      fatorCompraPadrao: n(fatorCompraPadrao, 1),
      custoMedio: 0, saldoAtual: 0, ativo: true,
      createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
    });
  });
  await batch.commit();
}

/* ============== LISTA DE COMPRAS por DATA ============== */
/**
 * Estrutura:
 * DOC: supr_compras/{YYYY-MM-DD} -> { data, status: ABERTA|FECHADA, total }
 * SUBCOL: supr_compras/{data}/itens/{produtoId} -> { produtoId, descricao, unidadeCompra, fatorCompra, qtd, precoUnit, total, marcado }
 */

async function ensureListaDia(dataYMD){
  const id = dataYMD || toYMD(new Date());
  const ref = doc(db, COL_COMPRAS, id);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, {
      data: id, status: "ABERTA", total: 0,
      createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
    });
  }
  return ref;
}

export function listenListaComprasDia(dataYMD, onChange, onError){
  const id = dataYMD || toYMD(new Date());
  const col = collection(db, COL_COMPRAS, id, "itens");
  try{
    return onSnapshot(col, async (snap)=>{
      const itens = snap.docs.map(d=>({ id:d.id, ...d.data() }));
      // mantém sempre A–Z
      itens.sort((a,b)=> String(a.descricao).localeCompare(String(b.descricao), "pt-BR"));
      const total = itens.reduce((s,x)=> s + n(x.total, 0), 0);
      onChange && onChange({ itens, total });
      // atualiza total do cabeçalho
      await setDoc(doc(db, COL_COMPRAS, id), { total, updatedAt: serverTimestamp() }, { merge: true });
    });
  }catch(e){ onError && onError(e); return ()=>{}; }
}

export async function upsertItemCompra(dataYMD, produto, campos){
  const refDia = await ensureListaDia(dataYMD);
  const idItem = produto.id; // usamos produtoId como id do item (1 por produto por dia)
  const refItem = doc(collection(db, COL_COMPRAS, refDia.id, "itens"), idItem);

  const qtd = n(campos?.qtd, 0);
  const precoUnit = n(campos?.precoUnit, 0);
  const total = n(qtd * precoUnit, 0);

  await setDoc(refItem, {
    produtoId: produto.id,
    descricao: produto.descricao,
    unidadeCompra: produto.unidadeCompraPadrao || "UN",
    fatorCompra: n(produto.fatorCompraPadrao, 1),
    qtd, precoUnit, total,
    marcado: campos?.marcado ?? false,
    updatedAt: serverTimestamp(),
    createdAt: serverTimestamp(),
  }, { merge: true });
}

export async function marcarItemCompra(dataYMD, itemId, marcado){
  const refItem = doc(db, COL_COMPRAS, dataYMD, "itens", itemId);
  await setDoc(refItem, { marcado: !!marcado, updatedAt: serverTimestamp() }, { merge: true });

  // Se marcou ✓, gera ENTRADA no estoque com conversão (qtd × fatorCompra)
  if (marcado) {
    const snap = await getDoc(refItem);
    if (snap.exists()) {
      const it = snap.data();
      const qtdBase = n(it.qtd,0) * n(it.fatorCompra,1); // converte para unidade base
      const custoUnitBase = n(it.precoUnit,0) / Math.max(1, n(it.fatorCompra,1)); // custo por unidade base
      await registrarEntradaEstoque(it.produtoId, qtdBase, custoUnitBase, { origem: { colecao: COL_COMPRAS, id: dataYMD }});
    }
  }
}

export async function removerItemCompra(dataYMD, itemId){
  await deleteDoc(doc(db, COL_COMPRAS, dataYMD, "itens", itemId));
}

/* ============== ESTOQUE (KARDEX + CMP) ============== */

export async function saldoProduto(produtoId){
  const snap = await getDocs(query(collection(db, COL_MOV), where("produtoId","==",produtoId)));
  return snap.docs.reduce((s,d)=> s + n(d.data().qtd,0), 0);
}

async function atualizarCMPeSaldo(produtoId){
  // CMP por média ponderada simples a partir dos movimentos (somente ENTRADA conta para custo)
  const mov = await getDocs(query(collection(db, COL_MOV), where("produtoId","==",produtoId)));
  let saldo = 0, valorPositivo = 0, qtdPositiva = 0;
  mov.forEach(ds=>{
    const m = ds.data();
    saldo += n(m.qtd, 0);
    if (String(m.tipo).startsWith("ENTRADA")) {
      qtdPositiva += n(m.qtd, 0);
      valorPositivo += n(m.qtd,0) * n(m.custoUnit,0);
    }
  });
  const cmp = qtdPositiva > 0 ? (valorPositivo / qtdPositiva) : 0;
  await setDoc(doc(db, COL_PROD, produtoId), { saldoAtual: saldo, custoMedio: cmp, updatedAt: serverTimestamp() }, { merge: true });
}

export async function registrarEntradaEstoque(produtoId, qtdBase, custoUnitBase, meta={}){
  await addDoc(collection(db, COL_MOV), {
    produtoId,
    depositoId: meta.depositoId || "DEP_PADRAO",
    tipo: "ENTRADA_COMPRA",
    qtd: n(qtdBase,0),
    custoUnit: n(custoUnitBase,0),
    valor: n(qtdBase,0) * n(custoUnitBase,0),
    data: toYMD(new Date()),
    origem: meta.origem || null,
    createdAt: serverTimestamp(),
  });
  await atualizarCMPeSaldo(produtoId);
}

export async function registrarSaidaEstoque(produtoId, qtdBase, motivo="SAIDA_VENDA", meta={}){
  await addDoc(collection(db, COL_MOV), {
    produtoId,
    depositoId: meta.depositoId || "DEP_PADRAO",
    tipo: motivo,
    qtd: -Math.abs(n(qtdBase,0)),
    custoUnit: n(meta.custoUnit,0) || undefined,
    valor: -Math.abs(n(qtdBase,0)) * Math.abs(n(meta.custoUnit,0) || 0),
    data: toYMD(new Date()),
    origem: meta.origem || null,
    createdAt: serverTimestamp(),
  });
  await atualizarCMPeSaldo(produtoId);
}

/* ============== DIFERENÇA (antes/apos produção) ============== */
/**
 * Fluxo sugerido:
 * 1) Compras do DIA = supr_compras/{data}/itens (totais) -> custo "antes".
 * 2) Produção/Consumo + Contagem (inventário do fim do dia) -> salva em supr_inventario/{data}:
 *    { data, contagens: [{produtoId, qtdContada}], observacao }
 * 3) Diferença = (SaldoTeoricoFimDia - Contado) * CMP (por produto), somado geral.
 */
export async function salvarInventarioDia(dataYMD, contagens = [], observacao = ""){
  await setDoc(doc(db, COL_INV, dataYMD), {
    data: dataYMD, contagens, observacao, updatedAt: serverTimestamp(), createdAt: serverTimestamp()
  }, { merge: true });
}

/** Retorna custoAntes (compras do dia), custoDiferenca e um resumo por produto */
export async function apurarDiferencaDia(dataYMD){
  // 1) compras do dia
  const col = collection(db, COL_COMPRAS, dataYMD, "itens");
  const snap = await getDocs(col);
  const compras = snap.docs.map(d=> d.data());
  const custoAntes = compras.reduce((s,x)=> s + n(x.total,0), 0);

  // 2) saldo teórico x contagem
  const invSnap = await getDoc(doc(db, COL_INV, dataYMD));
  const cont = invSnap.exists() ? (invSnap.data().contagens || []) : [];

  // precisamos de saldo teórico do fim do dia: para simplificar, usamos saldoAtual (já atualizado pelos movimentos)
  // e CMP atual — aproximação suficiente para a apuração diária.
  const resumo = [];
  let custoDiferenca = 0;
  for (const c of cont) {
    const pSnap = await getDoc(doc(db, COL_PROD, c.produtoId));
    if (!pSnap.exists()) continue;
    const p = pSnap.data();
    const teorico = n(p.saldoAtual,0);
    const contado  = n(c.qtdContada,0);
    const delta = teorico - contado;     // positivo = “sobrou no teórico” (faltou no físico) => perda
    const custo = Math.abs(delta) * n(p.custoMedio,0);
    custoDiferenca += custo;
    resumo.push({
      produtoId: c.produtoId, descricao: p.descricao,
      teorico, contado, delta, cmp: n(p.custoMedio,0), custo: custo
    });
  }

  return { data: dataYMD, custoAntes, custoDiferenca, resumo };
    }

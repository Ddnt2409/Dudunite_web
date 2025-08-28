// src/pages/AliSab.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
  collection, query, where, getDocs,
  updateDoc, doc, serverTimestamp,
  deleteDoc
} from "firebase/firestore";
import db from "../firebase";

import ERPHeader from "./ERPHeader";
import ERPFooter from "./ERPFooter";
import "./AliSab.css";

import {
  upsertPedidoInCiclo,
  deletePedidoInCiclo,
  semanaRefFromDate
} from "../util/Ciclo";

// 👇 NOVO: gravador p/ coleção que a Cozinha lê
import { marcarAlimentado } from "../util/pcp_store";

/* =====================  (restante do arquivo igual até salvarSabores)  ===================== */

async function salvarSabores(pedido) {
  try {
    const st = formState[pedido.id] || {};
    const payload = {};
    Object.entries(st).forEach(([prod, dados]) => {
      if (dados.linhas.length) payload[prod] = dados.linhas;
    });

    // 1) Atualiza raiz PEDIDOS
    const ref = doc(db, "PEDIDOS", pedido.id);
    await updateDoc(ref, {
      sabores: payload,
      statusEtapa: "Alimentado",
      dataAlimentado: serverTimestamp(),
      atualizadoEm: serverTimestamp(),
      semanaPath: semanaRefFromDate(pedido.criadoEm || new Date()).path,
    });

    // 2) Espelha no ciclo semanal (já existia)
    await upsertPedidoInCiclo(
      pedido.id,
      {
        ...pedido,
        sabores: payload,
        statusEtapa: "Alimentado",
        dataAlimentado: new Date(),
      },
      pedido.criadoEm || new Date()
    );

    // 3) 👇 NOVO: espelhar na coleção que a COZINHA consulta
    await marcarAlimentado(pedido.id, {
      cidade: pedido.cidade || "Gravatá",
      pdv: pedido.escola,                         // Cozinha mostra como PDV
      itens: (pedido.itens || []).map(it => ({
        produto: it.produto,
        quantidade: Number(it.quantidade || 0)
      })),
      sabores: payload,                           // distribuição por produto
      statusEtapa: "Alimentado",
      dataPrevista: pedido.criadoEm || new Date() // útil para ordenações/relatórios
    });

    // estado local
    setPedidos((prev) =>
      prev.map((p) =>
        p.id === pedido.id
          ? { ...p, statusEtapa: "Alimentado", sabores: payload, dataAlimentado: new Date() }
          : p
      )
    );
    setExpandedId(null);
  } catch (err) {
    console.error("Erro ao salvar sabores:", err);
    alert("Erro ao salvar sabores: " + (err?.message || err));
  }
}

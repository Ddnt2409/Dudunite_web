// dentro de src/pages/AliSab.jsx
async function salvarSabores(pedido) {
  try {
    const st = formState[pedido.id] || {};
    const payload = {};
    Object.entries(st).forEach(([prod, dados]) => {
      if (dados.linhas.length) payload[prod] = dados.linhas;
    });

    // 1) Raiz PEDIDOS
    const ref = doc(db, "PEDIDOS", pedido.id);
    await updateDoc(ref, {
      sabores: payload,
      statusEtapa: "Alimentado",
      dataAlimentado: serverTimestamp(),
      atualizadoEm: serverTimestamp(),
      semanaPath: semanaRefFromDate(pedido.criadoEm || new Date()).path,
    });

    // 2) Ciclo semanal
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

    // 3) ESPELHO para a Cozinha (pcp_pedidos) — inclui statusEtapa
    const dataPrev = (pedido.criadoEm instanceof Date)
      ? toYMD(pedido.criadoEm)
      : toYMD(new Date());

    await upsertAlimentadoCozinha(pedido.id, {
      cidade: pedido.cidade || "Gravatá",
      pdv: pedido.escola,
      itens: (pedido.itens || []).map(it => ({
        produto: it.produto,
        qtd: Number(it.quantidade || 0),
      })),
      sabores: payload,
      dataPrevista: dataPrev,
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

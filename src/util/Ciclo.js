// src/util/Ciclo.js
// Cálculo do ciclo semanal (reset 2ª-feira às 11:00, horário local)
// + helpers padronizados p/ montar caminhos de coleção

function inicioDaSemanaComReset(d = new Date(), horaReset = 11) {
  const base = new Date(d.getFullYear(), d.getMonth(), d.getDate(), d.getHours(), d.getMinutes(), d.getSeconds());
  // normaliza para 00:00 de hoje
  const hojeZero = new Date(base.getFullYear(), base.getMonth(), base.getDate());
  const dow = hojeZero.getDay(); // 0=dom, 1=seg ... 6=sáb
  // queremos a segunda-feira desta semana
  const diffSeg = (dow + 6) % 7; // qtos dias voltando até a 2ª
  const seg = new Date(hojeZero);
  seg.setDate(hojeZero.getDate() - diffSeg);
  // aplica reset às 11h
  seg.setHours(horaReset, 0, 0, 0);

  // se ainda não chegou a 2ª 11h nesta semana, usamos a 2ª anterior
  if (base < seg) {
    seg.setDate(seg.getDate() - 7);
  }
  return seg;
}

// id legível do ciclo, ex: 2025-08-11-11h
export function cicloIdFromDate(d = new Date(), horaReset = 11) {
  const seg = inicioDaSemanaComReset(d, horaReset);
  const yyyy = seg.getFullYear();
  const mm = String(seg.getMonth() + 1).padStart(2, "0");
  const dd = String(seg.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}-11h`;
}

// caminho da coleção de pedidos do ciclo
export function caminhoCicloFromDate(d = new Date()) {
  return `CICLOS/${cicloIdFromDate(d)}/PEDIDOS`;
}

// atalho p/ agora
export function caminhoCicloAtual() {
  return caminhoCicloFromDate(new Date());
}

// Retorna **duas** coleções onde vale procurar:
// [coleção do ciclo atual, coleção legado "PEDIDOS"]
export function colecoesPedidosAtivas(db) {
  // lazy import p/ evitar acoplamento circular
  // (mas aqui estamos em arquivo puro; só retorna strings)
  return [caminhoCicloAtual(), "PEDIDOS"];
}

// Somente referência de conveniência caso alguém use p/ exibir
export function semanaRefFromDate(d = new Date()) {
  const seg = inicioDaSemanaComReset(d);
  return seg.toISOString();
}

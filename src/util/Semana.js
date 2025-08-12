// src/util/semana.js
// === INÍCIO FNSEM01 – Semana corrente (segunda às 11:00 local) ===
function segunda11LocalBase(ref = new Date()) {
  // getDay(): 0=Dom,1=Seg,... → desloca para 0=Seg
  const dow = (ref.getDay() + 6) % 7;
  const base = new Date(ref);
  base.setHours(11, 0, 0, 0); // 11:00 local
  base.setDate(base.getDate() - dow); // volta até segunda
  return base;
}

export function semanaRefAtual(ref = new Date()) {
  const base = segunda11LocalBase(ref);
  const yyyy = base.getFullYear();
  const mm = String(base.getMonth() + 1).padStart(2, "0");
  const dd = String(base.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`; // ex: "2025-08-11"
}

export function caminhoCicloAtual(prefix = "CICLOS") {
  return `${prefix}/${semanaRefAtual()}/PEDIDOS`;
}
// === FIM FNSEM01 ===

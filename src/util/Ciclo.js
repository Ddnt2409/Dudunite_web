// src/util/Ciclo.js
// Calcula o caminho da coleção semanal: CICLOS/{YYYY-MM-DD_11h}/PEDIDOS
// Janela: de segunda 11:00 até a próxima segunda 11:00 (hora local)

export function inicioSemana11h(d = new Date()) {
  const ref = new Date(d);
  const dow = (ref.getDay() + 6) % 7; // seg=0
  ref.setHours(11, 0, 0, 0);
  ref.setDate(ref.getDate() - dow);
  return ref;
}

export function caminhoCicloFromDate(d = new Date()) {
  const ini = inicioSemana11h(d);
  const yyyy = ini.getFullYear();
  const mm = String(ini.getMonth() + 1).padStart(2, "0");
  const dd = String(ini.getDate()).padStart(2, "0");
  // Ex.: CICLOS/2025-08-11_11h/PEDIDOS
  return `CICLOS/${yyyy}-${mm}-${dd}_11h/PEDIDOS`;
}

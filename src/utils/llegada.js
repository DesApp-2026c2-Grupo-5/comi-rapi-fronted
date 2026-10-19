/**
 * Helpers del badge de llegada (A6, simplificado).
 *
 * El backend persiste `horaEstimadaLlegada` (timestamp absoluto) al pasar el
 * pedido a `en_camino`. El frontend muestra "Tu pedido llega a las HH:MM
 * aproximadamente" — es una hora fija (proyectada al salir el repartidor),
 * no un countdown: no necesita actualizarse.
 */

export function formatHoraLlegada(hora) {
  if (!hora) return null;
  const fecha = new Date(hora);
  const horas = String(fecha.getHours()).padStart(2, "0");
  const minutos = String(fecha.getMinutes()).padStart(2, "0");
  return `${horas}:${minutos}`;
}

export function textoLlegada(hora) {
  if (!hora) return null;
  return `Tu pedido llega a las ${formatHoraLlegada(hora)} aproximadamente`;
}

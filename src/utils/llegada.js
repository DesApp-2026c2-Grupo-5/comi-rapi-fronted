/**
 * Helpers del countdown de llegada (A6).
 *
 * El backend persiste `horaEstimadaLlegada` (timestamp absoluto) al pasar el
 * pedido a `en_camino`. El frontend muestra:
 *   - "Llega ~HH:MM" — la hora formateada.
 *   - "quedan X min" — los minutos restantes (se recalcula cada 30 s).
 * Solo visible en estado `en_camino`.
 */

export function formatHoraLlegada(hora) {
  if (!hora) return null;
  const fecha = new Date(hora);
  const horas = String(fecha.getHours()).padStart(2, '0');
  const minutos = String(fecha.getMinutes()).padStart(2, '0');
  return `${horas}:${minutos}`;
}

export function minutosRestantes(hora) {
  if (!hora) return null;
  const restantes = Math.ceil((new Date(hora).getTime() - Date.now()) / 60000);
  // Si ya pasó, no mostrar negativos: "llegando".
  return restantes > 0 ? restantes : 0;
}

export function textoLlegada(hora) {
  if (!hora) return null;
  const minutos = minutosRestantes(hora);
  const horaTexto = formatHoraLlegada(hora);
  if (minutos <= 0) return `Llegando (~${horaTexto})`;
  return `Llega ~${horaTexto} · quedan ${minutos} min`;
}

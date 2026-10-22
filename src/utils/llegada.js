/**
 * Helpers del badge de llegada (A6, simplificado).
 *
 * El backend persiste `horaEstimadaLlegada` (timestamp absoluto) al pasar el
 * pedido a `en_camino`. El frontend muestra "Tu pedido llega a las HH:MM
 * aproximadamente" — es una hora fija (proyectada al salir el repartidor),
 * no un countdown: no necesita actualizarse.
 *
 * El texto completo es largo y no entra en el header de la tarjeta de pedido
 * en pantallas chicas (el badge de Bootstrap no permite cortar el texto y se
 * sale de la pantalla), así que hay una versión corta para mobile.
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

/**
 * Versión corta del texto de llegada, para los headers de tarjeta en
 * pantallas chicas: mantiene la hora y el carácter aproximado ("~"), que
 * ya usa el badge de ETA, pero entra en el ancho disponible.
 */
export function textoLlegadaCorto(hora) {
  if (!hora) return null;
  return `Llega ~${formatHoraLlegada(hora)}`;
}

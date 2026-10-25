/**
 * Propósito: Funciones de formateo de precios, fechas y otros datos para presentación.
 * Contenido: formatPrice, formatDate, formatDateTime, formatDateOnly,
 *            formatFechaRelativa, calcularEdad, obtenerIniciales, nombreCompleto.
 * Dependencias: Ninguna.
 * Uso: import { formatPrice, formatDate } from '../utils/formatters';
 */

/* Los formateadores de Intl son caros de construir (compilan patrones y leen la
   configuración regional en cada llamada). Se crean una vez y se reutilizan, que
   además es lo que garantiza que toda la app formatee con el mismo locale. */
const LOCALE = 'es-AR';

const MONEDA_AR = new Intl.NumberFormat(LOCALE, {
  style: 'currency',
  currency: 'ARS',
});

const FECHA_LARGA = new Intl.DateTimeFormat(LOCALE, {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
});

const FECHA_HORA = new Intl.DateTimeFormat(LOCALE, {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

/* `numeric: 'auto'` produce "ayer" / "hace 2 días" en vez de "hace 1 día". */
const RELATIVO = new Intl.RelativeTimeFormat(LOCALE, { numeric: 'auto' });

/**
 * Formatea un precio numérico a formato de moneda argentina.
 * @param {number} precio - Precio a formatear.
 * @returns {string} Precio formateado (ej: "$1.500,00").
 */
export const formatPrice = (precio) => {
  return MONEDA_AR.format(precio);
};

/**
 * Formatea una fecha a formato legible en español.
 * @param {string|Date} fecha - Fecha a formatear.
 * @returns {string} Fecha formateada (ej: "25 de agosto de 2026").
 */
export const formatDate = (fecha) => {
  return FECHA_LARGA.format(new Date(fecha));
};

/**
 * Formatea fecha y hora en 24hs (ej: "25/08/2026, 14:30").
 *
 * Vive acá y no duplicado en cada componente: los formateadores de `Intl` son
 * caros de construir y una instancia por llamada se nota en listas largas.
 *
 * @param {string|Date} fecha - Fecha a formatear.
 * @returns {string} Fecha y hora formateadas.
 */
export const formatDateTime = (fecha) => {
  return FECHA_HORA.format(new Date(fecha));
};

/**
 * Formatea una fecha como tiempo relativo ("hace 5 minutos", "ayer").
 *
 * A partir de los 30 días cae a la fecha absoluta: "hace 3 meses" no aporta
 * nada en una reseña y se pierde el dato concreto.
 *
 * @param {string|Date} fecha - Fecha a formatear.
 * @returns {string} Texto relativo, o cadena vacía si la fecha no es válida.
 */
export const formatFechaRelativa = (fecha) => {
  if (!fecha) return '';
  const valor = new Date(fecha);
  if (Number.isNaN(valor.getTime())) return '';

  const segundos = Math.round((valor.getTime() - Date.now()) / 1000);
  if (Math.abs(segundos) < 60) return 'recién';

  const minutos = Math.round(segundos / 60);
  if (Math.abs(minutos) < 60) return RELATIVO.format(minutos, 'minute');

  const horas = Math.round(minutos / 60);
  if (Math.abs(horas) < 24) return RELATIVO.format(horas, 'hour');

  const dias = Math.round(horas / 24);
  if (Math.abs(dias) < 30) return RELATIVO.format(dias, 'day');

  return formatDate(valor);
};

/**
 * Formatea una fecha que viene como texto YYYY-MM-DD (columna DATEONLY).
 *
 * No usa `new Date(fecha)` a propósito: el motor la interpreta como UTC y en
 * Argentina (UTC-3) una fecha de medianoche se mostraría del día anterior. Se
 * descompone y se arma en hora local, que es lo que la persona ve en su perfil.
 *
 * @param {string} fecha - Fecha en formato "YYYY-MM-DD".
 * @returns {string} Fecha formateada, o cadena vacía si no hay fecha.
 */
export const formatDateOnly = (fecha) => {
  if (!fecha) return '';
  const [anio, mes, dia] = String(fecha).slice(0, 10).split('-').map(Number);
  if (!anio || !mes || !dia) return '';
  return FECHA_LARGA.format(new Date(anio, mes - 1, dia));
};

/**
 * Calcula la edad en años a partir de una fecha de nacimiento.
 * @param {string} fecha - Fecha en formato "YYYY-MM-DD".
 * @returns {number|null} Edad entera, o null si no hay fecha o es inconsistente.
 */
export const calcularEdad = (fecha) => {
  if (!fecha) return null;
  const [anio, mes, dia] = String(fecha).slice(0, 10).split('-').map(Number);
  if (!anio) return null;

  const hoy = new Date();
  let edad = hoy.getFullYear() - anio;
  const mesActual = hoy.getMonth() + 1;
  // Todavía no cumplió: falta el mes, o el día dentro del mismo mes.
  if (mesActual < mes || (mesActual === mes && hoy.getDate() < dia)) {
    edad -= 1;
  }
  return edad >= 0 ? edad : null;
};

/**
 * Devuelve las iniciales de una persona para usar como avatar de respaldo.
 * @param {string} nombre - Nombre.
 * @param {string} [apellido] - Apellido (opcional).
 * @returns {string} Iniciales en mayúsculas (ej: "AG"), o cadena vacía.
 */
export const obtenerIniciales = (nombre, apellido) => {
  const inicial = (texto) => String(texto || '').trim().charAt(0).toUpperCase();
  return `${inicial(nombre)}${inicial(apellido)}`;
};

/**
 * Junta nombre y apellido omitiendo las partes vacías.
 * @param {string} nombre - Nombre.
 * @param {string} [apellido] - Apellido.
 * @returns {string} Nombre completo (ej: "Ana Gómez"), o cadena vacía.
 */
export const nombreCompleto = (nombre, apellido) =>
  [nombre, apellido]
    .map((parte) => String(parte || '').trim())
    .filter(Boolean)
    .join(' ');

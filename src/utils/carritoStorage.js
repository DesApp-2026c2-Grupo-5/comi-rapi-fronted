/**
 * Propósito: Persistencia del carrito en localStorage, con clave por usuario.
 * Contenido: clave versionada, leer/guardar/limpiar, migración invitado→usuario
 *            y saneado de líneas corruptas.
 * Dependencias: Ninguna.
 * Uso: import { leerCarrito, guardarCarrito } from '../utils/carritoStorage';
 */

const PREFIJO_CLAVE = 'comirapi:carrito:v1:';

export const normalizarEmail = (email) =>
  String(email || '')
    .trim()
    .toLowerCase();

/** Clave de storage para un email (o 'invitado' sin usuario). */
export const claveCarrito = (email) =>
  `${PREFIJO_CLAVE}${normalizarEmail(email) || 'invitado'}`;

function almacenamientoDisponible() {
  try {
    return typeof localStorage !== 'undefined';
  } catch {
    return false;
  }
}

/** Valida la forma mínima de una línea del carrito. */
export const esLineaValida = (item) => {
  if (!item || typeof item !== 'object') return false;
  const producto = item.producto;
  if (!producto || producto.id === undefined || producto.id === null) {
    return false;
  }
  if (typeof producto.nombre !== 'string' || !producto.nombre) return false;
  if (Number.isNaN(Number(producto.precio))) return false;
  if (!Number.isInteger(Number(item.cantidad)) || Number(item.cantidad) < 1) {
    return false;
  }
  return true;
};

/** Descarta líneas corruptas o incompletas. */
export const sanearItems = (items) =>
  Array.isArray(items) ? items.filter(esLineaValida) : [];

/** Lee el carrito guardado (saneado) o [] si no hay nada válido. */
export const leerCarrito = (email) => {
  if (!almacenamientoDisponible()) return [];
  try {
    const raw = localStorage.getItem(claveCarrito(email));
    if (!raw) return [];
    return sanearItems(JSON.parse(raw));
  } catch {
    return [];
  }
};

/** Guarda el carrito; nunca rompe la app (cuota/modo privado). */
export const guardarCarrito = (email, items) => {
  if (!almacenamientoDisponible()) return;
  try {
    localStorage.setItem(claveCarrito(email), JSON.stringify(items || []));
  } catch {
    // Cuota llena o modo privado: se sigue solo en memoria.
  }
};

/** Borra el carrito guardado de un usuario. */
export const limpiarCarrito = (email) => {
  if (!almacenamientoDisponible()) return;
  try {
    localStorage.removeItem(claveCarrito(email));
  } catch {
    // Ignorar: no es crítico.
  }
};

/**
 * Migra el carrito de invitado a la clave del usuario (merge por idLinea,
 * sumando cantidades; ante líneas sin idLinea compara producto+personalización
 * por JSON). Borra la clave invitado. Devuelve la lista migrada.
 */
export const migrarCarritoInvitado = (email) => {
  const invitado = leerCarrito(null);
  if (invitado.length === 0) return leerCarrito(email);
  const actual = leerCarrito(email);
  const claveLinea = (item) =>
    item.idLinea ||
    JSON.stringify([item.producto?.id, item.personalizacion || null]);
  const mapa = new Map(actual.map((item) => [claveLinea(item), { ...item }]));
  invitado.forEach((item) => {
    const clave = claveLinea(item);
    if (mapa.has(clave)) {
      mapa.get(clave).cantidad += item.cantidad;
    } else {
      mapa.set(clave, { ...item });
    }
  });
  const migrado = [...mapa.values()];
  guardarCarrito(email, migrado);
  limpiarCarrito(null);
  return migrado;
};

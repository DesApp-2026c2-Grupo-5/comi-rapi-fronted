/**
 * Propósito: Normalizar la nota que el cliente deja para cocina en un ítem del
 *            carrito ("sin sal", "bien cocida").
 * Contenido: largo máximo compartido con el backend y saneo del texto.
 * Dependencias: Ninguna.
 * Uso: import { NOTA_MAX_CARACTERES, normalizarNota } from '../utils/notaHelpers';
 */

// Mismo límite que valida el backend (`lib/services/notas_pedido.js`): si se
// cambia acá, cambiarlo también allá.
export const NOTA_MAX_CARACTERES = 140;

/**
 * Colapsa espacios/saltos de línea, recorta los extremos y limita el largo.
 * Devuelve `null` cuando no queda contenido útil.
 */
export const normalizarNota = (texto) => {
  if (texto === undefined || texto === null) return null;
  const nota = String(texto).replace(/\s+/g, ' ').trim();
  if (!nota) return null;
  return nota.slice(0, NOTA_MAX_CARACTERES);
};

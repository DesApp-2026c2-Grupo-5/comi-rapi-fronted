/**
 * Propósito: Aplicar un cambio de catálogo sobre la lista que ya está en
 *            pantalla, sin volver a pedir la colección entera.
 * Contenido: porNombre, fusionarPorId, quitarPorId.
 * Dependencias: ninguna.
 * Uso: import { fusionarPorId, quitarPorId } from '../utils/catalogoRealtime';
 *
 * El evento `catalogo_actualizado` sólo avisa {tipo, id, accion}. La entidad se
 * relee por REST (la fuente de verdad) y se inserta/reemplaza/se quita de la
 * lista en memoria, igual que hacen los parámetros con la respuesta del PUT.
 */

/**
 * Compara dos entidades por `nombre`, en el mismo orden que el backend
 * (`ORDER BY nombre ASC`).
 * @param {{nombre?: string}} a
 * @param {{nombre?: string}} b
 * @returns {number}
 */
export const porNombre = (a, b) =>
  String(a?.nombre ?? '').localeCompare(String(b?.nombre ?? ''), 'es');

/**
 * Inserta o reemplaza una entidad por `id`. Si ya estaba, conserva su posición
 * (edición en el lugar); si es nueva, la ubica según el comparador.
 * @param {Array} lista
 * @param {object} entidad
 * @param {(a: object, b: object) => number} [comparar]
 * @returns {Array}
 */
export const fusionarPorId = (lista, entidad, comparar = porNombre) => {
  const id = Number(entidad?.id);
  if (!Number.isFinite(id)) return lista;
  const indice = lista.findIndex((elemento) => Number(elemento.id) === id);
  if (indice !== -1) {
    const copia = lista.slice();
    copia[indice] = entidad;
    return copia;
  }
  const copia = lista.slice();
  let posicion = copia.findIndex((elemento) => comparar(elemento, entidad) > 0);
  if (posicion === -1) posicion = copia.length;
  copia.splice(posicion, 0, entidad);
  return copia;
};

/**
 * Quita de la lista la entidad con ese `id`.
 * @param {Array} lista
 * @param {number|string} id
 * @returns {Array}
 */
export const quitarPorId = (lista, id) =>
  lista.filter((elemento) => Number(elemento.id) !== Number(id));

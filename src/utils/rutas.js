/**
 * Propósito: Regla única para decidir si la ruta actual pertenece a una sección
 *            del menú, contando las pantallas de alta y edición de esa sección.
 * Contenido: esRutaDeSeccion y esRutaDeAlguna.
 * Dependencias: Ninguna.
 * Uso: import { esRutaDeAlguna } from '../utils/rutas';
 *
 * El problema que resuelve: la lista de una sección está en plural y sus
 * formularios en singular — /admin/productos para el listado y
 * /admin/producto/editar/3 y /admin/producto/nuevo para editar o crear. Con
 * `startsWith` sobre el plural, entrar a editar un producto dejaba el menú sin
 * marcar, que es justo cuando más hace falta saber en qué sección se está.
 *
 * Por eso cada sección puede declarar `prefijo`, que es la base real bajo la que
 * viven todos sus destinos. Cuando coincide con `to` (el caso de
 * Personalización) no hace falta declararlo.
 *
 * La comparación exige el corte de segmento: /admin/producto es prefijo de
 * /admin/productos, así que sin el "/" final un `startsWith` pelado marcaría la
 * sección de Productos estando en la lista de Categorías.
 */

/**
 * Indica si una ruta pertenece a la sección dada.
 * @param {object} seccion Sección del menú. Usa `prefijo` si está, si no `to`.
 * @param {string} ruta    Ruta actual (pathname), sin query.
 * @returns {boolean} true si la ruta es la sección o una de sus subpantallas.
 */
export const esRutaDeSeccion = (seccion, ruta) => {
  const base = seccion.prefijo || seccion.to;
  return ruta === seccion.to || ruta === base || ruta.startsWith(`${base}/`);
};

/**
 * Indica si la ruta pertenece a alguna de las secciones dadas.
 * @param {Array<object>} secciones Secciones a evaluar.
 * @param {string} ruta            Ruta actual (pathname), sin query.
 * @returns {boolean} true si alguna contiene la ruta.
 */
export const esRutaDeAlguna = (secciones, ruta) =>
  secciones.some((seccion) => esRutaDeSeccion(seccion, ruta));
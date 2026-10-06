/**
 * Propósito: Reglas de rutas: a qué sección pertenece la pantalla actual,
 *            cómo se arma la ruta de origen para volver a ella y cómo se valida
 *            ese destino antes de navegar.
 * Contenido: esRutaDeSeccion, esRutaDeAlguna, rutaActual, esDestinoSeguro y
 *            esRutaDeAdmin.
 * Dependencias: Ninguna.
 * Uso: import { esRutaDeAlguna, rutaActual, esDestinoSeguro, esRutaDeAdmin } from '../utils/rutas';
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

/**
 * Ruta de origen con su query, tal como se la pasa al login en `state.from`.
 * Se incluye el query porque los filtros del catálogo se guardan en la URL: al
 * volver, el invitado tiene que encontrar el carrito y no la lista completa.
 * @param {object} location Location de react-router.
 * @returns {string} Ruta interna, o '/' si no se pasa location.
 */
export const rutaActual = (location) =>
  location ? `${location.pathname || ''}${location.search || ''}` || '/' : '/';

/**
 * Indica si un destino guardado en `state.from` es una ruta interna válida.
 *
 * El valor viene de la URL (se puede abrir /login?o sea /login con state a
 * mano), y `navigate()` lo usaría tal cual: sin esta comprobación, un
 * `from` con "//ejemplo.com" mandaría al usuario fuera de la app al entrar.
 * Se acepta sólo una ruta interna de un solo nivel ("/cliente/carrito?x=1").
 * @param {*} destino Valor a validar.
 * @returns {boolean} true si se puede navegar con seguridad.
 */
export const esDestinoSeguro = (destino) =>
  typeof destino === 'string' &&
  destino.startsWith('/') &&
  !destino.startsWith('//') &&
  !destino.includes('\\');

/**
 * Indica si la ruta es del panel de administración.
 *
 * El pie de página con horarios y redes sociales es de la tienda, no del panel:
 * dentro de /admin queda abajo de tablas largas y no aporta nada. Se decide
 * por ruta y no por rol para no atar el shell a un permiso: alcanza con que la
 * pantalla esté bajo /admin.
 *
 * El corte de segmento es por lo mismo que en `esRutaDeSeccion`: sin el "/"
 * final, "/administracion" contaría como admin.
 *
 * @param {string} ruta Ruta actual (pathname), sin query.
 * @returns {boolean} true si la ruta es del panel.
 */
export const esRutaDeAdmin = (ruta) =>
  typeof ruta === 'string' &&
  (ruta === '/admin' || ruta.startsWith('/admin/'));
/**
 * Propósito: resolver las rutas de imágenes que sirve el backend.
 *
 * Las imágenes de productos, categorías y perfiles viven en
 * `comi-rapi-backend/public/imagenes` y se publican en `/api/imagenes/...`.
 * El backend devuelve rutas relativas; este helper las convierte en absolutas
 * contra el origen de la API para que funcionen igual en desarrollo (Vite en
 * :5173 y API en :3000) y en producción (dominios separados).
 *
 * Uso: import { resolverImagen } from '../utils/imagenes';
 *      <img src={resolverImagen(producto.imagen)} />
 *
 * También acepta URLs absolutas (http/https/data/blob) y normaliza rutas
 * viejas `/imagenes/...` por si quedó algún dato sin migrar.
 */

const API_URL = import.meta.env.VITE_API_URL || '/api';

const ORIGEN_API = (() => {
  try {
    return new URL(API_URL, window.location.origin).origin;
  } catch {
    return '';
  }
})();

export const IMAGEN_PRODUCTO_POR_DEFECTO =
  '/api/imagenes/productos/placeholder-producto.png';

export const IMAGEN_CATEGORIA_POR_DEFECTO =
  '/api/imagenes/categorias/placeholder-categoria.png';

const ES_URL_ABSOLUTA = /^(?:https?:|data:|blob:)/i;

const normalizarRuta = (ruta) => {
  if (typeof ruta !== 'string') return '';
  const limpia = ruta.trim();
  if (!limpia || ES_URL_ABSOLUTA.test(limpia)) return limpia;
  if (limpia.startsWith('/imagenes/')) return `/api${limpia}`;
  if (limpia.startsWith('imagenes/')) return `/api/${limpia}`;
  return limpia;
};

/**
 * Devuelve la URL utilizable en un `<img>` para una ruta de imagen.
 * @param {string} ruta - Ruta relativa del backend o URL absoluta.
 * @returns {string} URL absoluta contra el origen de la API, o la original si
 *   no se puede resolver.
 */
export const resolverImagen = (ruta) => {
  const normalizada = normalizarRuta(ruta);
  if (!normalizada || ES_URL_ABSOLUTA.test(normalizada)) return normalizada;
  if (!normalizada.startsWith('/')) return normalizada;
  return ORIGEN_API ? `${ORIGEN_API}${normalizada}` : normalizada;
};

export default resolverImagen;

/**
 * Propósito: Cliente HTTP compartido para consumir el backend real de Comi-Rapi.
 *
 * Responsabilidades:
 * - Enviar credenciales (cookie de sesión) en todas las peticiones (credentials: 'include').
 * - Obtener y enviar el token CSRF (doble envío) en los métodos que cambian estado
 *   (POST/PUT/PATCH/DELETE), reutilizando la cookie `csrf-token` o pidiéndolo a
 *   GET /api/auth/csrf-token cuando no existe.
 * - Normalizar las respuestas del backend ({ success, data | error }) al formato
 *   { success, data? | error? } usado por la capa api/.
 * - Reintentar una única vez si el backend responde 403 por CSRF (token rotado/expirado).
 * - Subir archivos (multipart) con apiPostFormData: envía un FormData sin fijar
 *   Content-Type para que el navegador agregue el boundary correcto.
 * - Aceptar un AbortSignal en GET para que TanStack Query pueda cancelar la
 *   petición al desmontar o al cambiar de clave.
 *
 * La caché, deduplicación e invalidación de lecturas viven en TanStack Query;
 * este cliente sólo transporta y normaliza las respuestas.
 *
 * Dependencias: ninguna externa (usa fetch nativo y cookies del navegador).
 * Uso: import { apiGet, apiPost, apiPut, apiPatch, apiDelete, apiPostFormData } from './client';
 */

const BASE_URL = import.meta.env.VITE_API_URL || '/api';

const CSRF_COOKIE = 'csrf-token';
const CSRF_HEADER = 'x-csrf-token';
const METODOS_PROTEGIDOS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

function leerCookie(nombre) {
  const coincidencia = document.cookie.match(
    new RegExp(`(^|; )${nombre}=([^;]*)`)
  );
  return coincidencia ? decodeURIComponent(coincidencia[2]) : null;
}

/**
 * Obtiene un token CSRF válido: lo toma de la cookie si ya existe; si no,
 * lo pide a GET /api/auth/csrf-token (que setea la cookie y lo devuelve).
 * @returns {Promise<string|null>} Token CSRF o null si no se pudo obtener.
 */
let promesaCsrf = null;
async function obtenerTokenCsrf() {
  const enCookie = leerCookie(CSRF_COOKIE);
  if (enCookie) return enCookie;

  if (!promesaCsrf) {
    promesaCsrf = (async () => {
      const res = await fetch(`${BASE_URL}/auth/csrf-token`, {
        method: 'GET',
        credentials: 'include',
      });
      let body = null;
      try {
        body = await res.json();
      } catch {
        body = null;
      }
      return (
        (body && body.data && body.data.csrfToken) || leerCookie(CSRF_COOKIE)
      );
    })().finally(() => {
      promesaCsrf = null;
    });
  }
  return promesaCsrf;
}

/**
 * Ejecuta una petición HTTP y normaliza la respuesta.
 * @param {string} method - Método HTTP (GET, POST, PUT, DELETE...).
 * @param {string} path - Ruta relativa a la API (p. ej. "/auth/login").
 * @param {object|FormData} [datos] - Cuerpo JSON o FormData (multipart).
 * @param {object} [opciones]
 * @param {AbortSignal} [opciones.signal] - Permite cancelar la petición.
 * @returns {Promise<{success: boolean, data?: any, error?: string, status?: number}>}
 */
async function ejecutar(method, path, datos, { signal } = {}) {
  const url = BASE_URL + path;
  const opciones = { method, credentials: 'include', headers: {} };
  if (signal) opciones.signal = signal;

  if (datos !== undefined) {
    if (datos instanceof FormData) {
      opciones.body = datos;
    } else {
      opciones.headers['Content-Type'] = 'application/json';
      opciones.body = JSON.stringify(datos);
    }
  }
  if (METODOS_PROTEGIDOS.has(method)) {
    const token = await obtenerTokenCsrf();
    if (token) opciones.headers[CSRF_HEADER] = token;
  }

  const res = await fetch(url, opciones);
  let body = null;
  try {
    body = await res.json();
  } catch {
    body = null;
  }

  if (!res.ok) {
    // `error` es el shape común; `message` lo usan recursos como /api/usuarios
    // (ver swagger), así que se aceptan los dos para no mostrar "Error 400".
    const mensaje =
      (body && (body.error || body.message)) || `Error ${res.status}`;
    return {
      success: false,
      status: res.status,
      error: mensaje,
      // Iteración 1-geo: el backend responde 409 con `opciones` cuando una
      // dirección coincide con varias ubicaciones (identidades territoriales
      // de Georef); el formulario las muestra para que el usuario elija.
      opciones: (body && body.opciones) || null,
      // Iteración 5: detalle funcional de los 422 de cobertura (p. ej. la
      // distancia de la sucursal activa más cercana) para explicar el
      // rechazo sin rediseñar los mensajes.
      detalle: (body && body.detalle) || null,
    };
  }
  if (!body) return { success: true, status: res.status, data: null };
  const extra = { ...body };
  delete extra.success;
  delete extra.data;
  return { success: true, status: res.status, data: body.data ?? null, ...extra };
}

/**
 * Punto de entrada público: ejecuta la petición y reintenta una vez si el
 * backend responde 403 (probable CSRF inválido por token rotado).
 */
async function request(method, path, datos, opciones = {}) {
  let respuesta = await ejecutar(method, path, datos, opciones);
  if (!respuesta.success && respuesta.status === 403) {
    respuesta = await ejecutar(method, path, datos, opciones);
  }
  return respuesta;
}

/**
 * GET sin caché propia: TanStack Query es quien decide cuándo repetir la
 * lectura, deduplicar y cancelar (a través del `signal`).
 *
 * @param {string} path
 * @param {object} [opciones]
 * @param {AbortSignal} [opciones.signal] - Cancela la petición (TanStack Query).
 */
export const apiGet = (path, { signal } = {}) =>
  request('GET', path, undefined, { signal });

export const apiPost = (path, datos, opciones) =>
  request('POST', path, datos, opciones);
export const apiPut = (path, datos, opciones) =>
  request('PUT', path, datos, opciones);
export const apiPatch = (path, datos, opciones) =>
  request('PATCH', path, datos, opciones);
export const apiDelete = (path, opciones) => request('DELETE', path, undefined, opciones);
export const apiPostFormData = (path, formData, opciones) =>
  request('POST', path, formData, opciones);

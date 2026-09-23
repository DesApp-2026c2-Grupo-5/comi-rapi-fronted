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
 *
 * Dependencias: Ninguna (usa fetch nativo).
 * Uso: import { apiGet, apiPost, apiPut, apiDelete, apiPostFormData } from './client';
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
 * @returns {Promise<{success: boolean, data?: any, error?: string, status?: number}>}
 */
async function ejecutar(method, path, datos) {
  const url = BASE_URL + path;
  const opciones = { method, credentials: 'include', headers: {} };

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
    return {
      success: false,
      status: res.status,
      error: (body && body.error) || `Error ${res.status}`,
    };
  }
  return { success: true, status: res.status, data: body ? body.data : null };
}

/**
 * Punto de entrada público: ejecuta la petición y reintenta una vez si el
 * backend responde 403 (probable CSRF inválido por token rotado).
 */
async function request(method, path, datos) {
  let respuesta = await ejecutar(method, path, datos);
  if (!respuesta.success && respuesta.status === 403) {
    respuesta = await ejecutar(method, path, datos);
  }
  return respuesta;
}

export const apiGet = (path) => request('GET', path);
export const apiPost = (path, datos) => request('POST', path, datos);
export const apiPut = (path, datos) => request('PUT', path, datos);
export const apiDelete = (path) => request('DELETE', path);
export const apiPostFormData = (path, formData) =>
  request('POST', path, formData);

/**
 * Propósito: Cliente HTTP para consumir el backend real con sesión por cookie.
 * Contenido: API_URL (base del backend) y request(path, options).
 * Dependencias: variable de entorno VITE_API_URL.
 * Uso: import { request } from './client';
 *
 * La sesión viaja en una cookie HttpOnly (credentials: 'include'); las peticiones
 * que cambian estado agregan el header x-csrf-token a partir de la cookie double-submit.
 */

export const API_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const CSRF_COOKIE = 'csrf-token';
const CSRF_HEADER = 'x-csrf-token';

const METODOS_CAMBIO_ESTADO = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

function leerCookie(nombre) {
  const prefijo = `${nombre}=`;
  const par = document.cookie
    .split(';')
    .map((c) => c.trim())
    .find((c) => c.startsWith(prefijo));
  return par ? decodeURIComponent(par.slice(prefijo.length)) : null;
}

async function obtenerTokenCsrf() {
  const cookie = leerCookie(CSRF_COOKIE);
  if (cookie) return cookie;
  const respuesta = await fetch(`${API_URL}/auth/csrf-token`, {
    method: 'GET',
    credentials: 'include',
  });
  const cuerpo = await respuesta.json().catch(() => ({}));
  return (cuerpo.data && cuerpo.data.csrfToken) || null;
}

export const request = async (path, options = {}) => {
  const method = (
    options.method ||
    (options.body !== undefined ? 'POST' : 'GET')
  ).toUpperCase();

  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (METODOS_CAMBIO_ESTADO.has(method)) {
    const token = await obtenerTokenCsrf();
    if (token) {
      headers[CSRF_HEADER] = token;
    }
  }

  let payload;
  if (options.body !== undefined) {
    payload =
      typeof options.body === 'string'
        ? options.body
        : JSON.stringify(options.body);
  }

  const respuesta = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    credentials: 'include',
    ...(payload !== undefined ? { body: payload } : {}),
  });
  const cuerpo = await respuesta.json().catch(() => ({}));
  if (!respuesta.ok) {
    return {
      success: false,
      error: cuerpo.error || `HTTP ${respuesta.status}`,
    };
  }
  return cuerpo;
};
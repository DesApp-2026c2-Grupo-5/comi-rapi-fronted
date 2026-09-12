/**
 * Propósito: Cliente HTTP mínima para consumir el backend real.
 * Contenido: API_URL (base del backend) y request(path, options).
 * Dependencias: variable de entorno VITE_API_URL.
 * Uso: import { request } from './client';
 */

export const API_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const request = async (path, options = {}) => {
  const respuesta = await fetch(`${API_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
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
/**
 * Propósito: Sondeo mínimo de conexión con el backend real.
 * Contenido: obtenerEstadoApi consulta GET /api/health.
 * Dependencias: client.js (request).
 * Uso: import { obtenerEstadoApi } from '../api/health';
 */

import { request } from './client';

/**
 * Consulta el endpoint de salud del backend.
 * @returns {Promise<{success: boolean, data?: object, error?: string}>} Estado de la conexión.
 */
export const obtenerEstadoApi = async () => request('/health');
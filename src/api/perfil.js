/**
 * Propósito: Servicio de perfil del cliente que consume el backend real.
 * Contenido: obtenerPerfil, actualizarPerfil, subirFotoPerfil,
 *            eliminarFotoPerfil, cambiarPasswordPerfil.
 * Dependencias: client.js (apiGet/apiPut/apiDelete/apiPostFormData/apiPost).
 * Uso: import { obtenerPerfil, actualizarPerfil } from '../api/perfil';
 *
 * El backend scopea por sesión: cada cliente solo ve y edita su propio perfil
 * (no se envía usuarioId). Los campos editables son nombre, apellido, email,
 * telefono y fechaNacimiento; id, rol y activo nunca se envían. La respuesta
 * incluye solo esos campos más fotoPerfilUrl (nunca contraseña ni su hash).
 */

import { apiGet, apiPut, apiPost, apiDelete, apiPostFormData } from './client';

/**
 * Obtiene el perfil del cliente autenticado.
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export const obtenerPerfil = async () => {
  const result = await apiGet('/perfil');
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error };
};

/**
 * Actualiza los datos personales del cliente autenticado (campos parciales).
 * @param {object} datos - { nombre?, apellido?, email?, telefono?, fechaNacimiento? }.
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export const actualizarPerfil = async (datos) => {
  const result = await apiPut('/perfil', datos);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error };
};

/**
 * Sube (o reemplaza) la foto de perfil del cliente autenticado.
 * @param {File} archivo - Imagen JPG/PNG/WEBP de hasta 5 MB.
 * @returns {Promise<{success: boolean, url?: string, error?: string}>}
 */
export const subirFotoPerfil = async (archivo) => {
  const formData = new FormData();
  formData.append('imagen', archivo);
  const result = await apiPostFormData('/perfil/foto', formData);
  if (result.success) {
    return { success: true, url: result.data.url };
  }
  return { success: false, error: result.error };
};

/**
 * Quita la foto de perfil del cliente autenticado (borra también el archivo).
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export const eliminarFotoPerfil = async () => {
  const result = await apiDelete('/perfil/foto');
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error };
};

/**
 * Cambia la contraseña del cliente autenticado.
 * @param {object} datos - { passwordActual, password, confirmPassword }.
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export const cambiarPasswordPerfil = async (datos) => {
  const result = await apiPost('/perfil/cambiar-password', datos);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error };
};

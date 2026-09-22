import { apiPostFormData } from './client';

/**
 * Sube una imagen de producto al backend, que la guarda como archivo en
 * el repo del frontend y devuelve su ruta relativa.
 * @param {File} archivo - Archivo de imagen seleccionado por el usuario.
 * @returns {Promise<{success: boolean, url?: string, error?: string}>}
 */
export async function subirImagenProducto(archivo) {
  const formData = new FormData();
  formData.append('imagen', archivo);
  const result = await apiPostFormData('/imagenes/upload', formData);
  if (result.success) {
    return { success: true, url: result.data.url };
  }
  return { success: false, error: result.error };
}

/**
 * Sube la imagen de una categoría al backend, que la guarda como archivo
 * en el repo del frontend y devuelve su ruta relativa.
 * @param {File} archivo - Archivo de imagen seleccionado por el usuario.
 * @returns {Promise<{success: boolean, url?: string, error?: string}>}
 */
export async function subirImagenCategoria(archivo) {
  const formData = new FormData();
  formData.append('imagen', archivo);
  const result = await apiPostFormData('/imagenes/upload/categoria', formData);
  if (result.success) {
    return { success: true, url: result.data.url };
  }
  return { success: false, error: result.error };
}
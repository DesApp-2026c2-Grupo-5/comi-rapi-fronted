/**
 * Propósito: utilidades compartidas por los hooks de TanStack Query.
 *
 * Los servicios de src/api/ devuelven { success, data | error, status } sin
 * lanzar excepciones. TanStack Query interpreta una promesa resuelta como
 * éxito, así que aquí se convierte un resultado fallido en un error real.
 */

export class ApiError extends Error {
  constructor(mensaje, status) {
    super(mensaje);
    this.name = 'ApiError';
    this.status = status;
  }
}

/**
 * Devuelve `data` o lanza un ApiError con el mensaje del backend.
 * @param {{success: boolean, data?: any, error?: string, status?: number}} resultado
 */
export const desenvolver = (resultado) => {
  if (!resultado || resultado.success !== true) {
    throw new ApiError(
      resultado?.error || 'No se pudo cargar la información.',
      resultado?.status
    );
  }
  return resultado.data;
};

/** Un aborto de TanStack Query no debe mostrarse como error de red. */
export const esCancelacion = (error) =>
  error?.name === 'AbortError' || error?.name === 'CanceledError';

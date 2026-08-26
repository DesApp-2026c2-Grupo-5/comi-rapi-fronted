/**
 * Propósito: Simular el proceso de pago para un pedido.
 * Contenido: Función simuladorPago que retorna un objeto con estado "aprobado".
 * Dependencias: Ninguna.
 * Uso: import { simuladorPago } from '../services/simuladorPago';
 * Ejemplo: const resultado = await simuladorPago({ total: 3500, metodo: 'tarjeta' });
 *          // resultado → { estado: 'aprobado', transaccionId: 'TXN-123456', fecha: '...' }
 */

/**
 * Simula un pago y retorna siempre un resultado aprobado.
 * @param {object} datosPago - Datos del pago (total, método de pago, etc.).
 * @returns {Promise<object>} Promesa que resuelve con el resultado del pago.
 */
export const simuladorPago = async (datosPago) => {
  // Simular un delay de procesamiento (200ms)
  await new Promise((resolve) => setTimeout(resolve, 200));

  return {
    estado: 'aprobado',
    transaccionId: `TXN-${Date.now()}`,
    fecha: new Date().toISOString(),
    monto: datosPago.total || 0,
    metodoPago: datosPago.metodo || 'no especificado',
  };
};

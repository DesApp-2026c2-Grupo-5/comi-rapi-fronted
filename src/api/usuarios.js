/**
 * Propósito: Servicio de usuarios (listado de clientes del administrador y
 *            gestión de administradores del superadministrador).
 * Contenido: obtenerClientes, obtenerClientePorId, obtenerResumenCliente,
 *            obtenerMasComprados, obtenerAdministradores, crearUsuarioPanel,
 *            actualizarUsuarioPanel.
 * Dependencias: client.js (apiGet, apiPost, apiPut), pedidos.js (mapearPedido).
 * Uso: import { obtenerClientes, crearUsuarioPanel } from '../api/usuarios';
 */

import { apiGet, apiPost, apiPut } from './client';
import { mapearPedido } from './pedidos';

/**
 * Obtiene los clientes (rol CLIENTE), con búsqueda opcional por
 * nombre, apellido o email (la filtra el backend).
 * Con `pagina` o `limite` el backend pagina y devuelve `{items, total, ...}`;
 * se normaliza a `data.items` y se conserva el sobre en `meta`.
 * @param {object} [opciones]
 * @param {string} [opciones.buscar=''] Texto a buscar.
 * @param {number} [opciones.pagina] Página (1-based).
 * @param {number} [opciones.limite] Tamaño de página.
 * @returns {Promise<{success: boolean, data?: Array, meta?: object, error?: string}>}
 */
export const obtenerClientes = async (opciones = {}) => {
  const { buscar = '', pagina, limite } = opciones;
  const params = new URLSearchParams({ rol: 'CLIENTE' });
  if (buscar.trim()) params.set('buscar', buscar.trim());
  if (pagina) params.set('pagina', String(pagina));
  if (limite) params.set('limite', String(limite));
  const result = await apiGet(`/usuarios?${params.toString()}`);
  if (!result.success) return result;
  if (!Array.isArray(result.data)) {
    return {
      success: true,
      data: result.data?.items || [],
      meta: {
        total: result.data?.total,
        pagina: result.data?.pagina,
        limite: result.data?.limite,
        paginas: result.data?.paginas,
      },
    };
  }
  return { success: true, data: result.data };
};

/**
 * Obtiene un cliente por su ID (formato administración: sin sensibles,
 * con cantidadPedidos).
 * @param {number|string} id - ID del usuario.
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export const obtenerClientePorId = async (id) => {
  const result = await apiGet(`/usuarios/${id}`);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error };
};

/**
 * Obtiene la ficha completa de un cliente en una sola llamada: datos, sus
 * direcciones activas, los últimos pedidos y el ranking de productos/categorías.
 * El backend aplica el mismo alcance que `obtenerClientePorId` (el admin sólo
 * ve clientes de su sucursal; el superadmin ve todo).
 * @param {number|string} id - ID del usuario.
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export const obtenerResumenCliente = async (id) => {
  const result = await apiGet(`/usuarios/${id}/resumen`);
  if (!result.success) {
    return { success: false, error: result.error };
  }
  const data = result.data || {};
  return {
    success: true,
    data: {
      cliente: data.cliente,
      direcciones: Array.isArray(data.direcciones) ? data.direcciones : [],
      ultimosPedidos: (data.ultimosPedidos || []).map(mapearPedido),
      masComprados: data.masComprados,
    },
  };
};

/**
 * Obtiene los productos y categorías que más compró un cliente (ranking de
 * unidades, con los pedidos cancelados fuera y el límite de filas lo decide el
 * backend). El alcance por sucursal también lo decide el backend según el rol:
 * el administrador sólo suma sus pedidos, el superadmin todos.
 * @param {number|string} id - ID del usuario.
 * @returns {Promise<{success: boolean,
 *   data?: {productos: Array, categorias: Array, totalUnidades: number},
 *   error?: string}>}
 */
export const obtenerMasComprados = async (id) => {
  const result = await apiGet(`/usuarios/${id}/mas-comprados`);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error };
};

/**
 * Obtiene los usuarios administrativos (rol ADMINISTRADOR y SUPERADMINISTRADOR),
 * con búsqueda opcional por nombre, apellido o email (la filtra el backend).
 * Es para el panel del SUPERADMINISTRADOR (el admin nunca ve a otros
 * administradores). Acepta paginación opt-in igual que `obtenerClientes`.
 * @param {object} [opciones]
 * @param {string} [opciones.buscar=''] Texto a buscar.
 * @param {number} [opciones.pagina] Página (1-based).
 * @param {number} [opciones.limite] Tamaño de página.
 * @returns {Promise<{success: boolean, data?: Array, meta?: object, error?: string}>}
 */
export const obtenerAdministradores = async (opciones = {}) => {
  const { buscar = '', pagina, limite } = opciones;
  const params = new URLSearchParams({
    rol: 'ADMINISTRADOR,SUPERADMINISTRADOR',
  });
  if (buscar.trim()) params.set('buscar', buscar.trim());
  if (pagina) params.set('pagina', String(pagina));
  if (limite) params.set('limite', String(limite));
  const result = await apiGet(`/usuarios?${params.toString()}`);
  if (!result.success) return result;
  if (!Array.isArray(result.data)) {
    const items = [...(result.data?.items || [])].sort((a, b) => a.id - b.id);
    return {
      success: true,
      data: items,
      meta: {
        total: result.data?.total,
        pagina: result.data?.pagina,
        limite: result.data?.limite,
        paginas: result.data?.paginas,
      },
    };
  }
  const data = [...result.data].sort((a, b) => a.id - b.id);
  return { success: true, data };
};

/**
 * Crea un usuario (CLIENTE, ADMINISTRADOR o SUPERADMINISTRADOR) desde el panel
 * del superadmin.
 * @param {object} datos - { nombre, apellido?, email, password, rol,
 *   sucursalId? (obligatorio si es ADMINISTRADOR), telefono?, activo? }.
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export const crearUsuarioPanel = async (datos) => {
  const result = await apiPost('/usuarios', datos);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error };
};

/**
 * Actualiza los datos gestionables de un usuario (nombre, email, rol, sucursal,
 * activo…). La contraseña no se edita acá: no la acepta el backend.
 * @param {number|string} id - Id del usuario.
 * @param {object} datos - Campos a actualizar.
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export const actualizarUsuarioPanel = async (id, datos) => {
  const result = await apiPut(`/usuarios/${id}`, datos);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error };
};

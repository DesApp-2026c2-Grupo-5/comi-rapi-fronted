/**
 * Servicio de pedidos: crea y consulta pedidos contra la API real (Postgres),
 * con fallback a mock en memoria si la API no responde (dev).
 * Funciones: crearPedido, obtenerPedidos, obtenerPedidoPorId, confirmarPedido.
 *
 * NOTA: el login de la app sigue siendo mock (no se toca). Para que la API
 * acepte las llamadas, este módulo abre por su cuenta una sesión de backend
 * con las credenciales del usuario mock (ver asegurarSesionBackend).
 */

import { pedidosMock } from '../services/seedData';
import { delay } from '../utils/helpers';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
// Password de los usuarios de desarrollo (mock y seed del backend coinciden).
const PASSWORD_BACKEND = '123456';

// Copia mutable de pedidos mock (fallback dev)
let pedidos = [...pedidosMock];

async function obtenerCsrfToken() {
  const res = await fetch(`${API_URL}/auth/csrf-token`, {
    credentials: 'include',
  });
  if (!res.ok) {
    throw new Error(`Error ${res.status} al obtener CSRF`);
  }
  const body = await res.json();
  return body?.data?.csrfToken;
}

const EMAIL_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function requestJson(path, options = {}) {
  const { headers: opcionesHeaders, ...restoOpciones } = options;
  const res = await fetch(`${API_URL}${path}`, {
    credentials: 'include',
    ...restoOpciones,
    headers: { 'Content-Type': 'application/json', ...(opcionesHeaders || {}) },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok || body.success === false) {
    throw new Error(body.error || `Error ${res.status} en ${path}`);
  }
  return body.data;
}

function esErrorDeRed(error) {
  return (
    error instanceof TypeError || /Failed to fetch|NetworkError/i.test(error.message)
  );
}

function leerUsuarioMock() {
  try {
    if (typeof localStorage === 'undefined') return null;
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function extraerEmail(datosPedido) {
  const cliente = datosPedido?.cliente;
  if (typeof cliente === 'string' && cliente.includes('@')) return cliente;
  if (cliente?.email) return cliente.email;
  return leerUsuarioMock()?.email || null;
}

function extraerNombre(datosPedido) {
  const cliente = datosPedido?.cliente;
  if (cliente?.nombre) return cliente.nombre;
  return leerUsuarioMock()?.nombre || null;
}

/**
 * Garantiza una sesión de backend para las llamadas de pedidos, sin tocar
 * el login (mock) de la app:
 *  1. Si ya hay sesión (cookie), no hace nada.
 *  2. Si no, inicia sesión silenciosa con las credenciales del usuario mock.
 *  3. Si el usuario solo existe en el mock, lo registra en el backend.
 * Devuelve { success:true } o { success:false, error, red:false } si no hay
 * backend (el llamador usa el fallback mock en ese caso).
 */
export const asegurarSesionBackend = async (email, nombre) => {
  if (!email) return { success: false, error: 'Sin usuario logueado' };
  if (!EMAIL_VALIDO.test(email)) {
    return {
      success: false,
      error:
        `El usuario "${email}" no es un email válido para el backend. ` +
        'Salí y entrá con cliente@test.com / 123456.',
    };
  }
  try {
    await requestJson('/auth/me');
    return { success: true };
  } catch (error) {
    if (esErrorDeRed(error)) return { success: false, error: error.message, red: false };
    console.warn(`[pedidos] sin sesión de backend (${email}), intento login silencioso`);
  }
  try {
    const csrfLogin = await obtenerCsrfToken();
    await requestJson('/auth/login', {
      method: 'POST',
      headers: { 'x-csrf-token': csrfLogin },
      body: JSON.stringify({ email, password: PASSWORD_BACKEND }),
    });
    return { success: true };
  } catch (error) {
    if (esErrorDeRed(error)) return { success: false, error: error.message, red: false };
    console.warn(`[pedidos] login silencioso falló para ${email}, intento registro:`, error.message);
  }
  try {
    const csrfRegistro = await obtenerCsrfToken();
    await requestJson('/auth/registro', {
      method: 'POST',
      headers: { 'x-csrf-token': csrfRegistro },
      body: JSON.stringify({
        nombre: nombre || email,
        email,
        password: PASSWORD_BACKEND,
      }),
    });
    return { success: true };
  } catch (error) {
    if (esErrorDeRed(error)) return { success: false, error: error.message, red: false };
    console.warn(`[pedidos] registro silencioso falló para ${email}:`, error.message);
    return {
      success: false,
      error:
        `No se pudo abrir sesión de backend para ${email} (${error.message}). ` +
        'Salí y entrá con cliente@test.com / 123456.',
    };
  }
};

/** Abre sesión de backend o lanza TypeError para que el llamador use el mock. */
async function sesionOError(datosPedido) {
  const sesion = await asegurarSesionBackend(
    extraerEmail(datosPedido),
    extraerNombre(datosPedido)
  );
  if (sesion.success) return;
  if (sesion.red === false || !sesion.error) throw new TypeError('sin backend');
  throw new Error(sesion.error);
}

/** Mapea un pedido del backend (DER) al shape que usa el frontend. */
export const mapearPedido = (p) => {
  if (!p || typeof p !== 'object') return p;
  // Si ya viene en formato frontend, devolver tal cual
  if (Array.isArray(p.productos) && p.historialEstados) return p;
  const estado = p.estado || p.estadoActual?.nombre || p.estadoId;
  return {
    id: p.id,
    cliente: p.cliente?.email || p.cliente || p.usuarioId,
    productos: (p.items || []).map((item) => ({
      productoId: item.productoId,
      nombre: item.nombreProducto || item.nombre,
      cantidad: item.cantidad,
      precio: Number(item.precioUnitario ?? item.precio),
      personalizacion: item.observacion
        ? safeParsePersonalizacion(item.observacion)
        : undefined,
    })),
    total: Number(p.total),
    costoEnvio: p.costoEnvio !== undefined ? Number(p.costoEnvio) : 0,
    estado,
    sucursal: p.Sucursal || p.sucursal || (p.sucursalId ? { id: p.sucursalId } : undefined),
    fecha: p.fechaHora || p.fecha,
    direccion: p.calle
      ? {
          direccion: [p.calle, p.altura].filter(Boolean).join(' '),
          ciudad: p.ciudad,
          codigoPostal: p.codigoPostal,
          referencia: p.referencia,
        }
      : p.direccion,
    historialEstados: (p.historial || []).map((h) => ({
      estado: h.estado?.nombre || h.EstadoPedido?.nombre || h.estado,
      fecha: h.fechaHora || h.fecha,
    })),
    _raw: p,
  };
};

function safeParsePersonalizacion(texto) {
  try {
    const parsed = JSON.parse(texto);
    if (parsed && typeof parsed === 'object') return parsed;
  } catch {
    // es observacion libre, no personalizacion
  }
  return undefined;
}

function payloadBackend(datosPedido, sucursal) {
  const sucursalId =
    datosPedido.sucursalId || sucursal?.id || datosPedido.sucursal?.id;
  const productos = (datosPedido.productos || []).map((prod) => ({
    productoId: prod.productoId || prod.producto?.id,
    nombre: prod.nombre,
    cantidad: prod.cantidad ?? 1,
    precio: prod.precio,
    personalizacion:
      prod.personalizacion ||
      (prod.extras || prod.acompanamientos
        ? {
            extras: prod.extras || [],
            acompanamientos: prod.acompanamientos || [],
          }
        : undefined),
  }));
  // direccionEntrega snapshot: el frontend usa {direccion, ciudad, codigoPostal, referencia}
  const dir = datosPedido.direccion || datosPedido.direccionEntrega || {};
  const direccionEntrega =
    dir.direccion || dir.calle
      ? {
          calle: dir.calle || dir.direccion,
          altura: dir.altura || null,
          ciudad: dir.ciudad || null,
          codigoPostal: dir.codigoPostal || null,
          referencia: dir.referencia || null,
        }
      : undefined;
  return {
    sucursalId,
    productos,
    direccionEntrega,
    costoEnvio: datosPedido.costoEnvio || 0,
    medioPago: datosPedido.medioPago,
    observacion: datosPedido.observacion,
  };
}

/**
 * Crea un nuevo pedido en la API real.
 * @param {object} datosPedido - { productos, total, sucursal/sucursalId, direccion, costoEnvio }.
 * @param {object} [sucursal] - Sucursal asignada (segundo arg legacy de PedidoContext).
 */
export const crearPedido = async (datosPedido, sucursal) => {
  try {
    await sesionOError(datosPedido);
    const csrf = await obtenerCsrfToken();
    const data = await requestJson('/pedidos', {
      method: 'POST',
      headers: { 'x-csrf-token': csrf },
      body: JSON.stringify(payloadBackend(datosPedido, sucursal)),
    });
    const mapeado = mapearPedido(data);
    pedidos.push(mapeado);
    return { success: true, data: { ...mapeado } };
  } catch (error) {
    // Fallback mock (dev sin backend)
    if (error instanceof TypeError || /Failed to fetch|NetworkError/i.test(error.message)) {
      await delay(400);
      const nuevoPedido = {
        id: Date.now(),
        cliente: datosPedido.cliente || { nombre: 'Cliente', email: 'test@test.com' },
        productos: datosPedido.productos,
        total: datosPedido.total,
        estado: 'pendiente',
        sucursal: sucursal || datosPedido.sucursal || 'Sucursal Centro',
      };
      pedidos.push(nuevoPedido);
      return { success: true, data: { ...nuevoPedido }, _mock: true };
    }
    return { success: false, error: error.message };
  }
};

/**
 * Obtiene todos los pedidos de la API real.
 */
export const obtenerPedidos = async () => {
  try {
    await sesionOError();
    const data = await requestJson('/pedidos');
    const lista = (Array.isArray(data) ? data : []).map(mapearPedido);
    return { success: true, data: lista };
  } catch (error) {
    if (error instanceof TypeError || /Failed to fetch|NetworkError/i.test(error.message)) {
      await delay(300);
      return { success: true, data: [...pedidos], _mock: true };
    }
    return { success: false, error: error.message };
  }
};

/**
 * Obtiene un pedido por su ID.
 */
export const obtenerPedidoPorId = async (id) => {
  try {
    await sesionOError();
    const data = await requestJson(`/pedidos/${id}`);
    return { success: true, data: mapearPedido(data) };
  } catch (error) {
    if (error instanceof TypeError || /Failed to fetch|NetworkError/i.test(error.message)) {
      await delay(200);
      const pedido = pedidos.find((p) => p.id === Number(id));
      if (pedido) return { success: true, data: { ...pedido }, _mock: true };
    }
    return { success: false, error: error?.message || 'Pedido no encontrado' };
  }
};

/**
 * Cambia el estado de un pedido contra la API real.
 * @param {number|string} id - ID del pedido.
 * @param {string} estado - Nuevo estado (el backend valida la transición).
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export const cambiarEstado = async (id, estado) => {
  try {
    await sesionOError();
    const csrf = await obtenerCsrfToken();
    const data = await requestJson(`/pedidos/${id}/estado`, {
      method: 'PATCH',
      headers: { 'x-csrf-token': csrf },
      body: JSON.stringify({ estado }),
    });
    const mapeado = mapearPedido(data);
    const index = pedidos.findIndex((p) => p.id === Number(id));
    if (index !== -1) pedidos[index] = mapeado;
    return { success: true, data: { ...mapeado } };
  } catch (error) {
    if (error instanceof TypeError || /Failed to fetch|NetworkError/i.test(error.message)) {
      await delay(300);
      const index = pedidos.findIndex((p) => p.id === Number(id));
      if (index !== -1) {
        pedidos[index] = { ...pedidos[index], estado };
        return { success: true, data: { ...pedidos[index] }, _mock: true };
      }
    }
    return { success: false, error: error?.message || 'Pedido no encontrado' };
  }
};

/**
 * Confirma un pedido (pendiente → confirmado).
 */
export const confirmarPedido = async (id) => {
  return cambiarEstado(id, 'confirmado');
};

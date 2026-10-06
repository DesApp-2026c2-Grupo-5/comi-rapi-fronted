/**
 * Servicio de pedidos: crea, consulta y actualiza pedidos contra la API real
 * (Postgres), usando la sesión existente del usuario (cookie, gestionada por
 * AuthContext). Sin mocks ni login silencioso: los errores de la API se
 * propagan al llamador ({ success: false, error }).
 * Funciones: crearPedido, obtenerPedidos, obtenerPedidoPorId, cambiarEstado, confirmarPedido.
 */

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

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

/** Mapea un pedido del backend (DER) al shape que usa el frontend. */
export const mapearPedido = (p) => {
  if (!p || typeof p !== 'object') return p;
  // Si ya viene en formato frontend, devolver tal cual
  if (Array.isArray(p.productos) && p.historialEstados) return p;
  const estado = p.estado || p.estadoActual?.nombre || p.estadoId;
  const promociones = Array.isArray(p.promociones) ? p.promociones : [];
  return {
    id: p.id,
    usuarioId: p.usuarioId,
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
      usuarioId: h.usuarioId,
    })),
    promociones: promociones.map((promo) => ({
      promocionId: promo.promocionId,
      nombre: promo.nombre,
      tipo: promo.tipo,
      descuentoAplicado: Number(promo.descuentoAplicado ?? 0),
    })),
    descuentoTotal: promociones.reduce(
      (acc, promo) => acc + Number(promo.descuentoAplicado ?? 0),
      0
    ),
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
  // T0 (plan maestro de pedidos): el frontend envía el `direccionId` de la
  // Dirección persistida del usuario — el backend resuelve el snapshot con
  // coordenadas desde esa entidad (que ya pasó el ABM con geocodificación
  // obligatoria). El payload textual queda como retro-compatibilidad.
  const dir = datosPedido.direccion || datosPedido.direccionEntrega || {};
  const direccionEntrega =
    dir.direccion || dir.calle
      ? {
          calle: dir.calle || dir.direccion,
          altura: dir.altura || null,
          ciudad: dir.ciudad || dir.localidad || null,
          codigoPostal: dir.codigoPostal || null,
          referencia: dir.referencia || null,
        }
      : undefined;
  return {
    sucursalId,
    productos,
    ...(dir.id ? { direccionId: dir.id } : {}),
    direccionEntrega,
    costoEnvio: datosPedido.costoEnvio || 0,
    medioPago: datosPedido.medioPago,
    observacion: datosPedido.observacion,
    ...(Array.isArray(datosPedido.promocionIds) &&
    datosPedido.promocionIds.length > 0
      ? { promocionIds: datosPedido.promocionIds }
      : {}),
  };
}

/**
 * Crea un nuevo pedido en la API real.
 * @param {object} datosPedido - { productos, total, sucursal/sucursalId, direccion, costoEnvio }.
 * @param {object} [sucursal] - Sucursal asignada (segundo arg legacy de PedidoContext).
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export const crearPedido = async (datosPedido, sucursal) => {
  try {
    const csrf = await obtenerCsrfToken();
    const data = await requestJson('/pedidos', {
      method: 'POST',
      headers: { 'x-csrf-token': csrf },
      body: JSON.stringify(payloadBackend(datosPedido, sucursal)),
    });
    return { success: true, data: mapearPedido(data) };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Obtiene todos los pedidos del usuario autenticado (el backend scopea CLIENTE
 * por usuarioId; ADMIN ve todos).
 * Acepta filtros opcionales que el backend aplica sobre el scope:
 * { estado, sucursalId, desde (YYYY-MM-DD), hasta (YYYY-MM-DD) }.
 * @param {object} [filtros]
 * @returns {Promise<{success: boolean, data?: Array, error?: string}>}
 */
export const obtenerPedidos = async (filtros = {}) => {
  try {
    const params = new URLSearchParams();
    if (filtros.estado) params.set('estado', filtros.estado);
    if (filtros.sucursalId) params.set('sucursalId', String(filtros.sucursalId));
    if (filtros.desde) params.set('desde', filtros.desde);
    if (filtros.hasta) params.set('hasta', filtros.hasta);
    const qs = params.toString();
    const data = await requestJson(`/pedidos${qs ? `?${qs}` : ''}`);
    const lista = (Array.isArray(data) ? data : []).map(mapearPedido);
    return { success: true, data: lista };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Obtiene un pedido por su ID.
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export const obtenerPedidoPorId = async (id) => {
  try {
    const data = await requestJson(`/pedidos/${id}`);
    return { success: true, data: mapearPedido(data) };
  } catch (error) {
    return { success: false, error: error?.message || 'Pedido no encontrado' };
  }
};

/**
 * Cambia el estado de un pedido contra la API real.
 * @param {number|string} id - ID del pedido.
 * @param {string} estado - Nuevo estado (el backend valida la transición).
 * @param {string} [medioPago] - Medio de pago ('MERCADO_PAGO' | 'TARJETA'), se persiste en el pedido.
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export const cambiarEstado = async (id, estado, medioPago) => {
  try {
    const csrf = await obtenerCsrfToken();
    const data = await requestJson(`/pedidos/${id}/estado`, {
      method: 'PATCH',
      headers: { 'x-csrf-token': csrf },
      body: JSON.stringify({ estado, ...(medioPago ? { medioPago } : {}) }),
    });
    return { success: true, data: mapearPedido(data) };
  } catch (error) {
    return { success: false, error: error?.message || 'Pedido no encontrado' };
  }
};

/**
 * Confirma un pedido (pendiente → confirmado), persistiendo el medio de pago.
 */
export const confirmarPedido = async (id, medioPago) => {
  return cambiarEstado(id, 'confirmado', medioPago);
};

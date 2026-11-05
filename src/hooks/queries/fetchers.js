/**
 * Propósito: funciones de lectura usadas por los queryFn de TanStack Query.
 *
 * Todas reciben el `signal` que provee TanStack Query para cancelar la petición
 * al desmontar o al cambiar la clave, y devuelven directamente los datos
 * (lanzan ApiError si el backend responde { success: false }).
 *
 * No usan la caché de TanStack Query sólo a través de los hooks: cada lectura
 * se cachea, deduplica y cancela desde el QueryClient compartido.
 */

import { apiGet } from '../../api/client';
import { mapearPedido } from '../../api/pedidos';
import { ApiError, desenvolver } from './helpers';

const conQuery = (ruta, parametros = {}) => {
  const query = new URLSearchParams();
  Object.entries(parametros).forEach(([clave, valor]) => {
    if (valor === undefined || valor === null || valor === '' || valor === false) {
      return;
    }
    query.set(clave, String(valor));
  });
  const qs = query.toString();
  return qs ? `${ruta}?${qs}` : ruta;
};

export const fetchParametros = ({ signal } = {}) =>
  apiGet('/parametros', { signal }).then(desenvolver);

export const fetchBootstrap = ({ signal } = {}) =>
  apiGet('/public/bootstrap', { signal }).then(desenvolver);

export const fetchCategorias = ({ incluirInactivas = false, signal } = {}) =>
  apiGet(conQuery('/categorias', { activa: incluirInactivas ? 'false' : null }), {
    signal,
  }).then(desenvolver);

export const fetchCategoria = ({ id, signal } = {}) =>
  apiGet(`/categorias/${encodeURIComponent(id)}`, { signal }).then(desenvolver);

export const fetchProductos = ({
  incluirPersonalizacion = false,
  incluirResenas = false,
  signal,
} = {}) => {
  const include = [
    incluirPersonalizacion ? 'personalizacion' : null,
    incluirResenas ? 'resenas' : null,
  ]
    .filter(Boolean)
    .join(',');
  return apiGet(conQuery('/productos', { include }), { signal }).then(desenvolver);
};

export const fetchProducto = ({ id, signal } = {}) =>
  apiGet(`/productos/${encodeURIComponent(id)}`, { signal }).then(desenvolver);

export const fetchMasVendidos = ({ signal } = {}) =>
  apiGet('/productos/mas-vendidos', { signal }).then(desenvolver);

export const fetchPromociones = ({
  incluirInactivas = false,
  incluirProductos = false,
  signal,
} = {}) =>
  apiGet(
    conQuery('/promociones', {
      activa: incluirInactivas ? 'false' : null,
      include: incluirProductos ? 'productos' : null,
    }),
    { signal }
  ).then(desenvolver);

export const fetchPromocion = ({ id, signal } = {}) =>
  apiGet(`/promociones/${encodeURIComponent(id)}`, { signal }).then(desenvolver);

export const fetchProductosDePromocion = ({ id, signal } = {}) =>
  apiGet(`/promociones/${encodeURIComponent(id)}/productos`, { signal }).then(desenvolver);

export const fetchPersonalizacion = ({ productoId = null, signal } = {}) =>
  apiGet(
    conQuery('/personalizacion', {
      productoId: productoId === null || productoId === undefined ? null : productoId,
    }),
    { signal }
  ).then(desenvolver);

export const fetchResenasProducto = ({ productoId, pagina = 1, limite = 10, signal } = {}) =>
  apiGet(
    conQuery(`/productos/${encodeURIComponent(productoId)}/resenas`, {
      pagina,
      limite,
    }),
    { signal }
  ).then(desenvolver);

export const fetchElegibles = ({ pedidoId = null, signal } = {}) =>
  apiGet(
    conQuery('/resenas/elegibles', {
      pedidoId: pedidoId === null || pedidoId === undefined ? null : pedidoId,
    }),
    { signal }
  ).then(desenvolver);

export const fetchMisResenas = ({ signal } = {}) =>
  apiGet('/resenas/mias', { signal }).then(desenvolver);

export const fetchEstadoResenaProducto = ({ productoId, signal } = {}) =>
  apiGet(`/productos/${encodeURIComponent(productoId)}/resenas/mia`, {
    signal,
  }).then(desenvolver);

export const fetchSucursales = ({ incluirInactivas = false, signal } = {}) =>
  apiGet(conQuery('/sucursales', { activa: incluirInactivas ? 'false' : null }), {
    signal,
  }).then(desenvolver);

/**
 * Lista de pedidos del usuario. Se normaliza al shape del frontend
 * (`fecha`, `historialEstados`, productos planos) igual que crearPedido y
 * obtenerPedidoPorId: las pantallas de pedidos no leen el formato crudo del
 * backend (fechaHora/historial/items).
 */
export const fetchPedidos = async ({ filtros = {}, signal } = {}) => {
  const data = await apiGet(conQuery('/pedidos', filtros), { signal }).then(
    desenvolver
  );
  const crudo = Array.isArray(data) ? data : data?.items || [];
  return crudo.map(mapearPedido);
};

export const fetchPerfil = ({ signal } = {}) => apiGet('/perfil', { signal }).then(desenvolver);

/**
 * Sucursales candidatas para reasignar un pedido (cobertura + stock).
 * El backend responde una lista plana; se normaliza por si llegara vacía.
 */
export const fetchSucursalesCandidatas = async ({ pedidoId, signal } = {}) => {
  const resultado = await apiGet(`/pedidos/${encodeURIComponent(pedidoId)}/sucursales-candidatas`, {
    signal,
  });
  if (!resultado.success) {
    throw new ApiError(
      resultado.error || 'No se pudieron obtener las sucursales.',
      resultado.status
    );
  }
  return Array.isArray(resultado.data) ? resultado.data : [];
};

/**
 * Stock de la sucursal operativa junto con el stock de insumos.
 *
 * Se lee la respuesta cruda de `apiGet` (no `desenvolver`) porque el backend
 * agrega el campo hermano `insumos` fuera de `data`, y la pantalla de stock
 * necesita ambos listados en una sola petición.
 */
export const fetchStock = async ({ productoId = null, signal } = {}) => {
  const resultado = await apiGet(
    conQuery('/stock', {
      productoId: productoId === null || productoId === undefined ? null : productoId,
      include: 'insumos',
    }),
    { signal }
  );
  if (!resultado.success) {
    throw new ApiError(resultado.error || 'No se pudo cargar el stock.', resultado.status);
  }
  return {
    filas: Array.isArray(resultado.data) ? resultado.data : [],
    insumos: Array.isArray(resultado.insumos) ? resultado.insumos : [],
  };
};

/**
 * Catálogo de insumos (extras y condimentos). Sin sesión de gestión sólo
 * devuelve los activos; con `activo: false` un usuario de gestión ve también
 * los dados de baja.
 */
export const fetchInsumos = ({ activo, tipo, signal } = {}) =>
  apiGet(
    conQuery('/insumos', {
      activo: activo === false ? 'false' : null,
      tipo: tipo || null,
    }),
    { signal }
  ).then(desenvolver);

export const fetchReportes = ({ filtros = {}, signal } = {}) =>
  apiGet(conQuery('/reportes', filtros), { signal }).then(desenvolver);

export const fetchResumenSuperadmin = ({ signal } = {}) =>
  apiGet('/superadmin/resumen', { signal }).then(desenvolver);

/**
 * Clientes del administrador. El backend puede devolver un array o un sobre
 * paginado `{ items, total, ... }`; acá se normaliza a `{ items, meta }`.
 */
export const fetchClientes = async ({ buscar = '', pagina, limite, signal } = {}) => {
  const resultado = await apiGet(
    conQuery('/usuarios', {
      rol: 'CLIENTE',
      buscar: typeof buscar === 'string' ? buscar.trim() : '',
      pagina,
      limite,
    }),
    { signal }
  );
  if (!resultado.success) {
    throw new ApiError(resultado.error || 'No se pudieron cargar los clientes.', resultado.status);
  }
  if (Array.isArray(resultado.data)) {
    return { items: resultado.data, meta: null };
  }
  return {
    items: resultado.data?.items || [],
    meta: {
      total: resultado.data?.total,
      pagina: resultado.data?.pagina,
      limite: resultado.data?.limite,
      paginas: resultado.data?.paginas,
    },
  };
};

/**
 * Administradores y superadministradores del panel. El backend puede devolver
 * un array o un sobre paginado; se normaliza a `{ items, meta }` y se ordena
 * por id como hacía el servicio original.
 */
export const fetchAdministradores = async ({ buscar = '', pagina, limite, signal } = {}) => {
  const resultado = await apiGet(
    conQuery('/usuarios', {
      rol: 'ADMINISTRADOR,SUPERADMINISTRADOR',
      buscar: typeof buscar === 'string' ? buscar.trim() : '',
      pagina,
      limite,
    }),
    { signal }
  );
  if (!resultado.success) {
    throw new ApiError(
      resultado.error || 'No se pudieron cargar los administradores.',
      resultado.status
    );
  }
  const ordenar = (items) => [...items].sort((a, b) => a.id - b.id);
  if (Array.isArray(resultado.data)) {
    return { items: ordenar(resultado.data), meta: null };
  }
  return {
    items: ordenar(resultado.data?.items || []),
    meta: {
      total: resultado.data?.total,
      pagina: resultado.data?.pagina,
      limite: resultado.data?.limite,
      paginas: resultado.data?.paginas,
    },
  };
};

export const fetchDirecciones = ({ signal } = {}) =>
  apiGet('/direcciones', { signal }).then(desenvolver);

export const fetchResumenCliente = async ({ id, signal } = {}) => {
  const data = await apiGet(`/usuarios/${encodeURIComponent(id)}/resumen`, {
    signal,
  }).then(desenvolver);
  return {
    cliente: data?.cliente,
    direcciones: Array.isArray(data?.direcciones) ? data.direcciones : [],
    // El backend devuelve los pedidos en crudo: se reutiliza el mismo mapeo
    // que usa el resto de la app para fechas, totales y estado.
    ultimosPedidos: (data?.ultimosPedidos || []).map(mapearPedido),
    masComprados: data?.masComprados,
  };
};

export const fetchElementosPersonalizacion = ({ signal } = {}) =>
  apiGet('/personalizacion', { signal }).then(desenvolver);

export const fetchElementoPersonalizacion = ({ id, signal } = {}) =>
  apiGet(`/personalizacion/${encodeURIComponent(id)}`, { signal }).then(desenvolver);

export const fetchPlantillasPersonalizacion = ({
  categoriaId = null,
  signal,
} = {}) => {
  // Nunca consultar el backend si categoriaId no es un número válido.
  // Evita enviar [object Object], undefined o cualquier valor no numérico
  // que provocaría HTTP 400 en /personalizacion/categorias?categoriaId=...
  if (
    categoriaId === null ||
    categoriaId === undefined ||
    !Number.isFinite(categoriaId)
  ) {
    return Promise.resolve([]);
  }
  return apiGet(
    conQuery('/personalizacion/categorias', {
      categoriaId,
      activa: 'false',
    }),
    { signal }
  ).then(desenvolver);
};

export const fetchPlantillaPersonalizacion = ({ id, signal } = {}) =>
  apiGet(`/personalizacion/categorias/${encodeURIComponent(id)}`, {
    signal,
  }).then(desenvolver);

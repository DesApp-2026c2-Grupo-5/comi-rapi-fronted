/**
 * Propósito: aplicar a la caché de TanStack Query el cambio de UNA sucursal,
 *            sin invalidar ni volver a pedir las listas completas.
 * Contenido: actualizarSucursalEnCache, que inserta/reemplaza/quita el elemento
 *            afectado en las dos variantes cacheadas de la lista
 *            (['public', 'sucursales', 'todas'|'activas']) y propaga el cambio
 *            a las cachés que EMBEBEN la sucursal: los pedidos
 *            (['private', 'pedidos', ...]) y las candidatas de reasignación
 *            (['private', 'pedidos', id, 'sucursales-candidatas']).
 * Dependencias: hooks/queries/queryKeys.
 * Uso: actualizarSucursalEnCache(queryClient, { accion, data }).
 *
 * Es idempotente: la respuesta REST del CRUD y el evento de Socket.IO pueden
 * llegar en cualquier orden (o repetirse) y el resultado converge sin duplicar
 * filas. La baja es lógica: la sucursal queda en la lista "todas" con
 * `activa: false` y desaparece de la lista de activas.
 */

import { queryKeys } from '../hooks/queries/queryKeys';

const CLAVE_TODAS = queryKeys.public.sucursales(true);
const CLAVE_ACTIVAS = queryKeys.public.sucursales(false);
// Prefijo que cubre la lista de pedidos (con cualquier filtro) y las listas de
// candidatas de reasignación, que también cuelgan de ['private', 'pedidos'].
const PREFIJO_PEDIDOS = ['private', 'pedidos'];
const SUFIJO_CANDIDATAS = 'sucursales-candidatas';

const mismoId = (a, b) =>
  a !== undefined && a !== null && String(a) === String(b);

const ordenarPorNombre = (a, b) =>
  String(a?.nombre ?? '').localeCompare(String(b?.nombre ?? ''), 'es');

const insertarOReemplazar = (lista, data) => {
  const idx = lista.findIndex((s) => String(s.id) === String(data.id));
  if (idx >= 0) {
    const nueva = [...lista];
    nueva[idx] = { ...lista[idx], ...data };
    return nueva.sort(ordenarPorNombre);
  }
  return [...lista, data].sort(ordenarPorNombre);
};

const quitarPorId = (lista, id) => {
  const idx = lista.findIndex((s) => String(s.id) === String(id));
  if (idx < 0) return lista;
  const nueva = [...lista];
  nueva.splice(idx, 1);
  return nueva;
};

/**
 * Combina los datos nuevos sobre una sucursal embebida. La dirección es el
 * único objeto anidado: se fusiona para conservar campos que el payload no
 * repita. El resto de los campos se reemplaza con lo que trae el evento.
 */
const combinarSucursal = (actual, data) => {
  const combinada = { ...actual, ...data };
  if (actual?.direccion && data.direccion) {
    combinada.direccion = { ...actual.direccion, ...data.direccion };
  }
  return combinada;
};

/**
 * Actualiza la sucursal embebida de un pedido (`pedido.sucursal`) cuando su id
 * coincide. No toca ningún otro campo del pedido ni los pedidos de otras
 * sucursales. También mantiene coherente `_raw.Sucursal`, que conserva la
 * respuesta cruda del backend.
 */
const actualizarPedido = (pedido, data) => {
  if (!pedido || typeof pedido !== 'object') return pedido;
  const idSucursal = pedido.sucursal?.id ?? pedido.sucursalId;
  if (!mismoId(idSucursal, data.id)) return pedido;
  // Sin objeto embebido no hay nombre que refrescar en esta entrada.
  if (!pedido.sucursal || typeof pedido.sucursal !== 'object') return pedido;

  const actualizado = {
    ...pedido,
    sucursal: combinarSucursal(pedido.sucursal, data),
  };

  const raw = pedido._raw;
  if (raw) {
    const rawSucursal = raw.Sucursal || raw.sucursal;
    if (
      rawSucursal &&
      typeof rawSucursal === 'object' &&
      mismoId(rawSucursal.id ?? raw.sucursalId, data.id)
    ) {
      actualizado._raw = raw.Sucursal
        ? { ...raw, Sucursal: combinarSucursal(raw.Sucursal, data) }
        : { ...raw, sucursal: combinarSucursal(raw.sucursal, data) };
    }
  }

  return actualizado;
};

/** Actualiza una candidata de reasignación (id + nombre + distancia). */
const actualizarCandidata = (candidata, data) => {
  if (!candidata || typeof candidata !== 'object') return candidata;
  if (!mismoId(candidata.id, data.id)) return candidata;
  return combinarSucursal(candidata, data);
};

/** Aplica un updater a una colección y conserva la referencia si nada cambió. */
const actualizarColeccion = (old, updater, data) => {
  if (!Array.isArray(old)) return old;
  let modificada = false;
  const nueva = old.map((item) => {
    const actualizado = updater(item, data);
    if (actualizado !== item) modificada = true;
    return actualizado;
  });
  return modificada ? nueva : old;
};

/**
 * Propaga la sucursal modificada a los pedidos cacheados (que embeben
 * `sucursal` con nombre/dirección) y a las candidatas de reasignación.
 * Se recorre la caché para distinguir ambas formas por su clave, sin invalidar
 * ninguna consulta ni disparar lecturas por REST.
 */
const actualizarPedidosEnCache = (queryClient, data) => {
  queryClient
    .getQueryCache()
    .findAll({ queryKey: PREFIJO_PEDIDOS })
    .forEach((query) => {
      const esCandidatas = query.queryKey[3] === SUFIJO_CANDIDATAS;
      queryClient.setQueryData(query.queryKey, (old) =>
        actualizarColeccion(
          old,
          esCandidatas ? actualizarCandidata : actualizarPedido,
          data
        )
      );
    });
};

/**
 * Actualiza las listas cacheadas de sucursales con el elemento afectado y
 * propaga el cambio a las cachés que embeben la sucursal.
 *
 * @param {import('@tanstack/react-query').QueryClient} queryClient
 * @param {{accion?: 'creado'|'actualizado'|'eliminado', data?: object}} cambio
 */
export const actualizarSucursalEnCache = (queryClient, { accion, data } = {}) => {
  if (!data || data.id === undefined || data.id === null) return;

  if (accion === 'eliminado') {
    // Baja lógica: se conserva en "todas" (staff) y se quita de "activas".
    queryClient.setQueryData(CLAVE_TODAS, (old) => {
      if (!Array.isArray(old)) return old;
      return insertarOReemplazar(old, { ...data, activa: false });
    });
    queryClient.setQueryData(CLAVE_ACTIVAS, (old) =>
      Array.isArray(old) ? quitarPorId(old, data.id) : old
    );
    actualizarPedidosEnCache(queryClient, { ...data, activa: false });
    return;
  }

  queryClient.setQueryData(CLAVE_TODAS, (old) =>
    Array.isArray(old) ? insertarOReemplazar(old, data) : old
  );
  queryClient.setQueryData(CLAVE_ACTIVAS, (old) => {
    if (!Array.isArray(old)) return old;
    if (data.activa === false) return quitarPorId(old, data.id);
    return insertarOReemplazar(old, data);
  });
  actualizarPedidosEnCache(queryClient, data);
};

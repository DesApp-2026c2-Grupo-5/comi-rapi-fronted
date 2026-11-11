/**
 * Propósito: puente único entre el canal de tiempo real y la caché de
 *            TanStack Query.
 * Contenido: componente RealtimeBridge (sin render propio) que se suscribe a
 *            los avisos de catálogo, parámetros y stock, y actualiza las claves
 *            afectadas de la caché para que las pantallas se mantengan al día.
 * Dependencias: React, @tanstack/react-query, useAuth, useSucursalOperativa,
 *               hooks/queries (queryKeys), api/stock, services/socket.
 * Uso: <RealtimeBridge /> dentro de AppLayout, una sola vez en la app.
 *
 * El socket es SOLO un aviso: no se lee nada ni se guarda estado. Los eventos
 * que traen el elemento afectado (catálogo, parámetros, sucursales) actualizan
 * la caché de forma selectiva; el de stock trae los IDs afectados y se piden
 * por REST únicamente esas filas, sin volver a pedir la lista completa.
 *
 * `pedido_actualizado` NO se escucha en este componente: PedidoContext ya lo
 * maneja (refresca la lista, rearma rooms y dispara las notificaciones). Tener
 * dos listeners duplicaría lecturas y avisos.
 *
 * Los avisos de catálogo, parámetros y stock se aplican acá; la caché
 * artesanal anterior ya no existe.
 */

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../hooks/useAuth';
import { useSucursalOperativa } from '../../hooks/useSucursalOperativa';
import { queryKeys } from '../../hooks/queries';
import { actualizarSucursalEnCache } from '../../utils/sucursalesCache';
import {
  obtenerStockDeProducto,
  obtenerStockInsumo,
} from '../../api/stock';
import {
  alReconectar,
  conectarSocket,
  EVENTOS_SOCKET,
} from '../../services/socket';

/**
 * Marca como viejas las claves del catálogo. No se invalida el snapshot de
 * bootstrap: es una semilla que sólo llena claves vacías y cada clave real ya
 * quedó invalidada por su cuenta.
 * Se usa solo en reconexión para resincronizar todo.
 * @param {import('@tanstack/react-query').QueryClient} queryClient
 */
const invalidarCatalogo = (queryClient) => {
  queryClient.invalidateQueries({ queryKey: ['public', 'productos'] });
  queryClient.invalidateQueries({ queryKey: ['public', 'categorias'] });
  queryClient.invalidateQueries({ queryKey: ['public', 'promociones'] });
  queryClient.invalidateQueries({ queryKey: ['public', 'personalizacion'] });
};

/**
 * Actualiza una entrada de caché de lista si existe.
 * @param {import('@tanstack/react-query').QueryClient} queryClient
 * @param {Array} clave - Clave completa de la query (ej: ['public','productos','lista','base'])
 * @param {object} data - Dato del elemento modificado
 * @param {string} id - ID del elemento
 * @param {string} accion - 'creado' | 'actualizado' | 'eliminado'
 * @param {(a: any, b: any) => number} [ordenar] - Función de ordenamiento opcional
 */
const actualizarLista = (queryClient, clave, data, id, accion, ordenar) => {
  queryClient.setQueryData(clave, (old) => {
    if (!Array.isArray(old)) return old;
    const idx = old.findIndex((item) => String(item.id) === String(id));
    if (accion === 'eliminado') {
      if (idx >= 0) {
        const nueva = [...old];
        nueva.splice(idx, 1);
        return nueva;
      }
      return old;
    }
    if (accion === 'creado') {
      const nueva = [...old, data];
      return ordenar ? nueva.sort(ordenar) : nueva;
    }
    // actualizado
    if (idx >= 0) {
      const nueva = [...old];
      nueva[idx] = data;
      return ordenar ? nueva.sort(ordenar) : nueva;
    }
    // Si no existe en la lista (caso raro), agregar
    const nueva = [...old, data];
    return ordenar ? nueva.sort(ordenar) : nueva;
  });
};

/**
 * Actualiza la caché con los datos recibidos en un evento CATALOGO_ACTUALIZADO.
 * Usa setQueryData para actualizar directamente la caché sin refetch.
 * Sincroniza selectivamente: actualiza solo la entidad modificada y las vistas
 * que dependen directamente de ella.
 * @param {import('@tanstack/react-query').QueryClient} queryClient
 * @param {object} payload - { tipo, id, accion, data }
 */
const actualizarCacheCatalogo = (queryClient, payload) => {
  const { tipo, id, accion, data, updatedAt } = payload;
  console.log('[DIAG] actualizarCacheCatalogo: procesando', { tipo, id, accion, hasData: !!data });
  if (!data) {
    console.log('[DIAG] actualizarCacheCatalogo: sin data, abortando');
    return;
  }

  // Comparación de versiones para evitar eventos duplicados/desordenados
  const cacheKey = tipo === 'producto' ? queryKeys.public.producto(id) :
                   tipo === 'categoria' ? queryKeys.public.categoria(id) :
                   tipo === 'personalizacion' ? queryKeys.public.personalizacionElemento(id) :
                   queryKeys.public.promocion(id);
  const cached = queryClient.getQueryData(cacheKey);
  if (cached && cached.updatedAt && updatedAt) {
    const cachedTime = new Date(cached.updatedAt).getTime();
    const incomingTime = new Date(updatedAt).getTime();
    if (incomingTime <= cachedTime) {
      console.log('[DIAG] actualizarCacheCatalogo: evento obsoleto/duplicado, ignorando', { cachedTime, incomingTime });
      return;
    }
  }

  const ordenarPorNombre = (a, b) =>
    String(a.nombre).localeCompare(String(b.nombre), 'es');

  // Helper: actualiza el campo `categoria` en un producto si coincide con la categoría modificada
  const actualizarCategoriaEnProducto = (producto, categoriaData) => {
    if (producto && producto.categoriaId === categoriaData.id) {
      return { ...producto, categoria: categoriaData.nombre };
    }
    return producto;
  };

  // Helper: actualiza listas de productos propagando el cambio de categoría
  const actualizarListasProductosPorCategoria = (queryClient, categoriaData) => {
    const clavesProductos = [
      queryKeys.public.productos({}),
      queryKeys.public.productos({ incluirPersonalizacion: true }),
      queryKeys.public.productos({ incluirResenas: true }),
      queryKeys.public.productos({ incluirPersonalizacion: true, incluirResenas: true }),
      queryKeys.public.masVendidos,
    ];
    for (const clave of clavesProductos) {
      queryClient.setQueryData(clave, (old) => {
        if (!Array.isArray(old)) return old;
        let modificada = false;
        const nueva = old.map((p) => {
          const actualizado = actualizarCategoriaEnProducto(p, categoriaData);
          if (actualizado !== p) modificada = true;
          return actualizado;
        });
        return modificada ? nueva : old;
      });
    }
  };

  // 1. Actualizar la query individual (detalle)
  if (tipo === 'producto') {
    const key = queryKeys.public.producto(id);
    console.log('[DIAG] actualizarCacheCatalogo: setQueryData detalle producto', key);
    queryClient.setQueryData(key, data);

    // Variantes de lista de productos
    console.log('[DIAG] actualizarCacheCatalogo: actualizando listas de productos');
    actualizarLista(queryClient, queryKeys.public.productos({}), data, id, accion, ordenarPorNombre);
    actualizarLista(queryClient, queryKeys.public.productos({ incluirPersonalizacion: true }), data, id, accion, ordenarPorNombre);
    actualizarLista(queryClient, queryKeys.public.productos({ incluirResenas: true }), data, id, accion, ordenarPorNombre);
    actualizarLista(queryClient, queryKeys.public.productos({ incluirPersonalizacion: true, incluirResenas: true }), data, id, accion, ordenarPorNombre);
    // Más vendidos
    actualizarLista(queryClient, queryKeys.public.masVendidos, data, id, accion);

  } else if (tipo === 'categoria') {
    const key = queryKeys.public.categoria(id);
    console.log('[DIAG] actualizarCacheCatalogo: setQueryData detalle categoria', key);
    queryClient.setQueryData(key, data);

    // Variantes de lista de categorías
    console.log('[DIAG] actualizarCacheCatalogo: actualizando listas de categorias');
    
    // La lista 'categorias(true)' incluye TODAS (activas e inactivas): 
    // - 'actualizado'/'creado': actualizar/reemplazar
    // - 'eliminado' (soft delete): mantener en lista con activa: false
    if (accion === 'eliminado') {
      // Soft delete: mantener en lista 'todas' pero con activa: false
      queryClient.setQueryData(queryKeys.public.categorias(true), (old) => {
        if (!Array.isArray(old)) return old;
        const idx = old.findIndex((item) => String(item.id) === String(id));
        if (idx >= 0) {
          const nueva = [...old];
          nueva[idx] = { ...nueva[idx], ...data, activa: false };
          return nueva;
        }
        // Si no existe, agregar (caso raro)
        return [...old, { ...data, activa: false }].sort(ordenarPorNombre);
      });
    } else {
      // 'creado' o 'actualizado': actualizar normalmente
      actualizarLista(queryClient, queryKeys.public.categorias(true), data, id, accion, ordenarPorNombre);
    }
    
    // La lista 'categorias(false)' solo incluye ACTIVAS: 
    // - Si se deshabilita/elimina (activa: false), eliminar de la lista de activas
    // - Si se habilita (activa: true), agregar a la lista de activas en posición ordenada
    // - Si es otra actualización (nombre, imagen, etc.) y sigue activa, actualizar en la lista
    if (data.activa === false) {
      // Deshabilitada o eliminada: remover de lista de activas
      queryClient.setQueryData(queryKeys.public.categorias(false), (old) => {
        if (!Array.isArray(old)) return old;
        const idx = old.findIndex((item) => String(item.id) === String(id));
        if (idx >= 0) {
          const nueva = [...old];
          nueva.splice(idx, 1);
          return nueva;
        }
        return old;
      });
    } else if (data.activa === true) {
      // Habilitada o actualización manteniendo activa: agregar/actualizar en lista de activas
      actualizarLista(queryClient, queryKeys.public.categorias(false), data, id, accion, ordenarPorNombre);
    }

    // 3. Propagar cambio de categoría a productos que pertenecen a ella
    // (actualizan su campo `categoria` con el nuevo nombre)
    console.log('[DIAG] actualizarCacheCatalogo: propagando categoría a productos');
    actualizarListasProductosPorCategoria(queryClient, data);

  } else if (tipo === 'promocion') {
    const key = queryKeys.public.promocion(id);
    console.log('[DIAG PROMO] setQueryData detalle promocion', { key, dataKeys: Object.keys(data), hasProductos: !!data.Productos, dataActiva: data.activa });
    queryClient.setQueryData(key, data);

    // Variantes de lista de promociones
    console.log('[DIAG PROMO] actualizando listas de promociones', { accion, id });
    
    // Helper para actualizar lista de promociones preservando productos en variantes con incluirProductos
    const actualizarListaPromocion = (clave, incluirProductos) => {
      console.log('[DIAG PROMO] actualizarListaPromocion INICIO', { clave: clave.join('.'), incluirProductos });
      const beforeCache = queryClient.getQueryData(clave);
      console.log('[DIAG PROMO] CACHE ANTES', { clave: clave.join('.'), isArray: Array.isArray(beforeCache), length: beforeCache?.length, firstId: beforeCache?.[0]?.id, firstHasProductos: !!beforeCache?.[0]?.Productos ?? !!beforeCache?.[0]?.productos });
      
      queryClient.setQueryData(clave, (old) => {
        if (!Array.isArray(old)) {
          console.log('[DIAG PROMO] CACHE NO ES ARRAY', { clave: clave.join('.'), old });
          return old;
        }
        const idx = old.findIndex((item) => String(item.id) === String(id));
        console.log('[DIAG PROMO] ÍNDICE ENCONTRADO', { clave: clave.join('.'), idx, buscadoId: id, primerItemId: old[0]?.id });
        
        if (accion === 'eliminado') {
          if (idx >= 0) {
            const nueva = [...old];
            nueva.splice(idx, 1);
            console.log('[DIAG PROMO] ELIMINADO', { clave: clave.join('.'), newLength: nueva.length });
            return nueva;
          }
          return old;
        }
        if (accion === 'creado') {
          const nueva = [...old, data];
          console.log('[DIAG PROMO] CREADO', { clave: clave.join('.'), newLength: nueva.length });
          return ordenarPorNombre ? nueva.sort(ordenarPorNombre) : nueva;
        }
        // actualizado: merge con datos existentes para preservar productos en variantes con incluirProductos
        if (idx >= 0) {
          const existente = old[idx];
          // El cache de lista usa 'productos' (minúscula), el evento trae 'Productos' (mayúscula)
          const existentesProductos = existente.Productos ?? existente.productos;
          const dataProductos = data.Productos ?? data.productos;
          console.log('[DIAG PROMO] ACTUALIZADO - merge', { 
            clave: clave.join('.'), 
            incluirProductos, 
            existenteHasProductos: !!existentesProductos, 
            dataHasProductos: !!dataProductos,
            existenteActiva: existente.activa,
            dataActiva: data.activa
          });
          // Si la variante incluye productos y el dato nuevo no trae productos pero el cache sí, preservar
          // Normalizar: el cache de lista usa 'productos' (minúscula)
          let merged = data;
          if (incluirProductos && existentesProductos && !dataProductos) {
            merged = { ...data, productos: existentesProductos };
          } else if (incluirProductos && dataProductos) {
            // El evento trae 'Productos' (mayúscula), la lista usa 'productos' (minúscula)
            merged = { ...data, productos: dataProductos };
          }
          const nueva = [...old];
          nueva[idx] = merged;
          console.log('[DIAG PROMO] ACTUALIZADO RESULTADO', { 
            clave: clave.join('.'), 
            mergedKeys: Object.keys(merged), 
            mergedHasProductos: !!merged.Productos ?? !!merged.productos,
            mergedProductosLength: merged.Productos?.length ?? merged.productos?.length
          });
          return ordenarPorNombre ? nueva.sort(ordenarPorNombre) : nueva;
        }
        // Si no existe en la lista (caso raro), agregar
        const nueva = [...old, data];
        console.log('[DIAG PROMO] AGREGADO (no existía)', { clave: clave.join('.'), newLength: nueva.length });
        return ordenarPorNombre ? nueva.sort(ordenarPorNombre) : nueva;
      });
      
      const afterCache = queryClient.getQueryData(clave);
      console.log('[DIAG PROMO] CACHE DESPUÉS', { clave: clave.join('.'), isArray: Array.isArray(afterCache), length: afterCache?.length, firstId: afterCache?.[0]?.id, firstHasProductos: !!afterCache?.[0]?.Productos ?? !!afterCache?.[0]?.productos });
    };

    // 4 variantes: incluirInactivas (true/false) x incluirProductos (true/false)
    actualizarListaPromocion(queryKeys.public.promociones({ incluirInactivas: false, incluirProductos: false }), false);
    actualizarListaPromocion(queryKeys.public.promociones({ incluirInactivas: true, incluirProductos: false }), false);
    actualizarListaPromocion(queryKeys.public.promociones({ incluirInactivas: false, incluirProductos: true }), true);
    actualizarListaPromocion(queryKeys.public.promociones({ incluirInactivas: true, incluirProductos: true }), true);

  } else if (tipo === 'personalizacion') {
    // Personalización: actualizar elemento individual y listas
    const key = queryKeys.public.personalizacionElemento(id);
    console.log('[DIAG] actualizarCacheCatalogo: setQueryData elemento personalizacion', key);
    queryClient.setQueryData(key, data);

    // Lista general de personalización (por producto y global)
    queryClient.setQueryData(queryKeys.public.personalizacion(), (old) => {
      if (!Array.isArray(old)) return old;
      const idx = old.findIndex((item) => String(item.id) === String(id));
      if (accion === 'eliminado') {
        if (idx >= 0) return old.filter((item) => String(item.id) !== String(id));
        return old;
      }
      if (accion === 'creado') {
        return [...old, data].sort(ordenarPorNombre);
      }
      if (idx >= 0) {
        const nueva = [...old];
        nueva[idx] = data;
        return nueva.sort(ordenarPorNombre);
      }
      return [...old, data].sort(ordenarPorNombre);
    });

    // También actualizar por producto si aplica
    if (data.productoId) {
      queryClient.setQueryData(queryKeys.public.personalizacion(data.productoId), (old) => {
        if (!Array.isArray(old)) return old;
        const idx = old.findIndex((item) => String(item.id) === String(id));
        if (accion === 'eliminado') {
          if (idx >= 0) return old.filter((item) => String(item.id) !== String(id));
          return old;
        }
        if (accion === 'creado') {
          return [...old, data].sort(ordenarPorNombre);
        }
        if (idx >= 0) {
          const nueva = [...old];
          nueva[idx] = data;
          return nueva.sort(ordenarPorNombre);
        }
        return [...old, data].sort(ordenarPorNombre);
      });
    }
  }
};

/**
 * Actualiza la caché con los datos recibidos en un evento de personalización
 * (elemento por producto o plantilla por categoría).
 * Usa setQueryData para actualizar directamente la caché sin refetch.
 * @param {import('@tanstack/react-query').QueryClient} queryClient
 * @param {object} payload - { tipo, id, accion, data, updatedAt }
 */
const actualizarCachePersonalizacion = (queryClient, payload) => {
  const { tipo, id, accion, data, updatedAt } = payload;
  console.log('[DIAG PERS] actualizarCachePersonalizacion: procesando', { tipo, id, accion, hasData: !!data });
  if (!data) {
    console.log('[DIAG PERS] actualizarCachePersonalizacion: sin data, abortando');
    return;
  }

  // Comparación de versiones para evitar eventos duplicados/desordenados
  const cacheKey = tipo === 'personalizacion'
    ? queryKeys.public.personalizacionElemento(id)
    : queryKeys.public.plantilla(id);
  const cached = queryClient.getQueryData(cacheKey);
  if (cached && cached.updatedAt && updatedAt) {
    const cachedTime = new Date(cached.updatedAt).getTime();
    const incomingTime = new Date(updatedAt).getTime();
    if (incomingTime < cachedTime) {
      console.log('[DIAG PERS] actualizarCachePersonalizacion: evento obsoleto, ignorando', { cachedTime, incomingTime });
      return;
    }
  }

  const ordenarPorNombre = (a, b) =>
    String(a.nombre).localeCompare(String(b.nombre), 'es');

  if (tipo === 'personalizacion') {
    // 1. Actualizar el elemento individual
    const key = queryKeys.public.personalizacionElemento(id);
    console.log('[DIAG PERS] setQueryData elemento personalizacion', key);
    queryClient.setQueryData(key, data);

    // 2. Actualizar lista general de personalización (todas)
    queryClient.setQueryData(queryKeys.public.personalizacion(), (old) => {
      if (!Array.isArray(old)) return old;
      const idx = old.findIndex((item) => String(item.id) === String(id));
      if (accion === 'eliminado') {
        if (idx >= 0) return old.filter((item) => String(item.id) !== String(id));
        return old;
      }
      if (accion === 'creado') {
        return [...old, data].sort(ordenarPorNombre);
      }
      if (idx >= 0) {
        const nueva = [...old];
        nueva[idx] = data;
        return nueva.sort(ordenarPorNombre);
      }
      return [...old, data].sort(ordenarPorNombre);
    });

    // 3. Actualizar lista por producto si aplica
    if (data.productoId) {
      queryClient.setQueryData(queryKeys.public.personalizacion(data.productoId), (old) => {
        if (!Array.isArray(old)) return old;
        const idx = old.findIndex((item) => String(item.id) === String(id));
        if (accion === 'eliminado') {
          if (idx >= 0) return old.filter((item) => String(item.id) !== String(id));
          return old;
        }
        if (accion === 'creado') {
          return [...old, data].sort(ordenarPorNombre);
        }
        if (idx >= 0) {
          const nueva = [...old];
          nueva[idx] = data;
          return nueva.sort(ordenarPorNombre);
        }
        return [...old, data].sort(ordenarPorNombre);
      });
    }

  } else if (tipo === 'personalizacion_categoria') {
    // 1. Actualizar la plantilla individual
    const key = queryKeys.public.plantilla(id);
    console.log('[DIAG PERS] setQueryData plantilla categoria', key);
    queryClient.setQueryData(key, data);

    // 2. Actualizar lista general de plantillas
    queryClient.setQueryData(queryKeys.public.plantillas, (old) => {
      if (!Array.isArray(old)) return old;
      const idx = old.findIndex((item) => String(item.id) === String(id));
      if (accion === 'eliminado') {
        if (idx >= 0) return old.filter((item) => String(item.id) !== String(id));
        return old;
      }
      if (accion === 'creado') {
        return [...old, data].sort(ordenarPorNombre);
      }
      if (idx >= 0) {
        const nueva = [...old];
        nueva[idx] = data;
        return nueva.sort(ordenarPorNombre);
      }
      return [...old, data].sort(ordenarPorNombre);
    });

    // 3. Actualizar lista por categoría si aplica
    if (data.categoriaId) {
      queryClient.setQueryData(queryKeys.public.plantillasCategoria(data.categoriaId), (old) => {
        if (!Array.isArray(old)) return old;
        const idx = old.findIndex((item) => String(item.id) === String(id));
        if (accion === 'eliminado') {
          if (idx >= 0) return old.filter((item) => String(item.id) !== String(id));
          return old;
        }
        if (accion === 'creado') {
          return [...old, data].sort(ordenarPorNombre);
        }
        if (idx >= 0) {
          const nueva = [...old];
          nueva[idx] = data;
          return nueva.sort(ordenarPorNombre);
        }
        return [...old, data].sort(ordenarPorNombre);
      });
    }
  }

  // Notificar a carritos no confirmados que recalculen precios
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('personalizacion-cambio', {
      detail: { tipo, id, accion, data }
    }));
  }
};

/**
 * Invalida todo lo que depende de los parámetros de negocio.
 * @param {import('@tanstack/react-query').QueryClient} queryClient
 */
const invalidarParametros = (queryClient) => {
  queryClient.invalidateQueries({ queryKey: queryKeys.public.parametros });
};

/**
 * Actualiza solo los parámetros modificados en la caché.
 * Recibe SOLO los parámetros que cambiaron (no la lista completa).
 * @param {import('@tanstack/react-query').QueryClient} queryClient
 * @param {Array} parametrosModificados - Array de parámetros que cambiaron [{ clave, valor, ... }]
 */
const actualizarParametrosCache = (queryClient, parametrosModificados) => {
  if (!Array.isArray(parametrosModificados) || parametrosModificados.length === 0) {
    return;
  }

  const claveCache = queryKeys.public.parametros;
  const cacheActual = queryClient.getQueryData(claveCache);

  if (!Array.isArray(cacheActual)) {
    console.log('[DIAG PARAMS] Cache no es array, no se puede actualizar selectivamente');
    return;
  }

  console.log('[DIAG PARAMS] Actualizando parámetros modificados:', parametrosModificados.map(p => p.clave));

  // Crear mapa de parámetros modificados para búsqueda O(1)
  const modificadosPorClave = new Map();
  for (const p of parametrosModificados) {
    if (p && p.clave) {
      modificadosPorClave.set(p.clave, p);
    }
  }

  // Actualizar SOLO los parámetros que cambiaron
  queryClient.setQueryData(claveCache, (old) => {
    if (!Array.isArray(old)) return old;
    return old.map((p) => modificadosPorClave.has(p.clave) ? modificadosPorClave.get(p.clave) : p);
  });
};

/**
 * Invalida el stock de la sucursal operativa (árbol privado).
 * Se usa sólo al reconectar: ahí no hay aviso con detalle y hay que
 * resincronizar por REST lo que pudo perderse mientras el canal estaba caído.
 * @param {import('@tanstack/react-query').QueryClient} queryClient
 */
const invalidarStock = (queryClient) => {
  queryClient.invalidateQueries({ queryKey: queryKeys.private.stock });
};

/** Normaliza una lista de IDs del payload, sin duplicados ni valores inválidos. */
const idsUnicos = (lista) => [
  ...new Set(
    (Array.isArray(lista) ? lista : [])
      .map((valor) => Number(valor))
      .filter((valor) => Number.isInteger(valor) && valor > 0)
  ),
];

/** Mismo orden que devuelve el backend para el listado de insumos. */
const ordenarInsumos = (a, b) => {
  const porTipo = String(a.tipo ?? '').localeCompare(String(b.tipo ?? ''), 'es');
  return porTipo !== 0
    ? porTipo
    : String(a.insumo ?? '').localeCompare(String(b.insumo ?? ''), 'es');
};

/**
 * Trae por REST únicamente las filas afectadas por un aviso de stock. El evento
 * sólo trae IDs, así que cada insumo/producto se pide por separado en lugar de
 * volver a pedir la lista completa.
 *
 * Las respuestas se separan: las exitosas se aplican igual aunque otra haya
 * fallado, los 404 se devuelven como bajas para quitar esas filas de la caché y
 * el resto de los fallos se cuenta para decidir si hace falta una
 * resincronización completa.
 * @returns {Promise<{filas: Array, insumos: Array, productosDadosDeBaja: Array,
 *   insumosDadosDeBaja: Array, fallos: number}>}
 */
const obtenerFilasDeStock = async ({ sucursalId, productoIds, insumoIds }) => {
  const pedir = async (solicitud) => {
    try {
      return (await solicitud()) ?? { success: false };
    } catch {
      return { success: false };
    }
  };
  const [respuestasProductos, respuestasInsumos] = await Promise.all([
    Promise.all(
      productoIds.map((productoId) =>
        pedir(() => obtenerStockDeProducto(sucursalId, productoId))
      )
    ),
    Promise.all(
      insumoIds.map((insumoId) => pedir(() => obtenerStockInsumo(insumoId)))
    ),
  ]);

  const filas = [];
  const insumos = [];
  const productosDadosDeBaja = [];
  const insumosDadosDeBaja = [];
  let fallos = 0;

  respuestasProductos.forEach((respuesta, indice) => {
    if (respuesta.success && respuesta.data) {
      filas.push(respuesta.data);
    } else if (respuesta.status === 404) {
      // El producto ya no tiene stock en la sucursal: se quita su fila.
      productosDadosDeBaja.push(productoIds[indice]);
    } else {
      fallos += 1;
    }
  });

  respuestasInsumos.forEach((respuesta, indice) => {
    if (respuesta.success && respuesta.data) {
      insumos.push(respuesta.data);
    } else if (respuesta.status === 404) {
      // El insumo fue dado de baja: se quita su fila.
      insumosDadosDeBaja.push(insumoIds[indice]);
    } else {
      fallos += 1;
    }
  });

  return {
    filas,
    insumos,
    productosDadosDeBaja,
    insumosDadosDeBaja,
    fallos,
  };
};

/**
 * Aplica las filas nuevas sobre una entrada `{ filas, insumos }` de la caché y
 * quita las filas cuyos IDs llegaron como baja (404).
 * `filtrarProductoId` indica que la consulta está acotada a un producto: en ese
 * caso no se agregan filas que quedarían fuera del filtro.
 */
const aplicarFilasEnStock = (
  data,
  {
    filas,
    insumos,
    productosDadosDeBaja = [],
    insumosDadosDeBaja = [],
  },
  { filtrarProductoId }
) => {
  if (!data || !Array.isArray(data.filas) || !Array.isArray(data.insumos)) {
    return data;
  }
  let cambio = false;

  const productosBajas = new Set(productosDadosDeBaja.map((id) => Number(id)));
  const filasPorId = new Map(filas.map((fila) => [Number(fila.productoId), fila]));
  const nuevasFilas = [];
  for (const fila of data.filas) {
    if (productosBajas.has(Number(fila.productoId))) {
      cambio = true;
      continue;
    }
    const nueva = filasPorId.get(Number(fila.productoId));
    if (nueva) {
      cambio = true;
      nuevasFilas.push(nueva);
    } else {
      nuevasFilas.push(fila);
    }
  }
  if (!filtrarProductoId) {
    for (const fila of filas) {
      const existe = nuevasFilas.some(
        (actual) => Number(actual.productoId) === Number(fila.productoId)
      );
      if (!existe) {
        nuevasFilas.push(fila);
        cambio = true;
      }
    }
  }

  const insumosPorId = new Map(
    insumos.map((fila) => [Number(fila.insumoId), fila])
  );
  const insumosBajas = new Set(insumosDadosDeBaja.map((id) => Number(id)));
  const nuevosInsumos = [];
  for (const fila of data.insumos) {
    if (insumosBajas.has(Number(fila.insumoId))) {
      cambio = true;
      continue;
    }
    const nueva = insumosPorId.get(Number(fila.insumoId));
    if (nueva) {
      cambio = true;
      nuevosInsumos.push(nueva);
    } else {
      nuevosInsumos.push(fila);
    }
  }
  let insumoAgregado = false;
  for (const fila of insumos) {
    const existe = nuevosInsumos.some(
      (actual) => Number(actual.insumoId) === Number(fila.insumoId)
    );
    if (!existe) {
      nuevosInsumos.push(fila);
      insumoAgregado = true;
      cambio = true;
    }
  }

  if (!cambio) return data;
  return {
    ...data,
    filas: nuevasFilas,
    insumos: insumoAgregado ? nuevosInsumos.sort(ordenarInsumos) : nuevosInsumos,
  };
};

/**
 * Actualiza en la caché sólo las filas de stock que cambiaron, sin invalidar ni
 * volver a pedir la lista completa. Si la pantalla de stock no está cargada no
 * hace ninguna petición: la próxima lectura ya trae los valores actuales.
 * @param {import('@tanstack/react-query').QueryClient} queryClient
 * @param {{sucursalId?: number, productoIds?: Array, insumoIds?: Array}} payload
 */
const actualizarStockEnCache = async (queryClient, payload) => {
  const sucursalId = Number(payload?.sucursalId);
  if (!Number.isInteger(sucursalId) || sucursalId <= 0) return;

  const productoIds = idsUnicos(payload?.productoIds);
  const insumoIds = idsUnicos(payload?.insumoIds);

  // Aviso sin detalle (contrato anterior): no hay forma de actualizar filas
  // puntuales, así que se conserva el comportamiento de resincronizar.
  if (productoIds.length === 0 && insumoIds.length === 0) {
    invalidarStock(queryClient);
    return;
  }

  // Sólo las consultas de stock de esta sucursal. La clave es
  // ['private','stock','lista', sucursalId, productoId].
  const consultas = queryClient
    .getQueriesData({ queryKey: queryKeys.private.stock })
    .filter(([clave, data]) => String(clave[3]) === String(sucursalId) && data);
  if (consultas.length === 0) return;

  const datos = await obtenerFilasDeStock({
    sucursalId,
    productoIds,
    insumoIds,
  });

  const huboRespuestas =
    datos.filas.length > 0 ||
    datos.insumos.length > 0 ||
    datos.productosDadosDeBaja.length > 0 ||
    datos.insumosDadosDeBaja.length > 0;

  // Los fallos puntuales no invalidan la caché: se aplica lo que sí llegó y se
  // conservan las filas válidas. Sólo si fallaron TODAS las lecturas de un aviso
  // con varios IDs (no hay nada que aplicar) se resincroniza la lista completa.
  const totalSolicitudes = productoIds.length + insumoIds.length;
  if (datos.fallos > 0 && !huboRespuestas && totalSolicitudes > 1) {
    invalidarStock(queryClient);
    return;
  }
  if (!huboRespuestas) return;

  for (const [clave] of consultas) {
    const filtrarProductoId = clave[4] !== 'todos';
    queryClient.setQueryData(clave, (previo) =>
      aplicarFilasEnStock(previo, datos, { filtrarProductoId })
    );
  }
};

/**
 * Componente sin UI: mantiene los listeners del socket atados al ciclo de vida
 * de la sesión.
 * @returns {null} No renderiza nada.
 */
const RealtimeBridge = () => {
  const queryClient = useQueryClient();
  const { user, hydrated, actualizarSucursalOperativa } = useAuth();
  const { versionSocket } = useSucursalOperativa();

  const emailSesion = user?.email;
  const haySesion = hydrated && Boolean(emailSesion);

  useEffect(() => {
    // Esperar a que la hidratación termine antes de conectar.
    // El socket se conecta SIEMPRE (incluso sin sesión) para recibir
    // eventos públicos de catálogo y parámetros.
    if (!hydrated) {
      console.log('[DIAG] RealtimeBridge: esperando hidratación...');
      return undefined;
    }

    console.log('[DIAG] RealtimeBridge: hidratación completa, conectando socket...', { haySesion });
    const instancia = conectarSocket();
    if (!instancia) {
      console.log('[DIAG] RealtimeBridge: no se pudo conectar socket');
      return undefined;
    }
    console.log('[DIAG] RealtimeBridge: socket conectado, registrando listeners...', { connected: instancia.connected });

    // Handlers para eventos PÚBLICOS (catálogo, parámetros, personalización, insumos)
    // Se registran SIEMPRE, incluso sin sesión.
    const alCambiarCatalogo = (payload) => {
      console.log('[DIAG PROMO] RealtimeBridge: CATALOGO_ACTUALIZADO recibido', { 
        tipo: payload?.tipo, 
        id: payload?.id, 
        accion: payload?.accion, 
        hasData: !!payload?.data,
        dataKeys: payload?.data ? Object.keys(payload.data) : [],
        dataActiva: payload?.data?.activa,
        dataHasProductos: !!payload?.data?.Productos,
        dataProductosLength: payload?.data?.Productos?.length
      });
      actualizarCacheCatalogo(queryClient, payload);
    };
    const alCambiarParametros = (payload) => {
      console.log('[DIAG] RealtimeBridge: PARAMETROS_ACTUALIZADOS recibido', { payload });
      if (payload?.parametros && Array.isArray(payload.parametros)) {
        actualizarParametrosCache(queryClient, payload.parametros);
      } else {
        // Fallback: invalidar si no vienen datos en el payload
        invalidarParametros(queryClient);
      }
    };
    // Alta, edición o baja lógica de una sucursal: el evento trae el elemento
    // afectado, así que se aplica a la caché sin pedir la lista completa y,
    // si es la sucursal operativa de esta sesión, se refresca su nombre en el
    // estado del usuario (navbar, encabezados operativos) sin otro GET.
    const alCambiarSucursal = (payload) => {
      actualizarSucursalEnCache(queryClient, payload);
      if (payload?.data) actualizarSucursalOperativa(payload.data);
    };
    // Personalización: elemento por producto o plantilla por categoría
    const alCambiarPersonalizacion = (payload) => {
      console.log('[DIAG PERS] RealtimeBridge: PERSONALIZACION recibido', {
        tipo: payload?.tipo,
        id: payload?.id,
        accion: payload?.accion,
        hasData: !!payload?.data
      });
      actualizarCachePersonalizacion(queryClient, payload);
    };

    // Handlers para eventos PRIVADOS (requieren sesión autenticada)
    const alCambiarStock = (payload) => {
      actualizarStockEnCache(queryClient, payload).catch((error) => {
        console.error(
          '[RealtimeBridge] No se pudo actualizar el stock en la caché:',
          error
        );
      });
    };

    // Registrar listeners PÚBLICOS siempre
    instancia.on(EVENTOS_SOCKET.CATALOGO_ACTUALIZADO, alCambiarCatalogo);
    instancia.on(EVENTOS_SOCKET.PARAMETROS_ACTUALIZADOS, alCambiarParametros);
    instancia.on(EVENTOS_SOCKET.SUCURSAL_ACTUALIZADO, alCambiarSucursal);
    instancia.on(EVENTOS_SOCKET.PERSONALIZACION_ACTUALIZADO, alCambiarPersonalizacion);
    instancia.on(EVENTOS_SOCKET.PERSONALIZACION_CATEGORIA_ACTUALIZADA, alCambiarPersonalizacion);

    // Registrar listeners PRIVADOS solo si hay sesión
    if (haySesion) {
      instancia.on(EVENTOS_SOCKET.STOCK_ACTUALIZADO, alCambiarStock);
    }

    // Una reconexión pudo perder avisos mientras el canal estaba caído: se
    // invalida todo lo que este puente vigila para resincronizar por REST.
    // Para parámetros NO invalidamos: el evento PARAMETROS_ACTUALIZADOS trae la
    // lista completa actualizada y actualizamos la caché granularmente.
    const desregistrarReconexion = alReconectar(instancia, () => {
      invalidarCatalogo(queryClient);
      // Personalización: revalidar listas si ya estaban cargadas
      queryClient.invalidateQueries({ queryKey: ['public', 'personalizacion'] });
      queryClient.invalidateQueries({ queryKey: ['public', 'personalizacion', 'plantillas'] });
      // Sucursales: revalidar SOLO si alguna de las dos listas ya estaba
      // cargada (invalidateQueries sólo refetchea las consultas activas).
      queryClient.invalidateQueries({ queryKey: ['public', 'sucursales'] });
      if (haySesion) {
        invalidarStock(queryClient);
      }
    });

    return () => {
      desregistrarReconexion();
      instancia.off(EVENTOS_SOCKET.CATALOGO_ACTUALIZADO, alCambiarCatalogo);
      instancia.off(EVENTOS_SOCKET.PARAMETROS_ACTUALIZADOS, alCambiarParametros);
      instancia.off(EVENTOS_SOCKET.SUCURSAL_ACTUALIZADO, alCambiarSucursal);
      instancia.off(EVENTOS_SOCKET.PERSONALIZACION_ACTUALIZADO, alCambiarPersonalizacion);
      instancia.off(EVENTOS_SOCKET.PERSONALIZACION_CATEGORIA_ACTUALIZADA, alCambiarPersonalizacion);
      if (haySesion) {
        instancia.off(EVENTOS_SOCKET.STOCK_ACTUALIZADO, alCambiarStock);
      }
    };
    // `versionSocket` cambia cuando el superadmin elige/limpia su sucursal de
    // contexto: el socket se recrea con otra sesión y hay que registrar los
    // listeners sobre la instancia nueva.
  }, [hydrated, haySesion, queryClient, versionSocket, actualizarSucursalOperativa]);

  return null;
};

export default RealtimeBridge;
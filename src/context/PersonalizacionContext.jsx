import React, { createContext, useState, useCallback, useMemo, useEffect } from 'react';
import {
  obtenerElementos,
  crearElemento,
  actualizarElemento,
  eliminarElemento,
} from '../api/personalizacion';
import { personalizacionPorCategoria } from '../services/personalizacionConfig';

export const PersonalizacionContext = createContext(null);

// Normaliza el catálogo de fallback por categoría (usa strings para
// personalizar/condimento y objetos sin rango) al shape uniforme que consume
// el modal: { id, nombre, precio, productoReferenciaId, minimo, maximo }.
const normalizarItemFallback = (item, tipo) => {
  if (tipo === 'personalizar' || tipo === 'condimento') {
    const nombre = typeof item === 'string' ? item : item.nombre;
    return { id: nombre, nombre, minimo: 0, maximo: 1 };
  }
  return { ...item, minimo: item.minimo ?? 0, maximo: item.maximo ?? 1 };
};

export const PersonalizacionProvider = ({ children }) => {
  const [elementos, setElementos] = useState([]);
  const [loading, setLoading] = useState(false);

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const res = await obtenerElementos();
      if (res.success) setElementos(res.data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const agregar = useCallback(async (datos) => {
    const res = await crearElemento(datos);
    if (res.success) setElementos((prev) => [...prev, res.data]);
    return res;
  }, []);

  const actualizar = useCallback(async (id, datos) => {
    const res = await actualizarElemento(id, datos);
    if (res.success) setElementos((prev) => prev.map((e) => (String(e.id) === String(id) ? res.data : e)));
    return res;
  }, []);

  const eliminar = useCallback(async (id) => {
    const res = await eliminarElemento(id);
    if (res.success) setElementos((prev) => prev.filter((e) => String(e.id) !== String(id)));
    return res;
  }, []);

  const getPorProducto = useCallback(
    (productoId) => elementos.filter((e) => String(e.productoId) === String(productoId) && e.activo),
    [elementos]
  );

  const getPorProductoYTipo = useCallback(
    (productoId, tipo) => elementos.filter((e) => String(e.productoId) === String(productoId) && e.tipo === tipo && e.activo),
    [elementos]
  );

  // Adaptador para el modal cliente: devuelve shape {extra, personalizar, acompanar, condimento} por productoId
  // Per-tipo fallback: si para un tipo no hay ningún elemento creado para el producto, se usa el de la categoría (compat)
  // Si hay al menos uno creado (aunque todos inactivos), se respeta solo los activos (puede quedar vacío)
  const getConfigParaProducto = useCallback(
    (producto) => {
      const vacio = { extra: [], personalizar: [], acompanar: [], condimento: [] };
      if (!producto) return vacio;
      const todosPorProducto = elementos.filter((e) => String(e.productoId) === String(producto.id));
      const activos = todosPorProducto.filter((e) => e.activo);
      const cfgCategoria = personalizacionPorCategoria[producto.categoria] || vacio;

      // Fallback normalizado al shape uniforme (todos los tipos con id/nombre/minimo/maximo).
      const fallback = {
        extra: (cfgCategoria.extra || []).map((i) => normalizarItemFallback(i, 'extra')),
        personalizar: (cfgCategoria.personalizar || []).map((i) => normalizarItemFallback(i, 'personalizar')),
        acompanar: (cfgCategoria.acompanar || []).map((i) => normalizarItemFallback(i, 'acompanar')),
        condimento: (cfgCategoria.condimento || []).map((i) => normalizarItemFallback(i, 'condimento')),
      };

      if (todosPorProducto.length === 0) return fallback;

      const porTipo = (tipo) => todosPorProducto.filter((e) => e.tipo === tipo);
      const activosPorTipo = (tipo) => activos.filter((e) => e.tipo === tipo);

      return {
        extra:
          porTipo('extra').length === 0
            ? fallback.extra
            : activosPorTipo('extra').map((e) => ({
                id: String(e.id),
                nombre: e.nombre,
                precio: e.precio,
                minimo: e.minimo ?? 0,
                maximo: e.maximo ?? 1,
              })),
        personalizar:
          porTipo('personalizar').length === 0
            ? fallback.personalizar
            : activosPorTipo('personalizar').map((e) => ({
                id: String(e.id),
                nombre: e.nombre,
                minimo: e.minimo ?? 0,
                maximo: e.maximo ?? 1,
              })),
        acompanar:
          porTipo('acompanar').length === 0
            ? fallback.acompanar
            : activosPorTipo('acompanar').map((e) => ({
                id: String(e.id),
                nombre: e.nombre,
                precio: e.precio,
                productoReferenciaId: e.productoReferenciaId,
                minimo: e.minimo ?? 0,
                maximo: e.maximo ?? 1,
              })),
        condimento:
          porTipo('condimento').length === 0
            ? fallback.condimento
            : activosPorTipo('condimento').map((e) => ({
                id: String(e.id),
                nombre: e.nombre,
                minimo: e.minimo ?? 0,
                maximo: e.maximo ?? 1,
              })),
      };
    },
    [elementos]
  );

  const value = useMemo(
    () => ({
      elementos,
      loading,
      cargar,
      agregar,
      actualizar,
      eliminar,
      getPorProducto,
      getPorProductoYTipo,
      getConfigParaProducto,
    }),
    [elementos, loading, cargar, agregar, actualizar, eliminar, getPorProducto, getPorProductoYTipo, getConfigParaProducto]
  );

  return <PersonalizacionContext.Provider value={value}>{children}</PersonalizacionContext.Provider>;
};

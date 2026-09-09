import React, { createContext, useState, useCallback, useMemo, useEffect } from 'react';
import {
  obtenerElementos,
  crearElemento,
  actualizarElemento,
  eliminarElemento,
} from '../api/personalizacion';
import { personalizacionPorCategoria, LIMITES } from '../services/personalizacionConfig';

export const PersonalizacionContext = createContext(null);

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
      if (!producto) return { extra: [], personalizar: [], acompanar: [], condimento: [] };
      const todosPorProducto = elementos.filter((e) => String(e.productoId) === String(producto.id));
      const activos = todosPorProducto.filter((e) => e.activo);
      const cfgCategoria = personalizacionPorCategoria[producto.categoria] || { extra: [], personalizar: [], acompanar: [], condimento: [] };

      if (todosPorProducto.length === 0) return cfgCategoria;

      const porTipo = (tipo) => todosPorProducto.filter((e) => e.tipo === tipo);
      const activosPorTipo = (tipo) => activos.filter((e) => e.tipo === tipo);

      const extraActivos = activosPorTipo('extra');
      const personalizarActivos = activosPorTipo('personalizar');
      const acompanarActivos = activosPorTipo('acompanar');
      const condimentoActivos = activosPorTipo('condimento');

      return {
        extra:
          porTipo('extra').length === 0
            ? cfgCategoria.extra
            : extraActivos.map((e) => ({ id: String(e.id), nombre: e.nombre, precio: e.precio })),
        personalizar:
          porTipo('personalizar').length === 0
            ? cfgCategoria.personalizar
            : personalizarActivos.map((e) => e.nombre),
        acompanar:
          porTipo('acompanar').length === 0
            ? cfgCategoria.acompanar
            : acompanarActivos.map((e) => ({ id: String(e.id), nombre: e.nombre, precio: e.precio, productoReferenciaId: e.productoReferenciaId })),
        condimento:
          porTipo('condimento').length === 0
            ? cfgCategoria.condimento
            : condimentoActivos.map((e) => e.nombre),
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
      LIMITES,
    }),
    [elementos, loading, cargar, agregar, actualizar, eliminar, getPorProducto, getPorProductoYTipo, getConfigParaProducto]
  );

  return <PersonalizacionContext.Provider value={value}>{children}</PersonalizacionContext.Provider>;
};

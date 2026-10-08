/**
 * Propósito: Contexto de parámetros de negocio. Mantiene en un solo lugar el
 *            valor vigente de las reglas configurables (envío, límites del
 *            carrito, mínimo/máximo de pedido, combo y promociones) que el
 *            backend expone en GET /api/parametros.
 * Contenido: ParametrosProvider, ParametrosContext, con el mapa { clave: valor },
 *            el catálogo completo y funciones de recarga/actualización.
 * Dependencias: React (createContext, useState, useCallback, useMemo, useEffect),
 *               api/parametros.js.
 * Uso: <ParametrosProvider> envuelve la app en App.jsx. Consumir con useParametros().
 *
 * El backend es la autoridad: acá solo se leen los valores para no duplicar
 * reglas. Los valores por defecto de `PARAMETROS_POR_DEFECTO` son el respaldo
 * para el primer render (antes de que responda el backend) y para que la app
 * siga siendo usable si la API no responde.
 */

import {
  createContext,
  useState,
  useCallback,
  useMemo,
  useEffect,
} from 'react';
import { obtenerParametros, actualizarParametros } from '../api/parametros';

export const ParametrosContext = createContext(null);

/** Respaldo con los valores por defecto del catálogo del backend. */
export const PARAMETROS_POR_DEFECTO = {
  montoMinimoEnvioGratis: 10000,
  costoEnvioFijo: 350,
  radioCoberturaKm: 5,
  cantidadMaximaProductoCarrito: 20,
  minimoComponentesCombo: 2,
  montoMinimoPedido: 2000,
  montoMaximoPedido: 500000,
  cantidadMaximaItemsPedido: 50,
  cantidadMaximaUnidadesProducto: 20,
  porcentajeMaximoDescuento: 50,
  cantidadMaximaPromocionesAplicables: 3,
};

/**
 * Convierte el catálogo (array) en un mapa { clave: valor } para leerlo directo.
 * @param {Array} lista - Catálogo del backend.
 * @returns {Object} Mapa de valores numéricos.
 */
const aMapa = (lista) => {
  const mapa = { ...PARAMETROS_POR_DEFECTO };
  for (const parametro of lista || []) {
    if (parametro && parametro.clave !== undefined) {
      mapa[parametro.clave] = Number(parametro.valor);
    }
  }
  return mapa;
};

/**
 * Proveedor del contexto de parámetros.
 * @param {React.ReactNode} children - Componentes hijos.
 */
export const ParametrosProvider = ({ children }) => {
  const [lista, setLista] = useState([]);
  const [parametros, setParametros] = useState(PARAMETROS_POR_DEFECTO);
  const [loading, setLoading] = useState(false);

  /**
   * Recarga el catálogo desde el backend. Si falla, conserva los valores que ya
   * tenía (los de por defecto la primera vez) para no romper los cálculos.
   * @returns {Promise<Array>} Catálogo vigente.
   */
  const recargar = useCallback(async () => {
    setLoading(true);
    try {
      const result = await obtenerParametros();
      if (result.success) {
        setLista(result.data);
        setParametros(aMapa(result.data));
        return result.data;
      }
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Actualiza parámetros (solo superadmin) y sincroniza el estado local con el
   * catálogo que devuelve el backend.
   * @param {Object} cambios - { clave: valor }.
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  const actualizar = useCallback(async (cambios) => {
    const result = await actualizarParametros(cambios);
    if (result.success) {
      setLista(result.data);
      setParametros(aMapa(result.data));
      return { success: true };
    }
    return { success: false, error: result.error };
  }, []);

  useEffect(() => {
    recargar();
  }, [recargar]);

  const value = useMemo(
    () => ({ parametros, lista, loading, recargar, actualizar }),
    [parametros, lista, loading, recargar, actualizar]
  );

  return (
    <ParametrosContext.Provider value={value}>
      {children}
    </ParametrosContext.Provider>
  );
};
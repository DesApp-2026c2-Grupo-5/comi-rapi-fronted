/**
 * Propósito: Contexto de parámetros de negocio. Mantiene en un solo lugar el
 *            valor vigente de las reglas configurables (envío, límites del
 *            carrito, mínimo/máximo de pedido, combo y promociones) que el
 *            backend expone en GET /api/parametros.
 * Contenido: ParametrosProvider, ParametrosContext, con el mapa { clave: valor },
 *            el catálogo completo y funciones de recarga/actualización.
 * Dependencias: React, @tanstack/react-query, api/parametros.js, hooks/queries.
 * Uso: <ParametrosProvider> envuelve la app en App.jsx. Consumir con useParametros().
 *
 * El backend es la autoridad: acá solo se leen los valores para no duplicar
 * reglas. Los valores por defecto de `PARAMETROS_POR_DEFECTO` son el respaldo
 * para el primer render (antes de que responda el backend) y para que la app
 * siga siendo usable si la API no responde.
 *
 * La lectura vive en la caché pública de TanStack Query. RealtimeBridge invalida
 * ['public', 'parametros'] cuando el backend avisa un cambio y el contexto se
 * re-renderiza con los datos frescos.
 */

import { createContext, useCallback, useEffect, useMemo, useRef } from 'react';
import PropTypes from 'prop-types';
import { useQueryClient } from '@tanstack/react-query';
import {
  actualizarParametros as actualizarParametrosApi,
  actualizarParametro as actualizarParametroApi,
} from '../api/parametros';
import { desconectarSocket } from '../services/socket';
import { useAuth } from '../hooks/useAuth';
import { queryKeys, useParametrosQuery } from '../hooks/queries';

export const ParametrosContext = createContext(null);

/** Respaldo con los valores por defecto del catálogo del backend. */
export const PARAMETROS_POR_DEFECTO = {
  montoMinimoEnvioGratis: 10000,
  costoEnvioFijo: 350,
  radioCoberturaKm: 5,
  margenCierreMinutos: 30,
  cantidadMaximaProductoCarrito: 20,
  minimoComponentesCombo: 2,
  montoMinimoPedido: 2000,
  montoMaximoPedido: 500000,
  cantidadMaximaItemsPedido: 50,
  cantidadMaximaUnidadesProducto: 20,
  minutosReservaStock: 15,
  porcentajeMaximoDescuento: 50,
  cantidadMaximaPromocionesAplicables: 3,
  stockCriticoUmbral: 5,
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
  const { user, hydrated } = useAuth();
  const queryClient = useQueryClient();
  const { data: lista = [], isLoading: loading, refetch } = useParametrosQuery();

  const parametros = useMemo(() => aMapa(lista), [lista]);

  /**
   * Recarga el catálogo desde el backend. Si falla, conserva los valores que ya
   * tenía (los de por defecto la primera vez) para no romper los cálculos.
   * @returns {Promise<Array>} Catálogo vigente.
   */
  const recargar = useCallback(async () => {
    const resultado = await refetch();
    return resultado.data || [];
  }, [refetch]);

  /**
   * Actualiza parámetros (solo superadmin) y sincroniza la caché con el
   * catálogo que devuelve el backend.
   * @param {Object} cambios - { clave: valor }.
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  const actualizar = useCallback(
    async (cambios) => {
      const result = await actualizarParametrosApi(cambios);
      if (result.success) {
        queryClient.setQueryData(queryKeys.public.parametros, result.data);
        return { success: true };
      }
      return { success: false, error: result.error };
    },
    [queryClient]
  );

  /**
   * Actualiza un único parámetro (solo superadmin) y sincroniza la caché.
   * @param {string} clave - Clave del parámetro.
   * @param {number} valor - Nuevo valor.
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  const actualizarParametro = useCallback(
    async (clave, valor) => {
      const result = await actualizarParametroApi(clave, valor);
      if (result.success) {
        queryClient.setQueryData(queryKeys.public.parametros, result.data);
        return { success: true };
      }
      return { success: false, error: result.error };
    },
    [queryClient]
  );

  // Track if we ever had a user session to avoid disconnecting on initial load for guests
  const hadUserRef = useRef(false);
  useEffect(() => {
    if (user) hadUserRef.current = true;
  }, [user]);

  // El socket se cierra al cerrar sesión: solo si HABÍA usuario antes y ahora no hay.
  // Esto evita desconectar el socket en la carga inicial para invitados (sin sesión).
  useEffect(() => {
    if (hydrated && hadUserRef.current && !user) {
      desconectarSocket();
    }
  }, [hydrated, user]);

  const value = useMemo(
    () => ({ parametros, lista, loading, recargar, actualizar, actualizarParametro }),
    [parametros, lista, loading, recargar, actualizar, actualizarParametro]
  );

  return (
    <ParametrosContext.Provider value={value}>
      {children}
    </ParametrosContext.Provider>
  );
};

ParametrosProvider.propTypes = {
  children: PropTypes.node,
};

/**
 * Propósito: Contexto de sucursal para manejar la asignación de sucursal al cliente.
 * Contenido: SucursalProvider, SucursalContext, con la sucursal asignada y funciones para cambiarla.
 * Dependencias: React (createContext, useState, useCallback, useMemo), services/asignacionSucursal.js, api/sucursales.js.
 * Uso: <SucursalProvider> envuelve la app en App.jsx. Consumir con useSucursal().
 */

import React, { createContext, useState, useCallback, useMemo, useEffect } from 'react';
import { obtenerSucursales } from '../api/sucursales';
import { asignarSucursal } from '../services/asignacionSucursal';

// Se crea el contexto
export const SucursalContext = createContext(null);

/**
 * Proveedor del contexto de sucursal.
 * @param {React.ReactNode} children - Componentes hijos.
 */
export const SucursalProvider = ({ children }) => {
  // Lista de sucursales disponibles
  const [sucursales, setSucursales] = useState([]);
  // Sucursal actualmente asignada
  const [sucursalAsignada, setSucursalAsignada] = useState(null);
  // Estado de carga
  const [loading, setLoading] = useState(false);

  /**
   * Carga las sucursales y asigna la óptima al cliente.
   */
  const cargarSucursales = useCallback(async () => {
    setLoading(true);
    try {
      const result = await obtenerSucursales();
      if (result.success) {
        setSucursales(result.data);
        const optimal = asignarSucursal(result.data);
        setSucursalAsignada(optimal);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Cambia manualmente la sucursal asignada.
   * @param {number} sucursalId - ID de la sucursal a asignar.
   */
  const cambiarSucursal = useCallback(
    (sucursalId) => {
      const nueva = sucursales.find((s) => s.id === sucursalId);
      if (nueva) {
        setSucursalAsignada(nueva);
      }
    },
    [sucursales]
  );

  // Cargar sucursales al montar
  useEffect(() => {
    cargarSucursales();
  }, [cargarSucursales]);

  // Valor del contexto
  const value = useMemo(
    () => ({
      sucursales,
      sucursalAsignada,
      loading,
      cargarSucursales,
      cambiarSucursal,
    }),
    [sucursales, sucursalAsignada, loading, cargarSucursales, cambiarSucursal]
  );

  return <SucursalContext.Provider value={value}>{children}</SucursalContext.Provider>;
};

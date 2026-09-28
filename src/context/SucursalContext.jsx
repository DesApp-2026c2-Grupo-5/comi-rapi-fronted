/**
 * Propósito: Contexto de sucursal para manejar la asignación de sucursal al cliente y la gestión
 *            de sucursales por parte del administrador.
 * Contenido: SucursalProvider, SucursalContext, con el estado de sucursales, sucursales cercanas,
 *            pedidos pendientes, la sucursal asignada y funciones de gestión (CRUD simulado).
 * Dependencias: React (createContext, useState, useCallback, useMemo, useEffect),
 *               services/asignacionSucursal.js, api/sucursales.js, services/seedData.js.
 * Uso: <SucursalProvider> envuelve la app en App.jsx. Consumir con useSucursal().
 */

import React, { createContext, useState, useCallback, useMemo, useEffect } from 'react';
import {
  obtenerSucursales,
  crearSucursal,
  actualizarSucursal,
  eliminarSucursal,
} from '../api/sucursales';
import { asignarSucursalOptima as asignarSucursalOptimaService } from '../services/asignacionSucursal';
import { pedidosPendientesMock } from '../services/seedData';

// Se crea el contexto
export const SucursalContext = createContext(null);

// Las sucursales ya no conservan 'direccion' como texto ni 'latitud'/'longitud' propias:
// cada sucursal tiene un registro 1:1 en Direccion (Sucursal 1:1 Direccion). El backend
// expone la dirección como objeto anidado 'direccion' (con calle, altura, provincia,
// localidad, codigoPostal, referencia, latitud, longitud) y también latitud/longitud planas
// para compatibilidad. Obligatorios: calle, altura, provincia, localidad, codigoPostal.
// El estado proviene del backend como booleano 'activa'.

/**
 * Proveedor del contexto de sucursal.
 * @param {React.ReactNode} children - Componentes hijos.
 */
export const SucursalProvider = ({ children }) => {
  // Lista de todas las sucursales (todas las registradas, activas e inactivas)
  const [sucursales, setSucursales] = useState([]);
  // Pedidos pendientes usados por la lógica de asignación (MOCK - no se muta en esta versión)
  const [pedidosPendientes] = useState(pedidosPendientesMock);
  // Sucursal actualmente asignada al cliente
  const [sucursalAsignada, setSucursalAsignada] = useState(null);
  // Estado de carga
  const [loading, setLoading] = useState(false);

  /**
   * Carga las sucursales desde el backend y actualiza el estado global.
   * Pide también las inactivas (el backend solo las devuelve a un ADMIN), para
   * que la pantalla de gestión pueda mostrarlas y reactivarlas.
   */
  const obtenerSucursalesFn = useCallback(async () => {
    setLoading(true);
    try {
      const result = await obtenerSucursales({ incluirInactivas: true });
      if (result.success) {
        setSucursales(result.data);
        return result.data;
      }
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Carga las sucursales y asigna la óptima al cliente (lógica interna).
   */
  const cargarSucursales = useCallback(async () => {
    const data = await obtenerSucursalesFn();
    if (data.length > 0) {
      const optimal = asignarSucursalOptimaService(data, pedidosPendientesMock);
      setSucursalAsignada(optimal);
    }
  }, [obtenerSucursalesFn]);

  /**
   * Asigna la sucursal óptima usando la lógica del servicio
   * (la sucursal activa con menos pedidos pendientes).
   */
  const asignarSucursalOptima = useCallback(() => {
    const optimal = asignarSucursalOptimaService(sucursales, pedidosPendientes);
    if (optimal) {
      setSucursalAsignada(optimal);
    }
    return optimal;
  }, [sucursales, pedidosPendientes]);

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

  /**
   * Agrega una nueva sucursal al estado local (la persiste en el backend).
   * @param {object} sucursal - Datos de la nueva sucursal.
   * @returns {Promise<object|null>} Sucursal creada o null si falla.
   */
  const agregarSucursal = useCallback(async (sucursal) => {
    const result = await crearSucursal(sucursal);
    if (result.success) {
      setSucursales((prev) => [...prev, result.data]);
      return result.data;
    }
    return null;
  }, []);

  /**
   * Actualiza una sucursal existente en el estado local.
   * @param {number} id - ID de la sucursal a actualizar.
   * @param {object} datos - Nuevos datos de la sucursal.
   * @returns {Promise<object|null>} Sucursal actualizada o null si falla.
   */
  const actualizarSucursalFn = useCallback(async (id, datos) => {
    const result = await actualizarSucursal(id, datos);
    if (result.success) {
      setSucursales((prev) =>
        prev.map((s) => (s.id === Number(id) ? result.data : s))
      );
      return result.data;
    }
    return null;
  }, []);

  /**
   * Elimina una sucursal del estado local.
   * @param {number} id - ID de la sucursal a eliminar.
   * @returns {Promise<boolean>} true si se eliminó correctamente.
   */
  const eliminarSucursalFn = useCallback(async (id) => {
    const result = await eliminarSucursal(id);
    if (result.success) {
      setSucursales((prev) => prev.filter((s) => s.id !== Number(id)));
      return true;
    }
    return false;
  }, []);

  // Cargar sucursales al montar
  useEffect(() => {
    cargarSucursales();
  }, [cargarSucursales]);

  // Sucursales cercanas (solo activas) calculadas para el cliente
  const sucursalesCercanas = useMemo(
    () => sucursales.filter((s) => s.activa !== false),
    [sucursales]
  );

  // Valor del contexto
  const value = useMemo(
    () => ({
      sucursales,
      sucursalesCercanas,
      pedidosPendientes,
      sucursalAsignada,
      loading,
      obtenerSucursales: obtenerSucursalesFn,
      cargarSucursales,
      asignarSucursalOptima,
      cambiarSucursal,
      agregarSucursal,
      actualizarSucursal: actualizarSucursalFn,
      eliminarSucursal: eliminarSucursalFn,
    }),
    [
      sucursales,
      sucursalesCercanas,
      pedidosPendientes,
      sucursalAsignada,
      loading,
      obtenerSucursalesFn,
      cargarSucursales,
      asignarSucursalOptima,
      cambiarSucursal,
      agregarSucursal,
      actualizarSucursalFn,
      eliminarSucursalFn,
    ]
  );

  return <SucursalContext.Provider value={value}>{children}</SucursalContext.Provider>;
};
/**
 * Propósito: Contexto de sucursal para manejar la asignación de sucursal al cliente y la gestión
 *            de sucursales por parte del administrador.
 * Contenido: SucursalProvider, SucursalContext, con el estado de sucursales, sucursales cercanas,
 *            pedidos pendientes, la sucursal asignada y funciones de gestión.
 * Dependencias: React (createContext, useState, useCallback, useMemo, useEffect),
 *               services/asignacionSucursal.js, api/sucursales.js.
 * Uso: <SucursalProvider> envuelve la app en App.jsx. Consumir con useSucursal().
 *
 * NOTA: La lectura de sucursales consume el backend real (GET /api/sucursales).
 * El ABM de sucursales del admin sigue simulado en memoria: el backend aún no
 * expone endpoints de escritura (pendiente de un sprint futuro).
 */

import React, { createContext, useState, useCallback, useMemo, useEffect } from 'react';
import { obtenerSucursales } from '../api/sucursales';
import { asignarSucursalOptima as asignarSucursalOptimaService } from '../services/asignacionSucursal';
import { pedidosPendientesMock } from '../services/seedData';

// Se crea el contexto
export const SucursalContext = createContext(null);

// Las sucursales usan el shape real del backend: 'direccion' (texto), 'latitud',
// 'longitud', 'horarios' y 'activa' (boolean). La dirección se muestra en
// pedidos/confirmación y las coordenadas se mantienen para la lógica de asignación.

/**
 * Convierte el shape del formulario del admin (mock: lat/lng/horario/estado) al
 * shape real del backend (latitud/longitud/horarios/activa) para mantener un
 * único formato en el estado global.
 * @param {object} datos - Datos de la sucursal a normalizar.
 * @returns {object} Sucursal en shape real.
 */
const normalizarSucursal = (datos) => {
  const { lat, lng, horario, estado, ...resto } = datos || {};
  return {
    ...resto,
    latitud: resto.latitud ?? (lat !== undefined ? Number(lat) : null),
    longitud: resto.longitud ?? (lng !== undefined ? Number(lng) : null),
    horarios: resto.horarios ?? horario ?? null,
    activa: resto.activa !== undefined ? Boolean(resto.activa) : estado !== 'inactivo',
  };
};

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
   * Carga las sucursales desde la API real y actualiza el estado global.
   * @param {object} [opciones]
   * @param {boolean} [opciones.incluirInactivas=false] - Solo para ADMIN.
   */
  const obtenerSucursalesFn = useCallback(async (opciones) => {
    setLoading(true);
    try {
      const result = await obtenerSucursales(opciones);
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
   * Agrega una nueva sucursal al estado local (simulado, sin persistencia:
   * el backend aún no expone ABM de sucursales).
   * @param {object} sucursal - Datos de la nueva sucursal.
   * @returns {Promise<object|null>} Sucursal creada o null si falla.
   */
  const agregarSucursal = useCallback(async (sucursal) => {
    if (!sucursal) return null;
    const sucursalCreada = { id: Date.now(), ...normalizarSucursal(sucursal) };
    setSucursales((prev) => [...prev, sucursalCreada]);
    return sucursalCreada;
  }, []);

  /**
   * Actualiza una sucursal en el estado local (simulado, sin persistencia).
   * @param {number} id - ID de la sucursal a actualizar.
   * @param {object} datos - Nuevos datos de la sucursal.
   * @returns {Promise<object|null>} Sucursal actualizada o null si falla.
   */
  const actualizarSucursalFn = useCallback(async (id, datos) => {
    if (!datos) return null;
    let actualizada = null;
    setSucursales((prev) =>
      prev.map((s) => {
        if (s.id !== Number(id)) return s;
        actualizada = { ...s, ...normalizarSucursal(datos) };
        return actualizada;
      })
    );
    return actualizada;
  }, []);

  /**
   * Elimina una sucursal del estado local (simulado, sin persistencia).
   * @param {number} id - ID de la sucursal a eliminar.
   * @returns {Promise<boolean>} true si se eliminó correctamente.
   */
  const eliminarSucursalFn = useCallback(async (id) => {
    let eliminada = false;
    setSucursales((prev) => {
      const nuevaLista = prev.filter((s) => s.id !== Number(id));
      eliminada = nuevaLista.length !== prev.length;
      return nuevaLista;
    });
    return eliminada;
  }, []);

  // Cargar sucursales al montar
  useEffect(() => {
    cargarSucursales();
  }, [cargarSucursales]);

  // Sucursales cercanas (solo activas) calculadas para el cliente
  const sucursalesCercanas = useMemo(
    () => sucursales.filter((s) => s.activa === true),
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
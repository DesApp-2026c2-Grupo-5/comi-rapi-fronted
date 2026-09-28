/**
 * Propósito: Contexto de direcciones del cliente con CRUD contra el backend real.
 * Contenido: DireccionProvider, DireccionContext, con funciones cargarDirecciones,
 *            agregarDireccion, editarDireccion y eliminarDireccion (baja lógica).
 * Dependencias: React (createContext, useState, useCallback, useMemo), api/direcciones.js.
 * Uso: <DireccionProvider> envuelve la app en App.jsx. Consumir con useDirecciones().
 *
 * El backend scopea por sesión (DER: Usuario 1:N Direccion), así que no hace falta
 * pasar el cliente: cada cliente solo ve y gestiona sus propias direcciones.
 * El DER no define una dirección "principal": eso se elige en el carrito.
 */

import React, { createContext, useState, useCallback, useMemo } from 'react';
import {
  obtenerDirecciones,
  crearDireccion,
  actualizarDireccion,
  eliminarDireccion as eliminarDireccionApi,
} from '../api/direcciones';

// Se crea el contexto
export const DireccionContext = createContext(null);

/**
 * Proveedor del contexto de direcciones.
 * @param {React.ReactNode} children - Componentes hijos.
 */
export const DireccionProvider = ({ children }) => {
  const [direcciones, setDirecciones] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Carga las direcciones activas del cliente autenticado desde el backend.
   * @returns {Promise<Array>} Direcciones cargadas.
   */
  const cargarDirecciones = useCallback(async () => {
    setLoading(true);
    try {
      const result = await obtenerDirecciones();
      if (result.success) {
        setDirecciones(result.data);
        setError(null);
        return result.data;
      }
      setError(result.error);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Agrega una nueva dirección y la persiste en el backend.
   * @param {object} datosDireccion - { calle, altura, provincia, localidad, codigoPostal, referencia?, alias? }.
   * @returns {Promise<object|null>} Dirección creada o null si falla.
   */
  const agregarDireccion = useCallback(async (datosDireccion) => {
    const result = await crearDireccion(datosDireccion);
    if (result.success) {
      setDirecciones((prev) => [...prev, result.data]);
      setError(null);
      return result.data;
    }
    setError(result.error);
    return null;
  }, []);

  /**
   * Edita una dirección existente en el backend.
   * @param {number} id - ID de la dirección.
   * @param {object} datos - Campos a actualizar.
   * @returns {Promise<object|null>} Dirección actualizada o null si falla.
   */
  const editarDireccion = useCallback(async (id, datos) => {
    const result = await actualizarDireccion(id, datos);
    if (result.success) {
      setDirecciones((prev) =>
        prev.map((d) => (d.id === result.data.id ? result.data : d))
      );
      setError(null);
      return result.data;
    }
    setError(result.error);
    return null;
  }, []);

  /**
   * Elimina una dirección (baja lógica: el backend marca activa = false).
   * @param {number} id - ID de la dirección a eliminar.
   * @returns {Promise<boolean>} true si se eliminó correctamente.
   */
  const eliminarDireccion = useCallback(async (id) => {
    const result = await eliminarDireccionApi(id);
    if (result.success) {
      setDirecciones((prev) => prev.filter((d) => d.id !== Number(id)));
      setError(null);
      return true;
    }
    setError(result.error);
    return false;
  }, []);

  // Valor del contexto
  const value = useMemo(
    () => ({
      direcciones,
      loading,
      error,
      cargarDirecciones,
      agregarDireccion,
      editarDireccion,
      eliminarDireccion,
    }),
    [
      direcciones,
      loading,
      error,
      cargarDirecciones,
      agregarDireccion,
      editarDireccion,
      eliminarDireccion,
    ]
  );

  return <DireccionContext.Provider value={value}>{children}</DireccionContext.Provider>;
};

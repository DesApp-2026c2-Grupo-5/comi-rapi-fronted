/**
 * Propósito: Contexto de direcciones del cliente (permite CRUD de direcciones
 *            textuales y asegura UNA dirección principal por cliente).
 * Contenido: DireccionProvider, DireccionContext, con funciones cargarDirecciones,
 *            agregarDireccion, editarDireccion, eliminarDireccion,
 *            seleccionarDireccionPrincipal y obtenerDireccionPrincipal.
 * Dependencias: React (createContext, useState, useCallback, useMemo),
 *               utils/constants.js (ESTADO_DIRECCION), services/seedData.js (direccionesMock).
 * Uso: <DireccionProvider> envuelve la app en App.jsx. Consumir con useDirecciones().
 */

import React, { createContext, useState, useCallback, useMemo } from 'react';
import { ESTADO_DIRECCION } from '../utils/constants';
import { direccionesMock } from '../services/seedData';

// Se crea el contexto
export const DireccionContext = createContext(null);

/**
 * Proveedor del contexto de direcciones.
 * @param {React.ReactNode} children - Componentes hijos.
 */
export const DireccionProvider = ({ children }) => {
  // Todas las direcciones de la app (MOCK - reemplazar por la API real).
  // La "eliminación" es lógica: se marca estado 'inactivo'.
  const [direcciones, setDirecciones] = useState(direccionesMock);

  /**
   * Devuelve las direcciones ACTIVAS de un cliente (selector).
   * @param {string} clienteId - Email del cliente.
   * @returns {Array} Direcciones activas del cliente.
   */
  const cargarDirecciones = useCallback(
    (clienteId) =>
      direcciones.filter(
        (d) => d.clienteId === clienteId && d.estado === ESTADO_DIRECCION.ACTIVO
      ),
    [direcciones]
  );

  /**
   * Devuelve la dirección PRINCIPAL activa de un cliente (la que se usa en el carrito).
   * @param {string} clienteId - Email del cliente.
   * @returns {object|null} Dirección principal o null si no tiene.
   */
  const obtenerDireccionPrincipal = useCallback(
    (clienteId) =>
      direcciones.find(
        (d) =>
          d.clienteId === clienteId &&
          d.estado === ESTADO_DIRECCION.ACTIVO &&
          d.esPrincipal
      ) || null,
    [direcciones]
  );

  // Quita la marca "principal" a todas las direcciones de un cliente.
  const desmarcarPrincipales = (lista, clienteId) =>
    lista.map((d) => (d.clienteId === clienteId ? { ...d, esPrincipal: false } : d));

  /**
   * Agrega una nueva dirección. Si es la única activa del cliente, se convierte
   * en principal automáticamente. Si se marca principal, las demás se desmarcan.
   * @param {object} datosDireccion - Datos de la dirección { clienteId, nombre,
   *                                  direccion, ciudad, codigoPostal, referencia, esPrincipal }.
   * @returns {object} Dirección creada.
   */
  const agregarDireccion = useCallback(
    (datosDireccion) => {
      // Si no hay ninguna dirección activa del cliente, esta pasa a ser la principal.
      const tieneActivas = direcciones.some(
        (d) =>
          d.clienteId === datosDireccion.clienteId &&
          d.estado === ESTADO_DIRECCION.ACTIVO
      );
      const esPrincipal = datosDireccion.esPrincipal || !tieneActivas;

      const nuevas = {
        id: Date.now(), // MOCK - el ID real vendría del backend
        ...datosDireccion,
        esPrincipal,
        estado: ESTADO_DIRECCION.ACTIVO,
      };

      setDirecciones((prev) => {
        const lista = esPrincipal ? desmarcarPrincipales(prev, nuevas.clienteId) : prev;
        return [...lista, nuevas];
      });

      return nuevas;
    },
    [direcciones]
  );

  /**
   * Edita una dirección existente. Si se marca principal, las demás se desmarcan.
   * @param {number} id - ID de la dirección.
   * @param {object} datos - Nuevos datos de la dirección.
   * @returns {object|null} Dirección actualizada o null si no existe.
   */
  const editarDireccion = useCallback(
    (id, datos) => {
      const actual = direcciones.find((d) => d.id === Number(id));
      if (!actual) return null;

      const editada = {
        ...actual,
        ...datos,
        id: actual.id,
        clienteId: datos.clienteId || actual.clienteId,
        estado: actual.estado,
      };

      setDirecciones((prev) =>
        prev
          .map((d) => (d.id === actual.id ? editada : d))
          .map((d) =>
            datos.esPrincipal && d.clienteId === actual.clienteId && d.id !== actual.id
              ? { ...d, esPrincipal: false }
              : d
          )
      );

      return editada;
    },
    [direcciones]
  );

  /**
   * "Elimina" una dirección (baja lógica: cambia el estado a inactivo).
   * @param {number} id - ID de la dirección a eliminar.
   * @returns {boolean} true si se eliminó correctamente.
   */
  const eliminarDireccion = useCallback(
    (id) => {
      const objetivo = direcciones.find(
        (d) => d.id === Number(id) && d.estado === ESTADO_DIRECCION.ACTIVO
      );
      if (!objetivo) return false;

      setDirecciones((prev) =>
        prev.map((d) =>
          d.id === objetivo.id ? { ...d, estado: ESTADO_DIRECCION.INACTIVO } : d
        )
      );
      return true;
    },
    [direcciones]
  );

  /**
   * Marca una dirección como principal (desmarca las demás del mismo cliente).
   * @param {number} id - ID de la dirección a marcar como principal.
   * @returns {boolean} true si se marcó correctamente.
   */
  const seleccionarDireccionPrincipal = useCallback(
    (id) => {
      const objetivo = direcciones.find(
        (d) => d.id === Number(id) && d.estado === ESTADO_DIRECCION.ACTIVO
      );
      if (!objetivo) return false;

      setDirecciones((prev) =>
        prev.map((d) =>
          d.id === objetivo.id
            ? { ...d, esPrincipal: true }
            : d.clienteId === objetivo.clienteId
              ? { ...d, esPrincipal: false }
              : d
        )
      );
      return true;
    },
    [direcciones]
  );

  // Valor del contexto
  const value = useMemo(
    () => ({
      direcciones,
      cargarDirecciones,
      obtenerDireccionPrincipal,
      agregarDireccion,
      editarDireccion,
      eliminarDireccion,
      seleccionarDireccionPrincipal,
    }),
    [
      direcciones,
      cargarDirecciones,
      obtenerDireccionPrincipal,
      agregarDireccion,
      editarDireccion,
      eliminarDireccion,
      seleccionarDireccionPrincipal,
    ]
  );

  return <DireccionContext.Provider value={value}>{children}</DireccionContext.Provider>;
};
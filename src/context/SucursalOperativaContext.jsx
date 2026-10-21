/**
 * Propósito: Contexto de la sucursal OPERATIVA de la sesión: la sucursal en la
 *            que el usuario está parado para operar pedidos y stock.
 * Contenido: SucursalOperativaProvider, SucursalOperativaContext.
 *            - ADMINISTRADOR: su sucursal asignada (no cambia).
 *            - SUPERADMINISTRADOR: la sucursal de contexto elegida (o null),
 *              validada por el backend contra la BD (activa) al elegirla.
 *            - CLIENTE: null (no opera sucursales).
 * Dependencias: React, hooks/useAuth, api/auth.js (contexto), services/socket.
 * Uso: <SucursalOperativaProvider> dentro de <AuthProvider> en App.jsx.
 *      Consumir con useSucursalOperativa().
 *
 * La fuente de verdad es la SESIÓN del backend (/api/auth/me expone
 * `sucursalOperativa`); este contexto no guarda estado propio del contexto,
 * solo expone el de AuthContext y ofrece elegir/limpiar. Al cambiar el
 * contexto se reconecta el socket (las rooms se resuelven en el handshake:
 * con contexto, el superadmin entra a `sucursal:{id}`) y se avisa con
 * `versionSocket` para que los consumidores rearman sus listeners.
 */

import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import {
  elegirSucursalContexto as apiElegir,
  limpiarSucursalContexto as apiLimpiar,
} from '../api/auth';
import { desconectarSocket } from '../services/socket';

export const SucursalOperativaContext = createContext(null);

export const SucursalOperativaProvider = ({ children }) => {
  const { user, isAdmin, isSuperadmin, refrescarUsuario } = useAuth();
  // Se incrementa en cada cambio de contexto: los efectos que dependen de él
  // (listeners del socket en PedidoContext) rearman sobre la conexión nueva.
  const [versionSocket, setVersionSocket] = useState(0);

  // El estado viaja en la sesión (user.sucursalOperativa via /auth/me).
  const sucursalOperativa = user?.sucursalOperativa || null;
  const sucursalOperativaId = sucursalOperativa?.id ?? null;

  /**
   * Elige la sucursal de contexto (solo SUPERADMINISTRADOR). El backend la
   * valida (existe y activa) y la guarda en la sesión; después se releen los
   * datos del usuario y se reconecta el socket para entrar a la room de la
   * sucursal elegida.
   */
  const elegirSucursal = useCallback(
    async (sucursalId) => {
      const result = await apiElegir(sucursalId);
      if (result.success) {
        // El handshake viejo tiene las rooms viejas: se cierra para que la
        // próxima conexión (lazy, la abre PedidoContext) negocie de nuevo.
        desconectarSocket();
        await refrescarUsuario();
        setVersionSocket((v) => v + 1);
      }
      return result;
    },
    [refrescarUsuario]
  );

  /** Deja de operar una sucursal (solo SUPERADMINISTRADOR): vuelve al rol global. */
  const limpiarSucursal = useCallback(async () => {
    const result = await apiLimpiar();
    if (result.success) {
      desconectarSocket();
      await refrescarUsuario();
      setVersionSocket((v) => v + 1);
    }
    return result;
  }, [refrescarUsuario]);

  const value = useMemo(
    () => ({
      sucursalOperativa,
      sucursalOperativaId,
      elegirSucursal,
      limpiarSucursal,
      versionSocket,
    }),
    [sucursalOperativa, sucursalOperativaId, elegirSucursal, limpiarSucursal, versionSocket]
  );

  return (
    <SucursalOperativaContext.Provider value={value}>
      {children}
    </SucursalOperativaContext.Provider>
  );
};

export const useSucursalOperativaContext = () => {
  const contexto = useContext(SucursalOperativaContext);
  const { isAdmin: esAdmin, isSuperadmin: esSuperadmin } = useAuth();
  if (!contexto) {
    throw new Error('useSucursalOperativa requiere SucursalOperativaProvider');
  }
  const { sucursalOperativa, sucursalOperativaId } = contexto;
  // ¿La sesión puede operar pedidos/stock de una sucursal en particular?
  // - ADMIN: siempre (su asignada).
  // - SUPERADMIN: solo con contexto elegido.
  const esOperadorDeSucursal = Boolean(esAdmin || (esSuperadmin && sucursalOperativaId));
  return { ...contexto, isAdmin: esAdmin, isSuperadmin: esSuperadmin, esOperadorDeSucursal };
};

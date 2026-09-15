/**
 * Propósito: Contexto de autenticación para manejar el estado del usuario y su rol en toda la app.
 * Contenido: AuthProvider, AuthContext, con funciones login, loginAdministrador, register, registerAdmin, logout.
 * Dependencias: React (createContext, useState, useCallback, useMemo, useEffect), api/auth.js, utils/constants.js.
 * Uso: <AuthProvider> envuelve toda la app en App.jsx. Consumir con useAuth().
 *
 * La sesión se almacena en el servidor (cookie HttpOnly); el estado local se
 * reconstruye al montar la app consultando GET /api/auth/me.
 */

import {
  createContext,
  useState,
  useCallback,
  useMemo,
  useEffect,
} from 'react';
import {
  loginCliente,
  loginAdmin,
  registroCliente,
  registroAdmin,
  logout as apiLogout,
  getCurrentUser,
} from '../api/auth';
import { ROLES } from '../utils/constants';

// Se crea el contexto
export const AuthContext = createContext(null);

/**
 * Proveedor del contexto de autenticación.
 * @param {React.ReactNode} children - Componentes hijos.
 */
export const AuthProvider = ({ children }) => {
  // Estado del usuario (null = no autenticado)
  const [user, setUser] = useState(null);
  // Estado de carga
  const [loading, setLoading] = useState(false);
  // Indica si ya se verificó la sesión al cargar la app
  const [hydrated, setHydrated] = useState(false);

  /**
   * Inicia sesión como cliente.
   * @param {string} email
   * @param {string} password
   * @returns {object} Resultado de la operación.
   */
  const login = useCallback(async (email, password) => {
    setLoading(true);
    try {
      const result = await loginCliente(email, password);
      if (result.success) {
        setUser(result.user);
      }
      return result;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Inicia sesión como administrador.
   * @param {string} email
   * @param {string} password
   * @returns {object} Resultado de la operación.
   */
  const loginAdministrador = useCallback(async (email, password) => {
    setLoading(true);
    try {
      const result = await loginAdmin(email, password);
      if (result.success) {
        setUser(result.user);
      }
      return result;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Registra un nuevo cliente.
   * @param {object} datos - { nombre, email, password }.
   * @returns {object} Resultado de la operación.
   */
  const register = useCallback(async (datos) => {
    setLoading(true);
    try {
      const result = await registroCliente(datos);
      if (result.success) {
        setUser(result.user);
      }
      return result;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Registra un nuevo administrador.
   * @param {object} datos - { nombre, email, password }.
   * @returns {object} Resultado de la operación.
   */
  const registerAdmin = useCallback(async (datos) => {
    setLoading(true);
    try {
      const result = await registroAdmin(datos);
      if (result.success) {
        setUser(result.user);
      }
      return result;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Cierra la sesión del usuario actual (limpiando localmente e invalidando la sesión en el servidor).
   * @returns {Promise<object>} Resultado de la operación.
   */
  const logout = useCallback(async () => {
    setUser(null);
    setHydrated(true);
    const result = await apiLogout().catch(() => ({ success: false }));
    return result;
  }, []);

  // Restaurar la sesión consultando /api/auth/me al montar la app.
  useEffect(() => {
    let activo = true;
    const hidratar = async () => {
      const usuario = await getCurrentUser();
      if (activo) {
        setUser(usuario);
        setHydrated(true);
      }
    };
    hidratar();
    return () => {
      activo = false;
    };
  }, []);

  // Verificar si el usuario está autenticado
  const isAuthenticated = useMemo(() => user !== null, [user]);

  // Verificar si es admin
  const isAdmin = useMemo(() => user?.rol === ROLES.ADMIN, [user]);

  // Verificar si es cliente
  const isCliente = useMemo(() => user?.rol === ROLES.CLIENTE, [user]);

  // Valor del contexto
  const value = useMemo(
    () => ({
      user,
      loading,
      hydrated,
      isAuthenticated,
      isAdmin,
      isCliente,
      login,
      loginAdministrador,
      register,
      registerAdmin,
      logout,
    }),
    [
      user,
      loading,
      hydrated,
      isAuthenticated,
      isAdmin,
      isCliente,
      login,
      loginAdministrador,
      register,
      registerAdmin,
      logout,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
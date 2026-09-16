/**
 * Propósito: Contexto de autenticación que mantiene el estado del usuario autenticado.
 * Contenido: AuthProvider, AuthContext, con funciones login, logout, register.
 * Dependencias: React (createContext, useState, useCallback, useMemo), api/auth.js, utils/constants.js.
 * Uso: <AuthProvider> envuelve toda la app en App.jsx. Consumir con useAuth().
 *
 * La sesión se maneja server-side (cookie HttpOnly + CSRF). Al iniciar la app se
 * restaura con GET /api/auth/me. Ya no se persiste el usuario en localStorage.
 */

import React, { createContext, useState, useCallback, useMemo } from 'react';
import {
  loginCliente,
  loginAdmin,
  registroCliente,
  registroAdmin,
  logout as apiLogout,
  obtenerUsuarioActual,
} from '../api/auth';
import { ROLES } from '../utils/constants';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [hydrated, setHydrated] = useState(false);

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

  const logout = useCallback(async () => {
    try {
      await apiLogout();
    } finally {
      setUser(null);
    }
  }, []);

  // Restaurar la sesión desde el backend al cargar la app.
  React.useEffect(() => {
    (async () => {
      const result = await obtenerUsuarioActual();
      if (result.success) {
        setUser(result.user);
      }
      setHydrated(true);
    })();
  }, []);

  const isAuthenticated = useMemo(() => user !== null, [user]);
  const isAdmin = useMemo(() => user?.rol === ROLES.ADMIN, [user]);
  const isCliente = useMemo(() => user?.rol === ROLES.CLIENTE, [user]);

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
    [user, loading, hydrated, isAuthenticated, isAdmin, isCliente, login, loginAdministrador, register, registerAdmin, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

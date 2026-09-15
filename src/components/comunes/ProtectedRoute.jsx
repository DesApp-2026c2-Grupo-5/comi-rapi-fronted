/**
 * Propósito: Componente de ruta protegida que verifica autenticación antes de mostrar contenido.
 * Contenido: Componente ProtectedRoute que redirige a login si el usuario no está autenticado.
 * Dependencias: react-router-dom (Navigate, Outlet), useAuth hook.
 * Uso: <ProtectedRoute><MiComponente /></ProtectedRoute> o como elemento de Route.
 */

import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { ROLES } from '../../utils/constants';

/**
 * Devuelve el destino de inicio según el rol del usuario autenticado.
 * @param {object} user - Usuario autenticado.
 * @returns {string} Ruta de inicio del usuario.
 */
const destinoPorRol = (user) => (user?.rol === ROLES.ADMIN ? '/admin/dashboard' : '/cliente/inicio');

/**
 * Ruta protegida que requiere autenticación.
 * Si el usuario no está autenticado, redirige a /login.
 * Opcionalmente puede requerir un rol específico.
 * @param {string} [requiredRole] - Rol requerido (opcional). Si se pasa, verifica que el usuario tenga ese rol.
 * @param {React.ReactNode} [children] - Componentes hijos (modo wrapper).
 */
const ProtectedRoute = ({ requiredRole, children }) => {
  const { isAuthenticated, user, hydrated } = useAuth();

  // Esperar a que se verifique la sesión (cookie) antes de decidir
  if (!hydrated) {
    return null;
  }

  // Si no está autenticado, redirigir a login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Si se requiere un rol específico y el usuario no lo tiene, redirigir al inicio correspondiente
  if (requiredRole && user?.rol !== requiredRole) {
    return <Navigate to={destinoPorRol(user)} replace />;
  }

  // Si hay children (modo wrapper), renderizar children; si no, renderizar Outlet (modo rutas anidadas)
  return children ? children : <Outlet />;
};

/**
 * Ruta solo-público: redirige al inicio del usuario si ya hay una sesión activa
 * (por ejemplo, al reabrir la app con la sesión restaurada desde la cookie).
 * @param {React.ReactNode} [children] - Componentes hijos (modo wrapper).
 */
const PublicOnlyRoute = ({ children }) => {
  const { isAuthenticated, user, hydrated } = useAuth();

  // Esperar a que se verifique la sesión (cookie) antes de decidir
  if (!hydrated) {
    return null;
  }

  // Ya hay una sesión activa: no mostrar el login/registro
  if (isAuthenticated) {
    return <Navigate to={destinoPorRol(user)} replace />;
  }

  return children ? children : <Outlet />;
};

export { ProtectedRoute as default, PublicOnlyRoute, destinoPorRol };

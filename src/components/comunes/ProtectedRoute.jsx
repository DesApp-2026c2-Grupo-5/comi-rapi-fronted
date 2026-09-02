/**
 * Propósito: Componente de ruta protegida que verifica autenticación antes de mostrar contenido.
 * Contenido: Componente ProtectedRoute que redirige a login si el usuario no está autenticado.
 * Dependencias: react-router-dom (Navigate, Outlet), useAuth hook.
 * Uso: <ProtectedRoute><MiComponente /></ProtectedRoute> o como elemento de Route.
 */

import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

/**
 * Ruta protegida que requiere autenticación.
 * Si el usuario no está autenticado, redirige a /login.
 * Opcionalmente puede requerir un rol específico.
 * @param {string} [requiredRole] - Rol requerido (opcional). Si se pasa, verifica que el usuario tenga ese rol.
 * @param {React.ReactNode} [children] - Componentes hijos (modo wrapper).
 */
const ProtectedRoute = ({ requiredRole, children }) => {
  const { isAuthenticated, user, hydrated } = useAuth();

  // Esperar a que se verifique localStorage antes de decidir
  if (!hydrated) {
    return null;
  }

  // Si no está autenticado, redirigir a login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Si se requiere un rol específico y el usuario no lo tiene, redirigir al login correspondiente
  if (requiredRole && user?.rol !== requiredRole) {
    // Redirigir al login del rol que corresponda
    return <Navigate to={user?.rol === 'ADMIN' ? '/admin/dashboard' : '/cliente/inicio'} replace />;
  }

  // Si hay children (modo wrapper), renderizar children; si no, renderizar Outlet (modo rutas anidadas)
  return children ? children : <Outlet />;
};

export default ProtectedRoute;

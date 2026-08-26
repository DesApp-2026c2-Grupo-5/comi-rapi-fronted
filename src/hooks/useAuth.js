/**
 * Propósito: Custom hook para consumir el AuthContext de forma sencilla.
 * Contenido: Función useAuth que retorna el contexto de autenticación.
 * Dependencias: React (useContext), context/AuthContext.js.
 * Uso: const { user, login, logout, isAuthenticated } = useAuth();
 */

import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

/**
 * Hook para acceder al contexto de autenticación.
 * @returns {object} Valores y funciones del AuthContext.
 * @throws Error si se usa fuera de un AuthProvider.
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};

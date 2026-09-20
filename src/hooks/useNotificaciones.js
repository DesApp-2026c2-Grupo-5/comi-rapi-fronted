/**
 * Propósito: Custom hook para consumir el NotificacionContext de forma sencilla.
 * Contenido: Función useNotificaciones que retorna el contexto de notificaciones.
 * Dependencias: React (useContext), context/NotificacionContext.jsx.
 * Uso: const { notificar } = useNotificaciones();
 */

import { useContext } from 'react';
import { NotificacionContext } from '../context/NotificacionContext';

/**
 * Hook para acceder al sistema de notificaciones banner.
 * @returns {object} Valores y funciones del NotificacionContext.
 * @throws Error si se usa fuera de un NotificacionProvider.
 */
export const useNotificaciones = () => {
  const context = useContext(NotificacionContext);
  if (!context) {
    throw new Error('useNotificaciones debe ser usado dentro de un NotificacionProvider');
  }
  return context;
};
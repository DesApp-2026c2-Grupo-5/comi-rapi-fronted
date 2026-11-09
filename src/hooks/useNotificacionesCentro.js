/**
 * Propósito: Custom hook para consumir el centro de notificaciones.
 * Contenido: Función useNotificacionesCentro que retorna el contexto.
 * Dependencias: React (useContext), context/NotificacionesCentroContext.jsx.
 * Uso: const { noLeidas, abrir } = useNotificacionesCentro();
 */

import { useContext } from 'react';
import { NotificacionesCentroContext } from '../context/NotificacionesCentroContext';

/**
 * Hook para acceder al centro de notificaciones.
 * @returns {object} Listado, contador y acciones del centro.
 * @throws Error si se usa fuera de un NotificacionesCentroProvider.
 */
export const useNotificacionesCentro = () => {
  const context = useContext(NotificacionesCentroContext);
  if (!context) {
    throw new Error(
      'useNotificacionesCentro debe ser usado dentro de un NotificacionesCentroProvider'
    );
  }
  return context;
};

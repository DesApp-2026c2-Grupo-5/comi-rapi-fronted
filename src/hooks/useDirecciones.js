/**
 * Propósito: Custom hook para consumir el DireccionContext de forma sencilla.
 * Contenido: Función useDirecciones que retorna el contexto de direcciones.
 * Dependencias: React (useContext), context/DireccionContext.jsx.
 * Uso: const { cargarDirecciones, agregarDireccion } = useDirecciones();
 */

import { useContext } from 'react';
import { DireccionContext } from '../context/DireccionContext';

/**
 * Hook para acceder al contexto de direcciones.
 * @returns {object} Valores y funciones del DireccionContext.
 * @throws Error si se usa fuera de un DireccionProvider.
 */
export const useDirecciones = () => {
  const context = useContext(DireccionContext);
  if (!context) {
    throw new Error('useDirecciones debe ser usado dentro de un DireccionProvider');
  }
  return context;
};
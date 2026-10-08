/**
 * Propósito: Custom hook para consumir el ParametrosContext de forma sencilla.
 * Contenido: Función useParametros que retorna el contexto de parámetros.
 * Dependencias: React (useContext), context/ParametrosContext.jsx.
 * Uso: const { parametros, actualizar } = useParametros();
 */

import { useContext } from 'react';
import { ParametrosContext } from '../context/ParametrosContext';

/**
 * Hook para acceder a los parámetros de negocio vigentes.
 * @returns {object} { parametros, lista, loading, recargar, actualizar }.
 * @throws Error si se usa fuera de un ParametrosProvider.
 */
export const useParametros = () => {
  const context = useContext(ParametrosContext);
  if (!context) {
    throw new Error('useParametros debe ser usado dentro de un ParametrosProvider');
  }
  return context;
};
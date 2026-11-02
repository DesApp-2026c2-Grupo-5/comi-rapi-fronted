/**
 * Propósito: Custom hook para consumir el TemaContext de forma sencilla.
 * Contenido: Función useTema que retorna la preferencia, el tema resuelto y la
 *            función para cambiarlo.
 * Dependencias: React (useContext), context/TemaContext.jsx.
 * Uso: const { tema, temaResuelto, esOscuro, definirTema } = useTema();
 */

import { useContext } from 'react';
import { TemaContext } from '../context/TemaContext';

/**
 * Hook para acceder al contexto del tema.
 * @returns {object} Valores y funciones del TemaContext.
 * @throws Error si se usa fuera de un TemaProvider.
 */
export const useTema = () => {
  const context = useContext(TemaContext);
  if (!context) {
    throw new Error('useTema debe ser usado dentro de un TemaProvider');
  }
  return context;
};

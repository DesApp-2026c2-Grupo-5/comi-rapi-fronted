import { useEffect, useState } from 'react';

const obtenerCoincidencia = (query) =>
  typeof window !== 'undefined' && typeof window.matchMedia === 'function'
    ? window.matchMedia(query).matches
    : false;

const useMediaQuery = (query) => {
  const [coincide, setCoincide] = useState(() => obtenerCoincidencia(query));

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return undefined;
    }

    const mediaQuery = window.matchMedia(query);
    const manejarCambio = (evento) => setCoincide(evento.matches);

    setCoincide(mediaQuery.matches);
    mediaQuery.addEventListener?.('change', manejarCambio);

    return () => {
      mediaQuery.removeEventListener?.('change', manejarCambio);
    };
  }, [query]);

  return coincide;
};

export default useMediaQuery;

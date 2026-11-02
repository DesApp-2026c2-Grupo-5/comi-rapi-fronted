/**
 * Propósito: Contexto global del tema claro/oscuro, compartido por cliente y
 *            panel de administración.
 * Contenido: TemaProvider, TemaContext y el estado de la preferencia
 *            ('claro' | 'oscuro' | 'sistema'), el tema resuelto y la función
 *            para cambiarlo.
 * Dependencias: react, utils/temaStorage.js.
 * Uso: <TemaProvider> envuelve la app en App.jsx. Consumir con useTema().
 *
 * El provider escucha prefers-color-scheme para que la opción "sistema" siga al
 * sistema operativo en vivo (sin recargar), y el evento storage para que el
 * cambio se refleje en las demás pestañas abiertas.
 */

import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import PropTypes from 'prop-types';
import {
  CLAVE_TEMA,
  TEMAS,
  aplicarTemaEnDocumento,
  esTemaValido,
  guardarTema,
  leerTema,
  prefiereOscuroElSistema,
  resolverTema,
  suscribirALaPreferenciaDelSistema,
} from '../utils/temaStorage';

// eslint-disable-next-line react-refresh/only-export-components
export const TemaContext = createContext(null);

export const TemaProvider = ({ children }) => {
  // Preferencia elegida por el usuario, ya saneada por temaStorage.
  const [tema, setTema] = useState(leerTema);
  // Se guarda aparte para que "sistema" reaccione al cambio del SO.
  const [prefiereOscuro, setPrefiereOscuro] = useState(prefiereOscuroElSistema);

  const temaResuelto = useMemo(
    () => resolverTema(tema, prefiereOscuro),
    [tema, prefiereOscuro]
  );

  // Aplica el tema al <html> cada vez que cambia la preferencia o el sistema.
  useEffect(() => {
    aplicarTemaEnDocumento(temaResuelto);
  }, [temaResuelto]);

  // Sigue al sistema operativo en vivo cuando la preferencia es "sistema".
  useEffect(() => suscribirALaPreferenciaDelSistema(setPrefiereOscuro), []);

  // Mantiene sincronizadas las pestañas abiertas del mismo navegador.
  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const sincronizar = (evento) => {
      if (evento.key === CLAVE_TEMA || evento.key === null) {
        setTema(leerTema());
      }
    };
    window.addEventListener('storage', sincronizar);
    return () => window.removeEventListener('storage', sincronizar);
  }, []);

  const definirTema = useCallback((nuevoTema) => {
    if (!esTemaValido(nuevoTema)) return;
    guardarTema(nuevoTema);
    setTema(nuevoTema);
  }, []);

  const value = useMemo(
    () => ({
      tema,
      temaResuelto,
      esOscuro: temaResuelto === TEMAS.OSCURO,
      definirTema,
    }),
    [tema, temaResuelto, definirTema]
  );

  return (
    <TemaContext.Provider value={value}>{children}</TemaContext.Provider>
  );
};

TemaProvider.propTypes = {
  children: PropTypes.node,
};

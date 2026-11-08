/**
 * Propósito: Contexto del centro de notificaciones persistido del CLIENTE.
 * Contenido: NotificacionesCentroProvider y NotificacionesCentroContext, con
 *            el listado paginado, el contador de no leídas, el estado del
 *            drawer y las acciones de lectura.
 * Dependencias: React, hooks/useAuth, api/notificaciones, services/socket,
 *               utils/constants.
 * Uso: <NotificacionesCentroProvider> dentro de <AuthProvider> en App.jsx.
 *      Consumir con useNotificacionesCentro().
 *
 * El backend es la fuente de verdad: el estado leído se guarda por usuario y el
 * contador es el mismo en todos los dispositivos. El socket sólo avisa que hay
 * una fila nueva; no reemplaza al listado REST.
 */

import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useAuth } from '../hooks/useAuth';
import {
  marcarLeida as marcarLeidaApi,
  marcarTodasLeidas as marcarTodasLeidasApi,
  obtenerNoLeidas,
  obtenerNotificaciones,
} from '../api/notificaciones';
import { EVENTOS_SOCKET, conectarSocket } from '../services/socket';
import { ROLES } from '../utils/constants';
import PropTypes from 'prop-types';

/* El contexto y el provider viven juntos a propósito, igual que en el resto de
   los contextos del proyecto; la regla de Fast Refresh es solo un aviso. */
/* eslint-disable react-refresh/only-export-components */

export const NotificacionesCentroContext = createContext(null);

/** Filas por página del drawer. */
const LIMITE = 20;

/** Pulso del badge: cuánto dura el aviso visual de una notificación nueva. */
const MS_PULSO = 1400;

export const NotificacionesCentroProvider = ({ children }) => {
  const { user, hydrated } = useAuth();
  const esCliente = user?.rol === ROLES.CLIENTE;

  const [items, setItems] = useState([]);
  const [noLeidas, setNoLeidas] = useState(0);
  const [total, setTotal] = useState(0);
  const [pagina, setPagina] = useState(1);
  const [paginas, setPaginas] = useState(0);
  const [cargando, setCargando] = useState(false);
  const [cargandoMas, setCargandoMas] = useState(false);
  const [error, setError] = useState('');
  const [abierto, setAbierto] = useState(false);
  const [filtro, setFiltro] = useState('TODAS');
  const [pulso, setPulso] = useState(false);
  // Cada recarga forzada (socket, error, volver a abrir) incrementa la versión.
  const [version, setVersion] = useState(0);

  // Reflejos para que el listener del socket no dependa del estado capturado.
  const filtroRef = useRef(filtro);
  const itemsRef = useRef(items);
  useEffect(() => {
    filtroRef.current = filtro;
  }, [filtro]);
  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  const recargar = useCallback(() => setVersion((v) => v + 1), []);

  const refrescarContador = useCallback(async () => {
    const res = await obtenerNoLeidas();
    if (res.success) setNoLeidas(res.data?.noLeidas ?? 0);
  }, []);

  // Contador inicial (y al cambiar de cuenta). Es lo que dibuja el badge.
  useEffect(() => {
    if (!hydrated || !esCliente) {
      setNoLeidas(0);
      setItems([]);
      setTotal(0);
      setPagina(1);
      setPaginas(0);
      setAbierto(false);
      setFiltro('TODAS');
      return;
    }
    refrescarContador();
  }, [hydrated, esCliente, user?.id, refrescarContador]);

  // Listado del drawer. Sólo se pide cuando está abierto: el badge no necesita
  // traer las filas.
  useEffect(() => {
    if (!abierto || !esCliente) return undefined;
    let activo = true;
    setCargando(true);
    setError('');

    obtenerNotificaciones({
      tipo: filtro === 'TODAS' ? undefined : filtro,
      pagina: 1,
      limite: LIMITE,
    }).then((res) => {
      if (!activo) return;
      if (res.success) {
        setItems(res.data.items);
        setTotal(res.data.total);
        setPagina(res.data.pagina);
        setPaginas(res.data.paginas);
        setNoLeidas(res.data.noLeidas);
      } else {
        setError(res.error || 'No se pudieron cargar las notificaciones.');
      }
      setCargando(false);
    });

    return () => {
      activo = false;
    };
  }, [abierto, esCliente, filtro, version]);

  // Aviso de tiempo real: una fila nueva para este cliente.
  useEffect(() => {
    if (!hydrated || !esCliente) return undefined;
    const instancia = conectarSocket();
    if (!instancia) return undefined;

    const alCrear = () => {
      setPulso(true);
      refrescarContador();
      // Si el drawer está abierto, se refresca la lista para que la fila nueva
      // aparezca sin cerrar y abrir.
      setVersion((v) => v + 1);
    };

    instancia.on(EVENTOS_SOCKET.NOTIFICACION_CREADA, alCrear);
    return () => {
      instancia.off(EVENTOS_SOCKET.NOTIFICACION_CREADA, alCrear);
    };
  }, [hydrated, esCliente, user?.id, refrescarContador]);

  // El pulso del badge se apaga solo; no se acumulan timers.
  useEffect(() => {
    if (!pulso) return undefined;
    const timer = setTimeout(() => setPulso(false), MS_PULSO);
    return () => clearTimeout(timer);
  }, [pulso]);

  const abrir = useCallback(() => {
    setAbierto(true);
    setVersion((v) => v + 1);
  }, []);

  const cerrar = useCallback(() => setAbierto(false), []);

  const alternar = useCallback(() => {
    setAbierto((prev) => !prev);
    setVersion((v) => v + 1);
  }, []);

  const cambiarFiltro = useCallback((nuevo) => setFiltro(nuevo), []);

  const cargarMas = useCallback(async () => {
    if (cargandoMas || pagina >= paginas) return;
    setCargandoMas(true);
    const siguiente = pagina + 1;
    const res = await obtenerNotificaciones({
      tipo: filtroRef.current === 'TODAS' ? undefined : filtroRef.current,
      pagina: siguiente,
      limite: LIMITE,
    });
    if (res.success) {
      setItems((prev) => {
        const ids = new Set(prev.map((n) => n.id));
        return [...prev, ...res.data.items.filter((n) => !ids.has(n.id))];
      });
      setPagina(res.data.pagina);
      setPaginas(res.data.paginas);
      setNoLeidas(res.data.noLeidas);
    } else {
      setError(res.error || 'No se pudieron cargar más notificaciones.');
    }
    setCargandoMas(false);
  }, [cargandoMas, pagina, paginas]);

  const marcarComoLeida = useCallback(
    async (id) => {
      const objetivo = itemsRef.current.find((n) => n.id === id);
      if (!objetivo || objetivo.leida) return { success: true };

      // Optimista: el punto se apaga ya y el badge baja sin esperar la red.
      setItems((prev) =>
        prev.map((n) =>
          n.id === id
            ? { ...n, leida: true, leidaEn: new Date().toISOString() }
            : n
        )
      );
      setNoLeidas((n) => Math.max(0, n - 1));

      const res = await marcarLeidaApi(id);
      if (!res.success) {
        recargar();
        refrescarContador();
      }
      return res;
    },
    [recargar, refrescarContador]
  );

  const marcarTodas = useCallback(async () => {
    const res = await marcarTodasLeidasApi();
    if (res.success) {
      setItems((prev) =>
        prev.map((n) =>
          n.leida
            ? n
            : { ...n, leida: true, leidaEn: new Date().toISOString() }
        )
      );
      setNoLeidas(0);
    }
    return res;
  }, []);

  const value = useMemo(
    () => ({
      items,
      noLeidas,
      total,
      pagina,
      paginas,
      cargando,
      cargandoMas,
      error,
      abierto,
      filtro,
      pulso,
      abrir,
      cerrar,
      alternar,
      cambiarFiltro,
      cargarMas,
      marcarComoLeida,
      marcarTodas,
      recargar,
    }),
    [
      items,
      noLeidas,
      total,
      pagina,
      paginas,
      cargando,
      cargandoMas,
      error,
      abierto,
      filtro,
      pulso,
      abrir,
      cerrar,
      alternar,
      cambiarFiltro,
      cargarMas,
      marcarComoLeida,
      marcarTodas,
      recargar,
    ]
  );

  return (
    <NotificacionesCentroContext.Provider value={value}>
      {children}
    </NotificacionesCentroContext.Provider>
  );
};

NotificacionesCentroProvider.propTypes = {
  children: PropTypes.node,
};

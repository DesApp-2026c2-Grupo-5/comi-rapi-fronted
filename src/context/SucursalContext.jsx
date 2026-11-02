/**
 * Propósito: Contexto de sucursal para manejar la asignación de sucursal al cliente y la gestión
 *            de sucursales por parte del superadministrador.
 * Contenido: SucursalProvider, SucursalContext, con el estado de sucursales, sucursales cercanas,
 *            pedidos pendientes, la sucursal asignada y funciones de gestión (CRUD simulado).
 * Dependencias: React (createContext, useState, useCallback, useMemo, useEffect),
 *               services/asignacionSucursal.js, api/sucursales.js, services/seedData.js.
 * Uso: <SucursalProvider> envuelve la app en App.jsx. Consumir con useSucursal().
 */

import { createContext, useState, useCallback, useMemo, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  obtenerSucursales,
  crearSucursal,
  actualizarSucursal,
  eliminarSucursal,
} from '../api/sucursales';
import { asignarSucursalOptima as asignarSucursalOptimaService } from '../services/asignacionSucursal';
import { pedidosPendientesMock } from '../services/seedData';
import { proximaAperturaEntre } from '../utils/horarios';
import { conectarSocket, EVENTOS_SOCKET } from '../services/socket';
import { useAuth } from '../hooks/useAuth';

// Se crea el contexto
export const SucursalContext = createContext(null);

// Las sucursales ya no conservan 'direccion' como texto ni 'latitud'/'longitud' propias:
// cada sucursal tiene un registro 1:1 en Direccion (Sucursal 1:1 Direccion). El backend
// expone la dirección como objeto anidado 'direccion' (con calle, altura, provincia,
// localidad, codigoPostal, referencia, latitud, longitud) y también latitud/longitud planas
// para compatibilidad. Iteración 1-geo: obligatorios calle, altura y provincia (partido
// además en Buenos Aires); localidad/codigoPostal opcionales y normalizados por el backend.
// El estado proviene del backend como booleano 'activa'.

/**
 * Proveedor del contexto de sucursal.
 * @param {React.ReactNode} children - Componentes hijos.
 */
export const SucursalProvider = ({ children }) => {
  const { hydrated, user } = useAuth();
  const emailSesion = user?.email;
  // Lista de todas las sucursales (todas las registradas, activas e inactivas)
  const [sucursales, setSucursales] = useState([]);
  // Pedidos pendientes usados por la lógica de asignación (MOCK - no se muta en esta versión)
  const [pedidosPendientes] = useState(pedidosPendientesMock);
  // Sucursal actualmente asignada al cliente
  const [sucursalAsignada, setSucursalAsignada] = useState(null);
  // Estado de carga
  const [loading, setLoading] = useState(false);

  /**
   * Carga las sucursales desde el backend y actualiza el estado global.
   * Pide también las inactivas (el backend solo las devuelve a un ADMIN), para
   * que la pantalla de gestión pueda mostrarlas y reactivarlas.
   */
  const obtenerSucursalesFn = useCallback(async () => {
    setLoading(true);
    try {
      const result = await obtenerSucursales({ incluirInactivas: true });
      if (result.success) {
        setSucursales(result.data);
        return result.data;
      }
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Carga las sucursales y asigna la óptima al cliente (lógica interna).
   */
  const cargarSucursales = useCallback(async () => {
    const data = await obtenerSucursalesFn();
    if (data.length > 0) {
      const optimal = asignarSucursalOptimaService(data, pedidosPendientesMock);
      setSucursalAsignada(optimal);
    }
  }, [obtenerSucursalesFn]);

  /**
   * Asigna la sucursal óptima usando la lógica del servicio
   * (la sucursal activa con menos pedidos pendientes).
   */
  const asignarSucursalOptima = useCallback(() => {
    const optimal = asignarSucursalOptimaService(sucursales, pedidosPendientes);
    if (optimal) {
      setSucursalAsignada(optimal);
    }
    return optimal;
  }, [sucursales, pedidosPendientes]);

  /**
   * Cambia manualmente la sucursal asignada.
   * @param {number} sucursalId - ID de la sucursal a asignar.
   */
  const cambiarSucursal = useCallback(
    (sucursalId) => {
      const nueva = sucursales.find((s) => s.id === sucursalId);
      if (nueva) {
        setSucursalAsignada(nueva);
      }
    },
    [sucursales]
  );

  /**
   * Agrega una nueva sucursal al estado local (la persiste en el backend).
   * Iteración 1-geo: un 409 devuelve `opciones` (identidades territoriales
   * de Georef) para que el formulario las muestre y el usuario elija.
   * @param {object} sucursal - Datos de la nueva sucursal.
   * @returns {Promise<{ok: boolean, data?: object, error?: string, opciones?: Array}>} Sucursal creada o el motivo del rechazo.
   */
  const agregarSucursal = useCallback(async (sucursal) => {
    const result = await crearSucursal(sucursal);
    if (result.success) {
      setSucursales((prev) => [...prev, result.data]);
      return { ok: true, data: result.data };
    }
    return { ok: false, error: result.error, opciones: result.opciones };
  }, []);

  /**
   * Actualiza una sucursal existente en el estado local.
   * Iteración 1-geo: un 409 devuelve `opciones` (identidades territoriales
   * de Georef) para que el formulario las muestre y el usuario elija.
   * @param {number} id - ID de la sucursal a actualizar.
   * @param {object} datos - Nuevos datos de la sucursal.
   * @returns {Promise<{ok: boolean, data?: object, error?: string, opciones?: Array}>} Sucursal actualizada o el motivo del rechazo.
   */
  const actualizarSucursalFn = useCallback(async (id, datos) => {
    const result = await actualizarSucursal(id, datos);
    if (result.success) {
      setSucursales((prev) =>
        prev.map((s) => (s.id === Number(id) ? result.data : s))
      );
      return { ok: true, data: result.data };
    }
    return { ok: false, error: result.error, opciones: result.opciones };
  }, []);

  /**
   * Elimina una sucursal del estado local.
   * @param {number} id - ID de la sucursal a eliminar.
   * @returns {Promise<boolean>} true si se eliminó correctamente.
   */
  const eliminarSucursalFn = useCallback(async (id) => {
    const result = await eliminarSucursal(id);
    if (result.success) {
      setSucursales((prev) => prev.filter((s) => s.id !== Number(id)));
      return true;
    }
    return false;
  }, []);

  // Carga sucursales al montar
  useEffect(() => {
    cargarSucursales();
  }, [cargarSucursales]);

  // El backend avisa por WebSocket cuando una sucursal abre o cierra
  // (`sucursal_estado`, emitido por el vigía de horarios y por los cambios del
  // superadmin). El evento no trae datos: se releen las sucursales, que siguen
  // siendo la fuente de verdad. Al reconectar también se refresca, porque los
  // cambios ocurridos sin conexión no llegaron.
  useEffect(() => {
    if (!hydrated || !emailSesion) return undefined;
    const instancia = conectarSocket();
    const alCambiarEstado = () => {
      obtenerSucursalesFn();
    };
    instancia.on('connect', alCambiarEstado);
    instancia.on(EVENTOS_SOCKET.SUCURSAL_ESTADO, alCambiarEstado);
    return () => {
      instancia.off('connect', alCambiarEstado);
      instancia.off(EVENTOS_SOCKET.SUCURSAL_ESTADO, alCambiarEstado);
    };
  }, [hydrated, emailSesion, obtenerSucursalesFn]);

  // `abiertaAhora`, `cierrePedidos` y `proximaApertura` son una foto del
  // backend al momento de la consulta. Se refrescan al volver a la pestaña y
  // cada dos minutos, sin polling agresivo: el backend revalida igual al crear
  // el pedido y al confirmar el pago, y los contadores de las pantallas usan el
  // deadline (`segundosRestantes`) que ya vino en esa foto.
  useEffect(() => {
    const alVolver = () => {
      if (!document.hidden) obtenerSucursalesFn();
    };
    document.addEventListener('visibilitychange', alVolver);
    const intervalo = setInterval(alVolver, 120000);
    return () => {
      document.removeEventListener('visibilitychange', alVolver);
      clearInterval(intervalo);
    };
  }, [obtenerSucursalesFn]);

  // Sucursales cercanas (solo activas) calculadas para el cliente
  const sucursalesCercanas = useMemo(
    () => sucursales.filter((s) => s.activa !== false),
    [sucursales]
  );

  // Estado operativo global del catálogo: el aviso de "todas cerradas" solo
  // aplica cuando NINGUNA sucursal activa está tomando pedidos ahora.
  const sucursalesAbiertas = useMemo(
    () => sucursalesCercanas.filter((s) => s.abiertaAhora),
    [sucursalesCercanas]
  );
  const todasCerradas =
    sucursalesCercanas.length > 0 && sucursalesAbiertas.length === 0;
  const proximaApertura = useMemo(
    () => proximaAperturaEntre(sucursalesCercanas),
    [sucursalesCercanas]
  );

  // Valor del contexto
  const value = useMemo(
    () => ({
      sucursales,
      sucursalesCercanas,
      sucursalesAbiertas,
      todasCerradas,
      proximaApertura,
      pedidosPendientes,
      sucursalAsignada,
      loading,
      obtenerSucursales: obtenerSucursalesFn,
      cargarSucursales,
      asignarSucursalOptima,
      cambiarSucursal,
      agregarSucursal,
      actualizarSucursal: actualizarSucursalFn,
      eliminarSucursal: eliminarSucursalFn,
    }),
    [
      sucursales,
      sucursalesCercanas,
      sucursalesAbiertas,
      todasCerradas,
      proximaApertura,
      pedidosPendientes,
      sucursalAsignada,
      loading,
      obtenerSucursalesFn,
      cargarSucursales,
      asignarSucursalOptima,
      cambiarSucursal,
      agregarSucursal,
      actualizarSucursalFn,
      eliminarSucursalFn,
    ]
  );

  return <SucursalContext.Provider value={value}>{children}</SucursalContext.Provider>;
};

SucursalProvider.propTypes = {
  children: PropTypes.node,
};
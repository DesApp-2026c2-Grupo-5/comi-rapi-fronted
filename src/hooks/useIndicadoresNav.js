/**
 * Propósito: Contadores y animaciones de los badges de navegación, compartidos
 *            por la barra superior y la barra inferior.
 * Contenido: Hook que calcula cuántos productos hay en el carrito, cuántos
 *            pedidos están en curso, cuántos reclamos quedan pendientes de
 *            respuesta y los pulsos de aviso.
 * Dependencias: React (useState, useEffect), useCarrito, usePedidos, useAuth,
 *               api/quejas, services/socket, constants.
 * Uso: const { productosDistintos, pedidosActivos, quejasPendientes } =
 *        useIndicadoresNav();
 *
 * Existe como hook porque los mismos números se muestran en la barra superior
 * y en la inferior: duplicar el cálculo y los `setTimeout` en los dos
 * componentes era la forma segura de que los badges dejaran de coincidir. Los
 * dos componentes llaman al hook por separado y cada uno mantiene su propio
 * pulso, así que la animación de uno no depende de que el otro esté montado.
 *
 * El PENDIENTE se excluye a propósito de `pedidosActivos`: todavía no se pagó,
 * así que no cuenta como pedido activo (mismo criterio que "Mis Pedidos"). Si se
 * contara, el badge marcaría un pedido apenas se confirma el carrito, antes de
 * pagarlo.
 *
 * `quejasPendientes` solo aplica a ADMINISTRADOR y SUPERADMINISTRADOR: son los
 * únicos que ven la bandeja de reclamos. El número sale de `GET /api/quejas`
 * (el backend ya acota al admin a su sucursal) y se refresca con el evento
 * `queja_actualizada` del canal de tiempo real.
 */

import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useCarrito } from './useCarrito';
import { usePedidos } from './usePedidos';
import { useAuth } from './useAuth';
import { useQuejasQuery } from '../hooks/queries';
import {
  alReconectar,
  conectarSocket,
  EVENTOS_SOCKET,
} from '../services/socket';
import {
  ESTADOS_PEDIDO,
  ESTADOS_QUEJA,
  ROLES,
} from '../utils/constants';

const useIndicadoresNav = () => {
  const { productosDistintos } = useCarrito();
  const { pedidos, senalPedido } = usePedidos();
  const { user, hydrated } = useAuth();
  const queryClient = useQueryClient();

  const pedidosActivos = pedidos.filter(
    (p) =>
      p.estado !== ESTADOS_PEDIDO.PENDIENTE &&
      p.estado !== ESTADOS_PEDIDO.ENTREGADO &&
      p.estado !== ESTADOS_PEDIDO.CANCELADO
  ).length;

  const esGestorDeQuejas =
    user?.rol === ROLES.ADMIN || user?.rol === ROLES.SUPERADMIN;

  const [pulsoCarrito, setPulsoCarrito] = useState(false);
  const [pulsoPedido, setPulsoPedido] = useState(false);
  const [pulsoPedidoBadge, setPulsoPedidoBadge] = useState(false);
  const [senalQueja, setSenalQueja] = useState(0);
  const [pulsoQueja, setPulsoQueja] = useState(false);
  const [pulsoQuejaBadge, setPulsoQuejaBadge] = useState(false);

  // TanStack Query hook para quejas pendientes
  const { data: quejasData } = useQuejasQuery({
    estado: ESTADOS_QUEJA.PENDIENTE,
    limite: 1,
    enabled: hydrated && esGestorDeQuejas,
  });

  const quejasPendientes = quejasData?.meta?.total || 0;

  // Pulso del badge cada vez que cambia la cantidad de productos distintos.
  useEffect(() => {
    if (productosDistintos === 0) return undefined;
    setPulsoCarrito(true);
    const timeout = setTimeout(() => setPulsoCarrito(false), 800);
    return () => clearTimeout(timeout);
  }, [productosDistintos]);

  // Pulso del ícono de pedidos cada vez que se confirma un pago.
  useEffect(() => {
    if (senalPedido === 0) return undefined;
    setPulsoPedido(true);
    const timeout = setTimeout(() => setPulsoPedido(false), 800);
    return () => clearTimeout(timeout);
  }, [senalPedido]);

  // Pulso del número de pedidos cuando cambia la cantidad de pedidos activos.
  useEffect(() => {
    if (pedidosActivos === 0) return undefined;
    setPulsoPedidoBadge(true);
    const timeout = setTimeout(() => setPulsoPedidoBadge(false), 800);
    return () => clearTimeout(timeout);
  }, [pedidosActivos]);

  // Pulso del número cuando cambia la cantidad de reclamos pendientes.
  useEffect(() => {
    if (quejasPendientes === 0) return undefined;
    setPulsoQuejaBadge(true);
    const timeout = setTimeout(() => setPulsoQuejaBadge(false), 800);
    return () => clearTimeout(timeout);
  }, [quejasPendientes]);

  // Socket para actualizaciones en tiempo real del contador de quejas.
  // La suscripción vive en el singleton: el cambio de contexto del superadmin
  // renegocia el handshake pero no reemplaza la instancia, así que los
  // listeners siguen siendo válidos. `alReconectar` evita el GET duplicado en
  // la primera conexión y en la reconexión intencional por cambio de contexto.
  useEffect(() => {
    if (!hydrated || !esGestorDeQuejas) return undefined;

    const instancia = conectarSocket();
    const invalidarQuejas = () =>
      queryClient.invalidateQueries({ queryKey: ['private', 'quejas'] });
    const alActualizar = () => {
      setSenalQueja((valor) => valor + 1);
      invalidarQuejas();
    };
    const desregistrarReconexion = alReconectar(instancia, invalidarQuejas);
    instancia.on(EVENTOS_SOCKET.QUEJA_ACTUALIZADA, alActualizar);

    return () => {
      desregistrarReconexion();
      instancia.off(EVENTOS_SOCKET.QUEJA_ACTUALIZADA, alActualizar);
    };
  }, [hydrated, esGestorDeQuejas, queryClient]);

  // Pulso del ícono cuando llega el aviso de un reclamo nuevo o actualizado.
  useEffect(() => {
    if (senalQueja === 0) return undefined;
    setPulsoQueja(true);
    const timeout = setTimeout(() => setPulsoQueja(false), 800);
    return () => clearTimeout(timeout);
  }, [senalQueja]);

  // Pulso del número cuando cambia la cantidad de reclamos pendientes.
  useEffect(() => {
    if (quejasPendientes === 0) return undefined;
    setPulsoQuejaBadge(true);
    const timeout = setTimeout(() => setPulsoQuejaBadge(false), 800);
    return () => clearTimeout(timeout);
  }, [quejasPendientes]);

  return {
    productosDistintos,
    pedidosActivos,
    quejasPendientes,
    pulsoCarrito,
    pulsoPedido,
    pulsoPedidoBadge,
    pulsoQueja,
    pulsoQuejaBadge,
  };
};

export default useIndicadoresNav;

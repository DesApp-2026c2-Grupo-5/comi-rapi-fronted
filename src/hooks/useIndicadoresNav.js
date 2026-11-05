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
import { useCarrito } from './useCarrito';
import { usePedidos } from './usePedidos';
import { useAuth } from './useAuth';
import { useSucursalOperativa } from './useSucursalOperativa';
import { obtenerQuejas } from '../api/quejas';
import { conectarSocket, EVENTOS_SOCKET } from '../services/socket';
import {
  ESTADOS_PEDIDO,
  ESTADOS_QUEJA,
  ROLES,
} from '../utils/constants';

const useIndicadoresNav = () => {
  const { productosDistintos } = useCarrito();
  const { pedidos, senalPedido } = usePedidos();
  const { user, hydrated } = useAuth();
  // `versionSocket` cambia cuando el SUPERADMIN elige o limpia su sucursal de
  // contexto: ese flujo cierra la conexión y la próxima se abre con otras rooms.
  // Sin esta dependencia el efecto quedaba escuchando la instancia muerta y el
  // badge dejaba de actualizarse en vivo.
  const { versionSocket } = useSucursalOperativa();

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
  const [quejasPendientes, setQuejasPendientes] = useState(0);
  const [senalQueja, setSenalQueja] = useState(0);
  const [pulsoQueja, setPulsoQueja] = useState(false);
  const [pulsoQuejaBadge, setPulsoQuejaBadge] = useState(false);

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

  // Reclamos pendientes: se leen por REST (el backend acota al admin a su
  // sucursal) y se refrescan cuando el canal avisa que llegó o cambió uno.
  useEffect(() => {
    if (!hydrated || !esGestorDeQuejas) {
      setQuejasPendientes(0);
      return undefined;
    }

    let vivo = true;
    const cargar = async () => {
      const res = await obtenerQuejas({
        estado: ESTADOS_QUEJA.PENDIENTE,
        limite: 1,
      });
      if (vivo && res.success) setQuejasPendientes(res.data.total);
    };
    cargar();

    const instancia = conectarSocket();
    // Al reconectar se re-consulta el total: si se perdió un aviso mientras el
    // socket estaba caído (o se recreó por cambio de sucursal), el número
    // quedaría viejo. El aviso en sí solo trae ids; la verdad se lee por REST.
    const alConectar = () => cargar();
    const alActualizar = () => {
      setSenalQueja((valor) => valor + 1);
      cargar();
    };
    instancia.on('connect', alConectar);
    instancia.on(EVENTOS_SOCKET.QUEJA_ACTUALIZADA, alActualizar);

    return () => {
      vivo = false;
      instancia.off('connect', alConectar);
      instancia.off(EVENTOS_SOCKET.QUEJA_ACTUALIZADA, alActualizar);
    };
  }, [hydrated, esGestorDeQuejas, user?.id, versionSocket]);

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

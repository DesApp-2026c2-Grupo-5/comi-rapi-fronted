/**
 * Propósito: Contadores y animaciones de los badges de navegación, compartidos
 *            por la barra superior y la barra inferior.
 * Contenido: Hook que calcula cuántos productos hay en el carrito, cuántos
 *            pedidos están en curso y los tres pulsos de aviso.
 * Dependencias: React (useState, useEffect), useCarrito, usePedidos, constants.
 * Uso: const { productosDistintos, pedidosActivos } = useIndicadoresNav();
 *
 * Existe como hook porque los mismos números se muestran en la barra superior
 * y en la inferior: duplicar el cálculo y los tres `setTimeout` en los dos
 * componentes era la forma segura de que los badges dejaran de coincidir. Los
 * dos componentes llaman al hook por separado y cada uno mantiene su propio
 * pulso, así que la animación de uno no depende de que el otro esté montado.
 *
 * El PENDIENTE se excluye a propósito de `pedidosActivos`: todavía no se pagó,
 * así que no cuenta como pedido activo (mismo criterio que "Mis Pedidos"). Si se
 * contara, el badge marcaría un pedido apenas se confirma el carrito, antes de
 * pagarlo.
 */

import { useState, useEffect } from 'react';
import { useCarrito } from './useCarrito';
import { usePedidos } from './usePedidos';
import { ESTADOS_PEDIDO } from '../utils/constants';

const useIndicadoresNav = () => {
  const { productosDistintos } = useCarrito();
  const { pedidos, senalPedido } = usePedidos();

  const pedidosActivos = pedidos.filter(
    (p) =>
      p.estado !== ESTADOS_PEDIDO.PENDIENTE &&
      p.estado !== ESTADOS_PEDIDO.ENTREGADO &&
      p.estado !== ESTADOS_PEDIDO.CANCELADO
  ).length;

  const [pulsoCarrito, setPulsoCarrito] = useState(false);
  const [pulsoPedido, setPulsoPedido] = useState(false);
  const [pulsoPedidoBadge, setPulsoPedidoBadge] = useState(false);

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

  return {
    productosDistintos,
    pedidosActivos,
    pulsoCarrito,
    pulsoPedido,
    pulsoPedidoBadge,
  };
};

export default useIndicadoresNav;
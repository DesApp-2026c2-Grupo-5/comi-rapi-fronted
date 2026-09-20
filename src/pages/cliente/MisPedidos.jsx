/**
 * Propósito: Página de historial de pedidos del cliente con estado destacado y stepper
 *            de estados (mismo visual que el admin: iconos que se encienden/apagan).
 * Contenido: Componente MisPedidos con cards de pedidos (número, fecha, total, sucursal,
 *            stepper de progreso y estado), con el detalle en otra página.
 * Dependencias: react-bootstrap (Container, Card, Badge, Button), react-router-dom,
 *               hooks/usePedidos, utils/constants.js, utils/formatters.js,
 *               services/envio.js, componentes/comunes (IconoEstado, HistorialStepper).
 * Uso: Ruta "/cliente/mis-pedidos" → <MisPedidos />
 *
 * NOTA: Los pedidos provienen de la API real; el backend ya devuelve solo los
 * pedidos del cliente autenticado (scope por usuarioId).
 */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Container, Card, Badge, Button } from 'react-bootstrap';
import { FaUtensils, FaEye, FaTimesCircle } from 'react-icons/fa';
import { usePedidos } from '../../hooks/usePedidos';
import { useNotificaciones } from '../../hooks/useNotificaciones';
import { useAuth } from '../../hooks/useAuth';
import { ESTADOS_PEDIDO, ETIQUETAS_ESTADO_PEDIDO, VARIANTE_ESTADO_PEDIDO } from '../../utils/constants';
import { formatPrice, formatDate } from '../../utils/formatters';
import { calcularCostoEnvio } from '../../services/envio';
import IconoEstado from '../../components/comunes/IconoEstado';
import HistorialStepper from '../../components/comunes/HistorialStepper';
import ConfirmarModal from '../../components/comunes/ConfirmarModal';

const MisPedidos = () => {
  const { pedidos, cambiarEstado } = usePedidos();
  const { notificar } = useNotificaciones();
  const { user } = useAuth();
  // Evita doble clic mientras una cancelación está en curso
  const [cancelandoId, setCancelandoId] = useState(null);
  // Pedido que está esperando confirmación de cancelación en el modal
  const [pedidoACancelar, setPedidoACancelar] = useState(null);
  // Pedido que no puede cancelarse (se muestra el aviso "ya comenzó a prepararse")
  const [pedidoNoCancelable, setPedidoNoCancelable] = useState(null);

  // El backend devuelve solo los pedidos del cliente autenticado
  const misPedidos = pedidos;

  // Solo puede cancelarse antes de iniciar la preparación (pendiente/confirmado)
  const esCancelable = (pedido) =>
    pedido.estado === ESTADOS_PEDIDO.PENDIENTE ||
    pedido.estado === ESTADOS_PEDIDO.CONFIRMADO;

  // Pide confirmación con el modal antes de cancelar y persiste en la API.
  const pedirCancelacion = (pedido) => {
    if (esCancelable(pedido)) {
      setPedidoACancelar(pedido);
    } else {
      setPedidoNoCancelable(pedido);
    }
  };

  const handleCancelar = async () => {
    if (!pedidoACancelar) return;
    setCancelandoId(pedidoACancelar.id);
    try {
      const actualizado = await cambiarEstado(
        pedidoACancelar.id,
        ESTADOS_PEDIDO.CANCELADO
      );
      if (actualizado) {
        notificar(`Pedido #${pedidoACancelar.id} cancelado`, 'success');
      }
      setPedidoACancelar(null);
    } finally {
      setCancelandoId(null);
    }
  };

  return (
    <Container className="py-4">
      <h1 className="mb-4">Mis Pedidos</h1>

      {misPedidos.length === 0 ? (
        <Card className="shadow-sm text-center p-5">
          <h4 className="fw-bold mb-2">Todavía no tenés pedidos</h4>
          <p className="text-muted mb-4">¡Hacé tu primer pedido y seguí su estado acá!</p>
          <div>
            <Link to="/cliente/catalogo">
              <Button variant="primary" className="rounded-pill px-4">
                  <FaUtensils aria-hidden="true" />
                  Ir al catálogo
                </Button>
            </Link>
          </div>
        </Card>
      ) : (
        misPedidos.map((pedido) => {
          const estadoLabel = ETIQUETAS_ESTADO_PEDIDO[pedido.estado] || pedido.estado;
          // El total del backend ya incluye el envío (los seed más viejos lo calculan).
          const costoEnvio = pedido.costoEnvio ?? calcularCostoEnvio(pedido.total);
          const subtotal = pedido.total - costoEnvio;
          const esFinal = pedido.estado === ESTADOS_PEDIDO.ENTREGADO || pedido.estado === ESTADOS_PEDIDO.CANCELADO;
          const esCancelado = pedido.estado === ESTADOS_PEDIDO.CANCELADO;
          // Quién canceló: si el usuarioId del registro coincide con el cliente
          // autenticado, la cancelación la hizo el propio cliente; si no, el admin.
          const registroCancelacion = (pedido.historialEstados || []).find(
            (h) => h.estado === ESTADOS_PEDIDO.CANCELADO
          );
          const esCancelacionPropia =
            Boolean(registroCancelacion?.usuarioId) &&
            registroCancelacion.usuarioId === user?.id;
          const fechaCancelacion = registroCancelacion
            ? formatDate(registroCancelacion.fecha)
            : null;
          return (
            <Card key={pedido.id} className="mb-3 shadow-sm">
              <Card.Header className="d-flex justify-content-between align-items-center">
                <strong>Pedido #{pedido.id}</strong>
                <Badge
                  bg={VARIANTE_ESTADO_PEDIDO[pedido.estado] || 'secondary'}
                  className="d-inline-flex align-items-center gap-1"
                >
                  <IconoEstado estado={pedido.estado} size={15} />
                  {estadoLabel}
                </Badge>
              </Card.Header>
              <Card.Body>
                <p className="mb-1"><strong>Fecha:</strong> {formatDate(pedido.fecha)}</p>
                <div className="mb-1">
                  <strong>Productos:</strong>
                  {pedido.productos.map((p, i) => (
                    <div key={i} className="ms-2 small">
                      <span>{p.nombre} x{p.cantidad}</span>
                      {p.extras?.length > 0 && <span className="text-muted"> — {p.extras.map((e) => `${e.nombre} (+${formatPrice(e.precio)})`).join(', ')}</span>}
                      {p.sin?.length > 0 && <span className="text-muted"> — Sin {p.sin.join(', ')}</span>}
                      {p.acompanamientos?.length > 0 && <span className="text-muted"> — {p.acompanamientos.map((a) => a.nombre).join(', ')}</span>}
                      {p.condimentos?.length > 0 && <span className="text-muted"> — {p.condimentos.map((c) => c.nombre).join(', ')}</span>}
                    </div>
                  ))}
                </div>
                <p className="mb-1"><strong>Subtotal:</strong> {formatPrice(subtotal)}</p>
                <p className="mb-1">
                  <strong>Envío:</strong>{' '}
                  {costoEnvio === 0 ? (
                    <span className="text-success">Gratis</span>
                  ) : (
                    formatPrice(costoEnvio)
                  )}
                </p>
                <p className="mb-2"><strong>Total:</strong> {formatPrice(pedido.total)}</p>
                <p className="mb-2">
                  <strong>Sucursal:</strong>{' '}
                  {pedido.sucursal?.nombre || pedido.sucursal || '-'}
                </p>

                <div className="historial-box">
                  <span className="historial-titulo">Progreso del pedido</span>
                  <HistorialStepper pedido={pedido} sinNodoCancelado />
                  {esCancelado && (
                    <div
                      className="d-flex align-items-start gap-2 mt-3"
                      style={{
                        backgroundColor: '#fff4e2',
                        border: '1px solid #f1c27d',
                        borderRadius: '12px',
                        padding: '10px 14px',
                      }}
                    >
                      <FaTimesCircle className="text-danger flex-shrink-0 mt-1" aria-hidden="true" />
                      <span>
                        <strong className="text-danger">
                          {esCancelacionPropia
                            ? 'Cancelaste este pedido.'
                            : 'Tu pedido ha sido cancelado.'}
                        </strong>
                        {fechaCancelacion && (
                          <span className="small text-muted d-block">
                            Cancelado el {fechaCancelacion}
                          </span>
                        )}
                      </span>
                    </div>
                  )}
                </div>

                <div className="d-flex gap-2 mt-2 flex-wrap">
                  <Link to={`/cliente/pedido/${pedido.id}`}>
                    <Button variant="outline-secondary" size="sm">
                      <FaEye aria-hidden="true" />
                      Ver detalle
                    </Button>
                  </Link>
                  {!esFinal && (
                    <Button
                      variant="outline-danger"
                      size="sm"
                      onClick={() => pedirCancelacion(pedido)}
                      disabled={cancelandoId === pedido.id}
                    >
                      <FaTimesCircle aria-hidden="true" />
                      {cancelandoId === pedido.id ? 'Cancelando...' : 'Cancelar'}
                    </Button>
                  )}
                </div>
              </Card.Body>
            </Card>
          );
        })
      )}

      <ConfirmarModal
        mostrar={Boolean(pedidoACancelar)}
        titulo="Cancelar pedido"
        mensaje={
          pedidoACancelar ? '¿Seguro que querés cancelar el pedido?' : ''
        }
        textoConfirmar="Sí, cancelar pedido"
        cargando={Boolean(cancelandoId)}
        onConfirmar={handleCancelar}
        onCancelar={() => setPedidoACancelar(null)}
      />

      <ConfirmarModal
        aviso
        mostrar={Boolean(pedidoNoCancelable)}
        titulo="No se puede cancelar"
        mensaje={
          pedidoNoCancelable
            ? 'Este pedido ya comenzó a prepararse, por lo que no puede cancelarse.'
            : ''
        }
        onCancelar={() => setPedidoNoCancelable(null)}
      />
    </Container>
  );
};

export default MisPedidos;
/**
 * Propósito: Lista reutilizable de tarjetas de pedido (Mis Pedidos / Historial).
 * Extraída de MisPedidos: mismo visual, stepper y acciones.
 * Props: pedidos ya filtrados, user, cancelandoId, repitiendoId,
 * pedirCancelacion?, pedirRepeticion, mostrarCancelar (default true).
 */

import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import { Card, Badge, Button } from 'react-bootstrap';
import { FaEye, FaTimesCircle, FaRedo, FaClock } from 'react-icons/fa';
import { ESTADOS_PEDIDO, ETIQUETAS_ESTADO_PEDIDO, VARIANTE_ESTADO_PEDIDO } from '../../utils/constants';
import { formatPrice, formatDate } from '../../utils/formatters';
import { calcularCostoEnvio } from '../../services/envio';
import IconoEstado from '../comunes/IconoEstado';
import HistorialStepper from '../comunes/HistorialStepper';

const ListaPedidos = ({
  pedidos,
  user,
  cancelandoId,
  repitiendoId,
  pedirCancelacion,
  pedirRepeticion,
  mostrarCancelar = true,
}) => (
  <>
    {pedidos.map((pedido) => {
      const estadoLabel = ETIQUETAS_ESTADO_PEDIDO[pedido.estado] || pedido.estado;
      const costoEnvio = pedido.costoEnvio ?? calcularCostoEnvio(pedido.total);
      const subtotal = pedido.total - costoEnvio;
      const esFinal =
        pedido.estado === ESTADOS_PEDIDO.ENTREGADO ||
        pedido.estado === ESTADOS_PEDIDO.CANCELADO;
      const esCancelado = pedido.estado === ESTADOS_PEDIDO.CANCELADO;
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
            <div className="d-flex align-items-center gap-2">
              {!esFinal && pedido.etaMinutos !== null && pedido.etaMinutos !== undefined && (
                <Badge bg="info">
                  <FaClock className="me-1" aria-hidden="true" size={11} />
                  ~{pedido.etaMinutos} min
                </Badge>
              )}
              {/* T4: badge de reasignación de sucursal */}
              {(pedido.historialEstados || []).some(
                (h) => h.observacion && /reasignado/i.test(h.observacion)
              ) && (
                <Badge bg="warning" className="text-dark">
                  Reasignado
                </Badge>
              )}
              <Badge
                bg={VARIANTE_ESTADO_PEDIDO[pedido.estado] || 'secondary'}
                className="d-inline-flex align-items-center gap-1"
              >
                <IconoEstado estado={pedido.estado} size={15} />
                {estadoLabel}
              </Badge>
            </div>
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
            {(pedido.promociones || []).length > 0 && (
              <p className="mb-2 small">
                <strong>Descuento:</strong>{' '}
                <span className="text-success">
                  −{formatPrice((pedido.promociones || []).reduce((acc, promo) => acc + Number(promo.descuentoAplicado ?? 0), 0))}
                </span>{' '}
                <span className="text-muted">
                  ({(pedido.promociones || []).map((promo) => promo.nombre || `#${promo.promocionId}`).join(' · ')})
                </span>
              </p>
            )}
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
              <Button as={Link} to={`/cliente/pedido/${pedido.id}`} variant="outline-secondary" size="sm">
                <FaEye aria-hidden="true" />
                Ver detalle
              </Button>
              {mostrarCancelar && !esFinal && pedirCancelacion && (
                <Button
                  variant="outline-danger"
                  size="sm"
                  onClick={() => pedirCancelacion(pedido)}
                  disabled={cancelandoId === pedido.id}
                >
                  <FaTimesCircle aria-hidden="true" />
                  {cancelandoId === pedido.id ? 'Cancelando…' : 'Cancelar'}
                </Button>
              )}
              {esFinal && pedirRepeticion && (
                <Button
                  variant="outline-primary"
                  size="sm"
                  onClick={() => pedirRepeticion(pedido)}
                  disabled={repitiendoId === pedido.id}
                >
                  <FaRedo aria-hidden="true" />
                  {repitiendoId === pedido.id ? 'Agregando…' : 'Repetir'}
                </Button>
              )}
            </div>
          </Card.Body>
        </Card>
      );
    })}
  </>
);

ListaPedidos.propTypes = {
  pedidos: PropTypes.arrayOf(PropTypes.object).isRequired,
  user: PropTypes.shape({ id: PropTypes.number }),
  cancelandoId: PropTypes.number,
  repitiendoId: PropTypes.number,
  pedirCancelacion: PropTypes.func,
  pedirRepeticion: PropTypes.func,
  mostrarCancelar: PropTypes.bool,
};

export default ListaPedidos;

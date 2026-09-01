/**
 * Propósito: Lista de pedidos con gestión de estados para el administrador.
 * Contenido: Componente PedidosPendientes con cards de pedidos, un stepper visual de
 *            estados con iconos de react-icons (los futuros quedan oscurecidos y se
 *            encienden al avanzar) y acciones de un clic para cambiar el estado
 *            (validadas por la lógica de transiciones).
 * Dependencias: react-bootstrap (Card, Badge, Button, Container, ListGroup),
 *               react-icons/fa, hooks/usePedidos, services/estadosPedido.js,
 *               utils/constants.js, PedidosPendientes.css.
 * Uso: <PedidosPendientes /> - Se renderiza en GestionPedidos.
 */

import { Card, Badge, Button, Container, ListGroup } from 'react-bootstrap';
import { FaTimesCircle, FaArrowRight } from 'react-icons/fa';
import { usePedidos } from '../../hooks/usePedidos';
import { puedeTransicionar, obtenerEstadosSiguientes } from '../../services/estadosPedido';
import {
  ESTADOS_PEDIDO,
  ETIQUETAS_ESTADO_PEDIDO,
  VARIANTE_ESTADO_PEDIDO,
} from '../../utils/constants';
import { formatPrice } from '../../utils/formatters';
import HistorialStepper from '../comunes/HistorialStepper';
import './PedidosPendientes.css';

// Acción amigable para el botón de avance según el próximo estado
const ACCIONES_SIGUIENTE = {
  [ESTADOS_PEDIDO.CONFIRMADO]: 'Confirmar pedido',
  [ESTADOS_PEDIDO.EN_PREPARACION]: 'Iniciar preparación',
  [ESTADOS_PEDIDO.LISTO_PARA_ENTREGAR]: 'Marcar listo para entregar',
  [ESTADOS_PEDIDO.EN_CAMINO]: 'Enviar al repartidor',
  [ESTADOS_PEDIDO.ENTREGADO]: 'Confirmar entrega',
};

const PedidosPendientes = () => {
  const { pedidos, cambiarEstado } = usePedidos();

  // Cambia el estado validando la transición con la lógica del servicio
  const handleCambiarEstado = (pedido, estadoDestino) => {
    if (puedeTransicionar(pedido.estado, estadoDestino)) {
      cambiarEstado(pedido.id, estadoDestino);
      alert(`Pedido #${pedido.id} cambió a: ${ETIQUETAS_ESTADO_PEDIDO[estadoDestino]}`);
    } else {
      alert(
        `No se puede pasar de "${ETIQUETAS_ESTADO_PEDIDO[pedido.estado] || pedido.estado}" a "${ETIQUETAS_ESTADO_PEDIDO[estadoDestino] || estadoDestino}"`
      );
    }
  };

  return (
    <Container>
      <h2 className="mb-4">Gestión de Pedidos</h2>
      {pedidos.map((pedido) => {
        const estadosSiguientes = obtenerEstadosSiguientes(pedido.estado);
        const esCancelado = pedido.estado === ESTADOS_PEDIDO.CANCELADO;
        const principal = estadosSiguientes.find((e) => FLUJO_ESTADOS.includes(e)) || null;
        const puedeCancelar = estadosSiguientes.includes(ESTADOS_PEDIDO.CANCELADO);

        return (
          <Card key={pedido.id} className="mb-3 shadow-sm">
            <Card.Header className="d-flex justify-content-between align-items-center">
              <strong>Pedido #{pedido.id}</strong>
              <Badge bg={VARIANTE_ESTADO_PEDIDO[pedido.estado] || 'secondary'}>
                {ETIQUETAS_ESTADO_PEDIDO[pedido.estado] || pedido.estado}
              </Badge>
            </Card.Header>
            <Card.Body>
              <p className="mb-1"><strong>Cliente:</strong> {pedido.cliente}</p>
              <p className="mb-1">
                <strong>Sucursal:</strong>{' '}
                {pedido.sucursal?.nombre || pedido.sucursal || '-'}
              </p>
              <p className="mb-1"><strong>Productos:</strong></p>
              <ListGroup variant="flush" className="mb-2">
                {pedido.productos.map((prod, idx) => (
                  <ListGroup.Item key={idx} className="px-0 py-1">
                    {prod.nombre} x{prod.cantidad} - {formatPrice(prod.precio)}
                  </ListGroup.Item>
                ))}
              </ListGroup>
              <p className="fw-bold text-danger mb-2">Total: {formatPrice(pedido.total)}</p>

              {/* Stepper visual + acciones de un clic */}
              <div className="historial-box">
                <span className="historial-titulo">Progreso del pedido</span>
                <HistorialStepper
                  pedido={pedido}
                  onCambiar={(estadoDestino) => handleCambiarEstado(pedido, estadoDestino)}
                />

                <div className="historial-acciones">
                  {principal ? (
                    <>
                      <span className="historial-acciones-ayuda">Avanzá el pedido con un clic:</span>
                      <Button
                        size="lg"
                        className="btn-historial-avanzar"
                        onClick={() => handleCambiarEstado(pedido, principal)}
                      >
                        {ACCIONES_SIGUIENTE[principal] ||
                          `Pasar a ${ETIQUETAS_ESTADO_PEDIDO[principal]}`}
                        <FaArrowRight className="ms-2" aria-hidden="true" />
                      </Button>
                    </>
                  ) : (
                    <span className="text-muted">
                      {esCancelado
                        ? 'Este pedido fue cancelado.'
                        : pedido.estado === ESTADOS_PEDIDO.ENTREGADO
                          ? 'Pedido finalizado.'
                          : 'Estado final: no hay más transiciones.'}
                    </span>
                  )}
                  {puedeCancelar && (
                    <Button
                      size="lg"
                      variant="outline-danger"
                      className="btn-historial-cancelar"
                      onClick={() => handleCambiarEstado(pedido, ESTADOS_PEDIDO.CANCELADO)}
                    >
                      <FaTimesCircle className="me-2" aria-hidden="true" />
                      Cancelar pedido
                    </Button>
                  )}
                </div>
              </div>
            </Card.Body>
          </Card>
        );
      })}
    </Container>
  );
};

export default PedidosPendientes;
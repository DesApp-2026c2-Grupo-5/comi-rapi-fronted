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

import { Fragment } from 'react';
import { Card, Badge, Button, Container, ListGroup } from 'react-bootstrap';
import {
  FaClock,
  FaCheckCircle,
  FaFire,
  FaBox,
  FaMotorcycle,
  FaFlagCheckered,
  FaTimesCircle,
  FaArrowRight,
} from 'react-icons/fa';
import { usePedidos } from '../../hooks/usePedidos';
import { puedeTransicionar, obtenerEstadosSiguientes } from '../../services/estadosPedido';
import {
  ESTADOS_PEDIDO,
  ESTADOS_VISIBLES_CLIENTE,
  ETIQUETAS_ESTADO_PEDIDO,
  VARIANTE_ESTADO_PEDIDO,
} from '../../utils/constants';
import { formatPrice } from '../../utils/formatters';
import './PedidosPendientes.css';

// Icono grande por estado (react-icons)
const ICONO_ESTADO = {
  [ESTADOS_PEDIDO.PENDIENTE]: FaClock,
  [ESTADOS_PEDIDO.CONFIRMADO]: FaCheckCircle,
  [ESTADOS_PEDIDO.EN_PREPARACION]: FaFire,
  [ESTADOS_PEDIDO.LISTO_PARA_ENTREGAR]: FaBox,
  [ESTADOS_PEDIDO.EN_CAMINO]: FaMotorcycle,
  [ESTADOS_PEDIDO.ENTREGADO]: FaFlagCheckered,
  [ESTADOS_PEDIDO.CANCELADO]: FaTimesCircle,
};

// Orden visual del flujo principal (sin cancelado, que es un nodo especial)
const FLUJO_ESTADOS = ESTADOS_VISIBLES_CLIENTE.filter((e) => e !== ESTADOS_PEDIDO.CANCELADO);

// Acción amigable para el botón de avance según el próximo estado
const ACCIONES_SIGUIENTE = {
  [ESTADOS_PEDIDO.CONFIRMADO]: 'Confirmar pedido',
  [ESTADOS_PEDIDO.EN_PREPARACION]: 'Iniciar preparación',
  [ESTADOS_PEDIDO.LISTO_PARA_ENTREGAR]: 'Marcar listo para entregar',
  [ESTADOS_PEDIDO.EN_CAMINO]: 'Enviar al repartidor',
  [ESTADOS_PEDIDO.ENTREGADO]: 'Confirmar entrega',
};

// Formatea fecha y hora (dd/mm/aaaa hh:mm)
const formatFechaHora = (fecha) => {
  return new Intl.DateTimeFormat('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(fecha));
};

/**
 * Stepper visual del historial de estados: los iconos de estados ya alcanzados
 * "se encienden" en verde, el actual late en naranja y los futuros quedan
 * oscurecidos. El siguiente estado permitido es clicable (un clic para avanzar).
 */
const HistorialStepper = ({ pedido, onCambiar }) => {
  const estadosSiguientes = obtenerEstadosSiguientes(pedido.estado);
  const esCancelado = pedido.estado === ESTADOS_PEDIDO.CANCELADO;

  // Índice alcanzado dentro del flujo (si está cancelado, hasta dónde llegó antes)
  let alcanzado = FLUJO_ESTADOS.indexOf(pedido.estado);
  if (esCancelado) {
    const ultimoEnFlujo = [...(pedido.historialEstados || [])]
      .reverse()
      .find((h) => FLUJO_ESTADOS.includes(h.estado));
    alcanzado = ultimoEnFlujo ? FLUJO_ESTADOS.indexOf(ultimoEnFlujo.estado) : -1;
  }

  // Próximo estado principal (el primer siguiente que pertenece al flujo)
  const principal = estadosSiguientes.find((e) => FLUJO_ESTADOS.includes(e)) || null;
  const puedeCancelar = estadosSiguientes.includes(ESTADOS_PEDIDO.CANCELADO);
  const mostrarCancelado = esCancelado || puedeCancelar;

  const fechaDe = (estado) => {
    const registro = (pedido.historialEstados || []).find((h) => h.estado === estado);
    return registro ? formatFechaHora(registro.fecha) : null;
  };

  // Clase según la posición en el flujo
  const claseDe = (idx) => {
    if (esCancelado) return idx <= alcanzado ? 'estado-step completado' : 'estado-step futuro';
    if (idx < alcanzado) return 'estado-step completado';
    if (idx === alcanzado) return 'estado-step actual';
    return 'estado-step futuro';
  };

  const renderNodo = (estado, idx) => {
    const Icono = ICONO_ESTADO[estado];
    const clase = claseDe(idx);
    const clickeable = !esCancelado && principal === estado;
    const titulo = `${ETIQUETAS_ESTADO_PEDIDO[estado] || estado}${
      fechaDe(estado) ? ` - ${fechaDe(estado)}` : ''
    }`;

    const contenido = (
      <>
        <Icono className="estado-step-icono" aria-hidden="true" />
        <span className="estado-step-etiqueta">{ETIQUETAS_ESTADO_PEDIDO[estado] || estado}</span>
      </>
    );

    if (clickeable && onCambiar) {
      return (
        <button
          key={estado}
          type="button"
          className={`${clase} clickeable`}
          title={`${titulo} - clic para avanzar`}
          onClick={() => onCambiar(estado)}
        >
          {contenido}
        </button>
      );
    }
    return (
      <div key={estado} className={clase} title={titulo}>
        {contenido}
      </div>
    );
  };

  return (
    <div className="historial-stepper">
      {FLUJO_ESTADOS.map((estado, idx) => (
        <Fragment key={estado}>
          {renderNodo(estado, idx)}
          {idx < FLUJO_ESTADOS.length - 1 && (
            <span
              className={`historial-conector ${idx < alcanzado ? 'activo' : ''}`}
              aria-hidden="true"
            />
          )}
        </Fragment>
      ))}

      {/* Nodo especial de cancelado (al final del flujo) */}
      {mostrarCancelado && (
        <Fragment key="cancelado-node">
          <span
            className={`historial-conector ${esCancelado ? 'riesgo' : ''}`}
            aria-hidden="true"
          />
          {esCancelado || !puedeCancelar ? (
            <div
              className="estado-step cancelado"
              title={`Cancelado${fechaDe(ESTADOS_PEDIDO.CANCELADO) ? ` - ${fechaDe(ESTADOS_PEDIDO.CANCELADO)}` : ''}`}
            >
              <FaTimesCircle className="estado-step-icono" aria-hidden="true" />
              <span className="estado-step-etiqueta">Cancelado</span>
            </div>
          ) : (
            <button
              type="button"
              className="estado-step cancelado clickeable"
              title="Cancelar pedido - clic para cancelar"
              onClick={() => onCambiar && onCambiar(ESTADOS_PEDIDO.CANCELADO)}
            >
              <FaTimesCircle className="estado-step-icono" aria-hidden="true" />
              <span className="estado-step-etiqueta">Cancelar</span>
            </button>
          )}
        </Fragment>
      )}
    </div>
  );
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
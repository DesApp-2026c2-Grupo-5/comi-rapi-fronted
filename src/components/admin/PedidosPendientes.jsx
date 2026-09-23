/**
 * Propósito: Lista de pedidos con gestión de estados para el administrador.
 * Contenido: Componente PedidosPendientes con cards de pedidos, un stepper visual de
 *            estados con iconos de react-icons (los futuros quedan oscurecidos y se
 *            encienden al avanzar) y acciones de un clic para cambiar el estado
 *            (validadas por la lógica de transiciones).
 * Dependencias: react-bootstrap (Card, Badge, Button, Container),
 *               react-icons/fa, hooks/usePedidos, services/estadosPedido.js,
 *               utils/constants.js, DetalleItemsPedido, PedidosPendientes.css.
 * Uso: <PedidosPendientes /> - Se renderiza en GestionPedidos.
 *
 * NOTA: El cambio de estado se persiste en la API real (PATCH /pedidos/:id/estado).
 */

import { useEffect, useState } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { Card, Badge, Button, Container } from 'react-bootstrap';
import { FaTimesCircle, FaArrowRight, FaTimes } from 'react-icons/fa';
import { usePedidos } from '../../hooks/usePedidos';
import { useNotificaciones } from '../../hooks/useNotificaciones';
import { puedeTransicionar, obtenerEstadosSiguientes } from '../../services/estadosPedido';
import {
  ESTADOS_PEDIDO,
  ETIQUETAS_ESTADO_PEDIDO,
  VARIANTE_ESTADO_PEDIDO,
  ESTADOS_VISIBLES_CLIENTE,
} from '../../utils/constants';
import { formatPrice } from '../../utils/formatters';
import HistorialStepper from '../comunes/HistorialStepper';
import DetalleItemsPedido from '../comunes/DetalleItemsPedido';
import './PedidosPendientes.css';

const FLUJO_ESTADOS = ESTADOS_VISIBLES_CLIENTE.filter((e) => e !== ESTADOS_PEDIDO.CANCELADO);
// El admin solo maneja pedidos CONFIRMADO y posteriores: PENDIENTE queda filtrado
// en el contexto y no se muestra ni en la lista ni en el stepper.

// Estados que puede filtrar el admin (el orden define el orden de los pills)
const ESTADOS_FILTRO = [
  ESTADOS_PEDIDO.CONFIRMADO,
  ESTADOS_PEDIDO.EN_PREPARACION,
  ESTADOS_PEDIDO.LISTO_PARA_ENTREGAR,
  ESTADOS_PEDIDO.EN_CAMINO,
  ESTADOS_PEDIDO.ENTREGADO,
  ESTADOS_PEDIDO.CANCELADO,
];

// Acción amigable para el botón de avance según el próximo estado.
const ACCIONES_SIGUIENTE = {
  [ESTADOS_PEDIDO.EN_PREPARACION]: 'Iniciar Preparación',
  [ESTADOS_PEDIDO.LISTO_PARA_ENTREGAR]: 'Marcar listo para entregar',
  [ESTADOS_PEDIDO.EN_CAMINO]: 'Enviar al repartidor',
  [ESTADOS_PEDIDO.ENTREGADO]: 'Confirmar entrega',
};

const PedidosPendientes = () => {
  const { pedidos, cambiarEstado } = usePedidos();
  const { notificar } = useNotificaciones();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  // Filtro de estado activo (desde la URL ?estado=..., que el dashboard setea al
  // hacer clic en una tarjeta de "Pedidos por estado")
  const estadoFiltro = searchParams.get('estado');
  // Evita doble clic mientras un cambio de estado está en curso
  const [cambiando, setCambiando] = useState(false);

  const pedidosFiltrados = estadoFiltro
    ? pedidos.filter((p) => p.estado === estadoFiltro)
    : pedidos;

  const contar = (estado) => pedidos.filter((p) => p.estado === estado).length;

  const aplicarFiltro = (estado) => {
    setSearchParams(estado ? { estado } : {}, { replace: true });
  };

  // Si llegamos a /admin/pedidos desde un banner de pedido cancelado
  // (location.state.pedidoFoco), hace scroll a esa card y la resalta.
  useEffect(() => {
    const foco = location.state?.pedidoFoco;
    if (!foco) return undefined;
    const el = document.getElementById(`pedido-card-${foco}`);
    if (!el) return undefined;
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    el.classList.add('pedido-card-foco');
    const timer = setTimeout(() => el.classList.remove('pedido-card-foco'), 2600);
    return () => {
      clearTimeout(timer);
      el.classList.remove('pedido-card-foco');
    };
  }, [location]);

  // Cambia el estado validando la transición con la lógica del servicio y
  // persistiéndola en la API real (PATCH /pedidos/:id/estado)
  const handleCambiarEstado = async (pedido, estadoDestino) => {
    if (cambiando) return;
    if (!puedeTransicionar(pedido.estado, estadoDestino)) {
      notificar(
        `No se puede pasar de "${ETIQUETAS_ESTADO_PEDIDO[pedido.estado] || pedido.estado}" a "${ETIQUETAS_ESTADO_PEDIDO[estadoDestino] || estadoDestino}"`,
        'warning'
      );
      return;
    }
    setCambiando(true);
    try {
      const actualizado = await cambiarEstado(pedido.id, estadoDestino);
      if (actualizado) {
        notificar(`Pedido #${pedido.id} cambió a: ${ETIQUETAS_ESTADO_PEDIDO[estadoDestino]}`, 'success');
      }
      // Si falla, el contexto ya muestra el error del backend
    } finally {
      setCambiando(false);
    }
  };

  return (
    <Container>
      <h2 className="mb-4">Gestión de Pedidos</h2>

      {/* Filtro rápido por estado */}
      <div className="filtro-estado-bar d-flex flex-wrap gap-2 mb-4">
        <Button
          variant="outline-secondary"
          className={`filtro-estado-pill${!estadoFiltro ? ' filtro-estado-activo' : ''}`}
          onClick={() => aplicarFiltro(null)}
        >
          Todos
          <Badge bg="secondary" text="light" className="ms-2">{pedidos.length}</Badge>
        </Button>
        {ESTADOS_FILTRO.map((estado) => (
          <Button
            key={estado}
            variant="outline-secondary"
            className={`filtro-estado-pill${estadoFiltro === estado ? ' filtro-estado-activo' : ''}`}
            onClick={() => aplicarFiltro(estado)}
          >
            {ETIQUETAS_ESTADO_PEDIDO[estado] || estado}
            <Badge
              bg={VARIANTE_ESTADO_PEDIDO[estado] || 'secondary'}
              text={estadoFiltro === estado ? 'dark' : undefined}
              className="ms-2"
            >
              {contar(estado)}
            </Badge>
          </Button>
        ))}
      </div>

      {pedidos.length === 0 ? (
        <p className="text-muted text-center py-4">No hay pedidos todavía.</p>
      ) : pedidosFiltrados.length === 0 ? (
        <div className="text-center py-4">
          <p className="text-muted">
            No hay pedidos en el estado "{ETIQUETAS_ESTADO_PEDIDO[estadoFiltro] || estadoFiltro}".
          </p>
          <Button variant="outline-secondary" size="sm" onClick={() => aplicarFiltro(null)}>
            <FaTimes className="me-1" aria-hidden="true" />
            Quitar filtro
          </Button>
        </div>
      ) : (
        pedidosFiltrados.map((pedido) => {
        const estadosSiguientes = obtenerEstadosSiguientes(pedido.estado);
        const esCancelado = pedido.estado === ESTADOS_PEDIDO.CANCELADO;
        const principal = estadosSiguientes.find((e) => FLUJO_ESTADOS.includes(e)) || null;
        const puedeCancelar = estadosSiguientes.includes(ESTADOS_PEDIDO.CANCELADO);

        return (
          <Card key={pedido.id} id={`pedido-card-${pedido.id}`} className="mb-3 shadow-sm">
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
              <DetalleItemsPedido items={pedido.productos} className="mb-2" />
              <p className="fw-bold text-danger mb-2">Total: {formatPrice(pedido.total)}</p>

              {/* Stepper visual + acciones de un clic */}
<div className="historial-box">
                  <span className="historial-titulo">Progreso del pedido</span>
                  <HistorialStepper
                    pedido={pedido}
                    sinNodoPendiente
                    onCambiar={(estadoDestino) => handleCambiarEstado(pedido, estadoDestino)}
                  />

                  {/* Los pedidos en PENDIENTE ya no llegan al admin: acá solo hay
                      CONFIRMADO y posteriores, que siempre tienen acciones. */}
                  {pedido.estado !== ESTADOS_PEDIDO.PENDIENTE && (
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
                  )}
                </div>
            </Card.Body>
          </Card>
        );
        })
      )}
    </Container>
  );
};

export default PedidosPendientes;
/**
 * Propósito: Pantalla intermedia de pago que aparece al confirmar el carrito.
 * Contenido: Página con las opciones de pago (Mercado Pago o Tarjeta) para el pedido
 *            que quedó en estado PENDIENTE. Al elegir un método, el pago se aprueba
 *            automáticamente y el pedido pasa a CONFIRMADO.
 * Dependencias: react-bootstrap (Container, Card, Button, Badge, Row, Col), react-router-dom,
 *               hooks/usePedidos, hooks/useCarrito, services/simuladorPago.js,
 *               utils/constants.js, utils/formatters.js, ResumenPedido, Pago.css.
 * Uso: Ruta "/cliente/pago" → <Pago />
 */

import { useEffect, useRef, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Container, Card, Button, Badge, Row, Col, Alert } from 'react-bootstrap';
import PropTypes from 'prop-types';
import { FaArrowLeft, FaDollarSign, FaCreditCard, FaCheckCircle, FaTimesCircle, FaClock } from 'react-icons/fa';
import { usePedidos } from '../../hooks/usePedidos';
import { useCarrito } from '../../hooks/useCarrito';
import { useNotificaciones } from '../../hooks/useNotificaciones';
import { simuladorPago } from '../../services/simuladorPago';
import { ESTADOS_PEDIDO, ETIQUETAS_ESTADO_PEDIDO } from '../../utils/constants';
import { formatDate, formatPrice } from '../../utils/formatters';
import { formatearDireccion } from '../../utils/direccion';
import IconoEstado from '../../components/comunes/IconoEstado';
import ResumenPedido from '../../components/cliente/ResumenPedido';
import ContadorCierre from '../../components/comunes/ContadorCierre';
import ConfirmarModal from '../../components/comunes/ConfirmarModal';
import { obtenerDisponibilidadPedido } from '../../api/pedidos';
import { conectarSocket, EVENTOS_SOCKET } from '../../services/socket';
import { dentroDelAvisoDeCierre } from '../../utils/horarios';
import './Pago.css';

// El frontend usa claves en minúscula para las opciones; el backend persiste
// el ENUM 'MERCADO_PAGO' | 'TARJETA' (docs/reglas-negocio.md, sección 8).
const MAPA_MEDIO_PAGO = {
  mercado_pago: 'MERCADO_PAGO',
  tarjeta: 'TARJETA',
};

const Pago = () => {
  const { pedidoActual, pedidos, confirmarPedido, cambiarEstado, refrescarPedidos } = usePedidos();
  const { vaciarCarrito } = useCarrito();
  const { notificar } = useNotificaciones();
  const navigate = useNavigate();
  const [paginando, setPaginando] = useState(false);
  const [metodoElegido, setMetodoElegido] = useState(null);
  const [mostrarConfirmarCancelar, setMostrarConfirmarCancelar] = useState(false);
  const [disponibilidadPedido, setDisponibilidadPedido] = useState(null);
  const [refrescoDisponibilidad, setRefrescoDisponibilidad] = useState(0);
  // La cuenta de la reserva de stock llegó a cero (calculada en el cliente) o el
  // backend ya la informó vencida. Bloquea el pago hasta que el vigía cancele el
  // pedido y la pantalla vuelva al carrito.
  const [reservaAgotada, setReservaAgotada] = useState(false);

  // Pedido a pagar. Normalmente es el que acaba de crear el carrito, pero si el
  // cliente recarga o navega y vuelve, `pedidoActual` (que vive sólo en
  // memoria) se pierde: en ese caso se recupera el pendiente desde la API. Hace
  // falta porque los pedidos sin pagar no aparecen en "Mis Pedidos".
  const pedido =
    pedidoActual?.estado === ESTADOS_PEDIDO.PENDIENTE
      ? pedidoActual
      : (pedidos || []).find((p) => p.estado === ESTADOS_PEDIDO.PENDIENTE) ||
        null;
  const pedidoId = pedido?.id ?? null;

  /* DISPONIBILIDAD AL PAGAR: la sucursal asignada pudo cerrar entre el carrito
     y el pago. El backend revalida al confirmar y, si hace falta, reasigna el
     pedido a otra sucursal abierta con stock. Acá se muestra esa decisión antes
     de pagar: si hay alternativa se avisa la reasignación; si no hay, el pago
     se bloquea y el pedido se cancela (el backend repone el stock) para volver
     al carrito con los productos. */
  useEffect(() => {
    if (!pedidoId) {
      setDisponibilidadPedido(null);
      return undefined;
    }
    let vivo = true;
    const consultar = async () => {
      const res = await obtenerDisponibilidadPedido(pedidoId);
      if (!vivo) return;
      // Si la consulta falla, no se bloquea el pago: el backend revalida igual.
      setDisponibilidadPedido(res.success ? res.data : null);
    };
    consultar();
    return () => {
      vivo = false;
    };
  }, [pedidoId, refrescoDisponibilidad]);

  const sucursalCerradaSinAlternativa =
    Boolean(disponibilidadPedido) &&
    !disponibilidadPedido.abierta &&
    !disponibilidadPedido.hayAlternativa;
  const contadorSinAlternativa =
    Boolean(disponibilidadPedido) &&
    disponibilidadPedido.abierta &&
    !disponibilidadPedido.hayAlternativa &&
    dentroDelAvisoDeCierre(disponibilidadPedido.segundosRestantes);

  /* RESERVA DE STOCK: el pedido nace PENDIENTE y ya descontó el stock. El
     backend da un plazo (`minutosReservaStock`, 15 por defecto) para pagar; al
     vencer, cancela el pedido y las unidades vuelven al stock. La pantalla no
     muestra la cuenta: solo bloquea el pago y espera la cancelación para volver
     al carrito. */
  const reservaVencida =
    Boolean(disponibilidadPedido?.reservaVencida) || reservaAgotada;

  useEffect(() => {
    if (!disponibilidadPedido) return;
    // Una respuesta nueva manda: si todavía trae segundos, la reserva sigue viva.
    setReservaAgotada(Boolean(disponibilidadPedido.reservaVencida));
  }, [disponibilidadPedido]);

  // Temporizador silencioso: al agotarse el plazo se activa el sondeo aunque la
  // cuenta no se muestre. El backend confirma la cancelación en los próximos
  // segundos y la pantalla vuelve al carrito.
  useEffect(() => {
    const segundos = disponibilidadPedido?.segundosReserva;
    if (!segundos || segundos <= 0) return undefined;
    const temporizador = setTimeout(
      () => setReservaAgotada(true),
      segundos * 1000
    );
    return () => clearTimeout(temporizador);
  }, [disponibilidadPedido]);

  // Agotado el plazo, el pago queda bloqueado y el vigía del backend cancela el
  // pedido en los próximos segundos. El socket avisa; este sondeo es el respaldo
  // para que la vuelta al carrito no dependa de una conexión abierta.
  useEffect(() => {
    if (!reservaAgotada || !pedidoId) return undefined;
    const intervalo = setInterval(() => {
      refrescarPedidos();
    }, 3000);
    return () => clearInterval(intervalo);
  }, [reservaAgotada, pedidoId, refrescarPedidos]);

  /* VUELTA AL CARRITO: si el pedido que se estaba pagando deja de estar
     PENDIENTE sin que el cliente haya pagado ni cancelado, lo canceló el
     backend (venció la reserva de stock). Se muestra un único aviso simple y se
     vuelve al carrito con los mismos productos, sin más mensajes. */
  const pedidoEnPagoRef = useRef(null);
  const saliendoRef = useRef(false);
  useEffect(() => {
    if (pedido?.estado === ESTADOS_PEDIDO.PENDIENTE) {
      pedidoEnPagoRef.current = pedido.id;
      return;
    }
    // Sin pedido visto antes no hay nada que devolver (carga inicial, recarga).
    if (!pedidoEnPagoRef.current || saliendoRef.current) return;
    pedidoEnPagoRef.current = null;
    notificar('Tiempo de pago excedido.', 'warning', 5000);
    navigate('/cliente/carrito');
  }, [pedido, notificar, navigate]);

  // El vigía de horarios del backend emite `sucursal_estado` cuando una
  // sucursal abre o cierra. El evento no trae datos: se re-consulta la
  // disponibilidad de este pedido, que es la fuente de verdad.
  const cambioHorarioRef = useRef(false);
  useEffect(() => {
    const instancia = conectarSocket();
    const alCambiarSucursal = () => {
      cambioHorarioRef.current = true;
      setRefrescoDisponibilidad((n) => n + 1);
    };
    instancia.on(EVENTOS_SOCKET.SUCURSAL_ESTADO, alCambiarSucursal);
    return () => {
      instancia.off(EVENTOS_SOCKET.SUCURSAL_ESTADO, alCambiarSucursal);
    };
  }, []);

  // Si el cambio vino por WebSocket y la re-consulta confirma que la sucursal
  // cerró SIN alternativa, el pedido se cancela solo: el backend repone el
  // stock y el cliente vuelve al carrito con los mismos productos.
  const cancelandoPorCierreRef = useRef(false);
  useEffect(() => {
    if (!cambioHorarioRef.current || !pedidoId || !disponibilidadPedido) return;
    // Un evento = una reacción. Si se recomienda reprogramar, vuelve a marcar.
    cambioHorarioRef.current = false;
    if (disponibilidadPedido.abierta || disponibilidadPedido.hayAlternativa) return;
    if (paginando || cancelandoPorCierreRef.current) return;
    cancelandoPorCierreRef.current = true;
    // La pantalla ya se está yendo al carrito: la vuelta automática por reserva
    // vencida no debe dispararse por esta cancelación (la hizo el propio cliente).
    saliendoRef.current = true;
    (async () => {
      const cancelado = await cambiarEstado(pedidoId, ESTADOS_PEDIDO.CANCELADO);
      cancelandoPorCierreRef.current = false;
      if (!cancelado) {
        saliendoRef.current = false;
        return;
      }
      notificar(
        'La sucursal cerró.',
        'warning',
        7000
      );
      navigate('/cliente/carrito');
    })();
  }, [
    pedidoId,
    disponibilidadPedido,
    paginando,
    cambiarEstado,
    notificar,
    navigate,
  ]);

  // El pedido debe existir y seguir PENDIENTE para poder pagarlo
  if (!pedido || pedido.estado !== ESTADOS_PEDIDO.PENDIENTE) {
    return (
      <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
        <Card className="text-center shadow" style={{ width: '100%', maxWidth: '450px' }}>
          <Card.Body className="p-5">
            <h1 className="h4 mb-3">No hay un pago pendiente</h1>
            <p className="text-muted mb-4">
              Confirmá primero los productos de tu carrito para generar tu pedido.
            </p>
            <Button as={Link} to="/cliente/carrito" variant="primary" className="rounded-pill px-4">
                <FaArrowLeft aria-hidden="true" />
                Ir al carrito
              </Button>
          </Card.Body>
        </Card>
      </Container>
    );
  }

  const estadoLabel = ETIQUETAS_ESTADO_PEDIDO[pedido.estado] || pedido.estado;
  const { sucursal } = pedido;

  /* Sucursal que va a preparar el pedido. Si la asignada cerró y hay otra
     abierta con stock, el backend reasigna al pagar: se muestra directamente la
     alternativa para que el cambio se vea sin recargar (la disponibilidad se
     vuelve a consultar ante el evento `sucursal_estado`). */
  const sucursalQuePrepara =
    disponibilidadPedido &&
    !disponibilidadPedido.abierta &&
    disponibilidadPedido.hayAlternativa
      ? disponibilidadPedido.alternativas[0] || sucursal
      : sucursal;
  const direccionSucursal = formatearDireccion(sucursalQuePrepara?.direccion);

  // El total del backend ya incluye el envío
  const montoTotal = pedido.total;

  // Aprueba el pago automáticamente y pasa el pedido de PENDIENTE a CONFIRMADO
  const handlePagar = async (metodo) => {
    if (paginando) return;
    if (reservaVencida) return;
    if (sucursalCerradaSinAlternativa) {
      notificar('La sucursal cerró.', 'warning');
      return;
    }

    setPaginando(true);
    setMetodoElegido(metodo);

    // Simular el procesamiento del pago
    await simuladorPago({ total: montoTotal, metodo });

    // Desde acá el resultado lo maneja esta pantalla (éxito, vuelta al carrito o
    // reintento): la vuelta automática por reserva vencida no debe pisarlo.
    saliendoRef.current = true;
    const medioPago = MAPA_MEDIO_PAGO[metodo];
    const confirmado = await confirmarPedido(pedido.id, medioPago);
    if (confirmado?.cancelado) {
      // El backend canceló el pedido (y repuso el stock): venció la reserva de
      // stock o la sucursal cerró y no había otra abierta con stock. Se vuelve
      // al carrito con los mismos productos.
      setPaginando(false);
      notificar(
        confirmado.motivo === 'reserva_vencida'
          ? 'Tiempo de pago excedido.'
          : confirmado.motivo === 'sucursal_cerrada'
            ? 'La sucursal cerró.'
            : 'No se pudo completar el pago.',
        'warning',
        7000
      );
      navigate('/cliente/carrito');
      return;
    }
    if (!confirmado) {
      // El contexto ya muestra el error del backend; el pedido sigue PENDIENTE.
      // Se revalida la disponibilidad por si el rechazo fue por horario.
      saliendoRef.current = false;
      setPaginando(false);
      setRefrescoDisponibilidad((n) => n + 1);
      return;
    }
    vaciarCarrito();
    navigate('/cliente/confirmacion');
  };

  // Cancela el pedido pendiente: pide confirmación con el modal y persiste en la API.
  const handleImprimirConfirmar = () => setMostrarConfirmarCancelar(true);

  const handleCancelarPedido = async () => {
    if (paginando) return;
    setPaginando(true);
    // Cancelación pedida por el cliente: la vuelta automática no debe avisar
    // que "venció el tiempo".
    saliendoRef.current = true;
    try {
      const cancelado = await cambiarEstado(pedido.id, ESTADOS_PEDIDO.CANCELADO);
      if (!cancelado) {
        // El contexto ya muestra el error del backend
        saliendoRef.current = false;
        setPaginando(false);
        return;
      }
      setMostrarConfirmarCancelar(false);
      notificar(`Pedido #${pedido.id} cancelado`, 'success');
      // Se vuelve al carrito y no a "Mis Pedidos": el pedido cancelado era un
      // PENDIENTE sin pagar, y esos no se listan en "Mis Pedidos", así que esa
      // pantalla quedaría vacía. El carrito es adonde realmente puede rehacer
      // el pedido. El stock ya fue repuesto por el backend al cancelar.
      navigate('/cliente/carrito');
    } catch {
      saliendoRef.current = false;
      setPaginando(false);
    }
  };

  const opcionesPago = [
    {
      metodo: 'mercado_pago',
      titulo: 'Mercado Pago',
      descripcion: 'Pago rápido con tu cuenta de Mercado Pago',
      icono: <FaDollarSign aria-hidden="true" />,
      clase: 'pago-opcion-mp',
    },
    {
      metodo: 'tarjeta',
      titulo: 'Tarjeta',
      descripcion: 'Débito o crédito, pago seguro',
      icono: <FaCreditCard aria-hidden="true" />,
      clase: 'pago-opcion-tarjeta',
    },
  ];

  return (
    <Container className="py-5">
      <Row className="justify-content-center">
        <Col lg={7}>
          {/* Encabezado con el pedido en estado PENDIENTE */}
          <Card className="text-center shadow mb-4">
            <Card.Body className="p-5">
              <div className="bg-warning text-white rounded-circle d-inline-flex align-items-center justify-content-center mb-4 pago-icono-estado">
                <IconoEstado estado={pedido.estado} size={30} />
              </div>
              <h1 className="h3 mb-2">Confirmá tu pago</h1>
              <p className="text-muted mb-0">
                <strong>Número de pedido:</strong> #{pedido.id}
              </p>
              <p className="text-muted mb-0">
                <strong>Fecha:</strong> {formatDate(pedido.fecha)}
              </p>
              <div className="mb-0">
                <strong>Estado:</strong>{' '}
                <Badge bg="warning">{estadoLabel}</Badge>
              </div>
              <p className="mt-3 mb-0 text-muted">
                Tu pedido se confirmará apenas elijas un método de pago.
              </p>
            </Card.Body>
          </Card>

          {/* Único aviso de cierre: cuando NO hay otra sucursal a la que
              reasignar. Si hay alternativa, el panel de "Tu pedido será
              preparado en" se actualiza solo con la sucursal nueva. */}
          {sucursalCerradaSinAlternativa && (
            <Alert variant="danger" className="mb-4" role="status">
              <strong>La sucursal cerró.</strong>
            </Alert>
          )}

          {contadorSinAlternativa && (
            <Alert variant="info" className="mb-4 text-center" role="status">
              <FaClock aria-hidden="true" className="me-2" />
              <strong>{disponibilidadPedido.sucursal?.nombre}</strong> toma
              pedidos hasta las {disponibilidadPedido.cierrePedidos}.
              <br />
              Te quedan{' '}
              <ContadorCierre
                segundos={disponibilidadPedido.segundosRestantes}
                onVencido={() => setRefrescoDisponibilidad((n) => n + 1)}
                className="fw-bold"
              />
              .
            </Alert>
          )}

          {/* La reserva de stock no muestra cuenta ni avisos: si vence, el
              backend cancela el pedido y la pantalla vuelve al carrito con un
              único mensaje simple ("Tiempo de pago excedido."). */}

          {/* Opciones de pago */}
          <h2 className="h5 mb-3">Elegí cómo pagar</h2>
          {paginando ? (
            <AlertPaginando metodo={opcionesPago.find((o) => o.metodo === metodoElegido)?.titulo} monto={montoTotal} />
          ) : (
            <Row className="g-3 mb-4">
              {opcionesPago.map((opcion) => (
                <Col sm={6} key={opcion.metodo}>
                  <Button
                    className={`pago-opcion w-100 ${opcion.clase}`}
                    onClick={() => handlePagar(opcion.metodo)}
                    disabled={sucursalCerradaSinAlternativa || reservaVencida}
                  >
                    <span className="pago-opcion-ico">{opcion.icono}</span>
                    <span className="d-block">{opcion.titulo}</span>
                    <span className="pago-opcion-desc">{opcion.descripcion}</span>
                  </Button>
                </Col>
              ))}
            </Row>
          )}

          {/* Sucursal que prepara el pedido. Cambia sola si la asignada cerró
              y hay otra abierta con stock (el backend la reasigna al pagar). */}
          {sucursalQuePrepara && (
            <div className="p-3 mb-3 panel-crema">
              <span className="panel-crema-etiqueta">
                Tu pedido será preparado en
              </span>
              <strong className="d-block fs-5">{sucursalQuePrepara.nombre}</strong>
              {direccionSucursal && (
                <span className="text-muted">{direccionSucursal}</span>
              )}
            </div>
          )}

          {/* Resumen del pedido */}
          <ResumenPedido
            items={pedido.productos}
            total={pedido.total}
            costoEnvio={pedido.costoEnvio ?? 0}
            sucursal={sucursalQuePrepara}
            promociones={pedido.promociones}
          />

          {/* Un solo botón. Antes coexistían "Volver al carrito" (navegación pura,
              que dejaba el pedido PENDIENTE reservando el stock) y "Cancelar
              pedido" (que lo cancelaba y repone el stock): los dos llevaban al
              mismo lado y el cliente no tenía forma de saber que no eran lo
              mismo. Ahora el botón dice lo que hace y el stock vuelve siempre. */}
          <div className="text-center mt-4 d-flex justify-content-center gap-2 flex-wrap">
            <Button
              variant="outline-danger"
              className="rounded-pill px-4"
              onClick={handleImprimirConfirmar}
              disabled={paginando}
            >
              <FaTimesCircle aria-hidden="true" />
              Cancelar y volver al carrito
            </Button>
          </div>

          <ConfirmarModal
            mostrar={mostrarConfirmarCancelar}
            titulo="Cancelar pedido"
            mensaje="Se cancela el pedido y las unidades vuelven al stock. Vas a volver al carrito con los mismos productos, por si querés rehacerlo."
            textoConfirmar="Sí, cancelar"
            textoCancelar="Quedarme con el pedido"
            cargando={paginando}
            onConfirmar={handleCancelarPedido}
            onCancelar={() => setMostrarConfirmarCancelar(false)}
          />
        </Col>
      </Row>
    </Container>
  );
};

// Aviso mientras se procesa el pago. `role="status"` + `aria-live` para que el
// cambio de estado del pago se anuncie sin tener que vigilar la pantalla.
const AlertPaginando = ({ metodo, monto }) => (
  <Card className="text-center shadow-sm mb-4 pago-procesando" role="status" aria-live="polite">
    <Card.Body className="p-4">
      <FaCheckCircle size={36} className="text-success mb-2" aria-hidden="true" />
      <h3 className="h5 mb-1">Procesando pago…</h3>
      <p className="text-muted mb-0">
        {metodo ? `${metodo} · ` : ''}
        {formatPrice(monto)}
      </p>
    </Card.Body>
  </Card>
);

AlertPaginando.propTypes = {
  metodo: PropTypes.string,
  monto: PropTypes.number,
};

export default Pago;
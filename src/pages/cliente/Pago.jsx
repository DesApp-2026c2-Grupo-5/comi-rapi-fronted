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

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Container, Card, Button, Badge, Row, Col } from 'react-bootstrap';
import { FaArrowLeft, FaDollarSign, FaCreditCard, FaCheckCircle } from 'react-icons/fa';
import { usePedidos } from '../../hooks/usePedidos';
import { useCarrito } from '../../hooks/useCarrito';
import { simuladorPago } from '../../services/simuladorPago';
import { calcularTotalConEnvio } from '../../services/envio';
import { ESTADOS_PEDIDO, ETIQUETAS_ESTADO_PEDIDO } from '../../utils/constants';
import { formatDate, formatPrice } from '../../utils/formatters';
import IconoEstado from '../../components/comunes/IconoEstado';
import ResumenPedido from '../../components/cliente/ResumenPedido';
import './Pago.css';

const Pago = () => {
  const { pedidoActual, confirmarPedido } = usePedidos();
  const { vaciarCarrito } = useCarrito();
  const navigate = useNavigate();
  const [paginando, setPaginando] = useState(false);
  const [metodoElegido, setMetodoElegido] = useState(null);

  // El pedido debe existir y seguir PENDIENTE para poder pagarlo
  if (!pedidoActual || pedidoActual.estado !== ESTADOS_PEDIDO.PENDIENTE) {
    return (
      <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
        <Card className="text-center shadow" style={{ width: '100%', maxWidth: '450px' }}>
          <Card.Body className="p-5">
            <h1 className="h4 mb-3">No hay un pago pendiente</h1>
            <p className="text-muted mb-4">
              Confirmá primero los productos de tu carrito para generar tu pedido.
            </p>
            <Link to="/cliente/carrito">
              <Button variant="primary" className="rounded-pill px-4">
                <FaArrowLeft aria-hidden="true" />
                Ir al carrito
              </Button>
            </Link>
          </Card.Body>
        </Card>
      </Container>
    );
  }

  const estadoLabel = ETIQUETAS_ESTADO_PEDIDO[pedidoActual.estado] || pedidoActual.estado;
  const { sucursal } = pedidoActual;
  const montoTotal = calcularTotalConEnvio(pedidoActual.total);

  // Aprueba el pago automáticamente y pasa el pedido de PENDIENTE a CONFIRMADO
  const handlePagar = async (metodo) => {
    if (paginando) return;

    setPaginando(true);
    setMetodoElegido(metodo);

    // Simular el procesamiento del pago
    await simuladorPago({ total: montoTotal, metodo });

    await confirmarPedido(pedidoActual.id);
    vaciarCarrito();
    navigate('/cliente/confirmacion');
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
                <IconoEstado estado={pedidoActual.estado} size={30} />
              </div>
              <h1 className="h3 mb-2">Confirmá tu pago</h1>
              <p className="text-muted mb-0">
                <strong>Número de pedido:</strong> #{pedidoActual.id}
              </p>
              <p className="text-muted mb-0">
                <strong>Fecha:</strong> {formatDate(pedidoActual.fecha)}
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
                  >
                    <span className="pago-opcion-ico">{opcion.icono}</span>
                    <span className="d-block">{opcion.titulo}</span>
                    <span className="pago-opcion-desc">{opcion.descripcion}</span>
                  </Button>
                </Col>
              ))}
            </Row>
          )}

          {/* Sucursal asignada */}
          {sucursal && (
            <div className="p-3 mb-3" style={{ backgroundColor: '#fff8ef', border: '2px solid #ffe9c9', borderRadius: '12px' }}>
              <span className="d-block text-uppercase fw-bold text-warning" style={{ fontSize: '0.72rem', letterSpacing: '1px' }}>
                Tu pedido será preparado en
              </span>
              <strong className="d-block fs-5">{sucursal.nombre}</strong>
              <span className="text-muted">{sucursal.direccion}</span>
            </div>
          )}

          {/* Resumen del pedido */}
          <ResumenPedido
            items={pedidoActual.productos}
            total={pedidoActual.total}
            sucursal={sucursal}
          />

          <div className="text-center mt-4">
            <Link to="/cliente/carrito">
              <Button variant="outline-secondary" className="rounded-pill px-4">
                <FaArrowLeft aria-hidden="true" />
                Volver al carrito
              </Button>
            </Link>
          </div>
        </Col>
      </Row>
    </Container>
  );
};

// Aviso mientras se procesa el pago
const AlertPaginando = ({ metodo, monto }) => (
  <Card className="text-center shadow-sm mb-4 pago-procesando">
    <Card.Body className="p-4">
      <FaCheckCircle size={36} className="text-success mb-2" aria-hidden="true" />
      <h3 className="h5 mb-1">Procesando pago...</h3>
      <p className="text-muted mb-0">
        {metodo ? `${metodo} · ` : ''}
        {formatPrice(monto)}
      </p>
    </Card.Body>
  </Card>
);

export default Pago;
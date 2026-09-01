/**
 * Propósito: Página del carrito de compras con lista de ítems y resumen del pedido.
 * Contenido: Componente Carrito con ItemCarrito, ResumenPedido, estado vacío y flujo de
 *            confirmación que asigna la sucursal óptima automáticamente.
 * Dependencias: react-bootstrap (Container, Row, Col, Button, Card), react-router-dom,
 *               useCarrito hook, useSucursal hook, usePedidos hook, useAuth hook,
 *               services/asignacionSucursal.js, ItemCarrito, ResumenPedido, Carrito.css.
 * Uso: Ruta "/cliente/carrito" → <Carrito />
 *
 * FLUJO DE CONFIRMACIÓN (transparente para el cliente, como en PedidosYa):
 *   1. Se obtienen las sucursales activas (SucursalContext).
 *   2. Se obtienen los pedidos pendientes (PedidoContext).
 *   3. Se ejecuta asignarSucursalOptima() → sucursal con MENOS pedidos pendientes.
 *   4. Se crea el pedido con estado PENDIENTE y la sucursal asignada.
 *   5. Se simula el pago → estado pasa a CONFIRMADO automáticamente.
 *   6. Se redirige a la página de confirmación.
 */

import { useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Container, Row, Col, Button, Card, Alert } from 'react-bootstrap';
import { FaUtensils, FaTrashAlt } from 'react-icons/fa';
import { useCarrito } from '../../hooks/useCarrito';
import { useSucursal } from '../../hooks/useSucursal';
import { usePedidos } from '../../hooks/usePedidos';
import { useAuth } from '../../hooks/useAuth';
import { useDirecciones } from '../../hooks/useDirecciones';
import { asignarSucursalOptima } from '../../services/asignacionSucursal';
import ItemCarrito from '../../components/cliente/ItemCarrito';
import ResumenPedido from '../../components/cliente/ResumenPedido';
import './Carrito.css';

const Carrito = () => {
  const { items, total, vaciarCarrito } = useCarrito();
  const { sucursales } = useSucursal();
  const { crearPedido, confirmarPedido, obtenerPedidosPendientes } = usePedidos();
  const { user } = useAuth();
  const { obtenerDireccionPrincipal } = useDirecciones();
  const navigate = useNavigate();

  // Dirección principal del cliente (se usa automáticamente al confirmar)
  const direccionPrincipal = useMemo(
    () => obtenerDireccionPrincipal(user?.email),
    [obtenerDireccionPrincipal, user?.email]
  );

  const handleConfirmarPedido = () => {
    // Sin dirección principal: el cliente no puede confirmar
    const direccion = obtenerDireccionPrincipal(user?.email);
    if (!direccion) {
      alert('Agregá una dirección antes de confirmar');
      return;
    }

    // 1. Sucursales activas (la asignación interna del servicio filtra las activas)
    const sucursalesActivas = sucursales.filter((s) => s.estado === 'activo');

    // 2. Pedidos pendientes para la lógica de asignación
    const pedidosPendientes = obtenerPedidosPendientes();

    // 3. Asignar la sucursal con menos pedidos pendientes (automático)
    const sucursalAsignada = asignarSucursalOptima(sucursalesActivas, pedidosPendientes);

    if (!sucursalAsignada) {
      alert('No hay sucursales disponibles en este momento.');
      return;
    }

    // 4. Crear el pedido con la sucursal asignada y la dirección del cliente (estado inicial PENDIENTE)
    const nuevoPedido = crearPedido(
      {
        cliente: user?.email || 'cliente@test.com',
        productos: items.map((item) => ({
          nombre: item.producto.nombre,
          cantidad: item.cantidad,
          precio: item.producto.precio,
        })),
        total,
        direccion,
      },
      sucursalAsignada
    );

    // 5. Simular pago: confirmar automáticamente (PENDIENTE → CONFIRMADO)
    confirmarPedido(nuevoPedido.id);

    // 6. Redirigir a la confirmación
    vaciarCarrito();
    navigate('/cliente/confirmacion');
  };

  const irAlCatalogo = () => {
    navigate('/cliente/catalogo');
  };

  return (
    <Container className="py-5">
      <h1 className="carrito-titulo mb-4">Tu Carrito</h1>

      {items.length === 0 ? (
        /* Estado vacío: mensaje amigable + botón al catálogo */
        <div className="d-flex justify-content-center">
          <Card className="carrito-vacio">
            <Card.Body className="text-center p-5">
              <h4 className="fw-bold mb-2">Tu carrito está vacío</h4>
              <p className="text-muted mb-4">¡Añadí tus productos favoritos y hacé tu pedido!</p>
              <Button className="carrito-boton-vacio rounded-pill" onClick={irAlCatalogo}>
                <FaUtensils aria-hidden="true" />
                Ir al catálogo
              </Button>
            </Card.Body>
          </Card>
        </div>
      ) : (
        <Row>
          {/* Aviso: sin dirección no se puede confirmar */}
          {items.length > 0 && !direccionPrincipal && (
            <Col xs={12} className="mb-3">
              <Alert variant="warning" className="mb-0">
                No tenés direcciones guardadas.{' '}
                <Link to="/cliente/mis-direcciones" className="alert-link">
                  Agregá una dirección
                </Link>{' '}
                antes de confirmar tu pedido.
              </Alert>
            </Col>
          )}

          {/* Lista de productos */}
          <Col lg={8} className="mb-4 mb-lg-0">
            <div className="d-flex flex-column gap-3">
              {items.map((item) => (
                <ItemCarrito key={item.producto.id} item={item} />
              ))}
            </div>

            <div className="text-center text-md-end mt-3">
              <Button variant="outline-danger" className="rounded-pill px-4" onClick={vaciarCarrito}>
                <FaTrashAlt aria-hidden="true" />
                Vaciar carrito
              </Button>
            </div>
          </Col>

          {/* Resumen del pedido */}
          <Col lg={4}>
            <ResumenPedido onConfirmar={handleConfirmarPedido} />
          </Col>
        </Row>
      )}
    </Container>
  );
};

export default Carrito;
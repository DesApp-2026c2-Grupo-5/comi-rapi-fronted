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
 *   5. Se redirige a la pantalla de pago (/cliente/pago) para elegir el método.
 *   6. Si se sale del carrito sin pagar, al volver se muestra "Ir a Pagar" en lugar
 *      de "Confirmar Pedido" (el pedido sigue PENDIENTE hasta abonar).
 */

import { useEffect, useMemo, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Container, Row, Col, Button, Card, Alert, Form } from 'react-bootstrap';
import { FaUtensils, FaTrashAlt, FaMapMarkerAlt } from 'react-icons/fa';
import { useCarrito } from '../../hooks/useCarrito';
import { useSucursal } from '../../hooks/useSucursal';
import { usePedidos } from '../../hooks/usePedidos';
import { useAuth } from '../../hooks/useAuth';
import { useDirecciones } from '../../hooks/useDirecciones';
import { asignarSucursalOptima } from '../../services/asignacionSucursal';
import { calcularCostoEnvio } from '../../services/envio';
import { ESTADOS_PEDIDO } from '../../utils/constants';
import ItemCarrito from '../../components/cliente/ItemCarrito';
import ResumenPedido from '../../components/cliente/ResumenPedido';
import './Carrito.css';

const Carrito = () => {
  const { items, total, vaciarCarrito } = useCarrito();
  const { sucursales } = useSucursal();
  const { crearPedido, obtenerPedidosPendientes, pedidoActual } = usePedidos();
  const { user } = useAuth();
  const { direcciones, cargarDirecciones } = useDirecciones();
  const navigate = useNavigate();

  // Si hay un pedido PENDIENTE sin pagar, el carrito ofrece "Ir a Pagar"
  const tienePagoPendiente = pedidoActual?.estado === ESTADOS_PEDIDO.PENDIENTE;

  // ID de la dirección elegida para este pedido
  const [direccionId, setDireccionId] = useState(null);

  // Carga las direcciones del cliente al entrar al carrito
  useEffect(() => {
    cargarDirecciones();
  }, [cargarDirecciones]);

  // Dirección elegida (por defecto, la primera activa)
  const direccionSeleccionada = useMemo(
    () => direcciones.find((d) => d.id === direccionId) || direcciones[0] || null,
    [direcciones, direccionId]
  );

  const handleConfirmarPedido = async () => {
    // Sin dirección: el cliente no puede confirmar
    const direccion = direccionSeleccionada;
    if (!direccion) {
      alert('Agregá una dirección antes de confirmar');
      return;
    }

    // 1. Sucursales activas (la asignación interna del servicio filtra las activas)
    const sucursalesActivas = sucursales.filter((s) => s.activa !== false);

    // 2. Pedidos pendientes para la lógica de asignación
    const pedidosPendientes = obtenerPedidosPendientes();

    // 3. Asignar la sucursal con menos pedidos pendientes (automático)
    const sucursalAsignada = asignarSucursalOptima(sucursalesActivas, pedidosPendientes);

    if (!sucursalAsignada) {
      alert('No hay sucursales disponibles en este momento.');
      return;
    }

    // 4. Crear el pedido en la API real (Postgres) con fallback a mock local.
    //    El total se recalcula en el backend; acá se envía como referencia.
    await crearPedido(
      {
        cliente: user?.email || 'cliente@test.com',
        productos: items.map((item) => ({
          nombre: item.producto.nombre,
          cantidad: item.cantidad,
          precio: item.precioUnitarioPersonalizado ?? item.producto.precio,
          precioBase: item.producto.precio,
          extras: item.personalizacion?.extras || [],
          sin: item.personalizacion?.sin || [],
          acompanamientos: item.personalizacion?.acompanamientos || [],
          condimentos: item.personalizacion?.condimentos || [],
        })),
        total,
        costoEnvio: calcularCostoEnvio(total),
        direccion,
      },
      sucursalAsignada
    );

    // 5. Redirigir a la pantalla intermedia de pago (el pedido queda en estado PENDIENTE)
    navigate('/cliente/pago');
  };

  // Ya hay un pedido PENDIENTE sin pagar: se retoma el pago directamente
  const handleIrAPagar = () => {
    navigate('/cliente/pago');
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
          {items.length > 0 && direcciones.length === 0 && (
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
                <ItemCarrito key={item.idLinea || item.producto.id} item={item} />
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
            {direcciones.length > 0 && (
              <Card className="shadow-sm mb-3">
                <Card.Body>
                  <Form.Group controlId="direccionEntrega">
                    <Form.Label className="fw-bold">Dirección de entrega</Form.Label>
                    <Form.Select
                      value={direccionSeleccionada?.id ?? ''}
                      onChange={(e) => setDireccionId(Number(e.target.value))}
                    >
                      {direcciones.map((direccion) => (
                        <option key={direccion.id} value={direccion.id}>
                          {direccion.alias ? `${direccion.alias} - ` : ''}
                          {direccion.calle}
                          {direccion.altura ? ` ${direccion.altura}` : ''}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                  <Button
                    as={Link}
                    to="/cliente/mis-direcciones"
                    variant="outline-primary"
                    size="sm"
                    className="carrito-boton-direcciones w-100 rounded-pill mt-3"
                  >
                    <FaMapMarkerAlt className="me-1" aria-hidden="true" />
                    Gestionar direcciones
                  </Button>
                </Card.Body>
              </Card>
            )}
            <ResumenPedido
              onConfirmar={tienePagoPendiente ? handleIrAPagar : handleConfirmarPedido}
              botonTexto={tienePagoPendiente ? 'Ir a Pagar' : 'Confirmar Pedido'}
            />
          </Col>
        </Row>
      )}
    </Container>
  );
};

export default Carrito;
/**
 * Propósito: Página del carrito de compras con lista de ítems y resumen del pedido.
 *            Accesible sin sesión: se puede armar el carrito como invitado y la
 *            cuenta se pide recién al confirmar el pedido.
 * Contenido: Componente Carrito con ItemCarrito, ResumenPedido, estado vacío y flujo de
 *            confirmación que asigna la sucursal óptima automáticamente.
 * Dependencias: react-bootstrap (Container, Row, Col, Button, Card, Alert, Form), react-router-dom,
 *               useAuth/useCarrito hook, useSucursal hook, usePedidos hook, useDirecciones hook,
 *               services/asignacionSucursal.js, ItemCarrito, ResumenPedido, Carrito.css.
 * Uso: Ruta "/cliente/carrito" → <Carrito />
 *
 * SIN SESIÓN:
 *   El carrito vive en localStorage bajo la clave "invitado" y se migra a la del
 *   usuario al entrar (ver utils/carritoStorage.js), así que nada se pierde al
 *   pedir la cuenta. Lo único que no hay es dirección de entrega: por eso el
 *   aviso pide registrarse y el botón de confirmar abre el login en vez de
 *   fallar más adelante.
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
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Container, Row, Col, Button, Card, Alert, Form } from 'react-bootstrap';
import { FaUtensils, FaTrashAlt, FaMapMarkerAlt } from 'react-icons/fa';
import { useAuth } from '../../hooks/useAuth';
import { useCarrito } from '../../hooks/useCarrito';
import { usePromocionesCarrito } from '../../hooks/usePromocionesCarrito';
import { useSucursal } from '../../hooks/useSucursal';
import { usePedidos } from '../../hooks/usePedidos';
import { useDirecciones } from '../../hooks/useDirecciones';
import { useNotificaciones } from '../../hooks/useNotificaciones';
import { asignarSucursalOptima } from '../../services/asignacionSucursal';
import { calcularCostoEnvio } from '../../services/envio';
import { ESTADOS_PEDIDO } from '../../utils/constants';
import { rutaActual } from '../../utils/rutas';
import ItemCarrito from '../../components/cliente/ItemCarrito';
import ResumenPedido from '../../components/cliente/ResumenPedido';
import './Carrito.css';

const Carrito = () => {
  const { items, total, vaciarCarrito } = useCarrito();
  const { descuentoTotal, promocionIds, promosAplicadas } =
    usePromocionesCarrito(items);
  const [actualizando, setActualizando] = useState(false);
  const { sucursales } = useSucursal();
  const { crearPedido, obtenerPedidosPendientes, pedidoActual, pedidos, cambiarEstado } =
    usePedidos();
  const { direcciones, cargarDirecciones } = useDirecciones();
  const { notificar } = useNotificaciones();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Pantalla de origen para el login: se vuelve al carrito con lo elegido.
  const origen = rutaActual(location);

  /* El carrito se arma sin sesión, pero la dirección de entrega es del usuario y
     el endpoint la exige. Pedirla sin sesión sólo produce un 401: se omite y la
     pantalla muestra el aviso de registrarse. */
  useEffect(() => {
    if (!isAuthenticated) return;
    cargarDirecciones();
  }, [cargarDirecciones, isAuthenticated]);

  // Pedido PENDIENTE sin pagar. Se busca en la lista de la API y no sólo en
  // `pedidoActual` (que vive en memoria y se pierde al recargar) porque los
  // pedidos sin pagar no aparecen en "Mis Pedidos": si sólo se mirara el estado
  // en memoria, al recargar el carrito creería que no hay nada pendiente y
  // dejaría crear un segundo pedido, con el stock del primero ya descontado.
  const pedidoPendiente = useMemo(
    () =>
      (pedidos || []).find((p) => p.estado === ESTADOS_PEDIDO.PENDIENTE) ||
      (pedidoActual?.estado === ESTADOS_PEDIDO.PENDIENTE ? pedidoActual : null),
    [pedidos, pedidoActual]
  );

  // Si hay un pedido PENDIENTE sin pagar, el carrito ofrece "Ir a Pagar"
  const tienePagoPendiente = Boolean(pedidoPendiente);

  // ID de la dirección elegida para este pedido
  const [direccionId, setDireccionId] = useState(null);

  // Dirección elegida (por defecto, la primera activa)
  const direccionSeleccionada = useMemo(
    () => direcciones.find((d) => d.id === direccionId) || direcciones[0] || null,
    [direcciones, direccionId]
  );

  // El pendiente queda obsoleto si cambiaron promos o importes desde que se creó:
  // en ese caso hay que recrearlo para que el Pago coincida con el carrito.
  const costoEnvioActual = calcularCostoEnvio(total);
  const totalEstimado = total + costoEnvioActual - descuentoTotal;
  const idsPrevistos = useMemo(
    () => [...promocionIds].map(String).sort(),
    [promocionIds]
  );
  const idsPersistidos = useMemo(
    () =>
      ((pedidoPendiente?.promociones || []).map((promo) => String(promo.promocionId))).sort(),
    [pedidoPendiente]
  );
  const pendienteObsoleto =
    tienePagoPendiente &&
    (JSON.stringify(idsPrevistos) !== JSON.stringify(idsPersistidos) ||
      Math.abs(Number(pedidoPendiente.total) - totalEstimado) > 0.01);

  // La sucursal no va en el cuerpo: `crearPedido` la recibe aparte como segundo
  // argumento, así que aquí el parámetro sobraba (y eslint lo marcaba).
  const construirDatosPedido = (direccion) => ({
    productos: items.map((item) => ({
      productoId: item.producto.id,
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
    costoEnvio: costoEnvioActual,
    direccion,
    ...(promocionIds.length > 0 ? { promocionIds } : {}),
  });

  const handleConfirmarPedido = async () => {
    /* Armar el carrito no pide cuenta, confirmarlo sí: hace falta una dirección
       de entrega, que es del usuario. El login se pide acá, y no en el carrito,
       para que el visitante recorra el catálogo sin interrupciones. Se manda la
       pantalla de origen para que al entrar vuelva con lo que ya eligió. */
    if (!isAuthenticated) {
      navigate('/login', { state: { from: origen } });
      return;
    }

    // Sin dirección: el cliente no puede confirmar
    const direccion = direccionSeleccionada;
    if (!direccion) {
      notificar('Agregá una dirección antes de confirmar.', 'warning');
      return;
    }

    // 1. Sucursales activas (la asignación interna del servicio filtra las activas)
    const sucursalesActivas = sucursales.filter((s) => s.activa !== false);

    // 2. Pedidos pendientes para la lógica de asignación
    const pedidosPendientes = obtenerPedidosPendientes();

    // 3. Asignar la sucursal con menos pedidos pendientes (automático)
    const sucursalAsignada = asignarSucursalOptima(sucursalesActivas, pedidosPendientes);

    if (!sucursalAsignada) {
      notificar('No hay sucursales disponibles en este momento.', 'warning');
      return;
    }

    // 4. Crear el pedido en la API real (Postgres). El total se recalcula en
    //    el backend; acá se envía como referencia. Sin fallback: si la API
    //    falla, el contexto muestra el error y no se navega a la pantalla de pago.
    const pedidoCreado = await crearPedido(
construirDatosPedido(direccion),
        sucursalAsignada
      );
    if (!pedidoCreado) return;

    // 5. Redirigir a la pantalla intermedia de pago (el pedido queda en estado PENDIENTE)
    navigate('/cliente/pago');
  };

  // Ya hay un pedido PENDIENTE sin pagar: se retoma el pago directamente,
  // salvo que haya quedado obsoleto (promos o importes distintos al carrito),
  // en cuyo caso se cancela y se crea uno nuevo con los datos actuales.
  const handleIrAPagar = async () => {
    // Un invitado no tiene pedidos: si quedó alguno en memoria de una sesión
    // anterior, se lo lleva al login en vez de mandarlo a una pantalla de pago
    // que lo va a expulsar igual.
    if (!isAuthenticated) {
      navigate('/login', { state: { from: origen } });
      return;
    }
    if (!pendienteObsoleto) {
      navigate('/cliente/pago');
      return;
    }
    if (actualizando) return;
    const direccion = direccionSeleccionada;
    if (!direccion) {
      notificar('Agregá una dirección antes de confirmar.', 'warning');
      return;
    }
    setActualizando(true);
    try {
      const cancelado = await cambiarEstado(
        pedidoPendiente.id,
        ESTADOS_PEDIDO.CANCELADO
      );
      if (!cancelado) return;
      const sucursalesActivas = sucursales.filter((s) => s.activa !== false);
      const sucursalAsignada = asignarSucursalOptima(
        sucursalesActivas,
        obtenerPedidosPendientes()
      );
      if (!sucursalAsignada) {
        notificar('No hay sucursales disponibles en este momento.', 'warning');
        return;
      }
      const pedidoCreado = await crearPedido(
        construirDatosPedido(direccion),
        sucursalAsignada
      );
      if (!pedidoCreado) return;
      navigate('/cliente/pago');
    } finally {
      setActualizando(false);
    }
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
              <h2 className="h4 fw-bold mb-2">Tu carrito está vacío</h2>
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
          {/* Aviso para el invitado: se puede carritoear sin cuenta, pero el
              pedido necesita una. Se lo dice antes de que llegue al botón, con
              los dos enlaces al login y al registro, y no con un error. */}
          {!isAuthenticated && (
            <Col xs={12} className="mb-3">
              <Alert variant="warning" className="mb-0" role="status">
                Podés armar tu pedido sin cuenta.{' '}
                <Link to="/login" state={{ from: origen }} className="alert-link">
                  Iniciá sesión
                </Link>{' '}
                o{' '}
                <Link to="/registro" state={{ from: origen }} className="alert-link">
                  registrate
                </Link>{' '}
                para confirmar la compra y elegir la dirección de entrega.
              </Alert>
            </Col>
          )}

          {/* Aviso: sin dirección no se puede confirmar */}
          {isAuthenticated && items.length > 0 && direcciones.length === 0 && (
            <Col xs={12} className="mb-3">
              <Alert variant="warning" className="mb-0" role="status">
                No tenés direcciones guardadas.{' '}
                <Link to="/cliente/perfil?direcciones=1" className="alert-link">
                  Agregá una dirección
                </Link>{' '}
                antes de confirmar tu pedido.
              </Alert>
            </Col>
          )}

          {/* Lista de productos */}
          <Col lg={8} className="mb-4 mb-lg-0">
            {descuentoTotal > 0 && (
              <Alert variant="success" className="mb-3">
                <strong>¡Tenés promociones aplicadas!</strong>{' '}
                {promosAplicadas.map((promo) => promo.nombre).join(' · ')}.
              </Alert>
            )}
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
                    to="/cliente/perfil?direcciones=1"
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
              /* Sólo acá la card va fija: está en la columna lateral y acompaña el
                 scroll de la lista de ítems. En /cliente/pago taparía los botones. */
              fija
              botonTexto={
                !isAuthenticated
                  ? 'Iniciá sesión para confirmar'
                  : tienePagoPendiente
                    ? pendienteObsoleto
                      ? actualizando
                        ? 'Actualizando…'
                        : 'Actualizar y pagar'
                      : 'Ir a Pagar'
                    : 'Confirmar Pedido'
              }
              descuento={descuentoTotal}
              detalleDescuento={promosAplicadas.map((promo) => promo.nombre).join(' · ')}
            />
          </Col>
        </Row>
      )}
    </Container>
  );
};

export default Carrito;
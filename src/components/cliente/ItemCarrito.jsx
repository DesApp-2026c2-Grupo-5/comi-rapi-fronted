import { Card, Button, Form, Row, Col } from 'react-bootstrap';
import { FaTimes } from 'react-icons/fa';
import { useCarrito } from '../../hooks/useCarrito';
import { formatPrice } from '../../utils/formatters';
import './ItemCarrito.css';

const ItemCarrito = ({ item }) => {
  const { producto, cantidad, idLinea, personalizacion, precioUnitarioPersonalizado } = item;
  const { eliminarDelCarrito, actualizarCantidad } = useCarrito();

  const precioUnitario = precioUnitarioPersonalizado ?? producto.precio;
  const subtotal = precioUnitario * cantidad;
  const tienePersonalizacion =
    personalizacion &&
    ((personalizacion.extras && personalizacion.extras.length > 0) ||
      (personalizacion.sin && personalizacion.sin.length > 0) ||
      (personalizacion.acompanamientos && personalizacion.acompanamientos.length > 0) ||
      (personalizacion.condimentos && personalizacion.condimentos.length > 0));

  const handleEliminar = () => {
    eliminarDelCarrito(idLinea || producto.id);
  };

  const handleCambiarCantidad = (e) => {
    const nuevaCantidad = parseInt(e.target.value, 10);
    if (!Number.isNaN(nuevaCantidad)) {
      actualizarCantidad(idLinea || producto.id, nuevaCantidad);
    }
  };

  return (
    <Card className="item-carrito">
      <Card.Body className="p-3">
        <Row className="align-items-center g-3">
          <Col xs={12} sm={3}>
            <img src={producto.imagen} alt={producto.nombre} className="item-carrito-imagen" />
          </Col>
          <Col xs={12} sm={4}>
            <div className="fw-bold item-carrito-nombre">{producto.nombre}</div>
            <div className="text-muted small">Precio: {formatPrice(precioUnitario)}{precioUnitario !== producto.precio ? ` (base ${formatPrice(producto.precio)})` : ''}</div>
            {tienePersonalizacion && (
              <div className="item-carrito-desglose small mt-1">
                {personalizacion.extras?.map((ex) => (
                  <div key={ex.id}>› Extra: {ex.nombre} (+{formatPrice(ex.precio)}) x{ex.cantidad}</div>
                ))}
                {personalizacion.acompanamientos?.map((ac) => (
                  <div key={ac.id}>› Acompañamiento: {ac.nombre} (+{formatPrice(ac.precio)}) x{ac.cantidad}</div>
                ))}
                {personalizacion.sin?.map((s) => (
                  <div key={s}>› <strong>Sin {s}</strong></div>
                ))}
                {personalizacion.condimentos?.map((c) => (
                  <div key={c.nombre}>› {c.nombre} x{c.cantidad} <span className="text-muted">(sin costo)</span></div>
                ))}
              </div>
            )}
          </Col>
          <Col xs={6} sm={2}>
            <Form.Label className="text-muted small d-block mb-1">Cantidad</Form.Label>
            <Form.Control type="number" min="1" max="20" value={cantidad} onChange={handleCambiarCantidad} className="cantidad-input" aria-label={`Cantidad de ${producto.nombre}`} />
          </Col>
          <Col xs={6} sm={2} className="text-sm-end">
            <div className="text-muted small">Subtotal</div>
            <div className="fw-bold item-carrito-subtotal">{formatPrice(subtotal)}</div>
          </Col>
          <Col xs={12} sm={1} className="text-sm-end">
            <Button variant="outline-danger" size="sm" className="item-carrito-eliminar" onClick={handleEliminar} aria-label={`Eliminar ${producto.nombre}`}>
              <FaTimes aria-hidden="true" />
            </Button>
          </Col>
        </Row>
      </Card.Body>
    </Card>
  );
};

export default ItemCarrito;

/**
 * Propósito: Ítem individual del carrito con imagen, cantidad, subtotal y eliminar.
 * Contenido: Componente ItemCarrito usando Card, Row/Col, Form y Button de Bootstrap.
 * Dependencias: react-bootstrap (Card, Button, Form, Row, Col), useCarrito hook,
 *               formatters.js, ItemCarrito.css.
 * Uso: <ItemCarrito item={item} />
 *
 * CAMBIOS REALIZADOS:
 *  - Diseño alineado a Comi-Rapi: card redondeada con sombra suave, miniatura de
 *    imagen del producto, control de cantidad y botón eliminar circular.
 */

import { Card, Button, Form, Row, Col } from 'react-bootstrap';
import { FaTimes } from 'react-icons/fa';
import { useCarrito } from '../../hooks/useCarrito';
import { formatPrice } from '../../utils/formatters';
import './ItemCarrito.css';

const ItemCarrito = ({ item }) => {
  const { producto, cantidad } = item;
  const { eliminarDelCarrito, actualizarCantidad } = useCarrito();

  const handleEliminar = () => {
    eliminarDelCarrito(producto.id);
  };

  const handleCambiarCantidad = (e) => {
    const nuevaCantidad = parseInt(e.target.value, 10);
    if (!Number.isNaN(nuevaCantidad)) {
      actualizarCantidad(producto.id, nuevaCantidad);
    }
  };

  return (
    <Card className="item-carrito">
      <Card.Body className="p-3">
        <Row className="align-items-center g-3">
          {/* Imagen del producto */}
          <Col xs={12} sm={3}>
            <img
              src={producto.imagen}
              alt={producto.nombre}
              className="item-carrito-imagen"
            />
          </Col>

          {/* Nombre + precio unitario */}
          <Col xs={12} sm={4}>
            <div className="fw-bold item-carrito-nombre">{producto.nombre}</div>
            <div className="text-muted small">Precio: {formatPrice(producto.precio)}</div>
          </Col>

          {/* Cantidad */}
          <Col xs={6} sm={2}>
            <Form.Label className="text-muted small d-block mb-1">Cantidad</Form.Label>
            <Form.Control
              type="number"
              min="1"
              max="20"
              value={cantidad}
              onChange={handleCambiarCantidad}
              className="cantidad-input"
              aria-label={`Cantidad de ${producto.nombre}`}
            />
          </Col>

          {/* Subtotal */}
          <Col xs={6} sm={2} className="text-sm-end">
            <div className="text-muted small">Subtotal</div>
            <div className="fw-bold item-carrito-subtotal">
              {formatPrice(producto.precio * cantidad)}
            </div>
          </Col>

          {/* Eliminar */}
          <Col xs={12} sm={1} className="text-sm-end">
            <Button
              variant="outline-danger"
              size="sm"
              className="item-carrito-eliminar"
              onClick={handleEliminar}
              aria-label={`Eliminar ${producto.nombre}`}
            >
              <FaTimes aria-hidden="true" />
            </Button>
          </Col>
        </Row>
      </Card.Body>
    </Card>
  );
};

export default ItemCarrito;
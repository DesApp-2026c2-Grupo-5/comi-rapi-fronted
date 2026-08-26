/**
 * Propósito: Ítem individual en el carrito usando ListGroup de Bootstrap.
 * Contenido: Componente ItemCarrito con info, cantidad, subtotal y botón eliminar.
 * Dependencias: react-bootstrap (ListGroup, Button, Form, Row, Col), useCarrito hook, formatters.js.
 * Uso: <ItemCarrito item={item} />
 */

import React from 'react';
import { ListGroup, Button, Form, Row, Col } from 'react-bootstrap';
import { useCarrito } from '../../hooks/useCarrito';
import { formatPrice } from '../../utils/formatters';

const ItemCarrito = ({ item }) => {
  const { eliminarDelCarrito, actualizarCantidad } = useCarrito();
  const { producto, cantidad } = item;

  const handleEliminar = () => {
    eliminarDelCarrito(producto.id);
  };

  const handleCambiarCantidad = (e) => {
    const nuevaCantidad = parseInt(e.target.value, 10);
    actualizarCantidad(producto.id, nuevaCantidad);
  };

  return (
    <ListGroup.Item className="d-flex align-items-center gap-3 py-3">
      <div className="flex-grow-1">
        <h6 className="mb-1">{producto.nombre}</h6>
        <small className="text-muted">Precio: {formatPrice(producto.precio)}</small>
      </div>
      <div className="d-flex align-items-center gap-2">
        <Form.Label className="mb-0 text-muted small">Cantidad:</Form.Label>
        <Form.Control
          type="number"
          min="1"
          max="20"
          value={cantidad}
          onChange={handleCambiarCantidad}
          style={{ width: '70px' }}
        />
      </div>
      <div className="text-end" style={{ minWidth: '120px' }}>
        <small className="text-muted d-block">Subtotal:</small>
        <strong className="text-danger">{formatPrice(producto.precio * cantidad)}</strong>
      </div>
      <Button variant="outline-danger" size="sm" onClick={handleEliminar}>
        Eliminar
      </Button>
    </ListGroup.Item>
  );
};

export default ItemCarrito;

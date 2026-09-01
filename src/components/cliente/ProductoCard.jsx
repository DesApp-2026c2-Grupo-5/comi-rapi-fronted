/**
 * Propósito: Tarjeta de producto para el catálogo usando Card de Bootstrap.
 * Contenido: Componente ProductoCard con Card, Card.Img, Card.Body, Button.
 * Dependencias: react-bootstrap (Card, Button), useCarrito hook, formatters.js, ProductoCard.css.
 * Uso: <ProductoCard producto={producto} />
 *
 * CAMBIOS REALIZADOS:
 *  - Estilo alineado con la home de Comi-Rapi: card con bordes redondeados,
 *    sombra suave, precio destacado y botón "Añadir" redondo naranja.
 */

import { Card, Button } from 'react-bootstrap';
import { FaCartPlus } from 'react-icons/fa';
import { useCarrito } from '../../hooks/useCarrito';
import { formatPrice } from '../../utils/formatters';
import './ProductoCard.css';

const ProductoCard = ({ producto }) => {
  const { agregarAlCarrito } = useCarrito();

  const handleAgregar = () => {
    agregarAlCarrito(producto, 1);
  };

  return (
    <Card className="producto-card h-100">
      <Card.Img
        variant="top"
        src={producto.imagen}
        alt={producto.nombre}
        className="producto-card-imagen"
      />
      <Card.Body className="d-flex flex-column p-3">
        <Card.Title className="producto-nombre">{producto.nombre}</Card.Title>
        <Card.Text className="text-muted flex-grow-1 producto-descripcion">
          {producto.descripcion}
        </Card.Text>
        <Card.Text className="fw-bold producto-precio">{formatPrice(producto.precio)}</Card.Text>
        <Button className="producto-boton w-100" onClick={handleAgregar}>
          <FaCartPlus aria-hidden="true" />
          Añadir
        </Button>
      </Card.Body>
    </Card>
  );
};

export default ProductoCard;
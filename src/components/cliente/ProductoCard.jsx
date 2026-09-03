import { useState } from 'react';
import { Card, Button } from 'react-bootstrap';
import { FaCartPlus } from 'react-icons/fa';
import { formatPrice } from '../../utils/formatters';
import ProductoPersonalizarModal from './ProductoPersonalizarModal';
import './ProductoCard.css';

const ProductoCard = ({ producto }) => {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <Card className="producto-card h-100">
        <Card.Img variant="top" src={producto.imagen} alt={producto.nombre} className="producto-card-imagen" />
        <Card.Body className="d-flex flex-column p-3">
          <Card.Title className="producto-nombre">{producto.nombre}</Card.Title>
          <Card.Text className="text-muted flex-grow-1 producto-descripcion">{producto.descripcion}</Card.Text>
          <Card.Text className="fw-bold producto-precio">{formatPrice(producto.precio)}</Card.Text>
          <Button className="producto-boton w-100" onClick={() => setShowModal(true)}>
            <FaCartPlus aria-hidden="true" />
            Añadir
          </Button>
        </Card.Body>
      </Card>
      <ProductoPersonalizarModal show={showModal} onHide={() => setShowModal(false)} producto={producto} />
    </>
  );
};

export default ProductoCard;

/**
 * Propósito: Página del carrito de compras usando Container y ListGroup de Bootstrap.
 * Contenido: Componente Carrito con ItemCarrito, ResumenPedido y botones de acción.
 * Dependencias: react-bootstrap (Container, Button, Alert, ListGroup), useCarrito hook, ItemCarrito, ResumenPedido.
 * Uso: Ruta "/cliente/carrito" → <Carrito />
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Button, Alert, ListGroup } from 'react-bootstrap';
import { useCarrito } from '../../hooks/useCarrito';
import ItemCarrito from '../../components/cliente/ItemCarrito';
import ResumenPedido from '../../components/cliente/ResumenPedido';

const Carrito = () => {
  const { items, vaciarCarrito } = useCarrito();
  const navigate = useNavigate();

  const handleConfirmarPedido = () => {
    navigate('/cliente/confirmacion');
  };

  return (
    <Container className="py-4">
      <h1 className="mb-4">Mi Carrito</h1>

      {items.length === 0 ? (
        <Alert variant="secondary" className="text-center py-4">Tu carrito está vacío.</Alert>
      ) : (
        <>
          <ListGroup className="mb-3">
            {items.map((item) => (
              <ItemCarrito key={item.producto.id} item={item} />
            ))}
          </ListGroup>

          <div className="text-end mb-3">
            <Button variant="outline-danger" onClick={vaciarCarrito}>
              Vaciar carrito
            </Button>
          </div>

          <ResumenPedido onConfirmar={handleConfirmarPedido} />
        </>
      )}
    </Container>
  );
};

export default Carrito;

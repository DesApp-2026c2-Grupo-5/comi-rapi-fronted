/**
 * Propósito: Página del carrito de compras con lista de ítems y resumen del pedido.
 * Contenido: Componente Carrito con ItemCarrito, ResumenPedido, estado vacío y acciones.
 * Dependencias: react-bootstrap (Container, Row, Col, Button, Card), react-router-dom,
 *               useCarrito hook, ItemCarrito, ResumenPedido, Carrito.css.
 * Uso: Ruta "/cliente/carrito" → <Carrito />
 *
 * CAMBIOS REALIZADOS:
 *  - Título "Tu Carrito" en tipografía bold oscura (estilo Comi-Rapi).
 *  - Lista de ítems a la izquierda con cards redondeadas y sombra suave (ItemCarrito).
 *  - Resumen del pedido a la derecha (Subtotal, Envío, Total y botón rojo "Confirmar Pedido").
 *  - Estado vacío amigable con botón "Ir al catálogo".
 *  - Responsive: en mobile el resumen baja debajo de la lista.
 */

import { useNavigate } from 'react-router-dom';
import { Container, Row, Col, Button, Card } from 'react-bootstrap';
import { useCarrito } from '../../hooks/useCarrito';
import ItemCarrito from '../../components/cliente/ItemCarrito';
import ResumenPedido from '../../components/cliente/ResumenPedido';
import './Carrito.css';

const Carrito = () => {
  const { items, vaciarCarrito } = useCarrito();
  const navigate = useNavigate();

  const handleConfirmarPedido = () => {
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
                Ir al catálogo
              </Button>
            </Card.Body>
          </Card>
        </div>
      ) : (
        <Row>
          {/* Lista de productos */}
          <Col lg={8} className="mb-4 mb-lg-0">
            <div className="d-flex flex-column gap-3">
              {items.map((item) => (
                <ItemCarrito key={item.producto.id} item={item} />
              ))}
            </div>

            <div className="text-center text-md-end mt-3">
              <Button variant="outline-danger" className="rounded-pill px-4" onClick={vaciarCarrito}>
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
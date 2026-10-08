import { Card, Button, Form, Row, Col } from 'react-bootstrap';
import { FaTimes } from 'react-icons/fa';
import { useCarrito } from '../../hooks/useCarrito';
import { useParametros } from '../../hooks/useParametros';
import { formatPrice } from '../../utils/formatters';
import './ItemCarrito.css';

const ItemCarrito = ({ item }) => {
  const { producto, cantidad, idLinea, personalizacion, precioUnitarioPersonalizado } = item;
  const { eliminarDelCarrito, actualizarCantidad } = useCarrito();
  const { parametros } = useParametros();
  const maxUnidades = parametros.cantidadMaximaProductoCarrito;

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
      const acotada = Math.max(1, Math.min(maxUnidades, nuevaCantidad));
      actualizarCantidad(idLinea || producto.id, acotada);
    }
  };

  return (
    <Card className="item-carrito">
      <Card.Body className="p-3">
        <Row className="align-items-center g-3">
          <Col xs={12} sm={3}>
            {/* alt vacío: el nombre del producto está en la columna de al lado y
                se lee igual, así que la foto no necesita duplicarlo. */}
            <img
              src={producto.imagen}
              alt=""
              width={90}
              height={90}
              loading="lazy"
              decoding="async"
              className="item-carrito-imagen"
            />
          </Col>
          <Col xs={12} sm={4}>
            <h3 className="fw-bold item-carrito-nombre">{producto.nombre}</h3>
            <div className="text-muted small">
              Precio: {formatPrice(precioUnitario)}
              {precioUnitario !== producto.precio ? ` (base ${formatPrice(producto.precio)})` : ''}
            </div>
            {tienePersonalizacion && (
              <ul className="item-carrito-desglose small mt-1">
                {personalizacion.extras?.map((ex) => (
                  <li key={ex.id}>Extra: {ex.nombre} (+{formatPrice(ex.precio)}) x{ex.cantidad}</li>
                ))}
                {personalizacion.acompanamientos?.map((ac) => (
                  <li key={ac.id}>Acompañamiento: {ac.nombre} (+{formatPrice(ac.precio)}) x{ac.cantidad}</li>
                ))}
                {personalizacion.sin?.map((s) => (
                  <li key={s}><strong>Sin {s}</strong></li>
                ))}
                {personalizacion.condimentos?.map((c) => (
                  <li key={c.nombre}>
                    {c.nombre} x{c.cantidad} <span className="text-muted">(sin costo)</span>
                  </li>
                ))}
              </ul>
            )}
          </Col>
          <Col xs={6} sm={2}>
            {/* Label visible + associated: el `aria-label` que tenía antes pisaba
                el texto del label y hacía que se anunciara dos veces. */}
            <Form.Label htmlFor={`cantidad-${idLinea || producto.id}`} className="text-muted small d-block mb-1">
              Cantidad
            </Form.Label>
            <Form.Control
              id={`cantidad-${idLinea || producto.id}`}
              type="number"
              name={`cantidad-${idLinea || producto.id}`}
              min="1"
              max={maxUnidades}
              inputMode="numeric"
              value={cantidad}
              onChange={handleCambiarCantidad}
              className="cantidad-input"
            />
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

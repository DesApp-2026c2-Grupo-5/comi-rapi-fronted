import { Card, Row, Col } from "react-bootstrap";
import { FaTrash, FaMinus, FaPlus } from "react-icons/fa";
import { useCarrito } from "../../hooks/useCarrito";
import { useParametros } from "../../hooks/useParametros";
import { formatPrice } from "../../utils/formatters";
import "./ItemCarrito.css";

const ItemCarrito = ({ item }) => {
  const {
    producto,
    cantidad,
    idLinea,
    personalizacion,
    precioUnitarioPersonalizado,
  } = item;
  const { eliminarDelCarrito, actualizarCantidad } = useCarrito();
  const { parametros } = useParametros();
  const maxUnidades = parametros.cantidadMaximaProductoCarrito;

  const precioUnitario = precioUnitarioPersonalizado ?? producto.precio;
  const subtotal = precioUnitario * cantidad;
  const tienePersonalizacion =
    personalizacion &&
    ((personalizacion.extras && personalizacion.extras.length > 0) ||
      (personalizacion.sin && personalizacion.sin.length > 0) ||
      (personalizacion.acompanamientos &&
        personalizacion.acompanamientos.length > 0) ||
      (personalizacion.condimentos && personalizacion.condimentos.length > 0));

  const idItem = idLinea || producto.id;

  const handleIncrementar = () => {
    if (cantidad < maxUnidades) {
      actualizarCantidad(idItem, cantidad + 1);
    }
  };

  const handleDecrementar = () => {
    if (cantidad > 1) {
      actualizarCantidad(idItem, cantidad - 1);
    } else {
      // Cantidad 1 y apretó "-": elimina el item (mismo criterio que el trash).
      eliminarDelCarrito(idItem);
    }
  };

  return (
    <Card className="item-carrito">
      <Card.Body className="p-3">
        <Row className="align-items-center g-3">
          <Col xs={3} md={2}>
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
          <Col xs={9} md={4}>
            <h3 className="fw-bold item-carrito-nombre">{producto.nombre}</h3>
            <div className="text-muted small">
              Precio: {formatPrice(precioUnitario)}
              {precioUnitario !== producto.precio
                ? ` (base ${formatPrice(producto.precio)})`
                : ""}
            </div>
            {tienePersonalizacion && (
              <ul className="item-carrito-desglose small mt-1">
                {personalizacion.extras?.map((ex) => (
                  <li key={ex.id}>
                    Extra: {ex.nombre} (+{formatPrice(ex.precio)}) x
                    {ex.cantidad}
                  </li>
                ))}
                {personalizacion.acompanamientos?.map((ac) => (
                  <li key={ac.id}>
                    Acompañamiento: {ac.nombre} (+{formatPrice(ac.precio)}) x
                    {ac.cantidad}
                  </li>
                ))}
                {personalizacion.sin?.map((s) => (
                  <li key={s}>
                    <strong>Sin {s}</strong>
                  </li>
                ))}
                {personalizacion.condimentos?.map((c) => (
                  <li key={c.nombre}>
                    {c.nombre} x{c.cantidad}{" "}
                    <span className="text-muted">(sin costo)</span>
                  </li>
                ))}
              </ul>
            )}
          </Col>
          <Col xs={6} md={3}>
            {/* B1: grupo de botones en vez de input manual. Trash si es la
                última unidad, "-" si hay más de una; "+" siempre (disabled
                en el máximo). Sin entrada de texto: solo botones. */}
            <div className="text-muted small d-block mb-1">Cantidad</div>
            <div
              className="cantidad-grupo"
              role="group"
              aria-label={`Cantidad de ${producto.nombre}`}
            >
              <button
                type="button"
                className="cantidad-btn cantidad-btn-izq"
                onClick={handleDecrementar}
                aria-label={
                  cantidad === 1
                    ? `Eliminar ${producto.nombre} del carrito`
                    : `Quitar una unidad de ${producto.nombre}`
                }
              >
                {cantidad === 1 ? (
                  <FaTrash aria-hidden="true" size={14} />
                ) : (
                  <FaMinus aria-hidden="true" size={14} />
                )}
              </button>
              <span className="cantidad-display" aria-live="polite">
                {cantidad}
              </span>
              <button
                type="button"
                className="cantidad-btn cantidad-btn-der"
                onClick={handleIncrementar}
                disabled={cantidad >= maxUnidades}
                aria-label={`Agregar una unidad de ${producto.nombre}`}
              >
                <FaPlus aria-hidden="true" size={14} />
              </button>
            </div>
          </Col>
          <Col xs={6} md={3} className="text-md-end">
            <div className="text-muted small">Subtotal</div>
            <div className="fw-bold item-carrito-subtotal">
              {formatPrice(subtotal)}
            </div>
          </Col>
        </Row>
      </Card.Body>
    </Card>
  );
};

export default ItemCarrito;

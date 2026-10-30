import { useState } from "react";
import { Card, Row, Col, Form, Button } from "react-bootstrap";
import { FaTrash, FaMinus, FaPlus, FaPen, FaStickyNote } from "react-icons/fa";
import { useCarrito } from "../../hooks/useCarrito";
import { useParametros } from "../../hooks/useParametros";
import { formatPrice } from "../../utils/formatters";
import { NOTA_MAX_CARACTERES } from "../../utils/notaHelpers";
import "./ItemCarrito.css";

const ItemCarrito = ({ item }) => {
  const {
    producto,
    cantidad,
    idLinea,
    personalizacion,
    precioUnitarioPersonalizado,
    nota,
  } = item;
  const { eliminarDelCarrito, actualizarCantidad, actualizarNota } = useCarrito();
  const { parametros } = useParametros();
  const maxUnidades = parametros.cantidadMaximaProductoCarrito;

  // Nota para cocina: se edita en la misma línea y se guarda explícitamente
  // (no al perder foco, para no guardar un texto a medio escribir).
  const [editandoNota, setEditandoNota] = useState(false);
  const [borradorNota, setBorradorNota] = useState(nota || "");

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

  const abrirEditorNota = () => {
    setBorradorNota(nota || "");
    setEditandoNota(true);
  };

  const cancelarNota = () => {
    setBorradorNota(nota || "");
    setEditandoNota(false);
  };

  const guardarNota = () => {
    actualizarNota(idItem, borradorNota);
    setEditandoNota(false);
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

        <div className="item-carrito-nota">
          {editandoNota ? (
            <Form.Group controlId={`nota-${idItem}`}>
              <Form.Label className="item-carrito-nota-label">
                Nota para cocina
              </Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                value={borradorNota}
                maxLength={NOTA_MAX_CARACTERES}
                onChange={(evento) => setBorradorNota(evento.target.value)}
                onKeyDown={(evento) => {
                  if (evento.key === "Escape") {
                    evento.preventDefault();
                    cancelarNota();
                  }
                }}
                placeholder="Ej.: sin sal, bien cocida, sin cebolla"
                aria-describedby={`nota-contador-${idItem}`}
                autoFocus
              />
              <div className="item-carrito-nota-pie">
                <span
                  id={`nota-contador-${idItem}`}
                  className="text-muted small"
                >
                  {borradorNota.length}/{NOTA_MAX_CARACTERES}
                </span>
                <div className="d-flex gap-2">
                  <Button
                    variant="outline-secondary"
                    size="sm"
                    onClick={cancelarNota}
                  >
                    Cancelar
                  </Button>
                  <Button variant="primary" size="sm" onClick={guardarNota}>
                    Listo
                  </Button>
                </div>
              </div>
            </Form.Group>
          ) : nota ? (
            <div className="item-carrito-nota-texto">
              <FaStickyNote aria-hidden="true" className="me-1" />
              <span className="fw-semibold">Nota para cocina:</span> {nota}
              <Button
                variant="link"
                size="sm"
                className="item-carrito-nota-editar"
                onClick={abrirEditorNota}
                aria-label={`Editar la nota de ${producto.nombre}`}
              >
                <FaPen aria-hidden="true" size={12} />
              </Button>
            </div>
          ) : (
            <Button
              variant="link"
              size="sm"
              className="item-carrito-nota-agregar"
              onClick={abrirEditorNota}
              aria-label={`Agregar una nota para cocina en ${producto.nombre}`}
            >
              <FaPen aria-hidden="true" size={12} className="me-1" />
              Agregar nota para cocina
            </Button>
          )}
        </div>
      </Card.Body>
    </Card>
  );
};

export default ItemCarrito;

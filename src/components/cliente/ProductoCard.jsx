import PropTypes from 'prop-types';
import { useState } from 'react';
import { Card, Button, Badge } from 'react-bootstrap';
import { FaCartPlus, FaTrophy, FaMedal, FaAward } from 'react-icons/fa';
import { formatPrice } from '../../utils/formatters';
import ProductoPersonalizarModal from './ProductoPersonalizarModal';
import './ProductoCard.css';

const ProductoCard = ({ producto, rank, promocion }) => {
  const [showModal, setShowModal] = useState(false);
  // La receta del combo: [{ productoId, cantidad, nombre? }]. El backend la
  // devuelve en el índice y en el detalle del producto.
  const componentes = producto.tipo === 'COMBO' && Array.isArray(producto.componentes)
    ? producto.componentes
    : [];
  // `rank` va de 1 a 3 para "Más vendidos hoy" (top Netflix).
  const mostrarRank = typeof rank === 'number' && rank >= 1 && rank <= 3;
  const getRankIcon = () => {
    if (rank === 1) return <FaTrophy aria-label="#1" />;
    if (rank === 2) return <FaMedal aria-label="#2" />;
    if (rank === 3) return <FaAward aria-label="#3" />;
    return null;
  };
  // Badge de promoción: arriba a la derecha para no pisar el rank (izquierda).
  // El backend no deja promocionar combos (el combo ya es la promoción), así
  // que en la práctica el badge cae siempre en productos simples.
  const badgePromocion = promocion
    ? promocion.tipo === 'DOS_POR_UNO'
      ? '2x1'
      : `-${Math.round(Number(promocion.valor))}%`
    : null;
  // Precio con descuento porcentual: el original va tachado y más chico, y el
  // precio final abajo en tamaño normal. Con 2x1 no se toca: el descuento es
  // por cantidad en el carrito, no sobre el precio unitario de la tarjeta.
  const precioConDescuento =
    promocion && promocion.tipo === 'DESCUENTO_PORCENTUAL'
      ? Number(producto.precio) * (1 - Number(promocion.valor) / 100)
      : null;

  return (
    <>
      <Card className="producto-card h-100">
        {mostrarRank && (
          <div className={`producto-rank producto-rank--${rank}`}>
            {getRankIcon()}
          </div>
        )}
        {badgePromocion && (
          <span className="producto-promocion-badge" aria-label={`Promoción ${badgePromocion}`}>
            {badgePromocion}
          </span>
        )}
        {/* `alt=""` a propósito: el nombre del producto ya está en el título de
            la tarjeta, y repetirlo hace que el lector de pantalla lo lea dos
            veces. La foto es decorativa dentro de este contexto. */}
        <Card.Img
          variant="top"
          src={producto.imagen}
          alt=""
          width={400}
          height={280}
          loading="lazy"
          decoding="async"
          className="producto-card-imagen"
        />
        <Card.Body className="d-flex flex-column p-3">
          {/* Card.Title por defecto renderiza un <div>; se fuerza heading para
              que el nombre del producto entre en la navegación por encabezados. */}
          <Card.Title as="h3" className="producto-nombre">
            {producto.nombre}
            {componentes.length > 0 && (
              <Badge bg="info" className="ms-2">Combo</Badge>
            )}
          </Card.Title>
          <Card.Text className="text-muted flex-grow-1 producto-descripcion">{producto.descripcion}</Card.Text>
          {componentes.length > 0 && (
            <ul className="producto-componentes list-unstyled text-muted small mb-2">
              {componentes.map((componente) => (
                <li key={componente.productoId}>
                  {componente.cantidad} × {componente.nombre || `producto ${componente.productoId}`}
                </li>
              ))}
            </ul>
          )}
          {precioConDescuento !== null ? (
            <div className="d-flex flex-column">
              <Card.Text className="text-muted text-decoration-line-through producto-precio-tachado mb-0">
                {formatPrice(producto.precio)}
              </Card.Text>
              <Card.Text className="fw-bold producto-precio">
                {formatPrice(precioConDescuento)}
              </Card.Text>
            </div>
          ) : (
            <Card.Text className="fw-bold producto-precio">{formatPrice(producto.precio)}</Card.Text>
          )}
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

ProductoCard.propTypes = {
  producto: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    nombre: PropTypes.string,
    imagen: PropTypes.string,
    descripcion: PropTypes.string,
    precio: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    tipo: PropTypes.string,
    componentes: PropTypes.arrayOf(
      PropTypes.shape({
        productoId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
        cantidad: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
        nombre: PropTypes.string,
      })
    ),
  }).isRequired,
  rank: PropTypes.number,
  promocion: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    nombre: PropTypes.string,
    tipo: PropTypes.string.isRequired,
    valor: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  }),
};

ProductoCard.defaultProps = {
  rank: undefined,
  promocion: undefined,
};

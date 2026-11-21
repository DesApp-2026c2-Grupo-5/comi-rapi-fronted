import PropTypes from 'prop-types';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Button, Badge } from 'react-bootstrap';
import { FaCartPlus, FaTrophy, FaMedal, FaAward } from 'react-icons/fa';
import { formatPrice } from '../../utils/formatters';
import { resolverImagen } from '../../utils/imagenes';
import ProductoPersonalizarModal from './ProductoPersonalizarModal';
import './ProductoCard.css';

const ProductoCard = ({ producto, rank, promocion, variante }) => {
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  // Click en imagen o nombre → página de detalle. El botón Añadir mantiene
  // el modal de personalizar.
  const irDetalle = () => navigate(`/producto/${producto.id}`);
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
  // Se resuelve una sola vez para el `src` de la imagen.
  const imagenSrc = resolverImagen(producto.imagen);

  return (
    <>
      {/* Contenedor del layout: conserva la altura de fila (`h-100` del Card).
          El modal queda fuera, para no quedar atrapado en el contexto de
          contención. */}
      <div className="producto-card-contenedor">
        <Card
          className={`producto-card hover-elevar h-100${
            variante === 'horizontal' ? ' producto-card--horizontal' : ''
          }`}
        >
          {mostrarRank && (
            <div className={`producto-rank producto-rank--${rank}`}>
              {getRankIcon()}
            </div>
          )}
          {/* La foto va dentro de un contenedor que la columna fija: 4:3 en el
              modo vertical, alto completo de la tarjeta en el horizontal. La
              imagen lo cubre con `object-fit: cover`, sin franjas ni fondo
              desenfocado. */}
          <div className="producto-card-media">
            {/* El badge de promoción vive dentro del área de la foto para que en
                el modo horizontal quede sobre la imagen y no sobre el nombre. */}
            {badgePromocion && (
              <span className="producto-promocion-badge" aria-label={`Promoción ${badgePromocion}`}>
                {badgePromocion}
              </span>
            )}
            {/* `alt=""` a propósito: el nombre del producto ya está en el título
                de la tarjeta, y repetirlo hace que el lector de pantalla lo lea
                dos veces. La foto es decorativa dentro de este contexto. */}
            <Card.Img
              variant="top"
              src={imagenSrc}
              alt=""
              width={400}
              height={300}
              loading="lazy"
              decoding="async"
              className="producto-card-imagen"
              style={{ cursor: 'pointer' }}
              onClick={irDetalle}
            />
          </div>
          <Card.Body className="d-flex flex-column producto-cuerpo">
            {/* El badge "Combo" va fuera del `Card.Title` a propósito: dentro del
                título (con `line-clamp`) caía a una tercera línea y quedaba
                recortado en las tarjetas angostas de 2 columnas. */}
            <div className="producto-encabezado">
              {/* Card.Title por defecto renderiza un <div>; se fuerza heading para
                  que el nombre del producto entre en la navegación por encabezados. */}
              <Card.Title as="h3" className="producto-nombre" style={{ cursor: 'pointer' }} onClick={irDetalle}>
                {producto.nombre}
              </Card.Title>
              {componentes.length > 0 && (
                <Badge bg="info" className="producto-badge-combo">Combo</Badge>
              )}
            </div>
            {/* Sin `flex-grow-1`: con alto definido el `line-clamp` no aplica y
                el texto largo se cortaba a media línea. El pie se ancla abajo
                igual con su `margin-top: auto`. */}
            <Card.Text className="text-muted producto-descripcion">{producto.descripcion}</Card.Text>
            {/* Pie de la tarjeta: en vertical el precio va sobre el botón; en
                horizontal ambos comparten la fila inferior (precio a la
                izquierda, botón circular a la derecha), así la descripción gana
                renglones. El original tachado queda arriba del precio final,
                pero fuera del flujo: el precio rojo no baja cuando hay promo. */}
            <div className="producto-pie">
              <div className="producto-precios">
                {precioConDescuento !== null && (
                  <Card.Text className="text-muted text-decoration-line-through producto-precio-tachado mb-0">
                    {formatPrice(producto.precio)}
                  </Card.Text>
                )}
                <Card.Text className="fw-bold producto-precio mb-0">
                  {formatPrice(
                    precioConDescuento !== null
                      ? precioConDescuento
                      : producto.precio
                  )}
                </Card.Text>
              </div>
              {/* El nombre accesible va en aria-label: en el modo horizontal el
                  texto se oculta y el botón queda sólo con el icono. */}
              <Button
                className="producto-boton"
                onClick={() => setShowModal(true)}
                aria-label={`Añadir ${producto.nombre} al carrito`}
              >
                <FaCartPlus aria-hidden="true" />
                <span className="producto-boton-texto">Añadir</span>
              </Button>
            </div>
          </Card.Body>
        </Card>
      </div>
      <ProductoPersonalizarModal
        mostrar={showModal}
        onCerrar={() => setShowModal(false)}
        producto={producto}
        promocion={promocion}
      />
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
  // 'horizontal' apila la imagen a la izquierda y los datos a la derecha en
  // pantallas chicas (catálogo mobile). Sin la prop, la tarjeta es vertical.
  variante: PropTypes.oneOf(['horizontal']),
};

/**
 * Propósito: Muestra las fotos de los productos de un pedido superpuestas y
 *            alineadas a la misma altura, como cartas apoyadas una sobre otra.
 *            Un mismo producto se ve una sola vez, aunque tenga cantidad > 1
 *            o aparezca en varias líneas.
 * Contenido: Componente MiniaturasPedido y su miniatura individual con
 *            fallback para productos sin imagen o con la imagen rota.
 * Dependencias: react-icons/fa, MiniaturasPedido.css.
 * Uso: <MiniaturasPedido productos={pedido.productos} />
 */

import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { FaUtensils } from "react-icons/fa";
import "./MiniaturasPedido.css";

// Cuatro fotos alcanzan para identificar el pedido sin que la tarjeta crezca
// de más; el resto se resume en un contador +N.
const MAX_VISIBLES = 4;

const claveProducto = (producto, indice) => {
  if (producto?.productoId !== null && producto?.productoId !== undefined) {
    return `id-${producto.productoId}`;
  }
  const nombre = (producto?.nombre || "").trim().toLowerCase();
  return nombre ? `nombre-${nombre}` : `item-${indice}`;
};

const Miniatura = ({ producto }) => {
  const [imagenRota, setImagenRota] = useState(false);
  const imagen = producto?.imagen;
  const clases = "pedido-miniatura";

  // Si la lista se refresca con otra foto para el mismo producto, se vuelve a
  // intentar la carga en vez de dejar el fallback viejo.
  useEffect(() => {
    setImagenRota(false);
  }, [imagen]);

  if (!imagen || imagenRota) {
    return (
      <span className={`${clases} pedido-miniatura-vacia`}>
        <FaUtensils aria-hidden="true" />
      </span>
    );
  }

  return (
    <img
      src={imagen}
      alt=""
      width={64}
      height={64}
      loading="lazy"
      decoding="async"
      className={clases}
      onError={() => setImagenRota(true)}
    />
  );
};

const MiniaturasPedido = ({ productos = [] }) => {
  // Deduplicar por producto: el cliente ve una foto por producto distinto,
  // no una por unidad comprada.
  const unicos = [];
  const vistos = new Set();

  (productos || []).filter(Boolean).forEach((producto, indice) => {
    const clave = claveProducto(producto, indice);
    if (vistos.has(clave)) return;
    vistos.add(clave);
    unicos.push(producto);
  });

  if (unicos.length === 0) return null;

  const visibles = unicos.slice(0, MAX_VISIBLES);
  const restantes = unicos.length - visibles.length;

  return (
    <div className="pedido-miniaturas" aria-hidden="true">
      {visibles.map((producto, indice) => (
        <Miniatura
          key={`${claveProducto(producto, indice)}-${indice}`}
          producto={producto}
        />
      ))}
      {restantes > 0 && (
        <span className="pedido-miniatura pedido-miniatura-mas">
          +{restantes}
        </span>
      )}
    </div>
  );
};

const productoSchema = PropTypes.shape({
  productoId: PropTypes.number,
  nombre: PropTypes.string,
  imagen: PropTypes.string,
});

Miniatura.propTypes = {
  producto: productoSchema.isRequired,
};

MiniaturasPedido.propTypes = {
  productos: PropTypes.arrayOf(productoSchema),
};

export default MiniaturasPedido;

import { Button } from "react-bootstrap";
import { FaCheckCircle, FaTicketAlt, FaTimes } from "react-icons/fa";
import PropTypes from "prop-types";
import { formatPrice } from "../../utils/formatters";
import "./CuponeraCarrito.css";

/**
 * Propósito: único aviso de cupones del carrito, arriba de los productos.
 * Contenido: una fila por cupón disponible con su alcance (producto, productos
 *            o categoría), la compra mínima y la acción Aplicar / Quitar.
 * Dependencias: utils/formatters.js, react-icons. La elegibilidad y el
 *            descuento vienen del backend en `evaluacion`; acá no se calculan.
 * Uso:
 *   <CuponeraCarrito
 *     cupones={cuponesDisponibles}
 *     productos={productos}
 *     categorias={categorias}
 *     cuponCodigo={cuponCodigo}
 *     evaluacion={evaluacionCupones}
 *     evaluando={evaluandoCupones}
 *     descuento={descuentoCuponEstimado}
 *     onAplicar={setCuponCodigo}
 *     onQuitar={() => setCuponCodigo("")}
 *   />
 */

const idsValidos = (valor) =>
  (Array.isArray(valor) ? valor : [])
    .map(Number)
    .filter((id) => Number.isInteger(id) && id > 0);

const valorCupon = (cupon) =>
  cupon?.tipoDescuento === "PORCENTAJE"
    ? `${Number(cupon.valorDescuento)}% OFF`
    : `${formatPrice(Number(cupon.valorDescuento))} OFF`;

const etiquetaCupon = (cupon) =>
  cupon?.nombre || cupon?.emision?.nombre
    ? `Cupón ${cupon.nombre || cupon.emision.nombre}`
    : "Cupón";

/** Nombres legibles: "A", "A y B", "A, B y C", "A, B y 2 más". */
const listarNombres = (nombres) => {
  const limpios = (nombres || []).filter(Boolean);
  if (limpios.length === 0) return "";
  if (limpios.length === 1) return limpios[0];
  if (limpios.length === 2) return `${limpios[0]} y ${limpios[1]}`;
  if (limpios.length === 3) {
    return `${limpios[0]}, ${limpios[1]} y ${limpios[2]}`;
  }
  return `${limpios[0]}, ${limpios[1]} y ${limpios.length - 2} más`;
};

/**
 * Texto del alcance del cupón. Es sólo una explicación del snapshot congelado:
 * la decisión de si aplica la toma el backend con el carrito definitivo.
 */
const describirAlcance = (cupon, productosPorId, categoriasPorId) => {
  const alcance = cupon?.alcanceSnapshot;
  if (!alcance || alcance.global === true) {
    return "Aplica a todo el catálogo";
  }

  const categorias = idsValidos(alcance.categoriaIds)
    .map((id) => categoriasPorId.get(id))
    .filter(Boolean);
  const explicitos = idsValidos(alcance.productoIds)
    .map((id) => productosPorId.get(id))
    .filter(Boolean);
  // Snapshots viejos o incompletos: sólo traen los IDs resueltos.
  const resueltos =
    explicitos.length === 0 && categorias.length === 0
      ? idsValidos(alcance.productoIdsResueltos)
          .map((id) => productosPorId.get(id))
          .filter(Boolean)
      : [];

  const nombresProductos = listarNombres(
    explicitos.length > 0 ? explicitos : resueltos
  );
  const nombresCategorias = listarNombres(categorias);

  if (nombresProductos && nombresCategorias) {
    return `Aplica a ${nombresProductos} y a la categoría ${nombresCategorias}`;
  }
  if (nombresProductos) {
    return `Aplica a ${nombresProductos}`;
  }
  if (nombresCategorias) {
    return categorias.length > 1
      ? `Aplica a las categorías ${nombresCategorias}`
      : `Aplica a la categoría ${nombresCategorias}`;
  }
  return "Aplica a productos seleccionados";
};

const CuponeraCarrito = ({
  cupones = [],
  productos = [],
  categorias = [],
  cuponCodigo = "",
  evaluacion = {},
  evaluando = false,
  descuento = null,
  onAplicar,
  onQuitar,
}) => {
  if (!cupones || cupones.length === 0) return null;

  const productosPorId = new Map(
    (productos || []).map((producto) => [Number(producto.id), producto.nombre])
  );
  const categoriasPorId = new Map(
    (categorias || []).map((categoria) => [Number(categoria.id), categoria.nombre])
  );

  return (
    <section className="cuponera" aria-label="Cupones disponibles">
      <div className="cuponera-cabecera">
        <FaTicketAlt aria-hidden="true" className="cuponera-cabecera-icono" />
        <span>Tenés cupones para usar</span>
      </div>

      <div className="cuponera-lista">
        {cupones.map((cupon) => {
          const aplicado = cuponCodigo.trim() === cupon.codigo;
          const resultado = evaluacion?.[cupon.codigo];
          const noAplicable = resultado?.aplicable === false;
          const minimo = Number(cupon.compraMinima) || 0;

          return (
            <div
              key={cupon.id || cupon.codigo}
              className={`cuponera-cupon${aplicado ? " cuponera-cupon--aplicado" : ""}`}
            >
              <div className="cuponera-cupon-info">
                <div className="cuponera-cupon-titulo">
                  <span>{etiquetaCupon(cupon)}</span>
                  <span className="cuponera-cupon-valor">
                    {valorCupon(cupon)}
                  </span>
                  {aplicado && (
                    <span className="cuponera-cupon-estado">
                      <FaCheckCircle aria-hidden="true" /> Aplicado
                      {descuento?.monto > 0 &&
                        ` · −${formatPrice(descuento.monto)}`}
                    </span>
                  )}
                </div>

                <p className="cuponera-cupon-alcance">
                  {describirAlcance(cupon, productosPorId, categoriasPorId)}
                </p>

                {(minimo > 0 || noAplicable) && (
                  <p className="cuponera-cupon-nota">
                    {minimo > 0 && !noAplicable && (
                      <span>Compra mínima {formatPrice(minimo)}</span>
                    )}
                    {noAplicable && (
                      <span className="cuponera-cupon-nota--aviso">
                        {resultado.mensaje || "Este cupón no aplica a tu carrito."}
                      </span>
                    )}
                  </p>
                )}
              </div>

              <div className="cuponera-cupon-accion">
                {aplicado ? (
                  <button
                    type="button"
                    className="cuponera-quitar"
                    onClick={onQuitar}
                    aria-label={`Quitar ${etiquetaCupon(cupon)}`}
                  >
                    <FaTimes aria-hidden="true" className="cuponera-quitar-icono" />
                    Quitar
                  </button>
                ) : (
                  <Button
                    variant="primary"
                    size="sm"
                    className="cuponera-aplicar rounded-pill"
                    disabled={noAplicable || evaluando}
                    onClick={() => onAplicar?.(cupon.codigo)}
                  >
                    Aplicar
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

CuponeraCarrito.propTypes = {
  /** Cupones disponibles del cliente (estado DISPONIBLE y activos). */
  cupones: PropTypes.arrayOf(PropTypes.object),
  /** Catálogo, para resolver nombres del alcance. */
  productos: PropTypes.arrayOf(PropTypes.object),
  /** Categorías, para resolver nombres del alcance. */
  categorias: PropTypes.arrayOf(PropTypes.object),
  /** Código del cupón aplicado. */
  cuponCodigo: PropTypes.string,
  /** Evaluación del backend por código: aplicable, motivo y mensaje. */
  evaluacion: PropTypes.objectOf(PropTypes.object),
  /** La consulta de elegibilidad está en vuelo. */
  evaluando: PropTypes.bool,
  /** Descuento estimado del cupón aplicado. */
  descuento: PropTypes.shape({
    monto: PropTypes.number,
    codigo: PropTypes.string,
    nombre: PropTypes.string,
    detalle: PropTypes.string,
  }),
  /** Aplica un cupón al pedido. */
  onAplicar: PropTypes.func,
  /** Quita el cupón aplicado. */
  onQuitar: PropTypes.func,
};

export default CuponeraCarrito;

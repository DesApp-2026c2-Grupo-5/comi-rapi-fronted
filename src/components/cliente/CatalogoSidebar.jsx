/**
 * Propósito: Panel lateral de filtros del catálogo (desktop).
 * Contenido: Encabezado "Filtros" con la acción "Limpiar todo", la lista de
 *            categorías en SELECCIÓN ÚNICA (sin checkboxes, según la decisión
 *            de diseño) y el rango de precios reutilizando <RangoPrecio />.
 *            Cierra con un botón "Restablecer filtros" que limpia solo los
 *            filtros del panel (categoría y precio), no la búsqueda.
 * Dependencias: react-bootstrap (Button), react-icons/fa (FaSlidersH),
 *               RangoPrecio, CatalogoSidebar.css.
 * Uso: <CatalogoSidebar ... /> dentro de la columna izquierda de Catalogo.jsx
 *      (desktop) y también dentro de la hoja inferior "Filtrar" en mobile
 *      (< lg), donde se le quita el marco de tarjeta vía CSS.
 */

import PropTypes from 'prop-types';
import { Button } from 'react-bootstrap';
import { FaSlidersH } from 'react-icons/fa';
import RangoPrecio from './RangoPrecio';
import './CatalogoSidebar.css';

const CatalogoSidebar = ({
  categorias,
  categoriaId,
  onSeleccionarCategoria,
  precioPiso,
  precioTecho,
  precioMin,
  precioMax,
  onCambiarRangoPrecio,
  onLimpiarTodo,
  onRestablecerFiltros,
}) => (
  <aside className="catalogo-sidebar" aria-label="Filtros del catálogo">
    <div className="catalogo-sidebar-header">
      <h2 className="catalogo-sidebar-titulo">
        <FaSlidersH aria-hidden="true" />
        <span>Filtros</span>
      </h2>
      <Button
        variant="link"
        size="sm"
        className="catalogo-sidebar-limpiar p-0"
        onClick={onLimpiarTodo}
      >
        Limpiar todo
      </Button>
    </div>

    <section className="catalogo-sidebar-seccion">
      <h3 className="catalogo-sidebar-subtitulo">Categorías</h3>
      <ul className="catalogo-sidebar-categorias">
        <li>
          <button
            type="button"
            className={`catalogo-sidebar-categoria${
              categoriaId === null ? ' activa' : ''
            }`}
            aria-pressed={categoriaId === null}
            onClick={() => onSeleccionarCategoria(null)}
          >
            Todos
          </button>
        </li>
        {categorias.map((categoria) => {
          const activa = categoriaId === categoria.id;
          return (
            <li key={categoria.id}>
              <button
                type="button"
                className={`catalogo-sidebar-categoria${activa ? ' activa' : ''}`}
                aria-pressed={activa}
                onClick={() => onSeleccionarCategoria(categoria.id)}
              >
                {categoria.nombre}
              </button>
            </li>
          );
        })}
      </ul>
    </section>

    <hr className="catalogo-sidebar-divisor" />

    <section className="catalogo-sidebar-seccion">
      <h3 className="catalogo-sidebar-subtitulo">Rango de precios</h3>
      <RangoPrecio
        min={precioPiso}
        max={precioTecho}
        valorMin={precioMin}
        valorMax={precioMax}
        onChange={onCambiarRangoPrecio}
      />
    </section>

    <Button
      variant="outline-primary"
      className="catalogo-sidebar-restablecer w-100"
      onClick={onRestablecerFiltros}
    >
      Restablecer filtros
    </Button>
  </aside>
);

CatalogoSidebar.propTypes = {
  categorias: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
      nombre: PropTypes.string.isRequired,
    })
  ).isRequired,
  categoriaId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  onSeleccionarCategoria: PropTypes.func.isRequired,
  precioPiso: PropTypes.number.isRequired,
  precioTecho: PropTypes.number.isRequired,
  precioMin: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  precioMax: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onCambiarRangoPrecio: PropTypes.func.isRequired,
  onLimpiarTodo: PropTypes.func.isRequired,
  onRestablecerFiltros: PropTypes.func.isRequired,
};

export default CatalogoSidebar;

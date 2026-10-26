/**
 * Propósito: Listado de reseñas de un producto con promedio, "tu reseña",
 *            paginación incremental y acciones de edición/borrado.
 * Contenido: ListaResenas e ItemResena.
 * Dependencias: react-bootstrap (Button, Spinner), react-icons/fa, Estrellas,
 *               utils/formatters, ListaResenas.css.
 * Uso: <ListaResenas datos={resenas} miResena={miResena}
 *        puedeResenar={...} onEscribir={...} onEditar={...} onEliminar={...} />
 */

import PropTypes from 'prop-types';
import { Button } from 'react-bootstrap';
import { FaPen, FaStar, FaTrashAlt } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import Estrellas from './Estrellas';
import { formatFechaRelativa } from '../../utils/formatters';
import './ListaResenas.css';

const formatearPromedio = (valor) => (Number(valor) || 0).toFixed(1);

const ItemResena = ({ resena, esMia, onEditar, onEliminar }) => (
  <div className="lista-resenas-item">
    <div className="lista-resenas-item-header">
      <div>
        <strong>{resena.autor?.nombre || 'Cliente'}</strong>
        {esMia && (
          <span className="badge bg-light text-dark border ms-2">
            Tu reseña
          </span>
        )}
        <div className="d-flex align-items-center gap-2 mt-1 flex-wrap">
          <Estrellas valor={resena.puntuacion} tamano={14} />
          <span className="text-muted small">
            {formatFechaRelativa(resena.actualizadaEn || resena.creadaEn)}
          </span>
        </div>
      </div>
      {esMia && (
        <div className="d-flex gap-1">
          <Button
            variant="outline-secondary"
            size="sm"
            onClick={() => onEditar(resena)}
            aria-label="Editar tu reseña"
          >
            <FaPen aria-hidden="true" />
          </Button>
          <Button
            variant="outline-danger"
            size="sm"
            onClick={() => onEliminar(resena)}
            aria-label="Eliminar tu reseña"
          >
            <FaTrashAlt aria-hidden="true" />
          </Button>
        </div>
      )}
    </div>
    {resena.comentario && (
      <p className="lista-resenas-comentario mb-0">{resena.comentario}</p>
    )}
  </div>
);

ItemResena.propTypes = {
  resena: PropTypes.shape({
    id: PropTypes.number.isRequired,
    puntuacion: PropTypes.number,
    comentario: PropTypes.string,
    creadaEn: PropTypes.string,
    actualizadaEn: PropTypes.string,
    autor: PropTypes.shape({ nombre: PropTypes.string }),
  }).isRequired,
  esMia: PropTypes.bool,
  onEditar: PropTypes.func,
  onEliminar: PropTypes.func,
};

const ListaResenas = ({
  datos,
  cargando,
  miResena,
  puedeResenar,
  onEscribir,
  onEditar,
  onEliminar,
  verTodasHref,
}) => {
  if (cargando && !datos) {
    return (
      <div className="lista-resenas" role="status" aria-live="polite">
        <span className="visually-hidden">Cargando reseñas…</span>
        <span className="detalle-etiqueta">Reseñas de clientes</span>
        {[0, 1].map((indice) => (
          <div key={indice} className="lista-resenas-item">
            <span className="placeholder col-3 d-block mb-2" />
            <span className="placeholder col-8 d-block mb-1" />
            <span className="placeholder col-6 d-block" />
          </div>
        ))}
      </div>
    );
  }

  const promedio = Number(datos?.promedio) || 0;
  const cantidad = Number(datos?.cantidad) || 0;
  const items = (datos?.items || []).filter(
    (resena) => !miResena || resena.id !== miResena.id
  );

  return (
    <div className="lista-resenas">
      <div className="lista-resenas-header">
        <div>
          <span className="detalle-etiqueta">Reseñas de clientes</span>
          {cantidad > 0 ? (
            <div className="d-flex align-items-center gap-2 flex-wrap">
              <span className="lista-resenas-promedio">
                {formatearPromedio(promedio)}
              </span>
              <Estrellas valor={promedio} tamano={18} />
              <span className="text-muted small">
                ({cantidad} {cantidad === 1 ? 'reseña' : 'reseñas'})
              </span>
            </div>
          ) : (
            <p className="text-muted mb-0">
              Todavía no hay reseñas de este producto.
            </p>
          )}
        </div>
        {puedeResenar && !miResena && (
          <Button
            className="rounded-pill px-3"
            size="sm"
            onClick={onEscribir}
          >
            <FaStar className="me-1" aria-hidden="true" />
            Escribir reseña
          </Button>
        )}
      </div>

      {miResena && (
        <div className="lista-resenas-mia">
          <span className="lista-resenas-mia-titulo">Tu reseña</span>
          <ItemResena
            resena={miResena}
            esMia
            onEditar={onEditar}
            onEliminar={onEliminar}
          />
        </div>
      )}

      {items.map((resena) => (
        <ItemResena key={resena.id} resena={resena} />
      ))}

      {!miResena && cantidad > 0 && items.length === 0 && (
        <p className="text-muted mb-0">No hay más reseñas para mostrar.</p>
      )}

      {verTodasHref && cantidad > items.length + (miResena ? 1 : 0) && (
        <div className="text-center mt-3">
          <Link
            to={verTodasHref}
            className="btn btn-outline-secondary btn-sm rounded-pill px-3"
          >
            Ver más opiniones
          </Link>
        </div>
      )}
    </div>
  );
};

ListaResenas.propTypes = {
  datos: PropTypes.shape({
    promedio: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    cantidad: PropTypes.number,
    pagina: PropTypes.number,
    paginas: PropTypes.number,
    items: PropTypes.arrayOf(PropTypes.object),
  }),
  cargando: PropTypes.bool,
  miResena: PropTypes.shape({
    id: PropTypes.number.isRequired,
    puntuacion: PropTypes.number,
    comentario: PropTypes.string,
    creadaEn: PropTypes.string,
    actualizadaEn: PropTypes.string,
    autor: PropTypes.shape({ nombre: PropTypes.string }),
  }),
  puedeResenar: PropTypes.bool,
  onEscribir: PropTypes.func,
  onEditar: PropTypes.func,
  onEliminar: PropTypes.func,
  verTodasHref: PropTypes.string,
};

export default ListaResenas;

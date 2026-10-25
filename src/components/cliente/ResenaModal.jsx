/**
 * Propósito: Modal para crear o editar la reseña de un producto.
 * Contenido: Modal centrado con el nombre del producto y FormularioResena.
 * Dependencias: react-bootstrap (Modal), FormularioResena.
 * Uso: <ResenaModal mostrar={...} producto={producto} resena={null}
 *        onGuardada={fn} onCerrar={fn} />
 */

import { useId } from 'react';
import PropTypes from 'prop-types';
import { Modal } from 'react-bootstrap';
import FormularioResena from './FormularioResena';

const ResenaModal = ({ mostrar, producto, resena, onGuardada, onCerrar }) => {
  const tituloId = useId();

  return (
    <Modal
      show={mostrar}
      onHide={onCerrar}
      centered
      aria-labelledby={tituloId}
    >
      <Modal.Header closeButton>
        <Modal.Title id={tituloId} className="h5">
          {resena ? 'Editar tu reseña' : 'Reseñar producto'}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {producto && (
          <p className="mb-3">
            <span className="text-muted">Producto:</span>{' '}
            <strong>{producto.nombre}</strong>
          </p>
        )}
        {/* Se monta recién al abrir para que el formulario arranque con la
            reseña correcta (nueva o la que se está editando). */}
        {mostrar && producto && (
          <FormularioResena
            producto={producto}
            resena={resena}
            onGuardada={onGuardada}
            onCancelar={onCerrar}
          />
        )}
      </Modal.Body>
    </Modal>
  );
};

ResenaModal.propTypes = {
  mostrar: PropTypes.bool.isRequired,
  producto: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
    nombre: PropTypes.string,
  }),
  resena: PropTypes.shape({
    id: PropTypes.number.isRequired,
    puntuacion: PropTypes.number,
    comentario: PropTypes.string,
  }),
  onGuardada: PropTypes.func.isRequired,
  onCerrar: PropTypes.func.isRequired,
};

export default ResenaModal;

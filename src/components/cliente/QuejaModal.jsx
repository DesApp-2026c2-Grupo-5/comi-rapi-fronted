/**
 * Propósito: Modal para crear el reclamo de un pedido entregado.
 * Contenido: Modal centrado con el número de pedido y FormularioQueja.
 * Dependencias: react-bootstrap (Modal), FormularioQueja.
 * Uso: <QuejaModal mostrar={...} pedido={pedido} onGuardada={fn}
 *        onCerrar={fn} />
 */

import { useId } from 'react';
import PropTypes from 'prop-types';
import { Modal } from 'react-bootstrap';
import FormularioQueja from './FormularioQueja';

const QuejaModal = ({ mostrar, pedido, onGuardada, onCerrar }) => {
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
          Hacer un reclamo
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {pedido && (
          <p className="mb-3">
            <span className="text-muted">Pedido:</span>{' '}
            <strong>#{pedido.id}</strong>
          </p>
        )}
        {/* Se monta recién al abrir para arrancar el formulario limpio. */}
        {mostrar && pedido && (
          <FormularioQueja
            pedidoId={pedido.id}
            onGuardada={onGuardada}
            onCancelar={onCerrar}
          />
        )}
      </Modal.Body>
    </Modal>
  );
};

QuejaModal.propTypes = {
  mostrar: PropTypes.bool.isRequired,
  pedido: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
  }),
  onGuardada: PropTypes.func.isRequired,
  onCerrar: PropTypes.func.isRequired,
};

export default QuejaModal;

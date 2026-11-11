/**
 * Propósito: Variante de ModalBase para formularios, con slot de error.
 * Contenido: Componente ModalFormulario que envuelve body/footer en un <Form>.
 * Dependencias: react-bootstrap (Alert), ModalBase.
 * Uso: <ModalFormulario mostrar={...} onCerrar={fn} titulo="Nuevo"
 *        onSubmit={guardar} error={error} footer={...}>...</ModalFormulario>
 */

import PropTypes from 'prop-types';
import { Alert } from 'react-bootstrap';
import ModalBase from './ModalBase';

const ModalFormulario = ({ error, children, onSubmit, ...props }) => (
  <ModalBase {...props} onSubmit={onSubmit}>
    {error && (
      <Alert variant="warning" role="alert" className="mb-3">
        {error}
      </Alert>
    )}
    {children}
  </ModalBase>
);

ModalFormulario.propTypes = {
  error: PropTypes.node,
  children: PropTypes.node,
  onSubmit: PropTypes.func.isRequired,
};

export default ModalFormulario;

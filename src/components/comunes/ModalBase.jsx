/**
 * Propósito: Shell compartido para los modales de la app (título, cierre,
 *            foco, scroll y footer consistentes).
 * Contenido: Componente ModalBase sobre react-bootstrap Modal.
 * Dependencias: react-bootstrap (Modal, Form), react.
 * Uso: <ModalBase mostrar={...} onCerrar={fn} titulo="Editar" footer={...}>
 *        ...contenido...
 *      </ModalBase>
 *
 * Variantes:
 *   - `dialog`: centrado en todos los tamaños (confirmaciones y formularios
 *     breves).
 *   - `fullscreen-mobile`: ocupa la pantalla por debajo de `sm`; en escritorio
 *     sigue siendo un diálogo centrado. Para formularios largos o con pasos.
 *
 * El body es el único contenedor de scroll: el header y el footer quedan
 * siempre visibles. Con `onSubmit`, body y footer se envuelven en un <Form>
 * para que el botón del footer pueda ser `type="submit"`.
 */

import { useId } from 'react';
import PropTypes from 'prop-types';
import { Form, Modal } from 'react-bootstrap';
import './ModalBase.css';

const ModalBase = ({
  mostrar,
  onCerrar,
  titulo,
  descripcion,
  children,
  footer,
  headerExtra,
  tamano = 'md',
  variante = 'dialog',
  centered = true,
  cargando = false,
  bloquearCierre = false,
  mostrarCerrar = true,
  onSubmit,
  noValidate = false,
  initialFocusRef,
  bodyClassName = '',
  contentClassName = '',
  dialogClassName = '',
  ariaLabel,
  ariaLabelledBy,
  ariaDescribedBy,
  sinHeader = false,
}) => {
  const tituloId = useId();
  const descripcionId = useId();
  const cierreBloqueado = bloquearCierre || cargando;
  const tieneHeader = Boolean(titulo) && !sinHeader;
  const sizeProp = tamano === 'md' ? undefined : tamano;

  const handleHide = () => {
    if (!cierreBloqueado) onCerrar();
  };

  const handleEntered = () => {
    if (initialFocusRef?.current) initialFocusRef.current.focus();
  };

  const contenido = (
    <>
      <Modal.Body className={`modal-base-body ${bodyClassName}`.trim()}>
        {children}
      </Modal.Body>
      {footer && (
        <Modal.Footer className="modal-base-footer">{footer}</Modal.Footer>
      )}
    </>
  );

  return (
    <Modal
      show={mostrar}
      onHide={handleHide}
      onEntered={handleEntered}
      centered={centered}
      size={sizeProp}
      fullscreen={variante === 'fullscreen-mobile' ? 'sm-down' : undefined}
      backdrop={cierreBloqueado ? 'static' : true}
      keyboard={!cierreBloqueado}
      aria-busy={cargando || undefined}
      aria-labelledby={ariaLabelledBy || (tieneHeader ? tituloId : undefined)}
      aria-describedby={
        ariaDescribedBy ||
        (descripcion && tieneHeader ? descripcionId : undefined)
      }
      aria-label={!ariaLabelledBy && !tieneHeader ? ariaLabel : undefined}
      dialogClassName={`modal-base-dialog ${dialogClassName}`.trim()}
      contentClassName={`modal-base-content ${contentClassName}`.trim()}
    >
      {tieneHeader && (
        <Modal.Header
          closeButton={mostrarCerrar && !cierreBloqueado}
          className="modal-base-header"
        >
          <div className="modal-base-heading">
            <Modal.Title id={tituloId} className="h5 mb-0">
              {titulo}
            </Modal.Title>
            {descripcion && (
              <p id={descripcionId} className="modal-base-descripcion">
                {descripcion}
              </p>
            )}
          </div>
          {headerExtra}
        </Modal.Header>
      )}
      {onSubmit ? (
        <Form
          onSubmit={onSubmit}
          noValidate={noValidate}
          className="modal-base-form"
        >
          {contenido}
        </Form>
      ) : (
        contenido
      )}
    </Modal>
  );
};

ModalBase.propTypes = {
  mostrar: PropTypes.bool.isRequired,
  onCerrar: PropTypes.func.isRequired,
  titulo: PropTypes.node,
  descripcion: PropTypes.node,
  children: PropTypes.node,
  footer: PropTypes.node,
  headerExtra: PropTypes.node,
  tamano: PropTypes.oneOf(['sm', 'md', 'lg', 'xl']),
  variante: PropTypes.oneOf(['dialog', 'fullscreen-mobile']),
  centered: PropTypes.bool,
  cargando: PropTypes.bool,
  bloquearCierre: PropTypes.bool,
  mostrarCerrar: PropTypes.bool,
  onSubmit: PropTypes.func,
  noValidate: PropTypes.bool,
  initialFocusRef: PropTypes.shape({ current: PropTypes.any }),
  bodyClassName: PropTypes.string,
  contentClassName: PropTypes.string,
  dialogClassName: PropTypes.string,
  ariaLabel: PropTypes.string,
  ariaLabelledBy: PropTypes.string,
  ariaDescribedBy: PropTypes.string,
  sinHeader: PropTypes.bool,
};

export default ModalBase;

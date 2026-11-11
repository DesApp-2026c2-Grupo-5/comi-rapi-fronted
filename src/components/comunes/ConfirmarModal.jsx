/**
 * Propósito: Modal de confirmación reutilizable para acciones destructivas
 *            (reemplaza a window.confirm con un visual acorde a la app).
 *            En modo aviso (aviso=true) muestra un mensaje informativo con un
 *            solo botón, p. ej. "no podés cancelar este pedido".
 * Contenido: Modal centrado con icono, título, mensaje y botones.
 * Dependencias: react-bootstrap (Button), react-icons/fa, ModalBase.
 * Uso: <ConfirmarModal mostrar={...} titulo="Cancelar pedido" mensaje={...}
 *        textoConfirmar="Cancelar pedido" cargando={false}
 *        onConfirmar={fn} onCancelar={fn} />
 */

import { useId } from 'react';
import PropTypes from 'prop-types';
import { Button } from 'react-bootstrap';
import { FaTimesCircle, FaBan } from 'react-icons/fa';
import ModalBase from './ModalBase';
import './ConfirmarModal.css';

const PROPS_CONOCIDAS = new Set([
  'mostrar',
  'titulo',
  'mensaje',
  'textoConfirmar',
  'textoCancelar',
  'cargando',
  'aviso',
  'onConfirmar',
  'onCancelar',
]);

const ConfirmarModal = (props) => {
  const {
    mostrar,
    titulo = '¿Confirmás la acción?',
    mensaje,
    textoConfirmar = 'Confirmar',
    textoCancelar = 'Volver',
    cargando = false,
    aviso = false,
    onConfirmar,
    onCancelar,
  } = props;

  // El diálogo necesita un nombre accesible: sin este id ni aria-label, el lector
  // de pantalla anuncia sólo "diálogo" y se pierde de qué se trata.
  const tituloId = useId();
  const mensajeId = useId();

  // PropTypes no detecta props desconocidas: un `show` o `confirmando` se
  // ignoraría en silencio y el modal nunca se abriría. En desarrollo se avisa.
  if (import.meta.env.DEV) {
    const desconocidas = Object.keys(props).filter(
      (clave) => !PROPS_CONOCIDAS.has(clave)
    );
    if (desconocidas.length > 0) {
      console.warn(
        `ConfirmarModal: props no reconocidas (${desconocidas.join(', ')}). ` +
          '¿Quisiste usar "mostrar" o "cargando"?'
      );
    }
  }

  return (
    <ModalBase
      mostrar={mostrar}
      onCerrar={onCancelar}
      sinHeader
      ariaLabelledBy={tituloId}
      ariaDescribedBy={mensaje ? mensajeId : undefined}
      cargando={cargando}
      bodyClassName="confirmar-modal-body text-center p-4"
    >
      <div
        className={`${
          aviso
            ? 'bg-warning bg-opacity-25 text-dark'
            : 'bg-danger bg-opacity-10 text-danger'
        } rounded-circle d-inline-flex align-items-center justify-content-center mb-3`}
        style={{ width: 64, height: 64 }}
      >
        {aviso ? (
          <FaBan size={32} aria-hidden="true" />
        ) : (
          <FaTimesCircle size={32} aria-hidden="true" />
        )}
      </div>
      <h2 className="h4 fw-bold mb-2" id={tituloId}>
        {titulo}
      </h2>
      {mensaje && (
        <p id={mensajeId} className="text-muted mb-4 break-words">
          {mensaje}
        </p>
      )}
      <div className="d-flex justify-content-center gap-2 flex-wrap confirmar-modal-acciones">
        {aviso ? (
          <Button
            variant="warning"
            className="rounded-pill px-4 text-white"
            onClick={onCancelar}
          >
            Entendido
          </Button>
        ) : (
          <>
            <Button
              variant="outline-secondary"
              className="rounded-pill px-4"
              onClick={onCancelar}
              disabled={cargando}
            >
              {textoCancelar}
            </Button>
            <Button
              variant="danger"
              className="rounded-pill px-4"
              onClick={onConfirmar}
              disabled={cargando}
            >
              {cargando ? 'Procesando…' : textoConfirmar}
            </Button>
          </>
        )}
      </div>
    </ModalBase>
  );
};

ConfirmarModal.propTypes = {
  mostrar: PropTypes.bool.isRequired,
  titulo: PropTypes.node,
  mensaje: PropTypes.node,
  textoConfirmar: PropTypes.string,
  textoCancelar: PropTypes.string,
  cargando: PropTypes.bool,
  aviso: PropTypes.bool,
  onConfirmar: PropTypes.func,
  onCancelar: PropTypes.func.isRequired,
};

export default ConfirmarModal;

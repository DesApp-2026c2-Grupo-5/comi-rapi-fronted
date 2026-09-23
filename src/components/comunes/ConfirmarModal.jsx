/**
 * Propósito: Modal de confirmación reutilizable para acciones destructivas
 *            (reemplaza a window.confirm con un visual acorde a la app).
 *            En modo aviso (aviso=true) muestra un mensaje informativo con un
 *            solo botón, p. ej. "no podés cancelar este pedido".
 * Contenido: Modal centrado con icono, título, mensaje y botones.
 * Dependencias: react-bootstrap (Modal, Button), react-icons/fa.
 * Uso: <ConfirmarModal mostrar={...} titulo="Cancelar pedido" mensaje={...}
 *        textoConfirmar="Cancelar pedido" cargando={false}
 *        onConfirmar={fn} onCancelar={fn} />
 */

import { Modal, Button } from 'react-bootstrap';
import { FaTimesCircle, FaBan } from 'react-icons/fa';

const ConfirmarModal = ({
  mostrar,
  titulo = '¿Estás seguro?',
  mensaje,
  textoConfirmar = 'Confirmar',
  textoCancelar = 'Volver',
  cargando = false,
  aviso = false,
  onConfirmar,
  onCancelar,
}) => (
  <Modal show={mostrar} onHide={onCancelar} centered>
    <Modal.Body className="text-center p-4">
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
      <h4 className="fw-bold mb-2">{titulo}</h4>
      {mensaje && <p className="text-muted mb-4">{mensaje}</p>}
      <div className="d-flex justify-content-center gap-2 flex-wrap">
        {aviso ? (
          <Button variant="warning" className="rounded-pill px-4 text-white" onClick={onCancelar}>
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
              {cargando ? 'Procesando...' : textoConfirmar}
            </Button>
          </>
        )}
      </div>
    </Modal.Body>
  </Modal>
);

export default ConfirmarModal;
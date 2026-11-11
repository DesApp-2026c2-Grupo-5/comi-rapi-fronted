/**
 * Propósito: Interfaz de chat para que el cliente gestione su reclamo.
 * Contenido: Cabecera con estado, hilo de burbujas, compositor de respuesta y acción de cierre.
 * Dependencias: react-bootstrap, react-icons, api/quejas, constants, formatters.
 * Uso: <ConversacionQuejaCliente 
 *        queja={queja} 
 *        onResponder={fn} 
 *        onCerrar={fn} 
 *        enviandoRespuesta={bool} 
 *        cerrandoQueja={bool} 
 *        error={error} 
 *        respuestaActual={valor} 
 *        setRespuestaActual={fn} 
 * />
 */

import { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { Badge, Button, Form } from 'react-bootstrap';
import { FaPaperPlane, FaLock } from 'react-icons/fa';
import { 
  ETIQUETAS_ESTADO_QUEJA, 
  ETIQUETAS_MOTIVO_QUEJA, 
  VARIANTE_ESTADO_QUEJA,
  ESTADOS_QUEJA 
} from '../../utils/constants';
import { formatDateTime } from '../../utils/formatters';
import './ConversacionQuejaCliente.css';

const ConversacionQuejaCliente = ({ 
  queja, 
  onResponder, 
  onCerrar, 
  enviandoRespuesta, 
  cerrandoQueja, 
  error, 
  respuestaActual, 
  setRespuestaActual 
}) => {
  const hiloRef = useRef(null);

  // Auto-scroll al final cuando llega un mensaje nuevo o cambia el estado
  useEffect(() => {
    if (hiloRef.current) {
      hiloRef.current.scrollTop = hiloRef.current.scrollHeight;
    }
  }, [queja]);

  if (!queja) return null;

  const esCerrada = queja.estado === ESTADOS_QUEJA.CERRADA;
  const esResuelta = queja.estado === ESTADOS_QUEJA.RESUELTA;
  const esRechazada = queja.estado === ESTADOS_QUEJA.RECHAZADA;
  // Cuando el negocio resuelve o rechaza, la conversación queda cerrada:
  // el cliente ya no puede enviar más mensajes.
  const bloqueada = esCerrada || esResuelta || esRechazada;
  const restantes = Math.max(0, (queja.maxRespuestasCliente ?? 5) - (queja.respuestasCliente ?? 0));
  const puedeResponder = !bloqueada && restantes > 0;

  // El primer mensaje es el detalle de la queja original
  const mensajes = [
    {
      id: 'original',
      delCliente: true,
      contenido: queja.detalle,
      creadaEn: queja.creadaEn,
    },
    ...(queja.mensajes || []),
  ];

  return (
    <div className="cliente-queja-chat">
      {/* Cabecera: Estado y Motivo */}
      <div className="cliente-queja-cabecera">
        <div className="d-flex align-items-center gap-2">
          <Badge bg={VARIANTE_ESTADO_QUEJA[queja.estado] || 'secondary'}>
            {ETIQUETAS_ESTADO_QUEJA[queja.estado] || queja.estado}
          </Badge>
          <strong className="small">
            {ETIQUETAS_MOTIVO_QUEJA[queja.motivo] || queja.motivo}
          </strong>
        </div>
        {bloqueada && (
          <span className="text-muted small d-flex align-items-center gap-1">
            <FaLock size={10} /> Finalizado
          </span>
        )}
      </div>

      {/* Hilo de conversación */}
      <div className="cliente-queja-hilo" ref={hiloRef}>
        <div className="cliente-queja-sistema">
          Reclamo iniciado el {formatDateTime(queja.creadaEn)}
        </div>

        {mensajes.map((msg) => (
          <div 
            key={msg.id} 
            className={`cliente-queja-burbuja ${msg.delCliente ? 'es-cliente' : 'es-negocio'}`}
          >
            <p className="mb-0">{msg.contenido}</p>
            <span className="cliente-queja-meta">
              {formatDateTime(msg.creadaEn)}
            </span>
          </div>
        ))}

        {esCerrada && (
          <div className="cliente-queja-sistema">
            El reclamo fue cerrado el {formatDateTime(queja.cerradaEn)}
          </div>
        )}

        {(esResuelta || esRechazada) && (
          <div className="cliente-queja-sistema">
            El reclamo fue {esResuelta ? 'resuelto' : 'rechazado'} y no admite
            más mensajes.
          </div>
        )}
      </div>

      {/* Compositor de respuestas */}
      {!esCerrada && (
        <div className="cliente-queja-compositor">
          {puedeResponder ? (
            <Form onSubmit={onResponder}>
              <div className="cliente-queja-input-group">
                <Form.Control
                  as="textarea"
                  className="cliente-queja-textarea"
                  rows={2}
                  maxLength={1000}
                  value={respuestaActual}
                  onChange={(e) => setRespuestaActual(e.target.value)}
                  placeholder="Escribí tu respuesta aquí..."
                />
                <Button 
                  type="submit" 
                  className="cliente-queja-btn-enviar" 
                  disabled={enviandoRespuesta || !respuestaActual.trim()}
                >
                  <FaPaperPlane />
                </Button>
              </div>
              <div className="d-flex justify-content-between align-items-center mt-2">
                <span className="text-muted" style={{ fontSize: '0.7rem' }}>
                  Te quedan {restantes} respuestas.
                </span>
                <Button 
                  variant="link" 
                  className="cliente-queja-btn-cerrar" 
                  onClick={onCerrar}
                  disabled={cerrandoQueja}
                >
                  Cerrar reclamo
                </Button>
              </div>
            </Form>
          ) : (
            <div className="text-center">
              <p className="text-muted small mb-2">
                {esResuelta
                  ? 'El reclamo fue resuelto y no admite más mensajes.'
                  : esRechazada
                    ? 'El reclamo fue rechazado y no admite más mensajes.'
                    : 'Llegaste al máximo de respuestas permitidas.'}
              </p>
              <Button 
                variant="link" 
                className="cliente-queja-btn-cerrar" 
                onClick={onCerrar}
                disabled={cerrandoQueja}
              >
                Cerrar reclamo
              </Button>
            </div>
          )}
          {error && (
            <div className="text-danger small text-center mt-1" style={{ fontSize: '0.75rem' }}>
              {error}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

ConversacionQuejaCliente.propTypes = {
  queja: PropTypes.object,
  onResponder: PropTypes.func.required,
  onCerrar: PropTypes.func.required,
  enviandoRespuesta: PropTypes.bool.required,
  cerrandoQueja: PropTypes.bool.required,
  error: PropTypes.string,
  respuestaActual: PropTypes.string.required,
  setRespuestaActual: PropTypes.func.required,
};

export default ConversacionQuejaCliente;

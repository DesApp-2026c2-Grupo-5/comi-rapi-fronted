/**
 * Propósito: Panel derecho de la bandeja: cabecera del reclamo, hilo completo
 *            y compositor para responder sin cambiar de estado o resolviendo.
 * Contenido: ConversacionQueja.
 * Dependencias: react, react-bootstrap (Badge, Button, Form, Spinner),
 *               react-icons/fa, react-router-dom (Link), utils/constants,
 *               utils/formatters y ./ayudas.
 * Uso: <ConversacionQueja queja={...} onEnviar={...} onVolver={...} />.
 */

/* El proyecto no usa prop-types en ningún componente: se desactiva la regla
   para este archivo, igual que en el resto del codebase. */
/* eslint-disable react/prop-types */

import { useEffect, useRef, useState } from 'react';
import { Alert, Badge, Button, Form, Spinner } from 'react-bootstrap';
import {
  FaArrowLeft,
  FaEnvelope,
  FaExternalLinkAlt,
  FaInfoCircle,
  FaPaperPlane,
} from 'react-icons/fa';
import { Link } from 'react-router-dom';
import {
  ESTADOS_QUEJA,
  ETIQUETAS_ESTADO_QUEJA,
  ETIQUETAS_MOTIVO_QUEJA,
  VARIANTE_ESTADO_QUEJA,
} from '../../../utils/constants';
import {
  formatDateTime,
  formatPrice,
  nombreCompleto,
} from '../../../utils/formatters';
import {
  ETIQUETAS_OPCION_ESTADO,
  OPCIONES_ESTADO,
  construirHilo,
  esEstadoFinal,
  formatFechaBurbuja,
  marcarSinResponder,
  nombreAutor,
  nombreCliente,
  rutaCliente,
} from './ayudas';

const MAXIMO = 1000;
const UMBRAL_CONTADOR = 800;

const Dato = ({ etiqueta, children }) => (
  <div className="queja-dato">
    <span className="queja-dato-etiqueta">{etiqueta}</span>
    <span className="queja-dato-valor">{children}</span>
  </div>
);

const ConversacionQueja = ({ queja, rol, onEnviar, onVolver }) => {
  const [contenido, setContenido] = useState('');
  const [opcion, setOpcion] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');
  const hiloRef = useRef(null);
  const campoRespuestaId = `respuesta-queja-${queja.id}`;
  const campoOpcionId = `opcion-queja-${queja.id}`;

  const hilo = marcarSinResponder(construirHilo(queja));
  const opciones = OPCIONES_ESTADO[queja.estado] || [];
  const bloqueado = opciones.length === 0;
  const cierra =
    opcion === ESTADOS_QUEJA.RESUELTA || opcion === ESTADOS_QUEJA.RECHAZADA;
  const puedeEnviar =
    !enviando &&
    (contenido.trim().length > 0 || opcion === ESTADOS_QUEJA.EN_REVISION);

  // Al abrir la conversación (y cuando llega un mensaje nuevo) se muestra el
  // final del hilo, que es lo último que pasó.
  useEffect(() => {
    const nodo = hiloRef.current;
    if (nodo) nodo.scrollTop = nodo.scrollHeight;
  }, [queja.id, queja.mensajes?.length, queja.estado]);

  const enviar = async (evento) => {
    evento.preventDefault();
    if (!puedeEnviar) return;

    setEnviando(true);
    setError('');
    const resultado = await onEnviar({
      contenido: contenido.trim(),
      estado: opcion,
    });
    setEnviando(false);

    if (!resultado.ok) {
      setError(resultado.error || 'No se pudo enviar el mensaje.');
      return;
    }
    setContenido('');
    setOpcion('');
  };

  const cliente = queja.cliente;
  const nombre = nombreCliente(cliente);
  const respuestasCliente = queja.respuestasCliente ?? 0;
  const maxRespuestas = queja.maxRespuestasCliente ?? 5;

  return (
    <div className="queja-conversacion" aria-label={`Reclamo de ${nombre}`}>
      <header className="queja-conv-cabecera">
        <button
          type="button"
          className="queja-conv-volver"
          onClick={onVolver}
          aria-label="Volver a la lista de reclamos"
        >
          <FaArrowLeft aria-hidden="true" />
        </button>

        <div className="queja-conv-identidad">
          <h2 className="queja-conv-nombre">{nombre}</h2>
          {cliente?.email && (
            <p className="queja-conv-email">{cliente.email}</p>
          )}
        </div>

        <div className="queja-conv-acciones">
          <Badge
            bg={VARIANTE_ESTADO_QUEJA[queja.estado] || 'secondary'}
            className="queja-conv-estado"
          >
            {ETIQUETAS_ESTADO_QUEJA[queja.estado] || queja.estado}
          </Badge>
          {cliente?.id && (
            <Link
              to={rutaCliente(rol, cliente.id)}
              className="queja-conv-enlace"
            >
              Ver cliente
              <FaExternalLinkAlt aria-hidden="true" />
            </Link>
          )}
        </div>
      </header>

      <div className="queja-conv-datos">
        <Dato etiqueta="Pedido">#{queja.pedidoId}</Dato>
        {queja.pedido?.sucursal?.nombre && (
          <Dato etiqueta="Sucursal">{queja.pedido.sucursal.nombre}</Dato>
        )}
        {queja.pedido?.total !== undefined && (
          <Dato etiqueta="Total">{formatPrice(queja.pedido.total)}</Dato>
        )}
        {queja.pedido?.fechaHora && (
          <Dato etiqueta="Pedido hecho el">
            {formatDateTime(queja.pedido.fechaHora)}
          </Dato>
        )}
        <Dato etiqueta="Motivo">
          {ETIQUETAS_MOTIVO_QUEJA[queja.motivo] || queja.motivo}
        </Dato>
        <Dato etiqueta="Respuestas del cliente">
          {respuestasCliente} de {maxRespuestas}
        </Dato>
        {queja.respondidaEn && (
          <Dato etiqueta="Última respuesta del negocio">
            {formatDateTime(queja.respondidaEn)}
            {queja.respondidoPor
              ? ` · ${nombreCompleto(
                  queja.respondidoPor.nombre,
                  queja.respondidoPor.apellido
                )}`
              : ''}
          </Dato>
        )}
        {queja.cerradaEn && (
          <Dato etiqueta="Cerrado el">{formatDateTime(queja.cerradaEn)}</Dato>
        )}
      </div>

      <div
        className="queja-hilo"
        ref={hiloRef}
        role="log"
        aria-live="polite"
        aria-label="Mensajes del reclamo"
      >
        {hilo.map((mensaje) => (
          <article
            key={mensaje.id}
            className={`queja-burbuja ${
              mensaje.delCliente ? 'es-cliente' : 'es-negocio'
            } ${mensaje.sinResponder ? 'sin-responder' : ''}`}
          >
            <div className="queja-burbuja-meta">
              <span className="queja-burbuja-autor">
                {nombreAutor(mensaje, queja)}
              </span>
              <time dateTime={mensaje.creadaEn}>
                {formatFechaBurbuja(mensaje.creadaEn)}
              </time>
              {mensaje.sinResponder && (
                <span
                  className="queja-burbuja-sin-responder"
                  title="Mensaje sin responder"
                >
                  <FaEnvelope aria-hidden="true" />
                  Sin responder
                </span>
              )}
            </div>
            {mensaje.esDetalle && (
              <span className="queja-burbuja-etiqueta">Reclamo</span>
            )}
            <p>{mensaje.contenido}</p>
          </article>
        ))}

        {queja.estado === ESTADOS_QUEJA.CERRADA && (
          <p className="queja-nota-sistema">
            El cliente cerró el reclamo
            {queja.cerradaEn ? ` el ${formatDateTime(queja.cerradaEn)}` : ''}.
          </p>
        )}
      </div>

      {bloqueado ? (
        <div className="queja-compositor-bloqueado">
          <FaInfoCircle aria-hidden="true" />
          <p>
            {queja.estado === ESTADOS_QUEJA.CERRADA
              ? 'El cliente cerró el reclamo. No admite más mensajes.'
              : queja.estado === ESTADOS_QUEJA.RESUELTA
                ? 'El reclamo está resuelto. Si el cliente vuelve a escribir, pasa a Pendiente.'
                : 'El reclamo está rechazado. Si el cliente vuelve a escribir, pasa a Pendiente.'}
          </p>
        </div>
      ) : (
        <Form className="queja-compositor" onSubmit={enviar} noValidate>
          {error && (
            <Alert variant="danger" className="py-2 mb-0" role="alert">
              {error}
            </Alert>
          )}

          <Form.Group controlId={campoRespuestaId}>
            <Form.Label className="visually-hidden">
              Responder al cliente
            </Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              maxLength={MAXIMO}
              value={contenido}
              onChange={(evento) => setContenido(evento.target.value)}
              placeholder="Escribí una respuesta para el cliente…"
            />
          </Form.Group>

          <div className="queja-compositor-pie">
            <Form.Group
              controlId={campoOpcionId}
              className="queja-compositor-opcion"
            >
              <Form.Label className="visually-hidden">
                Qué hacer al enviar
              </Form.Label>
              <Form.Select
                size="sm"
                value={opcion}
                onChange={(evento) => setOpcion(evento.target.value)}
                aria-label="Qué hacer al enviar"
              >
                {opciones.map((valor) => (
                  <option key={valor || 'solo-responder'} value={valor}>
                    {ETIQUETAS_OPCION_ESTADO[valor] || valor}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>

            <span className="queja-compositor-ayuda">
              {cierra
                ? 'La respuesta es obligatoria: el reclamo queda resuelto o rechazado.'
                : opcion === ESTADOS_QUEJA.EN_REVISION
                  ? 'El reclamo pasa a En revisión. El mensaje es opcional.'
                  : 'Se envía al cliente sin cambiar el estado del reclamo.'}
            </span>

            {contenido.length >= UMBRAL_CONTADOR && (
              <span className="queja-compositor-contador">
                {contenido.length} / {MAXIMO}
              </span>
            )}

            <Button type="submit" size="sm" disabled={!puedeEnviar}>
              {enviando ? (
                <>
                  <Spinner
                    animation="border"
                    size="sm"
                    className="me-2"
                    aria-hidden="true"
                  />
                  Enviando…
                </>
              ) : (
                <>
                  <FaPaperPlane className="me-2" aria-hidden="true" />
                  Enviar
                </>
              )}
            </Button>
          </div>

          {respuestasCliente >= maxRespuestas && !esEstadoFinal(queja.estado) && (
            <p className="queja-compositor-aviso mb-0">
              El cliente ya usó sus {maxRespuestas} respuestas. Puede cerrar el
              reclamo, pero no volver a escribir.
            </p>
          )}
        </Form>
      )}
    </div>
  );
};

export default ConversacionQueja;

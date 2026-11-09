/**
 * Propósito: Formulario para crear el reclamo de un pedido entregado.
 * Contenido: select de motivo, detalle obligatorio y acciones.
 * Dependencias: react-bootstrap (Form, Button, Alert, Spinner), api/quejas,
 *               utils/constants.
 * Uso: <FormularioQueja pedidoId={pedido.id} onGuardada={fn} />
 */

import { useId, useState } from 'react';
import PropTypes from 'prop-types';
import { Alert, Button, Form, Spinner } from 'react-bootstrap';
import { crearQueja } from '../../api/quejas';
import {
  ETIQUETAS_MOTIVO_QUEJA,
  MOTIVOS_QUEJA,
} from '../../utils/constants';

const DETALLE_MIN = 10;
const DETALLE_MAX = 1000;

const FormularioQueja = ({ pedidoId, onGuardada, onCancelar }) => {
  const motivoId = useId();
  const detalleId = useId();
  const contadorId = useId();
  const [motivo, setMotivo] = useState(MOTIVOS_QUEJA.PEDIDO_INCOMPLETO);
  const [detalle, setDetalle] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');

  const alEnviar = async (evento) => {
    evento.preventDefault();
    const texto = detalle.trim();
    if (texto.length < DETALLE_MIN) {
      setError(`Contá el problema con al menos ${DETALLE_MIN} caracteres.`);
      return;
    }

    setEnviando(true);
    setError('');
    const resultado = await crearQueja({
      pedidoId,
      motivo,
      detalle: texto,
    });
    setEnviando(false);

    if (!resultado.success) {
      setError(resultado.error || 'No se pudo registrar el reclamo.');
      return;
    }
    onGuardada(resultado.data);
  };

  return (
    <Form onSubmit={alEnviar} noValidate>
      {error && (
        <Alert variant="danger" role="alert" className="py-2">
          {error}
        </Alert>
      )}

      <Form.Group className="mb-3" controlId={motivoId}>
        <Form.Label className="fw-semibold">Motivo</Form.Label>
        <Form.Select
          value={motivo}
          onChange={(evento) => setMotivo(evento.target.value)}
        >
          {Object.values(MOTIVOS_QUEJA).map((valor) => (
            <option key={valor} value={valor}>
              {ETIQUETAS_MOTIVO_QUEJA[valor]}
            </option>
          ))}
        </Form.Select>
      </Form.Group>

      <Form.Group className="mb-2" controlId={detalleId}>
        <Form.Label className="fw-semibold">Contanos qué pasó</Form.Label>
        <Form.Control
          as="textarea"
          rows={4}
          maxLength={DETALLE_MAX}
          value={detalle}
          onChange={(evento) => setDetalle(evento.target.value)}
          placeholder="Describí el problema con el mayor detalle posible."
          aria-describedby={contadorId}
        />
        <Form.Text id={contadorId} className="text-muted">
          {detalle.length}/{DETALLE_MAX} caracteres (mínimo {DETALLE_MIN})
        </Form.Text>
      </Form.Group>

      <div className="d-flex justify-content-end gap-2 mt-3">
        {onCancelar && (
          <Button
            variant="outline-secondary"
            className="rounded-pill px-4"
            onClick={onCancelar}
            disabled={enviando}
          >
            Cancelar
          </Button>
        )}
        <Button
          type="submit"
          className="rounded-pill px-4"
          disabled={enviando}
        >
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
            'Enviar reclamo'
          )}
        </Button>
      </div>
    </Form>
  );
};

FormularioQueja.propTypes = {
  pedidoId: PropTypes.oneOfType([PropTypes.number, PropTypes.string])
    .isRequired,
  onGuardada: PropTypes.func.isRequired,
  onCancelar: PropTypes.func,
};

export default FormularioQueja;

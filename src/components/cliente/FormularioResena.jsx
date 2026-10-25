/**
 * Propósito: Formulario para crear o editar la reseña de un producto.
 * Contenido: Estrellas interactivas (1-5), comentario opcional y acciones.
 * Dependencias: react-bootstrap (Form, Button, Alert, Spinner), Estrellas.
 * Uso: <FormularioResena producto={producto} resena={resena} onGuardada={fn} />
 */

import { useId, useState } from 'react';
import PropTypes from 'prop-types';
import { Alert, Button, Form, Spinner } from 'react-bootstrap';
import Estrellas from './Estrellas';
import { actualizarResena, crearResena } from '../../api/resenas';

const MAX_COMENTARIO = 500;

const FormularioResena = ({ producto, resena, onGuardada, onCancelar }) => {
  const campoComentarioId = useId();
  const contadorId = useId();
  const [puntuacion, setPuntuacion] = useState(
    Number(resena?.puntuacion) || 0
  );
  const [comentario, setComentario] = useState(resena?.comentario || '');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');

  const alEnviar = async (evento) => {
    evento.preventDefault();
    if (!puntuacion) {
      setError('Elegí una puntuación de 1 a 5 estrellas.');
      return;
    }

    setEnviando(true);
    setError('');
    const datos = { puntuacion, comentario: comentario.trim() };
    const resultado = resena
      ? await actualizarResena(resena.id, datos)
      : await crearResena({ productoId: producto.id, ...datos });
    setEnviando(false);

    if (!resultado.success) {
      setError(resultado.error || 'No se pudo guardar la reseña.');
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

      <fieldset className="mb-3 border-0 p-0">
        <legend className="form-label fw-semibold float-none w-auto">
          Tu puntuación
        </legend>
        <Estrellas
          valor={puntuacion}
          onChange={setPuntuacion}
          etiqueta="Puntuación de 1 a 5 estrellas"
        />
      </fieldset>

      <Form.Group className="mb-2" controlId={campoComentarioId}>
        <Form.Label className="fw-semibold">
          Comentario{' '}
          <span className="text-muted fw-normal small">(opcional)</span>
        </Form.Label>
        <Form.Control
          as="textarea"
          rows={4}
          maxLength={MAX_COMENTARIO}
          value={comentario}
          onChange={(evento) => setComentario(evento.target.value)}
          placeholder="Contá qué te pareció el producto…"
          aria-describedby={contadorId}
        />
        <Form.Text id={contadorId} className="text-muted">
          {comentario.length}/{MAX_COMENTARIO} caracteres
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
          disabled={enviando || !puntuacion}
        >
          {enviando ? (
            <>
              <Spinner
                animation="border"
                size="sm"
                className="me-2"
                aria-hidden="true"
              />
              Guardando…
            </>
          ) : resena ? (
            'Guardar cambios'
          ) : (
            'Publicar reseña'
          )}
        </Button>
      </div>
    </Form>
  );
};

FormularioResena.propTypes = {
  producto: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
    nombre: PropTypes.string,
  }).isRequired,
  resena: PropTypes.shape({
    id: PropTypes.number.isRequired,
    puntuacion: PropTypes.number,
    comentario: PropTypes.string,
  }),
  onGuardada: PropTypes.func.isRequired,
  onCancelar: PropTypes.func,
};

export default FormularioResena;

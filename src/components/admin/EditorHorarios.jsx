/**
 * Propósito: Editor de horarios de atención por día para una sucursal.
 * Contenido: Componente EditorHorarios con una fila por día de la semana
 *            (lunes a domingo), una o más franjas por día, alta/baja de franjas,
 *            copia del horario de un día al resto y avisos en espejo del
 *            backend (hora inválida, franja repetida, franja más corta que el
 *            margen de cierre).
 * Dependencias: react-bootstrap (Form, Button, Badge), react-icons/fa,
 *               utils/horarios.js.
 * Uso: <EditorHorarios horarios={horarios} onChange={setHorarios} margenMinutos={30} />
 *
 * El horario que se edita es el del LOCAL (apertura y cierre reales). El corte
 * de pedidos que se muestra al costado se deriva restando el margen global
 * (`margenCierreMinutos`): el backend hace el mismo cálculo al evaluar si la
 * sucursal está tomando pedidos.
 */

import { Form, Button, Badge } from 'react-bootstrap';
import { FaPlus, FaTrashAlt, FaCopy } from 'react-icons/fa';
import PropTypes from 'prop-types';
import {
  corteDePedidos,
  cruzaMedianoche,
  formatearHorarios,
  validarHorarios,
} from '../../utils/horarios';

const EditorHorarios = ({
  horarios = [],
  onChange,
  margenMinutos = 0,
  deshabilitado = false,
}) => {
  const { errores } = validarHorarios(horarios, margenMinutos);

  const erroresDeDia = (diaSemana) =>
    errores.filter((error) => error.diaSemana === diaSemana);

  const actualizar = (diaSemana, franjas) => {
    onChange(
      horarios.map((dia) =>
        dia.diaSemana === diaSemana ? { ...dia, franjas } : dia,
      ),
    );
  };

  const agregarFranja = (dia) => {
    actualizar(dia.diaSemana, [
      ...dia.franjas,
      { apertura: '10:00', cierre: '23:00' },
    ]);
  };

  const quitarFranja = (dia, indice) => {
    actualizar(
      dia.diaSemana,
      dia.franjas.filter((_, posicion) => posicion !== indice),
    );
  };

  const cambiarFranja = (dia, indice, campo, valor) => {
    actualizar(
      dia.diaSemana,
      dia.franjas.map((franja, posicion) =>
        posicion === indice ? { ...franja, [campo]: valor } : franja,
      ),
    );
  };

  const copiarATodos = (dia) => {
    onChange(
      horarios.map((otro) => ({
        ...otro,
        franjas: dia.franjas.map((franja) => ({ ...franja })),
      })),
    );
  };

  return (
    <div className="mb-4">
      <div className="d-flex flex-wrap justify-content-between align-items-baseline gap-2 mb-1">
        <Form.Label className="mb-0">Horario de atención *</Form.Label>
        <span className="text-muted small">
          {Number(margenMinutos) > 0
            ? `Se dejan de tomar pedidos ${margenMinutos} min antes del cierre`
            : 'Sin margen: se toma pedidos hasta el cierre'}
        </span>
      </div>

      {horarios.map((dia) => {
        const erroresDia = erroresDeDia(dia.diaSemana);
        return (
          <div key={dia.diaSemana} className="border rounded p-2 mb-2">
            <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-1">
              <strong>{dia.dia}</strong>
              <div className="d-flex flex-wrap gap-2">
                {dia.franjas.length === 0 ? (
                  <Badge bg="secondary">Cerrado</Badge>
                ) : null}
                {dia.franjas.length > 0 ? (
                  <Button
                    type="button"
                    variant="outline-secondary"
                    size="sm"
                    onClick={() => copiarATodos(dia)}
                    disabled={deshabilitado}
                    title={`Copiar el horario del ${dia.dia.toLowerCase()} a todos los días`}
                  >
                    <FaCopy className="me-1" aria-hidden="true" />
                    Copiar a todos
                  </Button>
                ) : null}
                <Button
                  type="button"
                  variant="outline-primary"
                  size="sm"
                  onClick={() => agregarFranja(dia)}
                  disabled={deshabilitado}
                >
                  <FaPlus className="me-1" aria-hidden="true" />
                  Agregar franja
                </Button>
              </div>
            </div>

            {dia.franjas.length === 0 ? (
              <p className="text-muted small mb-0">
                Sin franjas: la sucursal no toma pedidos este día.
              </p>
            ) : (
              dia.franjas.map((franja, indice) => {
                const corte = corteDePedidos(franja.cierre, margenMinutos);
                const cruza = cruzaMedianoche(franja);
                return (
                  <div
                    /* eslint-disable-next-line react/no-array-index-key */
                    key={indice}
                    className="d-flex flex-wrap align-items-center gap-2 mb-1"
                  >
                    <Form.Control
                      type="time"
                      value={franja.apertura}
                      onChange={(e) =>
                        cambiarFranja(dia, indice, 'apertura', e.target.value)
                      }
                      disabled={deshabilitado}
                      aria-label={`Apertura del ${dia.dia.toLowerCase()}`}
                      style={{ maxWidth: '140px' }}
                    />
                    <span className="text-muted">a</span>
                    <Form.Control
                      type="time"
                      value={franja.cierre}
                      onChange={(e) =>
                        cambiarFranja(dia, indice, 'cierre', e.target.value)
                      }
                      disabled={deshabilitado}
                      aria-label={`Cierre del ${dia.dia.toLowerCase()}`}
                      style={{ maxWidth: '140px' }}
                    />
                    {corte ? (
                      <span className="small text-muted">
                        Pedidos hasta {corte}
                      </span>
                    ) : null}
                    {cruza ? (
                      <Badge bg="light" text="dark">
                        Cruza medianoche
                      </Badge>
                    ) : null}
                    <Button
                      type="button"
                      variant="outline-danger"
                      size="sm"
                      className="ms-auto"
                      onClick={() => quitarFranja(dia, indice)}
                      disabled={deshabilitado}
                      aria-label={`Quitar la franja ${indice + 1} del ${dia.dia.toLowerCase()}`}
                    >
                      <FaTrashAlt aria-hidden="true" />
                    </Button>
                  </div>
                );
              })
            )}

            {erroresDia.length > 0 ? (
              <ul className="text-danger small mb-0 ps-3">
                {erroresDia.map((error, indice) => (
                  <li key={`${error.mensaje}-${indice}`}>{error.mensaje}</li>
                ))}
              </ul>
            ) : null}
          </div>
        );
      })}

      <p className="text-muted small mb-0">
        <strong>Resumen:</strong> {formatearHorarios(horarios) || 'Sin horario'}
      </p>
    </div>
  );
};

EditorHorarios.propTypes = {
  /** Horario editable: los siete días con sus franjas (utils/horarios). */
  horarios: PropTypes.arrayOf(
    PropTypes.shape({
      diaSemana: PropTypes.number.isRequired,
      franjas: PropTypes.arrayOf(
        PropTypes.shape({
          apertura: PropTypes.string,
          cierre: PropTypes.string,
        }),
      ).isRequired,
    }),
  ),
  /** Recibe el horario completo cada vez que cambia una franja. */
  onChange: PropTypes.func.isRequired,
  /** Margen global de cierre, para mostrar el corte de pedidos. */
  margenMinutos: PropTypes.number,
  deshabilitado: PropTypes.bool,
};

export default EditorHorarios;

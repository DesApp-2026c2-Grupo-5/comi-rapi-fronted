/**
 * Propósito: Bloque de selección de coincidencias territoriales (iteración 3,
 *            extraído como compartido en la iteración 4): radios con las
 *            identidades que devolvió Georef y botón para re-verificar con
 *            la opción elegida.
 * Contenido: Componente presentacional puro; la lógica vive en
 *            useDireccionTerritorial (única fuente).
 * Dependencias: react-bootstrap (Form, Button), react-icons/fa.
 * Uso: <OpcionesDireccionAmbigua opciones={...} opcionElegida={...}
 *        onElegir={fn} onConfirmar={fn} />
 */

import { Form, Button } from 'react-bootstrap';
import { FaCheck } from 'react-icons/fa';

const OpcionesDireccionAmbigua = ({
  opciones = [],
  opcionElegida = '',
  onElegir,
  onConfirmar,
  name = 'opciones-direccion',
}) => (
  <Form.Group className="mb-4">
    <Form.Label className="fw-semibold">
      La dirección coincide con varias ubicaciones. ¿Cuál es la correcta?
    </Form.Label>
    {opciones.map((opcion) => (
      <Form.Check
        key={opcion.nomenclatura}
        type="radio"
        id={`opcion-${name}-${opcion.nomenclatura}`}
        name={name}
        label={opcion.nomenclatura}
        checked={opcionElegida === opcion.nomenclatura}
        onChange={() => onElegir && onElegir(opcion.nomenclatura)}
        className="mb-1"
      />
    ))}
    <div className="d-grid mt-2">
      <Button
        variant="primary"
        type="button"
        disabled={!opcionElegida}
        onClick={onConfirmar}
      >
        <FaCheck className="me-1" aria-hidden="true" />
        Verificar con la opción seleccionada
      </Button>
    </div>
  </Form.Group>
);

export default OpcionesDireccionAmbigua;

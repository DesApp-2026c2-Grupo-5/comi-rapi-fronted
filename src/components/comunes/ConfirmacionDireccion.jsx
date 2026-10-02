/**
 * Propósito: Tarjeta de confirmación de la dirección resuelta (iteración 3,
 *            extraída como compartida en la iteración 4): muestra la
 *            nomenclatura y coordenadas que obtuvo Georef y los botones para
 *            guardar o volver a editar.
 * Contenido: Componente presentacional puro; la lógica vive en
 *            useDireccionTerritorial (única fuente).
 * Dependencias: react-bootstrap (Alert, Button), react-icons/fa.
 * Uso: <ConfirmacionDireccion resultado={...} textoConfirmar="Guardar dirección"
 *        onConfirmar={fn} onEditar={fn} />
 */

import { Alert, Button } from 'react-bootstrap';
import { FaSave, FaEdit } from 'react-icons/fa';

const ConfirmacionDireccion = ({
  resultado,
  textoConfirmar = 'Guardar',
  onConfirmar,
  onEditar,
}) => {
  if (!resultado) {
    return null;
  }
  return (
    <Alert variant="success" role="status" className="mb-4">
      <div className="fw-semibold mb-1">Confirmá la dirección</div>
      <div>{resultado.nomenclatura}</div>
      <div className="text-muted small mt-1">
        Coordenadas: {Number(resultado.latitud).toFixed(5)}
        {' / '}
        {Number(resultado.longitud).toFixed(5)}
      </div>
      <div className="d-flex gap-2 mt-3">
        <Button variant="primary" className="rounded-pill px-4" onClick={onConfirmar}>
          <FaSave className="me-1" aria-hidden="true" />
          {textoConfirmar}
        </Button>
        <Button
          variant="outline-secondary"
          className="rounded-pill px-4"
          onClick={onEditar}
        >
          <FaEdit className="me-1" aria-hidden="true" />
          Editar datos
        </Button>
      </div>
    </Alert>
  );
};

export default ConfirmacionDireccion;

/**
 * Propósito: Ficha de confirmación de la dirección validada (iteración 6):
 *            resumen estructurado de los datos relevantes ANTES de guardar —
 *            provincia, partido/comuna, localidad, calle + altura, código
 *            postal (solo cuando existe: Georef no lo provee) y referencia
 *            (solo si fue ingresada) — más el badge de validación, la
 *            sucursal que atiende (cuando se validó cobertura), la
 *            nomenclatura oficial de Georef como referencia y las
 *            coordenadas. Botones: guardar (deshabilitado mientras dura el
 *            guardado — anti doble-submit) y editar.
 * Contenido: Componente presentacional puro; la lógica vive en
 *            useDireccionTerritorial (única fuente). La confirmación NO
 *            reemplaza la validación del backend: el alta re-valida todo.
 * Dependencias: react-bootstrap (Alert, Button), react-icons/fa.
 * Uso: <ConfirmacionDireccion resultado={...} cobertura={...} altura={...}
 *        codigoPostal={...} referencia={...} cargando={false}
 *        textoConfirmar="Guardar dirección" onConfirmar={fn} onEditar={fn} />
 */

import { Alert, Button } from 'react-bootstrap';
import { FaSave, FaEdit, FaStore, FaCheckCircle } from 'react-icons/fa';

const Fila = ({ etiqueta, valor }) => {
  if (valor === undefined || valor === null || String(valor).trim() === '') {
    return null;
  }
  return (
    <div className="dir-form-ficha-fila">
      <span className="dir-form-ficha-etiqueta">{etiqueta}</span>
      <span className="dir-form-ficha-valor">{valor}</span>
    </div>
  );
};

const ConfirmacionDireccion = ({
  resultado,
  cobertura = null,
  altura = null,
  codigoPostal = null,
  referencia = null,
  cargando = false,
  textoConfirmar = 'Guardar',
  onConfirmar,
  onEditar,
}) => {
  if (!resultado) {
    return null;
  }
  const normalizada = resultado.normalizada || {};
  return (
    <Alert variant="success" role="status" className="mb-4 dir-form-confirmacion">
      <div className="d-flex align-items-center gap-2 mb-2 fw-semibold">
        <FaCheckCircle aria-hidden="true" />
        Dirección validada
      </div>

      {/* Ficha de datos relevantes para revisar antes de guardar. */}
      <div className="dir-form-ficha">
        <Fila etiqueta="Calle" valor={normalizada.calle} />
        <Fila etiqueta="Altura" valor={altura} />
        <Fila etiqueta="Partido / Comuna" valor={normalizada.departamento} />
        <Fila etiqueta="Localidad" valor={normalizada.localidad} />
        <Fila etiqueta="Provincia" valor={normalizada.provincia} />
        {/* CP solo cuando existe (dirección persistida en modo edición):
            Georef no provee códigos postales, en el alta queda null. */}
        <Fila etiqueta="Código postal" valor={codigoPostal} />
        <Fila etiqueta="Referencia" valor={referencia} />
      </div>

      {/* Referencia oficial completa de Georef + coordenadas. */}
      <div className="text-muted small mt-2">{resultado.nomenclatura}</div>
      <div className="text-muted small">
        Coordenadas: {Number(resultado.latitud).toFixed(5)}
        {' / '}
        {Number(resultado.longitud).toFixed(5)}
      </div>

      {/* Cobertura validada: la sucursal activa que atiende la dirección. */}
      {cobertura && cobertura.coberturaDisponible && (
        <div className="small mt-2 d-flex align-items-center gap-2">
          <FaStore aria-hidden="true" className="text-success" />
          Te atiende <strong>{cobertura.sucursal?.nombre}</strong> (
          {(cobertura.sucursal?.distanciaMetros / 1000).toFixed(1)} km por
          ruta)
        </div>
      )}

      <div className="d-flex gap-2 mt-3">
        <Button
          variant="primary"
          className="rounded-pill px-4"
          onClick={onConfirmar}
          disabled={cargando}
        >
          <FaSave className="me-1" aria-hidden="true" />
          {cargando ? 'Guardando…' : textoConfirmar}
        </Button>
        <Button
          variant="outline-secondary"
          className="rounded-pill px-4"
          onClick={onEditar}
          disabled={cargando}
        >
          <FaEdit className="me-1" aria-hidden="true" />
          Editar datos
        </Button>
      </div>
    </Alert>
  );
};

export default ConfirmacionDireccion;

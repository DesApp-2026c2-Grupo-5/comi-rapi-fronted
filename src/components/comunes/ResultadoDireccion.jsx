/**
 * Propósito: Presentación UNIFICADA y diferenciada de los resultados del flujo
 *            de direcciones (iteración 6). Reemplaza a la lista de errores
 *            genérica + el Alert de bloqueo separado (evitando estados
 *            contradictorios o duplicados). Un único estado `resultado`
 *            llega de useDireccionTerritorial y se pinta según su tipo:
 *              - 'datos': corregir datos de la dirección (validación/no encontrada).
 *              - 'cobertura-zona': provincia/partido fuera de la zona de operación.
 *              - 'cobertura-sucursal': sin sucursal activa a ≤5 km por ruta
 *                (muestra la distancia de la más cercana cuando está disponible).
 *              - 'tecnico': error temporal de Georef/ORS/backend → Reintentar.
 * Contenido: Componente presentacional puro; la lógica vive en el hook.
 * Dependencias: react-bootstrap (Alert, Button), react-icons/fa.
 * Uso: <ResultadoDireccion resultado={...} resumen={nomenclatura}
 *        onReintentar={fn} onEditar={fn} />
 */

import { Alert, Button } from 'react-bootstrap';
import {
  FaExclamationCircle,
  FaBan,
  FaStore,
  FaSyncAlt,
} from 'react-icons/fa';

const TITULOS = {
  datos: 'Revisá los datos de la dirección',
  'cobertura-zona': 'Todavía no operamos en esa zona',
  'cobertura-sucursal': 'Sin cobertura por el momento',
  tecnico: 'Servicio no disponible',
};

const VARIANTES = {
  datos: 'danger',
  'cobertura-zona': 'warning',
  'cobertura-sucursal': 'warning',
  tecnico: 'secondary',
};

const ICONOS = {
  datos: FaExclamationCircle,
  'cobertura-zona': FaBan,
  'cobertura-sucursal': FaStore,
  tecnico: FaSyncAlt,
};

const ResultadoDireccion = ({ resultado, resumen, onReintentar, onEditar }) => {
  if (!resultado) {
    return null;
  }
  const Icono = ICONOS[resultado.tipo] || FaExclamationCircle;
  const distanciaMetros =
    resultado.detalle && resultado.detalle.sucursal
      ? resultado.detalle.sucursal.distanciaMetros
      : resultado.detalle && resultado.detalle.distanciaMasCercanaMetros;

  return (
    <Alert
      variant={VARIANTES[resultado.tipo] || 'danger'}
      role={resultado.tipo === 'tecnico' ? 'alert' : 'status'}
      className="mb-4 dir-form-resultado"
    >
      <div className="d-flex align-items-center gap-2 mb-1 fw-semibold">
        <Icono aria-hidden="true" />
        {TITULOS[resultado.tipo] || 'Algo salió mal'}
      </div>

      {/* Correcciones de campo (validación acumulada). */}
      {Array.isArray(resultado.items) && resultado.items.length > 0 && (
        <ul className="mb-0 ps-3">
          {resultado.items.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      )}

      {/* Mensaje principal (cuando no hay lista de correcciones). */}
      {!resultado.items && resultado.mensaje && <div>{resultado.mensaje}</div>}

      {/* Cobertura: distancia de la sucursal activa más cercana, cuando el
          backend la expone (preview o detalle del 422 del guardado). */}
      {resultado.tipo === 'cobertura-sucursal' &&
        distanciaMetros !== undefined &&
        distanciaMetros !== null && (
          <div className="small mt-1">
            La sucursal activa más cercana queda a{' '}
            {(distanciaMetros / 1000).toFixed(1)} km por ruta.
          </div>
        )}

      {/* Dirección resuelta como referencia (estados de cobertura). */}
      {resumen && (
        <div className="small text-muted mt-1">{resumen}</div>
      )}

      {/* El error técnico/temporal ofrece reintentar (jamás se presenta como
          "dirección inválida"); los de datos se corrigen editando los campos
          y los de cobertura vuelven a la edición. */}
      {resultado.tipo === 'tecnico' && onReintentar && (
        <Button
          variant="outline-secondary"
          size="sm"
          className="rounded-pill mt-2"
          onClick={onReintentar}
        >
          <FaSyncAlt className="me-1" aria-hidden="true" />
          Reintentar
        </Button>
      )}

      {resultado.tipo.startsWith('cobertura') && onEditar && (
        <Button
          variant="outline-secondary"
          size="sm"
          className="rounded-pill mt-2"
          onClick={onEditar}
        >
          Editar datos
        </Button>
      )}
    </Alert>
  );
};

export default ResultadoDireccion;

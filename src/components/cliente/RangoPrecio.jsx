/**
 * Propósito: Filtro de rango de precio con deslizador doble (C1).
 *            Dos sliders superpuestos que permiten elegir min y max
 *            arrastrando los "pulgares" (thumbs). El rango seleccionado
 *            se resalta en naranja sobre la pista gris.
 * Contenido: Dos <input type="range"> apilados con CSS pointer-events,
 *            pista visual con el rango activo, y display de valores.
 * Dependencias: react (useMemo), react-bootstrap (Button).
 * Uso: <RangoPrecio min={0} max={50000} valorMin={...} valorMax={...}
 *        onChange={(min, max) => ...} />
 */

import PropTypes from "prop-types";
import { Button } from "react-bootstrap";
import { FaTimes } from "react-icons/fa";
import { formatPrice } from "../../utils/formatters";
import "./RangoPrecio.css";

const RangoPrecio = ({ min, max, valorMin, valorMax, onChange }) => {
  // Normaliza los valores de la URL al rango del slider.
  const minActual = Math.max(
    min,
    valorMin !== "" ? Number(valorMin) || min : min,
  );
  const maxActual = Math.min(
    max,
    valorMax !== "" ? Number(valorMax) || max : max,
  );

  const hayFiltro = valorMin !== "" || valorMax !== "";

  const handleMin = (e) => {
    const valor = Number(e.target.value);
    // El thumb izquierdo nunca puede superar al derecho.
    onChange(String(Math.min(valor, maxActual)), valorMax);
  };

  const handleMax = (e) => {
    const valor = Number(e.target.value);
    // El thumb derecho nunca puede ser menor al izquierdo.
    onChange(valorMin, String(Math.max(valor, minActual)));
  };

  const limpiar = () => onChange("", "");

  // Porcentaje del rango resaltado (entre los dos thumbs).
  const rangoTotal = max - min || 1;
  const pctInicio = ((minActual - min) / rangoTotal) * 100;
  const pctFin = ((maxActual - min) / rangoTotal) * 100;

  return (
    <div className="rango-precio">
      <div className="rango-precio-header d-flex align-items-center justify-content-between mb-1">
        <span className="text-muted small">
          {hayFiltro
            ? `${formatPrice(minActual)} — ${formatPrice(maxActual)}`
            : `Precio (${formatPrice(min)} — ${formatPrice(max)})`}
        </span>
        {hayFiltro && (
          <Button
            variant="link"
            size="sm"
            className="rango-precio-limpiar p-0 text-muted"
            onClick={limpiar}
            aria-label="Quitar filtro de precio"
          >
            <FaTimes size={12} aria-hidden="true" className="me-1" />
            Limpiar
          </Button>
        )}
      </div>

      <div className="rango-precio-track-container">
        {/* Pista visual: gris de fondo, naranja el rango seleccionado. */}
        <div className="rango-precio-track" />
        <div
          className="rango-precio-rango"
          style={{ left: `${pctInicio}%`, width: `${pctFin - pctInicio}%` }}
        />

        {/* Dos range inputs superpuestos: solo los thumbs son clickeables. */}
        <input
          type="range"
          className="rango-precio-input rango-precio-input-min"
          min={min}
          max={max}
          step={100}
          value={minActual}
          onChange={handleMin}
          aria-label="Precio mínimo"
        />
        <input
          type="range"
          className="rango-precio-input rango-precio-input-max"
          min={min}
          max={max}
          step={100}
          value={maxActual}
          onChange={handleMax}
          aria-label="Precio máximo"
        />
      </div>
    </div>
  );
};

RangoPrecio.propTypes = {
  min: PropTypes.number.isRequired,
  max: PropTypes.number.isRequired,
  valorMin: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  valorMax: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onChange: PropTypes.func.isRequired,
};

export default RangoPrecio;

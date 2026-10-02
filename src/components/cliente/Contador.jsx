/**
 * Propósito: Contador "− cantidad +" reutilizable para elegir cantidades de extras,
 *            acompañamientos, condimentos y unidades.
 * Contenido: Grupo con etiqueta, botón de restar, valor y botón de sumar.
 * Dependencias: react-bootstrap (Button). Estilos en ProductoPersonalizarModal.css.
 * Uso: <Contador etiqueta="Queso extra" valor={n} max={3} onCambiar={fn} />
 *
 * Existe como componente porque el mismo control estaba copiado en cinco lugares
 * (unidades, extras, "sin X", acompañamientos y condimentos). Centralizarlo es lo
 * que garantiza que los cinco tengan nombre accesible, límites correctos y el
 * mismo tamaño táctil; si se copia, uno de los cinco se queda sin `aria-label`.
 */

import { Button } from 'react-bootstrap';

/* El proyecto no usa PropTypes en ningún componente. */
/* eslint-disable react/prop-types */
const Contador = ({ etiqueta, valor = 0, min = 0, max = 1, onCambiar, className = '' }) => {
  const puedeRestar = valor > min;
  const puedeSumar = valor < max;

  return (
    <div className={`contador ${className}`.trim()}>
      {/* `role="group"` + `aria-label` para que el lector de pantalla anuncie a
          qué opción pertenece cada par de botones al tabular. */}
      <div className="pill-control" role="group" aria-label={etiqueta}>
        <Button
          type="button"
          variant="light"
          className="contador-boton"
          onClick={() => onCambiar(-1)}
          disabled={!puedeRestar}
          aria-label={`Quitar ${etiqueta}`}
        >
          <span aria-hidden="true">−</span>
        </Button>
        {/* `aria-live` + `role="status"`: el resultado del último clic se anuncia
            solo. Con el foco puesto en el botón, el cambio en el texto vecino no
            se lee, así que sin esto nadie se entera de que la cantidad cambió. */}
        <span className="contador-valor" role="status" aria-live="polite" aria-atomic="true">
          {valor}
        </span>
        <Button
          type="button"
          variant="light"
          className="contador-boton"
          onClick={() => onCambiar(1)}
          disabled={!puedeSumar}
          aria-label={`Agregar ${etiqueta}`}
        >
          <span aria-hidden="true">+</span>
        </Button>
      </div>
    </div>
  );
};
/* eslint-enable react/prop-types */

export default Contador;
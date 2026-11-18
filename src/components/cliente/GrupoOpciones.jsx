/**
 * Propósito: Render de una lista de opciones de personalización con su control
 *            de cantidad (contador o checkbox).
 * Contenido: GrupoOpciones; por cada opción decide el control según `control`.
 * Dependencias: react-bootstrap (Form), formatters, Contador. Estilos en
 *            ProductoPersonalizarModal.css.
 * Uso: <GrupoOpciones opciones={...} valores={...} onCambiar={...} conPrecio />
 *
 * El control lo decide quien llama: `"contador"` (cantidad, por defecto) o
 * `"checkbox"` (decisión de sí/no, como quitar un ingrediente). Antes existía un
 * modo `"auto"` que elegía según el máximo, pero un extra de una sola unidad
 * también se lee mejor como contador: la cantidad queda explícita y el gesto no
 * cambia entre una opción y otra.
 */

import { Form } from 'react-bootstrap';
import { formatPrice } from '../../utils/formatters';
import Contador from './Contador';

/* El proyecto no usa PropTypes en ningún componente. */
/* eslint-disable react/prop-types */
const GrupoOpciones = ({
  opciones,
  valores,
  onCambiar,
  conPrecio,
  control = 'contador',
}) => {
  return (
    <div className="grupo-opciones">
      <div className="card-comi-grupo">
        {opciones.map((op) => {
          const key = op.id || op;
          const nombre = op.nombre || op;
          const precio = op.precio;
          const minimo = op.minimo ?? 0;
          const maximo = op.maximo ?? 1;
          const cantidad = valores[key] || 0;
          // "Agotado" = no queda stock en ninguna sucursal activa. La opción
          // sigue visible para que el cliente entienda que existe, pero no se
          // puede elegir.
          const agotado = Boolean(op.agotado);
          // `control` decide la fila: "checkbox" para sí/no, "contador" para
          // cantidades (default).
          const usaCheckbox = control === 'checkbox';
          const obligatorio = minimo >= 1;
          const etiqueta = (
            <span className="small d-flex flex-column">
              <span className={agotado ? 'text-muted' : undefined}>
                {nombre}
                {conPrecio && precio ? ` (+ ${formatPrice(precio)})` : ''}
              </span>
              {agotado && <span className="texto-agotado">Agotado</span>}
            </span>
          );

          if (usaCheckbox) {
            return (
              <Form.Check
                key={key}
                type="checkbox"
                id={`opcion-${key}`}
                className={`fila-opcion fila-opcion-check${
                  agotado ? ' fila-opcion-agotada' : ''
                }`}
                label={etiqueta}
                checked={cantidad > 0 || obligatorio}
                disabled={agotado || obligatorio}
                onChange={(e) =>
                  onCambiar(
                    key,
                    (e.target.checked ? 1 : 0) - cantidad,
                    minimo,
                    maximo
                  )
                }
                aria-disabled={agotado || undefined}
              />
            );
          }

          return (
            <div
              key={key}
              className={`fila-opcion${agotado ? ' fila-opcion-agotada' : ''}`}
              aria-disabled={agotado || undefined}
            >
              {etiqueta}
              {!agotado && (
                <Contador
                  etiqueta={nombre}
                  valor={cantidad}
                  min={minimo}
                  max={maximo}
                  onCambiar={(d) => onCambiar(key, d, minimo, maximo)}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
/* eslint-enable react/prop-types */

export default GrupoOpciones;

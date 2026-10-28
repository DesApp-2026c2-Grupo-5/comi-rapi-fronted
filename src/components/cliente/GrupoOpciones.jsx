import { formatPrice } from '../../utils/formatters';
import Contador from './Contador';

/* El proyecto no usa PropTypes en ningún componente. */
/* eslint-disable react/prop-types */
const GrupoOpciones = ({ opciones, valores, onCambiar, conPrecio }) => {
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
          return (
            <div
              key={key}
              className={`fila-opcion${agotado ? ' fila-opcion-agotada' : ''}`}
              aria-disabled={agotado || undefined}
            >
              <span className="small d-flex flex-column">
                <span className={agotado ? 'text-muted' : undefined}>
                  {nombre}
                  {conPrecio && precio ? ` (+ ${formatPrice(precio)})` : ''}
                </span>
                {agotado && (
                  <span className="texto-agotado">Agotado</span>
                )}
              </span>
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

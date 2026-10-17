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
          return (
            <div key={key} className="fila-opcion">
              <span className="small">
                {nombre}
                {conPrecio && precio ? ` (+ ${formatPrice(precio)})` : ''}
              </span>
              <Contador
                etiqueta={nombre}
                valor={cantidad}
                min={minimo}
                max={maximo}
                onCambiar={(d) => onCambiar(key, d, minimo, maximo)}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};
/* eslint-enable react/prop-types */

export default GrupoOpciones;

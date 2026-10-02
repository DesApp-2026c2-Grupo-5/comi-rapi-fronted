import { formatPrice } from '../../utils/formatters';
import Contador from './Contador';

/* El proyecto no usa PropTypes en ningún componente. */
/* eslint-disable react/prop-types */
const GrupoOpciones = ({ opciones, valores, onCambiar, conPrecio, limite }) => {
  return (
    <div className="grupo-opciones">
      <p className="fw-bold small mb-2">Elige entre 0 y {limite}</p>
      <div className="card-comi-grupo">
        {opciones.map((op) => {
          const key = op.id || op;
          const nombre = op.nombre || op;
          const precio = op.precio;
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
                min={0}
                max={limite}
                onCambiar={(d) => onCambiar(key, d)}
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

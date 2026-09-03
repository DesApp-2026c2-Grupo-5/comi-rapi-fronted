import { formatPrice } from '../../utils/formatters';

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
              <span className="pill-control">
                <button type="button" aria-label={`Quitar ${nombre}`} onClick={() => onCambiar(key, -1)}>
                  −
                </button>
                <span>{cantidad}</span>
                <button type="button" aria-label={`Agregar ${nombre}`} onClick={() => onCambiar(key, 1)}>
                  +
                </button>
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default GrupoOpciones;

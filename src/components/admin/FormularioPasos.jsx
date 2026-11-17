import PropTypes from 'prop-types';
import { FaCheck } from 'react-icons/fa';
import './FormularioABM.css';

export const IndicadorPasos = ({ pasos, paso, onPaso }) => (
  <ol className="abm-stepper-pasos" aria-label="Progreso del formulario">
    {pasos.map((item, indice) => {
      const numero = indice + 1;
      const activo = paso === numero;
      const completado = paso > numero;

      return (
        <li
          key={item.id}
          className={`abm-stepper-paso${activo ? ' activo' : ''}${
            completado ? ' completado' : ''
          }`}
          aria-current={activo ? 'step' : undefined}
        >
          <button
            type="button"
            className="abm-stepper-paso-boton"
            onClick={() => onPaso?.(numero)}
            disabled={numero > paso}
          >
            <span className="abm-stepper-paso-numero">
              {completado ? <FaCheck aria-hidden="true" /> : numero}
            </span>
            <span className="abm-stepper-paso-texto">{item.etiqueta}</span>
          </button>
        </li>
      );
    })}
  </ol>
);

IndicadorPasos.propTypes = {
  pasos: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      etiqueta: PropTypes.string.isRequired,
    })
  ).isRequired,
  paso: PropTypes.number.isRequired,
  onPaso: PropTypes.func,
};

const FormularioPasos = ({ pasos, paso, onPaso, esMobile, children, footer }) => (
  <div className="abm-stepper">
    {esMobile && <IndicadorPasos pasos={pasos} paso={paso} onPaso={onPaso} />}
    <div className="abm-stepper-contenido">{children}</div>
    {esMobile && footer && <div className="abm-stepper-footer">{footer}</div>}
  </div>
);

FormularioPasos.propTypes = {
  pasos: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      etiqueta: PropTypes.string.isRequired,
    })
  ).isRequired,
  paso: PropTypes.number.isRequired,
  onPaso: PropTypes.func,
  esMobile: PropTypes.bool,
  children: PropTypes.node,
  footer: PropTypes.node,
};

export default FormularioPasos;

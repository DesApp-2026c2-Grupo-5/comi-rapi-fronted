/**
 * Propósito: Stepper visual del historial de estados de un pedido, compartido entre
 *            cliente y admin. Los iconos de estados ya alcanzados "se encienden" en
 *            verde, el estado actual late en naranja y los futuros quedan oscurecidos.
 * Contenido: Componente HistorialStepper horizontal con iconos react-icons y conectores.
 * Dependencias: react-icons/fa, services/estadosPedido.js, utils/constants.js,
 *               HistorialStepper.css.
 * Uso: <HistorialStepper pedido={pedido} />               (solo lectura, cliente)
 *      <HistorialStepper pedido={pedido} onCambiar={fn} /> (admin, el siguiente estado se
 *                                                           muestra clicable y avanza al clic)
 */

import { Fragment } from 'react';
import {
  FaClock,
  FaCheckCircle,
  FaFire,
  FaBox,
  FaMotorcycle,
  FaFlagCheckered,
  FaTimesCircle,
} from 'react-icons/fa';
import { obtenerEstadosSiguientes } from '../../services/estadosPedido';
import {
  ESTADOS_PEDIDO,
  ESTADOS_VISIBLES_CLIENTE,
  ETIQUETAS_ESTADO_PEDIDO,
} from '../../utils/constants';
import './HistorialStepper.css';

// Icono grande por estado (react-icons)
const ICONO_ESTADO = {
  [ESTADOS_PEDIDO.PENDIENTE]: FaClock,
  [ESTADOS_PEDIDO.CONFIRMADO]: FaCheckCircle,
  [ESTADOS_PEDIDO.EN_PREPARACION]: FaFire,
  [ESTADOS_PEDIDO.LISTO_PARA_ENTREGAR]: FaBox,
  [ESTADOS_PEDIDO.EN_CAMINO]: FaMotorcycle,
  [ESTADOS_PEDIDO.ENTREGADO]: FaFlagCheckered,
  [ESTADOS_PEDIDO.CANCELADO]: FaTimesCircle,
};

// Orden visual del flujo principal (sin cancelado, que es un nodo especial)
const FLUJO_ESTADOS = ESTADOS_VISIBLES_CLIENTE.filter((e) => e !== ESTADOS_PEDIDO.CANCELADO);

// Formatea fecha y hora (dd/mm/aaaa hh:mm)
const formatFechaHora = (fecha) => {
  return new Intl.DateTimeFormat('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(fecha));
};

const HistorialStepper = ({ pedido, onCambiar }) => {
  const estadosSiguientes = obtenerEstadosSiguientes(pedido.estado);
  const esCancelado = pedido.estado === ESTADOS_PEDIDO.CANCELADO;

  // Índice alcanzado dentro del flujo (si está cancelado, hasta dónde llegó antes)
  let alcanzado = FLUJO_ESTADOS.indexOf(pedido.estado);
  if (esCancelado) {
    const ultimoEnFlujo = [...(pedido.historialEstados || [])]
      .reverse()
      .find((h) => FLUJO_ESTADOS.includes(h.estado));
    alcanzado = ultimoEnFlujo ? FLUJO_ESTADOS.indexOf(ultimoEnFlujo.estado) : -1;
  }

  // Próximo estado principal (el primer siguiente que pertenece al flujo)
  const principal = estadosSiguientes.find((e) => FLUJO_ESTADOS.includes(e)) || null;
  const puedeCancelar = estadosSiguientes.includes(ESTADOS_PEDIDO.CANCELADO);
  const mostrarCancelado = esCancelado || puedeCancelar;

  const fechaDe = (estado) => {
    const registro = (pedido.historialEstados || []).find((h) => h.estado === estado);
    return registro ? formatFechaHora(registro.fecha) : null;
  };

  // Clase según la posición en el flujo
  const claseDe = (idx) => {
    if (esCancelado) return idx <= alcanzado ? 'estado-step completado' : 'estado-step futuro';
    if (idx < alcanzado) return 'estado-step completado';
    if (idx === alcanzado) return 'estado-step actual';
    return 'estado-step futuro';
  };

  const renderNodo = (estado, idx) => {
    const Icono = ICONO_ESTADO[estado];
    const clase = claseDe(idx);
    const clickeable = Boolean(onCambiar) && !esCancelado && principal === estado;
    const titulo = `${ETIQUETAS_ESTADO_PEDIDO[estado] || estado}${
      fechaDe(estado) ? ` - ${fechaDe(estado)}` : ''
    }`;

    const contenido = (
      <>
        <Icono className="estado-step-icono" aria-hidden="true" />
        <span className="estado-step-etiqueta">{ETIQUETAS_ESTADO_PEDIDO[estado] || estado}</span>
      </>
    );

    if (clickeable && onCambiar) {
      return (
        <button
          key={estado}
          type="button"
          className={`${clase} clickeable`}
          title={`${titulo} - clic para avanzar`}
          onClick={() => onCambiar(estado)}
        >
          {contenido}
        </button>
      );
    }
    return (
      <div key={estado} className={clase} title={titulo}>
        {contenido}
      </div>
    );
  };

  return (
    <div className="historial-stepper">
      {FLUJO_ESTADOS.map((estado, idx) => (
        <Fragment key={estado}>
          {renderNodo(estado, idx)}
          {idx < FLUJO_ESTADOS.length - 1 && (
            <span
              className={`historial-conector ${idx < alcanzado ? 'activo' : ''}`}
              aria-hidden="true"
            />
          )}
        </Fragment>
      ))}

      {/* Nodo especial de cancelado (al final del flujo) */}
      {mostrarCancelado && (
        <Fragment key="cancelado-node">
          <span
            className={`historial-conector ${esCancelado ? 'riesgo' : ''}`}
            aria-hidden="true"
          />
          {esCancelado || !puedeCancelar || !onCambiar ? (
            <div
              className="estado-step cancelado"
              title={`Cancelado${
                fechaDe(ESTADOS_PEDIDO.CANCELADO)
                  ? ` - ${fechaDe(ESTADOS_PEDIDO.CANCELADO)}`
                  : ''
              }`}
            >
              <FaTimesCircle className="estado-step-icono" aria-hidden="true" />
              <span className="estado-step-etiqueta">Cancelado</span>
            </div>
          ) : (
            <button
              type="button"
              className="estado-step cancelado clickeable"
              title="Cancelar pedido - clic para cancelar"
              onClick={() => onCambiar && onCambiar(ESTADOS_PEDIDO.CANCELADO)}
            >
              <FaTimesCircle className="estado-step-icono" aria-hidden="true" />
              <span className="estado-step-etiqueta">Cancelar</span>
            </button>
          )}
        </Fragment>
      )}
    </div>
  );
};

export default HistorialStepper;
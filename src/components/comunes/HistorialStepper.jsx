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
 *      <HistorialStepper pedido={pedido} sinNodoCancelado /> (oculta el estado Cancelado;
 *                                                           MisPedidos muestra su propio mensaje)
 *      <HistorialStepper pedido={pedido} sinNodoPendiente /> (oculta el nodo PENDIENTE;
 *                                                           el admin no lo muestra)
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
import { formatDateTime } from '../../utils/formatters';
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

const HistorialStepper = ({
  pedido,
  onCambiar,
  sinNodoCancelado = false,
  sinNodoPendiente = false,
}) => {
  const estadosSiguientes = obtenerEstadosSiguientes(pedido.estado);
  const esCancelado = pedido.estado === ESTADOS_PEDIDO.CANCELADO;

  // Flujo visual efectivo según la variante (el admin no muestra PENDIENTE)
  const flujoEstados = sinNodoPendiente
    ? FLUJO_ESTADOS.filter((e) => e !== ESTADOS_PEDIDO.PENDIENTE)
    : FLUJO_ESTADOS;

  // Índice alcanzado dentro del flujo (si está cancelado, hasta dónde llegó antes)
  let alcanzado = flujoEstados.indexOf(pedido.estado);
  if (esCancelado) {
    const ultimoEnFlujo = [...(pedido.historialEstados || [])]
      .reverse()
      .find((h) => flujoEstados.includes(h.estado));
    alcanzado = ultimoEnFlujo ? flujoEstados.indexOf(ultimoEnFlujo.estado) : -1;
  }

  // Próximo estado principal (el primer siguiente que pertenece al flujo)
  const principal = estadosSiguientes.find((e) => flujoEstados.includes(e)) || null;
  const puedeCancelar = estadosSiguientes.includes(ESTADOS_PEDIDO.CANCELADO);
  const mostrarCancelado = esCancelado || puedeCancelar;

  const fechaDe = (estado) => {
    const registro = (pedido.historialEstados || []).find((h) => h.estado === estado);
    return registro ? formatDateTime(registro.fecha) : null;
  };

  // Clase según la posición en el flujo
  const claseDe = (idx) => {
    if (esCancelado) return idx <= alcanzado ? 'estado-step completado' : 'estado-step futuro';
    if (idx < alcanzado) return 'estado-step completado';
    if (idx === alcanzado) return 'estado-step actual';
    return 'estado-step futuro';
  };

  // Descripción accesible de un nodo. La fecha va en el texto, no en `title`:
  // un tooltip no lo anuncia un lector de pantalla ni se alcanza con el teclado.
  const descripcionDe = (estado, { accion } = {}) => {
    const etiqueta = ETIQUETAS_ESTADO_PEDIDO[estado] || estado;
    const fecha = fechaDe(estado);
    const partes = [etiqueta];
    if (fecha) partes.push(fecha);
    if (accion) partes.push(accion);
    return partes.join(', ');
  };

  const renderNodo = (estado, idx) => {
    const Icono = ICONO_ESTADO[estado];
    const clase = claseDe(idx);
    const clickeable = Boolean(onCambiar) && !esCancelado && principal === estado;
    // `aria-current="step"` marca dónde está el pedido hoy dentro del flujo.
    const esActual = !esCancelado && idx === alcanzado;
    const titulo = descripcionDe(estado);

    const contenido = (
      <>
        <Icono className="estado-step-icono" aria-hidden="true" />
        <span className="estado-step-etiqueta">{ETIQUETAS_ESTADO_PEDIDO[estado] || estado}</span>
        {fechaDe(estado) && (
          <span className="visually-hidden">{`, ${fechaDe(estado)}`}</span>
        )}
      </>
    );

    if (clickeable && onCambiar) {
      return (
        <li key={estado} className="historial-step-item">
          <button
            type="button"
            className={`${clase} clickeable`}
            aria-label={descripcionDe(estado, { accion: 'clic para avanzar' })}
            aria-current={esActual ? 'step' : undefined}
            title={`${titulo} - clic para avanzar`}
            onClick={() => onCambiar(estado)}
          >
            {contenido}
          </button>
        </li>
      );
    }
    return (
      <li key={estado} className="historial-step-item">
        <div
          className={clase}
          aria-current={esActual ? 'step' : undefined}
          title={titulo}
        >
          {contenido}
        </div>
      </li>
    );
  };

  return (
    // <ol> porque es una secuencia ordenada de estados: el lector de pantalla
    // anuncia "elemento 3 de 7" y el orden tiene significado.
    <ol className="historial-stepper">
      {flujoEstados.map((estado, idx) => (
        <Fragment key={estado}>
          {renderNodo(estado, idx)}
          {idx < flujoEstados.length - 1 && (
            <li className="historial-conector-item" aria-hidden="true">
              <span
                className={`historial-conector ${idx < alcanzado ? 'activo' : ''}`}
                aria-hidden="true"
              />
            </li>
          )}
        </Fragment>
      ))}

      {/* Nodo especial de cancelado (al final del flujo) */}
      {!sinNodoCancelado && mostrarCancelado && (
        <Fragment key="cancelado-node">
          <li className="historial-conector-item" aria-hidden="true">
            <span
              className={`historial-conector ${esCancelado ? 'riesgo' : ''}`}
              aria-hidden="true"
            />
          </li>
          {esCancelado || !puedeCancelar || !onCambiar ? (
            <li className="historial-step-item">
              <div
                className="estado-step cancelado"
                title={descripcionDe(ESTADOS_PEDIDO.CANCELADO)}
              >
                <FaTimesCircle className="estado-step-icono" aria-hidden="true" />
                <span className="estado-step-etiqueta">Cancelado</span>
                {fechaDe(ESTADOS_PEDIDO.CANCELADO) && (
                  <span className="visually-hidden">
                    {`, ${fechaDe(ESTADOS_PEDIDO.CANCELADO)}`}
                  </span>
                )}
              </div>
            </li>
          ) : (
            <li className="historial-step-item">
              <button
                type="button"
                className="estado-step cancelado clickeable"
                aria-label="Cancelar pedido"
                title="Cancelar pedido - clic para cancelar"
                onClick={() => onCambiar && onCambiar(ESTADOS_PEDIDO.CANCELADO)}
              >
                <FaTimesCircle className="estado-step-icono" aria-hidden="true" />
                <span className="estado-step-etiqueta">Cancelar</span>
              </button>
            </li>
          )}
        </Fragment>
      )}
    </ol>
  );
};

export default HistorialStepper;
/**
 * Propósito: Cuenta regresiva hasta el corte de pedidos de una sucursal.
 * Contenido: Componente ContadorCierre, que arranca desde `segundos` (el
 *            `segundosRestantes` que calcula el backend) y avisa cuando llega a
 *            cero.
 * Dependencias: React (useEffect, useRef, useState), utils/horarios.js.
 * Uso:
 *   <ContadorCierre segundos={sucursal.segundosRestantes} onVencido={revalidar} />
 *
 * El deadline se fija al recibir `segundos` y corre en el cliente: no se
 * consulta al backend cada segundo. Es solo un AVISO: el backend revalida el
 * horario al crear el pedido y al confirmar el pago.
 */

import { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { formatearCuentaRegresiva } from '../../utils/horarios';

const ContadorCierre = ({ segundos = 0, onVencido, className = '' }) => {
  const [restantes, setRestantes] = useState(() =>
    Math.max(0, Math.floor(Number(segundos) || 0)),
  );
  // El callback va en un ref para que el intervalo no se recree si el padre
  // pasa una función nueva en cada render.
  const alVencer = useRef(onVencido);
  alVencer.current = onVencido;

  useEffect(() => {
    const total = Math.max(0, Math.floor(Number(segundos) || 0));
    const fin = Date.now() + total * 1000;
    setRestantes(total);
    if (total === 0) {
      return undefined;
    }
    const intervalo = setInterval(() => {
      const quedan = Math.max(0, Math.round((fin - Date.now()) / 1000));
      setRestantes(quedan);
      if (quedan === 0) {
        clearInterval(intervalo);
        if (alVencer.current) alVencer.current();
      }
    }, 1000);
    return () => clearInterval(intervalo);
  }, [segundos]);

  return (
    <span className={className} role="timer" aria-live="off">
      {formatearCuentaRegresiva(restantes)}
    </span>
  );
};

ContadorCierre.propTypes = {
  /** Segundos que informó el backend hasta el corte de pedidos. */
  segundos: PropTypes.number,
  /** Se llama una sola vez cuando la cuenta llega a cero. */
  onVencido: PropTypes.func,
  className: PropTypes.string,
};

export default ContadorCierre;

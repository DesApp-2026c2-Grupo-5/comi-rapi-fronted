/**
 * Propósito: Gráficos propios de los reportes, sin librerías externas.
 * Contenido: GraficoLinea (SVG), GraficoBarras (CSS) y GraficoDonut (CSS).
 * Dependencias: react, react-bootstrap (Badge), utils/constants.
 * Uso: <GraficoLinea filas={porDia} clave="facturacion" ... />
 *
 * Los datos siempre llegan ya agregados por el backend. Cada gráfico incluye
 * texto alternativo y títulos por punto/barra para que la información no
 * dependa solo del color.
 */

/* El proyecto no usa prop-types; se desactiva por archivo como en Skeleton.jsx. */
/* eslint-disable react/prop-types */

import { Badge } from 'react-bootstrap';
import {
  ETIQUETAS_ESTADO_PEDIDO,
  COLOR_ESTADO_PEDIDO,
} from '../../utils/constants';

const ANCHO = 760;
const ALTO = 280;
const MARGEN = { arriba: 18, derecha: 16, abajo: 34, izquierda: 68 };

const numero = (valor) => Number(valor) || 0;

const compacto = new Intl.NumberFormat('es-AR', {
  notation: 'compact',
  maximumFractionDigits: 1,
});

const formatearMonedaCompacta = (valor) => `$${compacto.format(numero(valor))}`;

const diaCorto = (clave) => {
  const [, mes, dia] = String(clave).split('-');
  return `${dia}/${mes}`;
};

/**
 * Serie de facturación (o cualquier métrica) por día.
 * @param {object} props
 * @param {Array<object>} props.filas - Filas con `dia` y la clave numérica.
 * @param {string} props.clave - Campo numérico a graficar.
 * @param {string} props.etiqueta - Nombre de la serie para lectores de pantalla.
 * @param {Function} [props.formatear] - Formato del valor (tooltip/eje).
 */
export const GraficoLinea = ({
  filas,
  clave,
  etiqueta,
  formatear = formatearMonedaCompacta,
}) => {
  const anchoUtil = ANCHO - MARGEN.izquierda - MARGEN.derecha;
  const altoUtil = ALTO - MARGEN.arriba - MARGEN.abajo;
  const valores = filas.map((fila) => numero(fila[clave]));
  const maximo = Math.max(1, ...valores);
  const paso = Math.ceil(maximo / 4);
  const techo = paso * 4;
  const divisorX = Math.max(filas.length - 1, 1);

  const puntos = valores.map((valor, indice) => ({
    x: MARGEN.izquierda + (indice / divisorX) * anchoUtil,
    y: MARGEN.arriba + altoUtil - (valor / techo) * altoUtil,
    valor,
    clave: filas[indice].dia,
  }));

  const linea = puntos
    .map((punto, indice) => `${indice === 0 ? 'M' : 'L'} ${punto.x} ${punto.y}`)
    .join(' ');
  const area = puntos.length
    ? `${linea} L ${puntos[puntos.length - 1].x} ${
        MARGEN.arriba + altoUtil
      } L ${puntos[0].x} ${MARGEN.arriba + altoUtil} Z`
    : '';

  const cadaEtiqueta = Math.max(1, Math.ceil(filas.length / 6));
  const total = valores.reduce((suma, valor) => suma + valor, 0);

  return (
    <figure className="reporte-grafico mb-0">
      <svg
        viewBox={`0 0 ${ANCHO} ${ALTO}`}
        className="reporte-grafico-svg"
        role="img"
        aria-label={`${etiqueta}: ${formatear(total)} en el período`}
      >
        <title>{`${etiqueta} (total ${formatear(total)})`}</title>
        {[0, 1, 2, 3, 4].map((indice) => {
          const valor = (techo / 4) * indice;
          const y = MARGEN.arriba + altoUtil - (valor / techo) * altoUtil;
          return (
            <g key={indice}>
              <line
                x1={MARGEN.izquierda}
                x2={ANCHO - MARGEN.derecha}
                y1={y}
                y2={y}
                className="reporte-grafico-grilla"
              />
              <text
                x={MARGEN.izquierda - 8}
                y={y + 4}
                textAnchor="end"
                className="reporte-grafico-eje"
              >
                {formatear(valor)}
              </text>
            </g>
          );
        })}

        {area ? <path d={area} className="reporte-grafico-area" /> : null}
        {linea ? (
          <path d={linea} className="reporte-grafico-linea" fill="none" />
        ) : null}

        {puntos.map((punto, indice) => (
          <g key={punto.clave}>
            <circle
              cx={punto.x}
              cy={punto.y}
              r="8"
              className="reporte-grafico-punto-hit"
            >
              <title>{`${diaCorto(punto.clave)}: ${formatear(
                punto.valor
              )}`}</title>
            </circle>
            <circle
              cx={punto.x}
              cy={punto.y}
              r="3"
              className="reporte-grafico-punto"
            />
            {indice % cadaEtiqueta === 0 || indice === puntos.length - 1 ? (
              <text
                x={punto.x}
                y={ALTO - 10}
                textAnchor="middle"
                className="reporte-grafico-eje"
              >
                {diaCorto(punto.clave)}
              </text>
            ) : null}
          </g>
        ))}
      </svg>
      <figcaption className="reporte-grafico-pie text-muted small">
        {etiqueta} por día. Pasá el mouse por un punto para ver el detalle.
      </figcaption>
    </figure>
  );
};

/**
 * Barras verticales para series cortas (franja horaria, día de la semana).
 * @param {object} props
 * @param {Array<object>} props.filas - Filas ya ordenadas.
 * @param {string} props.clave - Campo numérico.
 * @param {Function} props.etiqueta - Texto de cada barra.
 * @param {Function} [props.tooltip] - Texto completo de cada barra.
 * @param {number} [props.mostrarCada] - Cada cuántas barras dibujar la etiqueta.
 */
export const GraficoBarras = ({
  filas,
  clave,
  etiqueta,
  tooltip,
  mostrarCada = 1,
}) => {
  const valores = filas.map((fila) => numero(fila[clave]));
  const maximo = Math.max(1, ...valores);

  return (
    <div className="reporte-barras" role="img" aria-label="Gráfico de barras">
      {filas.map((fila, indice) => {
        const valor = valores[indice];
        const alto = valor ? Math.max(6, Math.round((valor / maximo) * 100)) : 2;
        const texto = tooltip ? tooltip(fila) : `${etiqueta(fila)}: ${valor}`;
        return (
          <div className="reporte-barra-item" key={etiqueta(fila)}>
            <div className="reporte-barra-pista">
              <div
                className={`reporte-barra${valor ? '' : ' reporte-barra-vacia'}`}
                style={{ height: `${alto}%` }}
                title={texto}
              >
                <span className="visually-hidden">{texto}</span>
              </div>
            </div>
            <span className="reporte-barra-etiqueta">
              {indice % mostrarCada === 0 ? etiqueta(fila) : '\u00a0'}
            </span>
          </div>
        );
      })}
    </div>
  );
};

/**
 * Donut por estado del pedido, con leyenda y porcentajes.
 * @param {object} props
 * @param {Array<object>} props.filas - Filas con `estado` y `cantidad`.
 */
export const GraficoDonut = ({ filas }) => {
  const visibles = filas.filter((fila) => numero(fila.cantidad) > 0);
  const total = visibles.reduce((suma, fila) => suma + numero(fila.cantidad), 0);
  let acumulado = 0;
  const segmentos = visibles.map((fila) => {
    const inicio = (acumulado / total) * 360;
    acumulado += numero(fila.cantidad);
    const fin = (acumulado / total) * 360;
    const color = COLOR_ESTADO_PEDIDO[fila.estado] || '#adb5bd';
    return `${color} ${inicio}deg ${fin}deg`;
  });

  return (
    <div className="reporte-donut-contenedor">
      <div
        className="reporte-donut"
        style={{
          background: total
            ? `conic-gradient(${segmentos.join(', ')})`
            : '#e9ecef',
        }}
        role="img"
        aria-label={`Distribución de ${total} pedidos por estado`}
      >
        <div className="reporte-donut-centro">
          <strong>{total}</strong>
          <span className="text-muted small">pedidos</span>
        </div>
      </div>
      <ul className="reporte-leyenda list-unstyled mb-0">
        {visibles.map((fila) => {
          const porcentaje = Math.round((numero(fila.cantidad) / total) * 100);
          return (
            <li key={fila.estado} className="reporte-leyenda-item">
              <Badge
                bg=""
                className="reporte-leyenda-color"
                style={{
                  backgroundColor: COLOR_ESTADO_PEDIDO[fila.estado] || '#adb5bd',
                }}
                aria-hidden="true"
              />
              <span className="reporte-leyenda-nombre">
                {ETIQUETAS_ESTADO_PEDIDO[fila.estado] || fila.estado}
              </span>
              <span className="reporte-leyenda-valor">
                {fila.cantidad} · {porcentaje}%
              </span>
            </li>
          );
        })}
        {visibles.length === 0 ? (
          <li className="text-muted small">Sin pedidos en el período.</li>
        ) : null}
      </ul>
    </div>
  );
};

/**
 * Barra horizontal compacta para comparar magnitudes (sucursales).
 * @param {object} props
 * @param {number} props.valor - Valor de la fila.
 * @param {number} props.maximo - Valor máximo del conjunto.
 * @param {string} [props.color] - Color de la barra.
 * @param {string} [props.ariaLabel] - Texto alternativo.
 */
export const BarraComparativa = ({ valor, maximo, color, ariaLabel }) => (
  <div className="reporte-comparativa" aria-hidden={ariaLabel ? undefined : true}>
    <div
      className="reporte-comparativa-relleno"
      style={{
        width: `${Math.max(2, Math.round((numero(valor) / Math.max(1, maximo)) * 100))}%`,
        backgroundColor: color,
      }}
      role={ariaLabel ? 'img' : undefined}
      aria-label={ariaLabel}
    />
  </div>
);

/**
 * Propósito: Iconos SVG inline (sin librerías externas) para estados de pedido y UI.
 * Contenido: Componente IconoEstado que devuelve un SVG según el estado (reloj, check,
 *            fuego, caja, bicicleta, check en círculo, cruz) y exporta IconoCheck.
 *            Por defecto usan currentColor (heredan el color del Badge/contexto) y
 *            aceptan un color explícito para la línea de tiempo.
 * Dependencias: Ninguna (solo React). Se usa con constants.COLOR_ESTADO_PEDIDO.
 * Uso: <IconoEstado estado="pendiente" size="16" /> | <IconoCheck size="34" />
 */

import React from 'react';

// SVG base: trazo, sin relleno, viewBox 0 0 64 64 (mismo estilo que Inicio.jsx).
const IconoSVG = ({ size = 16, color, children }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 64 64"
    fill="none"
    stroke={color || 'currentColor'}
    strokeWidth="4"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    style={{ display: 'inline-block', verticalAlign: '-0.125em' }}
  >
    {children}
  </svg>
);

// Trazo de cada estado (síntesis visual: reloj, check, fuego, caja, bicicleta, etc.).
const trazadoPorEstado = {
  pendiente: (
    <>
      <circle cx="32" cy="32" r="26" />
      <path d="M32 18v14l10 6" />
    </>
  ),
  confirmado: (
    <path d="M14 34l13 13 23-27" />
  ),
  en_preparacion: (
    <>
      <path d="M32 10c3 8 14 12 14 24a14 14 0 0 1-28 0C18 28 28 18 32 10z" />
      <path d="M24 38a8 8 0 0 0 8 8" />
    </>
  ),
  listo_para_entregar: (
    <>
      <path d="M8 20l24-8 24 8v24l-24 8-24-8z" />
      <path d="M8 20l24 8 24-8" />
      <path d="M32 28v24" />
    </>
  ),
  en_camino: (
    <>
      <circle cx="16" cy="42" r="10" />
      <circle cx="48" cy="42" r="10" />
      <circle cx="26" cy="42" r="3" />
      <path d="M16 42h10" />
      <path d="M26 42v-2M28 42l-4 9" />
      <path d="M26 24v-2M26 42L28 24" />
      <path d="M28 24h10" />
      <path d="M28 42L44 32" />
      <path d="M44 32L42 20" />
      <path d="M28 24L42 20" />
      <path d="M42 20h12l-6-8" />
      <path d="M48 42L44 30" />
    </>
  ),
  entregado: (
    <>
      <circle cx="32" cy="32" r="26" />
      <path d="M20 34l9 9 16-18" />
    </>
  ),
  cancelado: (
    <path d="M18 18l28 28M46 18L18 46" />
  ),
  default: (
    <circle cx="32" cy="32" r="14" />
  ),
};

const trayectoriasPorEstado = {
  pendiente: 'reloj',
  confirmado: 'check',
  en_preparacion: 'fuego',
  listo_para_entregar: 'caja',
  en_camino: 'bicicleta',
  entregado: 'check-en-circulo',
  cancelado: 'cruz',
};

export const IconoEstado = ({ estado, size = 16, color }) => (
  <IconoSVG size={size} color={color}>
    {trazadoPorEstado[estado] || trazadoPorEstado.default}
  </IconoSVG>
);

// Nombre legible del icono según el estado (para documentación/accesibilidad).
export const nombreIconoEstado = (estado) => trayectoriasPorEstado[estado] || 'circulo';

export const IconoCheck = ({ size = 16, color }) => (
  <IconoSVG size={size} color={color}>
    <path d="M14 34l13 13 23-27" />
  </IconoSVG>
);

export default IconoEstado;
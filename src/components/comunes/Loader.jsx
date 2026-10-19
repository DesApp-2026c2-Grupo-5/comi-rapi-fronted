/**
 * Propósito: Indicador de carga global de la app (rutas lazy y verificación
 *   de sesión).
 * Contenido: Loader con esqueleto de página genérica (SkeletonPagina) en
 *   lugar de un spinner circular.
 * Dependencias: components/comunes/Skeleton.
 * Uso: <Loader texto="Verificando sesión…" /> dentro de Suspense o guardas.
 *
 * MOTIVO: el spinner genérico no anticipaba nada de la pantalla que venía;
 *   el esqueleto comunica "esto es una página que se está armando" y evita
 *   el salto de layout al renderizar.
 */

import React from 'react';
import { SkeletonPagina } from './Skeleton';

/* El proyecto no tiene la dependencia "prop-types" (ningún componente declara
   PropTypes), así que se desactiva esa regla en este archivo en vez de agregar
   un paquete nuevo. Es la misma convención que usa CampoPassword.jsx. */
/* eslint-disable react/prop-types */
const Loader = ({ texto = 'Cargando…' }) => {
  return (
    // `role="status"` + `aria-live` hace que el lector de pantalla anuncie el
    // estado sin stealar el foco. El texto va visually-hidden porque el
    // esqueleto ya comunica la carga de forma visible: si no, se lee dos veces.
    <div className="py-4" role="status" aria-live="polite">
      <span className="visually-hidden">{texto}</span>
      <SkeletonPagina />
    </div>
  );
};
/* eslint-enable react/prop-types */

export default Loader;

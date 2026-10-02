/**
 * Propósito: Componente de spinner/loader usando Spinner de Bootstrap.
 * Contenido: Componente Loader con Spinner de React Bootstrap.
 * Dependencias: react-bootstrap (Spinner).
 * Uso: <Loader /> - Se renderiza durante estados de carga.
 */

import React from 'react';
import { Spinner } from 'react-bootstrap';

/* El proyecto no tiene la dependencia "prop-types" (ningún componente declara
   PropTypes), así que se desactiva esa regla en este archivo en vez de agregar
   un paquete nuevo. Es la misma convención que usa CampoPassword.jsx. */
/* eslint-disable react/prop-types */
const Loader = ({ texto = 'Cargando…' }) => {
  return (
    // `role="status"` + `aria-live` hace que el lector de pantalla anuncie el
    // cambio de estado sin stealar el foco. El texto visible se oculta a los
    // lectores porque el Spinner ya lo dice: si no, se lee dos veces.
    <div
      className="d-flex flex-column align-items-center justify-content-center py-5 gap-2"
      role="status"
      aria-live="polite"
    >
      <Spinner animation="border" variant="danger" aria-hidden="true" />
      <span className="text-muted">{texto}</span>
    </div>
  );
};
/* eslint-enable react/prop-types */

export default Loader;

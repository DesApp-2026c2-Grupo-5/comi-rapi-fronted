/**
 * Propósito: Componente de spinner/loader usando Spinner de Bootstrap.
 * Contenido: Componente Loader con Spinner de React Bootstrap.
 * Dependencias: react-bootstrap (Spinner).
 * Uso: <Loader /> - Se renderiza durante estados de carga.
 */

import React from 'react';
import { Spinner } from 'react-bootstrap';

const Loader = () => {
  return (
    <div className="d-flex flex-column align-items-center justify-content-center py-5 gap-2">
      <Spinner animation="border" role="status" variant="danger">
        <span className="visually-hidden">Cargando...</span>
      </Spinner>
      <span className="text-muted">Cargando...</span>
    </div>
  );
};

export default Loader;

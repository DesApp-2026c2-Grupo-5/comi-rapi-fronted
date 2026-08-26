/**
 * Propósito: Punto de entrada de la aplicación React que renderiza el componente App.
 * Contenido: Renderiza <App /> dentro de ReactDOM.createRoot.
 * Dependencias: react, react-dom/client, App.jsx, bootstrap CSS.
 * Uso: Se ejecuta al cargar la app (referenciado en index.html como /src/main.jsx).
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Importar CSS de Bootstrap
import 'bootstrap/dist/css/bootstrap.min.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

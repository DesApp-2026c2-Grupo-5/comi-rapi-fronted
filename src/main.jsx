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

// Tokens del sistema de diseño (después de Bootstrap para que la tipografía
// base pise a la del reboot; las variables se resuelven en tiempo de uso)
import './styles/tokens.css';

// Tema global de botones y utilidades Comi-Rapi (debe ir DESPUÉS de Bootstrap)
import './styles/comirapi.css';

// Paleta del panel de administración y superadministración (debe ir al final
// para pisar los estilos de marca del cliente).
import './styles/admin-theme.css';

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Splash de carga inicial (pintado por index.html): se desvanece cuando React
// termina de montar y se saca del DOM al terminar la transición. Con
// `requestAnimationFrame` doble nos aseguramos de que el navegador haya
// pintado el contenido real antes de empezar el fade (si no, el cambio sería
// instantáneo e invisible).
const splash = document.querySelector('.splash-inicial');
if (splash) {
  const reducirMovimiento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      splash.classList.add('splash-inicial--sale');
      setTimeout(() => splash.remove(), reducirMovimiento ? 0 : 260);
    });
  });
}

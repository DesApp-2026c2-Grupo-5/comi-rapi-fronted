/**
 * Propósito: Punto de entrada de la aplicación React que renderiza el componente App.
 * Contenido: precarga el snapshot público, monta <App /> dentro de
 * ReactDOM.createRoot y lo envuelve con el QueryClientProvider de TanStack Query.
 * Dependencias: react, react-dom/client, @tanstack/react-query, App.jsx,
 * queryClient.js, hooks/queries/bootstrap.js, utils/rutas.js, bootstrap CSS.
 * Uso: Se ejecuta al cargar la app (referenciado en index.html como /src/main.jsx).
 *
 * La precarga del bootstrap ocurre ANTES del primer render: así los providers y
 * las pantallas encuentran parámetros, catálogo, promociones y más vendidos en
 * la caché y no disparan sus propios GET en paralelo. Si falla o tarda más que
 * la espera máxima, se renderiza igual y cada pantalla conserva su lectura.
 *
 * Sin StrictMode: en desarrollo duplica los efectos y TanStack Query cancela la
 * primera lectura de cada consulta; eso llenaba la pestaña Red de pares
 * petición/cancelación. La app se monta una sola vez, igual que en producción.
 */

import ReactDOM from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import App from './App';
import { queryClient } from './queryClient';
import {
  opcionesBootstrap,
  sembrarBootstrap,
} from './hooks/queries/bootstrap';
import { esRutaDeAdmin } from './utils/rutas';

// Importar CSS de Bootstrap
import 'bootstrap/dist/css/bootstrap.min.css';

// Tokens del sistema de diseño (después de Bootstrap para que la tipografía
// base pise a la del reboot; las variables se resuelven en tiempo de uso)
import './styles/tokens.css';

// Tema global de botones y utilidades Comi-Rapi (debe ir DESPUÉS de Bootstrap)
import './styles/comirapi.css';

const root = ReactDOM.createRoot(document.getElementById('root'));

/** Tope de espera para no dejar el splash colgado si el backend no responde. */
const ESPERA_MAXIMA_BOOTSTRAP_MS = 5000;

/**
 * Pide el snapshot y lo siembra en la caché antes de montar la app.
 * En el panel no se pide: sus pantallas usan listados de gestión (inactivos,
 * stock) que el snapshot público no trae.
 * @returns {Promise<void>}
 */
const precargarBootstrap = async () => {
  if (esRutaDeAdmin(window.location.pathname)) return;

  try {
    const data = await Promise.race([
      queryClient.fetchQuery(opcionesBootstrap),
      new Promise((resolver) =>
        setTimeout(() => resolver(null), ESPERA_MAXIMA_BOOTSTRAP_MS)
      ),
    ]);
    if (data) sembrarBootstrap(queryClient, data);
  } catch {
    // La precarga es opcional: cada pantalla conserva su propio GET.
  }
};

/**
 * Desvanece el splash que pinta index.html cuando React ya montó el contenido.
 */
const desvanecerSplash = () => {
  const splash = document.querySelector('.splash-inicial');
  if (!splash) return;

  const reducirMovimiento = window.matchMedia(
    '(prefers-reduced-motion: reduce)'
  ).matches;
  // Doble rAF para que el navegador haya pintado el contenido real antes de
  // empezar el fade (si no, el cambio sería instantáneo e invisible).
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      splash.classList.add('splash-inicial--sale');
      setTimeout(() => splash.remove(), reducirMovimiento ? 0 : 260);
    });
  });
};

/**
 * Monta la aplicación y retira el splash.
 */
const montarApp = () => {
  root.render(
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  );
  desvanecerSplash();
};

precargarBootstrap().finally(montarApp);

/**
 * Propósito: Persistencia y aplicación del tema claro/oscuro de la app.
 * Contenido: claves y temas válidos, lectura/escritura segura en localStorage,
 *            resolución del tema "sistema" con prefers-color-scheme y aplicación
 *            del tema al documento (data-bs-theme y meta theme-color).
 * Dependencias: Ninguna (solo APIs del navegador, con guardas para SSR/tests).
 * Uso: import { leerTema, guardarTema, aplicarTemaEnDocumento } from '../utils/temaStorage';
 *
 * El tema se guarda como preferencia del usuario ('claro' | 'oscuro' |
 * 'sistema'); lo que se aplica al documento siempre es el tema resuelto
 * ('claro' | 'oscuro'). La preferencia es por dispositivo/navegador: no viaja al
 * backend.
 */

/** Preferencias de tema que puede elegir el usuario. */
export const TEMAS = {
  CLARO: 'claro',
  OSCURO: 'oscuro',
  SISTEMA: 'sistema',
};

/** Preferencia por defecto: seguir la del sistema operativo. */
export const TEMA_POR_DEFECTO = TEMAS.SISTEMA;

/** Clave versionada de localStorage. */
export const CLAVE_TEMA = 'comirapi:tema:v1';

/** Color de la barra del navegador (meta theme-color) por tema resuelto. */
export const COLOR_TEMA = {
  claro: '#ff9f1c',
  oscuro: '#1b1712',
};

/** Valor que espera Bootstrap 5.3 en el atributo data-bs-theme. */
const BS_THEME = {
  claro: 'light',
  oscuro: 'dark',
};

const TEMAS_VALIDOS = Object.values(TEMAS);

/** true si el valor es una preferencia de tema soportada. */
export const esTemaValido = (tema) => TEMAS_VALIDOS.includes(tema);

function almacenamientoDisponible() {
  try {
    return typeof localStorage !== 'undefined';
  } catch {
    return false;
  }
}

/** true si el sistema operativo pide tema oscuro. */
export const prefiereOscuroElSistema = () => {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
};

/**
 * Lee la preferencia guardada. Si no hay nada (o el valor es inválido) devuelve
 * el tema por defecto ('sistema').
 * @returns {'claro'|'oscuro'|'sistema'} Preferencia del usuario.
 */
export const leerTema = () => {
  if (!almacenamientoDisponible()) return TEMA_POR_DEFECTO;
  try {
    const valor = localStorage.getItem(CLAVE_TEMA);
    return esTemaValido(valor) ? valor : TEMA_POR_DEFECTO;
  } catch {
    return TEMA_POR_DEFECTO;
  }
};

/** Guarda la preferencia; nunca rompe la app (cuota/modo privado). */
export const guardarTema = (tema) => {
  if (!esTemaValido(tema) || !almacenamientoDisponible()) return;
  try {
    localStorage.setItem(CLAVE_TEMA, tema);
  } catch {
    // Cuota llena o modo privado: el tema sigue funcionando en memoria.
  }
};

/**
 * Resuelve la preferencia al tema concreto que se pinta.
 * @param {'claro'|'oscuro'|'sistema'} tema Preferencia del usuario.
 * @param {boolean} [prefiereOscuro] Resultado de prefers-color-scheme.
 * @returns {'claro'|'oscuro'} Tema resuelto.
 */
export const resolverTema = (tema, prefiereOscuro = prefiereOscuroElSistema()) => {
  if (tema === TEMAS.CLARO || tema === TEMAS.OSCURO) return tema;
  return prefiereOscuro ? TEMAS.OSCURO : TEMAS.CLARO;
};

/**
 * Aplica el tema resuelto al documento: `data-bs-theme` en <html> (Bootstrap
 * hereda sus variables) y color de la barra del navegador.
 * @param {'claro'|'oscuro'} temaResuelto Tema ya resuelto.
 */
export const aplicarTemaEnDocumento = (temaResuelto) => {
  if (typeof document === 'undefined') return;
  const tema = BS_THEME[temaResuelto] || BS_THEME.claro;
  document.documentElement.setAttribute('data-bs-theme', tema);
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) {
    meta.setAttribute(
      'content',
      COLOR_TEMA[temaResuelto] || COLOR_TEMA.claro
    );
  }
};

/**
 * Suscribe un callback a los cambios de prefers-color-scheme.
 * Devuelve la función para desuscribirse (no-op si no hay matchMedia).
 * @param {(prefiereOscuro: boolean) => void} callback
 * @returns {() => void} Desuscripción.
 */
export const suscribirALaPreferenciaDelSistema = (callback) => {
  if (typeof window === 'undefined' || !window.matchMedia) return () => {};
  const mq = window.matchMedia('(prefers-color-scheme: dark)');
  const escuchar = (evento) => callback(evento.matches);
  // addEventListener existe en navegadores modernos; addListener es el fallback
  // para Safari viejo.
  if (mq.addEventListener) {
    mq.addEventListener('change', escuchar);
    return () => mq.removeEventListener('change', escuchar);
  }
  mq.addListener(escuchar);
  return () => mq.removeListener(escuchar);
};

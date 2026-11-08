/**
 * Propósito: Menú de cuenta que se despliega desde el logo de Comi-Rapi.
 * Contenido: Componente MenuCuenta con la identidad del usuario (foto, nombre y
 *            correo), las acciones de su rol (direcciones, perfil y cerrar
 *            sesión para el CLIENTE) y el interruptor de modo oscuro.
 * Dependencias: react-dom (createPortal), react-router-dom (Link, useLocation,
 *               useNavigate), react-icons/fa, useAuth, Avatar, SelectorTema,
 *               MenuCuenta.css.
 * Uso: <MenuCuenta /> — reemplaza al logo cuando hay sesión. En el invitado el
 *      logo sigue siendo un enlace al inicio.
 *
 * El panel es propio y no usa el Dropdown de Bootstrap. Con el Dropdown, los
 * ítems eran `NavLink` y Bootstrap les aplicaba `.dropdown-item.active` (fondo
 * azul, texto blanco) en cuanto la ruta coincidía: al entrar a /cliente/perfil
 * los dos accesos quedaban "activos" a la vez y el menú perdía la paleta de la
 * marca. Acá el estado activo se calcula a mano, comparando también el query
 * string, para que sólo uno se marque.
 *
 * El panel se monta en un portal sobre <body>. La navbar es `sticky` con
 * z-index propio, así que un hijo suyo nunca puede pintarse por encima de la
 * barra inferior del teléfono (que tiene el mismo z-index pero va después en el
 * DOM) y la hoja quedaba cortada. Fuera de ese contexto de apilado, su z-index
 * manda. En escritorio se ubica con coordenadas del logo (fixed + medición); en
 * el teléfono el CSS lo pega al borde inferior con `!important`.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  FaChevronDown,
  FaChevronRight,
  FaMapMarkerAlt,
  FaSignOutAlt,
  FaUserCog,
} from 'react-icons/fa';
import { useAuth } from '../../hooks/useAuth';
import { ROLES } from '../../utils/constants';
import { nombreCompleto } from '../../utils/formatters';
import Avatar from './Avatar';
import SelectorTema from './SelectorTema';
import './MenuCuenta.css';

/** Accesos del CLIENTE sobre su cuenta. */
const ACCIONES_CLIENTE = [
  {
    id: 'direcciones',
    etiqueta: 'Editar direcciones',
    to: '/cliente/perfil?direcciones=1',
    Icono: FaMapMarkerAlt,
  },
  {
    id: 'perfil',
    etiqueta: 'Configurar perfil',
    to: '/cliente/perfil',
    Icono: FaUserCog,
  },
];

const ID_PANEL = 'menu-cuenta-panel';

/** Ancho del panel en escritorio. Debe coincidir con `width` en MenuCuenta.css. */
const ANCHO_PANEL = 320;
/** Aire mínimo contra los bordes de la ventana. */
const MARGEN_VENTANA = 12;
/** Separación entre el logo y el panel. */
const SEPARACION = 8;

/** Teclas que mueven el foco dentro del panel. */
const TECLAS_NAVEGACION = ['ArrowDown', 'ArrowUp', 'Home', 'End'];

/**
 * Ubica el panel debajo del logo sin que se salga por el borde derecho.
 * @param {DOMRect} rect - Caja del botón del logo.
 * @returns {{top: number, left: number}} Coordenadas fijas.
 */
const calcularPosicion = (rect) => {
  const ancho = Math.min(ANCHO_PANEL, window.innerWidth - MARGEN_VENTANA * 2);
  const izquierda = Math.min(
    Math.max(rect.left, MARGEN_VENTANA),
    window.innerWidth - ancho - MARGEN_VENTANA
  );
  return { top: rect.bottom + SEPARACION, left: izquierda };
};

const MenuCuenta = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname, search } = useLocation();
  const [abierto, setAbierto] = useState(false);
  const [posicion, setPosicion] = useState({ top: 0, left: 0 });
  const contenedorRef = useRef(null);
  const botonRef = useRef(null);
  const panelRef = useRef(null);
  const esCliente = user?.rol === ROLES.CLIENTE;

  // Al navegar, el panel se cierra: si no, queda colgando sobre la página nueva.
  useEffect(() => {
    setAbierto(false);
  }, [pathname, search]);

  const medir = useCallback(() => {
    const rect = botonRef.current?.getBoundingClientRect();
    if (rect) setPosicion(calcularPosicion(rect));
  }, []);

  const abrir = useCallback(() => {
    medir();
    setAbierto(true);
  }, [medir]);

  const cerrar = useCallback((devolverFoco = false) => {
    setAbierto(false);
    if (devolverFoco) botonRef.current?.focus();
  }, []);

  // Cierre por clic afuera y por Escape. El foco vuelve al logo cuando se
  // cierra con el teclado, para no dejarlo perdido en el body.
  useEffect(() => {
    if (!abierto) return undefined;

    const alPresionarFuera = (evento) => {
      const enElBoton = contenedorRef.current?.contains(evento.target);
      const enElPanel = panelRef.current?.contains(evento.target);
      if (!enElBoton && !enElPanel) setAbierto(false);
    };
    const alTeclear = (evento) => {
      if (evento.key === 'Escape') {
        evento.stopPropagation();
        cerrar(true);
      }
    };

    document.addEventListener('mousedown', alPresionarFuera);
    document.addEventListener('keydown', alTeclear);
    return () => {
      document.removeEventListener('mousedown', alPresionarFuera);
      document.removeEventListener('keydown', alTeclear);
    };
  }, [abierto, cerrar]);

  // El header es sticky: si la ventana cambia de tamaño o la página scrollea,
  // el panel se vuelve a colgar del logo.
  useEffect(() => {
    if (!abierto) return undefined;
    window.addEventListener('resize', medir);
    window.addEventListener('scroll', medir, true);
    return () => {
      window.removeEventListener('resize', medir);
      window.removeEventListener('scroll', medir, true);
    };
  }, [abierto, medir]);

  // La hoja del teléfono bloquea el scroll del fondo, como las hojas nativas.
  // En escritorio el bloqueo no aplica (lo resuelve el CSS).
  useEffect(() => {
    if (!abierto) return undefined;
    document.body.classList.add('menu-cuenta-abierto');
    return () => document.body.classList.remove('menu-cuenta-abierto');
  }, [abierto]);

  /**
   * Elementos enfocables del panel, en orden de lectura. Incluye los enlaces,
   * el interruptor de tema y el botón de cerrar sesión.
   * @returns {HTMLElement[]}
   */
  const obtenerItems = () =>
    Array.from(
      panelRef.current?.querySelectorAll('a[href], button:not([disabled])') ?? []
    );

  const manejarTeclas = (evento) => {
    const lista = obtenerItems();
    if (lista.length === 0) return;

    // Tab queda contenido en el panel mientras está abierto: como el panel vive
    // en un portal, el orden natural del documento seguiría por la navbar y el
    // foco se perdería detrás del fondo oscurecido de la hoja.
    if (evento.key === 'Tab') {
      const primero = lista[0];
      const ultimo = lista[lista.length - 1];
      if (evento.shiftKey && document.activeElement === primero) {
        evento.preventDefault();
        ultimo.focus();
      } else if (!evento.shiftKey && document.activeElement === ultimo) {
        evento.preventDefault();
        primero.focus();
      }
      return;
    }

    if (!TECLAS_NAVEGACION.includes(evento.key)) return;
    const actual = lista.indexOf(document.activeElement);
    let destino = 0;

    if (evento.key === 'ArrowDown') {
      destino = actual < 0 ? 0 : (actual + 1) % lista.length;
    } else if (evento.key === 'ArrowUp') {
      destino = actual <= 0 ? lista.length - 1 : actual - 1;
    } else if (evento.key === 'End') {
      destino = lista.length - 1;
    }

    evento.preventDefault();
    lista[destino].focus();
  };

  const handleLogout = async () => {
    cerrar();
    await logout();
    navigate('/login');
  };

  const nombre = nombreCompleto(user?.nombre, user?.apellido) || 'Mi cuenta';
  const enPerfil = pathname === '/cliente/perfil';
  const enDirecciones = enPerfil && search.includes('direcciones=1');

  const estaActivo = (id) =>
    id === 'direcciones' ? enDirecciones : enPerfil && !enDirecciones;

  return (
    <div className="menu-cuenta" ref={contenedorRef}>
      <button
        type="button"
        ref={botonRef}
        className={`navbar-brand-comirapi navbar-marca-boton${
          abierto ? ' menu-cuenta-boton-abierto' : ''
        }`}
        aria-label="Abrir menú de cuenta"
        aria-haspopup="dialog"
        aria-expanded={abierto}
        aria-controls={ID_PANEL}
        onClick={() => (abierto ? cerrar() : abrir())}
        onKeyDown={(evento) => {
          // Flecha abajo abre y ya deja el foco en la primera opción, como
          // cualquier menú de botón.
          if (evento.key === 'ArrowDown') {
            evento.preventDefault();
            if (!abierto) {
              abrir();
              requestAnimationFrame(() => {
                panelRef.current?.querySelector('a[href], button')?.focus();
              });
            } else {
              panelRef.current?.querySelector('a[href], button')?.focus();
            }
          }
          // Tab entra al panel en vez de saltar a la navbar: el panel está en un
          // portal al final del <body>, así que el orden del documento no pasa
          // por él.
          if (evento.key === 'Tab' && !evento.shiftKey && abierto) {
            const primero = panelRef.current?.querySelector('a[href], button');
            if (primero) {
              evento.preventDefault();
              primero.focus();
            }
          }
        }}
      >
        <img
          src="/imagenes/logo-comirapi.svg"
          alt=""
          aria-hidden="true"
          className="brand-ico"
        />
        <span translate="no">Comi-Rapi</span>
        <FaChevronDown className="navbar-marca-caret" aria-hidden="true" />
      </button>

      {abierto &&
        createPortal(
          <>
            <div
              className="menu-cuenta-fondo"
              aria-hidden="true"
              onClick={() => cerrar()}
            />
            <div
              id={ID_PANEL}
              ref={panelRef}
              className="menu-cuenta-panel"
              style={{ top: posicion.top, left: posicion.left }}
              role="dialog"
              aria-label="Tu cuenta"
              onKeyDown={manejarTeclas}
            >
              <div className="menu-cuenta-identidad">
                <Avatar
                  src={user?.fotoPerfilUrl}
                  nombre={user?.nombre}
                  apellido={user?.apellido}
                  size={46}
                />
                <div className="menu-cuenta-datos">
                  <p className="menu-cuenta-nombre">{nombre}</p>
                  <p className="menu-cuenta-email">{user?.email}</p>
                </div>
              </div>

              <div className="menu-cuenta-divisor" />

              {esCliente && (
                <div className="menu-cuenta-acciones">
                  {ACCIONES_CLIENTE.map(({ id, etiqueta, Icono, to }) => {
                    const activo = estaActivo(id);
                    return (
                      <Link
                        key={id}
                        to={to}
                        className={`menu-cuenta-opcion${
                          activo ? ' menu-cuenta-opcion-activa' : ''
                        }`}
                        aria-current={activo ? 'page' : undefined}
                        onClick={() => cerrar()}
                      >
                        <span className="menu-cuenta-icono" aria-hidden="true">
                          <Icono />
                        </span>
                        <span className="menu-cuenta-texto">{etiqueta}</span>
                        <FaChevronRight
                          className="menu-cuenta-flecha"
                          aria-hidden="true"
                        />
                      </Link>
                    );
                  })}
                </div>
              )}

              <div className="menu-cuenta-divisor" />

              {/* El switch vive también en el menú porque en el teléfono el
                  header ya no lleva su propia copia. */}
              <SelectorTema variante="fila" />

              <div className="menu-cuenta-divisor" />

              <button
                type="button"
                className="menu-cuenta-opcion menu-cuenta-salir"
                onClick={handleLogout}
              >
                <span className="menu-cuenta-icono" aria-hidden="true">
                  <FaSignOutAlt />
                </span>
                <span className="menu-cuenta-texto">Cerrar sesión</span>
              </button>
            </div>
          </>,
          document.body
        )}
    </div>
  );
};

export default MenuCuenta;

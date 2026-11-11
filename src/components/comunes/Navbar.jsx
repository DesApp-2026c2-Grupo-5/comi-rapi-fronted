/**
 * Propósito: Componente de barra de navegación que cambia según el rol del usuario.
 * Contenido: Navbar naranja con la marca Comi-Rapi, enlaces con íconos
 *            (react-icons), resaltado de la página activa y animación al hover.
 *            Con sesión, el logo es un botón que abre el menú de cuenta
 *            (identidad, direcciones, perfil y cerrar sesión). El CLIENTE tiene
 *            además la campanita del centro de notificaciones con contador.
 *            Para el invitado el logo sigue siendo el enlace al inicio y el
 *            lugar de la derecha lo ocupan iniciar sesión y registrarse.
 * Dependencias: react-bootstrap (Navbar, Nav, Container, Dropdown),
 *               react-router-dom (NavLink, useLocation), react-icons/fa,
 *               useAuth hook, useIndicadoresNav, MenuCuenta,
 *               CampanaNotificaciones, CentroNotificaciones, Navbar.css.
 * Uso: <Navbar /> - Se renderiza en todas las páginas.
 */

import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Navbar as BSNavbar, Nav, Container, Dropdown } from 'react-bootstrap';
import {
  FaHamburger,
  FaHome,
  FaUtensils,
  FaShoppingCart,
  FaReceipt,
  FaTachometerAlt,
  FaBoxes,
  FaBoxOpen,
  FaStore,
  FaSlidersH,
  FaTags,
  FaPercent,
  FaUsers,
  FaUserTie,
  FaCog,
  FaBriefcase,
  FaExclamationCircle,
  FaSignInAlt,
  FaChevronDown,
} from 'react-icons/fa';
import { useAuth } from '../../hooks/useAuth';
import useIndicadoresNav from '../../hooks/useIndicadoresNav';
import { useSucursal } from '../../hooks/useSucursal';
import { useSucursalOperativa } from '../../hooks/useSucursalOperativa';
import { useNotificaciones } from '../../hooks/useNotificaciones';
import { ROLES } from '../../utils/constants';
import { esRutaDeAlguna, rutaActual } from '../../utils/rutas';
import SelectorTema from './SelectorTema';
import MenuCuenta from './MenuCuenta';
import CampanaNotificaciones from './CampanaNotificaciones';
import CentroNotificaciones from './CentroNotificaciones';
import './Navbar.css';

// Menú del cliente (cada enlace lleva su ícono). El perfil NO va acá: se entra
// desde el menú de cuenta del logo. Las direcciones tampoco: se gestionan desde
// el perfil. `badge` indica qué contador se dibuja junto al ícono.
const enlacesCliente = [
  { to: '/cliente/inicio', etiqueta: 'Inicio', icono: FaHome },
  { to: '/cliente/catalogo', etiqueta: 'Catálogo', icono: FaUtensils },
  {
    to: '/cliente/carrito',
    etiqueta: 'Carrito',
    icono: FaShoppingCart,
    badge: 'carrito',
  },
  {
    to: '/cliente/mis-pedidos',
    etiqueta: 'Mis Pedidos',
    icono: FaReceipt,
    badge: 'pedidos',
  },
];

/* Menú del invitado: el mismo camino de compra, sin "Mis Pedidos". Ver el
   catálogo y armar el carrito no piden cuenta; el historial de pedidos sí, así
   que ese enlace no aparece hasta que hay sesión. */
const enlacesInvitado = enlacesCliente.filter((enlace) => enlace.to !== '/cliente/mis-pedidos');

/* Menú del administrador.
 *
 * Antes eran ocho enlaces sueltos en la barra. Con el ícono, la pastilla y el
 * texto de cada uno, no entraban en una fila a 1280px: como el container de
 * Bootstrap es `flex-wrap: wrap`, la barra se partía en dos y al ser `sticky-top`
 * tapaba parte de la pantalla.
 *
 * El CRUD del catálogo (productos, categorías, promociones, personalización e
 * imágenes) es corporativo y lo hace el SUPERADMINISTRADOR. El admin conserva
 * el acceso a "Catálogo", pero en SOLO LECTURA: ve los listados y, en
 * Productos, activa/desactiva la disponibilidad de cada ítem en su sucursal.
 * Además opera pedidos, stock y reclamos. La cartera de clientes se abre desde
 * el botón "Ver clientes" del panel de reportes, no desde la barra: la lista de
 * clientes se consulta junto con sus métricas y no como destino diario.
 * Sucursales quedó fuera del menú admin por lo mismo: lo maneja el superadmin.
 * Stock queda suelto a propósito: es un solo destino, y meterlo en un
 * desplegable obligaría a un clic de más para llegar a un solo lugar. */
const menuAdmin = [
  { to: '/admin/dashboard', etiqueta: 'Dashboard', icono: FaTachometerAlt },
  {
    to: '/admin/pedidos',
    etiqueta: 'Pedidos',
    icono: FaReceipt,
    badge: 'pedidos',
  },
  {
    to: '/admin/quejas',
    etiqueta: 'Reclamos',
    icono: FaExclamationCircle,
    badge: 'quejas',
  },
  {
    etiqueta: 'Catálogo',
    icono: FaUtensils,
    hijos: [
      {
        to: '/admin/productos',
        etiqueta: 'Productos',
        icono: FaHamburger,
        prefijo: '/admin/producto',
      },
      {
        to: '/admin/categorias',
        etiqueta: 'Categorías',
        icono: FaTags,
        prefijo: '/admin/categoria',
      },
      {
        to: '/admin/promociones',
        etiqueta: 'Promociones',
        icono: FaPercent,
        prefijo: '/admin/promocion',
      },
    ],
  },
  { to: '/admin/stock', etiqueta: 'Stock', icono: FaBoxes },
];

/* Menú del superadministrador: su panel es global (métricas agregadas), la
   gestión de administradores, la lista de todos los usuarios registrados
   (clientes), el CRUD de sucursales y el CRUD del catálogo.
   El catálogo es único y corporativo (productos, categorías, promociones y
   personalización valen para todas las sucursales), así que lo edita este rol
   y no cada administrador; el admin sólo lo activa/desactiva en su sucursal. */
const menuSuperadmin = [
  { to: '/superadmin/panel', etiqueta: 'Panel', icono: FaTachometerAlt },
  {
    to: '/admin/quejas',
    etiqueta: 'Reclamos',
    icono: FaExclamationCircle,
    badge: 'quejas',
  },
  {
    etiqueta: 'Catálogo',
    icono: FaUtensils,
    grupo: 'catalogo',
    hijos: [
      {
        to: '/superadmin/productos',
        etiqueta: 'Productos',
        icono: FaHamburger,
        prefijo: '/superadmin/producto',
      },
      {
        to: '/superadmin/categorias',
        etiqueta: 'Categorías',
        icono: FaTags,
        prefijo: '/superadmin/categoria',
      },
      {
        to: '/superadmin/personalizacion',
        etiqueta: 'Personalización',
        icono: FaSlidersH,
      },
      {
        to: '/superadmin/insumos',
        etiqueta: 'Insumos',
        icono: FaBoxOpen,
      },
      {
        to: '/superadmin/ingredientes',
        etiqueta: 'Ingredientes',
        icono: FaBoxOpen,
      },
      {
        to: '/superadmin/promociones',
        etiqueta: 'Promociones',
        icono: FaPercent,
        prefijo: '/superadmin/promocion',
      },
    ],
  },
  {
    etiqueta: 'Negocio',
    icono: FaBriefcase,
    grupo: 'negocio',
    hijos: [
      {
        to: '/superadmin/parametros',
        etiqueta: 'Parámetros',
        icono: FaCog,
        prefijo: '/superadmin/parametros',
      },
      {
        to: '/superadmin/sucursales',
        etiqueta: 'Sucursales',
        icono: FaStore,
        prefijo: '/superadmin/sucursal',
      },
      {
        to: '/superadmin/clientes',
        etiqueta: 'Clientes',
        icono: FaUsers,
        prefijo: '/superadmin/clientes',
      },
      {
        to: '/superadmin/administradores',
        etiqueta: 'Administradores',
        icono: FaUserTie,
        prefijo: '/superadmin/administradores',
      },
    ],
  },
];

const Navbar = () => {
  const { user, isAuthenticated, hydrated } = useAuth();
  const { notificar } = useNotificaciones();
  // La lista de sucursales (para el selector del superadmin) sale del
  // SucursalContext, que ya carga todas al montar la app.
  const { sucursales } = useSucursal();
  // La sucursal OPERATIVA de la sesión (asignada del admin o contexto del
  // superadmin) sale de /auth/me: es la que se muestra y la que se puede
  // cambiar cuando el rol es SUPERADMINISTRADOR.
  const { sucursalOperativa, elegirSucursal, limpiarSucursal } =
    useSucursalOperativa();
  // Los contadores de badge y sus pulsos viven en un hook aparte porque la barra
  // inferior muestra los mismos números: si cada componente los calculara por su
  // cuenta, dejarían de coincidir en algún momento.
  const {
    productosDistintos,
    pedidosActivos,
    quejasPendientes,
    pulsoCarrito,
    pulsoPedido,
    pulsoPedidoBadge,
    pulsoQueja,
    pulsoQuejaBadge,
  } = useIndicadoresNav();
  const location = useLocation();
  const { pathname } = location;
  // Estado de los desplegables ("Catálogo" y "Negocio"). Se maneja acá en vez de
  // dejarlo interno para poder cerrarlos también al navegar: si no, el menú queda
  // colgando abierto sobre la página nueva. `null` = ninguno abierto.
  const [grupoAbierto, setGrupoAbierto] = useState(null);

  /* Sin saber si hay sesión no se puede elegir la zona de la derecha: se
     dibujaría el botón de acceso y un instante después el menú de cuenta. Se
     espera a que /auth/me responda (lo hace AuthContext al montar) y recién ahí
     se pinta la barra. */
  if (!hydrated) return null;

  const isCliente = user?.rol === ROLES.CLIENTE;
  const isAdmin = user?.rol === ROLES.ADMIN;
  const isSuperadmin = user?.rol === ROLES.SUPERADMIN;
  const destinoInicio = isAdmin
    ? '/admin/dashboard'
    : isSuperadmin
      ? '/superadmin/panel'
      : '/cliente/inicio';
  // Con contexto elegido, el superadmin también opera los pedidos y el stock
  // de esa sucursal (rutas compartidas con el admin; el backend acota por el
  // contexto). Sin contexto, su menú queda solo con lo global.
  const menuSuperadminOperativo = sucursalOperativa
    ? [
        menuSuperadmin[0],
        {
          to: '/admin/pedidos',
          etiqueta: 'Pedidos (sucursal)',
          icono: FaReceipt,
        },
        {
          to: '/admin/stock',
          etiqueta: 'Stock (sucursal)',
          icono: FaBoxes,
        },
        ...menuSuperadmin.slice(1),
      ]
    : menuSuperadmin;
  const menu = isAdmin
    ? menuAdmin
    : isSuperadmin
      ? menuSuperadminOperativo
      : isCliente
        ? enlacesCliente
        : enlacesInvitado;
  // La sucursal operativa sale de /auth/me (uniforme para admin y superadmin):
  // el admin ve su sucursal asignada; un admin sin sucursal asignada (no
  // debería existir) ve "Sin sucursal".
  const sucursalAdmin = isAdmin
    ? sucursalOperativa?.nombre || 'Sin sucursal'
    : null;

  const sucursalesActivas = (sucursales || []).filter((s) => s.activa !== false);

  const handleElegirContexto = async (sucursal) => {
    const result = await elegirSucursal(sucursal.id);
    if (result.success) {
      notificar(`Ahora operás la sucursal ${sucursal.nombre}.`, 'info');
    } else {
      notificar(result.error || 'No se pudo elegir la sucursal.', 'danger');
    }
  };

  const handleLimpiarContexto = async () => {
    const result = await limpiarSucursal();
    if (result.success) {
      notificar('Dejaste de operar la sucursal.', 'info');
    } else {
      notificar(result.error || 'No se pudo salir del contexto.', 'danger');
    }
  };

  /* Botón del superadmin para elegir sucursal de contexto. Se declara una sola
     vez y se reutiliza tanto en la fila superior (visible en móvil/responsive)
     como en el menú colapsable (escritorio), sin duplicar el markup. */
  /* Pantalla de origen para los botones de acceso: al entrar se vuelve a donde
     estaba el visitante, y si llegó al login desde el carrito vuelve al carrito
     con lo que había elegido. */
  const origen = rutaActual(location);

  const cerrarNavegacion = () => {
    setGrupoAbierto(null);
  };

  /* Botón de acceso del invitado. El color lleno marca la acción que la app
     pide (entrar); "Regístrate" queda al contorno, como el cierre de sesión, para
     que no compitan con el primero. Se usa NavLink y no Button para que sea un
     enlace de verdad: así se abre con ctrl+clic y queda en el historial.
     La copia móvil lleva aria-label porque abajo de 576px el texto se oculta y
     sin él el enlace se quedaría sin nombre accesible. */
  const accesoInvitado = (movil) => (
    <NavLink
      to="/login"
      state={{ from: origen }}
      aria-label={movil ? 'Iniciar sesión' : undefined}
      className={`btn btn-acceso-comirapi${movil ? ' btn-acceso-movil' : ''}`}
    >
      <FaSignInAlt aria-hidden="true" />
      <span className={movil ? 'btn-acceso-texto' : undefined}>Iniciar sesión</span>
    </NavLink>
  );

  /* El desplegable se marca activo si la ruta actual es una de sus secciones o
     una de sus subpantallas de alta/edición: dentro de /superadmin/producto/editar/3
     se sigue estando en Productos. */
  const esHijoDe = (hijos) => esRutaDeAlguna(hijos, pathname);

  // Badge del contador. El número visible es decorativo: el texto para lectores
  // de pantalla va aparte, porque un aria-label sobre un <span> sin rol no se
  // expone de forma fiable.
  const renderBadge = (clave) => {
    if (clave === 'carrito' && productosDistintos > 0) {
      return (
        <span className={`carrito-badge${pulsoCarrito ? ' carrito-badge-pulso' : ''}`}>
          <span aria-hidden="true">{productosDistintos}</span>
          <span className="visually-hidden">
            {`${productosDistintos} ${
              productosDistintos === 1 ? 'producto' : 'productos'
            } en el carrito`}
          </span>
        </span>
      );
    }
    if (clave === 'pedidos' && pedidosActivos > 0) {
      return (
        <span className={`carrito-badge${pulsoPedidoBadge ? ' carrito-badge-pulso' : ''}`}>
          <span aria-hidden="true">{pedidosActivos}</span>
          <span className="visually-hidden">
            {`${pedidosActivos} ${
              pedidosActivos === 1 ? 'pedido' : 'pedidos'
            } en curso`}
          </span>
        </span>
      );
    }
    if (clave === 'quejas' && quejasPendientes > 0) {
      return (
        <span className={`carrito-badge${pulsoQuejaBadge ? ' carrito-badge-pulso' : ''}`}>
          <span aria-hidden="true">{quejasPendientes}</span>
          <span className="visually-hidden">
            {`${quejasPendientes} ${
              quejasPendientes === 1 ? 'reclamo pendiente' : 'reclamos pendientes'
            }`}
          </span>
        </span>
      );
    }
    return null;
  };

  const pulsoDeIcono = (clave) =>
    (clave === 'carrito' && pulsoCarrito) ||
    (clave === 'pedidos' && pulsoPedido) ||
    (clave === 'quejas' && pulsoQueja)
      ? ' nav-enlace-ico-pulso'
      : '';

  return (
    <>
      <BSNavbar
        expand="lg"
        sticky="top"
        className="navbar-comirapi"
        /* Con la barra inferior hay dos regiones <nav> en la misma pantalla. Sin
           nombre cada una se anuncia sólo como "navegación" y no se sabe cuál es
           cuál al tabular. */
        aria-label="Navegación superior"
      >
      <Container>
        {isAuthenticated ? (
          /* Con sesión, el logo es el botón que abre el menú de cuenta: la
             identidad y el cierre de sesión se mudaron a la izquierda. */
          <MenuCuenta />
        ) : (
          <BSNavbar.Brand
            as={NavLink}
            to={destinoInicio}
            className="navbar-brand-comirapi"
          >
            <img
              src="/imagenes/logo-comirapi.svg"
              alt=""
              aria-hidden="true"
              className="brand-ico"
            />
            <span translate="no">Comi-Rapi</span>
          </BSNavbar.Brand>
        )}
        {/* Controles de la fila superior en móvil: campanita del cliente,
            acceso del invitado y, para el invitado, el interruptor de tema. Con
            sesión el tema vive en el menú de cuenta del logo, así el header no
            repite el control. El perfil y el cierre de sesión tampoco están
            acá: se mudaron al menú del logo. */}
        <div className="navbar-controles-movil">
          {isCliente && (
            <CampanaNotificaciones className="campana-movil" />
          )}
          {/* El invitado no tiene perfil ni sesión que cerrar, así que en su
              lugar va el acceso. Va en la fila superior (no dentro del
              colapsable) porque en móvil el colapsable está plegado y sería
              inalcanzable. */}
          {!isAuthenticated && accesoInvitado(true)}
          {/* El invitado no tiene menú de cuenta donde elegir el tema, así que
              conserva el interruptor en la fila superior. */}
          {!isAuthenticated && (
            <span className="selector-tema-movil">
              <SelectorTema />
            </span>
          )}
        </div>
        <BSNavbar.Collapse id="main-navbar" className="d-none d-lg-flex">
          <Nav className="me-auto align-items-center gap-lg-1">
            {menu.map((item) => {
              if (item.hijos) {
                const grupoActivo = esHijoDe(item.hijos);
                return (
                  <Nav.Item key={item.etiqueta}>
                    {/* `Dropdown` a mano y no `NavDropdown` porque NavDropdown
                        fuerza el toggle como NavLink, o sea un <a href="#">: un
                        enlace que no lleva a ningún lado. Acá el toggle es un
                        <button> de verdad, que es lo que corresponde a algo que
                        sólo abre y cierra un menú. react-bootstrap le aporta el
                        teclado (flechas, Escape) y los aria-expanded. */}
                    <Dropdown
                      show={grupoAbierto === item.grupo}
                      onToggle={(abierto) =>
                        setGrupoAbierto(abierto ? item.grupo : null)
                      }
                      align="end"
                    >
                      <Dropdown.Toggle
                        as="button"
                        type="button"
                        variant=""
                        className={`nav-enlace nav-enlace-toggle${
                          grupoActivo || grupoAbierto === item.grupo ? ' activo' : ''
                        }`}
                      >
                        <span className="nav-enlace-ico-wrap">
                          <item.icono className="nav-enlace-ico" aria-hidden="true" />
                        </span>
                        {item.etiqueta}
                        {/* El caret lo pone este ícono, no el ::after de Bootstrap:
                            el de Bootstrap es un SVG oscuro embebido que sobre el
                            naranja se ve sucio. */}
                        <FaChevronDown className="nav-toggle-caret" aria-hidden="true" />
                      </Dropdown.Toggle>
                      <Dropdown.Menu className="nav-submenu">
                        {item.hijos.map((hijo) => (
                          <Dropdown.Item
                            key={hijo.to}
                            /* El estado activo va como string y no como función
                               porque Dropdown.Item pasa el className por
                               classNames(), que espera texto: una función ahí
                               rompería el render. */
                            as={NavLink}
                            to={hijo.to}
                            end
                            className={`nav-submenu-enlace${
                              esHijoDe([hijo]) ? ' activo' : ''
                            }`}
                            onClick={cerrarNavegacion}
                          >
                            <hijo.icono className="nav-submenu-ico" aria-hidden="true" />
                            {hijo.etiqueta}
                          </Dropdown.Item>
                        ))}
                      </Dropdown.Menu>
                    </Dropdown>
                  </Nav.Item>
                );
              }

              const { to, etiqueta, icono: Icono, badge } = item;
              return (
                <Nav.Item key={to}>
                  <NavLink
                    to={to}
                    end
                    className={({ isActive }) => (isActive ? 'nav-enlace activo' : 'nav-enlace')}
                    onClick={cerrarNavegacion}
                  >
                    <span className={`nav-enlace-ico-wrap${pulsoDeIcono(badge)}`}>
                      <Icono className="nav-enlace-ico" aria-hidden="true" />
                      {renderBadge(badge)}
                    </span>
                    {etiqueta}
                  </NavLink>
                </Nav.Item>
              );
            })}
          </Nav>
          <Nav className="navbar-acciones">
            {/* A0: badge de la sucursal del admin, siempre visible en el
                panel. Se anuncia con `title`/`aria-label` para lectores de
                pantalla; no es un enlace, es información de contexto. */}
            {isAdmin && sucursalAdmin && (
              <span
                className="navbar-sucursal"
                title="Tu sucursal asignada"
                aria-label={`Tu sucursal asignada es ${sucursalAdmin}`}
              >
                <FaStore className="navbar-sucursal-ico" aria-hidden="true" />
                <span className="navbar-sucursal-nombre">{sucursalAdmin}</span>
              </span>
            )}
            {/* Botón del superadmin: su ícono es también el selector de sucursal
                de contexto. Al hacer clic se abre el desplegable para elegir
                otra sucursal o dejar de operar la actual. Va solo con ícono
                (sin el texto "Operando: X") para que, al cambiar de sucursal,
                el nombre de usuario y el botón de cerrar sesión no se salgan
                de la pantalla. */}
            {isSuperadmin ? (
              <Dropdown align="end" className="navbar-contexto-sucursal">
                <Dropdown.Toggle
                  as="button"
                  type="button"
                  variant=""
                  className={`btn-superadmin-contexto${
                    sucursalOperativa ? ' btn-superadmin-contexto-activo' : ''
                  }`}
                  aria-label={
                    sucursalOperativa
                      ? `Operando en ${sucursalOperativa.nombre}. Elegí otra sucursal`
                      : 'Elegir sucursal para operar'
                  }
                  title={
                    sucursalOperativa
                      ? `Operando: ${sucursalOperativa.nombre}`
                      : 'Elegir sucursal para operar'
                  }
                >
                  <FaUserTie className="navbar-user-ico" aria-hidden="true" />
                  <span className="btn-superadmin-texto">Superadmin</span>
                  {sucursalOperativa && (
                    <span className="btn-superadmin-dot" aria-hidden="true" />
                  )}
                </Dropdown.Toggle>
                <Dropdown.Menu>
                  {sucursalesActivas.map((s) => (
                    <Dropdown.Item
                      key={s.id}
                      active={
                        sucursalOperativa &&
                        Number(s.id) === Number(sucursalOperativa.id)
                      }
                      onClick={() => handleElegirContexto(s)}
                    >
                      {s.nombre}
                    </Dropdown.Item>
                  ))}
                  {sucursalesActivas.length === 0 && (
                    <Dropdown.Item disabled>No hay sucursales activas</Dropdown.Item>
                  )}
                  {sucursalOperativa && (
                    <>
                      <Dropdown.Divider />
                      <Dropdown.Item onClick={handleLimpiarContexto}>
                        Dejar de operar esta sucursal
                      </Dropdown.Item>
                    </>
                  )}
                </Dropdown.Menu>
              </Dropdown>
            ) : null}
            {!isAuthenticated && (
              /* El invitado llega acá desde el colapsable. Se le ofrece entrar y,
                 si no tiene cuenta, crearla: es el mismo par de acciones que la
                 app pide al final del camino de compra. La identidad del usuario
                 con sesión ya no se repite en la barra: vive en el menú de
                 cuenta del logo. */
              <>
                {accesoInvitado(false)}
                <NavLink
                  to="/registro"
                  state={{ from: origen }}
                  className="btn btn-acceso-secundario"
                >
                  Registrate
                </NavLink>
              </>
            )}
            {/* Campanita del centro de notificaciones (sólo CLIENTE). En móvil
                se usa la copia de la fila superior. */}
            {isCliente && (
              <CampanaNotificaciones className="campana-escritorio" />
            )}
            {/* Interruptor de tema del header de escritorio. En móvil el control
                vive en el menú de cuenta del logo (el invitado lo tiene en la
                fila superior). */}
            <SelectorTema />
          </Nav>
        </BSNavbar.Collapse>
      </Container>
      </BSNavbar>
      {/* El drawer se monta una sola vez; lo abre cualquiera de las dos copias
          de la campanita a través del contexto. */}
      {isCliente && <CentroNotificaciones />}
    </>
  );
};

export default Navbar;
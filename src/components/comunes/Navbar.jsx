/**
 * Propósito: Componente de barra de navegación que cambia según el rol del usuario.
 * Contenido: Navbar naranja con marca Comi-Rapi y enlaces con íconos (react-icons),
 *            resaltado de la página activa y animación al hover.
 *            El acceso al perfil del cliente es el avatar con su nombre, junto al
 *            botón de cerrar sesión. Para el invitado (sin sesión) el mismo lugar
 *            lo ocupan los botones de iniciar sesión y registrarse.
 * Dependencias: react-bootstrap (Navbar, Nav, Container, Button, Dropdown),
 *               react-router-dom (NavLink, useLocation, useNavigate), react-icons/fa,
 *               useAuth hook, useIndicadoresNav, Avatar, Navbar.css.
 * Uso: <Navbar /> - Se renderiza en todas las páginas.
 */

import { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Navbar as BSNavbar, Nav, Container, Button, Dropdown } from 'react-bootstrap';
import {
  FaHamburger,
  FaHome,
  FaUtensils,
  FaShoppingCart,
  FaReceipt,
  FaTachometerAlt,
  FaBoxes,
  FaStore,
  FaSlidersH,
  FaTags,
  FaPercent,
  FaUsers,
  FaUserTie,
  FaCog,
  FaBriefcase,
  FaUserCircle,
  FaSignOutAlt,
  FaSignInAlt,
  FaChevronDown,
} from 'react-icons/fa';
import { useAuth } from '../../hooks/useAuth';
import useIndicadoresNav from '../../hooks/useIndicadoresNav';
import { ROLES } from '../../utils/constants';
import { esRutaDeAlguna, rutaActual } from '../../utils/rutas';
import { nombreCompleto } from '../../utils/formatters';
import Avatar from './Avatar';
import './Navbar.css';

// Menú del cliente (cada enlace lleva su ícono). El perfil NO va acá: se entra
// desde el avatar de la derecha, junto al botón de cerrar sesión. Las
// direcciones tampoco: se gestionan desde el perfil.
// `badge` indica qué contador se dibuja junto al ícono.
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
 * Además opera pedidos, stock y clientes. Sucursales quedó fuera del menú
 * admin por lo mismo: lo maneja el superadmin. Stock queda suelto a propósito:
 * es un solo destino, y meterlo en un desplegable obligaría a un clic de más
 * para llegar a un solo lugar. */
const menuAdmin = [
  { to: '/admin/dashboard', etiqueta: 'Dashboard', icono: FaTachometerAlt },
  {
    to: '/admin/pedidos',
    etiqueta: 'Pedidos',
    icono: FaReceipt,
    badge: 'pedidos',
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
  { to: '/admin/clientes', etiqueta: 'Clientes', icono: FaUsers, prefijo: '/admin/clientes' },
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
    to: '/superadmin/administradores',
    etiqueta: 'Administradores',
    icono: FaUserTie,
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
    ],
  },
];

const Navbar = () => {
  const { user, logout, isAuthenticated, hydrated } = useAuth();
  // Los contadores de badge y sus pulsos viven en un hook aparte porque la barra
  // inferior muestra los mismos números: si cada componente los calculara por su
  // cuenta, dejarían de coincidir en algún momento.
  const {
    productosDistintos,
    pedidosActivos,
    pulsoCarrito,
    pulsoPedido,
    pulsoPedidoBadge,
  } = useIndicadoresNav();
  const navigate = useNavigate();
  const location = useLocation();
  const { pathname } = location;
  // Estado de los desplegables ("Catálogo" y "Negocio"). Se maneja acá en vez de
  // dejarlo interno para poder cerrarlos también al navegar: si no, el menú queda
  // colgando abierto sobre la página nueva. `null` = ninguno abierto.
  const [grupoAbierto, setGrupoAbierto] = useState(null);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  /* Sin saber si hay sesión no se puede elegir la zona de la derecha: se
     dibujaría el botón de acceso y un instante después el avatar. Se espera a
     que /auth/me responda (lo hace AuthContext al montar) y recién ahí se
     pinta la barra. */
  if (!hydrated) return null;

  const isCliente = user?.rol === ROLES.CLIENTE;
  const isAdmin = user?.rol === ROLES.ADMIN;
  const isSuperadmin = user?.rol === ROLES.SUPERADMIN;
  const destinoInicio = isAdmin
    ? '/admin/dashboard'
    : isSuperadmin
      ? '/superadmin/panel'
      : '/cliente/inicio';
  const menu = isAdmin
    ? menuAdmin
    : isSuperadmin
      ? menuSuperadmin
      : isCliente
        ? enlacesCliente
        : enlacesInvitado;
  const nombreUsuario = nombreCompleto(user?.nombre, user?.apellido);

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
    return null;
  };

  const pulsoDeIcono = (clave) =>
    (clave === 'carrito' && pulsoCarrito) || (clave === 'pedidos' && pulsoPedido)
      ? ' nav-enlace-ico-pulso'
      : '';

  return (
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
        <BSNavbar.Brand
          as={NavLink}
          to={destinoInicio}
          className="navbar-brand-comirapi"
        >
          <FaHamburger className="brand-ico" aria-hidden="true" />
          <span translate="no">Comi-Rapi</span>
        </BSNavbar.Brand>
        {/* Avatar del cliente en la fila superior, fuera del colapsable: en móvil
            el perfil quedaba escondido dentro del colapsable y había que abrir
            la barra para llegar. Sólo se ve bajo `lg`, donde el colapsable está
            plegado. */}
        {isCliente && (
          <NavLink
            to="/cliente/perfil"
            aria-label="Mi perfil"
            className={({ isActive }) =>
              `navbar-perfil navbar-perfil-movil${
                isActive ? ' navbar-perfil-activo' : ''
              }`
            }
          >
            <Avatar
              src={user?.fotoPerfilUrl}
              nombre={user?.nombre}
              apellido={user?.apellido}
              size={38}
            />
          </NavLink>
        )}
        {/* El invitado no tiene perfil ni sesión que cerrar, así que en su lugar
            va el acceso. Va en la fila superior (no dentro del colapsable) por lo
            mismo que el avatar: en móvil el colapsable está plegado y sería
            inalcanzable. */}
        {!isAuthenticated && accesoInvitado(true)}
        {isAuthenticated && (
          <Button
            variant="outline-dark"
            size="sm"
            className="btn-logout-comirapi btn-logout-movil"
            aria-label="Cerrar sesión"
            title="Cerrar sesión"
            onClick={handleLogout}
          >
            <FaSignOutAlt aria-hidden="true" />
          </Button>
        )}
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
            {!isAuthenticated ? (
              /* El invitado llega acá desde el colapsable. Se le ofrece entrar y,
                 si no tiene cuenta, crearla: es el mismo par de acciones que la
                 app pide al final del camino de compra. */
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
            ) : isCliente ? (
              /* Acceso al perfil con avatar + nombre. Se oculta en móvil porque
                 ahí el mismo destino ya está en la fila superior
                 (navbar-perfil-movil): dos accesos idénticos en pantalla
                 obligan a elegir sin información. */
              <NavLink
                to="/cliente/perfil"
                aria-label="Mi perfil"
                className={({ isActive }) =>
                  `navbar-perfil navbar-perfil-desplegado${
                    isActive ? ' navbar-perfil-activo' : ''
                  }`
                }
              >
                <Avatar
                  src={user?.fotoPerfilUrl}
                  nombre={user?.nombre}
                  apellido={user?.apellido}
                  size={38}
                />
                <span className="navbar-perfil-nombre">{nombreUsuario}</span>
              </NavLink>
            ) : (
              <span className="navbar-user-nombre">
                <FaUserCircle className="navbar-user-ico" aria-hidden="true" />
                {user?.nombre}
              </span>
            )}
            {isAuthenticated && (
              <Button
                variant="outline-dark"
                size="sm"
                className="btn-logout-comirapi"
                aria-label="Cerrar sesión"
                title="Cerrar sesión"
                onClick={handleLogout}
              >
                <FaSignOutAlt aria-hidden="true" />
                <span className="btn-logout-texto">Cerrar sesión</span>
              </Button>
            )}
          </Nav>
        </BSNavbar.Collapse>
      </Container>
    </BSNavbar>
  );
};

export default Navbar;
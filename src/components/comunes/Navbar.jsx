/**
 * Propósito: Componente de barra de navegación que cambia según el rol del usuario.
 * Contenido: Navbar naranja con marca Comi-Rapi y enlaces con íconos (react-icons),
 *            resaltado de la página activa y animación al hover.
 *            El acceso al perfil del cliente es el avatar con su nombre, junto al
 *            botón de cerrar sesión.
 * Dependencias: react-bootstrap (Navbar, Nav, Container, Button, Dropdown),
 *               react-router-dom (NavLink, useLocation, useNavigate), react-icons/fa,
 *               useAuth hook, useIndicadoresNav, Avatar, Navbar.css.
 * Uso: <Navbar /> - Se renderiza en todas las páginas autenticadas.
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
  FaUserCircle,
  FaSignOutAlt,
  FaChevronDown,
} from 'react-icons/fa';
import { useAuth } from '../../hooks/useAuth';
import useIndicadoresNav from '../../hooks/useIndicadoresNav';
import { ROLES } from '../../utils/constants';
import { esRutaDeAlguna } from '../../utils/rutas';
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

/* Menú del administrador.
 *
 * Antes eran ocho enlaces sueltos en la barra. Con el ícono, la pastilla y el
 * texto de cada uno, no entraban en una fila a 1280px: como el container de
 * Bootstrap es `flex-wrap: wrap`, la barra se partía en dos y al ser `sticky-top`
 * tapaba parte de la pantalla. Ahora hay cinco destinos al nivel principal y el
 * catálogo va agrupado en un desplegable.
 *
 * Sucursales y Stock quedan sueltos a propósito: son dos destinos, y meterlos en
 * un desplegable obligaría a un clic de más para llegar a un solo lugar. */
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
        to: '/admin/personalizacion',
        etiqueta: 'Personalización',
        icono: FaSlidersH,
      },
      {
        to: '/admin/promociones',
        etiqueta: 'Promociones',
        icono: FaPercent,
        prefijo: '/admin/promocion',
      },
    ],
  },
  { to: '/admin/sucursales', etiqueta: 'Sucursales', icono: FaStore, prefijo: '/admin/sucursal' },
  { to: '/admin/stock', etiqueta: 'Stock', icono: FaBoxes },
];

const Navbar = () => {
  const { user, logout, isAuthenticated } = useAuth();
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
  const { pathname } = useLocation();
  // Estado del desplegable de "Catálogo". Se maneja acá en vez de dejarlo interno
  // para poder cerrarlo también al navegar: si no, el menú queda colgando
  // abierto sobre la página nueva.
  const [grupoAbierto, setGrupoAbierto] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!isAuthenticated) return null;

  const isCliente = user?.rol === ROLES.CLIENTE;
  const isAdmin = user?.rol === ROLES.ADMIN;
  const destinoInicio = isCliente ? '/cliente/inicio' : '/admin/dashboard';
  const menu = isCliente ? enlacesCliente : isAdmin ? menuAdmin : [];
  const nombreUsuario = nombreCompleto(user?.nombre, user?.apellido);

  const cerrarNavegacion = () => {
    setGrupoAbierto(false);
  };

  /* El desplegable se marca activo si la ruta actual es una de sus secciones o
     una de sus subpantallas de alta/edición: dentro de /admin/producto/editar/3
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
                      show={grupoAbierto}
                      onToggle={(abierto) => setGrupoAbierto(abierto)}
                      align="end"
                    >
                      <Dropdown.Toggle
                        as="button"
                        type="button"
                        variant=""
                        className={`nav-enlace nav-enlace-toggle${
                          grupoActivo || grupoAbierto ? ' activo' : ''
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
            {isCliente ? (
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
          </Nav>
        </BSNavbar.Collapse>
      </Container>
    </BSNavbar>
  );
};

export default Navbar;
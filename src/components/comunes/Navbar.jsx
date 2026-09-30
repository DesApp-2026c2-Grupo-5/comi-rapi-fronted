/**
 * Propósito: Componente de barra de navegación que cambia según el rol del usuario.
 * Contenido: Navbar naranja con marca Comi-Rapi y enlaces con íconos (react-icons),
 *            resaltado de la página activa y animación al hover.
 *            El acceso al perfil del cliente es el avatar con su nombre, junto al
 *            botón de cerrar sesión.
 * Dependencias: react-bootstrap (Navbar, Nav, Container, Button), react-router-dom (NavLink,
 *               useNavigate), react-icons/fa, useAuth hook, Avatar, Navbar.css.
 * Uso: <Navbar /> - Se renderiza en todas las páginas autenticadas.
 */

import { useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Navbar as BSNavbar, Nav, Container, Button } from 'react-bootstrap';
import {
  FaHamburger,
  FaHome,
  FaUtensils,
  FaShoppingCart,
  FaReceipt,
  FaTachometerAlt,
  FaStore,
  FaSlidersH,
  FaTags,
  FaPercent,
  FaUserCircle,
  FaSignOutAlt,
} from 'react-icons/fa';
import { useAuth } from '../../hooks/useAuth';
import { useCarrito } from '../../hooks/useCarrito';
import { usePedidos } from '../../hooks/usePedidos';
import { ROLES, ESTADOS_PEDIDO } from '../../utils/constants';
import { nombreCompleto } from '../../utils/formatters';
import Avatar from './Avatar';
import './Navbar.css';

// Menú del cliente (cada enlace lleva su ícono). El perfil NO va acá: se entra
// desde el avatar de la derecha, junto al botón de cerrar sesión. Las
// direcciones tampoco: se gestionan desde el perfil.
const enlacesCliente = [
  { to: '/cliente/inicio', etiqueta: 'Inicio', icono: FaHome },
  { to: '/cliente/catalogo', etiqueta: 'Catálogo', icono: FaUtensils },
  { to: '/cliente/carrito', etiqueta: 'Carrito', icono: FaShoppingCart },
  { to: '/cliente/mis-pedidos', etiqueta: 'Mis Pedidos', icono: FaReceipt },
];

// Menú del administrador
const enlacesAdmin = [
  { to: '/admin/dashboard', etiqueta: 'Dashboard', icono: FaTachometerAlt },
  { to: '/admin/productos', etiqueta: 'Productos', icono: FaHamburger },
  { to: '/admin/categorias', etiqueta: 'Categorías', icono: FaTags },
  { to: '/admin/pedidos', etiqueta: 'Pedidos', icono: FaReceipt },
  { to: '/admin/sucursales', etiqueta: 'Sucursales', icono: FaStore },
  { to: '/admin/personalizacion', etiqueta: 'Personalización', icono: FaSlidersH },
  { to: '/admin/promociones', etiqueta: 'Promociones', icono: FaPercent },
];

const Navbar = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const { productosDistintos } = useCarrito();
  const { pedidos, senalPedido } = usePedidos();
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(false);
  const [pulsoCarrito, setPulsoCarrito] = useState(false);
  const [pulsoPedido, setPulsoPedido] = useState(false);
  const [pulsoPedidoBadge, setPulsoPedidoBadge] = useState(false);

  // Pedidos del cliente que aún no fueron entregados ni cancelados.
  const pedidosActivos = pedidos.filter(
    (p) =>
      p.estado !== ESTADOS_PEDIDO.ENTREGADO &&
      p.estado !== ESTADOS_PEDIDO.CANCELADO
  ).length;

  // Pulso del badge cada vez que cambia la cantidad de productos distintos
  useEffect(() => {
    if (productosDistintos === 0) return undefined;
    setPulsoCarrito(true);
    const timeout = setTimeout(() => setPulsoCarrito(false), 800);
    return () => clearTimeout(timeout);
  }, [productosDistintos]);

  // Salto del ícono "Mis Pedidos" cada vez que se confirma un pago
  useEffect(() => {
    if (senalPedido === 0) return undefined;
    setPulsoPedido(true);
    const timeout = setTimeout(() => setPulsoPedido(false), 800);
    return () => clearTimeout(timeout);
  }, [senalPedido]);

  // Pulso del número de "Mis Pedidos" cuando cambia la cantidad de pedidos activos
  useEffect(() => {
    if (pedidosActivos === 0) return undefined;
    setPulsoPedidoBadge(true);
    const timeout = setTimeout(() => setPulsoPedidoBadge(false), 800);
    return () => clearTimeout(timeout);
  }, [pedidosActivos]);

  const handleLogout = () => {
    setExpanded(false);
    logout();
    navigate('/login');
  };

  if (!isAuthenticated) return null;

  const isCliente = user?.rol === ROLES.CLIENTE;
  const isAdmin = user?.rol === ROLES.ADMIN;
  const destinoInicio = isCliente ? '/cliente/inicio' : '/admin/dashboard';
  const enlaces = isCliente ? enlacesCliente : isAdmin ? enlacesAdmin : [];
  const nombreUsuario = nombreCompleto(user?.nombre, user?.apellido);

  return (
    <BSNavbar
      expand="lg"
      sticky="top"
      className="navbar-comirapi"
      expanded={expanded}
      onToggle={(nuevoEstado) => setExpanded(nuevoEstado)}
    >
      <Container>
        <BSNavbar.Brand
          as={NavLink}
          to={destinoInicio}
          className="navbar-brand-comirapi"
          onClick={() => setExpanded(false)}
        >
          <FaHamburger className="brand-ico" />
          Comi-Rapi
        </BSNavbar.Brand>
        <BSNavbar.Toggle aria-controls="main-navbar" />
        <BSNavbar.Collapse id="main-navbar">
          <Nav className="me-auto align-items-center gap-lg-1">
            {enlaces.map(({ to, etiqueta, icono: Icono }) => (
              <Nav.Item key={to}>
                <NavLink
                  to={to}
                  end
                  className={({ isActive }) => (isActive ? 'nav-enlace activo' : 'nav-enlace')}
                  onClick={() => setExpanded(false)}
                >
                  <span
                    className={`nav-enlace-ico-wrap${
                      (to === '/cliente/carrito' && pulsoCarrito) ||
                      (to === '/cliente/mis-pedidos' && pulsoPedido)
                        ? ' nav-enlace-ico-pulso'
                        : ''
                    }`}
                  >
                    <Icono className="nav-enlace-ico" aria-hidden="true" />
                    {to === '/cliente/carrito' && productosDistintos > 0 && (
                      <span
                        className={`carrito-badge${pulsoCarrito ? ' carrito-badge-pulso' : ''}`}
                        aria-label={`${productosDistintos} ${productosDistintos === 1 ? 'producto' : 'productos'} en el carrito`}
                      >
                        {productosDistintos}
                      </span>
                    )}
                    {(to === '/cliente/mis-pedidos' || to === '/admin/pedidos') && pedidosActivos > 0 && (
                      <span
                        className={`carrito-badge${pulsoPedidoBadge ? ' carrito-badge-pulso' : ''}`}
                        aria-label={`${pedidosActivos} ${pedidosActivos === 1 ? 'pedido' : 'pedidos'} en curso`}
                      >
                        {pedidosActivos}
                      </span>
                    )}
                  </span>
                  {etiqueta}
                </NavLink>
              </Nav.Item>
            ))}
          </Nav>
          <Nav className="navbar-acciones">
            {isCliente ? (
              // Acceso al perfil: avatar con la foto (o las iniciales) + nombre.
              <NavLink
                to="/cliente/perfil"
                aria-label="Mi perfil"
                className={({ isActive }) =>
                  `navbar-perfil${isActive ? ' navbar-perfil-activo' : ''}`
                }
                onClick={() => setExpanded(false)}
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
/**
 * Propósito: Componente de barra de navegación que cambia según el rol del usuario.
 * Contenido: Navbar naranja con marca Comi-Rapi y enlaces con íconos (react-icons),
 *            resaltado de la página activa y animación al hover.
 * Dependencias: react-bootstrap (Navbar, Nav, Container, Button), react-router-dom (NavLink,
 *               useNavigate), react-icons/fa, useAuth hook, Navbar.css.
 * Uso: <Navbar /> - Se renderiza en todas las páginas autenticadas.
 */

import React, { useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Navbar as BSNavbar, Nav, Container, Button } from 'react-bootstrap';
import {
  FaHamburger,
  FaHome,
  FaUtensils,
  FaShoppingCart,
  FaReceipt,
  FaMapMarkerAlt,
  FaTachometerAlt,
  FaStore,
  FaSlidersH,
  FaTags,
  FaUserCircle,
  FaSignOutAlt,
} from 'react-icons/fa';
import { useAuth } from '../../hooks/useAuth';
import { useCarrito } from '../../hooks/useCarrito';
import { usePedidos } from '../../hooks/usePedidos';
import { ROLES, ESTADOS_PEDIDO } from '../../utils/constants';
import './Navbar.css';

// Menú del cliente (cada enlace lleva su ícono)
const enlacesCliente = [
  { to: '/cliente/inicio', etiqueta: 'Inicio', icono: FaHome },
  { to: '/cliente/catalogo', etiqueta: 'Catálogo', icono: FaUtensils },
  { to: '/cliente/carrito', etiqueta: 'Carrito', icono: FaShoppingCart },
  { to: '/cliente/mis-pedidos', etiqueta: 'Mis Pedidos', icono: FaReceipt },
  { to: '/cliente/mis-direcciones', etiqueta: 'Mis direcciones', icono: FaMapMarkerAlt },
];

// Menú del administrador
const enlacesAdmin = [
  { to: '/admin/dashboard', etiqueta: 'Dashboard', icono: FaTachometerAlt },
  { to: '/admin/productos', etiqueta: 'Productos', icono: FaHamburger },
  { to: '/admin/categorias', etiqueta: 'Categorías', icono: FaTags },
  { to: '/admin/pedidos', etiqueta: 'Pedidos', icono: FaReceipt },
  { to: '/admin/sucursales', etiqueta: 'Sucursales', icono: FaStore },
  { to: '/admin/personalizacion', etiqueta: 'Personalización', icono: FaSlidersH },
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
          <Nav className="d-flex align-items-center gap-2 mt-2 mt-lg-0">
            <span className="navbar-user-nombre">
              <FaUserCircle className="navbar-user-ico" aria-hidden="true" />
              {user?.nombre}
            </span>
            <Button variant="outline-dark" size="sm" className="btn-logout-comirapi" onClick={handleLogout}>
              <FaSignOutAlt className="me-1" aria-hidden="true" />
              Cerrar sesión
            </Button>
          </Nav>
        </BSNavbar.Collapse>
      </Container>
    </BSNavbar>
  );
};

export default Navbar;
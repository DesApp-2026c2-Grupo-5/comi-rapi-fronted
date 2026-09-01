/**
 * Propósito: Componente de barra de navegación que cambia según el rol del usuario.
 * Contenido: Navbar naranja con marca Comi-Rapi y enlaces con íconos (react-icons),
 *            resaltado de la página activa y animación al hover.
 * Dependencias: react-bootstrap (Navbar, Nav, Container, Button), react-router-dom (NavLink,
 *               useNavigate), react-icons/fa, useAuth hook, Navbar.css.
 * Uso: <Navbar /> - Se renderiza en todas las páginas autenticadas.
 */

import React from 'react';
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
  FaUserCircle,
  FaSignOutAlt,
} from 'react-icons/fa';
import { useAuth } from '../../hooks/useAuth';
import { ROLES } from '../../utils/constants';
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
  { to: '/admin/pedidos', etiqueta: 'Pedidos', icono: FaReceipt },
  { to: '/admin/sucursales', etiqueta: 'Sucursales', icono: FaStore },
];

const Navbar = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!isAuthenticated) return null;

  const isCliente = user?.rol === ROLES.CLIENTE;
  const isAdmin = user?.rol === ROLES.ADMIN;
  const destinoInicio = isCliente ? '/cliente/inicio' : '/admin/dashboard';
  const enlaces = isCliente ? enlacesCliente : isAdmin ? enlacesAdmin : [];

  return (
    <BSNavbar expand="lg" sticky="top" className="navbar-comirapi">
      <Container>
        <BSNavbar.Brand as={NavLink} to={destinoInicio} className="navbar-brand-comirapi">
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
                >
                  <Icono className="nav-enlace-ico" aria-hidden="true" />
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
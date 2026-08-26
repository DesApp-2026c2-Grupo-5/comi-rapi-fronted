/**
 * Propósito: Componente de barra de navegación que cambia según el rol del usuario.
 * Contenido: Navbar con enlaces según rol y botón de cerrar sesión.
 * Dependencias: react-bootstrap (Navbar, Nav, Container, Button), react-router-dom, useAuth hook.
 * Uso: <Navbar /> - Se renderiza en todas las páginas autenticadas.
 */

import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Navbar as BSNavbar, Nav, Container, Button } from 'react-bootstrap';
import { useAuth } from '../../hooks/useAuth';
import { ROLES } from '../../utils/constants';

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

  return (
    <BSNavbar bg="dark" variant="dark" expand="lg" sticky="top">
      <Container>
        <BSNavbar.Brand as={Link} to={isCliente ? '/cliente/inicio' : '/admin/dashboard'}>
          Comi-Rapi
        </BSNavbar.Brand>
        <BSNavbar.Toggle aria-controls="main-navbar" />
        <BSNavbar.Collapse id="main-navbar">
          <Nav className="me-auto">
            {isCliente && (
              <>
                <Nav.Link as={Link} to="/cliente/inicio">Inicio</Nav.Link>
                <Nav.Link as={Link} to="/cliente/catalogo">Catálogo</Nav.Link>
                <Nav.Link as={Link} to="/cliente/carrito">Carrito</Nav.Link>
                <Nav.Link as={Link} to="/cliente/mis-pedidos">Mis Pedidos</Nav.Link>
              </>
            )}
            {isAdmin && (
              <>
                <Nav.Link as={Link} to="/admin/dashboard">Dashboard</Nav.Link>
                <Nav.Link as={Link} to="/admin/productos">Productos</Nav.Link>
                <Nav.Link as={Link} to="/admin/pedidos">Pedidos</Nav.Link>
              </>
            )}
          </Nav>
          <Nav className="d-flex align-items-center gap-2">
            <BSNavbar.Text className="text-light me-2">
              {user?.nombre}
            </BSNavbar.Text>
            <Button variant="outline-light" size="sm" onClick={handleLogout}>
              Cerrar sesión
            </Button>
          </Nav>
        </BSNavbar.Collapse>
      </Container>
    </BSNavbar>
  );
};

export default Navbar;

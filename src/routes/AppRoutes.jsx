/**
 * Propósito: Definición de todas las rutas de la aplicación (públicas, cliente y admin).
 * Contenido: Componente AppRoutes con Routes y Route anidados, usando ProtectedRoute.
 * Dependencias: react-router-dom, ProtectedRoute, todas las páginas.
 * Uso: Se renderiza dentro de App.jsx dentro del BrowserRouter.
 */

import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Componentes comunes
import ProtectedRoute, { PublicOnlyRoute, destinoPorRol } from '../components/comunes/ProtectedRoute';
import { useAuth } from '../hooks/useAuth';

// Redirige a /login si no hay sesión, o al inicio del usuario si ya está autenticado
const RootRedirect = () => {
  const { isAuthenticated, user, hydrated } = useAuth();

  if (!hydrated) return null;

  return <Navigate to={isAuthenticated ? destinoPorRol(user) : '/login'} replace />;
};

// Páginas públicas
import Login from '../pages/comunes/Login';
import Registro from '../pages/comunes/Registro';
import RecuperarPassword from '../pages/comunes/RecuperarPassword';
import NuevaPassword from '../pages/comunes/NuevaPassword';
import AdminLogin from '../pages/admin/AdminLogin';
import AdminRegister from '../pages/admin/AdminRegister';

// Páginas cliente
import Inicio from '../pages/cliente/Inicio';
import Catalogo from '../pages/cliente/Catalogo';
import Carrito from '../pages/cliente/Carrito';
import Pago from '../pages/cliente/Pago';
import ConfirmacionPedido from '../pages/cliente/ConfirmacionPedido';
import MisPedidos from '../pages/cliente/MisPedidos';
import HistorialPedidos from '../pages/cliente/HistorialPedidos';
import DetallePedido from '../pages/cliente/DetallePedido';
import Perfil from '../pages/cliente/Perfil';

// Páginas admin
import Dashboard from '../pages/admin/Dashboard';
import GestionProductos from '../pages/admin/GestionProductos';
import EditarProducto from '../pages/admin/EditarProducto';
import GestionCategorias from '../pages/admin/GestionCategorias';
import EditarCategoria from '../pages/admin/EditarCategoria';
import GestionPedidos from '../pages/admin/GestionPedidos';
import GestionSucursales from '../pages/admin/GestionSucursales';
import GestionStock from '../pages/admin/GestionStock';
import EditarSucursal from '../pages/admin/EditarSucursal';
import GestionPersonalizacion from '../pages/admin/GestionPersonalizacion';
import EditarPersonalizacion from '../pages/admin/EditarPersonalizacion';
import GestionPromociones from '../pages/admin/GestionPromociones';
import EditarPromocion from '../pages/admin/EditarPromocion';

/**
 * Definición de rutas de la aplicación.
 * Rutas públicas: /login, /registro, /admin-login, /admin-registro
 * Rutas protegidas cliente: /cliente/*
 * Rutas protegidas admin: /admin/*
 */
const AppRoutes = () => {
  return (
    <Routes>
      {/* Redirección raíz: según estado de sesión */}
      <Route path="/" element={<RootRedirect />} />

      {/* Rutas públicas (solo accesibles sin sesión) */}
      <Route element={<PublicOnlyRoute />}>
        <Route path="/login" element={<Login />} />
        <Route path="/registro" element={<Registro />} />
        <Route path="/admin-login" element={<AdminLogin />} />
        <Route path="/admin-registro" element={<AdminRegister />} />
        {/* Recuperación de contraseña. /reset-password debe coincidir con el
            enlace que arma email_service.js en el backend. */}
        <Route path="/forgot-password" element={<RecuperarPassword />} />
        <Route path="/reset-password" element={<NuevaPassword />} />
      </Route>

      {/* Rutas protegidas de cliente */}
      <Route element={<ProtectedRoute requiredRole="CLIENTE" />}>
        <Route path="/cliente/inicio" element={<Inicio />} />
        <Route path="/cliente/catalogo" element={<Catalogo />} />
        <Route path="/cliente/carrito" element={<Carrito />} />
        <Route path="/cliente/pago" element={<Pago />} />
        <Route path="/cliente/confirmacion" element={<ConfirmacionPedido />} />
        <Route path="/cliente/mis-pedidos" element={<MisPedidos />} />
        <Route path="/cliente/historial" element={<HistorialPedidos />} />
        <Route path="/cliente/pedido/:id" element={<DetallePedido />} />
        <Route path="/cliente/perfil" element={<Perfil />} />
      </Route>

      {/* Rutas protegidas de administrador */}
      <Route element={<ProtectedRoute requiredRole="ADMINISTRADOR" />}>
        <Route path="/admin/dashboard" element={<Dashboard />} />
        <Route path="/admin/productos" element={<GestionProductos />} />
        <Route path="/admin/producto/editar/:id" element={<EditarProducto />} />
        <Route path="/admin/producto/nuevo" element={<EditarProducto />} />
      <Route path="/admin/producto/nuevo-combo" element={<EditarProducto />} />
        <Route path="/admin/categorias" element={<GestionCategorias />} />
        <Route path="/admin/categoria/nuevo" element={<EditarCategoria />} />
        <Route path="/admin/categoria/editar/:id" element={<EditarCategoria />} />
        <Route path="/admin/pedidos" element={<GestionPedidos />} />
        <Route path="/admin/sucursales" element={<GestionSucursales />} />
      <Route path="/admin/stock" element={<GestionStock />} />
        <Route path="/admin/sucursal/nuevo" element={<EditarSucursal />} />
        <Route path="/admin/sucursal/editar/:id" element={<EditarSucursal />} />
        <Route path="/admin/personalizacion" element={<GestionPersonalizacion />} />
        <Route path="/admin/personalizacion/nuevo" element={<EditarPersonalizacion />} />
        <Route path="/admin/personalizacion/editar/:id" element={<EditarPersonalizacion />} />
        <Route path="/admin/promociones" element={<GestionPromociones />} />
        <Route path="/admin/promocion/nuevo" element={<EditarPromocion />} />
        <Route path="/admin/promocion/editar/:id" element={<EditarPromocion />} />
      </Route>

      {/* Ruta 404 - redirige según estado de sesión */}
      <Route path="*" element={<RootRedirect />} />
    </Routes>
  );
};

export default AppRoutes;

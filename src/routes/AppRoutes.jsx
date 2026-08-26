/**
 * Propósito: Definición de todas las rutas de la aplicación (públicas, cliente y admin).
 * Contenido: Componente AppRoutes con Routes y Route anidados, usando ProtectedRoute.
 * Dependencias: react-router-dom, ProtectedRoute, todas las páginas.
 * Uso: Se renderiza dentro de App.jsx dentro del BrowserRouter.
 */

import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Componentes comunes
import ProtectedRoute from '../components/comunes/ProtectedRoute';

// Páginas públicas
import Login from '../pages/comunes/Login';
import Registro from '../pages/comunes/Registro';
import AdminLogin from '../pages/admin/AdminLogin';
import AdminRegister from '../pages/admin/AdminRegister';

// Páginas cliente
import Inicio from '../pages/cliente/Inicio';
import Catalogo from '../pages/cliente/Catalogo';
import Carrito from '../pages/cliente/Carrito';
import ConfirmacionPedido from '../pages/cliente/ConfirmacionPedido';
import MisPedidos from '../pages/cliente/MisPedidos';
import DetallePedido from '../pages/cliente/DetallePedido';

// Páginas admin
import Dashboard from '../pages/admin/Dashboard';
import GestionProductos from '../pages/admin/GestionProductos';
import EditarProducto from '../pages/admin/EditarProducto';
import GestionPedidos from '../pages/admin/GestionPedidos';

/**
 * Definición de rutas de la aplicación.
 * Rutas públicas: /login, /registro, /admin-login, /admin-registro
 * Rutas protegidas cliente: /cliente/*
 * Rutas protegidas admin: /admin/*
 */
const AppRoutes = () => {
  return (
    <Routes>
      {/* Redirección raíz → login */}
      <Route path="/" element={<Navigate to="/login" replace />} />

      {/* Rutas públicas */}
      <Route path="/login" element={<Login />} />
      <Route path="/registro" element={<Registro />} />
      <Route path="/admin-login" element={<AdminLogin />} />
      <Route path="/admin-registro" element={<AdminRegister />} />

      {/* Rutas protegidas de cliente */}
      <Route element={<ProtectedRoute requiredRole="CLIENTE" />}>
        <Route path="/cliente/inicio" element={<Inicio />} />
        <Route path="/cliente/catalogo" element={<Catalogo />} />
        <Route path="/cliente/carrito" element={<Carrito />} />
        <Route path="/cliente/confirmacion" element={<ConfirmacionPedido />} />
        <Route path="/cliente/mis-pedidos" element={<MisPedidos />} />
        <Route path="/cliente/pedido/:id" element={<DetallePedido />} />
      </Route>

      {/* Rutas protegidas de administrador */}
      <Route element={<ProtectedRoute requiredRole="ADMIN" />}>
        <Route path="/admin/dashboard" element={<Dashboard />} />
        <Route path="/admin/productos" element={<GestionProductos />} />
        <Route path="/admin/producto/editar/:id" element={<EditarProducto />} />
        <Route path="/admin/producto/nuevo" element={<EditarProducto />} />
        <Route path="/admin/pedidos" element={<GestionPedidos />} />
      </Route>

      {/* Ruta 404 - redirige a login */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
};

export default AppRoutes;

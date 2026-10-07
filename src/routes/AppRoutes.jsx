/**
 * Propósito: Definición de todas las rutas de la aplicación (públicas, de compra
 *            sin sesión, cliente y admin).
 * Contenido: Componente AppRoutes con Routes y Route anidados, usando ProtectedRoute.
 * Dependencias: react-router-dom, ProtectedRoute, Loader, páginas.
 * Uso: Se renderiza dentro de App.jsx dentro del BrowserRouter.
 *
 * Las páginas de administración se cargan con `lazy`: son 13 pantallas y un
 * cliente nunca las abre, así que sin esto el bundle inicial las descargaba
 * igual (503 kB en un solo chunk). Con `lazy` viajan en un aparte que sólo se
 * pide al entrar al panel. Las públicas y las de cliente que forman el camino
 * de compra quedan en el bundle inicial a propósito: son la primera pantalla
 * que ve la mayoría.
 */

import { lazy, Suspense, useEffect, useRef } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';

// Componentes comunes
import ProtectedRoute, {
  PublicOnlyRoute,
  RutaCompra,
  destinoPorRol,
} from '../components/comunes/ProtectedRoute';
import Loader from '../components/comunes/Loader';
import { useAuth } from '../hooks/useAuth';

// Redirige al inicio del rol si hay sesión y a la home si no la hay
const RootRedirect = () => {
  const { isAuthenticated, user, hydrated } = useAuth();

  if (!hydrated) return null;

  return <Navigate to={isAuthenticated ? destinoPorRol(user) : '/cliente/inicio'} replace />;
};

/**
 * Al cambiar de ruta hay que devolver el foco al contenido principal: si no, el
 * foco se queda en el enlace que se pulsó y al seguir leyendo se sigue
 * escuchando el nombre de ese enlace, como si la página nueva no se hubiera
 * cargado.
 *
 * El focus() sin preventScroll resuelve además el scroll: no había ningún
 * manejo de scroll en la app, así que al navegar desde el final de un catálogo
 * largo se llegaba a la página nueva a media altura.
 *
 * Se apunta a #main (el <main tabIndex={-1}> de App.jsx) y no a un elemento
 * nuevo: agregar un contenedor oculto con un <h1> propio metería un segundo
 * h1 en cada pantalla, compitiendo con el título real de la página. El primer
 * render se saltea para no robarle el foco al usuario en la carga inicial.
 */
const FocoAlCambiarDeRuta = () => {
  const location = useLocation();
  const esPrimerRender = useRef(true);

  useEffect(() => {
    if (esPrimerRender.current) {
      esPrimerRender.current = false;
      return;
    }
    document.getElementById('main')?.focus();
  }, [location.pathname]);

  return null;
};

// Páginas públicas
import Login from '../pages/comunes/Login';
import Registro from '../pages/comunes/Registro';
import RecuperarPassword from '../pages/comunes/RecuperarPassword';
import NuevaPassword from '../pages/comunes/NuevaPassword';
import AdminLogin from '../pages/admin/AdminLogin';

// Páginas cliente
import Inicio from '../pages/cliente/Inicio';
import Catalogo from '../pages/cliente/Catalogo';
import Carrito from '../pages/cliente/Carrito';

const Pago = lazy(() => import('../pages/cliente/Pago'));
const ConfirmacionPedido = lazy(() => import('../pages/cliente/ConfirmacionPedido'));
const MisPedidos = lazy(() => import('../pages/cliente/MisPedidos'));
const HistorialPedidos = lazy(() => import('../pages/cliente/HistorialPedidos'));
const DetallePedido = lazy(() => import('../pages/cliente/DetallePedido'));
const Perfil = lazy(() => import('../pages/cliente/Perfil'));

// Páginas admin
const Dashboard = lazy(() => import('../pages/admin/Dashboard'));
const GestionPedidos = lazy(() => import('../pages/admin/GestionPedidos'));
const GestionStock = lazy(() => import('../pages/admin/GestionStock'));
const GestionClientes = lazy(() => import('../pages/admin/GestionClientes'));
const DetalleCliente = lazy(() => import('../pages/admin/DetalleCliente'));
// Catálogo del admin: solo lectura + disponibilidad por sucursal
const AdminGestionProductos = lazy(() => import('../pages/admin/GestionProductos'));
const AdminGestionCategorias = lazy(() => import('../pages/admin/GestionCategorias'));
const AdminGestionPromociones = lazy(() => import('../pages/admin/GestionPromociones'));

// Páginas superadmin
const PanelSuperadmin = lazy(() => import('../pages/superadmin/PanelSuperadmin'));
const GestionAdministradores = lazy(() => import('../pages/superadmin/GestionAdministradores'));
const GestionClientesSuperadmin = lazy(() => import('../pages/superadmin/GestionClientes'));
const DetalleClienteSuperadmin = lazy(() => import('../pages/superadmin/DetalleCliente'));
const GestionSucursales = lazy(() => import('../pages/superadmin/GestionSucursales'));
const EditarSucursal = lazy(() => import('../pages/superadmin/EditarSucursal'));
const GestionProductos = lazy(() => import('../pages/superadmin/GestionProductos'));
const EditarProducto = lazy(() => import('../pages/superadmin/EditarProducto'));
const GestionCategorias = lazy(() => import('../pages/superadmin/GestionCategorias'));
const EditarCategoria = lazy(() => import('../pages/superadmin/EditarCategoria'));
const GestionPersonalizacion = lazy(() => import('../pages/superadmin/GestionPersonalizacion'));
const EditarPersonalizacion = lazy(() => import('../pages/superadmin/EditarPersonalizacion'));
const GestionPromociones = lazy(() => import('../pages/superadmin/GestionPromociones'));
const EditarPromocion = lazy(() => import('../pages/superadmin/EditarPromocion'));

/**
 * Definición de rutas de la aplicación.
 * Rutas públicas: /login, /registro, /admin-login
 * Rutas de compra sin sesión: /cliente/inicio, /cliente/catalogo, /cliente/carrito
 * Rutas protegidas cliente: /cliente/*
 * Rutas protegidas admin: /admin/*
 */
const AppRoutes = () => {
  return (
    <>
      <FocoAlCambiarDeRuta />
      {/* Un único Suspense alcanza para todas las rutas perezosas: el Loader
          queda en el lugar donde estaba la pantalla y el resto de la app
          (navbar, carrito) sigue montado. */}
      <Suspense fallback={<Loader texto="Cargando…" />}>
        <Routes>
          {/* Redirección raíz: según estado de sesión */}
          <Route path="/" element={<RootRedirect />} />

          {/* Rutas públicas (solo accesibles sin sesión) */}
          <Route element={<PublicOnlyRoute />}>
            <Route path="/login" element={<Login />} />
            <Route path="/registro" element={<Registro />} />
            <Route path="/admin-login" element={<AdminLogin />} />
            {/* Recuperación de contraseña. /reset-password debe coincidir con el
            enlace que arma email_service.js en el backend. */}
            <Route path="/forgot-password" element={<RecuperarPassword />} />
            <Route path="/reset-password" element={<NuevaPassword />} />
          </Route>

          {/* Camino de compra sin sesión: mirar el catálogo y armar el carrito no
              piden cuenta. El pedido sí la pide, y se pide desde el carrito al
              confirmar (ver Carrito.jsx). */}
          <Route element={<RutaCompra />}>
            <Route path="/cliente/inicio" element={<Inicio />} />
            <Route path="/cliente/catalogo" element={<Catalogo />} />
            <Route path="/cliente/carrito" element={<Carrito />} />
          </Route>

          {/* Rutas protegidas de cliente (requieren sesión: son pedidos y datos
              personales del usuario) */}
          <Route element={<ProtectedRoute requiredRole="CLIENTE" />}>
            <Route path="/cliente/pago" element={<Pago />} />
            <Route path="/cliente/confirmacion" element={<ConfirmacionPedido />} />
            <Route path="/cliente/mis-pedidos" element={<MisPedidos />} />
            <Route path="/cliente/historial" element={<HistorialPedidos />} />
            <Route path="/cliente/pedido/:id" element={<DetallePedido />} />
            <Route path="/cliente/perfil" element={<Perfil />} />
          </Route>

          {/* Rutas protegidas de administrador: operación de su sucursal
              (pedidos, stock y clientes) y el catálogo en modo SOLO LECTURA. El
              CRUD del catálogo —productos, categorías, promociones, personalización
              e imágenes— lo hace el SUPERADMINISTRADOR; el admin ve los listados de
              productos, categorías y promociones y, en Productos, activa/desactiva
              la disponibilidad de cada ítem en su sucursal. */}
          <Route element={<ProtectedRoute requiredRole="ADMINISTRADOR" />}>
            <Route path="/admin/dashboard" element={<Dashboard />} />
            <Route path="/admin/pedidos" element={<GestionPedidos />} />
            <Route path="/admin/stock" element={<GestionStock />} />
            <Route path="/admin/clientes" element={<GestionClientes />} />
            <Route path="/admin/clientes/:id" element={<DetalleCliente />} />
            <Route path="/admin/productos" element={<AdminGestionProductos />} />
            <Route path="/admin/categorias" element={<AdminGestionCategorias />} />
            <Route path="/admin/promociones" element={<AdminGestionPromociones />} />
          </Route>

          {/* Rutas protegidas de superadministrador: panel global (métricas
              agregadas), gestión de administradores y de sucursales, y el CRUD
              del catálogo (productos, categorías, promociones, personalización
              e imágenes). El catálogo es único y corporativo, por eso lo
              administra este rol y no cada sucursal. */}
          <Route element={<ProtectedRoute requiredRole="SUPERADMINISTRADOR" />}>
            <Route path="/superadmin/panel" element={<PanelSuperadmin />} />
            <Route path="/superadmin/administradores" element={<GestionAdministradores />} />
            <Route path="/superadmin/clientes" element={<GestionClientesSuperadmin />} />
            <Route path="/superadmin/clientes/:id" element={<DetalleClienteSuperadmin />} />
            <Route path="/superadmin/sucursales" element={<GestionSucursales />} />
            <Route path="/superadmin/sucursal/nuevo" element={<EditarSucursal />} />
            <Route path="/superadmin/sucursal/editar/:id" element={<EditarSucursal />} />
            <Route path="/superadmin/productos" element={<GestionProductos />} />
            <Route path="/superadmin/producto/editar/:id" element={<EditarProducto />} />
            <Route path="/superadmin/producto/nuevo" element={<EditarProducto />} />
            <Route path="/superadmin/producto/nuevo-combo" element={<EditarProducto />} />
            <Route path="/superadmin/categorias" element={<GestionCategorias />} />
            <Route path="/superadmin/categoria/nuevo" element={<EditarCategoria />} />
            <Route path="/superadmin/categoria/editar/:id" element={<EditarCategoria />} />
            <Route path="/superadmin/personalizacion" element={<GestionPersonalizacion />} />
            <Route path="/superadmin/personalizacion/nuevo" element={<EditarPersonalizacion />} />
            <Route path="/superadmin/personalizacion/editar/:id" element={<EditarPersonalizacion />} />
            <Route path="/superadmin/promociones" element={<GestionPromociones />} />
            <Route path="/superadmin/promocion/nuevo" element={<EditarPromocion />} />
            <Route path="/superadmin/promocion/editar/:id" element={<EditarPromocion />} />
          </Route>

          {/* Ruta 404 - redirige según estado de sesión */}
          <Route path="*" element={<RootRedirect />} />
        </Routes>
      </Suspense>
    </>
  );
};

export default AppRoutes;

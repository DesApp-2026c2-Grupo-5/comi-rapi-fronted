/**
 * Propósito: Guards de navegación: exigir sesión y/o rol, y dejar abierto el
 *            camino de compra a los invitados.
 * Contenido: ProtectedRoute (exige sesión y opcionalmente un rol),
 *            PublicOnlyRoute (sólo para deslogueados) y RutaCompra (abierta,
 *            pero fuera del panel de administración).
 * Dependencias: react-router-dom (Navigate, Outlet, useLocation), useAuth hook.
 * Uso: como `element` de una <Route> que agrupa a las hijas.
 */

import PropTypes from 'prop-types';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { ROLES } from '../../utils/constants';
import { rutaActual } from '../../utils/rutas';
import Loader from './Loader';

/**
 * Devuelve el destino de inicio según el rol del usuario autenticado.
 * @param {object} user - Usuario autenticado.
 * @returns {string} Ruta de inicio del usuario.
 */
const destinoPorRol = (user) => (user?.rol === ROLES.ADMIN ? '/admin/dashboard' : '/cliente/inicio');

/**
 * Ruta protegida que requiere autenticación.
 * Si el usuario no está autenticado, redirige a /login guardando en
 * `state.from` la pantalla de origen, para que al entrar vuelva justo ahí en
 * vez de dejarlo en el inicio.
 * Opcionalmente puede requerir un rol específico.
 * @param {string} [requiredRole] - Rol requerido (opcional). Si se pasa, verifica que el usuario tenga ese rol.
 * @param {React.ReactNode} [children] - Componentes hijos (modo wrapper).
 */
const ProtectedRoute = ({ requiredRole, children }) => {
  const { isAuthenticated, user, hydrated } = useAuth();
  const location = useLocation();

  // Esperar a que se verifique la sesión antes de decidir. Devolver `null`
  // dejaba la pantalla en blanco; el Loader comunica que está arrancando.
  if (!hydrated) {
    return <Loader texto="Verificando sesión…" />;
  }

  // Si no está autenticado, redirigir a login
  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: rutaActual(location) }}
      />
    );
  }

  // Si se requiere un rol específico y el usuario no lo tiene, redirigir al inicio correspondiente
  if (requiredRole && user?.rol !== requiredRole) {
    return <Navigate to={destinoPorRol(user)} replace />;
  }

  // Si hay children (modo wrapper), renderizar children; si no, renderizar Outlet (modo rutas anidadas)
  return children ? children : <Outlet />;
};

/**
 * Rutas del camino de compra (inicio, catálogo y carrito): abiertas a los
 * invitados. Ver el catálogo y armar el carrito no piden sesión; la sesión se
 * pide recién al confirmar el pedido.
 *
 * El administrador sigue sin entrar acá: antes estas rutas exigían el rol
 * CLIENTE y lo mandaban a su panel, y con el menú de administración en la barra
 * no tiene sentido que navegue por la parte de cliente.
 * @returns {JSX.Element} Outlet para las rutas hijas.
 */
const RutaCompra = () => {
  const { isAuthenticated, user, hydrated } = useAuth();

  if (!hydrated) {
    return <Loader texto="Verificando sesión…" />;
  }

  if (isAuthenticated && user?.rol !== ROLES.CLIENTE) {
    return <Navigate to={destinoPorRol(user)} replace />;
  }

  return <Outlet />;
};

/**
 * Ruta solo-público: redirige al inicio del usuario si ya hay una sesión activa
 * (por ejemplo, al reabrir la app con la sesión ya restaurada).
 * @param {React.ReactNode} [children] - Componentes hijos (modo wrapper).
 */
const PublicOnlyRoute = ({ children }) => {
  const { isAuthenticated, user, hydrated } = useAuth();

  // Esperar a que se verifique la sesión antes de decidir
  if (!hydrated) {
    return <Loader texto="Verificando sesión…" />;
  }

  // Ya hay una sesión activa: no mostrar el login/registro
  if (isAuthenticated) {
    return <Navigate to={destinoPorRol(user)} replace />;
  }

  return children ? children : <Outlet />;
};

export { ProtectedRoute as default, PublicOnlyRoute, RutaCompra, destinoPorRol };

/* Sin `defaultProps`: React 18.3 ya avisa que van a desaparecer en function
   components. `children` y `requiredRole` son opcionales de verdad: el
   componente cae en `<Outlet />` cuando no vienen. */
ProtectedRoute.propTypes = {
  requiredRole: PropTypes.oneOf(Object.values(ROLES)),
  children: PropTypes.node,
};

PublicOnlyRoute.propTypes = {
  children: PropTypes.node,
};

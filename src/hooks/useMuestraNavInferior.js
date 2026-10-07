/**
 * Propósito: Decidir si corresponde la barra de navegación inferior.
 * Contenido: Hook booleano que devuelve true para el invitado y para cualquier
 *            usuario con sesión, sea cliente, administrador o superadministrador.
 * Dependencias: useAuth, constants (ROLES).
 * Uso: const visible = useMuestraNavInferior();
 *
 * Lo usan dos lugares y por eso está aparte: NavInferior.jsx para decidir si se
 * dibuja, y App.jsx para decidir si el shell lleva el padding-bottom que la
 * despeja. Si el padding fuera una regla CSS fija, las pantallas sin barra
 * quedarían con un hueco vacío abajo en el móvil.
 *
 * El invitado también lleva barra: es la forma principal de llegar al catálogo
 * y al carrito sin sesión. El filtro se escribe explícito y no como
 * `isAuthenticated` a secas, para que si algún día aparece un rol nuevo (un
 * repartidor, por ejemplo) haya que decidir acá si lleva barra o no, en vez de
 * que la herede por omisión. La ausencia de sesión no es un rol: el checkout
 * empieza ahí, así que se trata como un caso más.
 *
 * El corte por ancho de pantalla no va aquí: lo resuelve el CSS. Este hook sólo
 * responde "esta persona ¿tiene barra inferior?", que es una pregunta de rol.
 */

import { useAuth } from './useAuth';
import { ROLES } from '../utils/constants';

const useMuestraNavInferior = () => {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) return true;

  // El SUPERADMINISTRADOR lleva la misma barra inferior que el admin: en el
  // móvil navega con los destinos al alcance del pulgar, igual que el resto de
  // los roles, en lugar del menú hamburguesa de la barra superior.
  return [
    ROLES.CLIENTE,
    ROLES.ADMIN,
    ROLES.SUPERADMIN,
  ].includes(user?.rol);
};

export default useMuestraNavInferior;
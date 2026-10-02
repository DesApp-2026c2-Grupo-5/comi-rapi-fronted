/**
 * Propósito: Decidir si corresponde la barra de navegación inferior.
 * Contenido: Hook booleano que devuelve true para cualquier usuario con sesión,
 *            sea cliente o administrador.
 * Dependencias: useAuth, constants (ROLES).
 * Uso: const visible = useMuestraNavInferior();
 *
 * Lo usan dos lugares y por eso está aparte: NavInferior.jsx para decidir si se
 * dibuja, y App.jsx para decidir si el shell lleva el padding-bottom que la
 * despeja. Si el padding fuera una regla CSS fija, las pantallas sin barra
 * quedarían con un hueco vacío abajo en el móvil.
 *
 * Los dos roles tienen barra inferior: el cliente con sus cuatro destinos y el
 * administrador con sus cinco secciones. El chequeo se escribe explícito y no
 * como `isAuthenticated` a secas, para que si algún día aparece un rol nuevo
 * (un repartidor, por ejemplo) haya que decidir acá si lleva barra o no, en vez
 * de que la herede por omisión.
 *
 * El corte por ancho de pantalla no va aquí: lo resuelve el CSS. Este hook sólo
 * responde "este usuario ¿tiene barra inferior?", que es una pregunta de rol.
 */

import { useAuth } from './useAuth';
import { ROLES } from '../utils/constants';

const useMuestraNavInferior = () => {
  const { user, isAuthenticated } = useAuth();

  return Boolean(
    isAuthenticated && (user?.rol === ROLES.CLIENTE || user?.rol === ROLES.ADMIN)
  );
};

export default useMuestraNavInferior;
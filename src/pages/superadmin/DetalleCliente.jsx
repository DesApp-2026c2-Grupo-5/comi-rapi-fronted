/**
 * Propósito: Detalle de un cliente para el SUPERADMINISTRADOR. Reutiliza
 *            <DetalleCliente /> con el enlace de vuelta al listado de clientes
 *            del superadmin.
 * Contenido: Wrapper fino sobre DetalleCliente (solo cambia `backRoute`).
 * Dependencias: react-bootstrap, DetalleCliente.
 * Uso: Ruta "/superadmin/clientes/:id" → <DetalleClienteSuperadmin />
 */

import DetalleCliente from '../admin/DetalleCliente';

const DetalleClienteSuperadmin = () => (
  <DetalleCliente backRoute="/superadmin/clientes" />
);

export default DetalleClienteSuperadmin;
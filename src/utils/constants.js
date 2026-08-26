/**
 * Propósito: Definir constantes globales de la aplicación (roles, estados de pedido, etc.).
 * Contenido: Objeto ROLES con CLIENTE y ADMIN; objetas ESTADO_PEDIDO con PENDIENTE, CONFIRMADO, ENTREGADO, CANCELADO.
 * Dependencias: Ninguna.
 * Uso: import { ROLES, ESTADO_PEDIDO } from '../utils/constants';
 */

export const ROLES = {
  CLIENTE: 'CLIENTE',
  ADMIN: 'ADMIN',
};

export const ESTADO_PEDIDO = {
  PENDIENTE: 'Pendiente',
  CONFIRMADO: 'Confirmado',
  ENTREGADO: 'Entregado',
  CANCELADO: 'Cancelado',
};

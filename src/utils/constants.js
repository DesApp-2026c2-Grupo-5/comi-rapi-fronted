/**
 * Propósito: Definir constantes globales de la aplicación (roles, estados de pedido, estados de sucursal, etc.).
 * Contenido: Objeto ROLES con CLIENTE y ADMIN; objeto ESTADOS_PEDIDO con el ciclo de vida completo
 *            del pedido (PENDIENTE → CONFIRMADO → EN_PREPARACION → LISTO_PARA_ENTREGAR → EN_CAMINO → ENTREGADO,
 *            con CANCELADO como estado final alternativo); objeto ESTADO_SUCURSAL con ACTIVO e INACTIVO.
 * Dependencias: Ninguna.
 * Uso: import { ROLES, ESTADOS_PEDIDO, ESTADO_SUCURSAL } from '../utils/constants';
 */

export const ROLES = {
  CLIENTE: 'CLIENTE',
  ADMIN: 'ADMINISTRADOR',
  SUPERADMIN: 'SUPERADMINISTRADOR',
};

// Estados del ciclo de vida de un pedido (valores en minúscula, igual que en los datos mock).
export const ESTADOS_PEDIDO = {
  PENDIENTE: 'pendiente',
  CONFIRMADO: 'confirmado',
  EN_PREPARACION: 'en_preparacion',
  LISTO_PARA_ENTREGAR: 'listo_para_entregar',
  EN_CAMINO: 'en_camino',
  ENTREGADO: 'entregado',
  CANCELADO: 'cancelado',
};

// Estados que puede ver el cliente en su historial (todos los del ciclo de vida).
export const ESTADOS_VISIBLES_CLIENTE = [
  ESTADOS_PEDIDO.PENDIENTE,
  ESTADOS_PEDIDO.CONFIRMADO,
  ESTADOS_PEDIDO.EN_PREPARACION,
  ESTADOS_PEDIDO.LISTO_PARA_ENTREGAR,
  ESTADOS_PEDIDO.EN_CAMINO,
  ESTADOS_PEDIDO.ENTREGADO,
  ESTADOS_PEDIDO.CANCELADO,
];

// Estados activos del pedido: los que se siguen gestionando, o sea los que
// todavía no llegaron a un estado final. Es la lista que usan "Mis Pedidos" del
// cliente, "Pedidos" del admin y los pills de filtro.
// Quedan fuera PENDIENTE (aún sin pagar, no se lista) y ENTREGADO/CANCELADO
// (estados finales: quedan en el historial, no en las pantallas de trabajo).
export const ESTADOS_ACTIVOS_PEDIDO = [
  ESTADOS_PEDIDO.CONFIRMADO,
  ESTADOS_PEDIDO.EN_PREPARACION,
  ESTADOS_PEDIDO.LISTO_PARA_ENTREGAR,
  ESTADOS_PEDIDO.EN_CAMINO,
];

// Etiquetas legibles para cada estado (uso en UI).
export const ETIQUETAS_ESTADO_PEDIDO = {
  [ESTADOS_PEDIDO.PENDIENTE]: 'Pendiente',
  [ESTADOS_PEDIDO.CONFIRMADO]: 'Confirmado',
  [ESTADOS_PEDIDO.EN_PREPARACION]: 'En preparación',
  [ESTADOS_PEDIDO.LISTO_PARA_ENTREGAR]: 'Listo para entregar',
  [ESTADOS_PEDIDO.EN_CAMINO]: 'En camino',
  [ESTADOS_PEDIDO.ENTREGADO]: 'Entregado',
  [ESTADOS_PEDIDO.CANCELADO]: 'Cancelado',
};

// Variante de Badge de Bootstrap por estado (se usa en Mis Pedidos, Detalle y admin).
export const VARIANTE_ESTADO_PEDIDO = {
  [ESTADOS_PEDIDO.PENDIENTE]: 'warning',
  [ESTADOS_PEDIDO.CONFIRMADO]: 'success',
  [ESTADOS_PEDIDO.EN_PREPARACION]: 'warning',
  [ESTADOS_PEDIDO.LISTO_PARA_ENTREGAR]: 'secondary',
  [ESTADOS_PEDIDO.EN_CAMINO]: 'info',
  [ESTADOS_PEDIDO.ENTREGADO]: 'success',
  [ESTADOS_PEDIDO.CANCELADO]: 'danger',
};

// Color hexadecimal por estado para los iconos SVG de la línea de tiempo.
export const COLOR_ESTADO_PEDIDO = {
  [ESTADOS_PEDIDO.PENDIENTE]: '#ffc107',
  [ESTADOS_PEDIDO.CONFIRMADO]: '#198754',
  [ESTADOS_PEDIDO.EN_PREPARACION]: '#fd7e14',
  [ESTADOS_PEDIDO.LISTO_PARA_ENTREGAR]: '#6c757d',
  [ESTADOS_PEDIDO.EN_CAMINO]: '#0dcaf0',
  [ESTADOS_PEDIDO.ENTREGADO]: '#198754',
  [ESTADOS_PEDIDO.CANCELADO]: '#dc3545',
};

// Estados posibles de una sucursal. El valor coincide con el campo 'estado' de los datos mock.
export const ESTADO_SUCURSAL = {
  ACTIVO: 'activo',
  INACTIVO: 'inactivo',
};

// Límites válidos para las coordenadas geográficas (latitud y longitud).
export const LIMITES_LAT = { MIN: -90, MAX: 90 };
export const LIMITES_LNG = { MIN: -180, MAX: 180 };

// Tipos de personalización — CRUD admin por producto (relación productoId -> categorías)
export const TIPO_PERSONALIZACION = {
  EXTRA: 'extra',
  PERSONALIZAR: 'personalizar',
  ACOMPANAR: 'acompanar',
  CONDIMENTO: 'condimento',
};

export const ETIQUETA_TIPO = {
  [TIPO_PERSONALIZACION.EXTRA]: 'Extra',
  [TIPO_PERSONALIZACION.PERSONALIZAR]: 'Personalizar',
  [TIPO_PERSONALIZACION.ACOMPANAR]: 'Acompaña',
  [TIPO_PERSONALIZACION.CONDIMENTO]: 'Condimento',
};

export const VARIANTE_TIPO = {
  [TIPO_PERSONALIZACION.EXTRA]: 'warning',
  [TIPO_PERSONALIZACION.PERSONALIZAR]: 'secondary',
  [TIPO_PERSONALIZACION.ACOMPANAR]: 'success',
  [TIPO_PERSONALIZACION.CONDIMENTO]: 'light',
};

// Reclamos del cliente sobre pedidos entregados.
export const MOTIVOS_QUEJA = {
  PEDIDO_INCOMPLETO: 'PEDIDO_INCOMPLETO',
  PRODUCTO_EN_MAL_ESTADO: 'PRODUCTO_EN_MAL_ESTADO',
  DEMORA_EN_LA_ENTREGA: 'DEMORA_EN_LA_ENTREGA',
  ERROR_DE_COBRO: 'ERROR_DE_COBRO',
  OTRO: 'OTRO',
};

export const ETIQUETAS_MOTIVO_QUEJA = {
  [MOTIVOS_QUEJA.PEDIDO_INCOMPLETO]: 'Pedido incompleto',
  [MOTIVOS_QUEJA.PRODUCTO_EN_MAL_ESTADO]: 'Producto en mal estado',
  [MOTIVOS_QUEJA.DEMORA_EN_LA_ENTREGA]: 'Demora en la entrega',
  [MOTIVOS_QUEJA.ERROR_DE_COBRO]: 'Error de cobro',
  [MOTIVOS_QUEJA.OTRO]: 'Otro motivo',
};

export const ESTADOS_QUEJA = {
  PENDIENTE: 'PENDIENTE',
  EN_REVISION: 'EN_REVISION',
  RESUELTA: 'RESUELTA',
  RECHAZADA: 'RECHAZADA',
  CERRADA: 'CERRADA',
};

export const ETIQUETAS_ESTADO_QUEJA = {
  [ESTADOS_QUEJA.PENDIENTE]: 'Pendiente',
  [ESTADOS_QUEJA.EN_REVISION]: 'En revisión',
  [ESTADOS_QUEJA.RESUELTA]: 'Resuelta',
  [ESTADOS_QUEJA.RECHAZADA]: 'Rechazada',
  [ESTADOS_QUEJA.CERRADA]: 'Cerrada por el cliente',
};

export const VARIANTE_ESTADO_QUEJA = {
  [ESTADOS_QUEJA.PENDIENTE]: 'warning',
  [ESTADOS_QUEJA.EN_REVISION]: 'info',
  [ESTADOS_QUEJA.RESUELTA]: 'success',
  [ESTADOS_QUEJA.RECHAZADA]: 'danger',
  [ESTADOS_QUEJA.CERRADA]: 'secondary',
};

// Estados finales: no admiten más cambios.
export const ESTADOS_QUEJA_FINALES = [
  ESTADOS_QUEJA.RESUELTA,
  ESTADOS_QUEJA.RECHAZADA,
  ESTADOS_QUEJA.CERRADA,
];


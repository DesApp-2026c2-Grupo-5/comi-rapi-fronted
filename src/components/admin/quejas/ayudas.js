/**
 * Propósito: Utilidades de presentación de la bandeja de reclamos.
 * Contenido: transiciones válidas del compositor, armado del hilo, conteo de
 *            mensajes sin responder, nombres y fechas de las burbujas.
 * Dependencias: utils/constants, utils/formatters.
 * Uso: import { construirHilo, contarSinResponder } from './ayudas';
 *
 * El "sin responder" no es un estado de lectura (el backend no lo guarda):
 * cuenta los mensajes del cliente posteriores al último mensaje del negocio.
 * Cuando el local responde, esos mensajes dejan de marcarse.
 */

import {
  ESTADOS_QUEJA,
  ESTADOS_QUEJA_FINALES,
  ROLES,
} from '../../../utils/constants';
import {
  formatDateTime,
  formatHora,
  nombreCompleto,
} from '../../../utils/formatters';

/** Cantidad de conversaciones por página de la bandeja. */
export const LIMITE_CONVERSACIONES = 20;

/**
 * Opciones del selector "Al enviar". La cadena vacía representa un mensaje
 * suelto: el backend lo distingue porque el cuerpo no lleva `estado`.
 */
export const OPCIONES_ESTADO = {
  [ESTADOS_QUEJA.PENDIENTE]: [
    '',
    ESTADOS_QUEJA.EN_REVISION,
    ESTADOS_QUEJA.RESUELTA,
    ESTADOS_QUEJA.RECHAZADA,
  ],
  [ESTADOS_QUEJA.EN_REVISION]: [
    '',
    ESTADOS_QUEJA.RESUELTA,
    ESTADOS_QUEJA.RECHAZADA,
  ],
  [ESTADOS_QUEJA.RESUELTA]: [],
  [ESTADOS_QUEJA.RECHAZADA]: [],
  [ESTADOS_QUEJA.CERRADA]: [],
};

/** Etiquetas del selector "Al enviar". */
export const ETIQUETAS_OPCION_ESTADO = {
  '': 'Solo responder',
  [ESTADOS_QUEJA.EN_REVISION]: 'Responder y marcar en revisión',
  [ESTADOS_QUEJA.RESUELTA]: 'Responder y resolver',
  [ESTADOS_QUEJA.RECHAZADA]: 'Responder y rechazar',
};

export const ESTADOS_FINALES_SET = new Set(ESTADOS_QUEJA_FINALES);

/** ¿La queja ya no admite mensajes del negocio? */
export const esEstadoFinal = (estado) => ESTADOS_FINALES_SET.has(estado);

/** Nombre visible del cliente, con el email como respaldo. */
export const nombreCliente = (cliente) => {
  if (!cliente) return 'Cliente';
  const nombre = nombreCompleto(cliente.nombre, cliente.apellido);
  return nombre || cliente.email || 'Cliente';
};

/** Nombre visible del autor de un mensaje del hilo. */
export const nombreAutor = (mensaje, queja) => {
  if (mensaje.delCliente) return nombreCliente(queja.cliente);
  return nombreCompleto(mensaje.autor?.nombre, mensaje.autor?.apellido) || 'Local';
};

/**
 * Arma el hilo completo: el detalle original del reclamo es la primera
 * burbuja del cliente y después vienen los mensajes de `QuejaMensajes`.
 */
export const construirHilo = (queja) => {
  if (!queja) return [];

  const detalle = {
    id: 'detalle',
    contenido: queja.detalle,
    delCliente: true,
    creadaEn: queja.creadaEn,
    autor: queja.cliente || null,
    esDetalle: true,
  };

  const mensajes = (queja.mensajes || []).map((mensaje) => ({
    id: `mensaje-${mensaje.id}`,
    contenido: mensaje.contenido,
    delCliente: Boolean(mensaje.delCliente),
    creadaEn: mensaje.creadaEn,
    autor: mensaje.autor || null,
    esDetalle: false,
  }));

  return [detalle, ...mensajes];
};

/** Índice del último mensaje del negocio, o -1 si todavía no respondió. */
export const ultimoMensajeNegocio = (hilo) => {
  for (let indice = hilo.length - 1; indice >= 0; indice -= 1) {
    if (!hilo[indice].delCliente) return indice;
  }
  return -1;
};

/**
 * Marca cada mensaje del cliente posterior a la última respuesta del negocio.
 * Devuelve una copia para no mutar el hilo original.
 */
export const marcarSinResponder = (hilo) => {
  const corte = ultimoMensajeNegocio(hilo);
  return hilo.map((mensaje, indice) => ({
    ...mensaje,
    sinResponder: mensaje.delCliente && indice > corte,
  }));
};

/** Cantidad de mensajes del cliente que esperan una respuesta del negocio. */
export const contarSinResponder = (queja) => {
  const hilo = construirHilo(queja);
  const corte = ultimoMensajeNegocio(hilo);
  return hilo.filter(
    (mensaje, indice) => mensaje.delCliente && indice > corte
  ).length;
};

/** Último mensaje del hilo, para el preview de la lista. */
export const ultimoMensaje = (queja) => {
  const hilo = construirHilo(queja);
  return hilo[hilo.length - 1] || null;
};

/** Fecha de la última actividad conocida de la conversación. */
export const ultimaActividad = (queja) => {
  const ultimo = ultimoMensaje(queja);
  return ultimo?.creadaEn || queja.actualizadaEn || queja.creadaEn;
};

/** Recorta un texto para el preview sin cortar palabras a la mitad. */
export const recortarTexto = (texto, maximo = 90) => {
  const limpio = String(texto || '')
    .replace(/\s+/g, ' ')
    .trim();
  if (limpio.length <= maximo) return limpio;
  return `${limpio.slice(0, maximo).trimEnd()}…`;
};

/**
 * Hora en las burbujas: solo HH:mm si es de hoy, fecha y hora si es anterior.
 */
export const formatFechaBurbuja = (fecha) => {
  if (!fecha) return '';
  const valor = new Date(fecha);
  if (Number.isNaN(valor.getTime())) return '';
  const hoy = new Date();
  const esHoy =
    valor.getDate() === hoy.getDate() &&
    valor.getMonth() === hoy.getMonth() &&
    valor.getFullYear() === hoy.getFullYear();
  return esHoy ? formatHora(valor) : formatDateTime(valor);
};

/** Ruta al detalle del cliente según el rol del usuario. */
export const rutaCliente = (rol, clienteId) =>
  rol === ROLES.SUPERADMIN
    ? `/superadmin/clientes/${clienteId}`
    : `/admin/clientes/${clienteId}`;

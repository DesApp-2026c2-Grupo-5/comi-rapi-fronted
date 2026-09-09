/**
 * Propósito: Servicio mock para CRUD de personalización por producto (admin).
 * Contenido: obtenerElementos, obtenerPorProducto, obtenerPorId, crear, actualizar, eliminar.
 * Dependencias: seedData personalizacionElementosMock, helpers delay/generateId.
 * Uso: import { obtenerElementos, crearElemento } from '../api/personalizacion';
 */

import { personalizacionElementosMock } from '../services/seedData';
import { delay, generateId } from '../utils/helpers';

let elementos = [...personalizacionElementosMock];

export const obtenerElementos = async () => {
  await delay(200);
  return { success: true, data: [...elementos] };
};

export const obtenerElementoPorId = async (id) => {
  await delay(200);
  const el = elementos.find((e) => String(e.id) === String(id));
  if (el) return { success: true, data: { ...el } };
  return { success: false, error: 'Elemento no encontrado' };
};

export const obtenerPorProducto = async (productoId) => {
  await delay(200);
  return { success: true, data: elementos.filter((e) => String(e.productoId) === String(productoId)).map((e) => ({ ...e })) };
};

export const crearElemento = async (datos) => {
  await delay(400);
  // Validar duplicado por productoId + tipo + (nombre o productoReferenciaId)
  const dup = elementos.find((e) =>
    String(e.productoId) === String(datos.productoId) &&
    e.tipo === datos.tipo &&
    (datos.tipo === 'acompanar'
      ? String(e.productoReferenciaId) === String(datos.productoReferenciaId)
      : e.nombre?.toLowerCase() === datos.nombre?.toLowerCase())
  );
  if (dup) return { success: false, error: 'Ya existe un elemento igual para este producto y categoría' };

  if (datos.tipo === 'acompanar' && String(datos.productoReferenciaId) === String(datos.productoId)) {
    return { success: false, error: 'No podés ofrecer el mismo producto' };
  }

  const nuevo = { id: generateId(), ...datos };
  elementos.push(nuevo);
  return { success: true, data: { ...nuevo } };
};

export const actualizarElemento = async (id, datos) => {
  await delay(400);
  const idx = elementos.findIndex((e) => String(e.id) === String(id));
  if (idx === -1) return { success: false, error: 'Elemento no encontrado' };

  // Validar duplicado evitando el propio id
  const dup = elementos.find(
    (e) =>
      String(e.id) !== String(id) &&
      String(e.productoId) === String(datos.productoId ?? elementos[idx].productoId) &&
      (datos.tipo ?? elementos[idx].tipo) === e.tipo &&
      ((datos.tipo ?? elementos[idx].tipo) === 'acompanar'
        ? String(e.productoReferenciaId) === String(datos.productoReferenciaId ?? elementos[idx].productoReferenciaId)
        : e.nombre?.toLowerCase() === (datos.nombre ?? elementos[idx].nombre)?.toLowerCase())
  );
  if (dup) return { success: false, error: 'Ya existe un elemento igual para este producto y categoría' };

  const nuevoProductoId = datos.productoId ?? elementos[idx].productoId;
  const nuevoTipo = datos.tipo ?? elementos[idx].tipo;
  const nuevoRef = datos.productoReferenciaId ?? elementos[idx].productoReferenciaId;
  if (nuevoTipo === 'acompanar' && String(nuevoRef) === String(nuevoProductoId)) {
    return { success: false, error: 'No podés ofrecer el mismo producto' };
  }

  elementos[idx] = { ...elementos[idx], ...datos };
  return { success: true, data: { ...elementos[idx] } };
};

export const eliminarElemento = async (id) => {
  await delay(400);
  const idx = elementos.findIndex((e) => String(e.id) === String(id));
  if (idx === -1) return { success: false, error: 'Elemento no encontrado' };
  elementos.splice(idx, 1);
  return { success: true };
};

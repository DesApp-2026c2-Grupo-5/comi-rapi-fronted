import { apiGet, apiPost, apiPut, apiDelete } from './client';

const BASE = '/personalizacion';

export const obtenerElementos = async () => {
  return apiGet(BASE);
};

export const obtenerElementoPorId = async (id) => {
  return apiGet(`${BASE}/${id}`);
};

export const obtenerPorProducto = async (productoId) => {
  return apiGet(`${BASE}?productoId=${encodeURIComponent(productoId)}`);
};

export const crearElemento = async (datos) => {
  return apiPost(BASE, datos);
};

export const actualizarElemento = async (id, datos) => {
  return apiPut(`${BASE}/${id}`, datos);
};

export const eliminarElemento = async (id) => {
  return apiDelete(`${BASE}/${id}`);
};

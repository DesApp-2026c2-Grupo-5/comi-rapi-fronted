/**
 * Propósito: Filtros compartidos Mis Pedidos / Historial (74).
 * Filtra en memoria por fecha (pedido.fecha), estado y sucursal.
 * La fecha compara por día (YYYY-MM-DD) para evitar problemas de hora.
 */

function diaISO(valor) {
  if (!valor) return null;
  const d = new Date(valor);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10);
}

export function filtrarPedidos(pedidos, filtros = {}) {
  const { desde, hasta, estado, sucursalId } = filtros;
  return (Array.isArray(pedidos) ? pedidos : []).filter((p) => {
    if (estado && p.estado !== estado) return false;
    if (sucursalId) {
      const idSuc = p?.sucursal?.id ?? p?.sucursalId ?? null;
      if (idSuc !== null && idSuc !== undefined) {
        if (String(idSuc) !== String(sucursalId)) return false;
      } else {
        // Sin id (sucursal como string): matchea por nombre.
        const nombreSuc = typeof p?.sucursal === 'string' ? p.sucursal : p?.sucursal?.nombre;
        if (nombreSuc && String(nombreSuc) !== String(sucursalId)) return false;
      }
    }
    if (desde || hasta) {
      const dia = diaISO(p.fecha);
      if (!dia) return false;
      if (desde && dia < desde) return false;
      if (hasta && dia > hasta) return false;
    }
    return true;
  });
}

export const FILTRO_INICIAL = { desde: '', hasta: '', estado: '', sucursalId: '' };

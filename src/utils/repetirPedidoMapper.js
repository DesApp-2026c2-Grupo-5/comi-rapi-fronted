/**
 * Propósito: Mapper puro pedido -> carrito para Repetir pedido (80).
 * Regla todo o nada exacta:
 * - Bloquea si falta un producto (productoId null, no está en catálogo o inactivo).
 * - Bloquea si falta una personalización elegida que fue dada de baja con el ABM
 *   (solo cuando hay datos vigentes para ese producto; sin datos hace fail-open).
 * - Si todo existe, deja repetir con precios vigentes y reporta cambios de precio.
 * Sin side-effects: no toca localStorage ni navega (eso lo hace la UI).
 */

import { personalizacionVacia } from './personalizacionHelpers.js';

const MENSAJE_FALTANTES =
  'El pedido no puede ser repetido porque faltan productos o personalizaciones.';

function normalizarPersonalizacion(pers) {
  const base = personalizacionVacia();
  if (!pers || typeof pers !== 'object') return base;
  return {
    extras: Array.isArray(pers.extras) ? pers.extras : [],
    sin: Array.isArray(pers.sin) ? pers.sin : [],
    acompanamientos: Array.isArray(pers.acompanamientos)
      ? pers.acompanamientos
      : [],
    condimentos: Array.isArray(pers.condimentos) ? pers.condimentos : [],
  };
}

function cantidadValida(cantidad) {
  const n = Number(cantidad);
  return Number.isInteger(n) && n >= 1;
}

function normalizarNombre(valor) {
  return String(valor ?? '')
    .trim()
    .toLowerCase();
}

/**
 * Busca un elemento vigente por id o nombre.
 * @param {Array} vigentes - Elementos del ABM para el producto: [{id, nombre, tipo, precio, activo}].
 * @param {object|string} elegido - Elemento elegido en el pedido ({id?, nombre?, precio?} o string).
 * @returns {object|null} Elemento vigente matcheado o null.
 */
function buscarVigente(vigentes, elegido) {
  if (!Array.isArray(vigentes) || vigentes.length === 0) return null;
  const idElegido =
    elegido && typeof elegido === 'object' && elegido.id !== undefined
      ? String(elegido.id)
      : null;
  if (idElegido) {
    const porId = vigentes.find((v) => String(v.id) === idElegido);
    if (porId) return porId;
  }
  const nombreElegido =
    elegido && typeof elegido === 'object' ? elegido.nombre : elegido;
  const clave = normalizarNombre(nombreElegido);
  if (!clave) return null;
  return vigentes.find((v) => normalizarNombre(v.nombre) === clave) || null;
}

function precioLista(lista) {
  return (Array.isArray(lista) ? lista : []).reduce((acc, item) => {
    const precio = Number(item?.precio ?? 0);
    const cantidad = Number(item?.cantidad ?? 1);
    if (Number.isNaN(precio) || Number.isNaN(cantidad)) return acc;
    return acc + precio * cantidad;
  }, 0);
}

/**
 * Valida y mapea un pedido a líneas de carrito.
 * @param {object} pedido - Pedido mapeado: { productos: [{productoId, nombre, cantidad, precio, personalizacion?}] }.
 * @param {Array} catalogo - Productos vigentes: [{id, nombre, precio, activo}].
 * @param {Map|object|null} personalizacionVigentePorProducto - Opcional: Map(productoId -> array elementos vigentes).
 * @returns {{puedeRepetir, lineas, faltantes, cambiosPrecio, totalAntes, totalAhora, mensaje}}
 */
export function mapearPedidoACarrito(
  pedido,
  catalogo,
  personalizacionVigentePorProducto = null
) {
  const productos = Array.isArray(pedido?.productos) ? pedido.productos : [];
  const mapaCatalogo = new Map(
    (Array.isArray(catalogo) ? catalogo : []).map((p) => [String(p.id), p])
  );

  const mapaPers =
    personalizacionVigentePorProducto instanceof Map
      ? personalizacionVigentePorProducto
      : new Map(
          Object.entries(personalizacionVigentePorProducto || {}).map(
            ([k, v]) => [String(k), v]
          )
        );

  if (productos.length === 0) {
    return {
      puedeRepetir: false,
      lineas: [],
      faltantes: ['Pedido sin productos'],
      cambiosPrecio: [],
      totalAntes: 0,
      totalAhora: 0,
      mensaje: MENSAJE_FALTANTES,
    };
  }

  const faltantes = [];
  const lineas = [];
  const cambiosPrecio = [];
  let totalAntes = 0;
  let totalAhora = 0;

  for (const item of productos) {
    const nombreFallback = item?.nombre || `Producto #${item?.productoId ?? '?'}`;
    const idClave =
      item?.productoId !== undefined && item?.productoId !== null
        ? String(item.productoId)
        : null;

    if (!idClave) {
      faltantes.push(nombreFallback);
      continue;
    }
    const vigente = mapaCatalogo.get(idClave);
    if (!vigente || vigente.activo === false) {
      faltantes.push(vigente?.nombre || nombreFallback);
      continue;
    }
    if (!cantidadValida(item.cantidad)) {
      faltantes.push(vigente?.nombre || nombreFallback);
      continue;
    }

    const pers = normalizarPersonalizacion(item.personalizacion);
    const vigentesProd = mapaPers.get(idClave) || null;
    const hayDatosVigentes =
      Array.isArray(vigentesProd) && vigentesProd.length > 0;

    // Validación exacta de personalización (solo si hay datos vigentes).
    if (hayDatosVigentes) {
      const listas = [
        ['extra', pers.extras],
        ['sin', pers.sin],
        ['acompañamiento', pers.acompanamientos],
        ['condimento', pers.condimentos],
      ];
      let faltaPers = false;
      for (const [etiqueta, lista] of listas) {
        for (const elegido of lista) {
          const match = buscarVigente(vigentesProd, elegido);
          if (!match || match.activo === false) {
            const nombreElegido =
              (elegido && typeof elegido === 'object'
                ? elegido.nombre
                : elegido) || etiqueta;
            faltantes.push(`${vigente.nombre} (${nombreElegido})`);
            faltaPers = true;
            break;
          }
        }
        if (faltaPers) break;
      }
      if (faltaPers) continue;
    }

    const precioBaseAntes = Number(item.precio);
    const precioBaseAhora = Number(vigente.precio);
    const extrasAntes = precioLista(pers.extras) + precioLista(pers.acompanamientos);
    // Precio vigente de adicionales: si hay match, usa su precio actual.
    const precioAdicionalVigente = (lista) =>
      (Array.isArray(lista) ? lista : []).reduce((acc, elegido) => {
        const match = hayDatosVigentes
          ? buscarVigente(vigentesProd, elegido)
          : null;
        const precio =
          match && match.precio !== null && match.precio !== undefined
            ? Number(match.precio)
            : Number(elegido?.precio ?? 0);
        const cantidad = Number(elegido?.cantidad ?? 1);
        if (Number.isNaN(precio) || Number.isNaN(cantidad)) return acc;
        return acc + precio * cantidad;
      }, 0);
    const extrasAhora =
      precioAdicionalVigente(pers.extras) +
      precioAdicionalVigente(pers.acompanamientos);

    const cantidad = Number(item.cantidad);
    const subtotalAntes =
      (Number.isNaN(precioBaseAntes) ? precioBaseAhora : precioBaseAntes) *
        cantidad +
      extrasAntes * cantidad;
    const subtotalAhora = (precioBaseAhora + extrasAhora) * cantidad;
    totalAntes += subtotalAntes;
    totalAhora += subtotalAhora;

    if (precioBaseAhora !== (Number.isNaN(precioBaseAntes) ? precioBaseAhora : precioBaseAntes)) {
      cambiosPrecio.push({
        nombre: vigente.nombre,
        antes: Number.isNaN(precioBaseAntes) ? precioBaseAhora : precioBaseAntes,
        ahora: precioBaseAhora,
        cantidad,
      });
    }
    // Cambios en adicionales vigentes.
    if (hayDatosVigentes) {
      for (const elegido of [...pers.extras, ...pers.acompanamientos]) {
        const match = buscarVigente(vigentesProd, elegido);
        if (
          match &&
          match.precio !== null &&
          match.precio !== undefined &&
          Number(match.precio) !== Number(elegido?.precio ?? match.precio)
        ) {
          cambiosPrecio.push({
            nombre: `${vigente.nombre} — ${match.nombre}`,
            antes: Number(elegido?.precio ?? match.precio),
            ahora: Number(match.precio),
            cantidad: Number(elegido?.cantidad ?? 1),
          });
        }
      }
    }

    lineas.push({
      producto: {
        id: vigente.id,
        nombre: vigente.nombre,
        precio: precioBaseAhora,
      },
      cantidad,
      personalizacion: pers,
    });
  }

  if (faltantes.length > 0) {
    return {
      puedeRepetir: false,
      lineas: [],
      faltantes,
      cambiosPrecio: [],
      totalAntes: 0,
      totalAhora: 0,
      mensaje: MENSAJE_FALTANTES,
    };
  }

  return {
    puedeRepetir: true,
    lineas,
    faltantes: [],
    cambiosPrecio,
    totalAntes,
    totalAhora,
    mensaje: null,
  };
}

export const MENSAJE_PEDIDO_NO_REPETIBLE = MENSAJE_FALTANTES;

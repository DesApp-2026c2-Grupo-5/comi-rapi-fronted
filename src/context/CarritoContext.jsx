import React, {
  createContext,
  useState,
  useCallback,
  useMemo,
  useEffect,
} from 'react';
import { calcularPrecioUnitario } from '../services/personalizacionConfig';
import { compararPersonalizacion, generarIdLinea, personalizacionVacia } from '../utils/personalizacionHelpers';
import { normalizarNota } from '../utils/notaHelpers';
import { useAuth } from '../hooks/useAuth';
import {
  leerCarrito,
  guardarCarrito,
  limpiarCarrito,
  migrarCarritoInvitado,
  sanearItems,
  normalizarEmail,
} from '../utils/carritoStorage';

export const CarritoContext = createContext(null);

/** Recalcula el precio personalizado (la config puede haber cambiado entre sesiones). */
const recalcularPrecios = (lineas) =>
  lineas.map((item) => {
    const pers = item.personalizacion || personalizacionVacia();
    return {
      ...item,
      personalizacion: pers,
      precioUnitarioPersonalizado: calcularPrecioUnitario(
        item.producto.precio,
        pers.extras || [],
        pers.acompanamientos || []
      ),
    };
  });

export const CarritoProvider = ({ children }) => {
  const { user } = useAuth();
  const email = normalizarEmail(user?.email);

  // Dueño actual de la clave de storage ('' = invitado)
  const [clave, setClave] = useState(email);
  const [items, setItems] = useState(() =>
    recalcularPrecios(sanearItems(leerCarrito(email)))
  );

  // Cambio de usuario (login/logout/otro usuario): migrar invitado y cargar
  // el carrito correspondiente. No borra claves ajenas: cada uno retoma lo suyo.
  useEffect(() => {
    if (email === clave) return;
    if (email) {
      setItems(recalcularPrecios(migrarCarritoInvitado(email)));
    } else {
      setItems(recalcularPrecios(sanearItems(leerCarrito(null))));
    }
    setClave(email);
    // Solo ante cambio de usuario (clave se actualiza acá mismo).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [email]);

  // Persistir en cada cambio bajo la clave vigente.
  useEffect(() => {
    guardarCarrito(clave, items);
  }, [items, clave]);

  // Sincronizar pestañas abiertas del mismo navegador.
  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const alExterno = (evento) => {
      if (!evento.key || !evento.key.endsWith(clave || 'invitado')) return;
      setItems(recalcularPrecios(sanearItems(leerCarrito(clave))));
    };
    window.addEventListener('storage', alExterno);
    return () => window.removeEventListener('storage', alExterno);
  }, [clave]);

  // Recalcular precios del carrito cuando cambia la personalización (Socket.IO).
  // Marca items con opciones eliminadas/desactivadas para bloquear confirmación.
  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const alCambioPersonalizacion = (evento) => {
      const { tipo, id, accion, data } = evento.detail || {};
      if (!data) return;

      setItems((prevItems) =>
        prevItems.map((item) => {
          const producto = item.producto;
          const pers = item.personalizacion || personalizacionVacia();
          let afectado = false;

          // Elemento por producto: coincide si el productoId del evento coincide
          if (tipo === 'personalizacion' && data.productoId === producto.id) {
            afectado = true;
          }
          // Plantilla por categoría: coincide si el producto usa esa categoría
          // y no tiene elementos propios de ese tipo (usa fallback de plantilla)
          if (tipo === 'personalizacion_categoria' && data.categoriaId === producto.categoriaId) {
            // Verificar si el producto tiene elementos propios de ese tipo
            const tienePropios = (tipoElem) =>
              (pers[tipoElem] || []).some((e) => e.id && String(e.id).startsWith('elem-'));
            // Si no tiene propios de ese tipo, usa plantilla -> afectado
            if (data.tipo === 'extra' && !tienePropios('extra')) afectado = true;
            if (data.tipo === 'acompanar' && !tienePropios('acompanar')) afectado = true;
            if (data.tipo === 'condimento' && !tienePropios('condimento')) afectado = true;
            // 'personalizar' nunca usa plantillas de categoría
          }
          if (!afectado) return item;

          // Recalcular precio con config vigente
          const extras = pers.extras || [];
          const acomp = pers.acompanamientos || [];
          const precioUnitarioPersonalizado = calcularPrecioUnitario(
            producto.precio,
            extras,
            acomp
          );

          // Verificar opciones seleccionadas que ya no existen o están desactivadas
          const opcionesEliminadas = [];
          const tiposARevisar = ['extras', 'acompanamientos', 'condimentos'];
          for (const t of tiposARevisar) {
            const seleccionados = pers[t] || [];
            for (const sel of seleccionados) {
              // Buscar en config vigente (viene en data del evento, pero no tenemos la lista completa aquí)
              // Se marca genéricamente: si el elemento fue eliminado o desactivado
              if (
                accion === 'eliminado' &&
                String(sel.id) === String(id)
              ) {
                opcionesEliminadas.push({ tipo: t, nombre: sel.nombre, id: sel.id });
              } else if (
                accion === 'actualizado' &&
                data.activo === false &&
                String(sel.id) === String(id)
              ) {
                opcionesEliminadas.push({ tipo: t, nombre: sel.nombre, id: sel.id });
              }
            }
          }
          // 'sin' (personalizar) no tiene precio pero puede tener mínimo
          const sinSeleccionados = pers.sin || [];
          for (const sel of sinSeleccionados) {
            if (
              (accion === 'eliminado' || (accion === 'actualizado' && data.activo === false)) &&
              String(sel.id) === String(id)
            ) {
              opcionesEliminadas.push({ tipo: 'sin', nombre: sel.nombre, id: sel.id });
            }
          }

          const itemActualizado = {
            ...item,
            precioUnitarioPersonalizado,
            personalizacion: {
              ...pers,
              _requiereRevision: opcionesEliminadas.length > 0,
              _opcionesEliminadas: opcionesEliminadas,
            },
          };
          return itemActualizado;
        })
      );
    };
    window.addEventListener('personalizacion-cambio', alCambioPersonalizacion);
    return () => window.removeEventListener('personalizacion-cambio', alCambioPersonalizacion);
  }, []);

  const agregarAlCarrito = useCallback((producto, cantidad = 1, personalizacion = null, nota = null) => {
    const pers = personalizacion || personalizacionVacia();
    const extras = pers.extras || [];
    const acomp = pers.acompanamientos || [];
    const precioUnitarioPersonalizado = calcularPrecioUnitario(producto.precio, extras, acomp);
    const notaNormalizada = normalizarNota(nota);

    setItems((prevItems) => {
      const existente = prevItems.find(
        (item) => item.producto.id === producto.id && compararPersonalizacion(item.personalizacion, pers)
      );
      if (existente) {
        return prevItems.map((item) =>
          item.idLinea === existente.idLinea
            ? {
                ...item,
                cantidad: item.cantidad + cantidad,
                nota: item.nota || notaNormalizada,
              }
            : item
        );
      }
      return [
        ...prevItems,
        {
          idLinea: generarIdLinea(producto.id),
          producto,
          cantidad,
          personalizacion: pers,
          precioUnitarioPersonalizado,
          nota: notaNormalizada,
        },
      ];
    });
    // Sin banner: el ícono del carrito en el Navbar ya notifica con su pulso/badge
  }, []);

  const eliminarDelCarrito = useCallback((idLineaOrProductoId) => {
    setItems((prevItems) => {
      const byLinea = prevItems.filter((item) => item.idLinea !== idLineaOrProductoId);
      if (byLinea.length !== prevItems.length) return byLinea;
      return prevItems.filter((item) => String(item.producto.id) !== String(idLineaOrProductoId));
    });
  }, []);

  const actualizarCantidad = useCallback((idLineaOrProductoId, nuevaCantidad) => {
    if (nuevaCantidad <= 0) {
      setItems((prev) => {
        const byLinea = prev.filter((item) => item.idLinea !== idLineaOrProductoId);
        if (byLinea.length !== prev.length) return byLinea;
        return prev.filter((item) => String(item.producto.id) !== String(idLineaOrProductoId));
      });
      return;
    }
    setItems((prevItems) =>
      prevItems.map((item) => {
        if (item.idLinea === idLineaOrProductoId || String(item.producto.id) === String(idLineaOrProductoId)) {
          if (item.idLinea === idLineaOrProductoId) return { ...item, cantidad: nuevaCantidad };
          const othersSameId = prevItems.filter((x) => String(x.producto.id) === String(idLineaOrProductoId));
          if (othersSameId.length === 1) return { ...item, cantidad: nuevaCantidad };
        }
        return item;
      })
    );
  }, []);

  // Nota para cocina de una línea del carrito (texto libre, opcional).
  const actualizarNota = useCallback((idLineaOrProductoId, texto) => {
    const nota = normalizarNota(texto);
    setItems((prevItems) =>
      prevItems.map((item) =>
        item.idLinea === idLineaOrProductoId ||
        String(item.producto.id) === String(idLineaOrProductoId)
          ? { ...item, nota }
          : item
      )
    );
  }, []);

  // Actualiza la personalización de una línea existente y recalcula su precio.
  const actualizarPersonalizacion = useCallback((idLineaOrProductoId, personalizacion, cantidad) => {
    const pers = personalizacion || personalizacionVacia();
    const extras = pers.extras || [];
    const acomp = pers.acompanamientos || [];

    setItems((prevItems) =>
      prevItems.map((item) => {
        const coincide =
          item.idLinea === idLineaOrProductoId ||
          String(item.producto.id) === String(idLineaOrProductoId);
        if (!coincide) return item;
        return {
          ...item,
          cantidad: cantidad ?? item.cantidad,
          personalizacion: pers,
          precioUnitarioPersonalizado: calcularPrecioUnitario(
            item.producto.precio,
            extras,
            acomp
          ),
        };
      })
    );
  }, []);

  const vaciarCarrito = useCallback(() => {
    setItems([]);
    limpiarCarrito(clave);
  }, [clave]);

  const totalItems = useMemo(() => items.reduce((total, item) => total + item.cantidad, 0), [items]);

  // Cantidad de productos distintos en el carrito (para el contador del navbar)
  const productosDistintos = useMemo(
    () => new Set(items.map((item) => item.producto.id)).size,
    [items]
  );

  const total = useMemo(
    () => items.reduce((t, item) => t + (item.precioUnitarioPersonalizado ?? item.producto.precio) * item.cantidad, 0),
    [items]
  );

  const value = useMemo(
    () => ({
      items,
      totalItems,
      productosDistintos,
      total,
      agregarAlCarrito,
      eliminarDelCarrito,
      actualizarCantidad,
      actualizarNota,
      actualizarPersonalizacion,
      vaciarCarrito,
    }),
    [items, totalItems, productosDistintos, total, agregarAlCarrito, eliminarDelCarrito, actualizarCantidad, actualizarNota, actualizarPersonalizacion, vaciarCarrito]
  );

  return <CarritoContext.Provider value={value}>{children}</CarritoContext.Provider>;
};

import React, {
  createContext,
  useState,
  useCallback,
  useMemo,
  useEffect,
} from 'react';
import { calcularPrecioUnitario } from '../services/personalizacionConfig';
import { compararPersonalizacion, generarIdLinea, personalizacionVacia } from '../utils/personalizacionHelpers';
import { useAuth } from '../hooks/useAuth';
import { useNotificaciones } from '../hooks/useNotificaciones';
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
  const { notificar } = useNotificaciones();
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

  const agregarAlCarrito = useCallback((producto, cantidad = 1, personalizacion = null) => {
    const pers = personalizacion || personalizacionVacia();
    const extras = pers.extras || [];
    const acomp = pers.acompanamientos || [];
    const precioUnitarioPersonalizado = calcularPrecioUnitario(producto.precio, extras, acomp);

    setItems((prevItems) => {
      const existente = prevItems.find(
        (item) => item.producto.id === producto.id && compararPersonalizacion(item.personalizacion, pers)
      );
      if (existente) {
        return prevItems.map((item) =>
          item.idLinea === existente.idLinea ? { ...item, cantidad: item.cantidad + cantidad } : item
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

  const vaciarCarrito = useCallback(() => {
    setItems([]);
    limpiarCarrito(clave);
    notificar('Carrito vaciado.', 'success');
  }, [clave, notificar]);

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
      vaciarCarrito,
    }),
    [items, totalItems, productosDistintos, total, agregarAlCarrito, eliminarDelCarrito, actualizarCantidad, vaciarCarrito]
  );

  return <CarritoContext.Provider value={value}>{children}</CarritoContext.Provider>;
};

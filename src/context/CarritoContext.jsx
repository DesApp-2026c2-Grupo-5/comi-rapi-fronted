import React, { createContext, useState, useCallback, useMemo } from 'react';
import { calcularPrecioUnitario } from '../services/personalizacionConfig';
import { compararPersonalizacion, generarIdLinea, personalizacionVacia } from '../utils/personalizacionHelpers';

export const CarritoContext = createContext(null);

export const CarritoProvider = ({ children }) => {
  const [items, setItems] = useState([]);

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
    alert(`"${producto.nombre}" agregado al carrito.`);
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
    alert('Carrito vaciado.');
  }, []);

  const totalItems = useMemo(() => items.reduce((total, item) => total + item.cantidad, 0), [items]);

  const total = useMemo(
    () => items.reduce((t, item) => t + (item.precioUnitarioPersonalizado ?? item.producto.precio) * item.cantidad, 0),
    [items]
  );

  const value = useMemo(
    () => ({
      items,
      totalItems,
      total,
      agregarAlCarrito,
      eliminarDelCarrito,
      actualizarCantidad,
      vaciarCarrito,
    }),
    [items, totalItems, total, agregarAlCarrito, eliminarDelCarrito, actualizarCantidad, vaciarCarrito]
  );

  return <CarritoContext.Provider value={value}>{children}</CarritoContext.Provider>;
};

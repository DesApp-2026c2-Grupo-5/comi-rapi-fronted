/**
 * Propósito: Contexto del carrito de compras para manejar ítems, totales y operaciones del carrito.
 * Contenido: CarritoProvider, CarritoContext, con funciones agregar, eliminar, vaciar, etc.
 * Dependencias: React (createContext, useState, useCallback, useMemo).
 * Uso: <CarritoProvider> envuelve la app en App.jsx. Consumir con useCarrito().
 */

import React, { createContext, useState, useCallback, useMemo } from 'react';

// Se crea el contexto
export const CarritoContext = createContext(null);

/**
 * Proveedor del contexto del carrito.
 * @param {React.ReactNode} children - Componentes hijos.
 */
export const CarritoProvider = ({ children }) => {
  // Estado de los ítems del carrito: [{ producto, cantidad }]
  const [items, setItems] = useState([]);

  /**
   * Agrega un producto al carrito. Si ya existe, incrementa la cantidad.
   * @param {object} producto - Producto a agregar { id, nombre, precio, ... }.
   * @param {number} cantidad - Cantidad a agregar (default: 1).
   */
  const agregarAlCarrito = useCallback((producto, cantidad = 1) => {
    setItems((prevItems) => {
      const existente = prevItems.find((item) => item.producto.id === producto.id);
      if (existente) {
        return prevItems.map((item) =>
          item.producto.id === producto.id
            ? { ...item, cantidad: item.cantidad + cantidad }
            : item
        );
      }
      return [...prevItems, { producto, cantidad }];
    });
    // Mostrar alerta simulando la acción
    alert(`"${producto.nombre}" agregado al carrito.`);
  }, []);

  /**
   * Elimina un producto del carrito por su ID.
   * @param {number} productoId - ID del producto a eliminar.
   */
  const eliminarDelCarrito = useCallback((productoId) => {
    setItems((prevItems) => prevItems.filter((item) => item.producto.id !== productoId));
  }, []);

  /**
   * Actualiza la cantidad de un producto en el carrito.
   * @param {number} productoId - ID del producto.
   * @param {number} nuevaCantidad - Nueva cantidad.
   */
  const actualizarCantidad = useCallback((productoId, nuevaCantidad) => {
    if (nuevaCantidad <= 0) {
      setItems((prevItems) => prevItems.filter((item) => item.producto.id !== productoId));
      return;
    }
    setItems((prevItems) =>
      prevItems.map((item) =>
        item.producto.id === productoId ? { ...item, cantidad: nuevaCantidad } : item
      )
    );
  }, []);

  /**
   * Vacía todo el carrito.
   */
  const vaciarCarrito = useCallback(() => {
    setItems([]);
    alert('Carrito vaciado.');
  }, []);

  // Total de ítems
  const totalItems = useMemo(
    () => items.reduce((total, item) => total + item.cantidad, 0),
    [items]
  );

  // Total en dinero
  const total = useMemo(
    () => items.reduce((total, item) => total + item.producto.precio * item.cantidad, 0),
    [items]
  );

  // Valor del contexto
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

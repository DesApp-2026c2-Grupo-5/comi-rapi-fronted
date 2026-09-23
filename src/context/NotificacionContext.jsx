/**
 * Propósito: Sistema global de notificaciones tipo banner inline (reemplaza los
 *            alert() nativos y los toasts). Los banners se renderizan dentro del
 *            contenido de cada página (en <main>) con la estética Comi-Rapi
 *            (crema #fff4e2, borde naranja, redondeados). Se auto-cierran o se
 *            cierran con la X. Cada banner puede llevar una acción opcional:
 *            al hacer clic sobre él se ejecuta (p. ej. navegar a un pedido).
 * Contenido: NotificacionProvider y NotificacionContext. Expone notificar(mensaje,
 *            tipo, duration, enClick) donde tipo es 'success' | 'danger' |
 *            'warning' | 'info', y la lista de banners activos para que
 *            BannersNotificaciones los dibuje.
 * Dependencias: react (createContext, useState, useCallback, useMemo, useRef).
 * Uso: <NotificacionProvider> envuelve la app en App.jsx (sobre AuthProvider).
 *      Consumir con useNotificaciones(). BannersNotificaciones se renderiza en
 *      main (App.jsx) justo antes de AppRoutes.
 */

import React, {
  createContext,
  useState,
  useCallback,
  useMemo,
  useRef,
} from 'react';

export const NotificacionContext = createContext(null);

export const NotificacionProvider = ({ children }) => {
  const [banners, setBanners] = useState([]);
  const proximoId = useRef(1);

  // Quita un banner por su id (botón X o cierre automático).
  const quitar = useCallback((id) => {
    setBanners((prev) => prev.filter((b) => b.id !== id));
  }, []);

  // Muestra una notificación inline que se cierra sola tras la duración.
  // Si se pasa enClick, el banner se vuelve clickeable y ejecuta la acción.
  const notificar = useCallback(
    (mensaje, tipo = 'success', duration = 5000, enClick) => {
      const id = proximoId.current++;
      setBanners((prev) => [...prev, { id, mensaje, tipo, enClick }]);
      setTimeout(() => quitar(id), duration);
    },
    [quitar]
  );

  const value = useMemo(
    () => ({ notificar, banners, quitar }),
    [notificar, banners, quitar]
  );

  return (
    <NotificacionContext.Provider value={value}>
      {children}
    </NotificacionContext.Provider>
  );
};
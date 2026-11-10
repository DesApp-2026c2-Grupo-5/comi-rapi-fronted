/**
 * Utilidades para manejo de mapas
 * Funciones puras y reutilizables
 */

import L from 'leaflet';

/**
 * Formatea la dirección anidada del backend como string legible
 * El backend devuelve: { calle, altura, provincia, departamento?, localidad?, codigoPostal?, referencia? }
 */
export const formatearDireccion = (direccion) => {
  if (!direccion) return '';
  const partes = [];
  if (direccion.calle && direccion.altura) {
    partes.push(`${direccion.calle} ${direccion.altura}`);
  } else if (direccion.calle) {
    partes.push(direccion.calle);
  }
  if (direccion.provincia) partes.push(direccion.provincia);
  if (direccion.departamento) partes.push(direccion.departamento);
  if (direccion.localidad) partes.push(direccion.localidad);
  if (direccion.codigoPostal) partes.push(direccion.codigoPostal);
  if (direccion.referencia) partes.push(direccion.referencia);
  return partes.join(', ');
};

/**
 * Fit bounds seguro - evita errores en mapa no inicializado
 */
export const fitBoundsSafe = (map, puntos, opciones = {}) => {
  if (!map || !puntos || puntos.length === 0) return;
  
  const coords = puntos
    .filter(p => p.latitud && p.longitud)
    .map(p => [Number(p.latitud), Number(p.longitud)]);
  
  if (coords.length === 0) return;
  
  try {
    if (coords.length === 1) {
      map.setView(coords[0], 13);
    } else {
      map.fitBounds(coords, {
        padding: [40, 40],
        maxZoom: 15,
        ...opciones,
      });
    }
  } catch (error) {
    console.warn('[mapUtils] Error en fitBounds:', error);
  }
};

/**
 * Configura zoom con Ctrl + ruedita
 * Deshabilita zoom nativo y maneja evento wheel con ctrlKey
 * Retorna función de limpieza
 */
export const setupCtrlZoom = (map, habilitado = true) => {
  if (!map || !habilitado) return () => {};

  const handleWheel = (e) => {
    // Permitir zoom nativo solo con Ctrl (Windows/Linux) o Cmd (Mac)
    if (e.ctrlKey || e.metaKey) {
      return; // Dejar que Leaflet maneje el zoom nativo
    }
    
    // Prevenir zoom sin Ctrl/Cmd
    e.preventDefault();
    e.stopPropagation();
  };

  const container = map.getContainer();
  if (!container) return () => {};

  container.addEventListener('wheel', handleWheel, { passive: false });
  
  // Función de limpieza
  return () => {
    if (container) {
      container.removeEventListener('wheel', handleWheel);
    }
  };
}

/**
 * Configura zoom nativo con toggle por focus/blur (alternativa)
 * Habilita scrollWheelZoom solo cuando el mapa tiene focus
 */
export const setupFocusZoom = (map) => {
  if (!map) return () => {};
  
  const onFocus = () => map.scrollWheelZoom.enable();
  const onBlur = () => map.scrollWheelZoom.disable();
  
  const container = map.getContainer();
  if (!container) return () => {};
  
  container.addEventListener('focus', onFocus, true);
  container.addEventListener('blur', onBlur, true);
  
  // Inicialmente deshabilitado
  map.scrollWheelZoom.disable();
  
  return () => {
    if (container) {
      container.removeEventListener('focus', onFocus, true);
      container.removeEventListener('blur', onBlur, true);
    }
    map.scrollWheelZoom.enable();
  };
}

/**
 * Calcula zoom óptimo para mostrar todos los puntos
 */
export const calculateOptimalZoom = (puntos) => {
  if (!puntos || puntos.length === 0) return 13;
  if (puntos.length === 1) return 15;
  
  const coords = puntos
    .filter(p => p.latitud && p.longitud)
    .map(p => [Number(p.latitud), Number(p.longitud)]);
  
  if (coords.length === 0) return 13;
  
  // Calcular bounds
  const lats = coords.map(c => c[0]);
  const lngs = coords.map(c => c[1]);
  const latRange = Math.max(...lats) - Math.min(...lats);
  const lngRange = Math.max(...lngs) - Math.min(...lngs);
  const maxRange = Math.max(latRange, lngRange);
  
  // Heurística simple para zoom basado en rango
  if (maxRange > 1) return 10;
  if (maxRange > 0.5) return 11;
  if (maxRange > 0.2) return 12;
  if (maxRange > 0.1) return 13;
  if (maxRange > 0.05) return 14;
  return 15;
}

/**
 * Verifica si un punto está dentro de los bounds del mapa
 */
export const isPointInBounds = (map, lat, lng) => {
  if (!map) return false;
  const bounds = map.getBounds();
  return bounds.contains([lat, lng]);
}

/**
 * Obtiene el centro de un array de puntos
 */
export const getCenterOfPoints = (puntos) => {
  if (!puntos || puntos.length === 0) return null;
  
  const validPoints = puntos.filter(p => p.latitud && p.longitud);
  if (validPoints.length === 0) return null;
  
  const latSum = validPoints.reduce((sum, p) => sum + Number(p.latitud), 0);
  const lngSum = validPoints.reduce((sum, p) => sum + Number(p.longitud), 0);
  
  return {
    lat: latSum / validPoints.length,
    lng: lngSum / validPoints.length,
  };
}

/**
 * Filtra puntos válidos (con coordenadas)
 */
export const filterValidPoints = (puntos) => {
  return (puntos || []).filter(p => p.latitud && p.longitud);
}

/**
 * Formatea distancia en metros a string legible
 */
export const formatDistance = (metros) => {
  if (!metros || metros < 0) return '';
  if (metros < 1000) return `${Math.round(metros)} m`;
  return `${(metros / 1000).toFixed(1)} km`;
}

/**
 * Formatea horarios de sucursal para mostrar en popup
 * Acepta array de objetos o string
 */
export const formatearHorarios = (horarios) => {
  if (!horarios) return '';
  if (typeof horarios === 'string') return horarios;
  if (!Array.isArray(horarios)) return '';
  
  return horarios
    .map(h => {
      if (!h || typeof h !== 'object') return '';
      const partes = [];
      if (h.dia) partes.push(h.dia);
      if (h.apertura && h.cierre) partes.push(`${h.apertura} - ${h.cierre}`);
      else if (h.apertura) partes.push(`Abre ${h.apertura}`);
      else if (h.cierre) partes.push(`Cierra ${h.cierre}`);
      return partes.join(' ');
    })
    .filter(Boolean)
    .join(' · ');
};
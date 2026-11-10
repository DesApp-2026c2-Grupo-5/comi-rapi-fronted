import L from 'leaflet';

/**
 * Genera nombre corto para el pin (máx 2 palabras, máx 16 chars)
 * Limpia prefijo "Sucursal " si existe
 */
export const getShortNameForPin = (nombre) => {
  if (!nombre) return 'Local';
  const clean = String(nombre).replace(/^sucursal\s+/i, '').trim();
  const palabras = clean.split(/\s+/);
  if (palabras.length === 1) return palabras[0].substring(0, 16);
  return (palabras[0] + ' ' + palabras[1]).substring(0, 16);
};

/**
 * Mapea categoría a icono SVG (inline, stroke currentColor, 16x16)
 */
export const getCategoryIcon = (categoria) => {
  const cat = (categoria || '').toLowerCase();
  
  // Hamburguesas
  if (cat.includes('hamburguesa') || cat.includes('burger')) {
    return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v18"/><path d="M5 7h14"/><path d="M5 12h14"/><path d="M5 17h14"/></svg>`;
  }
  
  // Pizza
  if (cat.includes('pizza')) {
    return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L2 7l10 9 10-9-10-9z"/><path d="M12 7v10"/><path d="M7 12h10"/></svg>`;
  }
  
  // Papas / Papas fritas
  if (cat.includes('papa') || cat.includes('frit') || cat.includes('fries')) {
    return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 6h16"/><path d="M6 6v12"/><path d="M10 6v12"/><path d="M14 6v12"/><path d="M18 6v12"/><path d="M4 18h16"/></svg>`;
  }
  
  // Bebidas
  if (cat.includes('bebida') || cat.includes('drink') || cat.includes('refresco') || cat.includes('gaseosa') || cat.includes('jugo') || cat.includes('cafe') || cat.includes('coffee')) {
    return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 2v20"/><path d="M16 2v20"/><path d="M4 22h16"/><path d="M8 2v4"/><path d="M16 2v4"/><ellipse cx="12" cy="20" rx="8" ry="2"/></svg>`;
  }
  
  // Postres
  if (cat.includes('postre') || cat.includes('dulce') || cat.includes('helado') || cat.includes('torta') || cat.includes('flan')) {
    return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2z"/><path d="M12 8v8"/><path d="M8 12h8"/></svg>`;
  }
  
  // Tacos / Mexicano
  if (cat.includes('taco') || cat.includes('mexican')) {
    return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L2 7l10 9 10-9-10-9z"/><path d="M8 11h8"/><path d="M8 15h8"/></svg>`;
  }
  
  // Sushi / Japonés
  if (cat.includes('sushi') || cat.includes('japones') || cat.includes('ramen')) {
    return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12c0-4.4 3.6-8 8-8s8 3.6 8 8"/><path d="M12 2v4"/><path d="M12 18v4"/><path d="M4 12h4"/><path d="M16 12h4"/></svg>`;
  }
  
  // Pollo
  if (cat.includes('pollo') || cat.includes('chicken')) {
    return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2z"/><path d="M12 6v6"/><path d="M9 9h6"/></svg>`;
  }
  
  // Empanadas / Tartas
  if (cat.includes('empanada') || cat.includes('tarta')) {
    return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 22h16"/><path d="M6 22V8c0-4.4 3.6-8 8-8s8 3.6 8 8v14"/></svg>`;
  }
  
  // Ensaladas
  if (cat.includes('ensalada') || cat.includes('salad')) {
    return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 22h16"/><path d="M6 22V8c0-4.4 3.6-8 8-8s8 3.6 8 8v14"/><path d="M10 22V10"/><path d="M14 22V10"/></svg>`;
  }
  
  // Combos
  if (cat.includes('combo')) {
    return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M10 8h4"/><path d="M10 12h4"/><path d="M10 16h4"/></svg>`;
  }
  
  // Default - restaurante/comida genérica
  return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2z"/><path d="M12 6v6"/><path d="M9 9h6"/></svg>`;
};

/**
 * Floating Pill Pin - Pin carbón #252b32, icono blanco genérico, SIN texto, punta inferior
 * Tamaño fijo 40x36, anclaje en la punta (iconAnchor: [20, 36])
 */
export const createStorePillIcon = () => {
  // Icono genérico de local/comercio - stroke white
  const iconSvg = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2z"/><path d="M12 6v6"/><path d="M9 9h6"/></svg>`;
  
  const html = `
    <div class="comi-pill-container">
      <span class="comi-pill-icon">${iconSvg}</span>
    </div>
  `;

  // Tamaño fijo 40x36, anclaje en la punta inferior
  return L.divIcon({
    className: 'custom-pill-marker',
    html,
    iconSize: [40, 36],
    iconAnchor: [20, 36],  // Anclaje en la punta inferior
    popupAnchor: [0, -36],
  });
};

/**
 * Dot + Pulse Aura - Punto central #1683ed + 3 anillos expansivos
 * Color exacto #1683ed, respeta prefers-reduced-motion
 */
export const createClientPulseIcon = () => {
  const html = `
    <div class="pulse-wrapper">
      <div class="pulse-ring"></div>
      <div class="pulse-ring"></div>
      <div class="pulse-ring"></div>
      <div class="pulse-core"></div>
    </div>
  `;

  return L.divIcon({
    className: 'custom-pulse-marker',
    html,
    iconSize: [48, 48],
    iconAnchor: [24, 24],
    popupAnchor: [0, -20],
  });
}

/**
 * Cliente Pulse Icon - Versión singleton para reutilizar
 */
export const clientPulseIcon = L.divIcon({
  className: 'custom-pulse-marker',
  html: `
    <div class="pulse-wrapper">
      <div class="pulse-ring"></div>
      <div class="pulse-ring"></div>
      <div class="pulse-ring"></div>
      <div class="pulse-core"></div>
    </div>
  `,
  iconSize: [48, 48],
  iconAnchor: [24, 24],
  popupAnchor: [0, -20],
});
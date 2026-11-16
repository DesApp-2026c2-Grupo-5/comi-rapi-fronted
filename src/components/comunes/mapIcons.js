import L from 'leaflet';
// Diseño de la tienda provisto como asset (se inyecta inline en el pin;
// el asset ya no incluye el texto "SHOP").
import storeSvg from '../../assets/icons/store.svg?raw';

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
 * Floating Pill Pin - Cápsula carbón #252b32 con el dibujo de la tienda
 * (store.svg, sin texto), SIN texto y con punta inferior.
 *
 * La cápsula mide 40x36 y la punta (`::after`, 8px) cuelga por debajo: el
 * ícono declara 40x44 para que la punta quede DENTRO de la caja y el anclaje
 * (la punta) coincida con la coordenada real de la sucursal.
 */
export const createStorePillIcon = () => {
  const html = `
    <div class="comi-pill-container">
      <span class="comi-pill-icon">${storeSvg}</span>
    </div>
  `;

  return L.divIcon({
    className: 'custom-pill-marker',
    html,
    iconSize: [40, 44],
    iconAnchor: [20, 44], // anclaje en el extremo de la punta inferior
    popupAnchor: [0, -44],
  });
};

/**
 * Dot + Pulse Aura - Punto central #1683ed + 3 anillos expansivos
 * Color exacto #1683ed, respeta prefers-reduced-motion.
 * Singleton: el icono es idéntico para todas las instancias, no hace falta
 * fabricar uno por render.
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
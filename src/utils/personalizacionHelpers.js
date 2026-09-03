export function generarIdLinea(productoId) {
  return `${productoId}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function normalizarLista(lista) {
  return [...lista].sort((a, b) => {
    if (a.id && b.id) return a.id.localeCompare(b.id);
    if (a.nombre && b.nombre) return a.nombre.localeCompare(b.nombre);
    return String(a).localeCompare(String(b));
  });
}

export function compararPersonalizacion(a, b) {
  if (!a && !b) return true;
  if (!a || !b) return false;
  const ax = {
    extras: normalizarLista(a.extras || []),
    sin: [...(a.sin || [])].sort(),
    acompanamientos: normalizarLista(a.acompanamientos || []),
    condimentos: normalizarLista(a.condimentos || []),
  };
  const bx = {
    extras: normalizarLista(b.extras || []),
    sin: [...(b.sin || [])].sort(),
    acompanamientos: normalizarLista(b.acompanamientos || []),
    condimentos: normalizarLista(b.condimentos || []),
  };
  return JSON.stringify(ax) === JSON.stringify(bx);
}

export function personalizacionVacia() {
  return { extras: [], sin: [], acompanamientos: [], condimentos: [] };
}

export function crearPersonalizacionDesdeEstado({ extra, acompanar, condimento, sin }) {
  return {
    extras: Object.entries(extra || {})
      .filter(([, v]) => v > 0)
      .map(([key, cantidad]) => {
        const map = { tomate: { id: 'ex_tomate', nombre: 'Tomate', precio: 2000 }, bacon: { id: 'ex_bacon', nombre: 'Bacon', precio: 2700 }, cheddar: { id: 'ex_cheddar', nombre: 'Queso Cheddar en fetas', precio: 2000 } };
        return map[key] ? { ...map[key], cantidad } : null;
      })
      .filter(Boolean),
    sin: Object.entries(sin || {}).filter(([, v]) => v).map(([k]) => k),
    acompanamientos: Object.entries(acompanar || {})
      .filter(([, v]) => v > 0)
      .map(([key, cantidad]) => {
        const map = { cheddar: { id: 'ac_cheddar', nombre: 'Pileta de Cheddar', precio: 4000 }, burger: { id: 'ac_burger', nombre: 'Hamburguesa Con Queso', precio: 7100 }, papas: { id: 'ac_papas', nombre: 'Papas Fritas Grandes', precio: 5300 } };
        return map[key] ? { ...map[key], cantidad } : null;
      })
      .filter(Boolean),
    condimentos: Object.entries(condimento || {})
      .filter(([, v]) => v > 0)
      .map(([key, cantidad]) => ({ nombre: key, cantidad })),
  };
}

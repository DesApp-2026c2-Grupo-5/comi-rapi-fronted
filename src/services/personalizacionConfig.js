export const GRUPOS = {
  EXTRA: 'extra',
  PERSONALIZAR: 'personalizar',
  ACOMPANAR: 'acompanar',
  CONDIMENTO: 'condimento',
};

export const personalizacionPorCategoria = {
  Hamburguesas: {
    extra: [
      { id: 'ex_tomate', nombre: 'Tomate', precio: 2000 },
      { id: 'ex_bacon', nombre: 'Bacon', precio: 2700 },
      { id: 'ex_cheddar', nombre: 'Queso Cheddar en fetas', precio: 2000 },
    ],
    personalizar: ['Pan XL', 'Mostaza', 'Ketchup', 'Cebolla', 'Bacon', 'Queso Cheddar en fetas', 'Carne'],
    acompanar: [
      { id: 'ac_cheddar', nombre: 'Pileta de Cheddar', precio: 4000 },
      { id: 'ac_burger', nombre: 'Hamburguesa Con Queso', precio: 7100 },
      { id: 'ac_papas', nombre: 'Papas Fritas Grandes', precio: 5300 },
    ],
    condimento: ['Sobre de Ketchup', 'Sobre de Mayonesa'],
  },
  Pizzas: {
    extra: [
      { id: 'ex_muzza', nombre: 'Muzzarella extra', precio: 1800 },
      { id: 'ex_jamon', nombre: 'Jamón', precio: 2200 },
      { id: 'ex_tomate', nombre: 'Tomate', precio: 1500 },
    ],
    personalizar: ['Muzzarella', 'Tomate', 'Albahaca', 'Aceitunas', 'Orégano'],
    acompanar: [
      { id: 'ac_papas', nombre: 'Papas Fritas Grandes', precio: 5300 },
      { id: 'ac_gaseosa', nombre: 'Gaseosa 500ml', precio: 800 },
    ],
    condimento: ['Sobre de Orégano', 'Sobre de Ají'],
  },
  Combos: {
    extra: [
      { id: 'ex_bacon', nombre: 'Bacon', precio: 2700 },
      { id: 'ex_cheddar', nombre: 'Queso Cheddar en fetas', precio: 2000 },
    ],
    personalizar: ['Pan', 'Carne', 'Queso', 'Lechuga', 'Tomate', 'Papas', 'Bebida'],
    acompanar: [
      { id: 'ac_cheddar', nombre: 'Pileta de Cheddar', precio: 4000 },
      { id: 'ac_papas', nombre: 'Papas Fritas Grandes', precio: 5300 },
    ],
    condimento: ['Sobre de Ketchup', 'Sobre de Mayonesa'],
  },
  Papas: {
    extra: [
      { id: 'ex_cheddar_extra', nombre: 'Cheddar extra', precio: 1200 },
      { id: 'ex_bacon', nombre: 'Bacon', precio: 2000 },
    ],
    personalizar: ['Sal', 'Cheddar', 'Cebollín'],
    acompanar: [
      { id: 'ac_bebida', nombre: 'Bebida 500ml', precio: 800 },
    ],
    condimento: ['Sobre de Ketchup', 'Sobre de Mayonesa'],
  },
  Bebidas: {
    extra: [],
    personalizar: ['Hielo', 'Azúcar', 'Limón'],
    acompanar: [],
    condimento: [],
  },
  Postres: {
    extra: [],
    personalizar: [],
    acompanar: [],
    condimento: [],
  },
};

export const LIMITES = { extra: 6, personalizar: 7, acompanar: 3, condimento: 2 };

export function getConfigParaCategoria(categoria) {
  return personalizacionPorCategoria[categoria] || { extra: [], personalizar: [], acompanar: [], condimento: [] };
}

export function calcularPrecioPersonalizado(precioBase, extras, acompanamientos, cantidad = 1) {
  const extraTotal = extras.reduce((s, e) => s + e.precio * e.cantidad, 0);
  const acompTotal = acompanamientos.reduce((s, e) => s + e.precio * e.cantidad, 0);
  return (precioBase + extraTotal + acompTotal) * cantidad;
}

export function calcularPrecioUnitario(precioBase, extras, acompanamientos) {
  const extraTotal = extras.reduce((s, e) => s + e.precio * e.cantidad, 0);
  const acompTotal = acompanamientos.reduce((s, e) => s + e.precio * e.cantidad, 0);
  return precioBase + extraTotal + acompTotal;
}

/**
 * Propósito: Contener todos los datos mock/semilla para desarrollo del proyecto.
 * Contenido: Arrays de productos, categorías, sucursales y pedidos mockeados.
 * Dependencias: Ninguna.
 * Uso: import { productosMock, categoriasMock, sucursalesMock, pedidosMock } from '../services/seedData';
 */

// Datos mock de productos (MOCK - reemplazar con llamadas a la API en producción)
export const productosMock = [
  {
    id: 1,
    nombre: 'Hamburguesa Clásica',
    precio: 1500,
    categoria: 'Hamburguesas',
    imagen: 'https://via.placeholder.com/300x200?text=Hamburguesa+Clásica',
    descripcion: 'Deliciosa hamburguesa con lechuga, tomate y queso.',
  },
  {
    id: 2,
    nombre: 'Hamburguesa Doble',
    precio: 2200,
    categoria: 'Hamburguesas',
    imagen: 'https://via.placeholder.com/300x200?text=Hamburguesa+Doble',
    descripcion: 'Doble carne, doble queso, doble sabor.',
  },
  {
    id: 3,
    nombre: 'Pizza Muzzarella',
    precio: 2500,
    categoria: 'Pizzas',
    imagen: 'https://via.placeholder.com/300x200?text=Pizza+Muzzarella',
    descripcion: 'Pizza clásica con abundante muzzarella.',
  },
  {
    id: 4,
    nombre: 'Pizza Napolitana',
    precio: 2800,
    categoria: 'Pizzas',
    imagen: 'https://via.placeholder.com/300x200?text=Pizza+Napolitana',
    descripcion: 'Con tomate, muzzarella y albahaca fresca.',
  },
  {
    id: 5,
    nombre: 'Coca-Cola 500ml',
    precio: 800,
    categoria: 'Bebidas',
    imagen: 'https://via.placeholder.com/300x200?text=Coca-Cola',
    descripcion: 'Coca-Cola bien fría de 500ml.',
  },
  {
    id: 6,
    nombre: 'Limonada Natural',
    precio: 600,
    categoria: 'Bebidas',
    imagen: 'https://via.placeholder.com/300x200?text=Limonada',
    descripcion: 'Limonada natural recién preparada.',
  },
];

// Datos mock de categorías (MOCK - reemplazar con llamadas a la API en producción)
export const categoriasMock = [
  { id: 1, nombre: 'Hamburguesas', descripcion: 'Nuestras deliciosas hamburguesas' },
  { id: 2, nombre: 'Pizzas', descripcion: 'Pizzas artesanales al horno' },
  { id: 3, nombre: 'Bebidas', descripcion: 'Bebidas frías y calientes' },
];

// Datos mock de sucursales (MOCK - reemplazar con llamadas a la API en producción)
export const sucursalesMock = [
  {
    id: 1,
    nombre: 'Sucursal Centro',
    direccion: 'Av. Principal 123, Centro',
    estado: 'activo',
    pedidosPendientes: 3,
  },
  {
    id: 2,
    nombre: 'Sucursal Norte',
    direccion: 'Calle Norte 456, Barrio Norte',
    estado: 'activo',
    pedidosPendientes: 1,
  },
  {
    id: 3,
    nombre: 'Sucursal Sur',
    direccion: 'Av. Sur 789, Barrio Sur',
    estado: 'activo',
    pedidosPendientes: 5,
  },
];

// Datos mock de pedidos (MOCK - reemplazar con llamadas a la API en producción)
export const pedidosMock = [
  {
    id: 1001,
    cliente: { nombre: 'Juan Pérez', email: 'cliente@test.com' },
    productos: [
      { nombre: 'Hamburguesa Clásica', cantidad: 2, precio: 1500 },
      { nombre: 'Coca-Cola 500ml', cantidad: 1, precio: 800 },
    ],
    total: 3800,
    estado: 'Pendiente',
    sucursal: 'Sucursal Centro',
  },
  {
    id: 1002,
    cliente: { nombre: 'María López', email: 'maria@test.com' },
    productos: [
      { nombre: 'Pizza Muzzarella', cantidad: 1, precio: 2500 },
      { nombre: 'Limonada Natural', cantidad: 2, precio: 600 },
    ],
    total: 3700,
    estado: 'Confirmado',
    sucursal: 'Sucursal Norte',
  },
  {
    id: 1003,
    cliente: { nombre: 'Carlos García', email: 'carlos@test.com' },
    productos: [
      { nombre: 'Hamburguesa Doble', cantidad: 1, precio: 2200 },
    ],
    total: 2200,
    estado: 'Entregado',
    sucursal: 'Sucursal Sur',
  },
];

// Datos mock de usuarios pre-cargados (MOCK - reemplazar con llamadas a la API en producción)
export const usuariosMock = [
  { id: 1, nombre: 'Cliente Test', email: 'cliente@test.com', password: '123456', rol: 'CLIENTE' },
  { id: 2, nombre: 'Admin Test', email: 'admin@test.com', password: '123456', rol: 'ADMIN' },
];

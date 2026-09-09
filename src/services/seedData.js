/**
 * Propósito: Contener todos los datos mock/semilla para desarrollo del proyecto.
 * Contenido: Arrays de productos, categorías, sucursales, pedidos y pedidos pendientes mockeados.
 * Dependencias: Ninguna.
 * Uso: import { productosMock, categoriasMock, sucursalesMock, pedidosMock, pedidosPendientesMock } from '../services/seedData';
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
  {
    id: 7,
    nombre: 'Combo Doble',
    precio: 3200,
    categoria: 'Combos',
    imagen: 'https://via.placeholder.com/300x200?text=Combo+Doble',
    descripcion: 'Hamburguesa doble, papas fritas y bebida incluida.',
  },
  {
    id: 8,
    nombre: 'Papas Fritas Grandes',
    precio: 900,
    categoria: 'Papas',
    imagen: 'https://via.placeholder.com/300x200?text=Papas+Fritas',
    descripcion: 'Porción grande de papas crujientes con sal.',
  },
  {
    id: 9,
    nombre: 'Papas Cheddar',
    precio: 1200,
    categoria: 'Papas',
    imagen: 'https://via.placeholder.com/300x200?text=Papas+Cheddar',
    descripcion: 'Papas con abundante cheddar fundido y cebollín.',
  },
  {
    id: 10,
    nombre: 'Lava Cake',
    precio: 1100,
    categoria: 'Postres',
    imagen: 'https://via.placeholder.com/300x200?text=Lava+Cake',
    descripcion: 'Bizcocho de chocolate con centro fundido.',
  },
  {
    id: 11,
    nombre: 'Cheesecake',
    precio: 1300,
    categoria: 'Postres',
    imagen: 'https://via.placeholder.com/300x200?text=Cheesecake',
    descripcion: 'Cheesecake cremoso con salsa de frutos rojos.',
  },
];

// Datos mock de categorías (MOCK - reemplazar con llamadas a la API en producción)
export const categoriasMock = [
  { id: 1, nombre: 'Hamburguesas', descripcion: 'Nuestras deliciosas hamburguesas' },
  { id: 6, nombre: 'Pizzas', descripcion: 'Pizzas artesanales al horno de barro' },
  { id: 2, nombre: 'Combos', descripcion: 'Combos con papas y bebida' },
  { id: 3, nombre: 'Papas', descripcion: 'Papas fritas para compartir' },
  { id: 4, nombre: 'Bebidas', descripcion: 'Bebidas frías y calientes' },
  { id: 5, nombre: 'Postres', descripcion: 'El mejor cierre para tu pedido' },
];

// Datos mock de sucursales (MOCK - reemplazar con llamadas a la API en producción)
export const sucursalesMock = [
  {
    id: 1,
    nombre: 'Sucursal Centro',
    direccion: 'Av. Principal 123',
    lat: -34.6037,
    lng: -58.3816,
    horario: 'Lun-Dom 10:00-23:00',
    telefono: '011-1234-5678',
    estado: 'activo',
  },
  {
    id: 2,
    nombre: 'Sucursal Norte',
    direccion: 'Calle Norte 456',
    lat: -34.5926,
    lng: -58.3912,
    horario: 'Lun-Vie 10:00-22:00',
    telefono: '011-8765-4321',
    estado: 'activo',
  },
  {
    id: 3,
    nombre: 'Sucursal Sur',
    direccion: 'Av. Sur 789',
    lat: -34.6123,
    lng: -58.3718,
    horario: 'Lun-Sab 11:00-00:00',
    telefono: '011-5678-1234',
    estado: 'activo',
  },
];

// Datos mock de pedidos pendientes por sucursal (MOCK - reemplazar con llamadas a la API en producción).
// Se usa para la lógica de asignación de la sucursal óptima al cliente.
export const pedidosPendientesMock = [
  { id: 1, sucursalId: 1, estado: 'pendiente' },
  { id: 2, sucursalId: 1, estado: 'pendiente' },
  { id: 3, sucursalId: 2, estado: 'pendiente' },
];

// Datos mock de pedidos con estados e historial completo (MOCK - reemplazar con llamadas a la API en producción).
export const pedidosMock = [
  {
    id: 1,
    cliente: 'cliente@test.com',
    productos: [
      { nombre: 'Hamburguesa', cantidad: 2, precio: 1500 },
      { nombre: 'Papas fritas', cantidad: 1, precio: 800 },
    ],
    total: 3800,
    sucursal: { id: 1, nombre: 'Sucursal Centro', direccion: 'Av. Principal 123' },
    estado: 'entregado',
    fecha: '2026-08-20T18:30:00Z',
    historialEstados: [
      { estado: 'pendiente', fecha: '2026-08-20T18:30:00Z' },
      { estado: 'confirmado', fecha: '2026-08-20T18:32:00Z' },
      { estado: 'en_preparacion', fecha: '2026-08-20T18:35:00Z' },
      { estado: 'listo_para_entregar', fecha: '2026-08-20T18:50:00Z' },
      { estado: 'en_camino', fecha: '2026-08-20T19:00:00Z' },
      { estado: 'entregado', fecha: '2026-08-20T19:20:00Z' },
    ],
  },
  {
    id: 2,
    cliente: 'cliente@test.com',
    productos: [
      { nombre: 'Pizza', cantidad: 1, precio: 2500 },
    ],
    total: 2500,
    sucursal: { id: 2, nombre: 'Sucursal Norte', direccion: 'Calle Norte 456' },
    estado: 'en_camino',
    fecha: '2026-08-25T12:15:00Z',
    historialEstados: [
      { estado: 'pendiente', fecha: '2026-08-25T12:15:00Z' },
      { estado: 'confirmado', fecha: '2026-08-25T12:17:00Z' },
      { estado: 'en_preparacion', fecha: '2026-08-25T12:20:00Z' },
      { estado: 'listo_para_entregar', fecha: '2026-08-25T12:40:00Z' },
      { estado: 'en_camino', fecha: '2026-08-25T12:50:00Z' },
    ],
  },
  {
    id: 3,
    cliente: 'cliente@test.com',
    productos: [
      { nombre: 'Combo', cantidad: 1, precio: 3200 },
    ],
    total: 3200,
    sucursal: { id: 1, nombre: 'Sucursal Centro', direccion: 'Av. Principal 123' },
    estado: 'pendiente',
    fecha: '2026-08-25T19:00:00Z',
    historialEstados: [
      { estado: 'pendiente', fecha: '2026-08-25T19:00:00Z' },
    ],
  },
  {
    id: 4,
    cliente: 'cliente@test.com',
    productos: [
      { nombre: 'Pizza Muzzarella', cantidad: 1, precio: 2500 },
      { nombre: 'Papas Fritas Grandes', cantidad: 2, precio: 900 },
    ],
    total: 4300,
    sucursal: { id: 3, nombre: 'Sucursal Sur', direccion: 'Av. Sur 789' },
    estado: 'confirmado',
    fecha: '2026-08-26T13:20:00Z',
    historialEstados: [
      { estado: 'pendiente', fecha: '2026-08-26T13:20:00Z' },
      { estado: 'confirmado', fecha: '2026-08-26T13:25:00Z' },
    ],
  },
];

// Datos mock de usuarios pre-cargados (MOCK - reemplazar con llamadas a la API en producción)
export const usuariosMock = [
  { id: 1, nombre: 'Cliente Test', email: 'cliente@test.com', password: '123456', rol: 'CLIENTE' },
  { id: 2, nombre: 'Admin Test', email: 'admin@test.com', password: '123456', rol: 'ADMIN' },
];

// Datos mock de personalización por producto (MOCK - editable vía CRUD admin).
// Cada elemento pertenece a un productoId y a una de las 4 categorías.
// - extra / acompanar: cobra (precio requerido)
// - personalizar / condimento: no cobra (precio null)
// - acompanar: productoReferenciaId referencia a otro producto (excluye el propio)
export const personalizacionElementosMock = [
  // Hamburguesa Clásica id:1
  { id: 101, productoId: 1, tipo: 'extra', nombre: 'Bacon', precio: 2700, productoReferenciaId: null, activo: true },
  { id: 102, productoId: 1, tipo: 'extra', nombre: 'Queso Cheddar en fetas', precio: 2000, productoReferenciaId: null, activo: true },
  { id: 103, productoId: 1, tipo: 'extra', nombre: 'Tomate', precio: 2000, productoReferenciaId: null, activo: true },
  { id: 104, productoId: 1, tipo: 'personalizar', nombre: 'Pan XL', precio: null, productoReferenciaId: null, activo: true },
  { id: 105, productoId: 1, tipo: 'personalizar', nombre: 'Queso Cheddar en fetas', precio: null, productoReferenciaId: null, activo: true },
  { id: 106, productoId: 1, tipo: 'personalizar', nombre: 'Bacon', precio: null, productoReferenciaId: null, activo: true },
  { id: 107, productoId: 1, tipo: 'acompanar', nombre: 'Papas Cheddar', precio: 1200, productoReferenciaId: 9, activo: true },
  { id: 108, productoId: 1, tipo: 'acompanar', nombre: 'Coca-Cola 500ml', precio: 800, productoReferenciaId: 5, activo: true },
  { id: 109, productoId: 1, tipo: 'acompanar', nombre: 'Pileta de Cheddar', precio: 4000, productoReferenciaId: 9, activo: false },
  { id: 110, productoId: 1, tipo: 'condimento', nombre: 'Sobre de Ketchup', precio: null, productoReferenciaId: null, activo: true },
  { id: 111, productoId: 1, tipo: 'condimento', nombre: 'Sobre de Mayonesa', precio: null, productoReferenciaId: null, activo: true },
  // Hamburguesa Doble id:2
  { id: 201, productoId: 2, tipo: 'extra', nombre: 'Bacon', precio: 2700, productoReferenciaId: null, activo: true },
  { id: 202, productoId: 2, tipo: 'personalizar', nombre: 'Lechuga', precio: null, productoReferenciaId: null, activo: true },
  // Pizza Muzzarella id:3
  { id: 301, productoId: 3, tipo: 'extra', nombre: 'Muzzarella extra', precio: 1800, productoReferenciaId: null, activo: true },
  { id: 302, productoId: 3, tipo: 'extra', nombre: 'Jamón', precio: 2200, productoReferenciaId: null, activo: true },
  { id: 303, productoId: 3, tipo: 'personalizar', nombre: 'Albahaca', precio: null, productoReferenciaId: null, activo: true },
  { id: 304, productoId: 3, tipo: 'acompanar', nombre: 'Papas Fritas Grandes', precio: 900, productoReferenciaId: 8, activo: true },
  { id: 305, productoId: 3, tipo: 'condimento', nombre: 'Sobre de Orégano', precio: null, productoReferenciaId: null, activo: true },
  // Combo Doble id:7
  { id: 701, productoId: 7, tipo: 'acompanar', nombre: 'Papas Fritas Grandes', precio: 900, productoReferenciaId: 8, activo: true },
];

// Datos mock de direcciones de clientes (MOCK - reemplazar con llamadas a la API en producción).
// Sin latitud ni longitud: las direcciones del cliente son textuales, solo la sucursal usa
// coordenadas para la lógica de asignación.
export const direccionesMock = [
  {
    id: 1,
    clienteId: 'cliente@test.com',
    nombre: 'Casa',
    direccion: 'Av. Siempreviva 1234',
    ciudad: 'Capital Federal',
    codigoPostal: '1406',
    referencia: 'Casa verde',
    esPrincipal: true,
    estado: 'activo',
  },
  {
    id: 2,
    clienteId: 'cliente@test.com',
    nombre: 'Trabajo',
    direccion: 'Calle Falsa 456',
    ciudad: 'Capital Federal',
    codigoPostal: '1425',
    referencia: 'Oficina',
    esPrincipal: false,
    estado: 'activo',
  },
];

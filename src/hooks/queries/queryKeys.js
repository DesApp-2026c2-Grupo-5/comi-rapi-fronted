/**
 * Propósito: claves de TanStack Query de toda la aplicación.
 *
 * Convención:
 * - Las claves públicas empiezan con ['public', ...]: catálogo, parámetros,
 *   sucursales y reseñas públicas. No dependen de la sesión.
 * - Las claves privadas empiezan con ['private', ...]: pedidos, perfil y
 *   reseñas propias. El logout remueve sólo este árbol.
 *
 * Los constructores usan valores primitivos (no objetos con orden variable)
 * para que la clave sea estable entre renders y fácil de invalidar por prefijo.
 */

const claveProductos = ({ incluirPersonalizacion = false, incluirResenas = false } = {}) => {
  const incluses = [
    incluirPersonalizacion ? 'personalizacion' : null,
    incluirResenas ? 'resenas' : null,
  ]
    .filter(Boolean)
    .join('+');
  return incluses || 'base';
};

const clavePromociones = ({ incluirInactivas = false, incluirProductos = false } = {}) =>
  [
    incluirInactivas ? 'todas' : 'activas',
    incluirProductos ? 'con-productos' : 'sin-productos',
  ].join('/');

export const queryKeys = {
  public: {
    all: ['public'],
    parametros: ['public', 'parametros'],
    categorias: (incluirInactivas = false) => [
      'public',
      'categorias',
      incluirInactivas ? 'todas' : 'activas',
    ],
    categoria: (id) => ['public', 'categorias', 'detalle', String(id)],
    productos: (opciones = {}) => ['public', 'productos', 'lista', claveProductos(opciones)],
    producto: (id) => ['public', 'productos', 'detalle', String(id)],
    masVendidos: ['public', 'productos', 'mas-vendidos'],
    promociones: (opciones = {}) => ['public', 'promociones', 'lista', clavePromociones(opciones)],
    promocion: (id) => ['public', 'promociones', 'detalle', String(id)],
    productosDePromocion: (id) => ['public', 'promociones', 'detalle', String(id), 'productos'],
    personalizacion: (productoId = null) => [
      'public',
      'personalizacion',
      productoId === null || productoId === undefined ? 'todas' : String(productoId),
    ],
    resenasProducto: (productoId, pagina = 1, limite = 10) => [
      'public',
      'resenas',
      String(productoId),
      pagina,
      limite,
    ],
    sucursales: (incluirInactivas = false) => [
      'public',
      'sucursales',
      incluirInactivas ? 'todas' : 'activas',
    ],
    insumos: ({ activo, tipo } = {}) => [
      'public',
      'insumos',
      activo === false ? 'todos' : 'activos',
      tipo || 'todos',
    ],
    personalizacionElemento: (id) => ['public', 'personalizacion', 'elemento', String(id)],
    plantillas: ['public', 'personalizacion', 'plantillas'],
    plantilla: (id) => ['public', 'personalizacion', 'plantillas', String(id)],
    plantillasCategoria: (categoriaId = null) => [
      'public',
      'personalizacion',
      'plantillas',
      'categoria',
      String(categoriaId ?? 'todas'),
    ],
    bootstrap: ['public', 'bootstrap'],
  },
  private: {
    all: ['private'],
    pedidos: (filtros = {}) => ['private', 'pedidos', filtros],
    // Candidatas de reasignación de un pedido concreto. Dependen de la sesión
    // del superadmin y del estado de stock, por eso viven en el árbol privado.
    sucursalesCandidatas: (pedidoId) => [
      'private',
      'pedidos',
      String(pedidoId),
      'sucursales-candidatas',
    ],
    // Prefijo del stock de la sucursal operativa. El stock depende de la
    // sesión y de la sucursal, por eso vive en el árbol privado (el logout lo
    // limpia). Las lecturas concretas cuelgan de esta base e incluyen la
    // sucursal en la clave: al cambiar el contexto del superadmin no se
    // reutiliza el stock de la sucursal anterior.
    stock: ['private', 'stock'],
    stockLista: ({ sucursalId = null, productoId = null } = {}) => [
      'private',
      'stock',
      'lista',
      sucursalId === null || sucursalId === undefined || sucursalId === ''
        ? 'sin-sucursal'
        : String(sucursalId),
      productoId === null || productoId === undefined || productoId === ''
        ? 'todos'
        : String(productoId),
    ],
    reportes: ({ desde = '', hasta = '', sucursalId = '' } = {}) => [
      'private',
      'reportes',
      desde || 'sin-desde',
      hasta || 'sin-hasta',
      sucursalId ? String(sucursalId) : 'todas',
    ],
    resumenSuperadmin: ['private', 'superadmin', 'resumen'],
    clientes: ({ buscar = '', pagina = null, limite = null } = {}) => [
      'private',
      'clientes',
      buscar || 'sin-busqueda',
      pagina === null || pagina === undefined ? 'sin-pagina' : String(pagina),
      limite === null || limite === undefined ? 'sin-limite' : String(limite),
    ],
    resumenCliente: (id) => ['private', 'clientes', String(id), 'resumen'],
    direcciones: ['private', 'direcciones'],
    administradores: ({ buscar = '', pagina = null, limite = null } = {}) => [
      'private',
      'administradores',
      buscar || 'sin-busqueda',
      pagina === null || pagina === undefined ? 'sin-pagina' : String(pagina),
      limite === null || limite === undefined ? 'sin-limite' : String(limite),
    ],
    perfil: ['private', 'perfil'],
    misResenas: ['private', 'resenas', 'mias'],
    // Estado de la reseña del cliente para un producto puntual. Cuelga de
    // ['private','resenas'] para que el refresco tras crear/editar/borrar una
    // reseña invalide también esta lectura.
    resenaProducto: (productoId) => ['private', 'resenas', 'producto', String(productoId)],
    elegibles: (pedidoId = null) => [
      'private',
      'resenas',
      'elegibles',
      pedidoId === null || pedidoId === undefined ? 'todas' : String(pedidoId),
    ],
    // Quejas: bandeja paginada para ADMIN/SUPERADMIN y mis quejas para CLIENTE
    quejas: ({ estado = '', q = '', sucursalId = '', pagina = 1, limite = 20 } = {}) => [
      'private',
      'quejas',
      'bandeja',
      estado || 'sin-estado',
      q || 'sin-busqueda',
      sucursalId ? String(sucursalId) : 'todas',
      String(pagina),
      String(limite),
    ],
    misQuejas: (pedidoId = null) => [
      'private',
      'quejas',
      'mias',
      pedidoId ? String(pedidoId) : 'todas',
    ],
    queja: (id) => ['private', 'quejas', 'detalle', String(id)],
  },
};

comi-rapi-fronted/

├── public/

│   ├── index.html

│   └── favicon.ico

├── src/

│   ├── api/                          # Servicios para consumir el backend

│   │   ├── auth.js                   # Funciones para login/registro (cliente y admin)

│   │   ├── productos.js              # CRUD de productos (para admin)

│   │   ├── categorias.js             # Obtener categorías

│   │   ├── carrito.js                # Operaciones del carrito

│   │   ├── pedidos.js                # Crear y consultar pedidos

│   │   └── sucursales.js             # Obtener sucursales y asignación automática

│   │

│   ├── components/                   # Componentes reutilizables

│   │   ├── comunes/

│   │   │   ├── Navbar.jsx            # Barra de navegación (cambia según rol)

│   │   │   ├── Footer.jsx            # Pie de página

│   │   │   ├── Loader.jsx            # Spinner de carga

│   │   │   └── ProtectedRoute.jsx    # Rutas protegidas (requiere login)

│   │   ├── cliente/                  # Componentes específicos del cliente

│   │   │   ├── ProductoCard.jsx      # Tarjeta de producto en el catálogo

│   │   │   ├── ProductoDetalle.jsx   # Vista detallada de un producto

│   │   │   ├── ItemCarrito.jsx       # Ítem individual en el carrito

│   │   │   └── ResumenPedido.jsx     # Resumen antes de confirmar

│   │   └── admin/                    # Componentes específicos del administrador

│   │       ├── PanelAdmin.jsx        # Panel principal del admin

│   │       ├── ListaProductos.jsx    # Tabla/lista de productos para gestionar

│   │       ├── FormularioProducto.jsx # Formulario para crear/editar producto

│   │       └── PedidosPendientes.jsx # Lista de pedidos por sucursal

│   │

│   ├── context/                      # Contextos de React (estado global)

│   │   ├── AuthContext.jsx           # Contexto para autenticación (usuario, rol, token)

│   │   ├── CarritoContext.jsx        # Contexto para el carrito (ítems, total, operaciones)

│   │   └── SucursalContext.jsx       # Contexto para la sucursal asignada

│   │

│   ├── hooks/                        # Custom Hooks

│   │   ├── useAuth.js                # Hook para autenticación

│   │   ├── useCarrito.js             # Hook para manejar el carrito

│   │   └── useSucursal.js            # Hook para obtener la sucursal óptima

│   │

│   ├── pages/                        # Páginas principales

│   │   ├── cliente/                  # Páginas para el rol cliente

│   │   │   ├── Inicio.jsx            # Pantalla de inicio (página principal)

│   │   │   ├── Catalogo.jsx          # Catálogo de productos por categoría

│   │   │   ├── Carrito.jsx           # Pantalla del carrito de compras

│   │   │   ├── ConfirmacionPedido.jsx # Confirmación del pedido (después de pagar)

│   │   │   ├── MisPedidos.jsx        # Historial de pedidos del usuario

│   │   │   └── DetallePedido.jsx     # Detalle de un pedido específico

│   │   ├── admin/                    # Páginas para el rol administrador

│   │   │   ├── AdminLogin.jsx        # Login específico para administradores

│   │   │   ├── AdminRegister.jsx     # Registro de administradores

│   │   │   ├── Dashboard.jsx         # Panel de control del admin

│   │   │   ├── GestionProductos.jsx  # Página para gestionar productos (ABM)

│   │   │   ├── EditarProducto.jsx    # Página para editar un producto

│   │   │   └── GestionPedidos.jsx    # Página para gestionar pedidos

│   │   └── comunes/                  # Páginas compartidas

│   │       ├── Login.jsx             # Login para clientes

│   │       └── Registro.jsx          # Registro para clientes

│   │

│   ├── routes/                       # Configuración de rutas

│   │   ├── AppRoutes.jsx             # Definición de todas las rutas

│   │   └── index.js                  # Exportación de rutas

│   │

│   ├── services/                     # Servicios y lógica de negocio

│   │   ├── asignacionSucursal.js     # Lógica para asignar la sucursal con menos pedidos

│   │   ├── simuladorPago.js          # Simulación de pago (aprobación automática)

│   │   └── seedData.js               # Datos mock para desarrollo (si se necesitan)

│   │

│   ├── styles/                       # Estilos globales y temas

│   │   ├── global.css                # Estilos globales

│   │   └── variables.css             # Variables CSS (colores, fuentes, etc.)

│   │

│   ├── utils/                        # Utilidades y funciones auxiliares

│   │   ├── formatters.js             # Formateo de precios, fechas, etc.

│   │   ├── validators.js             # Validaciones de formularios

│   │   ├── constants.js              # Constantes (roles, estados de pedido, etc.)

│   │   └── helpers.js                # Funciones auxiliares generales

│   │

│   ├── App.jsx                       # Componente principal de la aplicación

│   ├── index.js                      # Punto de entrada de React

│   └── setupTests.js                 # Configuración de pruebas (si aplica)

│

├── .env                              # Variables de entorno

├── .gitignore                        # Archivos ignorados por Git

├── package.json                      # Dependencias y scripts

├── README.md                         # Documentación del proyecto

└── vite.config.js                    # Configuración de Vite (si usas Vite)

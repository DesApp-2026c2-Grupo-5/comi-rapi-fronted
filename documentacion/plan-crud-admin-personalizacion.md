# Plan — CRUD Admin para Personalización de Producto por Producto

> **Estado:** Aprobado — pendiente de implementación  
> **Fecha:** 2026-09-09  
> **Autor:** Muse Spark (análisis de `documentacion.txt` + `seedData.js` + `personalizacionConfig.js` + flujos admin)  
> **Base visual:** Estilos `src/styles/comirapi.css:16` + `ProductoCard.css:9` + `Navbar.css:1` + mockups `mockup/personalizar-producto.html:1` y `mockup/carrito-personalizado.html:1`  
> **Complementa:** `documentacion/plan-personalizacion-producto.md:1` (flujo cliente previo al carrito)

---

## 1. Objetivo

Agregar en **`/admin`** el CRUD completo (**Crear / Editar / Eliminar / Listar**) para los **elementos de personalización**, con 4 categorías fijas y **relación obligatoria a producto**:

| Tipo (`TIPO_PERSONALIZACION`) | Nombre UI | Cobra | Ejemplo | Fuente actual |
|---|---|---|---|---|
| `extra` | Extra — Agregar ingredientes | Sí, suma al total | Extra: Bacon (+$2.700) | `src/services/personalizacionConfig.js:10` |
| `personalizar` | Personalizar — Quitar ingredientes base | No, precio base no baja | Sin queso / Sin lechuga | `src/services/personalizacionConfig.js:15` |
| `acompanar` | Acompaña tu orden con — Upsell | Sí, suma (editable) | Pileta Cheddar (+$4.000) → **selector de otro producto** | `src/services/personalizacionConfig.js:16` |
| `condimento` | Condimentos adicionales — Sobres | No | Sobre de Ketchup | `src/services/personalizacionConfig.js:21` |

**Regla nueva confirmada por usuario:**
- Antes de agregar elementos a una categoría hay que elegir **de qué producto son** (`productoId` obligatorio). Las 4 categorías están **anidadas dentro del producto**, no globales por categoría.
- Para **`acompanar`** se puede elegir **cualquier otro producto del catálogo menos el que se está personalizando** (`productoReferenciaId !== productoId`). El precio del upsell se **precarga del producto referenciado** (`productosMock[].precio` en `src/services/seedData.js:9`) pero queda **editable** para que el admin pueda aplicar precio diferencial / promo.

Este plan resuelve el pendiente `documentacion/plan-personalizacion-producto.md:272` — *"Configuración admin de extras por producto (queda para V2)"*.

---

## 2. Investigación — Estado actual

### 2.1 Datos (`src/services/seedData.js:9` + `src/services/personalizacionConfig.js:8`)

- `productosMock[11]` `{id, nombre, precio, categoria, imagen, descripcion}` sin campo de personalización.
- `personalizacionPorCategoria` en `personalizacionConfig.js:8` — objeto estático por **categoría** (Hamburguesas, Pizzas, Combos, Papas, Bebidas, Postres) con `extra/ personalizar/ acompanar/ condimento` compartido entre todos los productos de la categoría. **Este mock será reemplazado por colección por `productoId`**.
- `LIMITES` en `personalizacionConfig.js:73` → `{extra:6, personalizar:7, acompanar:3, condimento:2}` — se respeta en el modal cliente, no en validación CRUD.
- `GRAMOS` y helpers `calcularPrecioPersonalizado` / `calcularPrecioUnitario` en `personalizacionConfig.js:79` ya contemplan `extras + acompanamientos`.

### 2.2 Patrón admin existente a clonar

- **Rutas** `src/routes/AppRoutes.jsx:80` — `ProtectedRoute requiredRole="ADMIN"` con `<Outlet/>`, dos rutas por recurso (`/nuevo` antes que `/editar/:id` mismo componente), `RootRedirect` y `PublicOnlyRoute`. `Navbar.jsx:39` con `enlacesAdmin` y `Fa*` de `react-icons/fa`.
- **Página lista** `src/pages/admin/GestionSucursales.jsx:1` (referencia completa con Context) + `src/pages/admin/GestionProductos.jsx:1` + `src/components/admin/ListaProductos.jsx:39` — `Container fluid py-4` + header `d-flex justify-content-between h2 + Button primary FaPlus` + `Alert success dismissible` + `Spinner variant="danger"` + `Table striped bordered hover responsive shadow-sm thead table-dark` + botones `secondary FaEdit / danger FaTrashAlt` con `window.confirm`.
- **Formulario** `src/components/admin/FormularioSucursal.jsx:1` (190 líneas gold) + `src/pages/admin/EditarSucursal.jsx:1` (93 líneas) — `Card shadow-sm maxWidth:500px` + `Form.Group mb-3` por campo + validación con `alert` + `Button primary FaSave flex-fill + secondary FaTimes flex-fill` + `Link text-danger ← Volver`. Precarga con `useEffect find by id`.
- **API mock** `src/api/sucursales.js:1` y `src/api/productos.js:1` — `import {...Mock} from seedData + delay`, `let copiaMutable=[...mock]`, `delay 200 get / 400 write`, `return {success:boolean, data|error}` con copia shallow, `id: Date.now()` (mejor `generateId()` de `src/utils/helpers.js:1`).
- **Estilos** `src/styles/comirapi.css:16` — paleta `#ff9f1c` primary / `#e88900` hover / `#b55d00` oscuro, `#fff4e2/#ffe9c9/#f1c27d` crema, `#22c55e` success, `#e63946` danger; `.btn border-radius:999px font-weight:600 hover translateY(-2px)`, cards `border:2px solid #ffe9c9 radius:18px shadow 0 8px 20px`, `body #fffaf0`.

### 2.3 Mockups existentes

- `mockup/personalizar-producto.html:1` (388 líneas) — 6 vistas con `data-vista` switch, `max-width:520px`, `card-comi`, `pill-control`, cálculo en vivo `formatPrice toLocale es-AR`.
- `mockup/carrito-personalizado.html:1` (306 líneas) — `max-width:1120px`, 2 líneas con `idLinea` + `merge por personalización`, `ResumenPedido` y `DetallePedido #1042` con `historial-box` stepper.

---

## 3. Diseño propuesto

### 3.1 Modelo de datos — nueva colección `personalizacionElementosMock`

**En `src/services/seedData.js` junto a `productosMock`:**

```js
export const TIPO_PERSONALIZACION = {
  EXTRA: 'extra',
  PERSONALIZAR: 'personalizar',
  ACOMPANAR: 'acompanar',
  CONDIMENTO: 'condimento',
};

export const personalizacionElementosMock = [
  // Hamburguesa Clásica id:1 — ejemplo completo
  { id: 101, productoId: 1, tipo: 'extra',        nombre: 'Bacon',                  precio: 2700, productoReferenciaId: null, activo: true },
  { id: 102, productoId: 1, tipo: 'extra',        nombre: 'Queso Cheddar en fetas', precio: 2000, productoReferenciaId: null, activo: true },
  { id: 103, productoId: 1, tipo: 'personalizar', nombre: 'Queso Cheddar en fetas', precio: null, productoReferenciaId: null, activo: true }, // → Sin queso
  { id: 104, productoId: 1, tipo: 'acompanar',    nombre: 'Papas Cheddar',          precio: 1200, productoReferenciaId: 9,    activo: true }, // upsell → producto id:9 Papas Cheddar $1200
  { id: 105, productoId: 1, tipo: 'acompanar',    nombre: 'Coca-Cola 500ml',        precio: 800,  productoReferenciaId: 5,    activo: true }, // upsell → producto id:5
  { id: 106, productoId: 1, tipo: 'condimento',   nombre: 'Sobre de Ketchup',       precio: null, productoReferenciaId: null, activo: true },

  // Pizza Muzzarella id:3 — elementos distintos aunque misma lógica de categorías
  { id: 301, productoId: 3, tipo: 'extra',        nombre: 'Muzzarella extra',       precio: 1800, productoReferenciaId: null, activo: true },
  { id: 302, productoId: 3, tipo: 'personalizar', nombre: 'Albahaca',               precio: null, productoReferenciaId: null, activo: true },
  { id: 303, productoId: 3, tipo: 'acompanar',    nombre: 'Papas Fritas Grandes',   precio: 900,  productoReferenciaId: 8,    activo: true },

  // Hamburguesa Doble id:2, Limonada id:6, etc. pueden empezar vacíos → admin los puebla
];
```

**Campos:**

| Campo | Tipo | Regla |
|---|---|---|
| `id` | number | `generateId()` (`src/utils/helpers.js:1`) o `Date.now()` |
| `productoId` | number | FK a `productosMock[].id` — **obligatorio**, elegido antes de cualquier alta |
| `tipo` | `'extra'|'personalizar'|'acompanar'|'condimento'` | enum `TIPO_PERSONALIZACION` en `src/utils/constants.js:1` |
| `nombre` | string | libre para `extra/personalizar/condimento`; para `acompanar` denormalizado del producto referenciado |
| `precio` | number\|null | requerido `>0` si `extra` o `acompanar` (editable, precargado); `null` si `personalizar`/`condimento` |
| `productoReferenciaId` | number\|null | solo si `tipo==='acompanar'`, FK a `productosMock` con `!== productoId` |
| `activo` | boolean | default `true`, para ocultar sin borrar |

`personalizacionPorCategoria` en `personalizacionConfig.js:8` queda como compat/read-only hasta migrar el modal cliente a leer de la nueva colección. Nuevo helper:

```js
export function getElementosPorProducto(productoId) { return elementos.filter(e=> e.productoId===productoId && e.activo); }
export function getElementosPorProductoYTipo(productoId, tipo) { return getElementosPorProducto(productoId).filter(e=> e.tipo===tipo); }
```

En `src/utils/constants.js:1` agregar `TIPO_PERSONALIZACION`, `ETIQUETA_TIPO` y `VARIANTE_TIPO` para Badges, y en `src/utils/validators.js:1` `validatePersonalizacionElemento`.

### 3.2 Rutas y Navbar

**`src/routes/AppRoutes.jsx:80` — dentro del bloque `ProtectedRoute requiredRole="ADMIN"`:**

```jsx
<Route path="/admin/personalizacion" element={<GestionPersonalizacion />} />
<Route path="/admin/personalizacion/nuevo" element={<EditarPersonalizacion />} />
<Route path="/admin/personalizacion/editar/:id" element={<EditarPersonalizacion />} />
// Query opcional para preselección: ?productoId=1&tipo=extra
```

**`src/components/comunes/Navbar.jsx:39` — `enlacesAdmin`:**

```js
import { FaSlidersH } from 'react-icons/fa';
{ to: '/admin/personalizacion', etiqueta: 'Personalización', icono: FaSlidersH },
```

Mismo `NavLink className={({isActive})=> isActive?'nav-enlace activo':'nav-enlace'}` y `nav-enlace-ico` con hover `rotate 10deg` (`Navbar.css:1`).

**Atajo desde productos:** en `src/components/admin/ListaProductos.jsx:39` agregar columna `Personalización` con `Button variant="secondary" size="sm" FaSlidersH Gestionar → navigate('/admin/personalizacion?productoId='+p.id)`.

### 3.3 Flujo UX admin

```
[Navbar Admin → Personalización]
  → GestionPersonalizacion (GestionSucursales.jsx:1)
      ┌─ Selector Producto* (Form.Select con 11 productos + buscador, obligatorio)
      │   └─ si null → card vacía crema "Seleccioná un producto para gestionar su personalización" + Alert info
      │   └─ si seleccionado → header con nombre + Badge categoria + total por tipo
      ├─ Tabs filtro-pill (Catalogo.css) Todos | Extra | Personalizar | Acompaña | Condimentos
      ├─ Tabla filtrada por productoId + tipo (Table table-dark)
      │   └─ Fila extra: Nombre (+$precio) | Fila personalizar: Sin X | Fila acompañar: → Producto (+$precio editable) + badge categoría | Fila condimento: Sobre X
      │   └─ Acciones: Editar (secondary) / Eliminar (danger con confirm "¿Eliminar Bacon de Hamburguesa Clásica?")
      └─ CTA Agregar elemento (primary naranja, disabled hasta elegir producto) → /admin/personalizacion/nuevo?productoId=1&tipo=extra

[EditarPersonalizacion] (/nuevo o /editar/:id) — EditarSucursal.jsx:1
  ← Volver a /admin/personalizacion?productoId=1
  Card 520px:
    Producto* (Select deshabilitado si editando, o preseleccionado por query)
    Tipo* (Select 4)
    si tipo !== acompañar:
      Nombre* (Text, placeholder según tipo)
      Precio $* (Number min0 step100, visible solo si extra, hidden si personalizar/condimento, validación >0)
    si tipo === acompañar:
      Producto a ofrecer* (Select filtrado: productos.filter(p=>p.id!==productoId), label "Papas Cheddar — Papas — $1.200")
      Precio $* (Number editable, precargado de producto elegido, helpText "Se precarga del producto, podés aplicar precio diferencial")
    Activo (Form.Check switch)
    [Guardar primary FaSave flex-fill] [Cancelar secondary FaTimes flex-fill → navigate back]
```

### 3.4 Componentes / Archivos

| Nuevo archivo | Clona | Propósito |
|---|---|---|
| `src/api/personalizacion.js` | `src/api/sucursales.js:1` | `obtenerElementos`, `obtenerPorProducto(productoId)`, `obtenerPorId(id)`, `crearElemento(datos)`, `actualizarElemento(id, datos)`, `eliminarElemento(id)` con `delay 200/400`, `{success,data|error}`, valida `productoReferenciaId !== productoId` y unicidad `productoId+tipo+nombre` o `+productoReferenciaId` |
| `src/context/PersonalizacionContext.jsx` | `src/context/SucursalContext.jsx:1` | `elementos`, `loading`, `obtenerElementos`, `agregarElemento`, `actualizarElemento`, `eliminarElemento`, `getPorProducto(id)` y `getPorProductoYTipo(id,tipo)` con `useCallback + useMemo + useEffect` carga inicial |
| `src/hooks/usePersonalizacion.js` | `src/hooks/useSucursal.js:1` | `useContext(PersonalizaContext)` |
| `src/pages/admin/GestionPersonalizacion.jsx` | `src/pages/admin/GestionSucursales.jsx:1` | `Container fluid py-4`, header `h2 Gestión de Personalización + Button primary FaPlus Agregar`, `Alert success dismissible`, `Spinner danger`, `Form.Select producto + filtro-pill tipo`, `Table table-dark` cols `ID | Nombre/Producto | Tipo Badge | Precio (formatPrice) | Estado | Acciones`, `window.confirm` + `useSearchParams` para `?productoId` |
| `src/pages/admin/EditarPersonalizacion.jsx` | `src/pages/admin/EditarSucursal.jsx:1` | `useParams id + useSearchParams`, guards `cargando/!encontrado`, `Link ← Volver`, `h2 Nuevo/Editar #id`, `handleGuardar` valida `productoId` primero, `navigate('/admin/personalizacion?productoId=..')` |
| `src/components/admin/FormularioPersonalizacion.jsx` | `src/components/admin/FormularioSucursal.jsx:1` | `Card shadow-sm maxWidth:520px` + `Form.Select producto*` al tope, `Form.Select tipo*`, `Form.Control nombre*` / `Form.Select productoReferencia*` condicional, `InputGroup $ precio*` con precarga editable para acompañar, `Form.Check activo`, validación + `btn primary Guardar + secondary Cancelar` |
| `src/utils/validators.js:1` | `validateProducto` | `validatePersonalizacionElemento({productoId,tipo,nombre,precio,productoReferenciaId, productos})` — productoId existe, tipo en enum, nombre 2-60 (o productoReferenciaId válido), precio>0 si extra/acompanar, acompañar !== productoId, no duplicado |

Modificados:

| Archivo | Cambio | Línea |
|---|---|---|
| `src/utils/constants.js:1` | `TIPO_PERSONALIZACION`, `ETIQUETA_TIPO`, `VARIANTE_TIPO` | — |
| `src/services/seedData.js:9` | `personalizacionElementosMock` semilla por producto | `seedData.js:9` |
| `src/App.jsx` | Registrar `PersonalizacionProvider` en anidado de contextos | `App.jsx` |

### 3.5 Validaciones

- `validatePersonalizacionElemento` — `productoId` requerido y existe en `productosMock`, `tipo` en enum, `nombre` 2-60 caracteres (trim) para no-acompañar, `productoReferenciaId` requerido si acompañar y existe y `!== productoId`, `precio` requerido `>=100` si `extra`/`acompanar` (permite promo 0 solo si se decide), `activo` boolean.
- Duplicado: `elementos.some(e=> e.productoId===datos.productoId && e.tipo===datos.tipo && (tipo==='acompanar' ? e.productoReferenciaId===datos.productoReferenciaId : e.nombre.toLowerCase()===datos.nombre.toLowerCase()))` → `alert('Ya existe ... en este producto')`.
- Precio acompañar: en `FormularioPersonalizacion` el `onChange` de `productoReferencia` hace `setPrecio(productos.find(p=>p.id===value).precio)` pero deja el input editable.

### 3.6 Estilos Comi-Rapi — respetar `src/styles/comirapi.css:16`

- **Tabla:** `Table striped bordered hover responsive shadow-sm` + `thead table-dark` como `ListaProductos.jsx:39`. Celdas con `formatPrice` (`src/utils/formatters.js:1`) rojo `#e63946` para precios con costo.
- **Botones:** `Agregar elemento` → `variant="primary"` (`#ff9f1c pill shadow`), `Editar` → `secondary` (`#fff4e2 #b55d00`), `Eliminar` → `danger` (`#e63946`), `Guardar` → `primary`, `Cancelar` → `secondary`. Iconos `FaPlus/FaEdit/FaTrashAlt/FaSave/FaTimes` con `me-1`.
- **Badges tipo:** `extra` `bg-warning text-dark` (`+$`), `acompanar` `bg-success` (`→`), `personalizar` `bg-secondary` (`Sin`), `condimento` `bg-light text-dark border` (`Sobre`). `Badge activo/inactivo` `bg-success/bg-secondary`.
- **Card formulario:** `border:2px solid #ffe9c9 radius:18px bg:#fff shadow 0 8px 20px` + `maxWidth:520px`. `Form.Control border 2px #f1c27d radius:12px focus #ff9f1c`.
- **Filtros:** `filtro-pill` de `Catalogo.css:1` activo naranja, inactivo blanco borde crema. `Select producto` con `Form.Select`.
- **Vacíos:** `border:2px dashed #f1c27d radius:12px bg:var(--crema-card) #fff8ef` + `FaInbox`.

---

## 4. Mockup

**Archivo:** `mockup/admin-personalizacion.html` — HTML auto-contenido, abrir con doble click, sin backend.

**Estructura (clona `mockup/personalizar-producto.html:1`):**
- **Head:** `bootstrap@5.3.3 + font-awesome 6.5.0 CDN` + `<style>:root --naranja #ff9f1c --crema #fff4e2 --borde-card #ffe9c9 --verde #22c55e --rojo #e63946 --gris-pill #f1f1f5` (tokens `comirapi.css:16`) + `.btn pill 999px`, `.card-comi`, `.filtro-pill`, `.pill-control`, `.mockup-nav sticky`, `.vista display:none/.activa`.
- **Header mockup:** banda crema `border-bottom 2px #ffe9c9` con `fa-burger #ff9f1c Comi-Rapi + badge MOCKUP — CRUD Admin por Producto` + small *"Gestioná Extra / Personalizar / Acompaña (selector de productos) / Condimentos por producto — editable"* + link `GestionProductos`.
- **Container `max-width:1120px`** con 3 vistas `data-vista` (`lista` default, `nuevo`, `editar`):
  1. **Vista Lista:** `alert crema` explicativo + `h2 Gestión de Personalización` + `Row: Col md=5 Form.Select Producto*` (11 productos de `seedData.js:9`, `— Elegí un producto —`) + `Col md=7 small help`. Si `null` → card vacía. Si `Hamburguesa Clásica id:1` → `Badge Hamburguesas` + `pills Todos/Extra/Personalizar/Acompaña/Condimentos` + `Table table-dark responsive` con filas `101 Bacon extra $2.700 | 103 Sin queso personalizar — | 104 → Papas Cheddar acompañar $1.200 editable | 106 Sobre Ketchup condimento —` + `Editar/Eliminar` + `Agregar elemento`. Estado vacío ejemplo `Limonada Natural id:6` → `No hay elementos para este producto. Agregá el primero.`
  2. **Vista Nuevo:** `← Volver` + `Card 520px` con `Producto*` preseleccionado, `Tipo*`, `Nombre*` / `Producto a ofrecer*` (filtrado 10 opciones sin el actual) + `Precio $*` precargado editable + `Activo` + `Guardar/Cancelar`.
  3. **Vista Editar:** id `104` `→ Papas Cheddar` precargado, `Producto` disabled, precio editable `1.200 → 1.500` demo, `Guardar`.
- **JS:** `productos=[...seedData]`, `elementosMock=[...por producto]`, `state{productoId, filtroTipo}`, `formatPrice es-AR`, `renderTabla()` filtra `productoId` + `filtroTipo`, `togglePrecioPorTipo()`, `onProductoReferenciaChange => precio.value = producto.precio` (editable), `confirm("¿Eliminar Bacon de Hamburguesa Clásica?")` + `alert`, `Alert success` simulado.

---

## 5. Plan de implementación (secuencial, sin breaking changes)

### Fase 1 — Datos y capa mock (1 día)

- [ ] `src/utils/constants.js` — agregar `TIPO_PERSONALIZACION`, `ETIQUETA_TIPO`, `VARIANTE_TIPO`
- [ ] `src/services/seedData.js` — agregar `personalizacionElementosMock` migrando `personalizacionConfig.js:8` por producto
- [ ] `src/api/personalizacion.js` — CRUD mock con `delay`
- [ ] `src/context/PersonalizacionContext.jsx` + `src/hooks/usePersonalizacion.js` — provider
- [ ] `src/utils/validators.js` — `validatePersonalizacionElemento`
- [ ] Registrar Provider en `src/App.jsx`

### Fase 2 — UI Admin CRUD (1-2 días)

- [ ] `src/components/admin/FormularioPersonalizacion.jsx`
- [ ] `src/pages/admin/GestionPersonalizacion.jsx` — selector producto + tabs + tabla
- [ ] `src/pages/admin/EditarPersonalizacion.jsx`
- [ ] `src/routes/AppRoutes.jsx:80` — 3 rutas
- [ ] `src/components/comunes/Navbar.jsx:39` — enlace `Personalización FaSlidersH`
- [ ] `src/components/admin/ListaProductos.jsx:39` — atajo `Gestionar` (opcional)

### Fase 3 — Integración cliente (siguiente sprint, fuera de este CRUD pero deja rastro)

- Adaptador `personalizacionConfig.js:75` `getConfigParaCategoria` → `getElementosPorProducto` leyendo de Context; `ProductoPersonalizarModal.jsx` consume `usePersonalizacion()` y para `acompanar` renderiza nombre/precio del producto referenciado (no texto libre).

### Fase 4 — Polish y QA

- [ ] Responsive `<768px`, `aria-label` en controles, `Spinner` + `Alert dismissible`
- [ ] Validar `productoReferenciaId !== productoId` y precio precargado editable
- [ ] Probar con `admin@test.com / 123456` flujos: crear extra para `Hamburguesa Doble id:2`, crear acompañar `Pizza Muzzarella → Hamburguesa Clásica`, eliminar, editar precio acompañar
- [ ] `npm run lint` — corregir `prop-types` / imports no usados

---

## 6. Impacto y riesgos

| Área | Riesgo | Mitigación |
|---|---|---|
| Producto eliminado | `acompanar` queda huérfano `productoReferenciaId` | Render `⚠️ Producto eliminado` + `Badge danger`, no rompe tabla |
| Precio acompañar desactualizado | Producto cambia precio, upsell queda viejo | Precio editable denormalizado es intencional (promo); documentar que no es reactivo, admin lo actualiza |
| Duplicado | Dos extras "Bacon" en mismo producto | Validación `productoId+tipo+nombre` |
| Acompañar a sí mismo | Admin intenta ofrecer el mismo producto | Validación + `Select` filtrado `p.id !== productoId` + `disabled` |
| Migración desde por categoría | Modal cliente aún lee `personalizacionPorCategoria` | Mantener ambos hasta Fase 3, con fallback `getConfigParaCategoria` |
| Performance | 11 productos × 4 tipos × N elementos | `useMemo` en `getPorProducto`, tabla paginada si >20 |

---

## 7. Criterios de aceptación

- [ ] Entrar a `/admin/personalizacion` sin producto seleccionado muestra card vacía crema, `Agregar` disabled
- [ ] Seleccionar `Hamburguesa Clásica id:1` muestra tabla filtrada por `productoId=1` con 4 tipos, `formatPrice` para los que cobran
- [ ] Cambiar a `Pizza Muzzarella id:3` recarga tabla con sus elementos (distintos)
- [ ] `Agregar elemento` requiere `Producto*` y `Tipo*`; si `acompanar`, `Producto a ofrecer*` lista 10 productos (sin el actual) y `Precio $*` se precarga del producto elegido y queda editable
- [ ] Guardar `extra` con precio vacío → `alert` validación; duplicado → `alert Ya existe`
- [ ] Intentar acompañar a sí mismo → no aparece en select y validación lo bloquea
- [ ] `Editar` precarga por `id`, `Producto` queda disabled, permite cambiar nombre/precio (para acompañar, cambiar producto referenciado)
- [ ] `Eliminar` pide `window.confirm("¿Eliminar Bacon de Hamburguesa Clásica?")` y actualiza lista + `Alert success`
- [ ] `Navbar` admin muestra `Personalización` con `FaSlidersH` activo en `/admin/personalizacion`
- [ ] Estilos 100% Comi-Rapi (`comirapi.css:16` pill, crema, naranja, sin fucsia), `table-dark` + `shadow-sm`
- [ ] Mockup `mockup/admin-personalizacion.html` abre con doble click, navega Lista/Nuevo/Editar, filtra por producto, demuestra acompañar filtrado y precio editable

---

## 8. Fuera de alcance V1

- Persistencia backend real (sigue mock en memoria, recarga restaura `seedData.js`).
- Reutilización de un mismo elemento en múltiples productos (V1 es 1 elemento = 1 producto; duplicar es crear de nuevo).
- Stocks / disponibilidad de extras.
- Precio reactivo de acompañar (si cambia `productosMock[].precio` no se propaga automático).

---

## 9. Referencias

- `src/services/seedData.js:9` productosMock (11) y `src/services/personalizacionConfig.js:8` por categoría (origen a migrar)
- `src/routes/AppRoutes.jsx:80` rutas admin
- `src/pages/admin/GestionSucursales.jsx:1` patrón lista + `src/pages/admin/EditarSucursal.jsx:1` patrón edición
- `src/components/admin/FormularioSucursal.jsx:1` patrón formulario
- `src/api/sucursales.js:1` patrón mock
- `src/context/SucursalContext.jsx:1` patrón context
- `src/styles/comirapi.css:16` tokens
- `mockup/personalizar-producto.html:1` y `mockup/carrito-personalizado.html:1` estructura mockup

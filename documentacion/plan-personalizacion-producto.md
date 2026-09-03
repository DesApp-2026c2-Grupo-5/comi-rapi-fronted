# Plan — Personalización de Producto (Extras / Personalizar / Acompañamientos / Condimentos)

> **Estado:** Planificación — no implementado  
> **Fecha:** 2026-09-02  
> **Autor:** Muse Spark (análisis de `documentacion.txt` + seedData + contextos)  
> **Referencia visual:** 5 pantallas PedidosYa (Grand Doble McBacon) — reinterpretadas con identidad Comi-Rapi

---

## 1. Objetivo

Agregar un **flujo previo al carrito** para personalizar cada producto, inspirado en PedidosYa pero con los estilos de Comi-Rapi:

| Grupo PedidosYa | Comportamiento Comi-Rapi | Con costo | Ejemplo |
|---|---|---|---|
| **Extra** | Agregar ingredientes extra | Sí, suma al total | Extra: Bacon (+$2.700) |
| **Personalizar** | Quitar ingredientes del producto base | No, precio base no baja | Sin queso / Sin lechuga |
| **Acompaña tu orden con** | Upsell de otros productos | Sí | Pileta Cheddar (+$4.000) |
| **Condimentos adicionales** | Sobres/salsas | No | Sobre de Ketchup |

Reglas de negocio:
- Todo se elige **antes** de `Agregar a mi pedido`.
- Cada extra/acompañamiento con costo **recalcula el total dinámicamente**.
- Quitar ingredientes **no descuenta** (precio publicado se mantiene).
- En `Carrito / DetallePedido / MisPedidos / ConfirmacionPedido` debe verse el desglose: `Extra: Cheddar (+$2.000) x1`, `Sin queso`, etc.
- No usar paleta fucsia de PedidosYa (`#E4002B`); usar paleta Comi-Rapi.

---

## 2. Investigación — Estado actual

### 2.1 Datos mock (`src/services/seedData.js:8`)
- 11 productos `{id, nombre, precio, categoria, imagen, descripcion}` sin campo de personalización.
- 5 categorías: Hamburguesas, Combos, Papas, Bebidas, Postres.
- Pedidos guardan `productos: [{nombre, cantidad, precio}]` plano (`src/services/seedData.js:152`).

### 2.2 Carrito (`src/context/CarritoContext.jsx:18`)
- `items: [{producto, cantidad}]`. Merge por `producto.id` (`CarritoContext.jsx:28`).
- `total = Σ precio*cantidad` (`CarritoContext.jsx:82`) — sin extras.
- `agregarAlCarrito(producto, cantidad=1)` hace `alert` directo.

### 2.3 ProductoCard (`src/components/cliente/ProductoCard.jsx:18`)
- Botón `Añadir` llama directo a `agregarAlCarrito` sin intermediación.

### 2.4 Flujo de pedido (`src/pages/cliente/Carrito.jsx:70`, `src/context/PedidoContext.jsx:46`)
- `Carrito.handleConfirmarPedido` mapea `items → productos` con solo nombre/cantidad/precio base.
- `PedidoContext.crearPedido` guarda `total` plano y `historialEstados`.

### 2.5 Visualización (`src/components/cliente/ItemCarrito.jsx:19`, `ResumenPedido.jsx:24`, `DetallePedido.jsx:96`, `MisPedidos.jsx:64`, `ConfirmacionPedido.jsx:105`)
- Muestran tabla/cards sin desglose de personalización.

### 2.6 Estilos Comi-Rapi (`src/styles/comirapi.css:16`, `ProductoCard.css:9`)
- Paleta: naranja `#ff9f1c` (primary), `#f07f10`, `#ffb347`, acento `#b55d00`, verde `#22c55e` (success), rojo `#e63946` (danger), crema `#fff4e2`.
- Botones pill `border-radius: 999px`, cards `border: 2px solid #ffe9c9`, `radius: 18px`, `shadow 0 8px 20px rgba(0,0,0,.08)`.

---

## 3. Diseño propuesto

### 3.1 Modelo de datos

#### Nuevo archivo: `src/services/personalizacionConfig.js`

```js
export const GRUPOS = {
  EXTRA: 'extra',
  PERSONALIZAR: 'personalizar',
  ACOMPANAR: 'acompanar',
  CONDIMENTO: 'condimento'
};

// Config por categoría (V1) — escalable a por producto
export const personalizacionPorCategoria = {
  Hamburguesas: {
    extra: [
      { id: 'ex_tomate', nombre: 'Tomate', precio: 2000 },
      { id: 'ex_bacon', nombre: 'Bacon', precio: 2700 },
      { id: 'ex_cheddar', nombre: 'Queso Cheddar en fetas', precio: 2000 },
    ],
    personalizar: ['Pan XL','Mostaza','Ketchup','Cebolla','Bacon','Queso Cheddar en fetas','Carne'],
    acompanar: [
      { id: 'ac_cheddar', nombre: 'Pileta de Cheddar', precio: 4000 },
      { id: 'ac_burger', nombre: 'Hamburguesa Con Queso', precio: 7100 },
      { id: 'ac_papas', nombre: 'Papas Fritas Grandes', precio: 5300 },
    ],
    condimento: ['Sobre de Ketchup','Sobre de Mayonesa'],
  },
  Bebidas: {
    extra: [],
    personalizar: ['Hielo','Azúcar','Limón'],
    acompanar: [],
    condimento: [],
  },
  // ... resto categorías con defaults
};

export const LIMITES = { extra: 6, personalizar: 7, acompanar: 3, condimento: 2 };
export function calcularPrecioPersonalizado(precioBase, extras, acompanamientos, cantidad=1) {
  const extraTotal = extras.reduce((s,e)=> s + e.precio * e.cantidad, 0);
  const acompTotal = acompanamientos.reduce((s,e)=> s + e.precio * e.cantidad, 0);
  return (precioBase + extraTotal + acompTotal) * cantidad;
}
```

Alternativa futura: `personalizacionPorProductoId` para granularidad por producto.

#### Carrito — nuevo shape

```js
// antes: { producto, cantidad }
// después:
{
  idLinea: 'uuid', // generateId() — permite 2 líneas del mismo producto con distinta personalización
  producto,        // {id, nombre, precio, imagen, ...}
  cantidad,        // unidades del producto (selector Unidades)
  personalizacion: {
    extras: [{ id, nombre, precio, cantidad }],
    sin: ['Queso Cheddar en fetas', ...], // personalizar
    acompanamientos: [{ id, nombre, precio, cantidad }],
    condimentos: [{ nombre, cantidad }]
  },
  precioUnitarioPersonalizado // calculado
}
```

`total` del contexto pasa a: `Σ precioUnitarioPersonalizado * cantidad` (o `precioUnitarioPersonalizado` ya incluye cantidad según decisión — se documentará).

Regla de merge: dos agregados son la **misma línea solo si** `producto.id` + `personalizacion` deep-equal. Si cambia un extra → nueva línea.

#### Pedido — persistencia

```js
productos: [{
  nombre, cantidad, precioBase, precioUnitarioFinal,
  extras, sin, acompanamientos, condimentos
}]
total // ya incluye extras
```

### 3.2 Flujo UX (mapeo a Imgs PedidosYa)

```
[Catálogo] --click Añadir--> [Modal Personalizar]
                                ├─ Header: imagen, nombre, descripción, precioTotalDinámico (formatPrice)
                                ├─ Sección Extra (badge: 0 sel / +$)
                                │   └─ Vista Extra: lista - 0 + con precio (+$2.000)
                                ├─ Sección Personalizar
                                │   └─ Vista Sin: lista - 0 + (max 1, toggle)
                                ├─ Sección Acompaña
                                │   └─ Vista Acompañar: lista - 0 + con precio
                                ├─ Sección Condimentos
                                │   └─ Vista Condimento: lista - 0 + sin precio
                                ├─ Unidades: - 1 +
                                └─ CTA: Agregar a mi pedido $18.100
                                          ↓
[Carrito] ItemCarrito muestra desglose indentado + ResumenPedido con total correcto
   ↓ confirmar
[Pedido] DetallePedido / MisPedidos / ConfirmacionPedido muestran mismo desglose
```

Detalles por vista:

**Vista principal (Img 1):**
- Imagen centrada, título `Grand Doble McBacon`, precio a la derecha `$18.100`, subtítulo descripción (como Img 1).
- 4 filas con label + botón `Seleccionar` (pill crema `btn-secondary`, como `comirapi.css:106`) + badge de estado cuando hay selección: `2 seleccionados (+$4.700)` en verde.
- Footer: `Unidades - 1 +` (control pill gris claro `bg:#f1f1f5`) + CTA ancho completo `Agregar a mi pedido $18.100`.

**Vistas de grupo (Imgs 2-5):**
- Header con `< Volver` + título grupo.
- Subtítulo `Elige entre 0 y 6` (límite por grupo).
- Card lista con filas `Nombre (+ $)` + control `- 0 +`. Condimentos sin precio.
- Botón `Aceptar` pill naranja/volver a principal.

### 3.3 Componentes

| Nuevo archivo | Propósito |
|---|---|
| `src/components/cliente/ProductoPersonalizarModal.jsx` | Modal (react-bootstrap `Modal` fullscreen en <768px) orquestador. Estado local de selección + cálculo total. |
| `src/components/cliente/ProductoPersonalizarModal.css` | Estilos Comi-Rapi para modal, filas, badges, controles cantidad |
| `src/components/cliente/GrupoOpciones.jsx` | Lista reutilizable para cada grupo (renderiza filas con - 0 + y precio condicional) |
| `src/services/personalizacionConfig.js` | Config mock + helper `calcularPrecioPersonalizado` |
| `src/utils/personalizacionHelpers.js` | (opcional) `formatearDesgloseParaCarrito()`, `compararPersonalizacion()` |

Modificados:

| Archivo | Cambio | Línea actual |
|---|---|---|
| `ProductoCard.jsx:18` | En vez de `agregarAlCarrito` directo, abre modal. Prop nuevo `onPersonalizar` o maneja estado interno | `ProductoCard.jsx:21` |
| `CarritoContext.jsx:26` | `agregarAlCarrito(producto, cantidad, personalizacion)` + `actualizarPersonalizacion` + nuevo `total` | `CarritoContext.jsx:26-40` |
| `Carrito.jsx:70` | Mapear `items` con personalización a `crearPedido` | `Carrito.jsx:70-78` |
| `ItemCarrito.jsx:19` | Render de desglose bajo nombre (extras/sin/acompanamientos/condimentos) | `ItemCarrito.jsx:48` |
| `ResumenPedido.jsx:24` | Ya acepta props, asegurar que `montoTotal` viene calculado desde contexto | `ResumenPedido.jsx:28` |
| `DetallePedido.jsx:96` | Tabla: bajo producto mostrar líneas small con desglose | `DetallePedido.jsx:96-103` |
| `MisPedidos.jsx:64` | Card: `p.productos.map` con desglose | `MisPedidos.jsx:64` |
| `ConfirmacionPedido.jsx:105` | `ResumenPedido` ya recibe desglose, asegurar render | `ConfirmacionPedido.jsx:105` |

### 3.4 Estilos Comi-Rapi (no copiar PedidosYa)

- **Modal:** `background:#fff`, `border:2px solid #ffe9c9`, `border-radius:18px`, `box-shadow:0 8px 20px rgba(0,0,0,.08)` (igual que `ProductoCard.css:9`).
- **Botón Seleccionar:** `btn-secondary` → crema `#fff4e2` con borde `#f1c27d` y texto `#b55d00` (`comirapi.css:106`).
- **CTA Agregar:** `btn-primary` naranja `#ff9f1c` o `btn-success` verde; pill `999px`, `box-shadow` naranja.
- **Controles - 0 +:** pill `background:#f1f1f5`, botones circulares `width:28px height:28px`, `border-radius:50%`, icono `+`/`−`.
- **Precio total dinámico:** `color:#e63946` `font-size:1.2rem` `font-weight:800` (como `.producto-precio`).
- **Badges de selección:** `bg-success` verde o `bg-warning` crema con texto naranja oscuro.
- **Filas de grupo:** `border-bottom:1px solid #f0e0c0`, último sin borde.

---

## 4. Cálculo de precios

```
// Ejemplo Hamburguesa Clásica $1.500 + Bacon $2.700 + Cheddar $2.000, cantidad 2
precioUnitario = 1500 + 2700 + 2000 = 6200
totalLinea     = 6200 * 2 = 12400
// Sin ingredientes no resta
// Condimentos no suman
// Acompañamientos suman igual que extras
```

En el modal el precio del CTA se actualiza en cada `+`/`-` (optimistic, sin delay).

---

## 5. Impacto y riesgos

| Área | Riesgo | Mitigación |
|---|---|---|
| Carrito merge | Dos líneas iguales se duplican mal | Comparación deep de `personalizacion` + `idLinea` único |
| Total | Doble cómputo si `precioUnitarioPersonalizado` ya incluye cantidad | Definir helper único y tests |
| Pedidos históricos | Pedidos viejos sin campo personalización rompen render | Render condicional `prod.extras?.length` |
| Admin | No hay UI para configurar extras | V1 solo mock; documentar como pendiente |
| Accesibilidad | Controles -/+ sin label | `aria-label="Agregar Bacon"` |
| Mobile | Modal muy largo | Scroll interno + sticky footer con CTA |

---

## 6. Plan de implementación (sin tocar código aún)

### Fase 1 — Datos y lógica
- Crear `personalizacionConfig.js` + helpers
- Extender `CarritoContext` (nuevo shape + total)
- Tests unitarios `calcularPrecioPersonalizado`

### Fase 2 — UI Modal
- `ProductoPersonalizarModal` + `GrupoOpciones`
- Integrar en `ProductoCard` (abrir modal)
- Controles cantidad + navegación entre grupos (vista principal ↔ vista grupo)

### Fase 3 — Integración carrito/pedido
- Actualizar `ItemCarrito`, `ResumenPedido`, `DetallePedido`, `MisPedidos`, `ConfirmacionPedido`
- Adaptar `Carrito.handleConfirmarPedido` para persistir personalización

### Fase 4 — Polish
- Animaciones, a11y, responsive, validación de límites (0..N)
- ESLint y pruebas manuales con usuarios `cliente@test.com / 123456`

---

## 7. Mockup

Ver `mockup/personalizar-producto.html` — HTML interactivo auto-contenido:
- 6 vistas (Principal + 4 grupos + Carrito/Detalle)
- Navegación por tabs sin backend
- Cálculo en vivo del total
- Estilos Comi-Rapi (Bootstrap + `comirapi.css` inline)
- Instrucciones de uso dentro del mockup

---

## 8. Pendientes / Fuera de alcance V1

- Persistencia en backend (todo sigue mock en memoria).
- Configuración admin de extras por producto (queda para V2).
- Stocks / disponibilidad de extras.
- Cupones / descuentos sobre extras.

---

## 9. Criterios de aceptación

- [ ] Click en `Añadir` abre modal, no agrega directo.
- [ ] Cada grupo muestra límite `Elige entre 0 y N` y controla `- 0 +`.
- [ ] Precio del CTA se recalcula al sumar extras/acompañamientos.
- [ ] `Sin X` aparece en carrito/detalle como `Sin queso` sin alterar precio.
- [ ] Condimentos aparecen sin costo.
- [ ] Carrito muestra desglose indentado bajo cada producto.
- [ ] Detalle y Mis Pedidos muestran mismo desglose.
- [ ] Total del pedido = base + extras + acompañamientos (x cantidad) + envío.
- [ ] Estilos usan paleta Comi-Rapi, no fucsia PedidosYa.


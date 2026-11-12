# Plan de modales y flujo de direcciones

## Alcance

- Gestionar las direcciones del cliente desde `Perfil`, sin páginas dedicadas.
- Mantener el alta y la edición en un wizard de 2 pasos dentro de un modal.
- Confirmar la eliminación con `ConfirmarModal`, sin confirmaciones inline.
- No tocar notificaciones, quejas ni reseñas.
- No modificar `ProductoPersonalizarModal` en esta iteración.

## Decisión

Se adopta el flujo con modal:

- `Perfil` lista las direcciones y permite agregar, editar y eliminar.
- `Agregar dirección` y `Editar` abren el mismo `FormularioDireccion` en modal.
- El wizard tiene 2 pasos: `Dirección` y `Datos extra`.
- La verificación territorial, la cobertura y el mapa de sucursales se muestran
  en el paso 1; el paso 2 solo pide alias y referencia.
- El modal usa `variante="fullscreen-mobile"` y su footer fijo queda visible.
- La eliminación abre `ConfirmarModal`.

## Rutas

- Listado y gestión: `/cliente/perfil#direcciones`
- El alta y la edición ya no tienen ruta propia.
- `Carrito` navega a `/cliente/perfil#direcciones` con
  `state={{ abrirNuevaDireccion: true }}` para abrir el alta automáticamente.

## Flujo

### Perfil

- Cada dirección muestra alias, detalle y referencia.
- Acciones por dirección: `Editar` y `Eliminar`.
- `Editar` abre el modal con los datos de la dirección.
- `Eliminar` abre `ConfirmarModal` y, al confirmar, recarga la lista.
- El botón principal es `Agregar dirección` y abre el modal en modo alta.
- La tarjeta tiene `id="direcciones"` para el scroll desde otros accesos.

### Wizard de alta/edición

1. **Dirección**
   - Provincia.
   - Partido/comuna (obligatorio en Buenos Aires).
   - Localidad (opcional).
   - Calle con sugerencias y altura.
   - Validación antes de verificar.
   - Verificación contra el backend.
   - Si hay ambigüedad, se muestran las opciones para elegir.
   - Si la cobertura bloquea la dirección, se muestra el motivo y no se avanza.
   - Si la dirección es única y tiene cobertura, se muestra la ficha de
     confirmación con el mapa de la sucursal que atiende.
   - El botón cambia de `Verificar dirección` a `Continuar`.

2. **Datos extra**
   - Alias.
   - Referencia.
   - Resumen compacto de la dirección validada y sucursal que atiende.
   - Botones `Atrás` y `Guardar dirección`.

## Criterios de aceptación

- No hay páginas dedicadas de alta/edición ni rutas
  `/cliente/direcciones/nueva` o `/cliente/direcciones/:id/editar`.
- No se usa `?direcciones=1`.
- `MenuCuenta` marca `Direcciones` solo en `/cliente/perfil#direcciones`.
- El enlace del carrito abre el modal de alta automáticamente.
- El mapa se muestra en el paso 1 después de verificar una dirección con
  cobertura.
- El footer del wizard queda visible sin depender de hacer scroll.
- En `375x667` y `768x600` el modal no genera scroll de página para completar
  un paso.
- La lista de direcciones ambiguas es lo único que puede tener scroll interno.
- El guardado revalida la dirección en el backend.
- La eliminación usa `ConfirmarModal`, sin confirmación inline.
- `ProductoPersonalizarModal` queda intacto.

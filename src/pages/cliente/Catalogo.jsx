/**
 * Propósito: Página de catálogo con filtro por categoría y grid de productos.
 *            Accesible sin sesión: mirar el catálogo no pide cuenta.
 * Contenido: Componente Catalogo con título grande, buscador, filtros (sidebar
 *            en desktop, hojas inferiores en mobile), aviso para el invitado y
 *            grid responsive de ProductoCard.
 * Dependencias: react-bootstrap (Container, Button, Row, Col, Alert, Form,
 *               Offcanvas), api/productos.js, api/categorias.js, ProductoCard,
 *               CatalogoSidebar, MiniCarrito, Catalogo.css.
 * Uso: Ruta "/cliente/catalogo" → <Catalogo />
 *
 * CAMBIOS REALIZADOS:
 *  - Título grande "Nuestro Catálogo" en tipografía bold oscura.
 *  - Buscador por nombre junto al mini-carrito (MiniCarrito): el botón con
 *    badge (totalItems) abre un panel anclado con el resumen; no navega solo.
 *  - Desktop (lg+): barra lateral de filtros (CatalogoSidebar) + barra de
 *    resultados con el selector de orden.
 *  - Mobile (<lg): dos botones del mismo ancho (Ordenar por / Filtrar) que abren
 *    hojas inferiores; las tarjetas pasan a formato horizontal.
 *  - Los filtros viven en la URL (?categoria, ?busqueda, ?precioMin,
 *    ?precioMax, ?promocion, ?orden) y se aplican al instante.
 *  - El orden es opcional: sin `?orden` la grilla conserva el orden natural de
 *    la API (nombre A-Z); con `?orden` se ordena en el cliente por precio o
 *    nombre, en ambos sentidos.
 *  - Aviso para el visitante sin sesión: el carrito se arma sin cuenta, pero
 *    confirmar el pedido no, así que se lo dice acá y no recién al final del
 *    proceso, cuando ya eligió todo.
 *
 */

import { useMemo, useState } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { Container, Button, Row, Col, Alert, Form, Offcanvas } from 'react-bootstrap';
import { FaSortAmountDown, FaFilter, FaCheck } from 'react-icons/fa';
import {
  useCategorias,
  useProductos,
  useProductosDePromocion,
  usePromocion,
  usePromociones,
} from '../../hooks/queries';
import { useAuth } from '../../hooks/useAuth';
import { rutaActual } from '../../utils/rutas';
import ProductoCard from '../../components/cliente/ProductoCard';
import CatalogoSidebar from '../../components/cliente/CatalogoSidebar';
import MiniCarrito from '../../components/cliente/MiniCarrito';
import AvisoSucursalesCerradas from '../../components/comunes/AvisoSucursalesCerradas';
import { SkeletonGrillaProductos } from '../../components/comunes/Skeleton';
import './Catalogo.css';

// Opciones del selector de orden. La opción vacía (sin `?orden`) no ordena: la
// grilla queda con el orden natural de la API (nombre A-Z). El resto se aplica
// en el cliente sobre la lista ya filtrada.
const OPCIONES_ORDEN = [
  { valor: 'precio-asc', etiqueta: 'Precio: menor a mayor' },
  { valor: 'precio-desc', etiqueta: 'Precio: mayor a menor' },
  { valor: 'nombre-asc', etiqueta: 'Nombre: A-Z' },
  { valor: 'nombre-desc', etiqueta: 'Nombre: Z-A' },
];

// Comparador de nombres insensible a mayúsculas y acentos ("ñ" ordena junto a
// la "n"), para que A-Z/Z-A se lean como los espera un usuario.
const COMPARADOR_NOMBRE = new Intl.Collator('es', { sensitivity: 'base' });

const Catalogo = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const productosQuery = useProductos();
  const categoriasQuery = useCategorias();
  const promocionesQuery = usePromociones({ incluirProductos: true });
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  // Hoja inferior mobile abierta: 'ordenar' | 'filtrar' | null. Es un único
  // valor a propósito: las dos hojas son mutuamente excluyentes.
  const [hojaMovil, setHojaMovil] = useState(null);

  const productos = useMemo(() => productosQuery.data || [], [productosQuery.data]);
  const categorias = categoriasQuery.data || [];
  const cargando =
    productosQuery.isLoading ||
    categoriasQuery.isLoading ||
    promocionesQuery.isLoading;
  const error = productosQuery.error
    ? productosQuery.error.message || 'No se pudieron cargar los productos.'
    : "";

  // Origen para los enlaces de acceso: se vuelve al catálogo con los filtros
  // que el visitante tenía puestos.
  const origen = rutaActual(location);

  // Mapa productoId → mejor promoción activa que lo alcanza, para el badge de
  // las tarjetas. Es un derivado del cruce promoción×productos que ahora llega
  // resuelto en una sola respuesta (?include=productos), sin cascada N+1.
  const promocionesPorProducto = useMemo(() => {
    const descuentoEquivalente = (promo) =>
      promo.tipo === 'DOS_POR_UNO' ? 50 : Number(promo.valor);
    const porProducto = new Map();
    (promocionesQuery.data || [])
      .filter((promo) => promo.activa !== false)
      .forEach((promo) => {
        const alcanzados = Array.isArray(promo.productos) ? promo.productos : [];
        alcanzados.forEach((producto) => {
          const actual = porProducto.get(producto.id);
          if (
            !actual ||
            descuentoEquivalente(promo) > descuentoEquivalente(actual)
          ) {
            porProducto.set(producto.id, promo);
          }
        });
      });
    return porProducto;
  }, [promocionesQuery.data]);

  // Promoción activa: viene del query param (?promocion=<id>) desde la home
  // ("Aprovechar"). Se cargan los productos alcanzados y se filtra la grilla.
  const promocionId = searchParams.get("promocion");
  const promocionQuery = usePromocion(promocionId);
  const productosPromocionQuery = useProductosDePromocion(promocionId);

  const nombrePromocion = promocionId
    ? promocionQuery.data?.nombre || ""
    : "";

  const idsProductosPromocion = useMemo(() => {
    if (!promocionId || !Array.isArray(productosPromocionQuery.data)) {
      return null;
    }
    return new Set(productosPromocionQuery.data.map((p) => p.id));
  }, [promocionId, productosPromocionQuery.data]);

  const errorPromocion =
    promocionId && productosPromocionQuery.isError
      ? productosPromocionQuery.error?.message ||
        "No se pudieron cargar los productos de la promoción."
      : "";

  // Categoría activa: viene del query param (?categoria=<id>) o por defecto "Todos"
  const categoriaParam = searchParams.get("categoria");
  const categoriaId = categoriaParam ? Number(categoriaParam) : null;
  const categoriaValida =
    categoriaId !== null && categorias.some((c) => c.id === categoriaId);

  // Búsqueda por nombre, rango de precio y ordenamiento, también persistidos en la URL
  const busqueda = searchParams.get("busqueda") || "";
  const precioMin = searchParams.get("precioMin") || "";
  const precioMax = searchParams.get("precioMax") || "";
  const orden = searchParams.get("orden"); // 'precio-asc' | 'precio-desc' | 'nombre-asc' | 'nombre-desc' | null

  // C1: rango de precios del catálogo cargado — límites del deslizador.
  const [precioPiso, precioTecho] = useMemo(() => {
    if (productos.length === 0) return [0, 50000];
    const precios = productos.map((p) => Number(p.precio));
    return [Math.floor(Math.min(...precios)), Math.ceil(Math.max(...precios))];
  }, [productos]);

  // C1: el deslizador actualiza los dos params de la URL en un solo paso.
  const cambiarRangoPrecio = (nuevoMin, nuevoMax) => {
    const next = new URLSearchParams(searchParams);
    if (nuevoMin === "") {
      next.delete("precioMin");
    } else {
      next.set("precioMin", nuevoMin);
    }
    if (nuevoMax === "") {
      next.delete("precioMax");
    } else {
      next.set("precioMax", nuevoMax);
    }
    setSearchParams(next, { replace: true });
  };

  // Cambiar el orden de la grilla: cualquiera de las opciones, o `null` para
  // quitarlo y volver al orden natural de la API.
  const cambiarOrden = (nuevoOrden) => {
    const next = new URLSearchParams(searchParams);
    if (nuevoOrden) {
      next.set('orden', nuevoOrden);
    } else {
      next.delete('orden');
    }
    setSearchParams(next, { replace: true });
  };

  const productosFiltrados = useMemo(() => {
    const min = precioMin !== "" ? Number(precioMin) : null;
    const max = precioMax !== "" ? Number(precioMax) : null;

    let resultado = productos.filter((p) => {
      // Filtro por promoción: solo los productos alcanzados por ella.
      if (idsProductosPromocion && !idsProductosPromocion.has(p.id)) {
        return false;
      }
      if (categoriaValida && p.categoriaId !== categoriaId) {
        return false;
      }
      if (
        busqueda &&
        !p.nombre.toLowerCase().includes(busqueda.trim().toLowerCase())
      ) {
        return false;
      }
      if (min !== null && !Number.isNaN(min) && p.precio < min) {
        return false;
      }
      if (max !== null && !Number.isNaN(max) && p.precio > max) {
        return false;
      }
      return true;
    });

    // Orden elegido por el usuario. Sin orden se conserva el orden natural de la
    // API (nombre A-Z).
    if (orden) {
      resultado = [...resultado].sort((a, b) => {
        switch (orden) {
          case 'precio-asc':
            return a.precio - b.precio;
          case 'precio-desc':
            return b.precio - a.precio;
          case 'nombre-asc':
            return COMPARADOR_NOMBRE.compare(a.nombre, b.nombre);
          case 'nombre-desc':
            return COMPARADOR_NOMBRE.compare(b.nombre, a.nombre);
          default:
            return 0;
        }
      });
    }

    return resultado;
  }, [
    productos,
    idsProductosPromocion,
    categoriaValida,
    categoriaId,
    busqueda,
    precioMin,
    precioMax,
    orden,
  ]);

  // Elegir categoría desde las pills (sincroniza la URL para que también la home la setee)
  // Conserva los filtros de búsqueda y precio ya presentes en la URL.
  const seleccionarCategoria = (id) => {
    const next = new URLSearchParams(searchParams);
    if (id === null) {
      next.delete("categoria");
    } else {
      next.set("categoria", String(id));
    }
    setSearchParams(next, { replace: true });
  };

  const setParam = (clave, valor) => {
    const next = new URLSearchParams(searchParams);
    if (valor === "") {
      next.delete(clave);
    } else {
      next.set(clave, valor);
    }
    setSearchParams(next, { replace: true });
  };

  // Salida del estado vacío: borra todos los filtros de la URL sin tocar la
  // ruta. Sin esto el aviso dejaba al usuario en un callejón: tenía que
  // descubrir solo que los filtros estaban en el sidebar o en la hoja "Filtrar".
  const limpiarFiltros = () => {
    const next = new URLSearchParams(searchParams);
    ["categoria", "busqueda", "precioMin", "precioMax", "promocion", "orden"].forEach(
      (clave) => next.delete(clave),
    );
    setSearchParams(next, { replace: true });
  };

  // Solo los filtros del panel lateral (categoría y precio): conserva la
  // búsqueda, la promoción y el orden. Es la acción "Restablecer filtros".
  const restablecerFiltrosSidebar = () => {
    const next = new URLSearchParams(searchParams);
    ["categoria", "precioMin", "precioMax"].forEach((clave) =>
      next.delete(clave),
    );
    setSearchParams(next, { replace: true });
  };

  return (
    <Container fluid className="py-5 catalogo-container">
      {/* Título */}
      <div className="text-center mb-4">
        <h1 className="catalogo-titulo mb-2">Nuestro Catálogo</h1>
        <p className="text-muted mb-0">
          Elegí tu favorito y añadilo al carrito.
        </p>
      </div>

      {/* Aviso global de horario: se muestra una sola vez, no por producto. El
          backend rechaza igual el alta si ninguna sucursal puede tomar pedidos. */}
      <AvisoSucursalesCerradas className="mb-4" />

      {/* Aviso para el visitante sin sesión. Va arriba de todo, antes de los
          filtros: la cuenta se pide recién al confirmar, pero conviene que sepa
          desde el principio que va a necesitarla. Mismo texto corto que el
          aviso del carrito. Se usa `light` y no `warning` (como el del carrito)
          para no competir con los productos: acá es información, no un paso
          obligatorio. */}
      {!isAuthenticated && (
        <Alert
          variant="light"
          className="catalogo-aviso-invitado text-center mb-4"
        >
          <Link to="/login" state={{ from: origen }} className="alert-link">
            Iniciá sesión
          </Link>{" "}
          o{" "}
          <Link to="/registro" state={{ from: origen }} className="alert-link">
            registrate
          </Link>{" "}
          para confirmar la compra.
        </Alert>
      )}

      {/* Aviso de filtro por promoción (viene de "Aprovechar" en la home).
          Se quita el filtro con el botón, que limpia el query param. */}
      {errorPromocion && (
        <Alert variant="warning" className="cat-aviso text-center mb-4">
          {errorPromocion}
        </Alert>
      )}
      {!errorPromocion && nombrePromocion && idsProductosPromocion && (
        <Alert
          variant="info"
          className="d-flex align-items-center justify-content-between gap-3 cat-aviso text-center mb-4"
        >
          <span className="mx-auto">
            Mostrando los productos de la promoción{" "}
            <strong>{nombrePromocion}</strong>
          </span>
          <Button
            variant="outline-danger"
            size="sm"
            className="flex-shrink-0"
            onClick={() => setParam("promocion", "")}
          >
            Quitar filtro
          </Button>
        </Alert>
      )}

      {/* Buscador + mini-carrito. El botón ya no navega: abre el panel anclado
          con el resumen y el contador de unidades totales (el mismo número que
          la barra inferior). Ver MiniCarrito. */}
      <div className="catalogo-header mb-4">
        <Form.Group
          controlId="catalogo-busqueda"
          className="catalogo-busqueda mb-0"
        >
          <Form.Label className="visually-hidden">
            Buscar producto por nombre
          </Form.Label>
          <Form.Control
            type="search"
            name="busqueda"
            placeholder="Buscar producto por nombre…"
            value={busqueda}
            onChange={(e) => setParam("busqueda", e.target.value)}
          />
        </Form.Group>
        <MiniCarrito />
      </div>

      {/* Controles para pantallas chicas: dos botones del mismo ancho que abren
          hojas inferiores. Van en el flujo, no fijos: el pie fijo del sitio
          sigue siendo `NavInferior`. Cada hoja se cierra sola al elegir. */}
      <div className="catalogo-acciones-movil d-lg-none mb-4">
        <Button
          className="catalogo-accion-movil"
          onClick={() => setHojaMovil('ordenar')}
          aria-haspopup="dialog"
        >
          <FaSortAmountDown aria-hidden="true" />
          Ordenar por
        </Button>
        <Button
          className="catalogo-accion-movil"
          onClick={() => setHojaMovil('filtrar')}
          aria-haspopup="dialog"
        >
          <FaFilter aria-hidden="true" />
          Filtrar
        </Button>
      </div>

      {/* Hojas inferiores mobile. `hojaMovil` guarda un único valor, así que
          nunca quedan abiertas a la vez. Se renderizan fuera de `d-lg-none`
          porque un ancestro con `display:none` las dejaría inutilizables; en
          desktop no se pueden abrir porque los botones no existen. El offcanvas
          de Bootstrap tiene z-index mayor que `NavInferior`, así que lo tapa
          mientras está abierto. */}
      <Offcanvas
        show={hojaMovil === 'ordenar'}
        onHide={() => setHojaMovil(null)}
        placement="bottom"
        className="catalogo-hoja"
        aria-labelledby="catalogo-hoja-ordenar-titulo"
      >
        <Offcanvas.Header closeButton>
          <Offcanvas.Title as="span" id="catalogo-hoja-ordenar-titulo">
            <FaSortAmountDown className="me-2" aria-hidden="true" />
            Ordenar
          </Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body>
          {/* La primera opción es la "sin orden": cuando no hay orden activo se
              muestra como "Ordenar por" (es la vigente) y cuando hay uno pasa a
              "Quitar ordenamiento", la salida que busca el usuario. */}
          <ul className="catalogo-hoja-opciones">
            <li>
              <Button
                className={`catalogo-hoja-opcion${
                  !orden ? ' catalogo-hoja-opcion--activa' : ''
                }`}
                onClick={() => {
                  cambiarOrden(null);
                  setHojaMovil(null);
                }}
                aria-pressed={!orden}
              >
                <span>{orden ? 'Quitar ordenamiento' : 'Ordenar por'}</span>
                {!orden && <FaCheck aria-hidden="true" />}
              </Button>
            </li>
            {OPCIONES_ORDEN.map((opcion) => {
              const activo = orden === opcion.valor;
              return (
                <li key={opcion.valor}>
                  <Button
                    className={`catalogo-hoja-opcion${
                      activo ? ' catalogo-hoja-opcion--activa' : ''
                    }`}
                    onClick={() => {
                      cambiarOrden(opcion.valor);
                      setHojaMovil(null);
                    }}
                    aria-pressed={activo}
                  >
                    <span>{opcion.etiqueta}</span>
                    {activo && <FaCheck aria-hidden="true" />}
                  </Button>
                </li>
              );
            })}
          </ul>
        </Offcanvas.Body>
      </Offcanvas>

      <Offcanvas
        show={hojaMovil === 'filtrar'}
        onHide={() => setHojaMovil(null)}
        placement="bottom"
        className="catalogo-hoja"
        aria-labelledby="catalogo-hoja-filtrar-titulo"
      >
        <Offcanvas.Header closeButton>
          <Offcanvas.Title as="span" id="catalogo-hoja-filtrar-titulo">
            <FaFilter className="me-2" aria-hidden="true" />
            Filtrar
          </Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body>
          {/* El mismo panel que el sidebar de desktop: los filtros se aplican
              al instante (la URL es la fuente de verdad), sin botón Aplicar. */}
          <CatalogoSidebar
            categorias={categorias}
            categoriaId={categoriaValida ? categoriaId : null}
            onSeleccionarCategoria={seleccionarCategoria}
            precioPiso={precioPiso}
            precioTecho={precioTecho}
            precioMin={precioMin}
            precioMax={precioMax}
            onCambiarRangoPrecio={cambiarRangoPrecio}
            onLimpiarTodo={limpiarFiltros}
            onRestablecerFiltros={restablecerFiltrosSidebar}
          />
        </Offcanvas.Body>
      </Offcanvas>

      {/* Zona principal: filtros a la izquierda (desktop) y resultados a la
          derecha. Bajo `lg` el panel se oculta y la grilla ocupa todo el ancho. */}
      <Row className="g-4">
        <Col lg={3} className="d-none d-lg-block">
          <CatalogoSidebar
            categorias={categorias}
            categoriaId={categoriaValida ? categoriaId : null}
            onSeleccionarCategoria={seleccionarCategoria}
            precioPiso={precioPiso}
            precioTecho={precioTecho}
            precioMin={precioMin}
            precioMax={precioMax}
            onCambiarRangoPrecio={cambiarRangoPrecio}
            onLimpiarTodo={limpiarFiltros}
            onRestablecerFiltros={restablecerFiltrosSidebar}
          />
        </Col>

        <Col lg={9}>
          {/* Barra de resultados (desktop): conteo a la izquierda y orden a la
              derecha. Bajo `lg` el orden vive en la hoja "Ordenar". */}
          <div className="catalogo-resultados d-none d-lg-flex">
            <span className="catalogo-resultados-count">
              {cargando || error
                ? "\u00a0"
                : `${productosFiltrados.length} ${
                    productosFiltrados.length === 1 ? "producto" : "productos"
                  }`}
            </span>
            <div className="filtro-orden-precio-contenedor">
              <Form.Select
                value={orden || ''}
                onChange={(e) => cambiarOrden(e.target.value || null)}
                aria-label="Ordenar productos"
                className="filtro-orden-precio-select"
              >
                {/* Opción vacía: etiqueta dinámica. Sin orden activo dice
                    "Ordenar por" (es el placeholder); con uno activo, la misma
                    opción pasa a "Quitar ordenamiento". */}
                <option value="">
                  {orden ? 'Quitar ordenamiento' : 'Ordenar por'}
                </option>
                {OPCIONES_ORDEN.map((opcion) => (
                  <option key={opcion.valor} value={opcion.valor}>
                    {opcion.etiqueta}
                  </option>
                ))}
              </Form.Select>
            </div>
          </div>

      {/* Grid de productos */}
      {cargando ? (
        <div role="status" aria-live="polite">
          <p className="visually-hidden">Cargando el catálogo…</p>
          <SkeletonGrillaProductos />
        </div>
      ) : error ? (
        <div className="text-center">
          <Alert
            variant="danger"
            role="alert"
            className="cat-aviso d-inline-block"
          >
            {error}
          </Alert>
        </div>
      ) : (
        <>
          {/* El conteo se anuncia al cambiar los filtros: sin esto, quien usa
              lector de pantalla no tiene forma de saber que la lista se
              actualizó ni cuántos productos quedan. */}
          <p className="visually-hidden" role="status">
            {productosFiltrados.length === 1
              ? "1 producto encontrado."
              : `${productosFiltrados.length} productos encontrados.`}
          </p>
          {/* Heading propio de la grilla: los títulos de producto son <h3>, así que la
              lista necesita su <h2> para no saltear un nivel. */}
          <h2 className="visually-hidden">Productos del catálogo</h2>
          <Row
            className={`justify-content-center fila-stagger fila-stagger--catalogo${
              !idsProductosPromocion &&
              busqueda === "" &&
              precioMin === "" &&
              precioMax === ""
                ? " fila-stagger--activa"
                : " fila-stagger--activa"
            }`}
            key={
              promocionId
                ? `promo-${promocionId}-count-${productosFiltrados.length}`
                : `cat-${categoriaId ?? "todos"}`
            }
          >
            {productosFiltrados.map((producto, index) => {
              /* Stagger decorativo: 40ms entre ítems y tope de 300ms para que
                 la última tarjeta no espere más de lo que tarda en entrar
                 cualquiera (receta de la skill animate). */
              const delay = Math.min(30 + index * 40, 300);
              return (
                <Col
                  key={producto.id}
                  md={6}
                  lg={4}
                  className="mb-4 stagger-item"
                  style={{ animationDelay: `${delay}ms` }}
                >
                  <ProductoCard
                    producto={producto}
                    promocion={promocionesPorProducto.get(producto.id)}
                    variante="horizontal"
                  />
                </Col>
              );
            })}
          </Row>

          {productosFiltrados.length === 0 && (
            <div className="cat-vacio text-center">
              <p className="cat-vacio-texto">
                No hay productos que coincidan con los filtros.
              </p>
              <Button
                variant="primary"
                className="cat-vacio-boton"
                onClick={limpiarFiltros}
              >
                Limpiar filtros
              </Button>
            </div>
          )}
        </>
      )}
        </Col>
      </Row>
    </Container>
  );
};

export default Catalogo;

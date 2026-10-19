/**
 * Propósito: Página de catálogo con filtro por categoría y grid de productos.
 *            Accesible sin sesión: mirar el catálogo no pide cuenta.
 * Contenido: Componente Catalogo con título grande, filtros tipo pill, aviso
 *            para el invitado y grid responsive de ProductoCard.
 * Dependencias: react-bootstrap (Container, Button, Row, Col, Alert, Form),
 *               api/productos.js, api/categorias.js, ProductoCard, Catalogo.css.
 * Uso: Ruta "/cliente/catalogo" → <Catalogo />
 *
 * CAMBIOS REALIZADOS:
 *  - Título grande "Nuestro Catálogo" en tipografía bold oscura.
 *  - Filtros de categorías en forma de pills (Hamburguesas, Pizzas, Combos, Papas, Bebidas, Postres).
 *  - Las categorías de la home llegan por query param (?categoria=...) y se aplican al instante.
 *  - Al elegir una pill también se actualiza el query param (el filtro queda en la URL).
 *  - Grid responsive (3 columnas en md, 4 en lg).
 *  - Cards con el estilo visual de la home de Comi-Rapi (ver ProductoCard).
 *  - Búsqueda por nombre y rango de precio, también persistidos en la URL.
 *  - Validación de rango de precio: mínimo no puede ser negativo ni mayor al máximo y viceversa.
 *  - Aviso para el visitante sin sesión: el carrito se arma sin cuenta, pero
 *    confirmar el pedido no, así que se lo dice acá y no recién al final del
 *    proceso, cuando ya eligió todo.
 *
 */

import { useMemo, useState, useEffect } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { Container, Button, Row, Col, Alert, Form } from 'react-bootstrap';
import { obtenerProductos, obtenerProductoPorId } from '../../api/productos';
import { obtenerCategorias, obtenerCategoriaPorId } from '../../api/categorias';
import {
  obtenerPromociones,
  obtenerPromocionPorId,
  obtenerProductosDePromocion,
} from '../../api/promociones';
import { useAuth } from '../../hooks/useAuth';
import { rutaActual } from '../../utils/rutas';
import { fusionarPorId, quitarPorId } from '../../utils/catalogoRealtime';
import ProductoCard from '../../components/cliente/ProductoCard';
import RangoPrecio from '../../components/cliente/RangoPrecio';
import { SkeletonGrillaProductos } from '../../components/comunes/Skeleton';
import './Catalogo.css';
import { conectarSocket, EVENTOS_SOCKET } from '../../services/socket';

const Catalogo = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [idsProductosPromocion, setIdsProductosPromocion] = useState(null);
  const [nombrePromocion, setNombrePromocion] = useState('');
  const [errorPromocion, setErrorPromocion] = useState('');
  const [promocionesPorProducto, setPromocionesPorProducto] = useState(new Map());
  const { isAuthenticated, hydrated } = useAuth();
  const location = useLocation();

  // Origen para los enlaces de acceso: se vuelve al catálogo con los filtros
  // que el visitante tenía puestos.
  const origen = rutaActual(location);

  // Mapa productoId → mejor promoción activa que lo alcanza, para el badge de
  // las tarjetas. Un producto puede estar en varias promociones: se queda con la
  // de mayor descuento (2x1 equivale a 50%). Es un derivado del cruce
  // promoción×productos, así que se rearma solo (sin spinner).
  const refrescarPromocionesPorProducto = async () => {
    const resPromociones = await obtenerPromociones();
    if (!resPromociones.success) return;
    const descuentoEquivalente = (promo) =>
      promo.tipo === 'DOS_POR_UNO' ? 50 : Number(promo.valor);
    const productosDePromos = await Promise.all(
      resPromociones.data.map(async (promo) => {
        const resProd = await obtenerProductosDePromocion(promo.id);
        return resProd.success
          ? resProd.data.map((p) => ({ productoId: p.id, promo }))
          : [];
      })
    );
    const porProducto = new Map();
    productosDePromos.flat().forEach(({ productoId, promo }) => {
      const actual = porProducto.get(productoId);
      if (!actual || descuentoEquivalente(promo) > descuentoEquivalente(actual)) {
        porProducto.set(productoId, promo);
      }
    });
    setPromocionesPorProducto(porProducto);
  };

  const cargarCatalogo = async () => {
    setCargando(true);
    setError('');
    const [resProductos, resCategorias] = await Promise.all([
      obtenerProductos(),
      obtenerCategorias(),
    ]);
    if (resProductos.success) {
      setProductos(resProductos.data);
    } else {
      setError(resProductos.error || 'No se pudieron cargar los productos.');
    }
    if (resCategorias.success) {
      setCategorias(resCategorias.data);
    }
    await refrescarPromocionesPorProducto();
    setCargando(false);
  };

  useEffect(() => {
    cargarCatalogo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!hydrated || !isAuthenticated) return undefined;
    const instancia = conectarSocket();
    // Si se perdió un cambio durante una desconexión, el aviso no llegó:
    // como el socket es solo un aviso, se resincroniza por REST al reconectar.
    // La carga inicial la hace el useEffect de arriba, por eso no se pide aquí.
    const alConectar = () => cargarCatalogo();
    // catalogo_actualizado sólo avisa {tipo, id, accion}: se relee esa entidad
    // por REST y se aplica sobre la grilla/pills en memoria, sin recargar toda
    // la página. Las promociones sí rearman el mapa de badges (es un cruce).
    const alCat = async (payload) => {
      if (payload?.tipo === 'producto') {
        const id = Number(payload.id);
        if (payload.accion === 'eliminado') {
          setProductos((prev) => quitarPorId(prev, id));
          return;
        }
        const result = await obtenerProductoPorId(id);
        if (result.success && result.data && result.data.activo !== false) {
          setProductos((prev) => fusionarPorId(prev, result.data));
        } else {
          setProductos((prev) => quitarPorId(prev, id));
        }
        return;
      }
      if (payload?.tipo === 'categoria') {
        const id = Number(payload.id);
        if (payload.accion === 'eliminado') {
          setCategorias((prev) => quitarPorId(prev, id));
          return;
        }
        // Para el cliente, `show` da 404 si la categoría quedó inactiva: ese
        // 404 la saca de las pills.
        const result = await obtenerCategoriaPorId(id);
        if (result.success && result.data && result.data.activa !== false) {
          setCategorias((prev) => fusionarPorId(prev, result.data));
        } else {
          setCategorias((prev) => quitarPorId(prev, id));
        }
        return;
      }
      if (payload?.tipo === 'promocion') {
        await refrescarPromocionesPorProducto();
      }
    };
    instancia.on('connect', alConectar);
    instancia.on(EVENTOS_SOCKET.CATALOGO_ACTUALIZADO, alCat);
    return () => {
      instancia.off('connect', alConectar);
      instancia.off(EVENTOS_SOCKET.CATALOGO_ACTUALIZADO, alCat);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, isAuthenticated]);

  // Promoción activa: viene del query param (?promocion=<id>) desde la home
  // ("Aprovechar"). Se cargan los productos alcanzados y se filtra la grilla.
  const promocionId = searchParams.get("promocion");

  useEffect(() => {
    if (!promocionId) {
      setIdsProductosPromocion(null);
      setNombrePromocion("");
      setErrorPromocion("");
      return;
    }
    const cargar = async () => {
      const [resPromocion, resProductos] = await Promise.all([
        obtenerPromocionPorId(promocionId),
        obtenerProductosDePromocion(promocionId),
      ]);
      if (resPromocion.success) {
        setNombrePromocion(resPromocion.data.nombre);
      }
      if (resProductos.success) {
        setIdsProductosPromocion(new Set(resProductos.data.map((p) => p.id)));
        setErrorPromocion("");
      } else {
        setIdsProductosPromocion(null);
        setErrorPromocion(
          resProductos.error ||
            "No se pudieron cargar los productos de la promoción.",
        );
      }
    };
    cargar();
  }, [promocionId]);

  // Categoría activa: viene del query param (?categoria=<id>) o por defecto "Todos"
  const categoriaParam = searchParams.get("categoria");
  const categoriaId = categoriaParam ? Number(categoriaParam) : null;
  const categoriaValida =
    categoriaId !== null && categorias.some((c) => c.id === categoriaId);
  const categoriaSeleccionada = categoriaValida
    ? categorias.find((c) => c.id === categoriaId).nombre
    : "Todos";

  // Búsqueda por nombre y rango de precio, también persistidos en la URL
  const busqueda = searchParams.get("busqueda") || "";
  const precioMin = searchParams.get("precioMin") || "";
  const precioMax = searchParams.get("precioMax") || "";

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

  const productosFiltrados = useMemo(() => {
    const min = precioMin !== "" ? Number(precioMin) : null;
    const max = precioMax !== "" ? Number(precioMax) : null;

    return productos.filter((p) => {
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
  }, [
    productos,
    idsProductosPromocion,
    categoriaValida,
    categoriaId,
    busqueda,
    precioMin,
    precioMax,
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

  return (
    <Container className="py-5">
      {/* Título */}
      <div className="text-center mb-4">
        <h1 className="catalogo-titulo mb-2">Nuestro Catálogo</h1>
        <p className="text-muted mb-0">
          Elegí tu favorito y añadilo al carrito.
        </p>
      </div>

      {/* Aviso para el visitante sin sesión. Va arriba de todo, antes de los
          filtros: la cuenta se pide recién al confirmar, pero conviene que sepa
          desde el principio que va a necesitarla. Se usa `light` y no `warning`
          (como el aviso del carrito) para no competir con los productos: acá es
          información, no un paso obligatorio. */}
      {!isAuthenticated && (
        <Alert
          variant="light"
          className="catalogo-aviso-invitado text-center mb-4"
        >
          Estás viendo el catálogo sin iniciar sesión. Podés armar tu pedido
          libremente; para confirmarlo vas a necesitar{" "}
          <Link to="/login" state={{ from: origen }} className="alert-link">
            iniciar sesión
          </Link>{" "}
          o{" "}
          <Link to="/registro" state={{ from: origen }} className="alert-link">
            registrarte
          </Link>
          .
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

      {/* Filtros / categorías en forma de pills.
          Van en un `role="group"` con etiqueta, y cada pill lleva `aria-pressed`
          para que se anuncie cuál está activa en vez de deducirlo por el color. */}
      <div
        className="d-flex flex-wrap justify-content-center gap-2 mb-4"
        role="group"
        aria-label="Filtrar por categoría"
      >
        <Button
          className={
            categoriaSeleccionada === "Todos"
              ? "filtro-pill filtro-activo"
              : "filtro-pill filtro-inactivo"
          }
          aria-pressed={categoriaSeleccionada === "Todos"}
          onClick={() => seleccionarCategoria(null)}
        >
          Todos
        </Button>
        {categorias.map((cat) => {
          const activo = categoriaSeleccionada === cat.nombre;
          return (
            <Button
              key={cat.id}
              className={
                activo
                  ? "filtro-pill filtro-activo"
                  : "filtro-pill filtro-inactivo"
              }
              aria-pressed={activo}
              onClick={() => seleccionarCategoria(cat.id)}
            >
              {cat.nombre}
            </Button>
          );
        })}
      </div>

      {/* Buscador por nombre y filtro por rango de precio.
          `type="search"` ya expone un botón de limpiar en varios navegadores;
          los inputs de precio van con label propio porque el placeholder no
          sobrevive a que el usuario escriba. */}
      <div className="catalogo-busqueda mb-4">
        <Form.Group controlId="catalogo-busqueda" className="mb-2">
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
        {/* C1: deslizador doble de precio — reemplaza los inputs numéricos.
            Mantiene precioMin/precioMax en la URL (mismos params que antes). */}
        <RangoPrecio
          min={precioPiso}
          max={precioTecho}
          valorMin={precioMin}
          valorMax={precioMax}
          onChange={cambiarRangoPrecio}
        />
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
                  md={4}
                  lg={3}
                  className="mb-4 stagger-item"
                  style={{ animationDelay: `${delay}ms` }}
                >
                  <ProductoCard
                    producto={producto}
                    promocion={promocionesPorProducto.get(producto.id)}
                  />
                </Col>
              );
            })}
          </Row>

          {productosFiltrados.length === 0 && (
            <div className="text-center">
              <Alert variant="light" className="cat-aviso d-inline-block">
                No hay productos que coincidan con los filtros.
              </Alert>
            </div>
          )}
        </>
      )}
    </Container>
  );
};

export default Catalogo;

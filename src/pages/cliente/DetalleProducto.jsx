import { useEffect, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import { Container, Row, Col, Card, Badge, Button, Alert } from 'react-bootstrap';
import { FaCartPlus, FaSlidersH, FaTag, FaTruck } from 'react-icons/fa';
import { eliminarResena } from '../../api/resenas';
import {
  queryKeys,
  useEstadoResenaProducto,
  usePersonalizacionProducto,
  useProducto,
  useProductos,
  usePromociones,
  useResenasProducto,
} from '../../hooks/queries';
import { useCarrito } from '../../hooks/useCarrito';
import { useParametros } from '../../hooks/useParametros';
import { useAuth } from '../../hooks/useAuth';
import { formatPrice } from '../../utils/formatters';
import { resolverImagen } from '../../utils/imagenes';
import { calcularCostoEnvio } from '../../services/envio';
import ProductoCard from '../../components/cliente/ProductoCard';
import { SkeletonDetalleProducto } from '../../components/comunes/Skeleton';
import ProductoPersonalizarModal from '../../components/cliente/ProductoPersonalizarModal';
import Estrellas from '../../components/cliente/Estrellas';
import ListaResenas from '../../components/cliente/ListaResenas';
import ResenaModal from '../../components/cliente/ResenaModal';
import ConfirmarModal from '../../components/comunes/ConfirmarModal';
import './DetalleProducto.css';

// En la ficha se ven sólo las primeras reseñas: el resto vive en la página
// completa de opiniones (/producto/:id/resenas).
const RESENAS_EN_DETALLE = 4;

const DetalleProducto = () => {
  const { id } = useParams();
  const { agregarAlCarrito, total: totalCarrito, items: itemsCarrito } = useCarrito();
  const { parametros } = useParametros();
  const { hydrated, isAuthenticated, isCliente } = useAuth();
  const queryClient = useQueryClient();
  const [cantidad, setCantidad] = useState(1);
  const [showModal, setShowModal] = useState(false);

  // Reseñas: listado público paginado, resumen, la reseña propia (si existe) y
  // si este cliente puede escribir una (compró y recibió el producto).
  const [modalResena, setModalResena] = useState(false);
  const [resenaAEditar, setResenaAEditar] = useState(null);
  const [resenaABorrar, setResenaABorrar] = useState(null);
  const [borrandoResena, setBorrandoResena] = useState(false);
  const [mensajeResenas, setMensajeResenas] = useState('');
  const [errorResenas, setErrorResenas] = useState('');

  // Catálogo completo: de acá salen el producto, los relacionados y los combos
  // que incluyen este producto. Comparte la caché con el bootstrap, así que
  // si el snapshot inicial ya cargó no hay ninguna petición HTTP al entrar al
  // detalle del producto.
  const catalogoQuery = useProductos();
  const productoDeCatalogo = useMemo(
    () => catalogoQuery.data?.find((p) => String(p.id) === String(id)),
    [catalogoQuery.data, id]
  );
  // Fallback: solo se consulta el detalle por ID si el producto no está en el
  // catálogo (dado de baja, o el bootstrap no llegó a tiempo).
  const productoQuery = useProducto(id, {
    enabled: !productoDeCatalogo,
  });

  const promocionesQuery = usePromociones({ incluirProductos: true });
  const resenasQuery = useResenasProducto(id, {
    pagina: 1,
    limite: RESENAS_EN_DETALLE,
  });
  const puedeConsultarPropias = hydrated && isAuthenticated && isCliente;
  // Una sola consulta acotada a este producto: si puede reseñarlo y cuál es su
  // reseña. Antes se pedían los listados globales de elegibles y mías.
  const estadoResenaQuery = useEstadoResenaProducto(id, {
    enabled: puedeConsultarPropias,
  });
  // La personalización va por separado (igual que las reseñas), pero solo se
  // consulta si el producto vino del fallback de detalle y no trae ya su
  // personalización. Si viene del catálogo/bootstrap, no hay llamada extra.
  const personalizacionQuery = usePersonalizacionProducto(id, {
    enabled: productoQuery.isSuccess && !Array.isArray(productoQuery.data?.personalizacion),
  });

  const producto = productoDeCatalogo || productoQuery.data || null;
  const catalogo = useMemo(() => catalogoQuery.data || [], [catalogoQuery.data]);
  const personalizacion = useMemo(
    () => (Array.isArray(personalizacionQuery.data) ? personalizacionQuery.data : []),
    [personalizacionQuery.data]
  );

  // Mejor promoción activa que alcanza a este producto (misma regla que el
  // catálogo: mayor descuento; 2x1 equivale a 50%).
  const promocion = useMemo(() => {
    const equiv = (promo) => (promo.tipo === 'DOS_POR_UNO' ? 50 : Number(promo.valor));
    return (promocionesQuery.data || [])
      .filter((promo) => promo.activa !== false)
      .filter((promo) =>
        (Array.isArray(promo.productos) ? promo.productos : []).some(
          (p) => String(p.id) === String(id)
        )
      )
      .sort((a, b) => equiv(b) - equiv(a))[0];
  }, [promocionesQuery.data, id]);

  const resenas = resenasQuery.data;
  const cargandoResenas = resenasQuery.isLoading;
  const puedeResenar = Boolean(estadoResenaQuery.data?.puedeResenar);
  const miResena = estadoResenaQuery.data?.miResena || null;

  const cargando = productoQuery.isLoading;
  const error = productoQuery.error ? productoQuery.error.message || 'Producto no encontrado.' : '';

  // Al cambiar de producto, la cantidad vuelve a 1.
  useEffect(() => {
    setCantidad(1);
  }, [id]);

  const refrescarResenas = () =>
    Promise.all([
      queryClient.invalidateQueries({
        queryKey: queryKeys.public.resenasProducto(id, 1, RESENAS_EN_DETALLE),
      }),
      queryClient.invalidateQueries({ queryKey: ['private', 'resenas'] }),
    ]);

  const ingredientes = useMemo(() => {
    if (!producto) return [];
    if (producto.tipo === 'COMBO' && Array.isArray(producto.componentes)) {
      return producto.componentes.map((c) => c.nombre || `producto ${c.productoId}`);
    }
    return personalizacion
      .filter((e) => e.tipo === 'personalizar' && e.activo !== false)
      .map((e) => e.nombre);
  }, [producto, personalizacion]);

  // Mismo criterio de siempre: productos de la misma categoría, sin el actual.
  const relacionados = useMemo(
    () =>
      catalogo
        .filter(
          (p) =>
            p.categoriaId === producto?.categoriaId &&
            String(p.id) !== String(id) &&
            p.activo !== false
        )
        .slice(0, 3),
    [catalogo, producto, id]
  );

  // Combos cuya receta incluye este producto. El índice ya devuelve los
  // componentes de cada combo, así que no hace falta otra llamada.
  const combosQueLoIncluyen = useMemo(
    () =>
      catalogo.filter(
        (p) =>
          p.tipo === 'COMBO' &&
          (p.componentes || []).some((c) => String(c.productoId) === String(id))
      ),
    [catalogo, id]
  );

  // Precio que realmente paga por el producto (con la promo porcentual ya
  // aplicada, igual que en el carrito). Se usa para saber si este producto
  // solo alcanza el envío gratis.
  const precioConDescuento =
    promocion && promocion.tipo === 'DESCUENTO_PORCENTUAL'
      ? Number(producto?.precio) * (1 - Number(promocion.valor) / 100)
      : null;
  const precioFinalProducto = precioConDescuento ?? Number(producto?.precio ?? 0);

  // "Tu pedido": un solo estado de envío. Manda el carrito cuando tiene algo;
  // si está vacío, se responde por este producto solo.
  const envioGratisDesde = Number(parametros.montoMinimoEnvioGratis ?? 0);
  const envioDelProducto = calcularCostoEnvio(precioFinalProducto, parametros);
  const envioDelCarrito = calcularCostoEnvio(totalCarrito, parametros);
  const hayCarrito = itemsCarrito.length > 0;
  const envioMostrado = hayCarrito ? envioDelCarrito : envioDelProducto;
  const faltaParaEnvioGratis = Math.max(
    0,
    envioGratisDesde - (hayCarrito ? totalCarrito : precioFinalProducto)
  );
  const progresoEnvio =
    envioGratisDesde > 0 ? Math.min(100, Math.round((totalCarrito / envioGratisDesde) * 100)) : 100;

  // Unidades de este producto ya en el carrito: con el 2x1 sirve para saber si
  // está a mitad de camino.
  const unidadesEnCarrito = useMemo(
    () =>
      itemsCarrito
        .filter((item) => String(item.producto?.id) === String(id))
        .reduce((total, item) => total + item.cantidad, 0),
    [itemsCarrito, id]
  );

  const alGuardarResena = async () => {
    const editando = Boolean(resenaAEditar);
    setModalResena(false);
    setResenaAEditar(null);
    setErrorResenas('');
    setMensajeResenas(editando ? 'Tu reseña se actualizó.' : 'Tu reseña se publicó.');
    await refrescarResenas();
  };

  const confirmarBorradoResena = async () => {
    if (!resenaABorrar) return;
    setBorrandoResena(true);
    setErrorResenas('');
    const res = await eliminarResena(resenaABorrar.id);
    setBorrandoResena(false);
    setResenaABorrar(null);
    if (!res.success) {
      setErrorResenas(res.error || 'No se pudo eliminar la reseña.');
      return;
    }
    setMensajeResenas('Tu reseña se eliminó.');
    await refrescarResenas();
  };

  if (cargando) {
    return (
      <Container className="py-4" role="status" aria-live="polite">
        <span className="visually-hidden">Cargando el producto…</span>
        <SkeletonDetalleProducto />
      </Container>
    );
  }

  if (error || !producto) {
    return (
      <Container className="py-5 text-center">
        <Alert variant="danger">{error || 'Producto no encontrado.'}</Alert>
        <Link to="/cliente/catalogo" className="boton-volver">
          ← Volver al catálogo
        </Link>
      </Container>
    );
  }

  return (
    <Container className="py-4 detalle-producto">
      <div className="mb-3">
        <Link to="/cliente/catalogo" className="boton-volver">
          ← Volver al catálogo
        </Link>
      </div>

      <Card className="detalle-card mb-4">
        <Row className="g-0">
          <Col md={5} className="position-relative">
            <Card.Img
              src={resolverImagen(producto.imagen)}
              alt={producto.nombre}
              className="detalle-hero-img"
            />
            {promocion && (
              <span className="promo-badge position-absolute" style={{ top: 12, right: 12 }}>
                {promocion.tipo === 'DOS_POR_UNO'
                  ? '2x1'
                  : `-${Math.round(Number(promocion.valor))}%`}
              </span>
            )}
          </Col>
          <Col md={7}>
            <Card.Body className="p-4 d-flex flex-column h-100">
              {producto.categoria && (
                <Badge bg="light" text="dark" className="badge-comi align-self-start mb-2">
                  {producto.categoria}
                </Badge>
              )}
              <Card.Title as="h1">{producto.nombre}</Card.Title>
              <div className="mb-2 d-flex align-items-center gap-2 flex-wrap">
                {resenas && resenas.cantidad > 0 ? (
                  <>
                    <Estrellas valor={resenas.promedio} tamano={16} />
                    <strong>{Number(resenas.promedio).toFixed(1)}</strong>
                    <span className="text-muted small">
                      ({resenas.cantidad} {resenas.cantidad === 1 ? 'reseña' : 'reseñas'})
                    </span>
                  </>
                ) : (
                  <span className="text-muted small">Todavía no hay reseñas de este producto.</span>
                )}
              </div>
              <Card.Text className="text-muted flex-grow-1">{producto.descripcion}</Card.Text>
              <div className="mb-3">
                {precioConDescuento !== null && (
                  <span className="precio-tachado me-2">{formatPrice(producto.precio)}</span>
                )}
                <span className="precio-destacado">
                  {formatPrice(precioConDescuento ?? producto.precio)}
                </span>
              </div>
              <div className="d-flex gap-2 align-items-center flex-wrap">
                <span className="pill-control">
                  <button
                    type="button"
                    onClick={() => setCantidad((c) => Math.max(1, c - 1))}
                    aria-label="Quitar uno"
                  >
                    −
                  </button>
                  <span>{cantidad}</span>
                  <button
                    type="button"
                    onClick={() => setCantidad((c) => Math.min(9, c + 1))}
                    aria-label="Agregar uno"
                  >
                    +
                  </button>
                </span>
                <Button
                  className="producto-boton"
                  onClick={() => agregarAlCarrito(producto, cantidad)}
                >
                  <FaCartPlus aria-hidden="true" /> Añadir
                </Button>
                <Button
                  variant="success"
                  className="rounded-pill"
                  onClick={() => setShowModal(true)}
                >
                  <FaSlidersH aria-hidden="true" /> Personalizar
                </Button>
              </div>
            </Card.Body>
          </Col>
        </Row>
      </Card>

      <Row className="g-3 mb-4">
        <Col md={7}>
          <Card className="card-comi p-4 h-100">
            <span className="detalle-etiqueta">Ingredientes</span>
            {ingredientes.length > 0 ? (
              <div className="d-flex flex-wrap gap-2">
                {ingredientes.map((nombre) => (
                  <span key={nombre} className="ing-chip">
                    {nombre}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-muted small mb-0">La composición está descrita arriba.</p>
            )}
            {ingredientes.length > 0 && (
              <p className="text-muted small mt-3 mb-0">
                ¿Sacás o agregás algo? Personalizalo a tu gusto.
              </p>
            )}
          </Card>
        </Col>
        <Col md={5}>
          <Card className="card-comi p-4 h-100">
            <span className="detalle-etiqueta">Tu pedido</span>

            <div className="tu-pedido-bloque">
              <div className="tu-pedido-fila">
                <span className="tu-pedido-titulo">
                  <FaTruck aria-hidden="true" /> Envío
                </span>
                <strong
                  className={
                    envioMostrado === 0
                      ? 'tu-pedido-valor tu-pedido-valor--gratis'
                      : 'tu-pedido-valor'
                  }
                >
                  {envioMostrado === 0 ? 'Gratis' : formatPrice(envioMostrado)}
                </strong>
              </div>

              {envioMostrado > 0 && envioGratisDesde > 0 && (
                <p className="tu-pedido-linea mb-0">
                  Gratis desde {formatPrice(envioGratisDesde)}.
                </p>
              )}

              {envioMostrado > 0 && hayCarrito && (
                <>
                  <div
                    className="envio-barra"
                    role="progressbar"
                    aria-valuemin={0}
                    aria-valuemax={envioGratisDesde}
                    aria-valuenow={Math.min(totalCarrito, envioGratisDesde)}
                    aria-label={`Progreso hacia el envío gratis: ${progresoEnvio}%`}
                  >
                    <span className="envio-barra-fill" style={{ width: `${progresoEnvio}%` }} />
                  </div>
                  <p className="tu-pedido-linea mb-0">
                    Te faltan {formatPrice(faltaParaEnvioGratis)} para el envío gratis.
                  </p>
                </>
              )}
            </div>

            {promocion && (
              <div className="tu-pedido-promo">
                <span className="tu-pedido-titulo">
                  <FaTag aria-hidden="true" /> Promoción
                </span>
                <p className="tu-pedido-texto mb-1">
                  {promocion.tipo === 'DOS_POR_UNO'
                    ? '2x1 en este producto'
                    : `${Math.round(Number(promocion.valor))}% de descuento`}
                </p>
                <p className="tu-pedido-linea mb-0">
                  {promocion.tipo === 'DOS_POR_UNO'
                    ? unidadesEnCarrito === 1
                      ? 'Ya tenés 1 unidad en el carrito: sumá otra y pagás una.'
                      : 'Llevá 2 unidades y pagás 1.'
                    : 'Se aplica en el carrito sobre este producto.'}
                </p>
              </div>
            )}
          </Card>
        </Col>
      </Row>

      <Card className="card-comi p-4 mb-4">
        {mensajeResenas && (
          <Alert
            variant="success"
            dismissible
            onClose={() => setMensajeResenas('')}
            className="py-2"
          >
            {mensajeResenas}
          </Alert>
        )}
        {errorResenas && (
          <Alert variant="danger" dismissible onClose={() => setErrorResenas('')} className="py-2">
            {errorResenas}
          </Alert>
        )}
        <ListaResenas
          datos={resenas}
          cargando={cargandoResenas}
          miResena={miResena}
          puedeResenar={puedeResenar}
          onEscribir={() => {
            setResenaAEditar(null);
            setModalResena(true);
          }}
          onEditar={(resena) => {
            setResenaAEditar(resena);
            setModalResena(true);
          }}
          onEliminar={(resena) => setResenaABorrar(resena)}
          verTodasHref={`/producto/${id}/resenas`}
        />
      </Card>

      {combosQueLoIncluyen.length > 0 && (
        <>
          <h3 className="fw-bold mb-3">Combos que lo incluyen</h3>
          <Row className="g-3 mb-4">
            {combosQueLoIncluyen.map((combo) => (
              <Col key={combo.id} xs={6} md={4}>
                <ProductoCard producto={combo} />
              </Col>
            ))}
          </Row>
        </>
      )}

      {relacionados.length > 0 && (
        <>
          <h3 className="fw-bold mb-3">También podrían gustarte</h3>
          <Row className="g-3">
            {relacionados.map((rel) => (
              <Col key={rel.id} xs={6} md={4}>
                <ProductoCard producto={rel} />
              </Col>
            ))}
          </Row>
        </>
      )}

      <ProductoPersonalizarModal
        show={showModal}
        onHide={() => setShowModal(false)}
        producto={producto}
      />

      <ResenaModal
        mostrar={modalResena}
        producto={producto}
        resena={resenaAEditar}
        onGuardada={alGuardarResena}
        onCerrar={() => {
          setModalResena(false);
          setResenaAEditar(null);
        }}
      />

      <ConfirmarModal
        mostrar={Boolean(resenaABorrar)}
        titulo="Eliminar reseña"
        mensaje="¿Querés eliminar tu reseña? Esta acción no se puede deshacer."
        textoConfirmar="Sí, eliminar"
        cargando={borrandoResena}
        onConfirmar={confirmarBorradoResena}
        onCancelar={() => setResenaABorrar(null)}
      />
    </Container>
  );
};

export default DetalleProducto;

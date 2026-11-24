/**
 * Propósito: Página "Mis cupones" del CLIENTE con cuatro pestañas:
 *            Disponibles, Todas, Usados y Vencidos.
 * Contenido: Grilla de tickets clickeables (beneficio, campaña, código,
 *            condiciones y vencimiento) con detalle en una sola tarjeta dentro
 *            de ModalBase. El código es sólo información: se aplica el cupón
 *            desde "Usar en carrito", sin acción de copiado en la interfaz.
 * Dependencias: react-bootstrap, react-router-dom, TanStack Query,
 *               react-icons, api/cupones, componentes comunes.
 * Uso: Ruta "/cliente/mis-cupones" → <MisCupones />
 */

import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Row, Col, Container, Alert, Badge, Nav, Card,
} from 'react-bootstrap';
import { FaTag, FaShoppingCart, FaInfoCircle } from 'react-icons/fa';
import ModalBase from '../../components/comunes/ModalBase';
import {
  useCategorias,
  useCuponesClienteQuery,
  useProductos,
} from '../../hooks/queries';
import { formatDateTime, formatPrice } from '../../utils/formatters';
import { SkeletonTarjeta } from '../../components/comunes/Skeleton';
import './MisCupones.css';

// La navegación muestra sólo los estados que el cliente necesita consultar
// por separado; "En uso" y "Anulado" siguen existiendo en el backend y se
// listan únicamente dentro de "Todas" (no se altera ningún estado ni registro).
const PESTANAS = [
  { clave: 'disponible', etiqueta: 'Disponibles' },
  { clave: 'todas', etiqueta: 'Todas' },
  { clave: 'usado', etiqueta: 'Usados' },
  { clave: 'vencido', etiqueta: 'Vencidos' },
];

const VARIANTE_ESTADO = {
  DISPONIBLE: 'primary',
  EN_USO: 'warning',
  USADO: 'success',
  VENCIDO: 'secondary',
  ANULADO: 'danger',
};

// Los cupones que ya no se pueden usar se presentan con el talón apagado,
// manteniendo la paleta de la marca en lugar de introducir otros colores.
const ESTADOS_INACTIVOS = new Set(['USADO', 'VENCIDO', 'ANULADO']);

const textoValor = (cupon) =>
  cupon.tipoDescuento === 'PORCENTAJE'
    ? `${Number(cupon.valorDescuento)}%`
    : `$${Number(cupon.valorDescuento)}`;

/**
 * Vencimiento con fecha y hora en la zona horaria que usa toda la app
 * (`formatDateTime`). Si el snapshot no trae `fechaFin`, no se inventa un
 * horario: se muestra el guion.
 */
const textoVencimiento = (cupon) => {
  if (!cupon?.fechaFin) return '—';
  const fecha = new Date(cupon.fechaFin);
  if (Number.isNaN(fecha.getTime())) return '—';
  return formatDateTime(fecha);
};

const idsValidos = (valor) =>
  (Array.isArray(valor) ? valor : [])
    .map(Number)
    .filter((id) => Number.isInteger(id) && id > 0);

const nombresPorIds = (lista, ids) =>
  ids
    .map((id) => lista.find((elemento) => Number(elemento.id) === id)?.nombre)
    .filter(Boolean);

/**
 * Resuelve los nombres del alcance congelado del cupón. Las emisiones nuevas
 * guardan IDs de categorías y productos; las heredadas pueden no tener alcance
 * (global), en cuyo caso no hay restricción que mostrar.
 */
const alcanceDelCupon = (cupon, categorias, productos) => {
  const alcance = cupon?.alcanceSnapshot;
  if (!alcance || alcance.global === true) return null;

  const categoriaIds = idsValidos(alcance.categoriaIds);
  const productoIds = idsValidos(
    alcance.productoIdsResueltos?.length
      ? alcance.productoIdsResueltos
      : alcance.productoIds
  );
  if (categoriaIds.length === 0 && productoIds.length === 0) return null;

  const categoriasNombres = nombresPorIds(categorias, categoriaIds);
  const productosNombres = nombresPorIds(productos, productoIds);

  return {
    categorias: categoriasNombres,
    categoriasFaltantes: Math.max(0, categoriaIds.length - categoriasNombres.length),
    productos: productosNombres,
    productosFaltantes: Math.max(0, productoIds.length - productosNombres.length),
  };
};

const MisCupones = () => {
  const { data: cupones = [], isPending: cargando, error: errorQuery } =
    useCuponesClienteQuery();
  // El detalle usa los mismos catálogos que el carrito para nombrar los
  // productos/categorías alcanzados por el snapshot del cupón.
  const { data: categorias = [] } = useCategorias({ incluirInactivas: true });
  const { data: productos = [] } = useProductos();
  const [pestanaActiva, setPestanaActiva] = useState('disponible');
  const [cuponSeleccionadoId, setCuponSeleccionadoId] = useState(null);

  const error = errorQuery?.message || '';

  // Una sola definición para filtrar y para contar: así el badge de cada
  // pestaña siempre coincide con las tarjetas que muestra.
  const cantidadPorPestana = (clave) =>
    clave === 'todas'
      ? cupones.length
      : cupones.filter((c) => c.estado === clave.toUpperCase()).length;

  const filtrados = useMemo(() => {
    if (pestanaActiva === 'todas') return cupones;
    return cupones.filter((c) => c.estado === pestanaActiva.toUpperCase());
  }, [cupones, pestanaActiva]);

  // Se guarda sólo el ID: si llega un aviso de Socket.IO y la query se
  // reconsulta, el modal muestra el cupón actualizado sin quedar congelado.
  const cuponSeleccionado = useMemo(
    () => cupones.find((c) => c.id === cuponSeleccionadoId) || null,
    [cupones, cuponSeleccionadoId]
  );

  const alcance = cuponSeleccionado
    ? alcanceDelCupon(cuponSeleccionado, categorias, productos)
    : null;

  const abrirDetalle = (cupon) => setCuponSeleccionadoId(cupon.id);

  const manejarTeclaTarjeta = (evento, cupon) => {
    if (evento.key === 'Enter' || evento.key === ' ') {
      evento.preventDefault();
      abrirDetalle(cupon);
    }
  };

  if (cargando) {
    return (
      <Container className="py-4">
        <div role="status" aria-live="polite">
          <span className="visually-hidden">Cargando tus cupones…</span>
          <Row className="g-4">
            {[1, 2, 3, 4].map((n) => (
              <Col key={n} md={6} xl={3}>
                <SkeletonTarjeta />
              </Col>
            ))}
          </Row>
        </div>
      </Container>
    );
  }

  return (
    <Container className="mis-cupones">
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <h1 className="h2 mb-0">Mis Cupones</h1>
      </div>

      {error && <Alert variant="danger" role="alert">{error}</Alert>}

      <Nav
        variant="tabs"
        fill
        className="mb-4 mis-cupones-nav"
        activeKey={pestanaActiva}
        onSelect={setPestanaActiva}
      >
        {PESTANAS.map((p) => (
          <Nav.Item key={p.clave}>
            <Nav.Link eventKey={p.clave}>
              <span>{p.etiqueta}</span>
              <span className="badge bg-light text-dark ms-1">
                {cantidadPorPestana(p.clave)}
              </span>
            </Nav.Link>
          </Nav.Item>
        ))}
      </Nav>

      {filtrados.length === 0 ? (
        <div className="text-center text-muted py-5">
          <FaTag size={48} className="mb-3 opacity-25" aria-hidden="true" />
          <h3 className="h5">
            {pestanaActiva === 'todas'
              ? 'No tenés cupones aún.'
              : `No tenés cupones en estado "${PESTANAS.find((p) => p.clave === pestanaActiva)?.etiqueta.toLowerCase()}".`}
          </h3>
          <p className="text-muted">
            Los cupones que te envíen por email aparecen aquí con su estado y
            podrás aplicarlos al carrito al hacer un pedido.
          </p>
        </div>
      ) : (
        <Row className="g-4">
          {filtrados.map((cupon) => (
            <Col key={cupon.id} md={6} xl={4}>
              <article
                role="button"
                tabIndex={0}
                aria-label={`Ver detalle del cupón ${cupon.codigo}`}
                className={`cupon-tarjeta${
                  ESTADOS_INACTIVOS.has(cupon.estado)
                    ? ' cupon-tarjeta--inactivo'
                    : ''
                }`}
                onClick={() => abrirDetalle(cupon)}
                onKeyDown={(evento) => manejarTeclaTarjeta(evento, cupon)}
              >
                <div className="cupon-tarjeta__talon" aria-hidden="true">
                  <span className="cupon-tarjeta__marca">Comi-Rapi</span>
                  <span className="cupon-tarjeta__descuento">
                    {textoValor(cupon)}
                  </span>
                  <span className="cupon-tarjeta__talon-label">
                    de descuento
                  </span>
                </div>

                <div className="cupon-tarjeta__cuerpo">
                  <div className="cupon-tarjeta__cabecera">
                    <Badge bg={VARIANTE_ESTADO[cupon.estado] || 'secondary'}>
                      {cupon.estado}
                    </Badge>
                    <Badge
                      bg="light"
                      text="dark"
                      className="cupon-tarjeta__uso-unico"
                    >
                      USO ÚNICO
                    </Badge>
                  </div>

                  <h2 className="cupon-tarjeta__titulo">
                    {cupon.emision?.nombre || 'Cupón'}
                  </h2>

                  <div className="cupon-tarjeta__codigo">
                    <small>Código</small>
                    <span className="cupon-tarjeta__codigo-valor">
                      {cupon.codigo}
                    </span>
                  </div>

                  <div className="cupon-tarjeta__meta">
                    <div className="cupon-tarjeta__dato">
                      <small>Compra mínima</small>
                      <span>
                        {Number(cupon.compraMinima) > 0
                          ? formatPrice(cupon.compraMinima)
                          : 'Sin mínimo'}
                      </span>
                    </div>
                    <div className="cupon-tarjeta__dato">
                      <small>Vence el</small>
                      <span>{textoVencimiento(cupon)}</span>
                    </div>
                  </div>

                  {cupon.estado === 'DISPONIBLE' && (
                    <div className="cupon-tarjeta__acciones">
                      <Link
                        to="/cliente/carrito"
                        className="btn btn-primary btn-sm"
                        onClick={(evento) => evento.stopPropagation()}
                      >
                        <FaShoppingCart aria-hidden="true" /> Usar en carrito
                      </Link>
                    </div>
                  )}
                </div>
              </article>
            </Col>
          ))}
        </Row>
      )}

      <ModalBase
        mostrar={cuponSeleccionadoId !== null}
        onCerrar={() => setCuponSeleccionadoId(null)}
        titulo="Detalle del cupón"
        tamano="lg"
        variante="fullscreen-mobile"
        dialogClassName="cupon-detalle-modal"
        footer={
          cuponSeleccionado?.estado === 'DISPONIBLE' ? (
            <Link
              to="/cliente/carrito"
              className="btn btn-primary"
              onClick={() => setCuponSeleccionadoId(null)}
            >
              <FaShoppingCart aria-hidden="true" /> Usar en carrito
            </Link>
          ) : null
        }
      >
        {!cuponSeleccionado ? (
          <Alert variant="info" className="mb-0" role="status">
            Este cupón ya no está disponible.
          </Alert>
        ) : (
          <Card className="cupon-detalle">
            <Card.Body>
              <div className="cupon-detalle__encabezado">
                <div className="cupon-detalle__valor">
                  {textoValor(cuponSeleccionado)}
                </div>
                <div className="min-w-0">
                  <h2 className="h5 mb-1">
                    {cuponSeleccionado.emision?.nombre || 'Cupón'}
                  </h2>
                  <div className="d-flex flex-wrap align-items-center gap-2">
                    <Badge
                      bg={
                        VARIANTE_ESTADO[cuponSeleccionado.estado] || 'secondary'
                      }
                    >
                      {cuponSeleccionado.estado}
                    </Badge>
                    <Badge
                      bg="light"
                      text="dark"
                      className="cupon-detalle__uso-unico"
                    >
                      USO ÚNICO
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="cupon-detalle__seccion">
                <h3><FaTag aria-hidden="true" /> Código</h3>
                <div className="cupon-detalle__codigo">
                  <span className="cupon-detalle__codigo-valor">
                    {cuponSeleccionado.codigo}
                  </span>
                </div>
              </div>

              <div className="cupon-detalle__seccion">
                <h3><FaInfoCircle aria-hidden="true" /> Condiciones</h3>
                <div className="cupon-detalle__datos">
                  <div className="cupon-detalle__dato">
                    <small>Tipo de descuento</small>
                    <strong>
                      {cuponSeleccionado.tipoDescuento === 'PORCENTAJE'
                        ? 'Porcentaje'
                        : 'Monto fijo'}
                    </strong>
                  </div>
                  <div className="cupon-detalle__dato">
                    <small>Compra mínima</small>
                    <strong>
                      {Number(cuponSeleccionado.compraMinima) > 0
                        ? formatPrice(cuponSeleccionado.compraMinima)
                        : 'Sin mínimo'}
                    </strong>
                  </div>
                  <div className="cupon-detalle__dato">
                    <small>Tope de descuento</small>
                    <strong>
                      {cuponSeleccionado.descuentoMaximo != null
                        ? formatPrice(cuponSeleccionado.descuentoMaximo)
                        : 'Sin tope'}
                    </strong>
                  </div>
                  <div className="cupon-detalle__dato">
                    <small>Vence el</small>
                    <strong>{textoVencimiento(cuponSeleccionado)}</strong>
                  </div>
                </div>
              </div>

              <div className="cupon-detalle__seccion">
                <h3>Alcance</h3>
                {alcance ? (
                  <div className="cupon-detalle__alcance">
                    {alcance.categorias.length > 0 && (
                      <p className="mb-2">
                        <strong>Categorías:</strong>{' '}
                        {alcance.categorias.join(', ')}
                      </p>
                    )}
                    {alcance.categoriasFaltantes > 0 && (
                      <p className="mb-2 text-muted">
                        {alcance.categoriasFaltantes} categoría(s) más.
                      </p>
                    )}
                    {alcance.productos.length > 0 && (
                      <p className="mb-2">
                        <strong>Productos:</strong>{' '}
                        {alcance.productos.join(', ')}
                      </p>
                    )}
                    {alcance.productosFaltantes > 0 && (
                      <p className="mb-2 text-muted">
                        {alcance.productosFaltantes} producto(s) más.
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="mb-0 text-muted">
                    Válido para todos los productos.
                  </p>
                )}
              </div>
            </Card.Body>
          </Card>
        )}
      </ModalBase>
    </Container>
  );
};

export default MisCupones;

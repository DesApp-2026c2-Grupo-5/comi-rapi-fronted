import { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Container, Row, Col, Card, Badge, Button, Spinner, Alert } from 'react-bootstrap';
import { FaCartPlus, FaSlidersH } from 'react-icons/fa';
import { obtenerProductoPorId, obtenerProductos } from '../../api/productos';
import { obtenerPorProducto } from '../../api/personalizacion';
import { obtenerPromociones, obtenerProductosDePromocion } from '../../api/promociones';
import { useCarrito } from '../../hooks/useCarrito';
import { formatPrice } from '../../utils/formatters';
import ProductoCard from '../../components/cliente/ProductoCard';
import ProductoPersonalizarModal from '../../components/cliente/ProductoPersonalizarModal';
import './DetalleProducto.css';

// Reseñas fijas (demo): Calificación es Propuesta 2, excluida por AGENTS.md.
// Cuando exista la entidad real, reemplazar por GET de reseñas del producto.
const RESENAS_DEMO = [
  { nombre: 'María G.', fecha: 'hace 2 días', estrellas: 5, texto: 'La mejor hamburguesa del barrio, el pan es increíble.' },
  { nombre: 'Juan P.', fecha: 'hace 1 semana', estrellas: 4, texto: 'Riquísima, llegó caliente. Le sacaría un poco de sal.' },
  { nombre: 'Lucía F.', fecha: 'hace 2 semanas', estrellas: 5, texto: 'El cheddar fundido es un 10. Vuelvo seguro.' },
];

const promedioDemo = RESENAS_DEMO.reduce((acc, r) => acc + r.estrellas, 0) / RESENAS_DEMO.length;

const DetalleProducto = () => {
  const { id } = useParams();
  const { agregarAlCarrito } = useCarrito();
  const [producto, setProducto] = useState(null);
  const [personalizacion, setPersonalizacion] = useState([]);
  const [relacionados, setRelacionados] = useState([]);
  const [promocion, setPromocion] = useState(undefined);
  const [cantidad, setCantidad] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const cargar = async () => {
      setCargando(true);
      setError('');
      setCantidad(1);
      const [resProducto, resProductos, resPromos] = await Promise.all([
        obtenerProductoPorId(id),
        obtenerProductos(),
        obtenerPromociones(),
      ]);
      if (!resProducto.success) {
        setError(resProducto.error || 'Producto no encontrado.');
        setCargando(false);
        return;
      }
      const prod = resProducto.data;
      setProducto(prod);
      // El show ya trae la personalización activa; solo se consulta aparte
      // si viniera sin ella (compatibilidad).
      if (Array.isArray(prod.personalizacion)) {
        setPersonalizacion(prod.personalizacion);
      } else {
        const resPers = await obtenerPorProducto(id);
        if (resPers.success) setPersonalizacion(resPers.data);
      }
      if (resProductos.success) {
        setRelacionados(
          resProductos.data
            .filter((p) => p.categoriaId === prod.categoriaId && String(p.id) !== String(prod.id) && p.activo !== false)
            .slice(0, 3)
        );
      }
      // Mejor promoción activa que alcanza a este producto (misma regla que
      // el catálogo: mayor descuento; 2x1 equivale a 50%).
      if (resPromos.success) {
        const equiv = (promo) => (promo.tipo === 'DOS_POR_UNO' ? 50 : Number(promo.valor));
        const listas = await Promise.all(
          resPromos.data.map(async (promo) => {
            const r = await obtenerProductosDePromocion(promo.id);
            return r.success && r.data.some((p) => String(p.id) === String(prod.id)) ? promo : null;
          })
        );
        const mejor = listas.filter(Boolean).sort((a, b) => equiv(b) - equiv(a))[0];
        setPromocion(mejor);
      }
      setCargando(false);
    };
    cargar();
  }, [id]);

  const ingredientes = useMemo(() => {
    if (!producto) return [];
    if (producto.tipo === 'COMBO' && Array.isArray(producto.componentes)) {
      return producto.componentes.map((c) => c.nombre || `producto ${c.productoId}`);
    }
    return (personalizacion || [])
      .filter((e) => e.tipo === 'personalizar' && e.activo !== false)
      .map((e) => e.nombre);
  }, [producto, personalizacion]);

  const acompanamientos = useMemo(
    () => (personalizacion || []).filter((e) => e.tipo === 'acompanar' && e.activo !== false),
    [personalizacion]
  );

  const precioConDescuento =
    promocion && promocion.tipo === 'DESCUENTO_PORCENTUAL'
      ? Number(producto?.precio) * (1 - Number(promocion.valor) / 100)
      : null;

  if (cargando) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" variant="danger" />
      </Container>
    );
  }

  if (error || !producto) {
    return (
      <Container className="py-5 text-center">
        <Alert variant="danger">{error || 'Producto no encontrado.'}</Alert>
        <Link to="/cliente/catalogo" className="boton-volver">← Volver al catálogo</Link>
      </Container>
    );
  }

  return (
    <Container className="py-4 detalle-producto">
      <div className="mb-3">
        <Link to="/cliente/catalogo" className="boton-volver">← Volver al catálogo</Link>
      </div>

      <Card className="detalle-card mb-4">
        <Row className="g-0">
          <Col md={5} className="position-relative">
            <Card.Img src={producto.imagen} alt={producto.nombre} className="detalle-hero-img" />
            {promocion && (
              <span className="promo-badge position-absolute" style={{ top: 12, right: 12 }}>
                {promocion.tipo === 'DOS_POR_UNO' ? '2x1' : `-${Math.round(Number(promocion.valor))}%`}
              </span>
            )}
          </Col>
          <Col md={7}>
            <Card.Body className="p-4 d-flex flex-column h-100">
              {producto.categoria && <Badge bg="light" text="dark" className="badge-comi align-self-start mb-2">{producto.categoria}</Badge>}
              <Card.Title as="h1">{producto.nombre}</Card.Title>
              <div className="mb-2">
                <span className="estrellas">★★★★☆</span>{' '}
                <strong>{promedioDemo.toFixed(1)}</strong>{' '}
                <span className="text-muted small">({RESENAS_DEMO.length} reseñas)</span>
              </div>
              <Card.Text className="text-muted flex-grow-1">{producto.descripcion}</Card.Text>
              <div className="mb-3">
                {precioConDescuento !== null && (
                  <span className="precio-tachado me-2">{formatPrice(producto.precio)}</span>
                )}
                <span className="precio-destacado">{formatPrice(precioConDescuento ?? producto.precio)}</span>
              </div>
              <div className="d-flex gap-2 align-items-center flex-wrap">
                <span className="pill-control">
                  <button type="button" onClick={() => setCantidad((c) => Math.max(1, c - 1))} aria-label="Quitar uno">−</button>
                  <span>{cantidad}</span>
                  <button type="button" onClick={() => setCantidad((c) => Math.min(9, c + 1))} aria-label="Agregar uno">+</button>
                </span>
                <Button className="producto-boton" onClick={() => agregarAlCarrito(producto, cantidad)}>
                  <FaCartPlus aria-hidden="true" /> Añadir
                </Button>
                <Button variant="success" className="rounded-pill" onClick={() => setShowModal(true)}>
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
                  <span key={nombre} className="ing-chip">{nombre}</span>
                ))}
              </div>
            ) : (
              <p className="text-muted small mb-0">La composición está descrita arriba.</p>
            )}
            <p className="text-muted small mt-3 mb-0">¿Sacás o agregás algo? Personalizalo a tu gusto.</p>
          </Card>
        </Col>
        <Col md={5}>
          <Card className="card-comi p-4 h-100">
            <span className="detalle-etiqueta">Con qué acompañar</span>
            {acompanamientos.length > 0 ? (
              acompanamientos.map((a) => (
                <div key={a.id} className="acomp-item">
                  <span>{a.nombre} <small className="text-muted">+{formatPrice(a.precio)}</small></span>
                </div>
              ))
            ) : (
              <p className="text-muted small mb-0">Este producto no tiene acompañamientos sugeridos.</p>
            )}
          </Card>
        </Col>
      </Row>

      {promocion && (
        <div className="promo-box mb-4">
          <span className="detalle-etiqueta">Promoción</span>
          <div className="fw-bold">
            {promocion.tipo === 'DOS_POR_UNO' ? '2x1: llevás 2 y pagás 1' : `${Math.round(Number(promocion.valor))}% OFF`} <Badge bg="light" text="dark" className="badge-comi ms-1">{promocion.nombre}</Badge>
          </div>
          <div className="text-muted small">El descuento se aplica solo. En combos no aplica: el combo ya es la promoción.</div>
        </div>
      )}

      <Card className="card-comi p-4 mb-4">
        <span className="detalle-etiqueta">Reseñas de clientes <Badge bg="secondary" className="ms-1">demo</Badge></span>
        {RESENAS_DEMO.map((r) => (
          <div key={r.nombre} className="resena">
            <div>
              <span className="estrellas">{'★'.repeat(r.estrellas)}{'☆'.repeat(5 - r.estrellas)}</span>{' '}
              <strong>{r.nombre}</strong> <small className="text-muted">· {r.fecha}</small>
            </div>
            <div>{r.texto}</div>
          </div>
        ))}
      </Card>

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

      <ProductoPersonalizarModal show={showModal} onHide={() => setShowModal(false)} producto={producto} />
    </Container>
  );
};

export default DetalleProducto;

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Container, Row, Col, Card, Badge, Button, Alert } from 'react-bootstrap';
import { FaCartPlus, FaSlidersH } from 'react-icons/fa';
import { obtenerProductoPorId, obtenerProductos } from '../../api/productos';
import { obtenerPorProducto } from '../../api/personalizacion';
import { obtenerPromociones, obtenerProductosDePromocion } from '../../api/promociones';
import {
  eliminarResena,
  obtenerMisResenas,
  obtenerProductosElegiblesParaResenar,
  obtenerResenasDeProducto,
} from '../../api/resenas';
import { useCarrito } from '../../hooks/useCarrito';
import { useAuth } from '../../hooks/useAuth';
import { formatPrice } from '../../utils/formatters';
import ProductoCard from '../../components/cliente/ProductoCard';
import { SkeletonDetalleProducto } from '../../components/comunes/Skeleton';
import ProductoPersonalizarModal from '../../components/cliente/ProductoPersonalizarModal';
import Estrellas from '../../components/cliente/Estrellas';
import ListaResenas from '../../components/cliente/ListaResenas';
import ResenaModal from '../../components/cliente/ResenaModal';
import ConfirmarModal from '../../components/comunes/ConfirmarModal';
import './DetalleProducto.css';
import { conectarSocket, EVENTOS_SOCKET } from '../../services/socket';

const DetalleProducto = () => {
  const { id } = useParams();
  const { agregarAlCarrito } = useCarrito();
  const { hydrated, isAuthenticated, isCliente } = useAuth();
  const [producto, setProducto] = useState(null);
  const [personalizacion, setPersonalizacion] = useState([]);
  const [relacionados, setRelacionados] = useState([]);
  const [promocion, setPromocion] = useState(undefined);
  const [cantidad, setCantidad] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  // Reseñas: listado público paginado, resumen, la reseña propia (si existe) y
  // si este cliente puede escribir una (compró y recibió el producto).
  const [resenas, setResenas] = useState(null);
  const [cargandoResenas, setCargandoResenas] = useState(true);
  const [cargandoMasResenas, setCargandoMasResenas] = useState(false);
  const [miResena, setMiResena] = useState(null);
  const [puedeResenar, setPuedeResenar] = useState(false);
  const [modalResena, setModalResena] = useState(false);
  const [resenaAEditar, setResenaAEditar] = useState(null);
  const [resenaABorrar, setResenaABorrar] = useState(null);
  const [borrandoResena, setBorrandoResena] = useState(false);
  const [mensajeResenas, setMensajeResenas] = useState('');
  const [errorResenas, setErrorResenas] = useState('');

  // `conIndicador` enciende el spinner y reinicia la cantidad: es para la carga
  // visible (entrada a la página o cambio de producto). Un refresco silencioso
  // (conIndicador=false) actualiza el contenido en el lugar, sin spinner ni
  // resetear la cantidad que el cliente ya eligió.
  const cargar = useCallback(async (conIndicador = true) => {
    if (conIndicador) {
      setCargando(true);
      setError('');
      setCantidad(1);
    }
    const [resProducto, resProductos, resPromos] = await Promise.all([
      obtenerProductoPorId(id),
      obtenerProductos(),
      obtenerPromociones(),
    ]);
    if (!resProducto.success) {
      // En silencio no se pisa la vista buena con un error de red transitorio.
      if (conIndicador) {
        setError(resProducto.error || 'Producto no encontrado.');
        setCargando(false);
      }
      return;
    }
    const prod = resProducto.data;
    setError('');
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
    if (conIndicador) setCargando(false);
  }, [id]);

  const cargarResenas = useCallback(async () => {
    setCargandoResenas(true);
    setMensajeResenas('');
    setErrorResenas('');
    // Al cambiar de producto no se muestran las reseñas del anterior mientras
    // llega la respuesta.
    setResenas(null);
    const res = await obtenerResenasDeProducto(id, { pagina: 1, limite: 10 });
    if (res.success) setResenas(res.data);
    setCargandoResenas(false);
  }, [id]);

  const cargarMasResenas = useCallback(async () => {
    if (!resenas || resenas.pagina >= resenas.paginas) return;
    setCargandoMasResenas(true);
    const res = await obtenerResenasDeProducto(id, {
      pagina: resenas.pagina + 1,
      limite: resenas.limite,
    });
    if (res.success) {
      setResenas((prev) => ({
        ...res.data,
        items: [...(prev?.items || []), ...res.data.items],
      }));
    }
    setCargandoMasResenas(false);
  }, [id, resenas]);

  // Elegibilidad y reseña propia: solo para CLIENTE con sesión. El backend es
  // el que manda (403 si no compró), esto solo decide qué botones mostrar.
  const cargarElegibilidad = useCallback(async () => {
    if (!hydrated || !isAuthenticated || !isCliente) {
      setPuedeResenar(false);
      setMiResena(null);
      return;
    }
    const [resElegibles, resMias] = await Promise.all([
      obtenerProductosElegiblesParaResenar(),
      obtenerMisResenas(),
    ]);
    if (resElegibles.success) {
      setPuedeResenar(
        resElegibles.data.some((p) => String(p.productoId) === String(id))
      );
    }
    if (resMias.success) {
      setMiResena(
        resMias.data.find((r) => String(r.productoId) === String(id)) || null
      );
    }
  }, [hydrated, isAuthenticated, isCliente, id]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  useEffect(() => {
    cargarResenas();
  }, [cargarResenas]);

  useEffect(() => {
    cargarElegibilidad();
  }, [cargarElegibilidad]);

  useEffect(() => {
    if (!hydrated || !isAuthenticated) return undefined;
    const instancia = conectarSocket();
    // Resincroniza por REST al reconectar y al cambiar de producto (id): si se
    // perdió un cambio durante una desconexión, el aviso no llegó. La carga
    // inicial la hace el useEffect de arriba, por eso no se pide aquí.
    const alConectar = () => cargar();
    // catalogo_actualizado sólo avisa {tipo, id, accion}: se relee el producto
    // (y sus relacionados/promoción) en silencio, sin spinner y sin tocar la
    // cantidad elegida.
    const alCat = () => cargar(false);
    instancia.on('connect', alConectar);
    instancia.on(EVENTOS_SOCKET.CATALOGO_ACTUALIZADO, alCat);
    return () => {
      instancia.off('connect', alConectar);
      instancia.off(EVENTOS_SOCKET.CATALOGO_ACTUALIZADO, alCat);
    };
  }, [hydrated, isAuthenticated, cargar]);

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

  const alGuardarResena = async () => {
    const editando = Boolean(resenaAEditar);
    setModalResena(false);
    setResenaAEditar(null);
    setErrorResenas('');
    setMensajeResenas(
      editando ? 'Tu reseña se actualizó.' : 'Tu reseña se publicó.'
    );
    await Promise.all([cargarResenas(), cargarElegibilidad()]);
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
    await Promise.all([cargarResenas(), cargarElegibilidad()]);
  };

  const precioConDescuento =
    promocion && promocion.tipo === 'DESCUENTO_PORCENTUAL'
      ? Number(producto?.precio) * (1 - Number(promocion.valor) / 100)
      : null;

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
              <div className="mb-2 d-flex align-items-center gap-2 flex-wrap">
                {resenas && resenas.cantidad > 0 ? (
                  <>
                    <Estrellas valor={resenas.promedio} tamano={16} />
                    <strong>{Number(resenas.promedio).toFixed(1)}</strong>
                    <span className="text-muted small">
                      ({resenas.cantidad}{' '}
                      {resenas.cantidad === 1 ? 'reseña' : 'reseñas'})
                    </span>
                  </>
                ) : (
                  <span className="text-muted small">
                    Todavía no hay reseñas de este producto.
                  </span>
                )}
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
            {ingredientes.length > 0 && (
              <p className="text-muted small mt-3 mb-0">
                ¿Sacás o agregás algo? Personalizalo a tu gusto.
              </p>
            )}
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
          <div className="text-muted small">Aprovechá esta increíble oferta.</div>
        </div>
      )}

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
          <Alert
            variant="danger"
            dismissible
            onClose={() => setErrorResenas('')}
            className="py-2"
          >
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
          onVerMas={cargarMasResenas}
          cargandoMas={cargandoMasResenas}
        />
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

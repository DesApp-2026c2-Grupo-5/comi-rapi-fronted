/**
 * Propósito: Página de detalle de una emisión de cupones para el
 *            SUPERADMINISTRADOR.
 * Contenido: Configuración original de la emisión (snapshot persistido),
 *            resultados (elegibles, generados, enviados, fallidos) y
 *            clientes agrupados según el estado de sus cupones
 *            (disponibles, en uso, usados, vencidos, programados).
 *            Se puede consultar aunque la emisión haya finalizado.
 * Dependencias: react-bootstrap, react-router-dom, TanStack Query,
 *               react-icons, api/cupones, hooks/queries.
 * Uso: Ruta "/superadmin/cupones/emisiones/:id".
 */

import { useState, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Container, Row, Col, Card, CardBody, CardTitle, Button, Alert, Table, Badge,
} from 'react-bootstrap';
import { FaEnvelope, FaArrowLeft, FaUsers, FaTags, FaHistory } from 'react-icons/fa';
import {
  useEmisionCuponesQuery,
  useEmisionQuery,
  useReenviarEmision,
} from '../../hooks/queries';

const VARIANTE_ESTADO = {
  EN_PROCESO: 'primary',
  COMPLETADA: 'success',
  CON_ERRORES: 'warning',
};

const VARIANTE_ENVIO = {
  ENVIADO: 'success',
  FALLIDO: 'danger',
  PENDIENTE: 'warning',
};

// Orden requerido de presentación de estados de cupón (vigencia).
const ORDEN_ESTADOS_CUPON = [
  'DISPONIBLE',
  'EN_USO',
  'USADO',
  'VENCIDO',
  'PROGRAMADO',
  'ANULADO',
];
const ESTADOS_CUPON_VALIDOS = new Set(ORDEN_ESTADOS_CUPON);

const VARIANTE_ESTADO_CUPON = {
  DISPONIBLE: 'success',
  EN_USO: 'warning',
  USADO: 'secondary',
  VENCIDO: 'danger',
  PROGRAMADO: 'info',
  ANULADO: 'dark',
};

const ETIQUETA_ESTADO_CUPON = {
  DISPONIBLE: 'Disponibles',
  EN_USO: 'En uso',
  USADO: 'Usados',
  VENCIDO: 'Vencidos',
  PROGRAMADO: 'Programados',
  ANULADO: 'Anulados',
};

const formatearFecha = (valor) => {
  if (!valor) return '—';
  return new Date(valor).toLocaleDateString('es-AR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  });
};

const formatearMonto = (valor) =>
  `$${Number(valor).toLocaleString('es-AR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const textoDescuento = (cupon) =>
  cupon.tipoDescuento === 'PORCENTAJE'
    ? `${Number(cupon.valorDescuento)}%`
    : formatearMonto(cupon.valorDescuento);

const textoVigencia = (cupon) => {
  if (!cupon.fechaInicio && !cupon.fechaFin) return '—';
  return `${formatearFecha(cupon.fechaInicio)} - ${formatearFecha(cupon.fechaFin)}`;
};

const DetalleEmision = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [reenviarError, setReenviarError] = useState('');

  const reenviarMut = useReenviarEmision();
  // Dos fuentes independientes: datos propios de la emisión y cupones
  // complementarios. Ninguna de las dos se invalida por navegar.
  const {
    data: emision,
    isPending: cargandoEmision,
    error: errorEmision,
  } = useEmisionQuery({ id, enabled: Boolean(id) });
  const {
    data: datosCupones,
    isPending: cargandoCupones,
    error: errorCupones,
  } = useEmisionCuponesQuery({ id, enabled: Boolean(id) });

  // Los nombres del alcance viajan con los cupones (donde se resuelven desde
  // el snapshot congelado) y se integran aquí únicamente para renderizar.
  const detalle = useMemo(() => {
    if (!emision) return null;
    return {
      ...emision,
      configuracionSnapshot: {
        ...(emision.configuracionSnapshot || {}),
        alcance: {
          ...(emision.configuracionSnapshot?.alcance || {}),
          ...(datosCupones?.alcance || {}),
        },
      },
    };
  }, [emision, datosCupones]);

  const cupones = useMemo(
    () => (Array.isArray(datosCupones?.cupones) ? datosCupones.cupones : []),
    [datosCupones]
  );
  const detalleIncompleto = cargandoCupones && !datosCupones;

  // Agrupar clientes por estado de vigencia de su cupón, en el orden requerido.
  // El estado ya viene calculado por el backend; se mantiene un fallback
  // conservador para datos históricos que aún no lo traigan.
  const cuponesPorEstado = useMemo(() => {
    const agrupados = {};
    ORDEN_ESTADOS_CUPON.forEach((estado) => { agrupados[estado] = []; });
    const ahora = new Date();
    cupones.forEach((c) => {
      const inicio = c.fechaInicio ? new Date(c.fechaInicio) : null;
      const fin = c.fechaFin ? new Date(c.fechaFin) : null;
      const usos = c.uso || { reservados: 0, confirmados: 0, liberados: 0 };
      let estado = c.estado;
      if (!ESTADOS_CUPON_VALIDOS.has(estado)) {
        estado = 'DISPONIBLE';
        if (c.activo === false) {
          estado = 'ANULADO';
        } else if (fin && ahora > fin) {
          estado = 'VENCIDO';
        } else if (inicio && ahora < inicio) {
          estado = 'PROGRAMADO';
        } else if (usos.confirmados > 0) {
          estado = 'USADO';
        } else if (usos.reservados > 0) {
          estado = 'EN_USO';
        }
      }
      if (!agrupados[estado]) agrupados[estado] = [];
      agrupados[estado].push(c);
    });
    return agrupados;
  }, [cupones]);

  const manejarReenviar = async () => {
    setReenviarError('');
    try {
      const resultado = await reenviarMut.mutateAsync(Number(id));
      if (resultado?.success === false) {
        setReenviarError(resultado.error || 'No se pudo reintentar.');
      }
    } catch (err) {
      setReenviarError(err.message || 'Error al reintentar.');
    }
  };

  if (cargandoEmision) {
    return (
      <Container className="py-4">
        <div className="text-center">Cargando emisión…</div>
      </Container>
    );
  }

  if (errorEmision || !detalle) {
    return (
      <Container className="py-4">
        <Alert variant="danger">
          Emisión no encontrada o error al cargar los datos.
        </Alert>
        <Button variant="secondary" onClick={() => navigate('/superadmin/cupones')}>
          <FaArrowLeft /> Volver a emisiones
        </Button>
      </Container>
    );
  }

  // Mientras llegan los cupones, los totales del listado mantienen el resumen
  // correcto sin esperar a los elementos individuales.
  const enviados = cupones.length
    ? cupones.filter((c) => c.estadoEnvio === 'ENVIADO').length
    : (detalle.cantidadEnviados ?? 0);
  const fallidos = cupones.length
    ? cupones.filter((c) => c.estadoEnvio === 'FALLIDO').length
    : (detalle.cantidadFallidos ?? 0);
  const pendientes = cupones.filter((c) => c.estadoEnvio === 'PENDIENTE').length;

  const alcance = detalle.configuracionSnapshot?.alcance || {};
  const descuento = detalle.configuracionSnapshot?.descuento || {};

  return (
    <Container>
      <Row>
        <Col>
          <Card>
            <CardBody>
              <CardTitle className="d-flex justify-content-between align-items-center">
                <span>Emisión: {detalle.nombre}</span>
                <Button variant="outline-secondary" onClick={() => navigate('/superadmin/cupones')}>
                  <FaArrowLeft /> Volver a emisiones
                </Button>
              </CardTitle>
              {reenviarError && <Alert variant="danger" role="alert">{reenviarError}</Alert>}

              {/* Estado general y resumen */}
              <Row className="g-3 mt-4">
                <Col md={3}>
                  <div className="text-center">
                    <div className="text-muted small">Estado</div>
                    <Badge bg={VARIANTE_ESTADO[detalle.estado] || 'secondary'}>
                      {detalle.estado}
                    </Badge>
                  </div>
                </Col>
                <Col md={3}>
                  <div className="text-center">
                    <div className="text-muted small">Clientes elegibles</div>
                    <span className="h4">{detalle.cantidadElegibles}</span>
                  </div>
                </Col>
                <Col md={3}>
                  <div className="text-center">
                    <div className="text-muted small">Cupones generados</div>
                    <span className="h4">{detalle.cantidadCupones}</span>
                  </div>
                </Col>
                <Col md={3}>
                  <div className="text-center">
                    <div className="text-muted small">Enviados / Fallidos</div>
                    <span className="h4">
                      <span className="text-success">{enviados}</span>{' '}
                      /{' '}
                      <span className="text-danger">{fallidos}</span>
                    </span>
                  </div>
                </Col>
              </Row>

              <hr />

              {/* Configuración original (snapshot persistido al emitir) */}
              <CardTitle className="mt-4">
                <FaTags className="me-2" /> Configuración original de la emisión
              </CardTitle>
              <Row className="g-3 mt-3">
                <Col md={6}>
                  <div className="text-muted small">Nombre</div>
                  <div className="fw-bold">{detalle.nombre}</div>
                </Col>
                {detalle.descripcion && (
                  <Col md={6}>
                    <div className="text-muted small">Descripción</div>
                    <div>{detalle.descripcion}</div>
                  </Col>
                )}
                <Col md={4}>
                  <div className="text-muted small">Tipo de descuento</div>
                  <div className="fw-bold">
                    {descuento.tipo || detalle.tipoDescuento}
                  </div>
                </Col>
                <Col md={4}>
                  <div className="text-muted small">Valor del descuento</div>
                  <div className="fw-bold">
                    {descuento.tipo === 'PORCENTAJE'
                      ? `${Number(descuento.valor || detalle.valorDescuento)}%`
                      : formatearMonto(descuento.valor ?? detalle.valorDescuento)}
                  </div>
                </Col>
                <Col md={4}>
                  <div className="text-muted small">Compra mínima</div>
                  <div className="fw-bold">
                    {Number(descuento.compraMinima ?? detalle.compraMinima) > 0
                      ? formatearMonto(descuento.compraMinima ?? detalle.compraMinima)
                      : '—'}
                  </div>
                </Col>
                <Col md={4}>
                  <div className="text-muted small">Descuento máximo</div>
                  <div className="fw-bold">
                    {descuento.maximo != null && descuento.maximo !== undefined
                      ? formatearMonto(descuento.maximo)
                      : '—'}
                  </div>
                </Col>
                <Col md={6}>
                  <div className="text-muted small">Vigencia</div>
                  <div className="fw-bold">
                    {formatearFecha(descuento.fechaInicio ?? detalle.fechaInicio)} -{' '}
                    {formatearFecha(descuento.fechaFin ?? detalle.fechaFin)}
                  </div>
                </Col>
                <Col md={6}>
                  <div className="text-muted small">Período de análisis (días)</div>
                  <div className="fw-bold">
                    {descuento.periodoAnalisisDias ?? detalle.periodoAnalisisDias ?? '—'}
                  </div>
                </Col>
                <Col md={6}>
                  <div className="text-muted small">Máx. destinatarios</div>
                  <div className="fw-bold">
                    {descuento.maxDestinatarios != null && descuento.maxDestinatarios !== undefined
                      ? descuento.maxDestinatarios
                      : detalle.maxDestinatarios ?? '—'}
                  </div>
                </Col>
                <Col md={12}>
                  <div className="text-muted small">Alcance</div>
                  <div className="fw-bold">
                    {alcance.esGlobal
                      ? 'Todos los productos'
                      : `Productos: ${alcance.productos?.length || 0} · ` +
                        `Categorías: ${alcance.categorias?.length || 0}`}
                  </div>
                </Col>
                {alcance.productos?.length > 0 && (
                  <Col md={12}>
                    <div className="text-muted small">Productos alcanzados</div>
                    <div>{alcance.productos.join(', ')}</div>
                  </Col>
                )}
                {alcance.categorias?.length > 0 && (
                  <Col md={12}>
                    <div className="text-muted small">Categorías alcanzadas</div>
                    <div>{alcance.categorias.join(', ')}</div>
                  </Col>
                )}
                <Col md={6}>
                  <div className="text-muted small">Creada por</div>
                  <div>
                    {detalle.creadaPor
                      ? `${detalle.creadaPor.nombre} ${detalle.creadaPor.apellido || ''}`.trim()
                      : detalle.creadaPor?.email || '—'}
                  </div>
                </Col>
                <Col md={6}>
                  <div className="text-muted small">Fecha de creación</div>
                  <div className="fw-bold">
                    {formatearFecha(detalle.createdAt)}
                  </div>
                </Col>
              </Row>

              {fallidos > 0 || pendientes > 0 ? (
                <div className="mt-3">
                  <Button variant="outline-warning" onClick={manejarReenviar} className="mb-2" disabled={reenviarMut.isPending}>
                    <FaEnvelope /> Reintentar envíos fallidos/pendientes
                  </Button>
                </div>
              ) : null}

              <div className="mt-2">
                <Button variant="outline-secondary" onClick={() => navigate(`/superadmin/cupones/crear?reemitirDe=${id}`)}>
                  <FaHistory className="me-1" /> Reemitir esta emisión
                </Button>
              </div>

              <hr />

              {/* Clientes agrupados por estado de cupón */}
              <CardTitle className="mt-4">
                <FaUsers className="me-2" /> Clientes por estado de cupón
              </CardTitle>

              {errorCupones && (
                <Alert variant="danger" role="alert">
                  No se pudieron cargar los cupones de esta emisión.
                </Alert>
              )}

              {detalleIncompleto ? (
                <p className="text-muted text-center py-3">
                  Cargando los cupones de esta emisión…
                </p>
              ) : cupones.length === 0 ? (
                <p className="text-muted text-center py-3">No hay cupones generados en esta emisión.</p>
              ) : (
                <>
                  {ORDEN_ESTADOS_CUPON.map((estado) => {
                    const grupo = cuponesPorEstado[estado] || [];
                    if (grupo.length === 0) return null;
                    return (
                      <Card key={estado} className="shadow-sm mb-3">
                        <CardBody>
                          <CardTitle className="d-flex justify-content-between align-items-center mb-3">
                            <span>
                              {ETIQUETA_ESTADO_CUPON[estado]} ({grupo.length})
                            </span>
                            <Badge bg={VARIANTE_ESTADO_CUPON[estado] || 'secondary'}>
                              {estado}
                            </Badge>
                          </CardTitle>
                          <Table striped bordered hover className="tabla-cliente shadow-sm">
                            <thead className="table-light">
                              <tr>
                                <th data-label="Cliente">Cliente</th>
                                <th data-label="Código">Código</th>
                                <th data-label="Beneficio">Beneficio</th>
                                <th data-label="Vigencia">Vigencia</th>
                                <th data-label="Envío">Estado envío</th>
                              </tr>
                            </thead>
                            <tbody>
                              {grupo.map((c) => (
                                <tr key={c.id}>
                                  <td data-label="Cliente">
                                    {c.usuario ? `${c.usuario.nombre} ${c.usuario.apellido || ''}`.trim() : '—'}
                                    <div className="small text-muted">{c.usuario?.email || '—'}</div>
                                  </td>
                                  <td data-label="Código">
                                    <Link to={`/superadmin/cupones/cupones/${c.id}`}>
                                      <span className="fw-monospace">{c.codigo}</span>
                                    </Link>
                                  </td>
                                  <td data-label="Beneficio" className="fw-monospace">
                                    {textoDescuento(c)}
                                  </td>
                                  <td data-label="Vigencia" className="fw-monospace text-muted small">
                                    {textoVigencia(c)}
                                  </td>
                                  <td data-label="Envío">
                                    <Badge bg={VARIANTE_ENVIO[c.estadoEnvio] || 'secondary'}>
                                      {c.estadoEnvio}
                                    </Badge>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </Table>
                        </CardBody>
                      </Card>
                    );
                  })}
                </>
              )}
            </CardBody>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default DetalleEmision;

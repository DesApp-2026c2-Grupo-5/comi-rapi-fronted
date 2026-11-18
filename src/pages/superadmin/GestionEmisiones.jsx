/**
 * Propósito: Listado de emisiones de cupones para el
 *            SUPERADMINISTRADOR.
 * Contenido: Tabla paginada de emisiones con nombre, descripción, descuento,
 *            fecha de emisión, vigencia, cantidad de cupones, resultados de
 *            envío y estados de vigencia de los cupones. Incluye botón para
 *            reemitir una emisión anterior.
 * Dependencias: react-bootstrap, react-router-dom, TanStack Query,
 *               react-icons, api/cupones, hooks/queries, componentes comunes.
 * Uso: Ruta "/superadmin/cupones" → <GestionEmisiones />
 */

import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Table, Button, Container, Alert, Badge, Row, Col,
} from 'react-bootstrap';
import { FaTags, FaClock, FaHistory, FaCopy } from 'react-icons/fa';
import {
  useEmisionesQuery,
} from '../../hooks/queries';
import { SkeletonTabla } from '../../components/comunes/Skeleton';

const LIMITE_POR_PAGINA = 20;

const VARIANTE_ESTADO_CUPON = {
  DISPONIBLE: 'success',
  EN_USO: 'warning',
  USADO: 'secondary',
  VENCIDO: 'danger',
  ANULADO: 'dark',
  PROGRAMADO: 'info',
};

const ETIQUETA_ESTADO_CUPON = {
  DISPONIBLE: 'Disponibles',
  EN_USO: 'En uso',
  USADO: 'Usados',
  VENCIDO: 'Vencidos',
  ANULADO: 'Anulados',
  PROGRAMADO: 'Programados',
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

const textoDescuento = (emision) =>
  emision.tipoDescuento === 'PORCENTAJE'
    ? `${Number(emision.valorDescuento)}%`
    : formatearMonto(emision.valorDescuento);

/** Devuelve el estado de vigencia predominante de los cupones de la emisión. */
function estadoPredominante(cuponesPorEstado) {
  if (!cuponesPorEstado) return '—';
  const orden = [
    'ANULADO', 'VENCIDO', 'USADO', 'EN_USO', 'DISPONIBLE', 'PROGRAMADO',
  ];
  for (const clave of orden) {
    if ((cuponesPorEstado[clave] || 0) > 0) return clave;
  }
  return '—';
}

const GestionEmisiones = () => {
  const navigate = useNavigate();
  const [pagina, setPagina] = useState(1);
  const [error] = useState('');

  const {
    data: paginaEmisiones = { items: [], total: 0, pagina: 1, paginas: 1 },
    isPending: cargando,
    error: errorQuery,
  } = useEmisionesQuery({
    pagina,
    limite: LIMITE_POR_PAGINA,
  });
  const errorMensaje = error || (errorQuery?.message || '');

  const emisiones = paginaEmisiones.items || [];
  const totalEmisiones = paginaEmisiones.total || 0;
  const totalPaginas = paginaEmisiones.paginas || 1;
  const paginaActual = paginaEmisiones.pagina || 1;

  useEffect(() => {
    setPagina(1);
  }, []);

  if (cargando) {
    return (
      <Container className="py-4">
        <div role="status" aria-live="polite">
          <span className="visually-hidden">Cargando emisiones…</span>
          <SkeletonTabla filas={5} columnas={8} />
        </div>
      </Container>
    );
  }

  return (
    <Container>
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <h1 className="h2 mb-0">Emisiones de Cupones</h1>
        <Button variant="primary" onClick={() => navigate('/superadmin/cupones/crear')}>
          <FaTags /> Nueva emisión
        </Button>
      </div>

      {errorMensaje && <Alert variant="danger" role="alert">{errorMensaje}</Alert>}

      {totalEmisiones === 0 ? (
        <div className="text-center text-muted py-5">
          <FaClock size={48} className="mb-3 opacity-25" aria-hidden="true" />
          <h3 className="h5">No hay emisiones de cupones.</h3>
          <p className="text-muted">
            Las emisiones creadas desde <strong>Nueva emisión</strong>
            aparecerán en este listado.
          </p>
        </div>
      ) : (
        <>
          <div className="table-responsive">
            <Table striped bordered hover className="tabla-cliente shadow-sm">
              <thead className="table-light">
                <tr>
                  <th>Emisión</th>
                  <th>Descripción</th>
                  <th>Descuento</th>
                  <th>Fecha emisión</th>
                  <th>Vigencia</th>
                  <th>Cupones</th>
                  <th>Envío</th>
                  <th>Vigencia cupones</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {emisiones.map((emision) => {
                  const cpe = emision.cuponesPorEstado || {};
                  const estadoPred = estadoPredominante(cpe);
                  return (
                    <tr key={emision.id}>
                      <td>
                        <Link to={`/superadmin/cupones/emisiones/${emision.id}`}>
                          {emision.nombre}
                        </Link>
                        <div className="small text-muted mt-1">
                          Creada {formatearFecha(emision.createdAt)}
                        </div>
                      </td>
                      <td>
                        {emision.descripcion ? (
                          <span className="text-muted small">{emision.descripcion}</span>
                        ) : (
                          <span className="text-muted">—</span>
                        )}
                      </td>
                      <td className="fw-monospace">{textoDescuento(emision)}</td>
                      <td className="fw-monospace text-muted small">
                        {formatearFecha(emision.createdAt)}
                      </td>
                      <td className="fw-monospace text-muted small">
                        {formatearFecha(emision.fechaInicio)} -{' '}
                        {formatearFecha(emision.fechaFin)}
                      </td>
                      <td className="fw-monospace">
                        {emision.cantidadCupones}
                      </td>
                      <td className="text-muted small">
                        <span className={`text-${emision.cantidadFallidos > 0 ? 'danger' : 'success'}`}>
                          {emision.cantidadEnviados} enviados
                        </span>
                        {emision.cantidadFallidos > 0 && (
                          <>
                            {' · '}
                            <span className="text-danger">{emision.cantidadFallidos} fallidos</span>
                          </>
                        )}
                      </td>
                      <td>
                        <Badge bg={VARIANTE_ESTADO_CUPON[estadoPred] || 'secondary'}>
                          {estadoPred === '—'
                            ? '—'
                            : `${ETIQUETA_ESTADO_CUPON[estadoPred]} (${
                                cpe[estadoPred] || 0
                              })`}
                        </Badge>
                        <div className="text-muted small mt-1">
                          D{cpe.DISPONIBLE || 0} · U{cpe.EN_USO || 0} · V{cpe.VENCIDO || 0}
                        </div>
                      </td>
                      <td>
                        <Button
                          variant="outline-secondary"
                          size="sm"
                          onClick={() => navigate(`/superadmin/cupones/crear?reemitirDe=${emision.id}`)}
                        >
                          <FaHistory className="me-1" /> Reemitir
                        </Button>
                        <Button
                          variant="outline-secondary"
                          size="sm"
                          as={Link}
                          to={`/superadmin/cupones/emisiones/${emision.id}`}
                        >
                          <FaCopy className="me-1" /> Ver detalle
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          </div>

          {totalPaginas > 1 && (
            <Row className="g-2 mt-3 justify-content-between align-items-center">
              <Col xs={12} md={6}>
                <span className="text-muted small">
                  Mostrando {((paginaActual - 1) * LIMITE_POR_PAGINA) + 1} a
                  {Math.min(paginaActual * LIMITE_POR_PAGINA, totalEmisiones)} de {totalEmisiones} emisiones
                </span>
              </Col>
              <Col xs={12} md={6}>
                <nav className="d-flex justify-content-end">
                  <Button
                    variant="outline-secondary"
                    size="sm"
                    disabled={paginaActual <= 1}
                    onClick={() => setPagina(paginaActual - 1)}
                  >
                    Anterior
                  </Button>
                  <span className="text-muted small mx-2">
                    Página {paginaActual} de {totalPaginas}
                  </span>
                  <Button
                    variant="outline-secondary"
                    size="sm"
                    disabled={paginaActual >= totalPaginas}
                    onClick={() => setPagina(paginaActual + 1)}
                  >
                    Siguiente
                  </Button>
                </nav>
              </Col>
            </Row>
          )}
        </>
      )}
    </Container>
  );
};

export default GestionEmisiones;

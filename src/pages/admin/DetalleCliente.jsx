/**
 * Propósito: Detalle de un cliente (solo lectura) para el admin y, con
 *            `backRoute="/superadmin/clientes"`, para el SUPERADMINISTRADOR.
 * Contenido: Componente DetalleCliente con datos, direcciones, últimos pedidos
 *            y el ranking de productos y categorías más comprados (barras en
 *            CSS).
 * Dependencias: react-bootstrap, react-router-dom, api/usuarios.js,
 *               api/direcciones.js, api/pedidos.js, formatters, react-icons.
 * Uso: Ruta "/admin/clientes/:id" → <DetalleCliente />
 *      Ruta "/superadmin/clientes/:id" → <DetalleCliente backRoute="/superadmin/clientes" />
 */

import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import { Container, Card, Spinner, Alert, Badge, Table, Row, Col } from 'react-bootstrap';
import { FaLocationDot, FaChartLine } from 'react-icons/fa6';
import { obtenerClientePorId, obtenerMasComprados } from '../../api/usuarios';
import { obtenerDireccionesDeCliente } from '../../api/direcciones';
import { obtenerPedidos } from '../../api/pedidos';
import { formatDate, formatPrice } from '../../utils/formatters';
import { ETIQUETAS_ESTADO_PEDIDO } from '../../utils/constants';

const inicialesDe = (cliente) => {
  const nombre = (cliente?.nombre || '').trim();
  const apellido = (cliente?.apellido || '').trim();
  return `${nombre.charAt(0)}${apellido.charAt(0)}`.toUpperCase() || '?';
};

const textoDireccion = (d) =>
  [d.calle && d.altura ? `${d.calle} ${d.altura}` : d.calle, d.alias ? `(${d.alias})` : '']
    .filter(Boolean)
    .join(' ') || '—';

/**
 * Barra horizontal en CSS puro (sin librería de gráficos). La barra es el
 * relleno dentro de una pista que ocupa todo el ancho que sobra, así el ancho
 * en % siempre es proporcional a `unidades / maximo`.
 */
const BarraRanking = ({ etiqueta, subetiqueta = '', unidades, maximo }) => (
  <div className="d-flex align-items-center gap-2 mb-1">
    <div style={{ width: '9rem' }}>
      <div className="small text-truncate" title={etiqueta}>{etiqueta}</div>
      {subetiqueta ? (
        <div className="text-muted text-truncate" style={{ fontSize: '0.7rem' }}>
          {subetiqueta}
        </div>
      ) : null}
    </div>
    <div
      className="flex-grow-1 rounded"
      style={{ backgroundColor: '#fff4e2', height: '1rem' }}
    >
      <div
        className="rounded"
        style={{
          backgroundColor: '#f1c27d',
          height: '100%',
          minWidth: '0.5rem',
          width: `${Math.round((unidades / maximo) * 100)}%`,
        }}
        role="img"
        aria-label={`${unidades} unidades de ${etiqueta}`}
      />
    </div>
    <span className="small fw-semibold text-nowrap" style={{ width: '4rem', textAlign: 'right' }}>
      {unidades}
    </span>
  </div>
);

BarraRanking.propTypes = {
  etiqueta: PropTypes.string.isRequired,
  subetiqueta: PropTypes.string,
  unidades: PropTypes.number.isRequired,
  maximo: PropTypes.number.isRequired,
};

const DetalleCliente = ({ backRoute = '/admin/clientes' }) => {
  const { id } = useParams();
  const [cliente, setCliente] = useState(null);
  const [direcciones, setDirecciones] = useState([]);
  const [ultimos, setUltimos] = useState([]);
  const [masComprados, setMasComprados] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const cargar = async () => {
      setCargando(true);
      setError('');
      const [resCliente, resDirecciones, resPedidos, resMasComprados] =
        await Promise.all([
          obtenerClientePorId(id),
          obtenerDireccionesDeCliente(id),
          obtenerPedidos(),
          obtenerMasComprados(id),
        ]);
      if (!resCliente.success) {
        setError(resCliente.error || 'No se pudo cargar el cliente.');
        setCargando(false);
        return;
      }
      setCliente(resCliente.data);
      setDirecciones(resDirecciones.success ? resDirecciones.data : []);
      // Si el ranking falla se omite la sección entera en vez de confundir un
      // error de red con "no compró nada": el resto del detalle sigue servido.
      if (resMasComprados.success) {
        setMasComprados(resMasComprados.data);
      }
      if (resPedidos.success) {
        const propios = (resPedidos.data || [])
          .filter((p) => String(p.usuarioId) === String(id))
          .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
          .slice(0, 3);
        setUltimos(propios);
      }
      setCargando(false);
    };
    cargar();
  }, [id]);

  if (cargando) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" variant="danger" />
      </Container>
    );
  }

  if (error || !cliente) {
    return (
      <Container className="py-4">
        <Link to={backRoute} className="text-danger text-decoration-none mb-3 d-inline-block">
          ← Volver a clientes
        </Link>
        <Alert variant="danger">{error || 'Cliente no encontrado.'}</Alert>
      </Container>
    );
  }

  return (
    <Container fluid className="py-4">
      <Link to={backRoute} className="text-danger text-decoration-none mb-3 d-inline-block">
        ← Volver a clientes
      </Link>
      <h1 className="h2 mb-4">Cliente #{cliente.id}</h1>

      <Card className="shadow-sm mb-3">
        <Card.Body>
          <div className="d-flex align-items-center gap-3 mb-3">
            <span
              className="d-inline-flex align-items-center justify-content-center rounded-circle fw-bold fs-4"
              style={{
                width: '52px',
                height: '52px',
                backgroundColor: '#fff4e2',
                border: '1px solid #f1c27d',
                color: '#b55d00',
              }}
            >
              {inicialesDe(cliente)}
            </span>
            <div>
              <div className="fw-bold fs-5">
                {`${cliente.nombre || ''} ${cliente.apellido || ''}`.trim() || '—'}
              </div>
              <div className="text-muted small">{cliente.email}</div>
            </div>
            <span className="ms-auto">
              {cliente.activo ? (
                <Badge bg="success">Activo</Badge>
              ) : (
                <Badge bg="secondary">Inactivo</Badge>
              )}
            </span>
          </div>
          <Row>
            <Col md={4}>
              <div className="text-uppercase text-muted small fw-bold">Teléfono</div>
              <div className="fw-bold">{cliente.telefono || '—'}</div>
            </Col>
            <Col md={4}>
              <div className="text-uppercase text-muted small fw-bold">Pedidos totales</div>
              <div className="fw-bold">{cliente.cantidadPedidos ?? 0}</div>
            </Col>
            <Col md={4}>
              <div className="text-uppercase text-muted small fw-bold">Cliente desde</div>
              <div className="fw-bold">{cliente.creadoEn ? formatDate(cliente.creadoEn) : '—'}</div>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      <Row>
        <Col md={6} className="mb-3">
          <Card className="shadow-sm h-100">
            <Card.Body>
              <h2 className="h6 fw-bold mb-3">
                <FaLocationDot className="me-1" /> Direcciones
              </h2>
              {direcciones.length === 0 ? (
                <span className="text-muted small">Sin direcciones cargadas.</span>
              ) : (
                direcciones.map((d) => (
                  <div key={d.id} className="border rounded p-2 mb-2 small">
                    <FaLocationDot className="me-1" /> {textoDireccion(d)}
                  </div>
                ))
              )}
            </Card.Body>
          </Card>
        </Col>
        <Col md={6} className="mb-3">
          <Card className="shadow-sm h-100">
            <Card.Body>
              <h2 className="h6 fw-bold mb-3">Últimos pedidos</h2>
              {ultimos.length === 0 ? (
                <span className="text-muted small">Sin pedidos todavía.</span>
              ) : (
                <Table size="sm" className="mb-0">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Fecha</th>
                      <th>Total</th>
                      <th>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ultimos.map((p) => (
                      <tr key={p.id}>
                        <td>{p.id}</td>
                        <td>{formatDate(p.fecha)}</td>
                        <td>{formatPrice(p.total)}</td>
                        <td>{ETIQUETAS_ESTADO_PEDIDO[p.estado] || p.estado}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {masComprados && (
        <Card className="shadow-sm mt-3">
          <Card.Body>
            <h2 className="h6 fw-bold mb-1">
              <FaChartLine className="me-1" /> Lo que más pide
            </h2>
            <div className="text-muted small mb-3">
              {masComprados.totalUnidades === 0
                ? 'Unidades pedidas'
                : `Unidades pedidas · ${masComprados.totalUnidades} en total`}
            </div>
            {masComprados.totalUnidades === 0 ? (
              <span className="text-muted small">Todavía no compró.</span>
            ) : (
              <Row>
                <Col md={6} className="mb-2">
                  <div className="text-uppercase text-muted small fw-bold mb-2">
                    Productos
                  </div>
                  {masComprados.productos.map((p) => (
                    <BarraRanking
                      key={`producto-${p.productoId}`}
                      etiqueta={p.nombre}
                      subetiqueta={p.categoria}
                      unidades={p.unidades}
                      maximo={masComprados.productos[0].unidades}
                    />
                  ))}
                </Col>
                <Col md={6} className="mb-2">
                  <div className="text-uppercase text-muted small fw-bold mb-2">
                    Categorías
                  </div>
                  {masComprados.categorias.map((c) => (
                    <BarraRanking
                      key={`categoria-${c.categoriaId ?? 'sin'}`}
                      etiqueta={c.nombre}
                      unidades={c.unidades}
                      maximo={masComprados.categorias[0].unidades}
                    />
                  ))}
                </Col>
              </Row>
            )}
          </Card.Body>
        </Card>
      )}
    </Container>
  );
};

export default DetalleCliente;

DetalleCliente.propTypes = {
  backRoute: PropTypes.string,
};

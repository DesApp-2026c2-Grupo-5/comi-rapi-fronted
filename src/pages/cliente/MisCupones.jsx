/**
 * Propósito: Página "Mis cupones" del CLIENTE con seis pestañas:
 *            Todas, Disponibles, En uso, Usados, Vencidos, Anulados.
 * Contenido: Tabla de tarjetas con código, campaña, descuento, compra
 *            mínima, vigencia, usos restantes y botón para copiar el código.
 * Dependencias: react-bootstrap, react-router-dom, TanStack Query,
 *               react-icons, api/cupones, componentes comunes.
 * Uso: Ruta "/cliente/mis-cupones" → <MisCupones />
 */

import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Table, Button, Container, Alert, Badge, Nav,
} from 'react-bootstrap';
import { FaCopy, FaTag } from 'react-icons/fa';
import { useCuponesClienteQuery } from '../../hooks/queries';
import { formatPrice } from '../../utils/formatters';
import './MisCupones.css';
import { SkeletonTabla } from '../../components/comunes/Skeleton';

const PESTANAS = [
  { clave: 'todas', etiqueta: 'Todas' },
  { clave: 'disponible', etiqueta: 'Disponibles' },
  { clave: 'en_uso', etiqueta: 'En uso' },
  { clave: 'usado', etiqueta: 'Usados' },
  { clave: 'vencido', etiqueta: 'Vencidos' },
  { clave: 'anulado', etiqueta: 'Anulados' },
];

const VARIANTE_ESTADO = {
  DISPONIBLE: 'primary',
  EN_USO: 'warning',
  USADO: 'success',
  VENCIDO: 'secondary',
  ANULADO: 'danger',
};

const textoValor = (cupon) =>
  cupon.tipoDescuento === 'PORCENTAJE'
    ? `${Number(cupon.valorDescuento)}%`
    : `$${Number(cupon.valorDescuento)}`;

const textoVigencia = (cupon) => {
  if (!cupon.fechaInicio && !cupon.fechaFin) return '—';
  const desde = cupon.fechaInicio ? new Date(cupon.fechaInicio).toLocaleDateString() : '…';
  const hasta = cupon.fechaFin ? new Date(cupon.fechaFin).toLocaleDateString() : '…';
  return `${desde} - ${hasta}`;
};

const copiarCodigo = (codigo) => {
  navigator.clipboard.writeText(codigo);
};

const MisCupones = () => {
  const { data: cupones = [], isPending: cargando, error: errorQuery } =
    useCuponesClienteQuery();
  const [errorLocal, setErrorLocal] = useState('');
  const [pestanaActiva, setPestanaActiva] = useState('todas');

  const error = errorLocal || (errorQuery?.message || '');

  const filtrados = useMemo(() => {
    if (pestanaActiva === 'todas') return cupones;
    return cupones.filter((c) => c.estado === pestanaActiva.toUpperCase());
  }, [cupones, pestanaActiva]);

  const handleCopiar = (codigo) => {
    copiarCodigo(codigo);
    setErrorLocal(`Código "${codigo}" copiado al portapapeles.`);
    setTimeout(() => setErrorLocal(''), 3000);
  };

  if (cargando) {
    return (
      <Container className="py-4">
        <div role="status" aria-live="polite">
          <span className="visually-hidden">Cargando tus cupones…</span>
          <SkeletonTabla filas={5} columnas={6} />
        </div>
      </Container>
    );
  }

  return (
    <Container>
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <h1 className="h2 mb-0">Mis Cupones</h1>
      </div>

      {error && <Alert variant="danger" role="alert">{error}</Alert>}

      <Nav variant="tabs" className="mb-4" activeKey={pestanaActiva} onSelect={setPestanaActiva}>
        {PESTANAS.map((p) => (
          <Nav.Item key={p.clave}>
            <Nav.Link eventKey={p.clave}>
              {p.etiqueta}
              <span className="badge bg-light text-dark ms-1">
                {filtrados.length === cupones.length && p.clave === 'todas'
                  ? cupones.length
                  : cupones.filter((c) => c.estado === p.clave.toUpperCase()).length}
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
        <Table striped bordered hover responsive className="tabla-cliente shadow-sm">
          <thead className="table-light">
            <tr>
              <th>Código</th>
              <th>Campaña</th>
              <th>Descuento</th>
              <th>Compra mínima</th>
              <th>Vigencia</th>
              <th>Estado</th>
              <th>Usos</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtrados.map((cupon) => (
              <tr key={cupon.id}>
                <td data-label="Código">
                  <div className="d-flex align-items-center">
                    <span className="me-2 fw-monospace text-truncate" style={{ maxWidth: '120px' }}>
                      {cupon.codigo}
                    </span>
                    <Button
                      variant="outline-secondary"
                      size="sm"
                      onClick={() => handleCopiar(cupon.codigo)}
                    >
                      <FaCopy aria-hidden="true" />
                    </Button>
                  </div>
                </td>
                <td data-label="Emisión">
                  {cupon.emision?.nombre || '—'}
                </td>
                <td data-label="Descuento">
                  <span className="fw-monospace">{textoValor(cupon)}</span>
                </td>
                <td data-label="Compra mínima">
                  {Number(cupon.compraMinima) > 0
                    ? formatPrice(cupon.compraMinima)
                    : '—'}
                </td>
                <td data-label="Vigencia">{textoVigencia(cupon)}</td>
                <td data-label="Estado">
                  <Badge bg={VARIANTE_ESTADO[cupon.estado] || 'secondary'}>
                    {cupon.estado}
                  </Badge>
                </td>
                <td data-label="Usos">
                  <span className="fw-monospace">
                    {cupon.usosRestantes ?? '∞'}
                  </span>
                  <div className="small text-muted">
                    {cupon.usosActivos ?? 0} en uso
                  </div>
                </td>
                <td data-label="Acciones">
                  {cupon.estado === 'DISPONIBLE' ? (
                    <Link to="/cliente/carrito" className="btn btn-outline-primary btn-sm">
                      <FaTag aria-hidden="true" /> Usar en carrito
                    </Link>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </Container>
  );
};

export default MisCupones;

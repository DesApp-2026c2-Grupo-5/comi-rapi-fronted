/**
 * Propósito: Detalle individual de un cupón para el
 *            SUPERADMINISTRADOR.
 * Contenido: Datos del cupón (código, descuento, vigencia), cliente al que
 *            fue asignado, estado de envío, fecha de envío, errores y datos
 *            de uso (reservados / confirmados / liberados). Permite dar de
 *            baja o reactivar el cupón individualmente.
 * Dependencias: react-bootstrap, react-router-dom, TanStack Query,
 *               react-icons, api/cupones, hooks/queries.
 * Uso: Ruta "/superadmin/cupones/cupones/:id".
 */

import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Container, Row, Col, Card, CardBody, CardTitle, Button, Alert, Badge, Table,
} from 'react-bootstrap';
import { FaArrowLeft, FaUser, FaEnvelope, FaTag, FaClock, FaWallet, FaToggleOn, FaToggleOff } from 'react-icons/fa';
import { useCuponQuery, useCambiarActivoCupon } from '../../hooks/queries';

const VARIANTE_ESTADO = {
  DISPONIBLE: 'primary',
  EN_USO: 'warning',
  USADO: 'success',
  VENCIDO: 'secondary',
  ANULADO: 'danger',
  PROGRAMADO: 'info',
};

const VARIANTE_ENVIO = {
  ENVIADO: 'success',
  FALLIDO: 'danger',
  PENDIENTE: 'warning',
};

const formatearFecha = (valor) => {
  if (!valor) return '—';
  return new Date(valor).toLocaleDateString('es-AR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  });
};

const formatearFechaHora = (valor) => {
  if (!valor) return '—';
  return new Date(valor).toLocaleString('es-AR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
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

const DetalleCupon = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [cambiandoActivo, setCambiandoActivo] = useState(false);

  const cambiarActivo = useCambiarActivoCupon();
  const { data: cupon, isPending: cargando } = useCuponQuery({ id, enabled: Boolean(id) });

  const manejarCambiarActivo = async () => {
    setCambiandoActivo(true);
    try {
      await cambiarActivo.mutateAsync({ id: Number(id), activo: !cupon.activo });
      // Forzar actualización navegando a la misma ruta
      navigate(`/superadmin/cupones/cupones/${id}`);
    } catch (err) {
      // El error se muestra vía invalidación de query en el hook; recargar para reflejar estado
      navigate(`/superadmin/cupones/cupones/${id}`);
    } finally {
      setCambiandoActivo(false);
    }
  };

  if (cargando) {
    return (
      <Container className="py-4">
        <div className="text-center">Cargando cupón…</div>
      </Container>
    );
  }

  if (!cupon) {
    return (
      <Container className="py-4">
        <Alert variant="danger">Cupón no encontrado.</Alert>
        <Button variant="secondary" onClick={() => navigate('/superadmin/cupones')}>
          <FaArrowLeft /> Volver a emisiones
        </Button>
      </Container>
    );
  }

  const usos = cupon.uso || { reservados: 0, confirmados: 0, liberados: 0 };

  return (
    <Container>
      <Row>
        <Col lg={8}>
          <Card>
            <CardBody>
              <CardTitle className="d-flex justify-content-between align-items-center">
                <span>Cupón: {cupon.codigo}</span>
                <Button variant="outline-secondary" onClick={() => navigate('/superadmin/cupones')}>
                  <FaArrowLeft /> Volver a emisiones
                </Button>
              </CardTitle>

              {/* Estado y resumen */}
              <Row className="g-3 mt-4">
                <Col md={4}>
                  <div className="text-center">
                    <div className="text-muted small">Estado del cupón</div>
                    <Badge bg={VARIANTE_ESTADO[cupon.estado] || 'secondary'}>
                      {cupon.estado}
                    </Badge>
                  </div>
                </Col>
                <Col md={4}>
                  <div className="text-center">
                    <div className="text-muted small">Estado del envío</div>
                    <Badge bg={VARIANTE_ENVIO[cupon.estadoEnvio] || 'secondary'}>
                      {cupon.estadoEnvio}
                    </Badge>
                  </div>
                </Col>
                <Col md={4}>
                  <div className="text-center">
                    <div className="text-muted small">Descuento</div>
                    <span className="h4 fw-bold">{textoDescuento(cupon)}</span>
                  </div>
                </Col>
              </Row>

              <hr />

              {/* Datos del cupón */}
              <CardTitle className="mt-4">
                <FaTag className="me-2" /> Datos del cupón
              </CardTitle>
              <Row className="g-3 mt-3">
                <Col md={6}>
                  <div className="text-muted small">Código</div>
                  <div className="fw-monospace fw-bold">{cupon.codigo}</div>
                </Col>
                <Col md={6}>
                  <div className="text-muted small">Tipo de descuento</div>
                  <div className="fw-bold">{cupon.tipoDescuento}</div>
                </Col>
                <Col md={4}>
                  <div className="text-muted small">Valor del descuento</div>
                  <div className="fw-bold">{textoDescuento(cupon)}</div>
                </Col>
                <Col md={4}>
                  <div className="text-muted small">Compra mínima</div>
                  <div className="fw-bold">
                    {Number(cupon.compraMinima) > 0 ? formatearMonto(cupon.compraMinima) : '—'}
                  </div>
                </Col>
                <Col md={4}>
                  <div className="text-muted small">Descuento máximo</div>
                  <div className="fw-bold">
                    {cupon.descuentoMaximo != null && cupon.descuentoMaximo !== undefined
                      ? formatearMonto(cupon.descuentoMaximo)
                      : '—'}
                  </div>
                </Col>
                <Col md={6}>
                  <div className="text-muted small">Vigencia</div>
                  <div className="fw-bold">
                    {formatearFecha(cupon.fechaInicio)} -{' '}
                    {formatearFecha(cupon.fechaFin)}
                  </div>
                </Col>
                <Col md={6}>
                  <div className="text-muted small">Usos permitidos</div>
                  <div className="fw-bold">{cupon.usosPermitidos}</div>
                </Col>
                <Col md={6}>
                  <div className="text-muted small">Emisión</div>
                  <div className="fw-bold">{cupon.emisionId || '—'}</div>
                </Col>
                <Col md={6}>
                  <div className="text-muted small">Activo</div>
                  <div className="fw-bold">{cupon.activo ? 'Sí' : 'No'}</div>
                </Col>
              </Row>

              {/* Botón activar / desactivar */}
              <div className="mt-3">
                <Button
                  variant={cupon.activo ? 'outline-danger' : 'outline-success'}
                  onClick={manejarCambiarActivo}
                  disabled={cambiandoActivo}
                >
                  {cambiandoActivo ? 'Procesando…' : (
                    <>
                      {cupon.activo ? (
                        <>
                          <FaToggleOff aria-hidden="true" /> Dar de baja
                        </>
                      ) : (
                        <>
                          <FaToggleOn aria-hidden="true" /> Reactivar
                        </>
                      )}
                    </>
                  )}
                </Button>
              </div>

              <hr />

              {/* Cliente */}
              <CardTitle className="mt-4">
                <FaUser className="me-2" /> Cliente asignado
              </CardTitle>
              <Row className="g-3 mt-3">
                <Col md={6}>
                  <div className="text-muted small">Nombre</div>
                  <div className="fw-bold">
                    {cupon.usuario
                      ? `${cupon.usuario.nombre} ${cupon.usuario.apellido || ''}`.trim()
                      : '—'}
                  </div>
                </Col>
                <Col md={6}>
                  <div className="text-muted small">Email</div>
                  <div className="fw-monospace">{cupon.usuario?.email || '—'}</div>
                </Col>
              </Row>

              <hr />

              {/* Envío */}
              <CardTitle className="mt-4">
                <FaEnvelope className="me-2" /> Estado del envío
              </CardTitle>
              <Row className="g-3 mt-3">
                <Col md={4}>
                  <div className="text-muted small">Estado</div>
                  <div className="fw-bold">
                    <Badge bg={VARIANTE_ENVIO[cupon.estadoEnvio] || 'secondary'}>
                      {cupon.estadoEnvio}
                    </Badge>
                  </div>
                </Col>
                <Col md={4}>
                  <div className="text-muted small">Fecha de envío</div>
                  <div className="fw-monospace text-muted">{formatearFechaHora(cupon.enviadoEn)}</div>
                </Col>
                <Col md={4}>
                  <div className="text-muted small">Error</div>
                  <div className="text-muted small">{cupon.errorEnvio || '—'}</div>
                </Col>
              </Row>

              <hr />

              {/* Uso */}
              <CardTitle className="mt-4">
                <FaWallet className="me-2" /> Datos de uso
              </CardTitle>
              <Row className="g-3 mt-3">
                <Col md={4}>
                  <div className="text-muted small">Reservados</div>
                  <div className="fw-monospace fw-bold">{usos.reservados}</div>
                </Col>
                <Col md={4}>
                  <div className="text-muted small">Confirmados</div>
                  <div className="fw-monospace fw-bold text-success">{usos.confirmados}</div>
                </Col>
                <Col md={4}>
                  <div className="text-muted small">Liberados</div>
                  <div className="fw-monospace fw-bold text-muted">{usos.liberados}</div>
                </Col>
                <Col md={4}>
                  <div className="text-muted small">Restantes</div>
                  <div className="fw-monospace fw-bold">{cupon.usosRestantes ?? 0}</div>
                </Col>
              </Row>
            </CardBody>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default DetalleCupon;

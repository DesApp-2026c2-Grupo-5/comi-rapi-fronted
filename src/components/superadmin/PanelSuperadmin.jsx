/**
 * Propósito: Panel del SUPERADMINISTRADOR con el resumen agregado del negocio.
 * Contenido: Componente PanelSuperadmin que consulta GET /api/superadmin/resumen
 *            y muestra tarjetas de pedidos, ventas por sucursal, pedidos por
 *            estado, la serie de ingresos de los últimos 30 días y los totales
 *            de operación (catálogo, sucursales, plantel).
 * Dependencias: react-bootstrap (Row, Col, Card, Table, Alert, Spinner, Badge),
 *               react-icons (FaChartBar, FaStore…), api/superadmin,
 *               utils/constants (ETIQUETAS_ESTADO_PEDIDO, VARIANTE_ESTADO_PEDIDO).
 * Uso: <PanelSuperadmin /> - Se renderiza en PanelSuperadminPage.
 */

import { useEffect, useState } from 'react';
import {
  Row,
  Col,
  Card,
  Table,
  Alert,
  Spinner,
  Badge,
} from 'react-bootstrap';
import { FaChartBar, FaStore, FaBoxOpen, FaClipboardCheck } from 'react-icons/fa';
import { obtenerResumen } from '../../api/superadmin';
import {
  ETIQUETAS_ESTADO_PEDIDO,
  VARIANTE_ESTADO_PEDIDO,
} from '../../utils/constants';

const formatearPesos = (valor) =>
  `$${Number(valor || 0).toLocaleString('es-AR')}`;

const PanelSuperadmin = () => {
  const [resumen, setResumen] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const cargar = async () => {
      setCargando(true);
      setError('');
      const result = await obtenerResumen();
      if (result.success) {
        setResumen(result.data);
      } else {
        setError(result.error || 'No se pudieron cargar las métricas.');
      }
      setCargando(false);
    };
    cargar();
  }, []);

  if (cargando) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="danger" />
      </div>
    );
  }

  if (error) {
    return <Alert variant="danger" role="alert">{error}</Alert>;
  }

  const { pedidos, porEstado, porSucursal, porDia, operacion } = resumen;

  const tarjetas = [
    { titulo: 'Pedidos totales', valor: pedidos.total, icono: FaClipboardCheck, variante: 'primary' },
    { titulo: 'Pedidos vendidos', valor: pedidos.vendidos, icono: FaChartBar, variante: 'success' },
    { titulo: 'Pendientes', valor: pedidos.pendientes, icono: FaBoxOpen, variante: 'warning' },
    { titulo: 'Ingresos', valor: formatearPesos(pedidos.ingresos), icono: FaChartBar, variante: 'success' },
  ];

  const maximoDia = Math.max(1, ...porDia.map((fila) => fila.cantidad));

  const metricasOperacion = [
    { etiqueta: 'Sucursales activas', valor: operacion.sucursalesActivas },
    { etiqueta: 'Productos activos', valor: operacion.productos },
    { etiqueta: 'Combos activos', valor: operacion.combos },
    { etiqueta: 'Categorías', valor: operacion.categorias },
    { etiqueta: 'Promos activas', valor: operacion.promocionesActivas },
    { etiqueta: 'Clientes', valor: operacion.clientes },
    { etiqueta: 'Administradores', valor: operacion.administradores },
  ];

  return (
    <>
      <h1 className="mb-4">Panel de Superadministración</h1>

      <Row>
        {tarjetas.map((tarjeta) => (
          <Col xs={6} md={3} key={tarjeta.titulo} className="mb-3">
            <Card className="shadow-sm h-100 text-center panel-admin-estado">
              <Card.Body>
                <Card.Title as="h2" className="h6 text-muted d-flex align-items-center justify-content-center gap-2">
                  <tarjeta.icono aria-hidden="true" />
                  {tarjeta.titulo}
                </Card.Title>
                <Card.Text className={`display-6 fw-bold text-${tarjeta.variante}`}>
                  {tarjeta.valor}
                </Card.Text>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      <Row className="g-3">
        <Col lg={6}>
          <Card className="shadow-sm h-100">
            <Card.Header as="h2" className="h5 bg-white">
              Ventas por sucursal
            </Card.Header>
            <Card.Body>
              <Table striped bordered hover responsive className="tabla-admin shadow-sm mb-0">
                <thead className="table-dark">
                  <tr>
                    <th>Sucursal</th>
                    <th>Pedidos</th>
                    <th>Ingresos</th>
                  </tr>
                </thead>
                <tbody>
                  {porSucursal.map((fila) => (
                    <tr key={fila.sucursalId}>
                      <td data-label="Sucursal">
                        <FaStore className="me-1 text-secondary" aria-hidden="true" />
                        {fila.sucursal}
                      </td>
                      <td data-label="Pedidos">{fila.cantidad}</td>
                      <td data-label="Ingresos">{formatearPesos(fila.ingresos)}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={6}>
          <Card className="shadow-sm h-100">
            <Card.Header as="h2" className="h5 bg-white">
              Pedidos por estado
            </Card.Header>
            <Card.Body>
              <Table striped bordered hover responsive className="tabla-admin shadow-sm mb-0">
                <thead className="table-dark">
                  <tr>
                    <th>Estado</th>
                    <th>Pedidos</th>
                    <th>Ingresos</th>
                  </tr>
                </thead>
                <tbody>
                  {porEstado.map((fila) => (
                    <tr key={fila.estado}>
                      <td data-label="Estado">
                        <Badge bg={VARIANTE_ESTADO_PEDIDO[fila.estado] || 'secondary'} className="text-uppercase">
                          {ETIQUETAS_ESTADO_PEDIDO[fila.estado] || fila.estado}
                        </Badge>
                      </td>
                      <td data-label="Pedidos">{fila.cantidad}</td>
                      <td data-label="Ingresos">{formatearPesos(fila.ingresos)}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Card className="shadow-sm mt-3">
        <Card.Header as="h2" className="h5 bg-white">
          Pedidos vendidos · últimos 30 días
        </Card.Header>
        <Card.Body>
          {porDia.length === 0 ? (
            <p className="text-muted mb-0">Aún no hay ventas registradas.</p>
          ) : (
            <div className="d-flex flex-column gap-1">
              {porDia.map((fila) => (
                <div className="d-flex align-items-center gap-2" key={fila.dia}>
                  <span className="text-muted small" style={{ width: '7rem' }}>
                    {fila.dia}
                  </span>
                  <div
                    className="flex-grow-1 rounded"
                    style={{
                      backgroundColor: '#f1c27d',
                      height: '1rem',
                      minWidth: '0.5rem',
                      width: `${Math.round((fila.cantidad / maximoDia) * 100)}%`,
                    }}
                    role="img"
                    aria-label={`${fila.cantidad} pedidos el ${fila.dia}`}
                  />
                  <span className="small fw-semibold text-nowrap">
                    {fila.cantidad} · {formatearPesos(fila.ingresos)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card.Body>
      </Card>

      <Card className="shadow-sm mt-3">
        <Card.Header as="h2" className="h5 bg-white">
          Operación
        </Card.Header>
        <Card.Body>
          <Row>
            {metricasOperacion.map((metrica) => (
              <Col xs={6} md={3} lg={2} key={metrica.etiqueta} className="mb-2">
                <div className="text-center">
                  <div className="display-6 fw-bold">{metrica.valor}</div>
                  <div className="text-muted small">{metrica.etiqueta}</div>
                </div>
              </Col>
            ))}
          </Row>
        </Card.Body>
      </Card>
    </>
  );
};

export default PanelSuperadmin;
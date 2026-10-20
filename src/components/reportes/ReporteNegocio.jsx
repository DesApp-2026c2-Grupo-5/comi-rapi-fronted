/**
 * Propósito: Pantalla compartida de reportes y estadísticas del negocio.
 * Contenido: ReporteNegocio con filtros de período/sucursal, KPIs, gráficos
 *            (facturación, franja horaria y día de la semana), tablas de
 *            sucursales, productos, producto menos vendido, cancelaciones y
 *            promociones. El admin además ve los productos sin stock y el
 *            superadmin los clientes nuevos del período. Se refresca con
 *            eventos de tiempo real.
 * Dependencias: react-bootstrap, react-icons, api/reportes, api/sucursales,
 *               services/socket, utils/formatters, utils/constants,
 *               components/comunes/Skeleton y ./Graficos.
 * Uso: <ReporteNegocio /> desde el dashboard del admin y el panel del
 *      superadmin.
 *
 * El backend es la fuente de verdad: solo se considera venta el pedido
 * `entregado` y el ADMINISTRADOR siempre ve su sucursal, aunque intente filtrar
 * otra. La pantalla se adapta con useAuth sin duplicar reglas de negocio.
 */

/* El proyecto no usa prop-types; se desactiva por archivo como en Skeleton.jsx. */
/* eslint-disable react/prop-types */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Badge,
  Button,
  ButtonGroup,
  Card,
  Col,
  Form,
  Row,
  Spinner,
  Table,
} from 'react-bootstrap';
import {
  FaArrowDown,
  FaArrowUp,
  FaBoxOpen,
  FaChartLine,
  FaCheckCircle,
  FaExclamationTriangle,
  FaMoneyBillWave,
  FaReceipt,
  FaSearch,
  FaStore,
  FaSyncAlt,
  FaTags,
  FaUserPlus,
} from 'react-icons/fa';
import { obtenerReportes } from '../../api/reportes';
import { obtenerSucursales } from '../../api/sucursales';
import { SkeletonPagina } from '../comunes/Skeleton';
import { formatDateOnly, formatPrice } from '../../utils/formatters';
import { ROLES } from '../../utils/constants';
import { useAuth } from '../../hooks/useAuth';
import { conectarSocket, EVENTOS_SOCKET } from '../../services/socket';
import {
  BarraComparativa,
  GraficoBarras,
  GraficoLinea,
} from './Graficos';
import './ReporteNegocio.css';

const dosDigitos = (numero) => String(numero).padStart(2, '0');

const claveLocal = (fecha) =>
  `${fecha.getFullYear()}-${dosDigitos(fecha.getMonth() + 1)}-${dosDigitos(
    fecha.getDate()
  )}`;

const hoyClave = () => claveLocal(new Date());

const rangoUltimosDias = (dias) => {
  const fin = new Date();
  const inicio = new Date();
  inicio.setDate(inicio.getDate() - (dias - 1));
  return [claveLocal(inicio), claveLocal(fin)];
};

const PRESETS = [
  { clave: '7d', etiqueta: '7 días', rango: () => rangoUltimosDias(7) },
  { clave: '30d', etiqueta: '30 días', rango: () => rangoUltimosDias(30) },
  {
    clave: 'mes',
    etiqueta: 'Este mes',
    rango: () => {
      const hoy = new Date();
      return [
        claveLocal(new Date(hoy.getFullYear(), hoy.getMonth(), 1)),
        claveLocal(hoy),
      ];
    },
  },
  {
    clave: 'mesAnterior',
    etiqueta: 'Mes anterior',
    rango: () => {
      const hoy = new Date();
      return [
        claveLocal(new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1)),
        claveLocal(new Date(hoy.getFullYear(), hoy.getMonth(), 0)),
      ];
    },
  },
];

const RANGO_INICIAL = rangoUltimosDias(30);

const numero = (valor) => Number(valor) || 0;

const formatearEntero = (valor) => numero(valor).toLocaleString('es-AR');

const formatearPorcentaje = (valor) =>
  `${numero(valor).toLocaleString('es-AR', { maximumFractionDigits: 1 })}%`;

const formatearVariacion = (valor) => {
  if (valor === null || valor === undefined) return 'Sin período anterior';
  const signo = valor > 0 ? '+' : '';
  return `${signo}${numero(valor).toLocaleString('es-AR', {
    maximumFractionDigits: 1,
  })}%`;
};

const ordenarFilas = (filas, { clave, dir }) => {
  const factor = dir === 'asc' ? 1 : -1;
  return [...filas].sort((a, b) => {
    const valorA = a[clave];
    const valorB = b[clave];
    if (typeof valorA === 'string' || typeof valorB === 'string') {
      return (
        String(valorA || '').localeCompare(String(valorB || ''), 'es') * factor
      );
    }
    return (numero(valorA) - numero(valorB)) * factor;
  });
};

const Variacion = ({ valor }) => {
  if (valor === null || valor === undefined) {
    return <span className="text-muted small">Sin período anterior</span>;
  }
  if (valor === 0) {
    return <span className="text-muted small">Sin cambios</span>;
  }
  const positivo = valor > 0;
  const Icono = positivo ? FaArrowUp : FaArrowDown;
  return (
    <span
      className={`reporte-variacion ${positivo ? 'text-success' : 'text-danger'}`}
    >
      <Icono aria-hidden="true" /> {formatearVariacion(valor)}
    </span>
  );
};

const Kpi = ({ titulo, valor, icono: Icono, variacion, detalle }) => (
  <Card className="reporte-kpi h-100 shadow-sm">
    <Card.Body>
      <div className="reporte-kpi-encabezado">
        <span className="reporte-kpi-icono">
          <Icono aria-hidden="true" />
        </span>
        <span className="reporte-kpi-titulo">{titulo}</span>
      </div>
      <div className="reporte-kpi-valor">{valor}</div>
      {variacion !== undefined ? <Variacion valor={variacion} /> : null}
      {detalle ? <div className="text-muted small mt-1">{detalle}</div> : null}
    </Card.Body>
  </Card>
);

const SinDatos = ({ children = 'Sin datos en el período.' }) => (
  <p className="text-muted mb-0">{children}</p>
);

const EncabezadoOrden = ({ clave, etiqueta, orden, onOrdenar }) => {
  const activo = orden.clave === clave;
  return (
    <th
      aria-sort={
        activo ? (orden.dir === 'asc' ? 'ascending' : 'descending') : 'none'
      }
    >
      <button
        type="button"
        className={`reporte-orden${activo ? ' activo' : ''}`}
        onClick={() => onOrdenar(clave)}
      >
        {etiqueta}
        {activo ? (
          orden.dir === 'asc' ? (
            <FaArrowUp aria-hidden="true" />
          ) : (
            <FaArrowDown aria-hidden="true" />
          )
        ) : null}
      </button>
    </th>
  );
};

const TablaProductos = ({ titulo, filas, orden, onOrdenar }) => (
  <div>
    <h3 className="h6 reporte-subtitulo">{titulo}</h3>
    {filas.length === 0 ? (
      <SinDatos />
    ) : (
      <Table striped bordered hover responsive className="tabla-admin mb-0">
        <thead className="table-dark">
          <tr>
            <EncabezadoOrden
              clave="nombre"
              etiqueta="Producto"
              orden={orden}
              onOrdenar={onOrdenar}
            />
            <EncabezadoOrden
              clave="categoria"
              etiqueta="Categoría"
              orden={orden}
              onOrdenar={onOrdenar}
            />
            <EncabezadoOrden
              clave="unidades"
              etiqueta="Unidades"
              orden={orden}
              onOrdenar={onOrdenar}
            />
            <EncabezadoOrden
              clave="facturacion"
              etiqueta="Facturación"
              orden={orden}
              onOrdenar={onOrdenar}
            />
          </tr>
        </thead>
        <tbody>
          {filas.map((fila) => (
            <tr key={fila.productoId}>
              <td data-label="Producto">{fila.nombre}</td>
              <td data-label="Categoría">{fila.categoria || 'Sin categoría'}</td>
              <td data-label="Unidades">{formatearEntero(fila.unidades)}</td>
              <td data-label="Facturación">
                {formatPrice(fila.facturacion)}
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    )}
  </div>
);

const ReporteNegocio = () => {
  const { user, hydrated } = useAuth();
  const esSuperadmin = user?.rol === ROLES.SUPERADMIN;

  const [desde, setDesde] = useState(RANGO_INICIAL[0]);
  const [hasta, setHasta] = useState(RANGO_INICIAL[1]);
  const [preset, setPreset] = useState('30d');
  const [sucursalId, setSucursalId] = useState('');
  const [sucursales, setSucursales] = useState([]);
  const [datos, setDatos] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [actualizando, setActualizando] = useState(false);
  const [error, setError] = useState('');
  const [busquedaProductos, setBusquedaProductos] = useState('');
  const [ordenVendidos, setOrdenVendidos] = useState({
    clave: 'unidades',
    dir: 'desc',
  });
  const [ordenFacturacion, setOrdenFacturacion] = useState({
    clave: 'facturacion',
    dir: 'desc',
  });

  const cargar = useCallback(
    async (silencioso = false) => {
      if (desde > hasta) {
        setError('La fecha desde no puede ser posterior a la hasta.');
        setCargando(false);
        return;
      }
      if (silencioso) {
        setActualizando(true);
      } else {
        setCargando(true);
      }
      setError('');
      const result = await obtenerReportes({
        desde,
        hasta,
        sucursalId: sucursalId || undefined,
      });
      if (result.success) {
        setDatos(result.data);
      } else {
        setError(result.error || 'No se pudieron cargar los reportes.');
      }
      setCargando(false);
      setActualizando(false);
    },
    [desde, hasta, sucursalId]
  );

  useEffect(() => {
    const temporizador = setTimeout(() => cargar(), 250);
    return () => clearTimeout(temporizador);
  }, [cargar]);

  const cargarRef = useRef(cargar);
  useEffect(() => {
    cargarRef.current = cargar;
  }, [cargar]);

  useEffect(() => {
    if (!esSuperadmin) return undefined;
    let activo = true;
    obtenerSucursales({ incluirInactivas: true }).then((result) => {
      if (activo && result.success) setSucursales(result.data);
    });
    return () => {
      activo = false;
    };
  }, [esSuperadmin]);

  useEffect(() => {
    if (!hydrated || !user) return undefined;
    const socket = conectarSocket();
    let temporizador = null;
    const refrescar = () => {
      clearTimeout(temporizador);
      temporizador = setTimeout(() => cargarRef.current(true), 600);
    };
    socket.on('connect', refrescar);
    socket.on(EVENTOS_SOCKET.PEDIDO_ACTUALIZADO, refrescar);
    socket.on(EVENTOS_SOCKET.CATALOGO_ACTUALIZADO, refrescar);
    socket.on(EVENTOS_SOCKET.PARAMETROS_ACTUALIZADOS, refrescar);
    socket.on(EVENTOS_SOCKET.STOCK_ACTUALIZADO, refrescar);
    return () => {
      clearTimeout(temporizador);
      socket.off('connect', refrescar);
      socket.off(EVENTOS_SOCKET.PEDIDO_ACTUALIZADO, refrescar);
      socket.off(EVENTOS_SOCKET.CATALOGO_ACTUALIZADO, refrescar);
      socket.off(EVENTOS_SOCKET.PARAMETROS_ACTUALIZADOS, refrescar);
      socket.off(EVENTOS_SOCKET.STOCK_ACTUALIZADO, refrescar);
    };
  }, [hydrated, user]);

  const aplicarPreset = (opcion) => {
    const [nuevoDesde, nuevoHasta] = opcion.rango();
    setPreset(opcion.clave);
    setDesde(nuevoDesde);
    setHasta(nuevoHasta);
  };

  const onOrdenarVendidos = (clave) =>
    setOrdenVendidos((actual) =>
      actual.clave === clave
        ? { clave, dir: actual.dir === 'asc' ? 'desc' : 'asc' }
        : { clave, dir: clave === 'nombre' || clave === 'categoria' ? 'asc' : 'desc' }
    );

  const onOrdenarFacturacion = (clave) =>
    setOrdenFacturacion((actual) =>
      actual.clave === clave
        ? { clave, dir: actual.dir === 'asc' ? 'desc' : 'asc' }
        : { clave, dir: clave === 'nombre' || clave === 'categoria' ? 'asc' : 'desc' }
    );

  const productos = useMemo(() => {
    const texto = busquedaProductos.trim().toLowerCase();
    const coincide = (fila) =>
      !texto ||
      `${fila.nombre} ${fila.categoria || ''}`.toLowerCase().includes(texto);
    return {
      masVendidos: ordenarFilas(
        (datos?.productos.masVendidos || []).filter(coincide),
        ordenVendidos
      ),
      mayorFacturacion: ordenarFilas(
        (datos?.productos.mayorFacturacion || []).filter(coincide),
        ordenFacturacion
      ),
    };
  }, [datos, busquedaProductos, ordenVendidos, ordenFacturacion]);

  if (!hydrated || (cargando && !datos)) {
    return (
      <div role="status" aria-live="polite">
        <span className="visually-hidden">Cargando reportes…</span>
        <SkeletonPagina />
      </div>
    );
  }

  if (error && !datos) {
    return (
      <Alert variant="danger" role="alert">
        <p className="mb-2">{error}</p>
        <Button variant="outline-danger" size="sm" onClick={() => cargar()}>
          Reintentar
        </Button>
      </Alert>
    );
  }

  if (!datos) return null;

  const { resumen, porDia, porSucursal, cancelaciones } = datos;
  const anterior = resumen.anterior;
  const esGlobal = porSucursal.length > 1;
  const maximoSucursal = Math.max(
    1,
    ...porSucursal.map((fila) => numero(fila.facturacion))
  );

  const kpis = [
    {
      titulo: 'Pedidos',
      valor: formatearEntero(resumen.pedidos),
      icono: FaReceipt,
      detalle: `${formatearEntero(resumen.entregados)} entregados`,
    },
    {
      titulo: 'Pedidos entregados',
      valor: formatearEntero(resumen.entregados),
      icono: FaCheckCircle,
      variacion: anterior.variacionPedidos,
    },
    {
      titulo: 'Facturación',
      valor: formatPrice(resumen.facturacion),
      icono: FaMoneyBillWave,
      variacion: anterior.variacionFacturacion,
    },
    {
      titulo: 'Ticket promedio',
      valor: formatPrice(resumen.ticketPromedio),
      icono: FaChartLine,
      detalle: 'Sobre pedidos entregados',
    },
  ];

  if (esSuperadmin) {
    kpis.push({
      titulo: 'Clientes nuevos',
      valor: formatearEntero(datos.clientes.nuevos),
      icono: FaUserPlus,
      detalle: `${formatearEntero(datos.clientes.conPedidos)} con pedidos entregados`,
    });
  }

  return (
    <>
      <div className="reporte-cabecera d-flex flex-wrap justify-content-between align-items-start gap-3 mb-3">
        <div>
          <h1 className="mb-1">Reportes</h1>
          <p className="text-muted mb-0">
            Ventas, productos, cancelaciones y promociones del período. Solo se
            considera venta el pedido entregado.
          </p>
        </div>
        <Button
          variant="outline-secondary"
          onClick={() => cargar(true)}
          disabled={actualizando}
        >
          {actualizando ? (
            <Spinner animation="border" size="sm" className="me-2" />
          ) : (
            <FaSyncAlt className="me-2" aria-hidden="true" />
          )}
          Actualizar
        </Button>
      </div>

      {error ? (
        <Alert variant="warning" role="alert">
          {error}
        </Alert>
      ) : null}

      <Card className="shadow-sm mb-4">
        <Card.Body>
          <Row className="g-3 align-items-end">
            <Col lg={5}>
              <span className="reporte-filtro-etiqueta">Período rápido</span>
              <ButtonGroup size="sm" className="d-flex flex-wrap">
                {PRESETS.map((opcion) => (
                  <Button
                    key={opcion.clave}
                    variant={
                      preset === opcion.clave ? 'primary' : 'outline-primary'
                    }
                    onClick={() => aplicarPreset(opcion)}
                    aria-pressed={preset === opcion.clave}
                  >
                    {opcion.etiqueta}
                  </Button>
                ))}
              </ButtonGroup>
            </Col>
            <Col sm={6} lg={2}>
              <Form.Group controlId="reporte-desde">
                <Form.Label className="reporte-filtro-etiqueta">
                  Desde
                </Form.Label>
                <Form.Control
                  type="date"
                  value={desde}
                  max={hasta || hoyClave()}
                  onChange={(evento) => {
                    setPreset('personalizado');
                    setDesde(evento.target.value);
                  }}
                />
              </Form.Group>
            </Col>
            <Col sm={6} lg={2}>
              <Form.Group controlId="reporte-hasta">
                <Form.Label className="reporte-filtro-etiqueta">
                  Hasta
                </Form.Label>
                <Form.Control
                  type="date"
                  value={hasta}
                  min={desde}
                  max={hoyClave()}
                  onChange={(evento) => {
                    setPreset('personalizado');
                    setHasta(evento.target.value);
                  }}
                />
              </Form.Group>
            </Col>
            {esSuperadmin ? (
              <Col sm={12} lg={3}>
                <Form.Group controlId="reporte-sucursal">
                  <Form.Label className="reporte-filtro-etiqueta">
                    Sucursal
                  </Form.Label>
                  <Form.Select
                    value={sucursalId}
                    onChange={(evento) => setSucursalId(evento.target.value)}
                  >
                    <option value="">Todas las sucursales</option>
                    {sucursales.map((sucursal) => (
                      <option key={sucursal.id} value={sucursal.id}>
                        {sucursal.nombre}
                        {sucursal.activa === false ? ' (inactiva)' : ''}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
            ) : null}
          </Row>
          <p className="text-muted small mb-0 mt-3">
            {formatDateOnly(desde)} — {formatDateOnly(hasta)} ·{' '}
            {datos.periodo.sucursal || 'Todas las sucursales'}
          </p>
        </Card.Body>
      </Card>

      {resumen.pedidos === 0 ? (
        <Alert variant="info">
          No hubo pedidos en el período elegido. Probá ampliar el rango de
          fechas.
        </Alert>
      ) : null}

      <Row xs={1} sm={2} xl={esSuperadmin ? 5 : 4} className="g-3 mb-4">
        {kpis.map((kpi) => (
          <Col key={kpi.titulo}>
            <Kpi {...kpi} />
          </Col>
        ))}
      </Row>

      <Card className="shadow-sm mb-4">
        <Card.Header as="h2" className="h5 bg-white">
          Evolución de la facturación
        </Card.Header>
        <Card.Body>
          <GraficoLinea
            filas={porDia}
            clave="facturacion"
            etiqueta="Facturación"
          />
        </Card.Body>
      </Card>

      <Row className="g-3 mb-4">
        <Col lg={7}>
          <Card className="shadow-sm h-100">
            <Card.Header as="h2" className="h5 bg-white">
              Demanda por franja horaria
            </Card.Header>
            <Card.Body>
              <GraficoBarras
                filas={datos.franjaHoraria}
                clave="pedidos"
                etiqueta={(fila) => `${fila.hora}h`}
                tooltip={(fila) => `${fila.hora}:00 — ${fila.pedidos} pedidos`}
                mostrarCada={3}
              />
            </Card.Body>
          </Card>
        </Col>
        <Col lg={5}>
          <Card className="shadow-sm h-100">
            <Card.Header as="h2" className="h5 bg-white">
              Pedidos por día de la semana
            </Card.Header>
            <Card.Body>
              <GraficoBarras
                filas={datos.porDiaSemana}
                clave="pedidos"
                etiqueta={(fila) => fila.nombre.slice(0, 3)}
                tooltip={(fila) => `${fila.nombre}: ${fila.pedidos} pedidos`}
              />
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Card className="shadow-sm mb-4">
        <Card.Header as="h2" className="h5 bg-white">
          <FaStore className="me-2 text-secondary" aria-hidden="true" />
          {esGlobal ? 'Comparación de sucursales' : 'Sucursal'}
        </Card.Header>
        <Card.Body>
          {porSucursal.length === 0 ? (
            <SinDatos />
          ) : (
            <Table striped bordered hover responsive className="tabla-admin mb-0">
              <thead className="table-dark">
                <tr>
                  <th>Sucursal</th>
                  <th>Pedidos</th>
                  <th>Entregados</th>
                  <th>Facturación</th>
                  <th>Cancelados</th>
                  {esGlobal ? <th>Participación</th> : null}
                </tr>
              </thead>
              <tbody>
                {porSucursal.map((fila) => (
                  <tr key={fila.sucursalId}>
                    <td data-label="Sucursal">{fila.sucursal}</td>
                    <td data-label="Pedidos">{formatearEntero(fila.pedidos)}</td>
                    <td data-label="Entregados">
                      {formatearEntero(fila.entregados)}
                    </td>
                    <td data-label="Facturación">
                      {formatPrice(fila.facturacion)}
                    </td>
                    <td data-label="Cancelados">
                      {formatearEntero(fila.cancelados)}
                    </td>
                    {esGlobal ? (
                      <td data-label="Participación">
                        <div className="d-flex align-items-center gap-2">
                          <BarraComparativa
                            valor={fila.facturacion}
                            maximo={maximoSucursal}
                            color="#e8710a"
                          />
                          <span className="small text-nowrap">
                            {formatearPorcentaje(
                              (numero(fila.facturacion) * 100) /
                                Math.max(1, numero(resumen.facturacion))
                            )}
                          </span>
                        </div>
                      </td>
                    ) : null}
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>

      <Card className="shadow-sm mb-4">
        <Card.Header as="h2" className="h5 bg-white">
          <FaTags className="me-2 text-secondary" aria-hidden="true" />
          Productos más vendidos
        </Card.Header>
        <Card.Body>
          <Form.Group className="mb-3" controlId="reporte-buscar-producto">
            <Form.Label className="visually-hidden">
              Buscar producto o categoría
            </Form.Label>
            <div className="reporte-buscador">
              <FaSearch aria-hidden="true" />
              <Form.Control
                type="search"
                placeholder="Buscar producto o categoría…"
                value={busquedaProductos}
                onChange={(evento) => setBusquedaProductos(evento.target.value)}
              />
            </div>
          </Form.Group>
          <Row className="g-4">
            <Col xl={6}>
              <TablaProductos
                titulo="Por unidades vendidas"
                filas={productos.masVendidos}
                orden={ordenVendidos}
                onOrdenar={onOrdenarVendidos}
              />
            </Col>
            <Col xl={6}>
              <TablaProductos
                titulo="Por facturación"
                filas={productos.mayorFacturacion}
                orden={ordenFacturacion}
                onOrdenar={onOrdenarFacturacion}
              />
            </Col>
          </Row>
        </Card.Body>
      </Card>

      <Row className="g-3 mb-4">
        <Col xl={esSuperadmin ? 12 : 6}>
          <Card className="shadow-sm h-100">
            <Card.Header as="h2" className="h5 bg-white">
              <FaArrowDown className="me-2 text-secondary" aria-hidden="true" />
              Producto menos vendido
            </Card.Header>
            <Card.Body>
              {datos.productos.menosVendido ? (
                <Row className="g-3 align-items-center">
                  <Col md={6}>
                    <div className="reporte-mini-dato">
                      <span className="reporte-mini-valor">
                        {datos.productos.menosVendido.nombre}
                      </span>
                      <span className="text-muted small">
                        {datos.productos.menosVendido.categoria ||
                          'Sin categoría'}
                      </span>
                    </div>
                  </Col>
                  <Col xs={6} md={3}>
                    <div className="reporte-mini-dato">
                      <span className="reporte-mini-valor">
                        {formatearEntero(datos.productos.menosVendido.unidades)}
                      </span>
                      <span className="text-muted small">Unidades vendidas</span>
                    </div>
                  </Col>
                  <Col xs={6} md={3}>
                    <div className="reporte-mini-dato">
                      <span className="reporte-mini-valor">
                        {formatPrice(datos.productos.menosVendido.facturacion)}
                      </span>
                      <span className="text-muted small">Facturación</span>
                    </div>
                  </Col>
                </Row>
              ) : (
                <SinDatos>No hubo productos vendidos en el período.</SinDatos>
              )}
            </Card.Body>
          </Card>
        </Col>

        {!esSuperadmin ? (
          <Col xl={6}>
            <Card className="shadow-sm h-100">
              <Card.Header as="h2" className="h5 bg-white">
                <FaBoxOpen
                  className="me-2 text-secondary"
                  aria-hidden="true"
                />
                Productos sin stock{' '}
                <Badge bg="danger">
                  {formatearEntero(datos.stock.sinStock.length)}
                </Badge>
              </Card.Header>
              <Card.Body>
                {datos.stock.sinStock.length === 0 ? (
                  <SinDatos>No hay productos sin stock en la sucursal.</SinDatos>
                ) : (
                  <Table
                    striped
                    bordered
                    hover
                    responsive
                    className="tabla-admin mb-0"
                  >
                    <thead className="table-dark">
                      <tr>
                        <th>Producto</th>
                        <th>Cantidad</th>
                        <th>Disponibilidad</th>
                      </tr>
                    </thead>
                    <tbody>
                      {datos.stock.sinStock.map((fila) => (
                        <tr key={fila.productoId}>
                          <td data-label="Producto">{fila.producto}</td>
                          <td data-label="Cantidad">
                            {formatearEntero(fila.cantidad)}
                          </td>
                          <td data-label="Disponibilidad">
                            <Badge bg={fila.disponible ? 'warning' : 'danger'}>
                              {fila.disponible ? 'Sin stock' : 'No disponible'}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                )}
              </Card.Body>
            </Card>
          </Col>
        ) : null}
      </Row>

      <Row className="g-3 mb-4">
        <Col xl={6}>
          <Card className="shadow-sm h-100">
            <Card.Header as="h2" className="h5 bg-white">
              <FaExclamationTriangle
                className="me-2 text-secondary"
                aria-hidden="true"
              />
              Cancelaciones
            </Card.Header>
            <Card.Body>
              <Row className="g-2 mb-3">
                <Col xs={4}>
                  <div className="reporte-mini-dato text-center">
                    <span className="reporte-mini-valor text-danger">
                      {formatearEntero(cancelaciones.cantidad)}
                    </span>
                    <span className="text-muted small">Cancelados</span>
                  </div>
                </Col>
                <Col xs={4}>
                  <div className="reporte-mini-dato text-center">
                    <span className="reporte-mini-valor">
                      {formatearPorcentaje(cancelaciones.porcentaje)}
                    </span>
                    <span className="text-muted small">Del total</span>
                  </div>
                </Col>
                <Col xs={4}>
                  <div className="reporte-mini-dato text-center">
                    <span className="reporte-mini-valor">
                      {formatearEntero(cancelaciones.pedidosTotales)}
                    </span>
                    <span className="text-muted small">Pedidos</span>
                  </div>
                </Col>
              </Row>
              {cancelaciones.porDia.length === 0 ? (
                <SinDatos>No hubo cancelaciones en el período.</SinDatos>
              ) : (
                <Table size="sm" striped bordered responsive className="mb-0">
                  <thead className="table-dark">
                    <tr>
                      <th>Día</th>
                      <th>Cancelados</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cancelaciones.porDia.map((fila) => (
                      <tr key={fila.dia}>
                        <td data-label="Día">{formatDateOnly(fila.dia)}</td>
                        <td data-label="Cancelados">
                          {formatearEntero(fila.cantidad)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </Card.Body>
          </Card>
        </Col>

        <Col xl={6}>
          <Card className="shadow-sm h-100">
            <Card.Header as="h2" className="h5 bg-white">
              <FaTags className="me-2 text-secondary" aria-hidden="true" />
              Promociones
            </Card.Header>
            <Card.Body>
              <Row className="g-2 mb-3">
                <Col xs={4}>
                  <div className="reporte-mini-dato text-center">
                    <span className="reporte-mini-valor">
                      {formatearEntero(datos.promociones.pedidosConPromocion)}
                    </span>
                    <span className="text-muted small">Pedidos con promo</span>
                  </div>
                </Col>
                <Col xs={4}>
                  <div className="reporte-mini-dato text-center">
                    <span className="reporte-mini-valor">
                      {formatPrice(datos.promociones.facturacionConPromocion)}
                    </span>
                    <span className="text-muted small">Facturación</span>
                  </div>
                </Col>
                <Col xs={4}>
                  <div className="reporte-mini-dato text-center">
                    <span className="reporte-mini-valor text-success">
                      {formatPrice(datos.promociones.descuentoTotal)}
                    </span>
                    <span className="text-muted small">Descuentos</span>
                  </div>
                </Col>
              </Row>
              {datos.promociones.porPromocion.length === 0 ? (
                <SinDatos>
                  Ningún pedido entregado usó promociones en el período.
                </SinDatos>
              ) : (
                <Table size="sm" striped bordered responsive className="mb-0">
                  <thead className="table-dark">
                    <tr>
                      <th>Promoción</th>
                      <th>Pedidos</th>
                      <th>Descuento</th>
                      <th>Facturación</th>
                    </tr>
                  </thead>
                  <tbody>
                    {datos.promociones.porPromocion.map((fila) => (
                      <tr key={fila.promocionId}>
                        <td data-label="Promoción">{fila.nombre}</td>
                        <td data-label="Pedidos">
                          {formatearEntero(fila.pedidos)}
                        </td>
                        <td data-label="Descuento">
                          {formatPrice(fila.descuento)}
                        </td>
                        <td data-label="Facturación">
                          {formatPrice(fila.facturacion)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

    </>
  );
};

export default ReporteNegocio;

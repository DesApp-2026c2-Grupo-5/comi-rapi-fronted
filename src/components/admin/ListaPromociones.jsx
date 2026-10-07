/**
 * Propósito: Tabla de promociones para la gestión del panel usando Table de Bootstrap.
 * Contenido: Componente ListaPromociones con tabla, filtros por estado/tipo,
 *            botones Editar/Reactivar/Eliminar (CRUD del superadmin) o la vista
 *            de solo lectura para el admin. Muestra nº de productos por promoción.
 * Dependencias: react-bootstrap (Table, Button, Container, Spinner, Alert, Badge, Form),
 *               api/promociones.js, react-router-dom, react-icons.
 * Uso: <ListaPromociones /> (superadmin) o <ListaPromociones soloLectura /> (admin).
 */

import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import { Table, Button, Container, Spinner, Alert, Badge, Form, Row, Col } from 'react-bootstrap';
import { FaPlus, FaEdit, FaTrashAlt, FaUndoAlt } from 'react-icons/fa';
import {
  obtenerPromociones,
  eliminarPromocion,
  editarPromocion,
  obtenerProductosDePromocion,
} from '../../api/promociones';
import { formatDate } from '../../utils/formatters';
import ConfirmarModal from '../comunes/ConfirmarModal';

const ListaPromociones = ({ soloLectura = false }) => {
  const navigate = useNavigate();
  const [promociones, setPromociones] = useState([]);
  const [conteoProductos, setConteoProductos] = useState({});
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('todas');
  const [filtroTipo, setFiltroTipo] = useState('todos');
  // Objetos { id, nombre } que esperan confirmación en el modal
  const [promoAEliminar, setPromoAEliminar] = useState(null);
  const [promoAReactivar, setPromoAReactivar] = useState(null);
  const [confirmando, setConfirmando] = useState(false);

  const cargarPromociones = async () => {
    setCargando(true);
    setError('');
    const result = await obtenerPromociones({ incluirInactivas: true });
    if (result.success) {
      setPromociones(result.data);
      const conteos = await Promise.all(
        result.data.map(async (promocion) => {
          const res = await obtenerProductosDePromocion(promocion.id);
          return [promocion.id, res.success ? res.data.length : 0];
        })
      );
      setConteoProductos(Object.fromEntries(conteos));
    } else {
      setError(result.error || 'No se pudieron cargar las promociones.');
    }
    setCargando(false);
  };

  useEffect(() => {
    cargarPromociones();
  }, []);

  const handleEditar = (id) => {
    navigate(`/superadmin/promocion/editar/${id}`);
  };

  const handleNuevo = () => {
    navigate('/superadmin/promocion/nuevo');
  };

  const handleEliminar = (id, nombre) => setPromoAEliminar({ id, nombre });

  const confirmarEliminar = async () => {
    if (!promoAEliminar) return;
    setConfirmando(true);
    const result = await eliminarPromocion(promoAEliminar.id);
    if (result.success) {
      setPromoAEliminar(null);
      cargarPromociones();
    } else {
      setError(result.error || 'No se pudo eliminar la promoción.');
    }
    setConfirmando(false);
  };

  const handleReactivar = (id, nombre) => setPromoAReactivar({ id, nombre });

  const confirmarReactivar = async () => {
    if (!promoAReactivar) return;
    setConfirmando(true);
    const result = await editarPromocion(promoAReactivar.id, { activa: true });
    if (result.success) {
      setPromoAReactivar(null);
      cargarPromociones();
    } else {
      setError(result.error || 'No se pudo reactivar la promoción.');
    }
    setConfirmando(false);
  };

  const esVencida = (promocion) => {
    if (!promocion.fechaFin) return false;
    return new Date(promocion.fechaFin) < new Date();
  };

  const textoVigencia = (promocion) => {
    if (!promocion.fechaInicio && !promocion.fechaFin) return '—';
    const desde = promocion.fechaInicio ? formatDate(promocion.fechaInicio) : '…';
    const hasta = promocion.fechaFin ? formatDate(promocion.fechaFin) : '…';
    return `${desde} - ${hasta}`;
  };

  const textoValor = (promocion) =>
    promocion.tipo === 'DOS_POR_UNO' ? '2x1' : `${Number(promocion.valor)}%`;

  const visibles = promociones.filter((promocion) => {
    if (filtroEstado === 'activas' && !promocion.activa) return false;
    if (filtroEstado === 'inactivas' && promocion.activa) return false;
    if (filtroTipo !== 'todos' && promocion.tipo !== filtroTipo) return false;
    return true;
  });

  return (
    <Container>
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <h1 className="h2 mb-0">Gestión de Promociones</h1>
        {!soloLectura && (
          <Button variant="primary" onClick={handleNuevo}>
            <FaPlus className="me-1" aria-hidden="true" />
            Agregar nueva promoción
          </Button>
        )}
      </div>

      {soloLectura && (
        <Alert variant="info" role="alert" className="mb-3">
          Listado de solo lectura: el CRUD de promociones lo hace el
          SUPERADMINISTRADOR.
        </Alert>
      )}

      {error && <Alert variant="danger" role="alert">{error}</Alert>}

      <Row className="g-2 mb-3">
        <Col xs={6} md={3}>
          <Form.Select
            size="sm"
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
          >
            <option value="todas">Estado: Todas</option>
            <option value="activas">Estado: Activas</option>
            <option value="inactivas">Estado: Inactivas</option>
          </Form.Select>
        </Col>
        <Col xs={6} md={3}>
          <Form.Select
            size="sm"
            value={filtroTipo}
            onChange={(e) => setFiltroTipo(e.target.value)}
          >
            <option value="todos">Tipo: Todos</option>
            <option value="DESCUENTO_PORCENTUAL">Tipo: Porcentual</option>
            <option value="DOS_POR_UNO">Tipo: 2x1</option>
          </Form.Select>
        </Col>
      </Row>

      {cargando ? (
        <div className="text-center py-5">
          <Spinner animation="border" variant="danger" />
        </div>
      ) : (
        <Table striped bordered hover responsive className="tabla-admin shadow-sm">
          <thead className="table-dark">
            <tr>
              <th>ID</th>
              <th>Nombre</th>
              <th>Tipo</th>
              <th>Valor</th>
              <th>Vigencia</th>
              <th>Estado</th>
              {!soloLectura && <th>Acciones</th>}
            </tr>
          </thead>
          <tbody>
            {visibles.map((promocion) => (
              <tr key={promocion.id}>
                <td data-label="ID">{promocion.id}</td>
                <td data-label="Nombre">
                  {promocion.nombre}
                  <div className="small text-muted">
                    {conteoProductos[promocion.id] ?? 0} productos
                    {promocion.descripcion ? ` — ${promocion.descripcion}` : ''}
                  </div>
                </td>
                <td data-label="Tipo">
                  <Badge bg={promocion.tipo === 'DOS_POR_UNO' ? 'info' : 'warning'}>
                    {promocion.tipo === 'DOS_POR_UNO' ? '2x1' : 'Porcentual'}
                  </Badge>
                </td>
                <td data-label="Valor">{textoValor(promocion)}</td>
                <td data-label="Vigencia">
                  {textoVigencia(promocion)}
                  {esVencida(promocion) && (
                    <div className="small text-danger">vencida</div>
                  )}
                </td>
                <td data-label="Estado">
                  {promocion.activa ? (
                    <Badge bg="success">Activa</Badge>
                  ) : (
                    <Badge bg="secondary">Inactiva</Badge>
                  )}
                </td>
                {!soloLectura && (
                  <td data-label="Acciones">
                    <div className="d-flex gap-1 flex-wrap">
                      <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={() => handleEditar(promocion.id)}
                      >
                        <FaEdit aria-hidden="true" />
                        Editar
                      </Button>
                      {promocion.activa ? (
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => handleEliminar(promocion.id, promocion.nombre)}
                        >
                          <FaTrashAlt aria-hidden="true" />
                          Dar de baja
                        </Button>
                      ) : (
                        <Button
                          variant="outline-success"
                          size="sm"
                          onClick={() => handleReactivar(promocion.id, promocion.nombre)}
                        >
                          <FaUndoAlt aria-hidden="true" />
                          Reactivar
                        </Button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </Table>
      )}

      <ConfirmarModal
        mostrar={Boolean(promoAEliminar)}
        titulo="Dar de baja"
        mensaje={
          promoAEliminar
            ? `¿Dar de baja la promoción "${promoAEliminar.nombre}"? Dejará de estar disponible pero se conserva su historial.`
            : ''
        }
        textoConfirmar="Sí, dar de baja"
        cargando={confirmando}
        onConfirmar={confirmarEliminar}
        onCancelar={() => setPromoAEliminar(null)}
      />

      <ConfirmarModal
        mostrar={Boolean(promoAReactivar)}
        titulo="Reactivar"
        mensaje={
          promoAReactivar
            ? `¿Reactivar la promoción "${promoAReactivar.nombre}"?`
            : ''
        }
        textoConfirmar="Sí, reactivar"
        cargando={confirmando}
        onConfirmar={confirmarReactivar}
        onCancelar={() => setPromoAReactivar(null)}
      />
    </Container>
  );
};

export default ListaPromociones;

ListaPromociones.propTypes = {
  soloLectura: PropTypes.bool,
};

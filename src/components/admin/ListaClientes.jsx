/**
 * Propósito: Tabla de clientes (solo rol CLIENTE) en solo lectura. Con la
 *            prop `todos` lista todos los clientes registrados (sin la
 *            acotación por sucursal del administrador), para el panel del
 *            SUPERADMINISTRADOR.
 * Contenido: Componente ListaClientes con buscador, filtro por estado y
 *            botón Ver detalle por fila (apunta al detalle según el rol).
 *            Carga desde el backend (rol CLIENTE).
 * Dependencias: react-bootstrap (Table, Button, Container, Spinner, Alert, Badge, Form, Row, Col),
 *               api/usuarios.js, react-router-dom, react-icons.
 * Uso: <ListaClientes /> - Se renderiza en GestionClientes (admin).
 *      <ListaClientes todos /> - Se renderiza en la gestión de clientes del superadmin.
 */

import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import { Table, Button, Container, Spinner, Alert, Badge, Form, Row, Col } from 'react-bootstrap';
import { FaEye, FaUsers } from 'react-icons/fa';
import { obtenerClientes } from '../../api/usuarios';

const inicialesDe = (cliente) => {
  const nombre = (cliente.nombre || '').trim();
  const apellido = (cliente.apellido || '').trim();
  return `${nombre.charAt(0)}${apellido.charAt(0)}`.toUpperCase() || '?';
};

const nombreCompleto = (cliente) =>
  `${cliente.nombre || ''} ${cliente.apellido || ''}`.trim() || '—';

const ListaClientes = ({ todos = false }) => {
  const navigate = useNavigate();
  const [clientes, setClientes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [buscar, setBuscar] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('todos');

  useEffect(() => {
    const cargar = async () => {
      setCargando(true);
      setError('');
      const result = await obtenerClientes();
      if (result.success) {
        setClientes(result.data);
      } else {
        setError(result.error || 'No se pudieron cargar los clientes.');
      }
      setCargando(false);
    };
    cargar();
  }, []);

  const visibles = useMemo(() => {
    const q = buscar.trim().toLowerCase();
    return clientes.filter((cliente) => {
      if (filtroEstado === 'activos' && !cliente.activo) return false;
      if (filtroEstado === 'inactivos' && cliente.activo) return false;
      if (!q) return true;
      return `${cliente.nombre || ''} ${cliente.apellido || ''} ${cliente.email || ''}`
        .toLowerCase()
        .includes(q);
    });
  }, [clientes, buscar, filtroEstado]);

  const handleVerDetalle = (id) => {
    navigate(
      todos ? `/superadmin/clientes/${id}` : `/admin/clientes/${id}`
    );
  };

  return (
    <Container>
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <h1 className="h2 mb-0">
          <FaUsers className="me-2" aria-hidden="true" />
          Clientes{' '}
          <Badge bg="secondary" pill>
            {visibles.length} de {clientes.length}
          </Badge>
        </h1>
        <p className="text-muted mb-0">
          {todos
            ? 'Todos los clientes registrados.'
            : 'Clientes con al menos un pedido en tu sucursal.'}
        </p>
      </div>

      {error && <Alert variant="danger" role="alert">{error}</Alert>}

      <Row className="g-2 mb-3">
        <Col xs={12} md={6}>
          <Form.Control
            type="search"
            size="sm"
            placeholder="Buscar por nombre o email..."
            value={buscar}
            onChange={(e) => setBuscar(e.target.value)}
          />
        </Col>
        <Col xs={6} md={3}>
          <Form.Select
            size="sm"
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
          >
            <option value="todos">Estado: Todos</option>
            <option value="activos">Estado: Activos</option>
            <option value="inactivos">Estado: Inactivos</option>
          </Form.Select>
        </Col>
      </Row>

      {cargando ? (
        <div className="text-center py-5">
          <Spinner animation="border" variant="danger" />
        </div>
      ) : visibles.length === 0 ? (
        <p className="text-center text-muted py-4">Sin resultados para los filtros.</p>
      ) : (
        <Table striped bordered hover responsive className="tabla-admin shadow-sm">
          <thead className="table-dark">
            <tr>
              <th>ID</th>
              <th>Cliente</th>
              <th>Email</th>
              <th>Teléfono</th>
              <th>Pedidos</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {visibles.map((cliente) => (
              <tr key={cliente.id}>
                <td data-label="ID">{cliente.id}</td>
                <td data-label="Cliente">
                  <span
                    className="me-2 d-inline-flex align-items-center justify-content-center rounded-circle fw-bold"
                    style={{
                      width: '38px',
                      height: '38px',
                      backgroundColor: '#fff4e2',
                      border: '1px solid #f1c27d',
                      color: '#b55d00',
                    }}
                  >
                    {inicialesDe(cliente)}
                  </span>
                  <strong>{nombreCompleto(cliente)}</strong>
                </td>
                <td data-label="Email">{cliente.email}</td>
                <td data-label="Teléfono">{cliente.telefono || <span className="text-muted">—</span>}</td>
                <td data-label="Pedidos">
                  <Badge bg="secondary" pill>{cliente.cantidadPedidos ?? 0}</Badge>
                </td>
                <td data-label="Estado">
                  {cliente.activo ? (
                    <Badge bg="success">Activo</Badge>
                  ) : (
                    <Badge bg="secondary">Inactivo</Badge>
                  )}
                </td>
                <td data-label="Acciones">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleVerDetalle(cliente.id)}
                  >
                    <FaEye className="me-1" aria-hidden="true" />
                    Ver detalle
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </Container>
  );
};

export default ListaClientes;

ListaClientes.propTypes = {
  todos: PropTypes.bool,
};

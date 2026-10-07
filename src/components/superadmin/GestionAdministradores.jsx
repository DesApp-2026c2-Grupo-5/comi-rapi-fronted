/**
 * Propósito: Gestión de usuarios administrativos del SUPERADMINISTRADOR:
 *            listado, alta, edición y activación/desactivación de
 *            ADMINISTRADOR y SUPERADMINISTRADOR.
 * Contenido: Componente GestionAdministradores con buscador, tabla y un modal
 *            de alta/edición (selector de rol y de sucursal). Carga desde el
 *            backend (roles ADMINISTRADOR y SUPERADMINISTRADOR).
 * Dependencias: react-bootstrap, api/usuarios, api/sucursales, react-icons.
 * Uso: <GestionAdministradores /> - Se renderiza en GestionAdministradoresPage.
 */

import { useState, useEffect, useMemo } from 'react';
import {
  Table,
  Button,
  Container,
  Spinner,
  Alert,
  Badge,
  Form,
  Row,
  Col,
  Modal,
} from 'react-bootstrap';
import { FaUserTie, FaPlus, FaEdit, FaStore } from 'react-icons/fa';
import {
  obtenerAdministradores,
  crearUsuarioPanel,
  actualizarUsuarioPanel,
} from '../../api/usuarios';
import { obtenerSucursales } from '../../api/sucursales';

const inicialesDe = (admin) => {
  const nombre = (admin.nombre || '').trim();
  const apellido = (admin.apellido || '').trim();
  return `${nombre.charAt(0)}${apellido.charAt(0)}`.toUpperCase() || '?';
};

const nombreCompleto = (admin) =>
  `${admin.nombre || ''} ${admin.apellido || ''}`.trim() || '—';

const FORMULARIO_VACIO = {
  nombre: '',
  apellido: '',
  email: '',
  telefono: '',
  password: '',
  rol: 'ADMINISTRADOR',
  sucursalId: '',
  activo: true,
};

const ETIQUETA_ROL = {
  ADMINISTRADOR: 'Administrador',
  SUPERADMINISTRADOR: 'Superadmin',
};

const GestionAdministradores = () => {
  const [administradores, setAdministradores] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [buscar, setBuscar] = useState('');
  const [sucursales, setSucursales] = useState([]);

  const [modalAbierto, setModalAbierto] = useState(false);
  const [editando, setEditando] = useState(null);
  const [formulario, setFormulario] = useState(FORMULARIO_VACIO);
  const [guardando, setGuardando] = useState(false);
  const [errorFormulario, setErrorFormulario] = useState('');

  const cargar = async () => {
    setCargando(true);
    setError('');
    const result = await obtenerAdministradores();
    if (result.success) {
      setAdministradores(result.data);
    } else {
      setError(result.error || 'No se pudieron cargar los administradores.');
    }
    setCargando(false);
  };

  useEffect(() => {
    cargar();
    obtenerSucursales({ incluirInactivas: true }).then((result) => {
      if (result.success) setSucursales(result.data);
    });
  }, []);

  const nombreSucursal = (sucursalId) => {
    const sucursal = sucursales.find((s) => s.id === Number(sucursalId));
    if (!sucursal) return '—';
    return sucursal.activa
      ? sucursal.nombre
      : `${sucursal.nombre} (inactiva)`;
  };

  const visibles = useMemo(() => {
    const q = buscar.trim().toLowerCase();
    if (!q) return administradores;
    return administradores.filter((admin) =>
      `${admin.nombre || ''} ${admin.apellido || ''} ${admin.email || ''}`
        .toLowerCase()
        .includes(q)
    );
  }, [administradores, buscar]);

  const abrirNuevo = () => {
    setEditando(null);
    setFormulario(FORMULARIO_VACIO);
    setErrorFormulario('');
    setModalAbierto(true);
  };

  const abrirEdicion = (admin) => {
    setEditando(admin);
    setFormulario({
      nombre: admin.nombre || '',
      apellido: admin.apellido || '',
      email: admin.email || '',
      telefono: admin.telefono || '',
      password: '',
      rol: admin.rol || 'ADMINISTRADOR',
      sucursalId: admin.sucursalId ? String(admin.sucursalId) : '',
      activo: Boolean(admin.activo),
    });
    setErrorFormulario('');
    setModalAbierto(true);
  };

  const cambiarCampo = (campo, valor) => {
    setFormulario((previo) => ({ ...previo, [campo]: valor }));
  };

  const guardarAdministrador = async (e) => {
    e.preventDefault();
    setErrorFormulario('');

    if (!formulario.nombre.trim() || !formulario.email.trim()) {
      setErrorFormulario('El nombre y el email son obligatorios.');
      return;
    }
    if (!editando && formulario.password.length < 6) {
      setErrorFormulario('La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    const esAdministrador = formulario.rol === 'ADMINISTRADOR';
    if (esAdministrador && !formulario.sucursalId) {
      setErrorFormulario('Un administrador debe tener una sucursal asignada.');
      return;
    }

    setGuardando(true);
    const datos = {
      nombre: formulario.nombre.trim(),
      apellido: formulario.apellido.trim(),
      email: formulario.email.trim(),
      telefono: formulario.telefono.trim() || undefined,
      activo: formulario.activo,
      rol: formulario.rol,
    };
    if (esAdministrador) {
      datos.sucursalId = Number(formulario.sucursalId);
    }
    if (editando) {
      const result = await actualizarUsuarioPanel(editando.id, datos);
      if (!result.success) {
        setErrorFormulario(result.error || 'No se pudo actualizar el administrador.');
        setGuardando(false);
        return;
      }
    } else {
      datos.password = formulario.password;
      const result = await crearUsuarioPanel(datos);
      if (!result.success) {
        setErrorFormulario(result.error || 'No se pudo crear el administrador.');
        setGuardando(false);
        return;
      }
    }
    setGuardando(false);
    setModalAbierto(false);
    await cargar();
  };

  const alternarActivo = async (admin) => {
    const result = await actualizarUsuarioPanel(admin.id, {
      activo: !admin.activo,
    });
    if (!result.success) {
      setError(result.error || 'No se pudo actualizar el estado.');
      return;
    }
    await cargar();
  };

  return (
    <Container>
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <h1 className="h2 mb-0">
          <FaUserTie className="me-2" aria-hidden="true" />
          Administradores{' '}
          <Badge bg="secondary" pill>
            {visibles.length} de {administradores.length}
          </Badge>
        </h1>
        <Button variant="warning" className="fw-semibold" onClick={abrirNuevo}>
          <FaPlus className="me-1" aria-hidden="true" />
          Nuevo usuario
        </Button>
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
      </Row>

      {cargando ? (
        <div className="text-center py-5">
          <Spinner animation="border" variant="danger" />
        </div>
      ) : visibles.length === 0 ? (
        <p className="text-center text-muted py-4">
          Sin resultados para los filtros.
        </p>
      ) : (
        <Table striped bordered hover responsive className="tabla-admin shadow-sm">
          <thead className="table-dark">
            <tr>
              <th>Nombre</th>
              <th>Email</th>
              <th>Rol</th>
              <th>Sucursal</th>
              <th>Pedidos</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {visibles.map((admin) => (
              <tr key={admin.id}>
                <td data-label="Nombre">
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
                    {inicialesDe(admin)}
                  </span>
                  <strong>{nombreCompleto(admin)}</strong>
                </td>
                <td data-label="Email">{admin.email}</td>
                <td data-label="Rol">
                  <Badge bg={admin.rol === 'SUPERADMINISTRADOR' ? 'dark' : 'warning'}>
                    {ETIQUETA_ROL[admin.rol] || admin.rol}
                  </Badge>
                </td>
                <td data-label="Sucursal">
                  <FaStore className="me-1 text-secondary" aria-hidden="true" />
                  {admin.sucursalId ? nombreSucursal(admin.sucursalId) : '—'}
                </td>
                <td data-label="Pedidos">
                  <Badge bg="secondary" pill>
                    {admin.cantidadPedidos ?? 0}
                  </Badge>
                </td>
                <td data-label="Estado">
                  {admin.activo ? (
                    <Badge bg="success">Activo</Badge>
                  ) : (
                    <Badge bg="secondary">Inactivo</Badge>
                  )}
                </td>
                <td data-label="Acciones">
                  <Button
                    variant="secondary"
                    size="sm"
                    className="me-1"
                    onClick={() => abrirEdicion(admin)}
                  >
                    <FaEdit className="me-1" aria-hidden="true" />
                    Editar
                  </Button>
                  <Button
                    variant={admin.activo ? 'outline-danger' : 'outline-success'}
                    size="sm"
                    onClick={() => alternarActivo(admin)}
                  >
                    {admin.activo ? 'Desactivar' : 'Activar'}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}

      <Modal show={modalAbierto} onHide={() => setModalAbierto(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title as="h2" className="h5">
            {editando ? 'Editar usuario' : 'Nuevo usuario'}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={guardarAdministrador} noValidate>
          <Modal.Body>
            {errorFormulario && (
              <Alert variant="warning" role="alert">
                {errorFormulario}
              </Alert>
            )}
            <Row>
              <Col md={6} className="mb-3">
                <Form.Group controlId="admin-nombre">
                  <Form.Label>Nombre</Form.Label>
                  <Form.Control
                    type="text"
                    value={formulario.nombre}
                    onChange={(e) => cambiarCampo('nombre', e.target.value)}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6} className="mb-3">
                <Form.Group controlId="admin-apellido">
                  <Form.Label>Apellido</Form.Label>
                  <Form.Control
                    type="text"
                    value={formulario.apellido}
                    onChange={(e) => cambiarCampo('apellido', e.target.value)}
                  />
                </Form.Group>
              </Col>
              <Col md={6} className="mb-3">
                <Form.Group controlId="admin-email">
                  <Form.Label>Email</Form.Label>
                  <Form.Control
                    type="email"
                    value={formulario.email}
                    onChange={(e) => cambiarCampo('email', e.target.value)}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6} className="mb-3">
                <Form.Group controlId="admin-rol">
                  <Form.Label>Rol</Form.Label>
                  <Form.Select
                    value={formulario.rol}
                    onChange={(e) => cambiarCampo('rol', e.target.value)}
                  >
                    <option value="ADMINISTRADOR">Administrador</option>
                    <option value="SUPERADMINISTRADOR">Superadmin</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              {formulario.rol === 'ADMINISTRADOR' ? (
                <Col md={6} className="mb-3">
                  <Form.Group controlId="admin-sucursal">
                    <Form.Label>Sucursal asignada</Form.Label>
                    <Form.Select
                      value={formulario.sucursalId}
                      onChange={(e) => cambiarCampo('sucursalId', e.target.value)}
                      required
                    >
                      <option value="">Seleccioná una sucursal…</option>
                      {sucursales.map((sucursal) => (
                        <option key={sucursal.id} value={sucursal.id}>
                          {sucursal.nombre}
                          {sucursal.activa ? '' : ' (inactiva)'}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
              ) : (
                <Col md={6} className="mb-3 d-flex align-items-end">
                  <p className="text-muted mb-0 small">
                    El superadmin no lleva sucursal asignada.
                  </p>
                </Col>
              )}
              <Col md={6} className="mb-3">
                <Form.Group controlId="admin-password">
                  <Form.Label>
                    Contraseña{editando ? ' (nueva, opcional)' : ''}
                  </Form.Label>
                  <Form.Control
                    type="password"
                    value={formulario.password}
                    onChange={(e) => cambiarCampo('password', e.target.value)}
                    placeholder={editando ? 'Dejar vacío para no cambiarla' : 'Mínimo 6 caracteres'}
                    required={!editando}
                  />
                </Form.Group>
              </Col>
              <Col md={6} className="mb-3">
                <Form.Group controlId="admin-telefono">
                  <Form.Label>Teléfono</Form.Label>
                  <Form.Control
                    type="text"
                    value={formulario.telefono}
                    onChange={(e) => cambiarCampo('telefono', e.target.value)}
                  />
                </Form.Group>
              </Col>
            </Row>
            <Form.Check
              type="switch"
              id="admin-activo"
              label="Cuenta activa"
              checked={formulario.activo}
              onChange={(e) => cambiarCampo('activo', e.target.checked)}
            />
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setModalAbierto(false)}>
              Cancelar
            </Button>
            <Button type="submit" variant="warning" disabled={guardando}>
              {guardando ? 'Guardando…' : editando ? 'Guardar cambios' : 'Crear usuario'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
};

export default GestionAdministradores;
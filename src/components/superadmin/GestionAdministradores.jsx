import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Alert, Badge, Button, Col, Form, Row, Table } from 'react-bootstrap';
import { FaEdit, FaPlus, FaStore, FaUserTie } from 'react-icons/fa';
import { actualizarUsuarioPanel } from '../../api/usuarios';
import { useAdministradoresQuery } from '../../hooks/queries';
import { useSucursal } from '../../hooks/useSucursal';
import { SkeletonTabla } from '../comunes/Skeleton';

const CLAVE_ADMINISTRADORES = ['private', 'administradores'];

const ETIQUETA_ROL = {
  ADMINISTRADOR: 'Administrador',
  SUPERADMINISTRADOR: 'Superadmin',
};

const inicialesDe = (admin) => {
  const nombre = (admin.nombre || '').trim();
  const apellido = (admin.apellido || '').trim();
  return `${nombre.charAt(0)}${apellido.charAt(0)}`.toUpperCase() || '?';
};

const nombreCompleto = (admin) =>
  `${admin.nombre || ''} ${admin.apellido || ''}`.trim() || '—';

const GestionAdministradores = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const {
    data: dataAdministradores,
    isPending: cargando,
    error: errorQuery,
  } = useAdministradoresQuery();
  const administradores = useMemo(
    () => dataAdministradores?.items || [],
    [dataAdministradores]
  );
  const { sucursales = [], obtenerSucursales } = useSucursal();

  useEffect(() => {
    obtenerSucursales();
  }, [obtenerSucursales]);

  const [errorAccion, setErrorAccion] = useState('');
  const [buscar, setBuscar] = useState('');
  const error = errorAccion || errorQuery?.message || '';

  const refrescarAdministradores = () =>
    queryClient.invalidateQueries({ queryKey: CLAVE_ADMINISTRADORES });

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
    navigate('/superadmin/administrador/nuevo');
  };

  const abrirEdicion = (admin) => {
    navigate(`/superadmin/administrador/editar/${admin.id}`);
  };

  const alternarActivo = async (admin) => {
    setErrorAccion('');
    const result = await actualizarUsuarioPanel(admin.id, {
      activo: !admin.activo,
    });
    if (!result.success) {
      setErrorAccion(result.error || 'No se pudo actualizar el estado.');
      return;
    }
    await refrescarAdministradores();
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <h1 className="h2 mb-0">
          <FaUserTie className="me-2" aria-hidden="true" />
          Administradores{' '}
          <Badge bg="secondary" pill>
            {visibles.length} de {administradores.length}
          </Badge>
        </h1>
        <Button variant="primary" className="fw-semibold" onClick={abrirNuevo}>
          <FaPlus className="me-1" aria-hidden="true" />
          Nuevo administrador
        </Button>
      </div>

      {error && (
        <Alert variant="danger" role="alert">
          {error}
        </Alert>
      )}

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
        <div role="status" aria-live="polite">
          <span className="visually-hidden">Cargando administradores…</span>
          <SkeletonTabla filas={5} columnas={4} />
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
                      backgroundColor: 'var(--color-cream)',
                      border: '1px solid var(--color-border-cream)',
                      color: 'var(--color-primary-dark)',
                    }}
                  >
                    {inicialesDe(admin)}
                  </span>
                  <strong>{nombreCompleto(admin)}</strong>
                </td>
                <td data-label="Email">{admin.email}</td>
                <td data-label="Rol">
                  <Badge
                    bg={
                      admin.rol === 'SUPERADMINISTRADOR' ? 'dark' : 'warning'
                    }
                  >
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
    </div>
  );
};

export default GestionAdministradores;

/**
 * Propósito: Página de gestión de sucursales para el administrador.
 * Contenido: Tabla con todas las sucursales (ID, Nombre, Dirección, Teléfono, Estado, Acciones),
 *            botón "Agregar nueva sucursal" y acciones de Editar/Eliminar con confirmación.
 * Dependencias: react-bootstrap (Container, Table, Button, Spinner), react-router-dom (useNavigate),
 *               context/SucursalContext (useSucursal).
 * Uso: Ruta "/admin/sucursales" → <GestionSucursales />
 */

import React, { useEffect, useState } from 'react';
import { Container, Table, Button, Spinner, Badge } from 'react-bootstrap';
import { FaPlus, FaEdit, FaTrashAlt } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { useSucursal } from '../../hooks/useSucursal';
import { useNotificaciones } from '../../hooks/useNotificaciones';
import { formatearDireccion } from '../../utils/direccion';
import ConfirmarModal from '../../components/comunes/ConfirmarModal';

const GestionSucursales = () => {
  const navigate = useNavigate();
  const { notificar } = useNotificaciones();
  const { sucursales, loading, obtenerSucursales, eliminarSucursal } = useSucursal();
  // Sucursal { id, nombre } que espera confirmación en el modal
  const [sucursalAEliminar, setSucursalAEliminar] = useState(null);
  const [confirmando, setConfirmando] = useState(false);

  // Recarga las sucursales al montar
  useEffect(() => {
    obtenerSucursales();
  }, [obtenerSucursales]);

  // Redirige al formulario de nueva sucursal
  const handleNuevo = () => {
    navigate('/admin/sucursal/nuevo');
  };

  // Redirige a la edición de una sucursal
  const handleEditar = (id) => {
    navigate(`/admin/sucursal/editar/${id}`);
  };

  // Abre el modal de confirmación para eliminar
  const handleEliminar = (id, nombre) => setSucursalAEliminar({ id, nombre });

  const confirmarEliminar = async () => {
    if (!sucursalAEliminar) return;
    setConfirmando(true);
    const ok = await eliminarSucursal(sucursalAEliminar.id);
    notificar(
      ok
        ? `Sucursal "${sucursalAEliminar.nombre}" eliminada correctamente.`
        : 'No se pudo eliminar la sucursal.',
      ok ? 'success' : 'danger'
    );
    setSucursalAEliminar(null);
    setConfirmando(false);
  };

  return (
    <Container fluid className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <h2 className="mb-0">Gestión de Sucursales</h2>
        <Button variant="primary" onClick={handleNuevo}>
          <FaPlus className="me-1" aria-hidden="true" />
          Agregar nueva sucursal
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" variant="danger" />
        </div>
      ) : (
        <Table striped bordered hover responsive className="tabla-admin shadow-sm">
          <thead className="table-dark">
            <tr>
              <th>ID</th>
              <th>Nombre</th>
              <th>Dirección</th>
              <th>Teléfono</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {sucursales.length === 0 && (
              <tr>
                <td colSpan={6} className="columna-acciones text-center">
                  No hay sucursales registradas.
                </td>
              </tr>
            )}
            {sucursales.map((sucursal) => (
              <tr key={sucursal.id}>
                <td data-label="ID">{sucursal.id}</td>
                <td data-label="Nombre">{sucursal.nombre}</td>
                <td data-label="Dirección">{formatearDireccion(sucursal.direccion)}</td>
                <td data-label="Teléfono">{sucursal.telefono || '-'}</td>
                <td data-label="Estado">
                  <Badge bg={sucursal.activa !== false ? 'success' : 'secondary'}>
                    {sucursal.activa !== false ? 'Activo' : 'Inactivo'}
                  </Badge>
                </td>
                <td className="columna-acciones text-nowrap">
                  <Button
                    variant="secondary"
                    size="sm"
                    className="me-2"
                    onClick={() => handleEditar(sucursal.id)}
                  >
                    <FaEdit className="me-1" aria-hidden="true" />
                    Editar
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleEliminar(sucursal.id, sucursal.nombre)}
                  >
                    <FaTrashAlt className="me-1" aria-hidden="true" />
                    Eliminar
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}

      <ConfirmarModal
        mostrar={Boolean(sucursalAEliminar)}
        titulo="Eliminar sucursal"
        mensaje={
          sucursalAEliminar
            ? `¿Seguro que querés eliminar la sucursal "${sucursalAEliminar.nombre}"?`
            : ''
        }
        textoConfirmar="Sí, eliminar"
        cargando={confirmando}
        onConfirmar={confirmarEliminar}
        onCancelar={() => setSucursalAEliminar(null)}
      />
    </Container>
  );
};

export default GestionSucursales;
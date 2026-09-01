/**
 * Propósito: Página de gestión de sucursales para el administrador.
 * Contenido: Tabla con todas las sucursales (ID, Nombre, Dirección, Teléfono, Estado, Acciones),
 *            botón "Agregar nueva sucursal" y acciones de Editar/Eliminar con confirmación.
 * Dependencias: react-bootstrap (Container, Table, Button, Alert, Spinner), react-router-dom (useNavigate),
 *               context/SucursalContext (useSucursal), utils/constants.js (ESTADO_SUCURSAL).
 * Uso: Ruta "/admin/sucursales" → <GestionSucursales />
 */

import React, { useEffect, useState } from 'react';
import { Container, Table, Button, Alert, Spinner, Badge } from 'react-bootstrap';
import { FaPlus, FaEdit, FaTrashAlt } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { useSucursal } from '../../hooks/useSucursal';
import { ESTADO_SUCURSAL } from '../../utils/constants';

const GestionSucursales = () => {
  const navigate = useNavigate();
  const { sucursales, loading, obtenerSucursales, eliminarSucursal } = useSucursal();
  const [mensaje, setMensaje] = useState('');

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

  // Elimina una sucursal previa confirmación del usuario
  const handleEliminar = async (id, nombre) => {
    const confirmado = window.confirm(`¿Seguro que querés eliminar la sucursal "${nombre}"?`);
    if (!confirmado) return;

    const ok = await eliminarSucursal(id);
    if (ok) {
      setMensaje(`Sucursal "${nombre}" eliminada correctamente (simulado).`);
    } else {
      setMensaje('No se pudo eliminar la sucursal.');
    }
  };

  return (
    <Container fluid className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-0">Gestión de Sucursales</h2>
        <Button variant="primary" onClick={handleNuevo}>
          <FaPlus className="me-1" aria-hidden="true" />
          Agregar nueva sucursal
        </Button>
      </div>

      {mensaje && <Alert variant="success" dismissible onClose={() => setMensaje('')}>{mensaje}</Alert>}

      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" variant="danger" />
        </div>
      ) : (
        <Table striped bordered hover responsive className="shadow-sm">
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
                <td colSpan={6} className="text-center">
                  No hay sucursales registradas.
                </td>
              </tr>
            )}
            {sucursales.map((sucursal) => (
              <tr key={sucursal.id}>
                <td>{sucursal.id}</td>
                <td>{sucursal.nombre}</td>
                <td>{sucursal.direccion}</td>
                <td>{sucursal.telefono || '-'}</td>
                <td>
                  <Badge
                    bg={sucursal.estado === ESTADO_SUCURSAL.ACTIVO ? 'success' : 'secondary'}
                  >
                    {sucursal.estado === ESTADO_SUCURSAL.ACTIVO ? 'Activo' : 'Inactivo'}
                  </Badge>
                </td>
                <td className="text-nowrap">
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
    </Container>
  );
};

export default GestionSucursales;
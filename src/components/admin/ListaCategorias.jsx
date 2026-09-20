/**
 * Propósito: Tabla de categorías para gestión del admin usando Table de Bootstrap.
 * Contenido: Componente ListaCategorias con tabla, botones Editar/Reactivar/Eliminar
 *            y carga desde el backend (incluye inactivas).
 * Dependencias: react-bootstrap (Table, Button, Container, Spinner, Alert, Badge),
 *               api/categorias.js, react-router-dom, react-icons.
 * Uso: <ListaCategorias /> - Se renderiza en GestionCategorias.
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Table, Button, Container, Spinner, Alert, Badge } from 'react-bootstrap';
import { FaPlus, FaEdit, FaTrashAlt, FaUndoAlt } from 'react-icons/fa';
import { obtenerCategorias, eliminarCategoria, editarCategoria } from '../../api/categorias';
import ConfirmarModal from '../comunes/ConfirmarModal';

const ListaCategorias = () => {
  const navigate = useNavigate();
  const [categorias, setCategorias] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  // Objetos { id, nombre } que esperan confirmación en el modal
  const [categoriaAEliminar, setCategoriaAEliminar] = useState(null);
  const [categoriaAReactivar, setCategoriaAReactivar] = useState(null);
  const [confirmando, setConfirmando] = useState(false);

  const cargarCategorias = async () => {
    setCargando(true);
    setError('');
    const result = await obtenerCategorias({ incluirInactivas: true });
    if (result.success) {
      setCategorias(result.data);
    } else {
      setError(result.error || 'No se pudieron cargar las categorías.');
    }
    setCargando(false);
  };

  useEffect(() => {
    cargarCategorias();
  }, []);

  const handleEditar = (id) => {
    navigate(`/admin/categoria/editar/${id}`);
  };

  const handleNuevo = () => {
    navigate('/admin/categoria/nuevo');
  };

  const handleEliminar = (id, nombre) => setCategoriaAEliminar({ id, nombre });

  const confirmarEliminar = async () => {
    if (!categoriaAEliminar) return;
    setConfirmando(true);
    const result = await eliminarCategoria(categoriaAEliminar.id);
    if (result.success) {
      setCategoriaAEliminar(null);
      cargarCategorias();
    } else {
      setError(result.error || 'No se pudo eliminar la categoría.');
    }
    setConfirmando(false);
  };

  const handleReactivar = (id, nombre) => setCategoriaAReactivar({ id, nombre });

  const confirmarReactivar = async () => {
    if (!categoriaAReactivar) return;
    setConfirmando(true);
    const result = await editarCategoria(categoriaAReactivar.id, { activa: true });
    if (result.success) {
      setCategoriaAReactivar(null);
      cargarCategorias();
    } else {
      setError(result.error || 'No se pudo reactivar la categoría.');
    }
    setConfirmando(false);
  };

  return (
    <Container>
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <h2 className="mb-0">Gestión de Categorías</h2>
        <Button variant="primary" onClick={handleNuevo}>
          <FaPlus className="me-1" aria-hidden="true" />
          Agregar nueva categoría
        </Button>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

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
              <th>Descripción</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {categorias.map((categoria) => (
              <tr key={categoria.id}>
                <td data-label="ID">{categoria.id}</td>
                <td data-label="Nombre">{categoria.nombre}</td>
                <td data-label="Descripción">{categoria.descripcion}</td>
                <td data-label="Estado">
                  {categoria.activa ? (
                    <Badge bg="success">Activa</Badge>
                  ) : (
                    <Badge bg="secondary">Inactiva</Badge>
                  )}
                </td>
                <td className="columna-acciones">
                  <Button variant="secondary" size="sm" className="me-2" onClick={() => handleEditar(categoria.id)}>
                    <FaEdit className="me-1" aria-hidden="true" />
                    Editar
                  </Button>
                  {!categoria.activa && (
                    <Button variant="warning" size="sm" className="me-2" onClick={() => handleReactivar(categoria.id, categoria.nombre)}>
                      <FaUndoAlt className="me-1" aria-hidden="true" />
                      Reactivar
                    </Button>
                  )}
                  <Button variant="danger" size="sm" onClick={() => handleEliminar(categoria.id, categoria.nombre)}>
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
        mostrar={Boolean(categoriaAEliminar)}
        titulo="Eliminar categoría"
        mensaje={
          categoriaAEliminar
            ? `¿Eliminar la categoría "${categoriaAEliminar.nombre}"? La baja es lógica: no se borra de la base ni elimina sus productos.`
            : ''
        }
        textoConfirmar="Sí, eliminar"
        cargando={confirmando}
        onConfirmar={confirmarEliminar}
        onCancelar={() => setCategoriaAEliminar(null)}
      />

      <ConfirmarModal
        mostrar={Boolean(categoriaAReactivar)}
        titulo="Reactivar categoría"
        mensaje={
          categoriaAReactivar
            ? `¿Reactivar la categoría "${categoriaAReactivar.nombre}"?`
            : ''
        }
        textoConfirmar="Sí, reactivar"
        cargando={confirmando}
        onConfirmar={confirmarReactivar}
        onCancelar={() => setCategoriaAReactivar(null)}
      />
    </Container>
  );
};

export default ListaCategorias;

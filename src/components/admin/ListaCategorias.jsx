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

const ListaCategorias = () => {
  const navigate = useNavigate();
  const [categorias, setCategorias] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

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

  const handleEliminar = async (id, nombre) => {
    if (
      !window.confirm(
        `¿Eliminar la categoría "${nombre}"?\nLa baja es lógica: no se borra de la base ni elimina sus productos.`
      )
    ) {
      return;
    }
    const result = await eliminarCategoria(id);
    if (result.success) {
      cargarCategorias();
    } else {
      setError(result.error || 'No se pudo eliminar la categoría.');
    }
  };

  const handleReactivar = async (id, nombre) => {
    if (!window.confirm(`¿Reactivar la categoría "${nombre}"?`)) {
      return;
    }
    const result = await editarCategoria(id, { activa: true });
    if (result.success) {
      cargarCategorias();
    } else {
      setError(result.error || 'No se pudo reactivar la categoría.');
    }
  };

  return (
    <Container>
      <div className="d-flex justify-content-between align-items-center mb-4">
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
        <Table striped bordered hover responsive className="shadow-sm">
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
                <td>{categoria.id}</td>
                <td>{categoria.nombre}</td>
                <td>{categoria.descripcion}</td>
                <td>
                  {categoria.activa ? (
                    <Badge bg="success">Activa</Badge>
                  ) : (
                    <Badge bg="secondary">Inactiva</Badge>
                  )}
                </td>
                <td>
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
    </Container>
  );
};

export default ListaCategorias;

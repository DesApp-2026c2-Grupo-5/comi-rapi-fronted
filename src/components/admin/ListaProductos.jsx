/**
 * Propósito: Tabla de productos para gestión del admin usando la API real.
 * Contenido: Componente ListaProductos con tabla y botones Editar/Eliminar.
 * Dependencias: react-bootstrap (Table, Button, Container, Spinner, Alert),
 *               api/productos.js, formatters.js, react-router-dom.
 * Uso: <ListaProductos /> - Se renderiza en GestionProductos.
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Table, Button, Container, Spinner, Alert } from 'react-bootstrap';
import { FaPlus, FaEdit, FaTrashAlt } from 'react-icons/fa';
import { obtenerProductos, eliminarProducto } from '../../api/productos';
import { formatPrice } from '../../utils/formatters';

const ListaProductos = () => {
  const navigate = useNavigate();
  const [productos, setProductos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  const cargar = async () => {
    setCargando(true);
    setError('');
    const resultado = await obtenerProductos();
    if (resultado.success) {
      setProductos(resultado.data);
    } else {
      setError(resultado.error || 'No se pudieron cargar los productos.');
    }
    setCargando(false);
  };

  useEffect(() => {
    cargar();
  }, []);

  const handleEditar = (id) => {
    navigate(`/admin/producto/editar/${id}`);
  };

  const handleEliminar = async (id, nombre) => {
    const confirmar = window.confirm(`¿Eliminar el producto "${nombre}"?`);
    if (!confirmar) return;
    const resultado = await eliminarProducto(id);
    if (resultado.success) {
      alert(`Producto "${nombre}" eliminado.`);
      cargar();
    } else {
      alert(resultado.error || 'No se pudo eliminar el producto.');
    }
  };

  const handleNuevo = () => {
    navigate('/admin/producto/nuevo');
  };

  return (
    <Container>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-0">Gestión de Productos</h2>
        <Button variant="primary" onClick={handleNuevo}>
          <FaPlus className="me-1" aria-hidden="true" />
          Agregar nuevo producto
        </Button>
      </div>
      {cargando ? (
        <div className="text-center py-5">
          <Spinner animation="border" variant="danger" />
        </div>
      ) : error ? (
        <Alert variant="danger">{error}</Alert>
      ) : (
        <Table striped bordered hover responsive className="shadow-sm">
          <thead className="table-dark">
            <tr>
              <th>ID</th>
              <th>Nombre</th>
              <th>Precio</th>
              <th>Categoría</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {productos.map((producto) => (
              <tr key={producto.id}>
                <td>{producto.id}</td>
                <td>{producto.nombre}</td>
                <td>{formatPrice(producto.precio)}</td>
                <td>{producto.categoria}</td>
                <td>
                  <Button variant="secondary" size="sm" className="me-2" onClick={() => handleEditar(producto.id)}>
                    <FaEdit className="me-1" aria-hidden="true" />
                    Editar
                  </Button>
                  <Button variant="danger" size="sm" onClick={() => handleEliminar(producto.id, producto.nombre)}>
                    <FaTrashAlt className="me-1" aria-hidden="true" />
                    Eliminar
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
      {!cargando && !error && productos.length === 0 && (
        <Alert variant="light">No hay productos todavía.</Alert>
      )}
    </Container>
  );
};

export default ListaProductos;
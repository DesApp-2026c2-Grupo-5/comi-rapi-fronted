/**
 * Propósito: Tabla de productos para gestión del admin usando Table de Bootstrap.
 * Contenido: Componente ListaProductos con tabla y botones Editar/Eliminar.
 * Dependencias: react-bootstrap (Table, Button, Container), seedData.js, formatters.js, react-router-dom.
 * Uso: <ListaProductos /> - Se renderiza en GestionProductos.
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Table, Button, Container } from 'react-bootstrap';
import { productosMock } from '../../services/seedData';
import { formatPrice } from '../../utils/formatters';

const ListaProductos = () => {
  const navigate = useNavigate();

  const handleEditar = (id) => {
    navigate(`/admin/producto/editar/${id}`);
  };

  const handleEliminar = (id, nombre) => {
    alert(`Producto "${nombre}" eliminado (simulado).`);
  };

  const handleNuevo = () => {
    navigate('/admin/producto/nuevo');
  };

  return (
    <Container>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-0">Gestión de Productos</h2>
        <Button variant="danger" onClick={handleNuevo}>Agregar nuevo producto</Button>
      </div>
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
          {productosMock.map((producto) => (
            <tr key={producto.id}>
              <td>{producto.id}</td>
              <td>{producto.nombre}</td>
              <td>{formatPrice(producto.precio)}</td>
              <td>{producto.categoria}</td>
              <td>
                <Button variant="secondary" size="sm" className="me-2" onClick={() => handleEditar(producto.id)}>
                  Editar
                </Button>
                <Button variant="danger" size="sm" onClick={() => handleEliminar(producto.id, producto.nombre)}>
                  Eliminar
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </Container>
  );
};

export default ListaProductos;

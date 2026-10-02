/**
 * Propósito: Tabla de productos para gestión del admin usando Table de Bootstrap.
 * Contenido: Componente ListaProductos con tabla, botones Editar/Eliminar y carga desde el backend.
 * Dependencias: react-bootstrap (Table, Button, Container, Spinner, Alert), api/productos.js,
 *               formatters.js, react-router-dom.
 * Uso: <ListaProductos /> - Se renderiza en GestionProductos.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Table, Button, Container, Spinner, Alert, Form } from 'react-bootstrap';
import { FaPlus, FaEdit, FaTrashAlt } from 'react-icons/fa';
import { obtenerProductos, eliminarProducto } from '../../api/productos';
import { formatPrice } from '../../utils/formatters';
import { useNotificaciones } from '../../hooks/useNotificaciones';
import ConfirmarModal from '../comunes/ConfirmarModal';

const ListaProductos = () => {
  const navigate = useNavigate();
  const { notificar } = useNotificaciones();
  const [productos, setProductos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  // Producto { id, nombre } que espera confirmación en el modal
  const [productoAEliminar, setProductoAEliminar] = useState(null);
  const [confirmando, setConfirmando] = useState(false);
  const [filtro, setFiltro] = useState('todos'); // 'todos' | 'productos' | 'combos'

  const productosFiltrados = useMemo(() => {
    if (filtro === 'todos') return productos;
    if (filtro === 'combos') return productos.filter((p) => p.tipo === 'COMBO');
    return productos.filter((p) => p.tipo !== 'COMBO');
  }, [productos, filtro]);

  const cargarProductos = async () => {
    setCargando(true);
    setError('');
    const result = await obtenerProductos();
    if (result.success) {
      setProductos(result.data);
    } else {
      setError(result.error || 'No se pudieron cargar los productos.');
    }
    setCargando(false);
  };

  useEffect(() => {
    cargarProductos();
  }, []);

  const handleEditar = (id) => {
    navigate(`/admin/producto/editar/${id}`);
  };

  const handleEliminar = (id, nombre) => setProductoAEliminar({ id, nombre });

  const confirmarEliminar = async () => {
    if (!productoAEliminar) return;
    setConfirmando(true);
    const result = await eliminarProducto(productoAEliminar.id);
    if (result.success) {
      notificar(`Producto "${productoAEliminar.nombre}" eliminado.`, 'success');
      setProductoAEliminar(null);
      cargarProductos();
    } else {
      setError(result.error || 'No se pudo eliminar el producto.');
    }
    setConfirmando(false);
  };

  const handleNuevo = () => {
    navigate('/admin/producto/nuevo');
  };

  // El combo tiene su propio botón y su propia pantalla: se arma con una receta
  // (qué productos lo componen y cuántos), así que no es un producto más.
  const handleNuevoCombo = () => {
    navigate('/admin/producto/nuevo-combo');
  };

  return (
    <Container>
      <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
        <h1 className="h2 mb-0">Gestión de Productos</h1>
        <div className="d-flex gap-2 flex-wrap">
          <Button variant="outline-info" onClick={handleNuevoCombo}>
            <FaPlus className="me-1" aria-hidden="true" />
            Crear combo
          </Button>
          <Button variant="primary" onClick={handleNuevo}>
            <FaPlus className="me-1" aria-hidden="true" />
            Agregar nuevo producto
          </Button>
        </div>
      </div>

      <div className="d-flex align-items-center gap-2 mb-3 flex-wrap">
        <Form.Check
          type="radio"
          id="filtro-todos"
          name="filtro-productos"
          label="Todos"
          checked={filtro === 'todos'}
          onChange={() => setFiltro('todos')}
        />
        <Form.Check
          type="radio"
          id="filtro-productos"
          name="filtro-productos"
          label="Productos"
          checked={filtro === 'productos'}
          onChange={() => setFiltro('productos')}
        />
        <Form.Check
          type="radio"
          id="filtro-combos"
          name="filtro-productos"
          label="Combos"
          checked={filtro === 'combos'}
          onChange={() => setFiltro('combos')}
        />
      </div>

      {error && <Alert variant="danger" role="alert">{error}</Alert>}

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
              <th>Precio</th>
              <th>Categoría</th>
              <th>Tipo</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {productosFiltrados.map((producto) => (
              <tr key={producto.id}>
                <td data-label="ID">{producto.id}</td>
                <td data-label="Nombre">{producto.nombre}</td>
                <td data-label="Precio">{formatPrice(producto.precio)}</td>
                <td data-label="Categoría">{producto.categoria}</td>
                <td data-label="Tipo">
                  {producto.tipo === 'COMBO' ? 'Combo' : 'Producto'}
                </td>
                <td data-label="Estado">{producto.activo ? 'Activo' : 'Inactivo'}</td>
                <td className="columna-acciones">
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
      {!cargando && !error && productos.length > 0 && productosFiltrados.length === 0 && (
        <Alert variant="light">
          {filtro === 'combos'
            ? 'No hay combos todavía.'
            : 'No hay productos simples todavía.'}
        </Alert>
      )}

      <ConfirmarModal
        mostrar={Boolean(productoAEliminar)}
        titulo="Eliminar producto"
        mensaje={
          productoAEliminar
            ? `¿Eliminar el producto "${productoAEliminar.nombre}"?`
            : ''
        }
        textoConfirmar="Sí, eliminar"
        cargando={confirmando}
        onConfirmar={confirmarEliminar}
        onCancelar={() => setProductoAEliminar(null)}
      />
    </Container>
  );
};

export default ListaProductos;

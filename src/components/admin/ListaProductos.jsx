/**
 * Propósito: Tabla de productos para la gestión del panel usando Table de Bootstrap.
 * Contenido: Componente ListaProductos con tabla, filtros por tipo, carga desde el
 *            backend y, según `soloLectura`, botones Editar/Eliminar (CRUD del
 *            superadmin) o el switch de disponibilidad por sucursal (admin).
 * Dependencias: react-bootstrap (Table, Button, Container, Spinner, Alert),
 *               api/productos.js, api/stock.js, hooks/useAuth (solo lectura),
 *               formatters.js, react-router-dom.
 * Uso: <ListaProductos /> (CRUD del superadmin) o
 *      <ListaProductos soloLectura /> (vista del admin, con disponibilidad).
 */

import { useState, useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import { Table, Button, Container, Spinner, Alert, Form } from 'react-bootstrap';
import { FaPlus, FaEdit, FaTrashAlt } from 'react-icons/fa';
import { obtenerProductos, eliminarProducto } from '../../api/productos';
import { obtenerStock, actualizarStock, crearStock } from '../../api/stock';
import { useAuth } from '../../hooks/useAuth';
import { formatPrice } from '../../utils/formatters';
import { useNotificaciones } from '../../hooks/useNotificaciones';
import ConfirmarModal from '../comunes/ConfirmarModal';

const ListaProductos = ({ soloLectura = false }) => {
  const navigate = useNavigate();
  const { notificar } = useNotificaciones();
  const { user } = useAuth();
  const [productos, setProductos] = useState([]);
  // [soloLectura] Disponibilidad por sucursal: productoId → { disponible, sucursalId }
  const [stock, setStock] = useState({});
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
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

  // En modo solo lectura al admin también le hace falta la disponibilidad de cada
  // producto en SU sucursal: GET /api/stock ya acota al admin a su propia sucursal.
  const cargarStock = async () => {
    const result = await obtenerStock();
    if (result.success) {
      const mapa = {};
      (result.data || []).forEach((fila) => {
        mapa[Number(fila.productoId)] = {
          disponible: Boolean(fila.disponible),
          sucursalId: fila.sucursalId,
        };
      });
      setStock(mapa);
    } else {
      setError(result.error || 'No se pudo cargar la disponibilidad.');
    }
  };

  useEffect(() => {
    cargarProductos();
    if (soloLectura) cargarStock();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [soloLectura]);

  const handleEditar = (id) => {
    navigate(`/superadmin/producto/editar/${id}`);
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
    navigate('/superadmin/producto/nuevo');
  };

  // El combo tiene su propio botón y su propia pantalla: se arma con una receta
  // (qué productos lo componen y cuántos), así que no es un producto más.
  const handleNuevoCombo = () => {
    navigate('/superadmin/producto/nuevo-combo');
  };

  // [soloLectura] Alterna la disponibilidad del producto en la sucursal del admin.
  // Si el producto todavía no tiene fila de stock ahí, activarlo lo da de alta.
  const alternarDisponibilidad = async (producto) => {
    const fila = stock[Number(producto.id)];
    setGuardando(true);
    if (fila) {
      const resultado = await actualizarStock(fila.sucursalId, producto.id, {
        disponible: !fila.disponible,
      });
      notificar(
        resultado.success
          ? `"${producto.nombre}" ${
              fila.disponible ? 'desactivado' : 'activado'
            } en tu sucursal.`
          : resultado.error || 'No se pudo actualizar.',
        resultado.success ? 'success' : 'danger'
      );
    } else {
      if (!user?.sucursalId) {
        notificar('No tenés sucursal asignada.', 'warning');
        setGuardando(false);
        return;
      }
      const resultado = await crearStock(user.sucursalId, producto.id);
      notificar(
        resultado.success
          ? `"${producto.nombre}" agregado al catálogo de tu sucursal. Cargá la cantidad desde Stock.`
          : resultado.error || 'No se pudo agregar.',
        resultado.success ? 'success' : 'danger'
      );
    }
    setGuardando(false);
    await cargarStock();
  };

  return (
    <Container>
      <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
        <h1 className="h2 mb-0">Gestión de Productos</h1>
        {!soloLectura && (
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
        )}
      </div>

      {soloLectura && (
        <Alert variant="info" role="alert" className="mb-3">
          Listado de solo lectura: crear, editar y eliminar el catálogo lo hace el
          SUPERADMINISTRADOR. El interruptor activa/desactiva la disponibilidad de
          cada producto en tu sucursal. Si un producto no está en ella, al activarlo
          se agrega (la cantidad se carga desde Stock).
        </Alert>
      )}

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
              <th>{soloLectura ? 'Disponible' : 'Acciones'}</th>
            </tr>
          </thead>
          <tbody>
            {productosFiltrados.map((producto) => {
              const fila = stock[Number(producto.id)];
              return (
                <tr key={producto.id}>
                  <td data-label="ID">{producto.id}</td>
                  <td data-label="Nombre">{producto.nombre}</td>
                  <td data-label="Precio">{formatPrice(producto.precio)}</td>
                  <td data-label="Categoría">{producto.categoria}</td>
                  <td data-label="Tipo">
                    {producto.tipo === 'COMBO' ? 'Combo' : 'Producto'}
                  </td>
                  <td data-label="Estado">{producto.activo ? 'Activo' : 'Inactivo'}</td>
                  <td className={soloLectura ? undefined : 'columna-acciones'}>
                    {soloLectura ? (
                      <div>
                        <Form.Check
                          type="switch"
                          id={`disp-${producto.id}`}
                          label={fila ? (fila.disponible ? 'Sí' : 'No') : 'No'}
                          checked={Boolean(fila?.disponible)}
                          disabled={guardando || cargando}
                          onChange={() => alternarDisponibilidad(producto)}
                          title={
                            fila
                              ? 'Disponibilidad en tu sucursal'
                              : 'No está en tu sucursal. Al activarlo se agrega (la cantidad se carga desde Stock).'
                          }
                        />
                        {!fila && (
                          <Form.Text className="d-block small text-muted">
                            no está en tu sucursal
                          </Form.Text>
                        )}
                      </div>
                    ) : (
                      <>
                        <Button
                          variant="secondary"
                          size="sm"
                          className="me-2"
                          onClick={() => handleEditar(producto.id)}
                        >
                          <FaEdit className="me-1" aria-hidden="true" />
                          Editar
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleEliminar(producto.id, producto.nombre)}
                        >
                          <FaTrashAlt className="me-1" aria-hidden="true" />
                          Eliminar
                        </Button>
                      </>
                    )}
                  </td>
                </tr>
              );
            })}
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

ListaProductos.propTypes = {
  soloLectura: PropTypes.bool,
};
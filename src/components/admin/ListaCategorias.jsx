/**
 * Propósito: Tabla de categorías para la gestión del panel usando Table de Bootstrap.
 * Contenido: Componente ListaCategorias con tabla, botones Editar/Reactivar/Eliminar
 *            (CRUD del superadmin) o la vista de solo lectura para el admin.
 *            Incluye inactivas para los roles de gestión.
 * Dependencias: react-bootstrap (Table, Button, Container, Alert, Badge),
 *               api/categorias.js, react-router-dom, react-icons,
 *               components/comunes/Skeleton (SkeletonTabla).
 * Uso: <ListaCategorias /> (superadmin) o <ListaCategorias soloLectura /> (admin).
 */

import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import { Table, Button, Container, Alert, Badge } from 'react-bootstrap';
import { FaPlus, FaEdit, FaTrashAlt, FaUndoAlt } from 'react-icons/fa';
import { obtenerCategorias, obtenerCategoriaPorId, eliminarCategoria, editarCategoria } from '../../api/categorias';
import { fusionarPorId } from '../../utils/catalogoRealtime';
import ConfirmarModal from '../comunes/ConfirmarModal';
import { useAuth } from '../../hooks/useAuth';
import { conectarSocket, EVENTOS_SOCKET } from '../../services/socket';
import { SkeletonTabla } from '../comunes/Skeleton';

const ListaCategorias = ({ soloLectura = false }) => {
  const navigate = useNavigate();
  const { user, hydrated } = useAuth();
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

  useEffect(() => {
    if (!hydrated || !user) return undefined;
    const instancia = conectarSocket();
    // Resincroniza por REST al reconectar: si se perdió un cambio durante una
    // desconexión, el aviso no llegó. La carga inicial la hace el useEffect de
    // arriba, por eso no se pide aquí.
    const alConectar = () => cargarCategorias();
    // catalogo_actualizado trae {tipo, id, accion}. Sólo interesan las
    // categorías: se relee esa y se fusiona sin recargar la tabla. La baja es
    // lógica, así que la fila se queda marcada como inactiva.
    const alCat = async (payload) => {
      if (payload?.tipo !== 'categoria') return;
      const id = Number(payload.id);
      if (payload.accion === 'eliminado') {
        setCategorias((prev) =>
          prev.map((categoria) =>
            Number(categoria.id) === id ? { ...categoria, activa: false } : categoria
          )
        );
        return;
      }
      const result = await obtenerCategoriaPorId(id);
      if (result.success && result.data) {
        setCategorias((prev) => fusionarPorId(prev, result.data));
      }
    };
    instancia.on('connect', alConectar);
    instancia.on(EVENTOS_SOCKET.CATALOGO_ACTUALIZADO, alCat);
    return () => {
      instancia.off('connect', alConectar);
      instancia.off(EVENTOS_SOCKET.CATALOGO_ACTUALIZADO, alCat);
    };
  }, [hydrated, user]);

  const handleEditar = (id) => {
    navigate(`/superadmin/categoria/editar/${id}`);
  };

  const handleNuevo = () => {
    navigate('/superadmin/categoria/nuevo');
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
        <h1 className="h2 mb-0">Gestión de Categorías</h1>
        {!soloLectura && (
          <Button variant="primary" onClick={handleNuevo}>
            <FaPlus className="me-1" aria-hidden="true" />
            Agregar nueva categoría
          </Button>
        )}
      </div>

      {error && <Alert variant="danger" role="alert">{error}</Alert>}

      {cargando ? (
        <div role="status" aria-live="polite">
          <span className="visually-hidden">Cargando categorías…</span>
          <SkeletonTabla filas={4} columnas={3} />
        </div>
      ) : (
        <Table striped bordered hover responsive className="tabla-admin shadow-sm">
          <thead className="table-dark">
            <tr>
              <th>ID</th>
              <th>Nombre</th>
              <th>Descripción</th>
              <th>Estado</th>
              {!soloLectura && <th>Acciones</th>}
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
                {!soloLectura && (
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
                )}
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

ListaCategorias.propTypes = {
  soloLectura: PropTypes.bool,
};

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

import { useState } from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Table, Button, Container, Alert, Badge } from 'react-bootstrap';
import { FaPlus, FaEdit, FaTrashAlt, FaUndoAlt } from 'react-icons/fa';
import { eliminarCategoria, editarCategoria } from '../../api/categorias';
import { useCategorias } from '../../hooks/queries';
import { queryKeys } from '../../hooks/queries';
import ConfirmarModal from '../comunes/ConfirmarModal';
import { SkeletonTabla } from '../comunes/Skeleton';

const ListaCategorias = ({ soloLectura = false }) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  // Los roles de gestión ven también las inactivas (baja lógica). La clave
  // ['public','categorias','todas'] la invalida RealtimeBridge cuando hay un
  // cambio de catálogo.
  const {
    data: categorias = [],
    isPending: cargando,
    error: errorQuery,
  } = useCategorias({ incluirInactivas: true });
  const [errorLocal, setErrorLocal] = useState('');
  const error = errorLocal || errorQuery?.message || '';
  // Objetos { id, nombre } que esperan confirmación en el modal
  const [categoriaAEliminar, setCategoriaAEliminar] = useState(null);
  const [categoriaAReactivar, setCategoriaAReactivar] = useState(null);
  const [confirmando, setConfirmando] = useState(false);

  const confirmarEliminar = async () => {
    if (!categoriaAEliminar) return;
    setConfirmando(true);
    const result = await eliminarCategoria(categoriaAEliminar.id);
    if (result.success) {
      const categoriaId = categoriaAEliminar.id;
      setCategoriaAEliminar(null);
      // Actualizar caché directamente en lugar de invalidar
      // 1. Lista de todas (incluye inactivas)
      const claveTodas = queryKeys.public.categorias(true);
      const listaTodas = queryClient.getQueryData(claveTodas);
      if (Array.isArray(listaTodas)) {
        queryClient.setQueryData(claveTodas, listaTodas.filter((c) => c.id !== categoriaId));
      }
      // 2. Lista de activas
      const claveActivas = queryKeys.public.categorias(false);
      const listaActivas = queryClient.getQueryData(claveActivas);
      if (Array.isArray(listaActivas)) {
        queryClient.setQueryData(claveActivas, listaActivas.filter((c) => c.id !== categoriaId));
      }
    } else {
      setErrorLocal(result.error || 'No se pudo eliminar la categoría.');
    }
    setConfirmando(false);
  };

  const confirmarReactivar = async () => {
    if (!categoriaAReactivar) return;
    setConfirmando(true);
    const result = await editarCategoria(categoriaAReactivar.id, { activa: true });
    if (result.success) {
      const categoriaActualizada = result.data;
      setCategoriaAReactivar(null);
      // Actualizar caché directamente
      // 1. Lista de todas
      const claveTodas = queryKeys.public.categorias(true);
      const listaTodas = queryClient.getQueryData(claveTodas);
      if (Array.isArray(listaTodas)) {
        const idx = listaTodas.findIndex((c) => c.id === categoriaActualizada.id);
        if (idx >= 0) {
          const nuevaLista = [...listaTodas];
          nuevaLista[idx] = categoriaActualizada;
          queryClient.setQueryData(claveTodas, nuevaLista);
        }
      }
      // 2. Lista de activas - agregar la reactivada
      const claveActivas = queryKeys.public.categorias(false);
      const listaActivas = queryClient.getQueryData(claveActivas);
      if (Array.isArray(listaActivas)) {
        const nuevaLista = [...listaActivas, categoriaActualizada].sort((a, b) =>
          String(a.nombre).localeCompare(String(b.nombre), 'es')
        );
        queryClient.setQueryData(claveActivas, nuevaLista);
      }
    } else {
      setErrorLocal(result.error || 'No se pudo reactivar la categoría.');
    }
    setConfirmando(false);
  };

  const handleEditar = (id) => {
    navigate(`/superadmin/categoria/editar/${id}`);
  };

  const handleNuevo = () => {
    navigate('/superadmin/categoria/nuevo');
  };

  const handleEliminar = (id, nombre) => setCategoriaAEliminar({ id, nombre });

  const handleReactivar = (id, nombre) => setCategoriaAReactivar({ id, nombre });

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

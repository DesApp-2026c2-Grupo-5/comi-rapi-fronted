/**
 * Propósito: Página para editar o crear una categoría usando Container de Bootstrap.
 * Contenido: Componente EditarCategoria con carga de datos por ID vía TanStack
 *            Query y FormularioCategoria.
 * Dependencias: react-bootstrap (Container, Alert, Button), react-router-dom,
 *               FormularioCategoria, api/categorias.js, hooks/queries,
 *               components/comunes/Skeleton (SkeletonTarjeta).
 * Uso: Ruta "/superadmin/categoria/editar/:id" o "/superadmin/categoria/nuevo" → <EditarCategoria />
 */

import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Container, Alert, Button } from 'react-bootstrap';
import { FaArrowLeft } from 'react-icons/fa';
import FormularioCategoria from '../../components/admin/FormularioCategoria';
import { crearCategoria, editarCategoria } from '../../api/categorias';
import { useCategoria } from '../../hooks/queries';
import { SkeletonTarjeta } from '../../components/comunes/Skeleton';

const EditarCategoria = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  // `staleTime: Infinity` evita que un refetch al volver a la pestaña pise la
  // edición en curso. La clave se invalida cuando el backend avisa un cambio.
  const {
    data: categoria = null,
    isPending,
    error: errorQuery,
  } = useCategoria(id, { enabled: Boolean(id), staleTime: Infinity });
  const [errorLocal, setErrorLocal] = useState('');
  const error = errorLocal || errorQuery?.message || '';
  const cargando = Boolean(id) && isPending;

  const handleGuardar = async (datosCategoria) => {
    setErrorLocal('');
    const result = id
      ? await editarCategoria(id, datosCategoria)
      : await crearCategoria(datosCategoria);
    if (result.success) {
      navigate('/superadmin/categorias');
    } else {
      setErrorLocal(result.error || 'No se pudo guardar la categoría.');
    }
  };

  if (cargando) {
    return (
      <Container className="py-5" role="status" aria-live="polite">
        <span className="visually-hidden">Cargando categoría…</span>
        <SkeletonTarjeta />
      </Container>
    );
  }

  if (id && !categoria) {
    return (
      <Container className="py-5 text-center">
        <h1 className="h2">{error || 'Categoría no encontrada'}</h1>
        <Button as={Link} to="/superadmin/categorias" variant="secondary" className="mt-3">
          <FaArrowLeft className="me-1" aria-hidden="true" />
          Volver a categorías
        </Button>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <Link to="/superadmin/categorias" className="text-danger text-decoration-none mb-3 d-inline-block">
        ← Volver a categorías
      </Link>
      <h1 className="h2 mb-4">{id ? `Editar Categoría #${id}` : 'Nueva Categoría'}</h1>
      {/* role="alert": si el guardado falla, hay que anunciarlo. */}
      {error && <Alert variant="danger" role="alert">{error}</Alert>}
      <FormularioCategoria categoria={categoria} onGuardar={handleGuardar} />
    </Container>
  );
};

export default EditarCategoria;

/**
 * Propósito: Alta y edición de plantillas de personalización por categoría.
 * Contenido: carga la plantilla y la categoría, y reutiliza
 *            FormularioPersonalizacion en modo categoría.
 * Dependencias: usePersonalizacion, api/categorias, api/productos,
 *               FormularioPersonalizacion y SkeletonTarjeta.
 * Uso: /superadmin/personalizacion/categorias/nuevo?categoriaId=ID
 *      /superadmin/personalizacion/categorias/editar/:id?categoriaId=ID
 */

import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Container, Alert, Button } from 'react-bootstrap';
import { FaArrowLeft } from 'react-icons/fa';
import FormularioPersonalizacion from '../../components/admin/FormularioPersonalizacion';
import { usePersonalizacion } from '../../hooks/usePersonalizacion';
import { obtenerCategorias } from '../../api/categorias';
import { obtenerProductos } from '../../api/productos';
import { SkeletonTarjeta } from '../../components/comunes/Skeleton';

const EditarPlantillaCategoria = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const {
    plantillas,
    loading,
    agregarPlantilla,
    actualizarPlantilla,
  } = usePersonalizacion();

  const categoriaIdQuery = searchParams.get('categoriaId') || '';
  const tipoPreseleccionado = searchParams.get('tipo');

  const [categorias, setCategorias] = useState([]);
  const [productos, setProductos] = useState([]);
  const [cargandoCatalogos, setCargandoCatalogos] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let vigente = true;
    const cargarCatalogos = async () => {
      setCargandoCatalogos(true);
      const [resCategorias, resProductos] = await Promise.all([
        obtenerCategorias(),
        obtenerProductos(),
      ]);
      if (!vigente) return;
      if (resCategorias.success) setCategorias(resCategorias.data || []);
      else setError(resCategorias.error || 'No se pudieron cargar las categorías.');
      if (resProductos.success) setProductos(resProductos.data || []);
      else setError(resProductos.error || 'No se pudieron cargar los productos.');
      setCargandoCatalogos(false);
    };
    cargarCatalogos();
    return () => {
      vigente = false;
    };
  }, []);

  if (id && (loading || cargandoCatalogos)) {
    return (
      <Container className="py-5" role="status" aria-live="polite">
        <span className="visually-hidden">Cargando plantilla…</span>
        <SkeletonTarjeta />
      </Container>
    );
  }

  const plantilla = id
    ? plantillas.find((p) => String(p.id) === String(id))
    : null;

  if (id && !plantilla) {
    return (
      <Container className="py-5 text-center">
        <h1 className="h2">Plantilla no encontrada</h1>
        <Button
          as={Link}
          to="/superadmin/personalizacion/categorias"
          variant="secondary"
          className="mt-3"
        >
          <FaArrowLeft className="me-1" aria-hidden="true" /> Volver
        </Button>
      </Container>
    );
  }

  const categoriaId = plantilla?.categoriaId || categoriaIdQuery;
  const categoria = categorias.find(
    (c) => String(c.id) === String(categoriaId)
  );

  const volverTo = categoriaId
    ? `/superadmin/personalizacion/categorias?categoriaId=${categoriaId}`
    : '/superadmin/personalizacion/categorias';

  if (!categoriaId) {
    return (
      <Container className="py-5 text-center">
        <h1 className="h2">Elegí una categoría</h1>
        <p className="text-muted">
          Para crear una plantilla primero tenés que seleccionar la categoría.
        </p>
        <Button
          as={Link}
          to="/superadmin/personalizacion/categorias"
          variant="primary"
          className="mt-2"
        >
          Ir a personalización por categoría
        </Button>
      </Container>
    );
  }

  const elementoInicial = id
    ? plantilla
    : tipoPreseleccionado
      ? { tipo: tipoPreseleccionado, categoriaId: Number(categoriaId) }
      : { categoriaId: Number(categoriaId) };

  const handleGuardar = async (datos) => {
    if (id) {
      const res = await actualizarPlantilla(id, datos);
      if (res.success) navigate(volverTo);
      else setError(res.error || 'No se pudo actualizar.');
    } else {
      const res = await agregarPlantilla(datos);
      if (res.success) {
        navigate(
          `/superadmin/personalizacion/categorias?categoriaId=${
            datos.categoriaId || categoriaId
          }`
        );
      } else {
        setError(res.error || 'No se pudo crear.');
      }
    }
  };

  return (
    <Container className="py-4">
      <Link
        to={volverTo}
        className="text-danger text-decoration-none mb-3 d-inline-block"
      >
        ← Volver a personalización por categoría
      </Link>
      <h1 className="h2 mb-4">
        {id
          ? `Editar plantilla #${id}`
          : `Nueva plantilla${categoria ? ` — ${categoria.nombre}` : ''}`}
      </h1>
      {error && (
        <Alert variant="danger" role="alert">
          {error}
        </Alert>
      )}
      <FormularioPersonalizacion
        key={id || 'nueva-plantilla'}
        elemento={elementoInicial}
        productos={productos}
        categoriaId={categoriaId}
        categoriaNombre={categoria?.nombre}
        volverA={volverTo}
        onGuardar={handleGuardar}
      />
    </Container>
  );
};

export default EditarPlantillaCategoria;
